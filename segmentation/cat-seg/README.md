# cat-seg

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/jling888/blockology-gvi/blob/main/segmentation/cat-seg/CAT_Seg_Colab.ipynb)

Local/Colab backend for [CAT-Seg](https://github.com/KU-CVLAB/CAT-Seg) (ViT-L/14) open-vocabulary segmentation. Runs on a Colab L4; `segmentation.py` invokes these scripts as a subprocess via `--seg-backend colab` (default: `local`).

For a one-click run from the Colab webpage (no local `colab` CLI), use `CAT_Seg_Colab.ipynb` above -- same `setup_catseg.py`/`run_inference.py`, driven from inside the notebook instead of orchestrated remotely. For scripted/repeatable runs from your own machine, use `run_on_colab.sh` below.

## Setup

### Environment

Install dependency:
```
uv sync --group colab
```

Then run `colab sessions` once to complete Google auth.

### Input Files

Upload images and the manifest to your Google Drive first, `colab drivemount` can't read local disk. 
- E.g. copy `output/imagery/*` -> `MyDrive/blockology-gvi/imagery/*`.

### Pre-trained Checkpoint

No checkpoint download needed. `setup_catseg.py` fetches it to your Google Drive automatically on first run. Although you could also do it manually.

## Run

### Execute

Run the following command to start the segmentation on colab.

```
segmentation/cat-seg/run_on_colab.sh [imagery_dir] [checkpoint_dir] [out_dir] [local_out_dir]
```
`[imagery_dir]` is where you uploaded `output/imagery/` wholesale (its `raw/` subfolder + `raw_manifest.csv` sibling) — images and the manifest are both derived from this one path.

Defaults: 
- `[imagery_dir]`: `MyDrive/blockology-gvi/imagery`
- `[checkpoint_dir]`: `MyDrive/blockology-gvi/`
- `[out_dir]`: `MyDrive/blockology-gvi/catseg_out`
- `[local_out_dir]`: `output/catseg/`

Provisions an L4, mounts Drive, installs CAT-Seg, segments every `*.jpg`, then tears the session down.

**Output (on Drive):**

| Path | Notes |
|---|---|
| `pixel_counts.csv` | also pulled to `local_out_dir` |
| `masks/*.npz` | Drive-only — pull manually if needed |
| `overlays/*.png` | Drive-only — pull manually if needed |

Resumable: `run_inference.py` skips images already in `pixel_counts.csv` (`--force` to redo).

## Feeding `cli.py --stage metrics`

`cli.py --stage segmentation --seg-backend colab` handles the manifest and output path automatically. Calling `run_on_colab.sh` directly still works — just point `local_out_dir` at `output/segmentation` yourself.

## File reference

| File | Runs on | Purpose |
|---|---|---|
| `CAT_Seg_Colab.ipynb` | Colab (webpage) | Same steps as `run_on_colab.sh`, run directly in a Colab notebook |
| `run_on_colab.sh` | local | Orchestrates the session via the `colab` CLI |
| `setup_catseg.py` | Colab VM | Clones CAT-Seg, installs detectron2 + deps, downloads checkpoint if absent |
| `run_inference.py` | Colab VM | Loads the model, segments images, writes masks/overlays/pixel_counts.csv to Drive |
| `vocabulary.json` | uploaded to VM | Flattened `CLASS_TERMS` from `run_inference.py` — regenerate, don't hand-edit |

## How it works

### Classification
- Exhaustive, mutually exclusive (argmax — one class per pixel), matching CAT-Seg's own reference code.
- `CLASS_TERMS` in `run_inference.py` covers anything that could plausibly fill a pixel in a NYC street-level photo: COCO-Stuff's trained class names where available, zero-shot CLIP text for NYC-specific concepts otherwise (see comment above `CLASS_TERMS`).

### Masks (`masks/*.npz`)
- `(H, W)` uint8 array; key `"label"` indexes into key `"classes"`. Recover any class's exact pixels with:
  ```python
  m = np.load(path)
  m["label"] == list(m["classes"]).index("curb")
  ```
- `overlays/*.png` are QA-only visuals (one solid color per pixel) — not meant to be re-parsed.

### Download plumbing

- `masks/` and `overlays/` aren't pulled automatically — `colab download` only takes single files.
