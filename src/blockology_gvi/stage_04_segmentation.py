"""Stage 4 -- semantic segmentation into azimuthal class profiles.

Each node's four frames are segmented and accumulated into a
(len(CLASS_GROUPS) + 2) x 360 array: one row per class group, one for
eye-level vegetation split out at the horizon, and a final row of total
column weight. Bins are absolute compass bearings, so a metric over any
angular window is a slice of the same array -- the 180-degree forward view,
the cross-street view, the full circle -- without re-segmenting.

Three details that are easy to get wrong and expensive to discover late:

1. The degree-to-column mapping is gnomonic, not linear. A fov=90 frame is a
   perspective projection, so the column at normalised x sits at
   atan(x * tan(fov/2)) from centre. At 29 degrees off centre the correct
   column is 497 of 640, not 526 -- a linear reading misplaces every class
   boundary by about 29 px.

2. Column weight is solid angle, not pixel count. A plane projection
   compresses solid angle toward the frame edges, so weighting columns
   equally over-counts whatever sits at the periphery.

3. Dividing by the weight row is what makes a share a share. Without it the
   result scales with how many frames happen to cover a bin rather than
   being a fraction of the visual field.

Vegetation is split at the horizon here rather than later. The azimuthal
profile collapses the vertical axis, so once a column is averaged the
eye-level and canopy contributions cannot be separated -- the split has to
happen before the collapse or not at all. At pitch=0 the horizon is the
centre row. Both halves divide by the full column height, so eye_green plus
canopy_green equals the vegetation share.

Class groups are matched by LABEL NAME, never by index: ADE20K's ordering
varies between checkpoints, and an index that silently points at the wrong
class produces a plausible number rather than an error.
"""

from pathlib import Path

import numpy as np
import pandas as pd
from PIL import Image
from tqdm.auto import tqdm

MODEL = "facebook/mask2former-swin-large-ade-semantic"
N_BINS = 360
FOV = 90.0

# Each group is one term of the streetscape description. Names are matched
# exactly against the checkpoint's labels, which are bare ("pot", not
# "pot, flowerpot"); a synonym string would hit the wrong class on another
# checkpoint, and "pot" and "stool" both collide with ADE20K's toilet class.
#
# What ADE20K does not have, checked against the model: arcade, bollard,
# hedge, shrub, planter, pergola, porch, balcony, gate, grille. Terms that
# depend on those are proxied or absent, and the notes say which.
CLASS_GROUPS = {
    # Split at the horizon at accumulation time; see the module docstring.
    "eye_green": ["tree", "grass", "plant", "flower", "palm"],
    # ADE20K's "wall" is the building face, so including it here would
    # swallow every facade. Low garden walls are consequently missed.
    "hard_barrier": ["fence", "railing", "bannister"],
    # Planters and low hedges have no class. "pot" is the flowerpot class
    # and the only available proxy, so this term is badly undercounted.
    "soft_buffer": ["pot"],
    # Arcades and porticos are absent; awning and canopy are the closest.
    # "column" stands in for the arcade support and is a judgement call.
    "shelter": ["awning", "canopy", "column"],
    # Stoops are stairs at the building line and ADE20K cannot tell a stoop
    # from any other step, so this group holds both.
    "rest": ["bench", "chair", "seat", "armchair", "stool",
             "stairs", "step", "stairway"],
    # No architectural-detail class exists; facade openings stand in, and
    # they double as a ground-floor permeability proxy.
    "articulation": ["signboard", "windowpane", "door"],
    "building": ["building", "house", "skyscraper", "hovel", "tower", "wall"],
    "sky": ["sky"],
    "sidewalk": ["sidewalk", "pavement"],
    "road": ["road", "route"],
    "vehicle": ["car", "truck", "van", "bus", "bicycle", "minibike", "motorbike"],
    "person": ["person"],
}
SPLIT_GROUP = "eye_green"        # the one group divided at the horizon
_COLUMN_WEIGHTS: dict[int, np.ndarray] = {}


# --------------------------------------------------------- image geometry

def column_bearings(heading: float, width: int, fov: float = FOV) -> np.ndarray:
    """Absolute compass bearing of every pixel column in a gnomonic frame."""
    x = (np.arange(width) + 0.5) / width * 2 - 1
    return (heading + np.degrees(np.arctan(x * np.tan(np.radians(fov / 2))))) % 360


def column_weights(height: int, width: int, fov: float = FOV) -> np.ndarray:
    """Solid angle per column, normalised to sum to 1.

    A plane projection spreads equal angles over unequal pixel counts, so a
    column at the frame edge subtends less sky than one at the centre.
    """
    x = (np.arange(width) + 0.5) / width * 2 - 1
    t = np.tan(np.radians(fov / 2))
    w = 1.0 / (1.0 + (x * t) ** 2)          # d(theta)/dx for atan(x*tan)
    return w / w.sum()


# ------------------------------------------------------------- segmenter

