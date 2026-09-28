"""
STEP 12A — Export teacher-orthogonal 90° perspective frames.

Purpose
-------
Create Arm A for the orientation sensitivity study without modifying the
existing team walk-relative svi_90 dataset.

Existing team protocol:
    two walks × L/R half-views
    centres = walk bearing ±45°

This renderer:
    one canonical local street axis per node
    centres = axis + 0°, +90°, +180°, +270°
    four 90° sectors tile 360° with no overlap/gap

The projection implementation is reused from tools/export_svi_90.py so pixel
density and vertical projection remain compatible with the current team data.

Output naming
-------------
<out>/<street>/orthogonal/<seq>_<node_id>_<cardinal>_O0.jpg
<out>/<street>/orthogonal/<seq>_<node_id>_<cardinal>_O90.jpg
<out>/<street>/orthogonal/<seq>_<node_id>_<cardinal>_O180.jpg
<out>/<street>/orthogonal/<seq>_<node_id>_<cardinal>_O270.jpg

The O* suffix records the angular offset relative to the selected local street
axis. It is intentionally NOT encoded as L/R.

Suggested smoke test
--------------------
.venv/Scripts/python tools/export_svi_90_orthogonal.py \
    --nodes n00045 n00046 n00047

Full run
--------
.venv/Scripts/python tools/export_svi_90_orthogonal.py

IMPORTANT
---------
This script only renders images. It does not run Qwen and does not alter the
existing data/raw/svi_90 directory or sim_vlm_v3.csv.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import geopandas as gpd
import numpy as np
import pandas as pd
from PIL import Image
from tqdm.auto import tqdm

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / "src"))
sys.path.insert(0, str(HERE))

from common import PROJ_CRS, PROC, banner, street_grouping
from export_svi_180 import _cardinal, _load, _street_axis, _tunnel_nodes, VIADUCT_NODES
from export_svi_90 import panorama90


FOV = 90.0
DEFAULT_WIDTH = 1440
SEQ_WIDTH = 3
ORTHOGONAL_OFFSETS = (0.0, 90.0, 180.0, 270.0)


def _circmean(deg) -> float:
    """Circular mean in degrees, returned on [0, 360)."""
    values = np.asarray(deg, dtype=float)
    radians = np.radians(values)
    return float(
        np.degrees(
            np.arctan2(
                np.sin(radians).mean(),
                np.cos(radians).mean(),
            )
        )
        % 360
    )


def _canonical_axis_for_street(
    group: gpd.GeoDataFrame,
) -> tuple[float | None, str | None]:
    """
    Return a street-level forward axis and its source column, when available.

    Priority:
    1) per-node heading_fwd_deg / osm_heading_fwd are handled later per node;
       this function only indicates which column to use.
    2) otherwise fit one street axis from projected coordinates.
    """
    for column in ("heading_fwd_deg", "osm_heading_fwd"):
        if column in group.columns:
            valid = pd.to_numeric(group[column], errors="coerce").dropna()
            if len(valid):
                return _circmean(valid), column

    axis = _street_axis(
        group["_e"].to_numpy(),
        group["_n"].to_numpy(),
    )
    return float(axis) % 360, None


def _node_axis(
    row,
    fallback_axis: float,
    heading_column: str | None,
) -> float:
    """Use a per-node local tangent when available, else the street axis."""
    if heading_column:
        value = getattr(row, heading_column, None)

        if value is not None and pd.notna(value):
            return float(value) % 360

    return float(fallback_axis) % 360


def _ordered_rows(
    group: gpd.GeoDataFrame,
    axis: float,
) -> gpd.GeoDataFrame:
    """
    Stable node order along the canonical street axis.

    seq is used only as a deterministic filename index; node_id remains the
    cross-protocol pairing key in the sensitivity analysis.
    """
    east = np.sin(np.radians(axis))
    north = np.cos(np.radians(axis))

    return (
        group.assign(
            _proj=np.round(group["_e"] * east + group["_n"] * north),
            _perp=group["_e"] * north - group["_n"] * east,
        )
        .sort_values(["_proj", "_perp", "node_id"])
        .copy()
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Export teacher-orthogonal four-view 90° frames."
    )

    parser.add_argument(
        "--out",
        type=Path,
        default=Path("data/raw/svi_90_orthogonal"),
    )

    parser.add_argument(
        "--width",
        type=int,
        default=DEFAULT_WIDTH,
        help="width of each 90° frame in px; default 1440 = 16 px/degree",
    )

    parser.add_argument("--quality", type=int, default=88)

    parser.add_argument(
        "--nodes",
        nargs="+",
        default=None,
        help="render only these node_ids for a smoke test",
    )

    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="render only the first N street groups",
    )

    parser.add_argument(
        "--missing-only",
        action="store_true",
        help="skip node_ids already represented by four O* images under --out",
    )

    parser.add_argument(
        "--keep-tunnels",
        action="store_true",
    )

    parser.add_argument(
        "--no-segments",
        action="store_true",
        help="ignore street_segment and use the repository fallback grouping",
    )

    args = parser.parse_args()

    banner("export teacher-orthogonal 90-degree frames")

    manifest = pd.read_csv(PROC / "manifest.csv")
    nodes = gpd.read_file(PROC / "nodes.gpkg")

    nodes, grouping_label = street_grouping(
        nodes,
        prefer_segments=not args.no_segments,
    )

    available_node_ids = set(manifest.node_id.astype(str))
    info = nodes[nodes.node_id.astype(str).isin(available_node_ids)].copy()

    if args.nodes:
        requested = set(args.nodes)
        info = info[info.node_id.astype(str).isin(requested)].copy()
        print(f"--nodes: {len(info)} available node(s) selected")

    if not args.keep_tunnels and len(info):
        tunnel_map = _tunnel_nodes(info.node_id)
        excluded = set(tunnel_map) | (VIADUCT_NODES & set(info.node_id))

        if excluded:
            info = info[~info.node_id.isin(excluded)].copy()
            print(
                f"dropped {len(excluded)} tunnel / viaduct node(s)"
            )

    if info.empty:
        raise SystemExit("No renderable nodes remain after filtering.")

    projected = info.to_crs(PROJ_CRS)
    info["_e"] = projected.geometry.x.values
    info["_n"] = projected.geometry.y.values

    street_names = sorted(info.folder.unique())

    if args.limit:
        street_names = street_names[: args.limit]

    by_node = {
        str(node_id): group
        for node_id, group in manifest.groupby("node_id")
    }

    print(
        f"grouping by {grouping_label}: "
        f"{len(info)} nodes, {len(street_names)} street groups"
    )

    focal = args.width / np.radians(FOV)
    out_h = int(2 * focal * np.tan(np.radians(45.0)))

    print(
        f"each frame: {args.width}x{out_h}px, "
        f"{args.width / FOV:.1f} px/degree"
    )
    print("four centers per node: street axis + 0/90/180/270 degrees\n")

    completed_nodes: set[str] = set()

    if args.missing_only and args.out.exists():
        counts: dict[str, int] = {}

        for jpg in args.out.rglob("*_O*.jpg"):
            parts = jpg.stem.split("_")
            node = next(
                (part for part in parts if part.startswith("n") and part[1:].isdigit()),
                None,
            )

            if node:
                counts[node] = counts.get(node, 0) + 1

        completed_nodes = {
            node_id
            for node_id, count in counts.items()
            if count >= 4
        }

        print(
            f"--missing-only: {len(completed_nodes)} complete node(s) "
            "already present"
        )

    written = 0
    skipped_existing = 0
    missing_source: list[str] = []

    for street in tqdm(
        street_names,
        desc="orthogonal streets",
        mininterval=1.0,
    ):
        group = info[info.folder == street].copy()

        if group.empty:
            continue

        fallback_axis, heading_column = _canonical_axis_for_street(group)
        assert fallback_axis is not None

        ordered = _ordered_rows(group, fallback_axis)
        folder = args.out / str(street) / "orthogonal"
        folder.mkdir(parents=True, exist_ok=True)

        for seq, row in enumerate(ordered.itertuples(), start=1):
            node_id = str(row.node_id)

            if node_id in completed_nodes:
                skipped_existing += 1
                continue

            source_frames = _load(by_node.get(node_id))

            if source_frames is None:
                missing_source.append(node_id)
                continue

            base_axis = _node_axis(
                row,
                fallback_axis,
                heading_column,
            )

            sequence = str(seq).zfill(SEQ_WIDTH)

            for offset in ORTHOGONAL_OFFSETS:
                center = (base_axis + offset) % 360

                image = panorama90(
                    source_frames,
                    center,
                    args.width,
                    FOV,
                )

                cardinal = _cardinal(center)
                offset_label = f"O{int(offset):03d}"

                filename = (
                    f"{sequence}_{node_id}_{cardinal}_{offset_label}.jpg"
                )

                Image.fromarray(image).save(
                    folder / filename,
                    quality=args.quality,
                    optimize=True,
                )

                written += 1

    print(f"\nwrote {written} orthogonal 90° image(s)")

    if skipped_existing:
        print(
            f"skipped {skipped_existing} node(s) already complete under --out"
        )

    if missing_source:
        unique_missing = sorted(set(missing_source))
        print(
            f"{len(unique_missing)} node(s) skipped because source panorama "
            "frames were incomplete"
        )

    expected = 4 * (
        len(info)
        - len(set(missing_source))
        - skipped_existing
    )

    if written != expected:
        print(
            f"WARNING: wrote {written} images; expected {expected} "
            "from the nodes processed in this pass."
        )

    print(f"output: {args.out}")
    print(
        "NEXT: visually inspect a small node sample before running Qwen. "
        "Do not overwrite data/raw/svi_90."
    )


if __name__ == "__main__":
    main()
