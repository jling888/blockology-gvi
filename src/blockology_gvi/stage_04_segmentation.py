"""Stage 4 -- vision-language segmentation (text-prompted). The only
segmentation stage: every class below comes from CLIPSeg, prompted by text,
not a closed-vocabulary classifier.

A closed-vocabulary model (e.g. ADE20K) gets vegetation/sky/building for
free from one classification pass, but has no class at all for a lot of
what a streetscape study cares about -- planters, ivy, awnings, stoops,
storefront signage -- and standing in a proxy class ("pot" for planter,
"wall" that also swallows every building facade) is worse than not having
the term. CLIPSeg trades that for the opposite shape: one forward pass per
prompt, but the prompt says exactly what to look for, so the classes below
match the streetscape description this study actually wants, not whatever
a pretrained checkpoint happened to memorize.

Four classes -- veg, sky, bldg, scaffold -- get a saved mask + overlay for
visual QA, the same as when a closed-vocabulary model produced them; they're
also GVI/VEI's direct inputs (stage_05_metrics.py). The rest are
counts-only: no per-pixel mask file, just a px_<class> column, since nothing
downstream needs to see them pixel-for-pixel, only sum them.

Vegetation is split at the horizon (image row height//2, valid at pitch=0 --
see stage_03_imagery.py) into px_veg_eye and px_veg_canopy, since a canopy
overhead and a hedge at eye level read very differently as a streetscape
even though both count toward the same GVI numerator.

Detections are independent per class, not mutually exclusive: a pixel can
be both "scaffold" and "building" (a sidewalk shed against a facade), or
both "veg" and "soft_buffer" (a planted hedge). Each class is its own
sigmoid-thresholded detector, unioned across a class's own prompt variants,
never compared against another class's score.
"""

import gc
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from PIL import Image
from tqdm.auto import tqdm
from transformers import CLIPSegForImageSegmentation, CLIPSegProcessor

CS_MODEL = "CIDAS/clipseg-rd64-refined"
CLIPSEG_THRESH = 0.4  # tune against ~30 hand-labelled images and REPORT it

# Multiple prompts per class, max-pooled, where one phrasing alone misses
# real variation (a planter box and a windowsill pot don't look alike).
# Single prompt where the class is visually unambiguous.
VEG_PROMPTS = [
    "trees, bushes, or a grassy lawn",
    "ivy or vines growing on a wall",
    "potted plants or a green planter box",
]
SKY_PROMPTS = ["open sky"]
BLDG_PROMPTS = ["a building facade or wall"]
# Sidewalk sheds/hoarding read as "building" to a closed-vocabulary model,
# inflating VEI -- kept as its own class (not unioned into bldg) so that
# inflation is a measured, reportable covariate. See typology_contrast()'s
# scaffolding-sensitivity check in stage_05_metrics.py.
SCAFFOLD_PROMPTS = [
    "construction scaffolding over the sidewalk",
    "a sidewalk shed with metal poles",
    "a green construction hoarding fence",
]

# Counts-only classes: the rest of a streetscape description a closed-vocab
# model has no clean class for. One prompt each -- these are visually
# distinct enough not to need multiple phrasings.
DESCRIPTIVE_PROMPTS = {
    "hard_barrier": "a fence, railing, or banister",
    "soft_buffer": "a planter box, flower box, or low hedge",
    "shelter": "an awning, canopy overhang, or covered arcade",
    "rest": "a bench, chair, or stoop stairway",
    "articulation": "a storefront sign, display window, or doorway",
    "sidewalk": "a sidewalk or pedestrian pavement",
    "road": "a paved road or street for vehicles",
    "vehicle": "a car, truck, van, bus, bicycle, or motorcycle",
    "person": "a person or pedestrian",
}

# QA mask/overlay bits -- independent, not a priority order. veg/sky/bldg
# are GVI/VEI's direct inputs; scaffold is the VEI confound worth seeing.
BIT = {"veg": 0, "sky": 1, "bldg": 2, "scaffold": 3}
BASE_COLOR = {
    BIT["veg"]: (107, 191, 79),
    BIT["sky"]: (89, 168, 235),
    BIT["bldg"]: (158, 89, 184),
    BIT["scaffold"]: (230, 126, 34),
}
OVERLAY_ALPHA = 0.55

# This stage's own columns, before run_segmentation's closing merge adds
# manifest columns (node_id, typology, heading, ...) -- selected explicitly
# on resume so reloading a checkpoint that already carries those columns
# doesn't collide with the merge and produce node_id_x/node_id_y.
BASE_COLS = (["path", "mask_path", "px_total", "px_veg", "px_veg_eye", "px_veg_canopy",
              "px_sky", "px_bldg", "px_scaffold"] + [f"px_{n}" for n in DESCRIPTIVE_PROMPTS])


def load_segmenter(device: str):
    """Load CLIPSeg. No class-id resolution needed -- prompts are plain
    text, not matched against a checkpoint's fixed label set.
    """
    cs_proc = CLIPSegProcessor.from_pretrained(CS_MODEL)
    cs_model = CLIPSegForImageSegmentation.from_pretrained(CS_MODEL).to(device).eval()
    return cs_proc, cs_model


def release_segmenter(cs_model, device: str) -> None:
    del cs_model
    gc.collect()
    if device == "cuda":
        torch.cuda.empty_cache()
    elif device == "mps":
        torch.mps.empty_cache()


