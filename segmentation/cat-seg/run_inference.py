"""Runs ON the Colab VM (via `colab exec -f`, after setup_catseg.py) --
segments streetscape images with CAT-Seg (ViT-L/14, cost-aggregation,
open-vocabulary).

Classes are exhaustive and mutually exclusive: one winning class per pixel
via argmax, matching CAT-Seg's own demo/predictor.py
(`predictions["sem_seg"].argmax(dim=0)`), not independent per-class
thresholds. This only works if CLASS_TERMS covers everything that can
appear in a NYC streetscape -- a pixel with no real match still gets
forced onto whichever listed class scores highest.

Standalone on purpose (no pipeline import): run as a subprocess from the
`segmentation` stage (see segmentation.py) since detectron2/CAT-Seg are
heavy. See README.md.

mask_path is a .npz with "label" (H, W uint8, one CLASS_KEYS index per
pixel) and "classes" (the CLASS_KEYS order it indexes).

CLASS_TERMS entries are lists because CAT-Seg's inference path
(cat_seg_predictor.py's get_text_embeds()) truncates a class string at the
first ", ". Multiple entries are synonym phrasings of the same thing
(e.g. stairway's "stairs"/"stoop"), max-pooled before that class competes
against every other class for a pixel.
"""

import argparse
import colorsys
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from PIL import Image
from tqdm import tqdm

# Terms must be comma-free (CAT-Seg truncates at the first ", ") and
# article-free (CAT-Seg's template already supplies "a"/"an") -- enforced
# by the two asserts below.
#
# Prefer an exact COCO-Stuff-171 string when one exists: CAT-Seg's
# attention layers were fine-tuned on that vocabulary (configs/vitl_336.yaml,
# CLIP_FINETUNE: "attention"), so a matching term gets that specialization.
# Otherwise fall back to plain zero-shot CLIP text for NYC-specific concepts
# COCO-Stuff has no equivalent for (subway entrances, sidewalk sheds,
# stoops). _COCO_STUFF_171 below is that list (verified against
# github.com/KU-CVLAB/CAT-Seg's datasets/coco.json, 2026-08-23); main()
# reports how many CLASS_TERMS entries land in each bucket.
#
# Exhaustive from a NYC pedestrian-streetscape point of view: every class of
# thing that can plausibly fill a pixel needs a competitor here, since
# argmax forces every pixel to some winner. Built from COCO-Stuff-171 minus
# what an outdoor street photo essentially never contains -- indoor
# furniture/rooms, kitchen/electronics/tableware, individual food items,
# farm/wild/zoo animals (bird/dog/cat kept), personal carry items/sports
# gear, and natural-landscape terrain (hill, mountain, river, sea, fog) --
# plus NYC-specific gap-fills COCO-Stuff has no concept for: scaffold,
# subway_entrance, fire_escape, storefront_sign, curb, crosswalk, bike_lane,
# trash_can, planter_box, awning (grounded in Lee, Choi & Hwang 2025,
# Developments in the Built Environment 22:100652).
_COCO_STUFF_171 = (
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat",
    "traffic light", "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat", "dog",
    "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "backpack", "umbrella",
    "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball", "kite",
    "baseball bat", "baseball glove", "skateboard", "surfboard", "tennis racket", "bottle",
    "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple", "sandwich", "orange",
    "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair", "couch", "potted plant",
    "bed", "dining table", "toilet", "tv", "laptop", "mouse", "remote", "keyboard", "cell phone",
    "microwave", "oven", "toaster", "sink", "refrigerator", "book", "clock", "vase", "scissors",
    "teddy bear", "hair drier", "toothbrush", "banner", "blanket", "branch", "bridge",
    "building-other", "bush", "cabinet", "cage", "cardboard", "carpet", "ceiling-other",
    "ceiling-tile", "cloth", "clothes", "clouds", "counter", "cupboard", "curtain", "desk-stuff",
    "dirt", "door-stuff", "fence", "floor-marble", "floor-other", "floor-stone", "floor-tile",
    "floor-wood", "flower", "fog", "food-other", "fruit", "furniture-other", "grass", "gravel",
    "ground-other", "hill", "house", "leaves", "light", "mat", "metal", "mirror-stuff", "moss",
    "mountain", "mud", "napkin", "net", "paper", "pavement", "pillow", "plant-other", "plastic",
    "platform", "playingfield", "railing", "railroad", "river", "road", "rock", "roof", "rug",
    "salad", "sand", "sea", "shelf", "sky-other", "skyscraper", "snow", "solid-other", "stairs",
    "stone", "straw", "structural-other", "table", "tent", "textile-other", "towel", "tree",
    "vegetable", "wall-brick", "wall-concrete", "wall-other", "wall-panel", "wall-stone",
    "wall-tile", "wall-wood", "water-other", "waterdrops", "window-blind", "window-other", "wood",
)

