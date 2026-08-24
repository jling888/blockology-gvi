# cat-seg

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/jling888/blockology-gvi/blob/main/segmentation/cat-seg/catseg_inference.ipynb)

Local/Colab backend for [CAT-Seg](https://github.com/KU-CVLAB/CAT-Seg) (ViT-L/14) open-vocabulary segmentation. `cli.py --stage segmentation` calls `segmentation.py`, which invokes the scripts in this directory as a subprocess when given `--seg-backend colab` (default: `local`); the Colab path runs on an L4 GPU.

Two ways to drive it:

- **One-click, no local setup** — open `catseg_inference.ipynb` above and run it from the Colab webpage. It calls the same `setup_catseg.py` / `run_inference.py`, just orchestrated from inside the notebook instead of remotely.
- **Scripted/repeatable, from your own machine** — use `run_on_colab.sh` (below), which drives the session via the local `colab` CLI.

## Contents

- [Setup](#setup)
- [Run](#run)
- [Handoff to `cli.py --stage metrics`](#handoff-to-clipy---stage-metrics)
- [File reference](#file-reference)
- [How it works](#how-it-works)

## Setup

### Environment

Install the dependency group, which includes the `colab` CLI used below:

```bash
uv sync --group colab
```

Then run `colab sessions` once to complete Google auth.

### Input Files

Upload images and the manifest to your Google Drive first — `colab drivemount` can't read local disk.

- E.g. copy `output/imagery/*` → `MyDrive/blockology-gvi/imagery/*`.

### Pretrained Checkpoint

No download needed — `setup_catseg.py` fetches the checkpoint to your Google Drive automatically on first run, though you can also download then upload the checkpoint to your Google Drive manually.

## Run

### Execute

Start the segmentation on Colab:

```bash
segmentation/cat-seg/run_on_colab.sh [imagery_dir] [checkpoint_dir] [out_dir] [local_out_dir]
```

`[imagery_dir]` should point at wherever you uploaded `output/imagery/` in full — both the images (`raw/` subfolder) and the manifest (`raw_manifest.csv`, a sibling of `raw/`) live under this one path.

Defaults:

| Argument | Default |
|---|---|
| `[imagery_dir]` | `MyDrive/blockology-gvi/imagery` |
| `[checkpoint_dir]` | `MyDrive/blockology-gvi/` |
| `[out_dir]` | `MyDrive/blockology-gvi/catseg_out` |
| `[local_out_dir]` | `output/catseg/` |

The script provisions an L4, mounts Drive, installs CAT-Seg, segments every `*.jpg`, then tears the session down.

**Output (on Drive):**

| Path | Notes |
|---|---|
| `pixel_counts.csv` | also pulled to `local_out_dir` |
| `masks/*.npz` | Drive-only — see [Manual Downloads](#manual-downloads) |
| `overlays/*.png` | Drive-only — see [Manual Downloads](#manual-downloads) |

Resumable: `run_inference.py` skips images already listed in `pixel_counts.csv` (pass `--force` to redo them).

## Handoff to `cli.py --stage metrics`

The metrics stage expects segmentation results at `output/segmentation`. Running `cli.py --stage segmentation --seg-backend colab` sets that path for you automatically. If you call `run_on_colab.sh` directly instead, point `local_out_dir` at `output/segmentation` yourself so the metrics stage can find the output.

## File reference

| File | Runs on | Purpose |
|---|---|---|
| `catseg_inference.ipynb` | Colab (webpage) | Same steps as `run_on_colab.sh`, run directly in a Colab notebook |
| `run_on_colab.sh` | local | Orchestrates the Colab session via the `colab` CLI |
| `setup_catseg.py` | Colab VM | Clones CAT-Seg, installs detectron2 + deps, downloads the checkpoint if absent |
| `run_inference.py` | Colab VM | Loads the model, segments images, writes masks/overlays/`pixel_counts.csv` to Drive |
| `vocabulary.json` | uploaded to VM | Flattened `CLASS_TERMS` from `run_inference.py` — regenerate, don't hand-edit |

## How it works

### Classification

- Exhaustive and mutually exclusive (argmax — one class per pixel), matching CAT-Seg's own reference code.
- `CLASS_TERMS` in `run_inference.py` covers anything that could plausibly fill a pixel in a NYC street-level photo: COCO-Stuff's trained class names where available, zero-shot CLIP text for NYC-specific concepts otherwise (see the comment above `CLASS_TERMS`).

### Masks (`masks/*.npz`)

Each file is an `(H, W)` uint8 array; the `"label"` key indexes into the `"classes"` key. Recover any class's exact pixels with:

```python
m = np.load(path)
m["label"] == list(m["classes"]).index("curb")
```

`overlays/*.png` are QA-only visuals (one solid color per pixel) — not meant to be re-parsed.

### Manual Downloads

`masks/` and `overlays/` aren't pulled automatically — `colab download` only takes single files, so pull anything you need from those folders by hand.