# sim

Street Interface Matrix: a second measurement over the same kind of Street
View imagery, rating ten perceptual fields with a vision-language model and
composing them into Place Imageability, Place Identity and Place Dependence.
Runs on two study areas -- Murray Hill, Manhattan and the City of London --
and is independent of the GVI/VEI pipeline in `pipeline/`: different frames,
different segmenters, its own config.

Two tracks over one frame. A **segmentation track** produces class shares from
two open-weight semantic segmenters (Mapillary Vistas and ADE20K), plus
azimuthal profiles. A **VLM track** rates the ten fields, for the terms no
segmenter can produce. The first exists largely to validate the second: eight
of the ten fields have a measured counterpart over the same arc of view, and
those eight are the evidence that the model reads the imagery rather than
producing plausible numbers.

## Setup

Requires Python >=3.12, and a GPU for the segmentation and rating stages.

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
| `s01_frame` | adapts a node set to the frame schema; usable/exclude_reason per node | `sim/data/processed/nodes.csv` |
| `s02_imagery` | **billed** -- Street View metadata, then panoramas per node | `sim/data/raw/` (not committed) |
| `s03_profiles` | two segmenters + azimuthal profiles over each view's own arc | `sim/data/processed/seg90_two_model.csv` |
| `s04_metrics` | pixel shares aggregated per node | `sim/data/processed/metrics.csv` |
| `s05_geometry` | facade-to-facade width and canyon H/W from footprints | `metrics.csv` (H_m, W_facade, HW_*) |
| VLM rating | ten fields, one call per field, read from logits not generated | `sim/results/tables/sim_vlm_180_placeless.csv` |
| compose | I, Y, D, Omega -> M, split into observed and derived | `vlm_observations_*.csv`, `vlm_calculations_*.csv` |

## Run

Analysis stages, from the committed tables, no GPU or key needed:

```
uv run python sim/main.py --from s04
uv run python sim/tools/sim_compute.py --table sim/results/tables/sim_vlm_180_placeless.csv
uv run python sim/tools/sim_readme.py          # regenerate the data dictionary
```

GPU stages, in the order they would be re-run from scratch:

```
uv run python sim/tools/export_svi_180.py --out sim/data/raw/svi_180
uv run python sim/tools/seg_two_model.py --src sim/data/raw/svi_180
uv run python sim/tools/sim_vlm_run.py --src sim/data/raw/svi_180 \
    --table sim/results/tables/sim_vlm_180_placeless.csv     # ~2.5 h
uv run python sim/tools/sim_vlm_describe.py --src sim/data/raw/svi_180 --all --resume
```

The second study area is the same commands with `SIM_CONFIG=config_london.yaml`.

## Tables

The two output tables join one-to-one on `file`.

| Table | Holds |
|---|---|
| `vlm_observations_*.csv` | the ratings exactly as returned -- `<field>_median_round` (the rung shown) and `<field>_median` (what M is built from), plus `_argmax` and the full `_p1.._p7` distribution -- the pixel shares measured over the same arc, and the canyon geometry `H_m`, `W_facade`, `HW_effective`. Nothing here is computed from anything else here. |
| `vlm_calculations_*.csv` | every intermediate the composition defines, in the order applied: normalise, compose, threshold, discount, combine. `M` is the composite; `M_noA` is the like-for-like column for a study area with no building heights. |

Every node carries `usable` and `exclude_reason`. Unusable frames -- tunnel
interiors, the Park Avenue viaduct deck, user-contributed panoramas -- stay in
the observations with the tag and never reach the calculations or the
calibration.

## Imagery

Not committed. Google caps caching at thirty days and the photographs are not
ours to redistribute; the derived measurements are. Every render is
reproducible from the node frames with a Maps key.

## Nodes

Required columns in the input node table:

| Column | Meaning |
|---|---|
| `node_id` | one row per sampling location |
| `lat` / `lon` | WGS84 coordinates |
| `chain` | the street run a node belongs to |
| `cleaned_id` | `<street>_<sequence>` -- names the street and the position on it; what the walk-through orders by |
| `usable` / `exclude_reason` | False for frames that are not street-level public space, with the reason |
