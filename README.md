# blockology-gvi

Currently implements the first 2 stages: `nodes`, `metadata`. Imagery
download, segmentation, metric computation, VLM scoring, and validation are
not built yet.

## Setup

```
uv sync
```

Create a `.env` file next to `pyproject.toml`:

```
GMAPS_KEY=your_key_here
```

## Run

### 1. Grid generation

```
uv run python example/murray_hill.py
```

- **Does:** study-specific, lives outside the package (`example/`). Fetches
  Murray Hill's boundary, filters to avenues + the numbered cross streets.
- **Produces:** `out/grid.gpkg`

### 2. `nodes` (`stage_01_nodes.py`)

```
uv run blockology-gvi --grid blockology-gvi/example --stage nodes
```

- **Does:** samples points every 20 m along the grid's edges, snapped so
  real intersections aren't double-counted; each labeled `avenue`/`mid_block`
  by OSM name.
- **Produces:** `out/nodes/nodes.gpkg`, `out/nodes/figure_nodes.png`
  (sanity-check plot)

### 3. `metadata` (`stage_02_metadata.py`)

```
uv run blockology-gvi --stage metadata
```

- **Does:** checks Google's free Street View metadata endpoint per point
  (coverage + capture date); marks usable the nodes matching the single
  most common capture date (temporal coherence).
- **Produces:** `out/metadata/metadata.csv`

## Flags

| Flag | Effect |
|---|---|
| `--grid PATH` | required whenever `nodes` runs |
| `--stage NAME` | run just one stage |
| `--list-stages` | show the stages in order |
| `--out DIR` | override output dir (default `out/`) |

Both stages checkpoint to their output file and skip work already done, so
an interrupted run resumes rather than restarting.
