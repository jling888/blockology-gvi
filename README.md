# blockology-gvi

Currently implements the first 4 stages: `nodes`, `metadata`, `imagery`,
`segmentation`. Metric computation, VLM scoring, and validation are not
built yet.

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

### 4. `imagery` (`stage_03_imagery.py`)

```
uv run blockology-gvi --stage imagery
```

- **Does:** downloads four frames per usable node at `fov=90` on the cardinal
  headings, which tile the full circle exactly -- no gaps, no overlap, and a
  known solid angle per frame. Stage 5 can then measure any field of view
  from the same imagery, including the 180 degree forward view, rather than
  fixing the FOV at purchase time. Requests are keyed by `pano_id` so a
  re-run cannot silently mix capture dates.
- **Produces:** `out/imagery/<node_id>_<heading>.jpg`, `out/imagery/manifest.csv`
- **Costs money.** Asks before starting unless `--yes`. Resumes rather than
  re-downloading, so an interrupted run costs nothing the second time.

### 5. `segmentation` (`stage_04_segmentation.py`)

```
uv run blockology-gvi --stage segmentation
```

- **Does:** segments every frame with Mask2Former (ADE20K) and accumulates
  the result into a 14 x 360 azimuthal array per node -- twelve class groups,
  vegetation split at the horizon into eye-level and canopy, and a row of
  total column weight. Bins are absolute compass bearings, so any angular
  window is a slice of the same array. The degree-to-column mapping is
  gnomonic rather than linear, and columns are weighted by solid angle;
  ignoring either misplaces class boundaries by roughly 4 degrees and
  over-counts the frame edges.
- **Produces:** `out/segmentation/profiles.npz` (arrays plus their row names),
  `out/segmentation/shares.csv` (each group's share of the circle)
- **Notes:** ADE20K has no class for arcade, bollard, hedge, shrub, planter,
  pergola, balcony or gate. Terms depending on those are proxied or absent,
  and the class table in the module says which.

## Flags

| Flag | Effect |
|---|---|
| `--grid PATH` | required whenever `nodes` runs |
| `--stage NAME` | run just one stage |
| `--list-stages` | show the stages in order |
| `--out DIR` | override output dir (default `out/`) |

Both stages checkpoint to their output file and skip work already done, so
an interrupted run resumes rather than restarting.
