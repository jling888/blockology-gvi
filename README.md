# blockology-gvi

Pipeline that samples points along a street network, pulls Google Street
View imagery, segments it with CAT-Seg (open-vocabulary, exhaustive
per-pixel classification -- vegetation/sky/building/scaffolding plus a
streetscape supplement, see `segmentation/cat-seg/`), and computes a Green View
Index (GVI) and Visual Enclosure Index (VEI) per point as a flat
pixel-count ratio.

A second measurement lives in [`sim/`](sim/README.md): the Street Interface
Matrix, rating ten perceptual fields with a vision-language model and composing
them into Place Imageability, Place Identity and Place Dependence, over Murray
Hill and the City of London. It runs independently of the stages below --
different frames, different segmenters, its own config -- and ships its result
tables so the analysis reproduces without a GPU or a key.

## Setup

Requires Python >=3.12.

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
| `nodes` | loads + adapts the nodes.gpkg at `--nodes` | `output/nodes/nodes.gpkg` |
| `metadata` | free Street View coverage/capture-date check | `output/metadata/metadata.csv` |
| `imagery` | **billed** -- downloads 6 headings x 60deg FOV per node | `output/imagery/raw_manifest.csv` |
| `segmentation` | CAT-Seg (local GPU or Colab, see `--seg-backend`) -- exhaustive per-pixel classes: vegetation/sky/building/scaffolding plus a streetscape supplement (fences, planters, awnings, benches, signage, sidewalk, road, vehicles, people) | `output/segmentation/pixel_counts.csv` |
| `metrics` | aggregates per-image pixel counts to per-node GVI/VEI + avenue-vs-mid-block contrast | `output/metrics/metrics.csv` |

Every stage checkpoints to its output file and skips work already done, so
an interrupted run resumes rather than restarting.

## Run

To run this pipeline, you need `data/nodes.gpkg` in place (or `--nodes path/to/nodes.gpkg`).

Run the full pipeline:

```
uv run python cli.py
```

Or one stage at a time:

```
uv run python cli.py --stage nodes
uv run python cli.py --stage metadata
uv run python cli.py --stage imagery   # billed -- asks for confirmation unless --yes
uv run python cli.py --stage segmentation   # local GPU by default, see --seg-backend
uv run python cli.py --stage metrics
```

## Nodes

Required columns in the input `.gpkg` (the `nodes` stage renames some of these on load):

| Column | Meaning | Renamed to |
|---|---|---|
| `original_id` | Shared key for a location's rows; deduplicated to one row per location. | `node_id` |
| `lat` / `lng` | WGS84 coordinates, carried through unchanged. | — |
| `street_category` | Street name. If it contains "avenue" or "Ave" (case-insensitive substring), `typology` is inferred as `avenue`; otherwise `mid_block`. | `osm_name` |
| `geometry` | Point geometry. Implicit — every `.gpkg` feature layer has one, so it isn't part of the explicit column check. | — |

## Flags

| Flag | Effect |
|---|---|
| `--nodes PATH` | path to an already-sampled nodes.gpkg (default `data/nodes.gpkg`) |
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

| Model | How it works | Notes | Link |
|---|---|---|---|
| [CAT-Seg](https://github.com/KU-CVLAB/CAT-Seg) (ViT-L/14) | Open-vocabulary. Scores every pixel against the whole vocabulary in one pass | Trained on COCO, probably the reason why GSV images segmentation is difficult to it. | [`segmentation/cat-seg/README.md`](segmentation/cat-seg/README.md) |
