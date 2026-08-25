"""Pipeline stages, dispatched by run_stages(); see cli.py for the CLI entry point.

Stages pass state via checkpoint files in the output dir, not a shared object
(see _read_checkpoint()). `imagery` and `validation` cost real money and ask for
confirmation unless --yes / auto_confirm=True.
"""

import os
from pathlib import Path
from typing import Callable

import geopandas as gpd
import pandas as pd

STAGE_NAMES = ["nodes", "metadata", "imagery", "segmentation", "metrics"]
STAGE_DESCRIPTIONS = {
    "nodes": "load + adapt the user-supplied nodes.gpkg from the data directory",
    "metadata": "free Street View coverage/capture-date check",
    "imagery": "billed -- download 6 headings x 60deg FOV per node",
    "segmentation": "CAT-Seg pixel classification (local GPU or Colab, see --seg-backend)",
    "metrics": "aggregate per-image pixel counts to per-node GVI/VEI + typology contrast",
}


# --------------------------------------------------------------- helpers

def _read_env(name: str) -> str:
    """Environment variable first, then a .env file in the current directory."""
    v = os.environ.get(name, "")
    if not v and Path(".env").exists():
        for line in Path(".env").read_text().splitlines():
            if line.strip().startswith(name):
                v = line.split("=", 1)[1].strip().strip("\"'")
    return v


def _get_gmaps_key(required: bool = True) -> str:
    key = _read_env("GMAPS_KEY")
    if required and not key:
        raise AssertionError(
            "No Google Maps key found. Create a .env file next to this "
            "project:\n    GMAPS_KEY=your_key_here\n"
            "Add .env to .gitignore -- never commit it, never paste it in chat."
        )
    return key


def _get_openai_key() -> str:
    return _read_env("OPENAI_KEY")


def _create_dir(path: Path) -> Path:
    path = Path(path).resolve()
    path.mkdir(parents=True, exist_ok=True)
    return path


def _read_checkpoint(path: Path, stage_hint: str, reader: Callable[[Path], "pd.DataFrame | gpd.GeoDataFrame"]):
    """Read a checkpoint file a prior stage left in `out`, or raise a clear
    "run that stage first" error. `reader` is e.g. `pd.read_csv`/`gpd.read_file`.
    """
    if not path.exists():
        raise RuntimeError(f"{path.name} not found in {path.parent} -- run the "
                           f"'{stage_hint}' stage first.")
    return reader(path)


def _node_locations(nodes: gpd.GeoDataFrame) -> dict[str, tuple[float, float]]:
    """node_id -> (lat, lng), rounded. node_id alone isn't a stable content
    identity -- it's positional (n00000, n00001, ...), so a different
    sampling geometry can reuse the same ID for a different real-world
    location.
    """
    return dict(zip(nodes.node_id, zip(nodes.lat.round(6), nodes.lng.round(6))))


# --------------------------------------------------------------------- stages

def _stage_nodes(out: Path, nodes_path: Path) -> None:
    from . import nodes as nodes_stage

    nodes_dir = out / "nodes"
    meta_path = out / "metadata" / "metadata.csv"
    ckpt_path = nodes_dir / "nodes.gpkg"

    _create_dir(nodes_dir)

    prior_locations = _node_locations(gpd.read_file(ckpt_path)) if ckpt_path.exists() else {}

    nodes = nodes_stage.load_nodes(nodes_path)
    new_locations = _node_locations(nodes)

    # loc is (lat, lng) rounded to 6 decimals.
    stale_ids = {nid for nid, loc in prior_locations.items() if new_locations.get(nid) != loc}
    if stale_ids:
        # node_id is positional, not stable -- drop stale rows so metadata
        # re-probes a new pano_id, which fetches imagery under a new filename.
        if meta_path.exists():
            original_meta = pd.read_csv(meta_path)
            new_meta = original_meta.drop(index=original_meta.index[original_meta.node_id.isin(stale_ids)])
            new_meta.to_csv(meta_path, index=False)
        print(f"{len(stale_ids)} node ID(s) moved -- will be re-probed for fresh imagery; "
              f"other nodes untouched.")

    nodes.to_file(ckpt_path, driver="GPKG")
    nodes_stage.plot_nodes(nodes, nodes_dir)


def _stage_metadata(out: Path, force: bool) -> None:
    from . import metadata

    nodes_path = out / "nodes" / "nodes.gpkg"
    metadata_dir = out / "metadata"

    nodes = _read_checkpoint(nodes_path, "nodes", gpd.read_file)
    _create_dir(metadata_dir)
    metadata.probe_metadata(nodes, _get_gmaps_key(required=True), metadata_dir, force=force)


