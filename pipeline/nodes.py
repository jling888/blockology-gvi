"""Load a user-supplied nodes.gpkg and adapt it to this
pipeline's internal schema.

Node extraction/sampling happens outside this package now -- the caller
points at an already-sampled `nodes.gpkg` (see --nodes) and this stage
adapts its columns, dedupes, and plots the result before any imagery is
downloaded.
"""

from pathlib import Path

import geopandas as gpd
import numpy as np

# Source columns (see e.g. data/nodes.gpkg): one row per
# (location, direction). `original_id` is the shared key across a
# location's direction rows -- deduped to one row per node below.
RAW_COLUMNS = ["original_id", "lat", "lng", "street_category"]

AVENUE_PATTERN = r"ave"  # matches "avenue" and "Ave" alike, case-insensitive


def load_nodes(nodes_path: Path) -> gpd.GeoDataFrame:
    """Read a nodes.gpkg produced upstream of this pipeline and adapt it to
    the columns the rest of the pipeline expects: node_id, lat, lng,
    osm_name, typology, geometry -- one row per physical location.
    """
    if not nodes_path.exists():
        raise FileNotFoundError(
            f"{nodes_path} not found -- point --nodes at your already-sampled "
            f"nodes.gpkg (required columns: {', '.join(RAW_COLUMNS)})."
        )
    raw = gpd.read_file(nodes_path)
    missing = [c for c in RAW_COLUMNS if c not in raw.columns]
    if missing:
        raise ValueError(f"{nodes_path} is missing required column(s): {', '.join(missing)}")

    nodes = raw.drop_duplicates("original_id").reset_index(drop=True)
    nodes = nodes.rename(columns={"original_id": "node_id", "street_category": "osm_name"})
    nodes["typology"] = np.where(
        nodes.osm_name.str.contains(AVENUE_PATTERN, case=False, na=False),
        "avenue", "mid_block",
    )
    return nodes[["node_id", "lat", "lng", "osm_name", "typology", "geometry"]]


def plot_nodes(nodes: gpd.GeoDataFrame, out: Path) -> None:
    """Plot the sample nodes, colored by typology, over a real OSM basemap
    -- a quick visual sanity check on the geometry this stage produces, before
    spending any money downloading imagery for it.
    """
    import contextily as ctx
    import matplotlib.pyplot as plt

    nodes_3857 = nodes.to_crs(3857)
    fig, ax = plt.subplots(figsize=(8, 10))

    for t, s in nodes_3857.groupby("typology"):
        ax.scatter(s.geometry.x, s.geometry.y, s=10, alpha=0.85, label=t, zorder=3)

    # Tiles are fetched over the network at render time, in Web Mercator
    # (EPSG:3857) -- the projection tile servers require. Source is CartoDB,
    # not tile.openstreetmap.org directly -- OSM's own tile server blocks
    # automated/app traffic under its tile usage policy
    # (operations.osmfoundation.org/policies/tiles), independent of actual
    # request volume; CartoDB serves OSM-derived data without that block.
    ctx.add_basemap(ax, crs=nodes_3857.crs, source=ctx.providers.CartoDB.Voyager, zorder=1)
    ax.set_aspect("equal")
    ax.set_title(f"Sample nodes -- {len(nodes)} nodes")
    ax.set_axis_off()
    ax.legend(loc="lower center", ncol=2, frameon=False, bbox_to_anchor=(0.5, -0.06))
    plt.tight_layout()
    plt.savefig(out / "figure_nodes.png", dpi=300, bbox_inches="tight")
    plt.close(fig)
    print(f"\nwrote {out / 'figure_nodes.png'}")
