"""Pipeline stages, dispatched by run_stages(); see cli.py for the CLI entry point.

Stages pass state via checkpoint files in the output dir, not a shared object
(see _read_checkpoint()). `imagery` and `validation` cost real money and ask for
confirmation unless --yes / auto_confirm=True.
"""

import os
import platform
import sys
from pathlib import Path
from typing import Callable

import geopandas as gpd
import pandas as pd
import torch

STAGE_NAMES = ["nodes", "metadata", "imagery", "segmentation", "metrics"]


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


def _check_device() -> tuple[str, int]:
    """Pick a compute device -- CUDA, then Apple Silicon MPS -- and a
    segmentation batch size."""
    print("python  ", sys.version.split()[0], "|", platform.system())
    print("torch   ", torch.__version__)

    if torch.cuda.is_available():
        device = "cuda"
        vram_gb = torch.cuda.get_device_properties(0).total_memory / 2**30
        print("gpu     ", torch.cuda.get_device_name(0), f"({vram_gb:.1f} GiB)")
        # Main VRAM lever for segmentation -- halve it if run_segmentation() OOMs.
        batch = 16 if vram_gb >= 32 else 8 if vram_gb >= 14 else 4 if vram_gb >= 10 else 2
    elif torch.backends.mps.is_available():
        device = "mps"
        if hasattr(torch.mps, "recommended_max_memory"):
            # Metal's advisory ceiling for this process, not a hard VRAM size
            # (unified memory is shared with the OS/other apps) -- same tiers
            # as the CUDA branch, just a softer number feeding them.
            vram_gb = torch.mps.recommended_max_memory() / 2**30
            print("gpu     ", "Apple MPS", f"({vram_gb:.1f} GiB recommended)")
            batch = 16 if vram_gb >= 32 else 8 if vram_gb >= 14 else 4 if vram_gb >= 10 else 2
        else:
            print("gpu     ", "Apple MPS (unified memory, no memory query on this torch version)")
            batch = 4  # Fixed conservative default, lower by hand if run_segmentation() OOMs
    else:
        raise SystemExit(
            "No CUDA or MPS device visible.\n"
            "  - CUDA: check nvidia-smi works from a terminal; reinstall torch from the cu121 index\n"
            "  - Apple Silicon: needs torch>=2.0 and macOS>=12.3\n"
            "  - confirm this environment is the right one, not system python"
        )

    print("batch   ", batch, "(auto-selected)")
    return device, batch


def _read_checkpoint(path: Path, stage_hint: str, reader: Callable[[Path], "pd.DataFrame | gpd.GeoDataFrame"]):
    """Read a checkpoint file a prior stage left in `out`, or raise a clear
    "run that stage first" error. `reader` is e.g. `pd.read_csv`/`gpd.read_file`.
    """
    if not path.exists():
        raise RuntimeError(f"{path.name} not found in {path.parent} -- run the "
                           f"'{stage_hint}' stage first.")
    return reader(path)


def _node_locations(nodes: gpd.GeoDataFrame) -> dict[str, tuple[float, float]]:
    """node_id -> (lat, lon), rounded. node_id alone isn't a stable content
    identity -- it's positional (n00000, n00001, ...), so a different
    sampling geometry can reuse the same ID for a different real-world
    location.
    """
    return dict(zip(nodes.node_id, zip(nodes.lat.round(6), nodes.lon.round(6))))


# --------------------------------------------------------------------- stages

def _stage_nodes(out: Path, grid_path: Path) -> None:
    from . import stage_01_nodes as nodes_stage

    nodes_dir = out / "nodes"
    meta_path = out / "metadata" / "metadata.csv"
    nodes_path = nodes_dir / "nodes.gpkg"

    _create_dir(nodes_dir)

    prior_locations = _node_locations(gpd.read_file(nodes_path)) if nodes_path.exists() else {}

    nodes = nodes_stage.sample_nodes_from_grid(nodes_dir, grid_path)
    new_locations = _node_locations(nodes)

    # loc is (lat, lon) rounded to 6 decimals.
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

    nodes_stage.plot_nodes(nodes, nodes_dir)