def load_segmenter(device: str):
    """Load Mask2Former and resolve the class groups against its labels."""
    from transformers import AutoImageProcessor, Mask2FormerForUniversalSegmentation

    proc = AutoImageProcessor.from_pretrained(MODEL)
    model = Mask2FormerForUniversalSegmentation.from_pretrained(MODEL).to(device).eval()

    labels = {i: [p.strip().lower() for p in lab.split(",")]
              for i, lab in model.config.id2label.items()}
    class_ids, unresolved = {}, {}
    for group, names in CLASS_GROUPS.items():
        class_ids[group] = [i for i, labs in labels.items()
                            if any(n in labs for n in names)]
        missing = [n for n in names if not any(n in labs for labs in labels.values())]
        if missing:
            unresolved[group] = missing

    print(f"resolved {len(class_ids)} class groups against {len(labels)} labels")
    for group, ids in class_ids.items():
        note = f"   unresolved: {unresolved[group]}" if group in unresolved else ""
        print(f"  {group:<14} {len(ids):>2} classes{note}")

    empty = [g for g, ids in class_ids.items() if not ids]
    if empty:
        raise AssertionError(
            f"no class resolved for {empty}. A group that matches nothing "
            "would be a term that is silently always zero, which is worse "
            "than a missing column."
        )
    return proc, model, class_ids


def release_segmenter(model) -> None:
    """Free the VRAM the model holds; later stages need the card."""
    import gc

    import torch

    model.to("cpu")
    del model
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()


# ------------------------------------------------------------- profiling

def _profile_node(frames: pd.DataFrame, proc, model, class_ids,
                  device: str) -> np.ndarray | None:
    """One node's frames into a (groups + 2) x N_BINS accumulator.

    Returns None if any frame will not open. A node built from three of its
    four headings carries a quarter of the horizon at zero weight, which
    reads downstream as sampled-and-empty rather than as a gap.
    """
    import torch

    names = list(class_ids) + ["canopy_green"]
    acc = np.zeros((len(names) + 1, N_BINS))
    row_of = {g: k for k, g in enumerate(names)}

    for frame in frames.itertuples():
        try:
            img = Image.open(frame.path).convert("RGB")
        except Exception:
            return None
        inputs = proc(images=[img], return_tensors="pt").to(device)
        with torch.inference_mode():
            out = model(**inputs)
        # Apple MPS returns non-contiguous tensors where CUDA returns
        # contiguous ones, and post-processing calls .view() internally.
        out.class_queries_logits = out.class_queries_logits.cpu().contiguous()
        out.masks_queries_logits = out.masks_queries_logits.cpu().contiguous()
        seg = proc.post_process_semantic_segmentation(
            out, target_sizes=[img.size[::-1]])[0].numpy()

        height, width = seg.shape
        if width not in _COLUMN_WEIGHTS:
            _COLUMN_WEIGHTS[width] = column_weights(height, width)
        weights = _COLUMN_WEIGHTS[width]
        bins = np.floor(column_bearings(float(frame.heading), width)).astype(int) % N_BINS
        horizon = height // 2

        for group, ids in class_ids.items():
            hit = np.isin(seg, ids)
            if group == SPLIT_GROUP:
                np.add.at(acc[row_of[group]], bins,
                          hit[horizon:].sum(axis=0) / height * weights)
                np.add.at(acc[row_of["canopy_green"]], bins,
                          hit[:horizon].sum(axis=0) / height * weights)
            else:
                np.add.at(acc[row_of[group]], bins, hit.mean(axis=0) * weights)
        np.add.at(acc[-1], bins, weights)
    return acc


def run_segmentation(manifest: pd.DataFrame, proc, model, class_ids,
                     device: str, batch: int, out_dir: Path) -> pd.DataFrame:
    """Segment every node in the manifest into an azimuthal profile.

    Writes profiles.npz (the arrays, with their row names alongside so
    nothing downstream indexes rows by position) and shares.csv (each
    group's share of the full circle, for a quick look without opening the
    arrays). Returns the shares table.
    """
    rows = list(class_ids) + ["canopy_green", "weight"]
    profiles, records, skipped = {}, [], []

    for node_id, frames in tqdm(list(manifest.groupby("node_id")),
                                desc="segmentation", mininterval=2.0):
        acc = _profile_node(frames, proc, model, class_ids, device)
        if acc is None:
            skipped.append(node_id)
            continue
        total = acc[-1].sum()
        if total <= 0:
            skipped.append(node_id)
            continue
        profiles[node_id] = acc
        records.append({"node_id": node_id,
                        **{g: acc[k].sum() / total for k, g in enumerate(rows[:-1])}})

    if skipped:
        print(f"\nskipped {len(skipped)} node(s) whose frames would not open "
              f"or segmented to nothing: {', '.join(skipped[:10])}"
              f"{' ...' if len(skipped) > 10 else ''}")

    profile_path = out_dir / "profiles.npz"
    np.savez_compressed(profile_path, __rows__=np.array(rows), **profiles)

    shares = pd.DataFrame(records)
    shares_path = out_dir / "shares.csv"
    shares.to_csv(shares_path, index=False)

    print(f"\n{len(profiles)} nodes profiled, {len(rows)} x {N_BINS} each")
    print(f"  {profile_path}")
    print(f"  {shares_path}")
    if not shares.empty:
        mean = shares.drop(columns="node_id").mean().sort_values(ascending=False)
        print("\nmean share of the full circle:")
        for group, value in mean.items():
            print(f"  {group:<14} {100 * value:6.2f}%")
    return shares
