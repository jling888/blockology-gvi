# blockology-gvi

Pipeline that samples points along a street network, pulls Google Street
View imagery, segments it with CAT-Seg (open-vocabulary, exhaustive
per-pixel classification -- vegetation/sky/building/scaffolding plus a
streetscape supplement, see `segmentation/cat-seg/`), and computes a Green View
Index (GVI) and Visual Enclosure Index (VEI) per point as a flat
pixel-count ratio.

## Setup

```
uv sync
```

Create a `.env` file next to `pyproject.toml`:

```
GMAPS_KEY=your_key_here
```

## Pipeline stages

| Stage | Does | Produces |
|---|---|---|
| `nodes` | samples points every 20m along the grid's edges, labels avenue/mid_block | `output/nodes/nodes.gpkg` |
| `metadata` | free Street View coverage/capture-date check | `output/metadata/metadata.csv` |
| `imagery` | **billed** -- downloads 6 headings x 60deg FOV per node | `output/imagery/raw_manifest.csv` |
| `segmentation` | CAT-Seg (local GPU or Colab, see `--seg-backend`) -- exhaustive per-pixel classes: vegetation/sky/building/scaffolding plus a streetscape supplement (fences, planters, awnings, benches, signage, sidewalk, road, vehicles, people) | `output/segmentation/pixel_counts.csv` |
| `metrics` | aggregates per-image pixel counts to per-node GVI/VEI + avenue-vs-mid-block contrast | `output/metrics/metrics.csv` |

Every stage checkpoints to its output file and skips work already done, so
an interrupted run resumes rather than restarting.

## Run

Grid generation is study-specific and lives outside the package (`example/`)
-- run that first:

```
uv run python example/murray_hill.py
```

Then run the full pipeline:

```
uv run python cli.py --grid path/to/grid.gpkg
```

Or one stage at a time:

```
uv run python cli.py --grid path/to/grid.gpkg --stage nodes
uv run python cli.py --stage metadata
uv run python cli.py --stage imagery   # billed -- asks for confirmation unless --yes
uv run python cli.py --stage segmentation   # local GPU by default, see --seg-backend
uv run python cli.py --stage metrics
```

## Flags

| Flag | Effect |
|---|---|
| `--grid PATH` | required whenever `nodes` runs |
| `--out DIR` | output directory (default `output/`) |
| `--stage NAME` | run just one stage (repeatable) |
| `--from-stage NAME` | run this stage through the end, instead of every stage |
| `--list-stages` | show the stages in order, numbered, with a description, and exit |
| `--yes` / `-y` | skip confirmation prompts before paid API calls |
| `--force` | ignore a stage's checkpoint and re-run from scratch (where supported) |
| `--seg-backend {local,colab}` | segmentation compute backend (default `local`) |
| `--seg-checkpoint-dir PATH` | local dir for the CAT-Seg repo + checkpoint (`--seg-backend local` only; default `<out>/segmentation/checkpoint`) |
| `--drive-images-dir` / `--drive-checkpoint-dir` / `--drive-out-dir` | Drive-relative paths for the colab backend (`--seg-backend colab` only; default: `segmentation/cat-seg/run_on_colab.sh`'s own defaults) |

## Segmentation classes

The `segmentation` stage runs `segmentation/cat-seg/run_inference.py`'s CAT-Seg
model against the `CLASS_TERMS` vocabulary defined there -- see that module
for the exact terms. Classification is exhaustive and mutually exclusive
(argmax -- one winning class per pixel), not independent per-class
thresholds. `veg` (split into `veg_eye`/`veg_canopy` at the horizon),
`sky`, `bldg`, and `scaffold` feed GVI/VEI directly; every other class
(sidewalk, curb, crosswalk, fences, planters, awnings, benches, vehicles,
people, ...) is counts-only, reported as a `<class>_frac` share of the
view in `metrics.csv`.

By default (`--seg-backend local`) this runs on this machine and needs a
local GPU -- detectron2 and the CAT-Seg checkpoint get installed/downloaded
on first use. `--seg-backend colab` instead runs it on a Google Colab GPU
session, but **requires the images (and, for node_id-linked metrics,
`output/imagery/raw_manifest.csv`) to already be manually uploaded to Google
Drive** before running -- see `segmentation/cat-seg/README.md` for the exact steps.