def _overlay_color(packed: np.ndarray) -> np.ndarray:
    """RGB per pixel: the mean of every active QA class's color, neutral
    grey where none fired -- a doubly-flagged pixel (scaffold in front of a
    building) shows as a visible blend instead of one class silently
    winning the pixel.
    """
    rgb = np.zeros((*packed.shape, 3), dtype=np.float32)
    hits = np.zeros(packed.shape, dtype=np.float32)
    for bit, color in BASE_COLOR.items():
        hit = ((packed >> bit) & 1).astype(bool)
        rgb[hit] += color
        hits[hit] += 1
    empty = hits == 0
    hits[empty] = 1
    rgb /= hits[..., None]
    rgb[empty] = (89, 89, 97)
    return rgb.astype(np.uint8)


def _save_mask(packed: np.ndarray, fp: Path) -> None:
    """Bit-packed veg/sky/bldg/scaffold detections -- see BIT above for
    which bit is which. Independent bits, losslessly saved.
    """
    Image.fromarray(packed).save(fp)


def _save_overlay(img: Image.Image, packed: np.ndarray, fp: Path) -> None:
    """Original image blended with the color-coded QA detections. CLIPSeg's
    native output grid is smaller than the source image, so the overlay is
    nearest-neighbor resized up -- nearest, not bilinear, since blending
    adjacent categorical colors would invent colors CLIPSeg never predicted.
    """
    overlay = Image.fromarray(_overlay_color(packed)).resize(img.size, Image.NEAREST)
    Image.blend(img, overlay, OVERLAY_ALPHA).save(fp)


def run_segmentation(manifest: pd.DataFrame, cs_proc, cs_model, device: str,
                      out: Path, thresh: float = CLIPSEG_THRESH, force: bool = False) -> pd.DataFrame:
    """Run every class's prompts against every image in one batched CLIPSeg
    call, save veg/sky/bldg/scaffold as a mask + overlay for QA, and record
    a px_<class> pixel count for every class -- the QA four plus every
    DESCRIPTIVE_PROMPTS class.

    Resumable like every other stage: a path already in pixel_counts.csv is
    trusted and skipped. `force=True` ignores it and re-segments every image
    from scratch -- e.g. after a prompt or threshold change.
    """
    ckpt = out / "pixel_counts.csv"
    mask_dir = out / "masks"
    overlay_dir = out / "overlays"
    mask_dir.mkdir(exist_ok=True)
    overlay_dir.mkdir(exist_ok=True)

    paths = manifest.path.tolist()
    records = []
    if ckpt.exists() and not force:
        prev = pd.read_csv(ckpt)
        records = prev[BASE_COLS].to_dict("records")
        done = set(prev.path)
        paths = [p for p in paths if p not in done]
        print(f"resuming: {len(done)} already done, {len(paths)} remaining")

    descriptive_names = list(DESCRIPTIVE_PROMPTS)
    all_prompts = (VEG_PROMPTS + SKY_PROMPTS + BLDG_PROMPTS + SCAFFOLD_PROMPTS
                   + [DESCRIPTIVE_PROMPTS[n] for n in descriptive_names])
    i_veg = slice(0, len(VEG_PROMPTS))
    i_sky = slice(i_veg.stop, i_veg.stop + len(SKY_PROMPTS))
    i_bldg = slice(i_sky.stop, i_sky.stop + len(BLDG_PROMPTS))
    i_scaf = slice(i_bldg.stop, i_bldg.stop + len(SCAFFOLD_PROMPTS))
    descriptive_start = i_scaf.stop

    for i, p in enumerate(tqdm(paths, desc="vision-language", mininterval=2.0)):
        im = Image.open(p).convert("RGB")
        inp = cs_proc(text=all_prompts, images=[im] * len(all_prompts),
                      padding=True, return_tensors="pt").to(device)
        with torch.inference_mode():
            prob = torch.sigmoid(cs_model(**inp).logits).cpu().numpy()

        veg_mask = prob[i_veg].max(axis=0) > thresh
        sky_mask = prob[i_sky].max(axis=0) > thresh
        bldg_mask = prob[i_bldg].max(axis=0) > thresh
        scaf_mask = prob[i_scaf].max(axis=0) > thresh
        horizon = veg_mask.shape[0] // 2

        packed = (veg_mask.astype(np.uint8) << BIT["veg"]
                  | sky_mask.astype(np.uint8) << BIT["sky"]
                  | bldg_mask.astype(np.uint8) << BIT["bldg"]
                  | scaf_mask.astype(np.uint8) << BIT["scaffold"])
        mask_fp = mask_dir / f"{Path(p).stem}.png"
        _save_mask(packed, mask_fp)
        _save_overlay(im, packed, overlay_dir / f"{Path(p).stem}.png")

        row = {
            "path": p, "mask_path": str(mask_fp),
            "px_total": veg_mask.size,
            "px_veg": int(veg_mask.sum()),
            "px_veg_eye": int(veg_mask[horizon:].sum()),
            "px_veg_canopy": int(veg_mask[:horizon].sum()),
            "px_sky": int(sky_mask.sum()),
            "px_bldg": int(bldg_mask.sum()),
            "px_scaffold": int(scaf_mask.sum()),
        }
        for j, name in enumerate(descriptive_names):
            row[f"px_{name}"] = int((prob[descriptive_start + j] > thresh).sum())
        records.append(row)

        # Flush every ~200 images. Cheap insurance against a disconnect.
        if i % 200 == 0 and records:
            pd.DataFrame(records).merge(manifest, on="path").to_csv(ckpt, index=False)

    seg_df = pd.DataFrame(records).merge(manifest, on="path")
    seg_df.to_csv(ckpt, index=False)
    print(f"segmented {len(seg_df)} images -> {ckpt.name}")
    return seg_df