CLASS_TERMS: dict[str, list[str]] = {
    # -- sky --
    "sky_other": ["sky-other"],
    "clouds": ["clouds"],
    # -- building / facade --
    "bldg_other": ["building-other"],
    "skyscraper": ["skyscraper"],
    "house": ["house"],
    "roof": ["roof"],
    "wall_brick": ["wall-brick"],
    "wall_concrete": ["wall-concrete"],
    "wall_stone": ["wall-stone"],
    "wall_tile": ["wall-tile"],
    "wall_wood": ["wall-wood"],
    "wall_panel": ["wall-panel"],
    "wall_other": ["wall-other"],
    "window_other": ["window-other"],
    "window_blind": ["window-blind"],
    "door": ["door-stuff"],
    "banner": ["banner"],
    "awning": ["awning"],
    "storefront_sign": ["storefront sign"],
    "fire_escape": ["fire escape"],
    # "sidewalk shed canopy" added: earlier terms caught the support poles
    # but lost the flat tarped roof panel to bldg_other (see
    # n00030_avenue_120_149_761d4803).
    "scaffold": ["construction scaffolding", "sidewalk shed", "construction hoarding fence", "sidewalk shed canopy"],
    "stairway": ["stairs", "stoop"],
    "subway_entrance": ["subway entrance"],
    # -- ground plane --
    "road": ["road"],
    "sidewalk": ["pavement"],
    "curb": ["curb"],
    "crosswalk": ["crosswalk"],
    "bike_lane": ["bike lane", "bike share station"],
    "gravel": ["gravel"],
    "dirt": ["dirt"],
    "sand": ["sand"],
    "snow": ["snow"],
    "mud": ["mud"],
    "platform": ["platform"],
    # -- vegetation --
    "tree": ["tree"],
    "bush": ["bush"],
    "grass": ["grass"],
    "flower": ["flower"],
    "leaves": ["leaves"],
    "branch": ["branch"],
    "plant_other": ["plant-other"],
    "potted_plant": ["potted plant"],
    "moss": ["moss"],
    "planter_box": ["planter box", "flower box"],
    # -- street furniture / infrastructure --
    "traffic_light": ["traffic light"],
    "street_light": ["light"],
    "fire_hydrant": ["fire hydrant"],
    "stop_sign": ["stop sign"],
    "parking_meter": ["parking meter"],
    "bench": ["bench"],
    "chair": ["chair"],
    "fence": ["fence"],
    "railing": ["railing"],
    "trash_can": ["trash can"],
    "umbrella": ["umbrella"],
    "bridge": ["bridge"],
    # -- vehicles --
    "car": ["car"],
    "truck": ["truck"],
    "bus": ["bus"],
    "bicycle": ["bicycle"],
    "motorcycle": ["motorcycle"],
    "train": ["train"],
    # -- people / animals --
    "person": ["person"],
    "bird": ["bird"],
    "dog": ["dog"],
}
CLASS_KEYS = list(CLASS_TERMS)
VOCAB_TERMS = [t for k in CLASS_KEYS for t in CLASS_TERMS[k]]
# Both rules from the comment above CLASS_TERMS, enforced at import time
# (not just documented) so either mistake fails loudly immediately instead
# of quietly degrading segmentation quality on the next run.
assert not any(", " in t for t in VOCAB_TERMS), "a CLASS_TERMS entry has a comma -- CAT-Seg truncates at the first ', '"
assert not any(t.startswith(("a ", "an ")) for t in VOCAB_TERMS), \
    "a CLASS_TERMS entry has a leading article -- CAT-Seg's template already supplies one"