def _stage_metadata(out: Path, force: bool) -> None:
    from . import stage_02_metadata as metadata

    nodes_path = out / "nodes" / "nodes.gpkg"
    metadata_dir = out / "metadata"

    nodes = _read_checkpoint(nodes_path, "nodes", gpd.read_file)
    _create_dir(metadata_dir)
    metadata.probe_metadata(nodes, _get_gmaps_key(required=True), metadata_dir, force=force)


def _stage_imagery(out: Path, auto_confirm: bool) -> None:
    from . import stage_03_imagery as imagery

    meta_path = out / "metadata" / "metadata.csv"
    imagery_dir = out / "imagery"

    meta = _read_checkpoint(meta_path, "metadata", pd.read_csv)
    _create_dir(imagery_dir)
    imagery.download_imagery(meta, _get_gmaps_key(required=True), imagery_dir,
                                       auto_confirm=auto_confirm)


def _stage_segmentation(out: Path, force: bool) -> None:
    from . import stage_04_segmentation as segmentation

    manifest_path = out / "imagery" / "raw_manifest.csv"
    seg_dir = out / "segmentation"

    manifest = _read_checkpoint(manifest_path, "imagery", pd.read_csv)
    device, _ = _check_device()
    cs_proc, cs_model = segmentation.load_segmenter(device)
    _create_dir(seg_dir)
    segmentation.run_segmentation(manifest, cs_proc, cs_model, device, seg_dir, force=force)
    segmentation.release_segmenter(cs_model, device)


def _stage_metrics(out: Path) -> None:
    """Aggregate stage_04's per-image pixel counts to per-node GVI/VEI --
    one logical stage ("compute the final result"), split into a few
    functions with their own checkpoint file (metrics/metrics.csv) so a
    resumed run never redoes work already on disk. See stage_05_metrics.py.
    """
    from . import stage_05_metrics as metrics_stage

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
               grid_path: Path,
               auto_confirm: bool = False,
               force: bool = False,
               ) -> None:
    """Run the given stages in order (default: all).

    `grid_path` is an already-filtered street network (edges, not points);
    see example/murray_hill.py for how to build one -- this package doesn't
    fetch OSM data or decide which streets count, just samples/labels nodes.

    `force` ignores a stage's own checkpoint and re-runs it from scratch --
    only stages where that's actually safe (free, or explicitly re-confirmed
    before billing) opt in; each `_stage_*` function decides for itself
    whether/how to use it. Currently: `metadata` and `segmentation`
    (not `metrics`, which always fully recomputes anyway -- nothing there to
    force past). Deliberately NOT `imagery`, since that's billed -- forcing
    it would silently re-download and re-bill images already on disk;
    `nodes` doesn't have a resumable checkpoint to force either.
    """
    full_run = names is None
    names = names or STAGE_NAMES

    out = _create_dir(out_dir)
    print("output directory:", out)

    if full_run:
        # Fail fast: confirm a compute device is usable and the maps key
        # exists before spending any money or GPU time on later stages.
        _check_device()
        _get_gmaps_key(required=True)

    # Each lambda closes over the locals above directly -- no separate
    # builder function needed just to hand them off.
    stages = {
        "nodes": lambda: _stage_nodes(out, grid_path),
        "metadata": lambda: _stage_metadata(out, force),
        "imagery": lambda: _stage_imagery(out, auto_confirm),
        "segmentation": lambda: _stage_segmentation(out, force),
        "metrics": lambda: _stage_metrics(out),
    }

    for name in names:
        if name not in stages:
            raise ValueError(f"unknown stage {name!r}; choices: {', '.join(stages)}")
        print(f"\n{f' {name} '.center(70, '─')}")
        stages[name]()

    return
