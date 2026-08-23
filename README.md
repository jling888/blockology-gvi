# blockology-gvi

Pipeline that samples points along a street network, pulls Google Street
View imagery, segments it with a vision-language model (CLIPSeg,
text-prompted -- vegetation/sky/building/scaffolding plus a streetscape
supplement), and computes a Green View Index (GVI) and Visual Enclosure
Index (VEI) per point as a flat pixel-count ratio.

Design rationale, literature review, and open questions: see
[METHODOLOGY.md](METHODOLOGY.md).

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
| `nodes` | samples points every 20m along the grid's edges, labels avenue/mid_block | `out/nodes/nodes.gpkg` |
| `metadata` | free Street View coverage/capture-date check | `out/metadata/metadata.csv` |
| `imagery` | **billed** -- downloads 6 headings x 60deg FOV per node | `out/imagery/raw_manifest.csv` |
| `segmentation` | CLIPSeg, text-prompted -- vegetation/sky/building/scaffolding plus a streetscape supplement (fences, planters, awnings, benches, signage, sidewalk, road, vehicles, people) | `out/segmentation/pixel_counts.csv` |
| `metrics` | aggregates per-image pixel counts to per-node GVI/VEI + avenue-vs-mid-block contrast | `out/metrics/metrics.csv` |

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
uv run blockology-gvi --grid path/to/grid.gpkg
```

Or one stage at a time:

```
uv run blockology-gvi --grid path/to/grid.gpkg --stage nodes
uv run blockology-gvi --stage metadata
uv run blockology-gvi --stage imagery   # billed -- asks for confirmation unless --yes
uv run blockology-gvi --stage segmentation
uv run blockology-gvi --stage metrics
```

## Flags

| Flag | Effect |
|---|---|
| `--grid PATH` | required whenever `nodes` runs |
| `--out DIR` | output directory (default `out/`) |
| `--stage NAME` | run just one stage (repeatable) |
| `--from-stage NAME` | run this stage through the end, instead of every stage |
| `--list-stages` | show the stages in order and exit |
| `--yes` / `-y` | skip confirmation prompts before paid API calls |
| `--force` | ignore a stage's checkpoint and re-run from scratch (where supported) |

## Segmentation classes

`stage_04_segmentation.py` prompts CLIPSeg for every class
this study cares about -- see that module for the exact prompts. `veg`
(split into `veg_eye`/`veg_canopy` at the horizon), `sky`, `bldg`, and
`scaffold` get a saved mask + overlay for visual QA and feed GVI/VEI
directly; the rest (`hard_barrier`, `soft_buffer`, `shelter`, `rest`,
`articulation`, `sidewalk`, `road`, `vehicle`, `person`) are counts-only,
reported as a `<class>_frac` share of the view in `metrics.csv`.