def _stage_imagery(out: Path, auto_confirm: bool) -> None:
    from . import imagery

    meta_path = out / "metadata" / "metadata.csv"
    imagery_dir = out / "imagery"

    meta = _read_checkpoint(meta_path, "metadata", pd.read_csv)
    _create_dir(imagery_dir)
    imagery.download_imagery(meta, _get_gmaps_key(required=True), imagery_dir,
                                       auto_confirm=auto_confirm)


def _stage_segmentation(out: Path, force: bool, seg_backend: str, seg_checkpoint_dir: Path | None,
                        drive_images_dir: str | None, drive_checkpoint_dir: str | None,
                        drive_out_dir: str | None) -> None:
    from . import segmentation

    manifest_path = out / "imagery" / "raw_manifest.csv"
    images_dir = out / "imagery" / "raw"
    seg_dir = out / "segmentation"

    _read_checkpoint(manifest_path, "imagery", pd.read_csv)
    _create_dir(seg_dir)

    if seg_backend == "colab":
        segmentation.run_colab(seg_dir, drive_images_dir, drive_checkpoint_dir, drive_out_dir)
    else:
        checkpoint_dir = _create_dir(seg_checkpoint_dir or seg_dir / "checkpoint")
        segmentation.run_local(images_dir, manifest_path, seg_dir, checkpoint_dir, force=force)


def _stage_metrics(out: Path) -> None:
    """Aggregate the segmentation stage's per-image pixel counts to
    per-node GVI/VEI -- one logical stage ("compute the final result"),
    split into a few functions with their own checkpoint file
    (metrics/metrics.csv) so a resumed run never redoes work already on
    disk. See metrics.py.
    """
    from . import metrics as metrics_stage

    pixel_counts_path = out / "segmentation" / "pixel_counts.csv"
    nodes_path = out / "nodes" / "nodes.gpkg"
    metrics_dir = out / "metrics"

    pixel_counts = _read_checkpoint(pixel_counts_path, "segmentation", pd.read_csv)
    nodes = _read_checkpoint(nodes_path, "nodes", gpd.read_file)
    _create_dir(metrics_dir)
    # compute_node_metrics/run_typology_contrast always fully recompute from
    # pixel_counts_path (no row-level checkpoint of their own to force
    # past), so this stage has nothing for `force` to override.
    metrics = metrics_stage.compute_node_metrics(pixel_counts, nodes, metrics_dir)
    metrics_stage.run_typology_contrast(metrics)
    metrics_stage.plot_metrics_map(metrics, metrics_dir)
    metrics_stage.plot_metrics_distributions(metrics, metrics_dir)


# --------------------------------------------------------------------- entry point

def run_stages(names: list[str] | None = None, *,
               out_dir: Path,
               nodes_path: Path,
               auto_confirm: bool = False,
               force: bool = False,
               seg_backend: str = "local",
               seg_checkpoint_dir: Path | None = None,
               drive_images_dir: str | None = None,
               drive_checkpoint_dir: str | None = None,
               drive_out_dir: str | None = None,
               ) -> None:
    """Run the given stages in order (default: all).

    `nodes_path` is the path to an already-sampled `nodes.gpkg` (required
    columns: pipeline.nodes.RAW_COLUMNS) -- this package doesn't fetch OSM
    data, sample points, or decide which streets count; that all happens
    upstream, outside this pipeline.

    `force` ignores a stage's own checkpoint and re-runs it from scratch --
    only stages where that's actually safe (free, or explicitly re-confirmed
    before billing) opt in; each `_stage_*` function decides for itself
    whether/how to use it. Currently: `metadata` and `segmentation`
    (not `metrics`, which always fully recomputes anyway -- nothing there to
    force past). Deliberately NOT `imagery`, since that's billed -- forcing
    it would silently re-download and re-bill images already on disk;
    `nodes` doesn't have a resumable checkpoint to force either.

    `seg_backend`/`seg_checkpoint_dir`/`drive_*_dir` only matter for the
    `segmentation` stage -- see segmentation.py.
    """
    full_run = names is None
    names = names or STAGE_NAMES

    out = _create_dir(out_dir)
    print("output directory:", out)

    if full_run:
        # Fail fast: confirm the maps key exists before spending any money
        # on later stages.
        _get_gmaps_key(required=True)

    # Each lambda closes over the locals above directly -- no separate
    # builder function needed just to hand them off.
    stages = {
        "nodes": lambda: _stage_nodes(out, nodes_path),
        "metadata": lambda: _stage_metadata(out, force),
        "imagery": lambda: _stage_imagery(out, auto_confirm),
        "segmentation": lambda: _stage_segmentation(
            out, force, seg_backend, seg_checkpoint_dir,
            drive_images_dir, drive_checkpoint_dir, drive_out_dir),
        "metrics": lambda: _stage_metrics(out),
    }

    for name in names:
        if name not in stages:
            raise ValueError(f"unknown stage {name!r}; choices: {', '.join(stages)}")
        print(f"\n{f' {name} '.center(70, '─')}")
        stages[name]()

    return