# Aggregates for GVI/VEI (metrics.py), which want one veg/sky/bldg number
# each. planter_box excluded from VEG_KEYS (container, not plant matter).
# scaffold excluded from BLDG_KEYS -- reported separately (see metrics.py).
VEG_KEYS = ("tree", "bush", "grass", "flower", "leaves", "branch", "plant_other", "potted_plant", "moss")
SKY_KEYS = ("sky_other", "clouds")
BLDG_KEYS = ("bldg_other", "skyscraper", "house", "roof", "wall_brick", "wall_concrete", "wall_stone",
             "wall_tile", "wall_wood", "wall_panel", "wall_other", "window_other", "window_blind",
             "door", "banner")
VEG_IDX = [CLASS_KEYS.index(k) for k in VEG_KEYS]
SKY_IDX = [CLASS_KEYS.index(k) for k in SKY_KEYS]
BLDG_IDX = [CLASS_KEYS.index(k) for k in BLDG_KEYS]


# One distinct color per class for the QA overlay, spread evenly around the
# hue wheel so N classes never have to share a hand-picked palette that
# runs out.
def _distinct_colors(n: int, hues_per_lap: int = 8) -> list[tuple[int, int, int]]:
    # Cap each "lap" at hues_per_lap widely-spaced hues, cycling
    # saturation/value per lap so later classes stay distinguishable.
    # SHADES must be a flat list, not two independent mod cycles -- a
    # sat-period-2/val-period-3 pair repeats every lcm(2,3)=6 laps, fewer
    # than the ~9 laps 65 CLASS_KEYS needs, so classes 48 apart got
    # identical RGB (confirmed on a real overlay PNG). 12 flat shades give
    # a repeat period of 12 * hues_per_lap = 96, well past current usage.
    SHADES = [(sat, val) for val in (0.95, 0.8, 0.65, 0.5) for sat in (0.5, 0.7, 0.9)]
    colors = []
    for i in range(n):
        lap = i // hues_per_lap
        hue = (i % hues_per_lap) / hues_per_lap
        sat, val = SHADES[lap % len(SHADES)]
        colors.append(tuple(round(c * 255) for c in colorsys.hsv_to_rgb(hue, sat, val)))
    return colors


CLASS_COLOR = dict(zip(CLASS_KEYS, _distinct_colors(len(CLASS_KEYS))))
COLOR_LUT = np.array([CLASS_COLOR[k] for k in CLASS_KEYS], dtype=np.uint8)  # (len(CLASS_KEYS), 3)
OVERLAY_ALPHA = 0.55

MANIFEST_COLS = ["node_id", "pano_id", "pano_tag", "typology", "offset", "heading"]
BASE_COLS = (["path", "mask_path", "px_total", "px_veg", "px_veg_eye", "px_veg_canopy", "px_sky", "px_bldg"]
             + [f"px_{k}" for k in CLASS_KEYS] + MANIFEST_COLS)


def _load_manifest(manifest_csv: str) -> dict[str, dict]:
    """filename -> {node_id, pano_id, pano_tag, typology, offset, heading}.
    Keyed by basename, not full path -- see module docstring."""
    manifest = pd.read_csv(manifest_csv)
    return {Path(row.path).name: {c: getattr(row, c) for c in MANIFEST_COLS}
            for row in manifest.itertuples()}


def _overlay_color(label: np.ndarray) -> np.ndarray:
    """label: (H, W) uint8 CLASS_KEYS index -> solid per-pixel RGB via lookup table."""
    return COLOR_LUT[label]


def load_predictor(repo_dir: str, config_file: str, checkpoint: str, vocab_path: str, num_classes: int):
    sys.path.insert(0, repo_dir)
    from cat_seg import add_cat_seg_config
    from detectron2.config import get_cfg
    from detectron2.engine.defaults import DefaultPredictor
    from detectron2.projects.deeplab import add_deeplab_config

    cfg = get_cfg()
    add_deeplab_config(cfg)
    add_cat_seg_config(cfg)
    cfg.merge_from_file(config_file)
    cfg.merge_from_list([
        "MODEL.WEIGHTS", checkpoint,
        # CATSegPredictor.__init__ opens both jsons unconditionally, even though
        # TRAIN_CLASS_JSON is only read on a training path DefaultPredictor never hits.
        "MODEL.SEM_SEG_HEAD.TRAIN_CLASS_JSON", vocab_path,
        "MODEL.SEM_SEG_HEAD.TEST_CLASS_JSON", vocab_path,
        "MODEL.SEM_SEG_HEAD.NUM_CLASSES", str(num_classes),
        "MODEL.DEVICE", "cuda" if torch.cuda.is_available() else "cpu",
        # Off by default. Without it, CLIP sees the whole image downsampled to
        # 336x336, losing small objects (e.g. fire hydrants). Sliding-window tiles
        # into ~4 overlapping 384x384 crops + 1 global pass instead -- better
        # effective resolution, ~5x the forward passes.
        "TEST.SLIDING_WINDOW", "True",
    ])
    cfg.freeze()
    return DefaultPredictor(cfg)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo-dir", default="/content/CAT-Seg")
    ap.add_argument("--config-file", default=None, help="default: <repo-dir>/configs/vitl_336.yaml")
    ap.add_argument("--checkpoint", required=True)
    ap.add_argument("--vocab", required=True, help="path to vocabulary.json")
    ap.add_argument("--images-dir", required=True)
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--force", action="store_true", help="ignore an existing pixel_counts.csv checkpoint")
    ap.add_argument("--manifest", required=True,
                     help="raw_manifest.csv (uploaded to the VM) -- adds node_id/typology/... "
                          "so the output is directly usable by `cli.py --stage metrics`, no "
                          "separate local merge step. Required: checked below before any "
                          "GPU work starts, not silently skipped if missing.")
    args = ap.parse_args()

    if not Path(args.manifest).exists():
        sys.exit(f"ERROR: no manifest at {args.manifest} -- upload/place raw_manifest.csv "
                  "next to the images before running this script (see README.md).")

    n_matched = sum(1 for t in VOCAB_TERMS if t in _COCO_STUFF_171)
    print(f"{n_matched}/{len(VOCAB_TERMS)} prompt terms are exact COCO-Stuff-171 matches "
          "(get CAT-Seg's fine-tuned specialization); the rest are zero-shot CLIP")

    manifest_lookup = _load_manifest(args.manifest)

    config_file = args.config_file or str(Path(args.repo_dir) / "configs" / "vitl_336.yaml")
    class_texts = json.loads(Path(args.vocab).read_text())
    assert class_texts == VOCAB_TERMS, \
        "vocabulary.json doesn't match CLASS_TERMS flattened -- regenerate it from CLASS_TERMS in this file"

    predictor = load_predictor(args.repo_dir, config_file, args.checkpoint, args.vocab, len(VOCAB_TERMS))
    from detectron2.data.detection_utils import read_image

    out_dir = Path(args.out_dir)
    mask_dir = out_dir / "masks"
    overlay_dir = out_dir / "overlays"
    mask_dir.mkdir(parents=True, exist_ok=True)
    overlay_dir.mkdir(parents=True, exist_ok=True)
    ckpt = out_dir / "pixel_counts.csv"

    paths = sorted(str(p) for p in Path(args.images_dir).glob("*.jpg"))
    assert paths, f"no .jpg images found in {args.images_dir} -- check the path (and that it's not one level up from where the files actually are)"

    records = []
    unmatched_manifest = []
    if ckpt.exists() and not args.force:
        # Empty/truncated checkpoint (killed mid-write, Drive FUSE race) isn't
        # real progress -- treat as "nothing done yet" rather than crash.
        try:
            prev = pd.read_csv(ckpt)
            # reindex, not prev[BASE_COLS]: a checkpoint predating a BASE_COLS
            # change is missing columns -- backfill empty instead of KeyError.
            records = prev.reindex(columns=BASE_COLS).to_dict("records")
            done = set(prev.path)
            paths = [p for p in paths if p not in done]
            print(f"resuming: {len(done)} already done, {len(paths)} remaining")
        except pd.errors.EmptyDataError:
            print(f"{ckpt} exists but has no parseable data -- treating as no prior progress")

    # VOCAB_TERMS index range per class, for max-pooling synonym scores below.
    offsets = np.cumsum([0] + [len(CLASS_TERMS[k]) for k in CLASS_KEYS])
    idx_range = {k: slice(offsets[i], offsets[i + 1]) for i, k in enumerate(CLASS_KEYS)}

    for i, p in enumerate(tqdm(paths, desc="cat-seg", mininterval=2.0)):
        im_bgr = read_image(p, format="BGR")
        with torch.no_grad():
            prob = predictor(im_bgr)["sem_seg"].cpu().numpy()  # (C, H, W), independent sigmoid scores

        # One score per class (max over its synonym terms), then argmax across
        # classes for one winning class per pixel.
        class_scores = np.stack([prob[idx_range[k]].max(axis=0) for k in CLASS_KEYS])
        label = class_scores.argmax(axis=0).astype(np.uint8)
        counts = np.bincount(label.ravel(), minlength=len(CLASS_KEYS))
        veg_mask = np.isin(label, VEG_IDX)
        sky_mask = np.isin(label, SKY_IDX)
        bldg_mask = np.isin(label, BLDG_IDX)
        horizon = label.shape[0] // 2

        mask_fp = mask_dir / f"{Path(p).stem}.npz"
        np.savez_compressed(mask_fp, label=label, classes=np.array(CLASS_KEYS))

        im_rgb = Image.open(p).convert("RGB")
        overlay = Image.fromarray(_overlay_color(label)).resize(im_rgb.size, Image.NEAREST)
        Image.blend(im_rgb, overlay, OVERLAY_ALPHA).save(overlay_dir / f"{Path(p).stem}.png")

        row = {
            "path": p, "mask_path": str(mask_fp),
            "px_total": label.size,
            "px_veg": int(veg_mask.sum()),
            "px_veg_eye": int(veg_mask[horizon:].sum()),
            "px_veg_canopy": int(veg_mask[:horizon].sum()),
            "px_sky": int(sky_mask.sum()),
            "px_bldg": int(bldg_mask.sum()),
        }
        for k, c in zip(CLASS_KEYS, counts):
            row[f"px_{k}"] = int(c)
        # Never drop a row for a manifest miss -- that would throw away
        # GPU work already done. Just leave the manifest columns empty for it.
        meta = manifest_lookup.get(Path(p).name, {})
        for c in MANIFEST_COLS:
            row[c] = meta.get(c)
        if manifest_lookup and not meta:
            unmatched_manifest.append(Path(p).name)
        records.append(row)

        # Flush every ~200 images -- cheap insurance against a session drop.
        if i % 200 == 0 and records:
            pd.DataFrame(records).to_csv(ckpt, index=False)

    pd.DataFrame(records).to_csv(ckpt, index=False)
    # `colab download` is unreliable under Drive's FUSE mount -- write a plain
    # copy on the VM's own disk; run_on_colab.sh downloads from here, not ckpt.
    local_copy = Path("/content/pixel_counts.csv")
    pd.DataFrame(records).to_csv(local_copy, index=False)
    print(f"segmented {len(records)} images -> {ckpt} (+ {local_copy} for colab download)")
    if unmatched_manifest:
        preview = unmatched_manifest[:5]
        print(f"warning: {len(unmatched_manifest)} image(s) had no matching filename in "
              f"{args.manifest} -- node_id/etc. left empty for those, e.g. "
              f"{preview}{'...' if len(unmatched_manifest) > 5 else ''}")


if __name__ == "__main__":
    main()
