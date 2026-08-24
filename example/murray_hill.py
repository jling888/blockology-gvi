"""Murray Hill study preset -- boundary, cross streets specific to THIS study.

generate_grid() fetches OSM ways in the boundary, restricts them to
drivable streets, and filters by this study's keep_pattern.

Run standalone ahead of the rest of the pipeline:

    python example/murray_hill.py --out output/nodes

Then point the CLI at the resulting grid.gpkg.
"""

from pathlib import Path

import geopandas as gpd
import pandas as pd

BORDER_PATH = Path(__file__).resolve().parent / "murray_hill_border.geojson"

AVENUE_PATTERN = r"Ave"
MIDBLOCK_PATTERN = r"East\s+(?:3[4-9]|4[0-2])(?:st|nd|rd|th)\s+St"
KEEP_PATTERN = f"(?:{AVENUE_PATTERN})|(?:{MIDBLOCK_PATTERN})"
EXCLUDE_HIGHWAY_NAME = r"(?:Tunnel|Ramp|Viaduct|Bridge|Expressway)"

DRIVEWAY_HIGHWAY_PATTERN = r"(?:motorway|trunk|primary|secondary|tertiary|unclassified|residential|service|living_street)"


def _norm_name(v) -> str:
    """OSM returns a list for edges with several names -- string-compare that
    directly and it silently fails.
    """
    if isinstance(v, list):
        return " | ".join(str(x) for x in v)
    return str(v) if pd.notna(v) else ""


def _stringify_list_columns(edges: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """simplify=True leaves merged-edge attributes (osmid, reversed, ...) as
    lists, which GPKG can't store -- stringify instead of dropping them.
    """
    for col in edges.columns:
        if col != "geometry" and edges[col].dtype == object \
                and edges[col].map(lambda v: isinstance(v, list)).any():
            edges[col] = edges[col].map(_norm_name)
    return edges


def _normalize_and_clip_edges(edges: gpd.GeoDataFrame, polygon) -> gpd.GeoDataFrame:
    """Normalize raw osmnx edges into a clipped, GPKG-safe table: real
    columns instead of a u/v/key MultiIndex, a plain-string `nm` name, no
    list-valued cells, and geometry clipped to `polygon`.
    """
    edges = edges.reset_index()
    edges["nm"] = edges["name"].map(_norm_name)
    edges = _stringify_list_columns(edges)

    # Clip (not just filter by intersects) so a street partly outside the
    # polygon isn't sampled out there. explode() splits any resulting
    # MultiLineString back into one LineString per row, as sample_nodes_from_edges() expects.
    edges["geometry"] = edges.intersection(polygon)
    return edges[~edges.is_empty].explode(index_parts=False).reset_index(drop=True)


def fetch_and_export_streets(out: Path, border_path: Path) -> gpd.GeoDataFrame:
    """Fetch every OSM way inside a hand-drawn boundary, print highway-type
    counts, and export the drivable subset (DRIVEWAY_HIGHWAY_PATTERN) to
    streets_driveway.gpkg.

    `border_path` is a hand-drawn polygon file (GeoJSON/GPKG/shapefile, e.g.
    from QGIS) -- this function only reads, fetches, and clips it. No
    default; see BORDER_PATH above for this study's own.
    """
    import osmnx as ox

    if not border_path.exists():
        raise FileNotFoundError(
            f"{border_path} not found -- draw the study-area boundary in QGIS "
            "(or any GIS tool), export it as a polygon file, and point "
            "generate_grid's/fetch_and_export_streets's border_path argument at it."
        )

    border = gpd.read_file(border_path)
    polygon_wgs84 = border.to_crs(4326).union_all()
    polygon = border.to_crs(32618).union_all()
    gpd.GeoDataFrame(geometry=[polygon], crs=32618).to_file(
        out / "boundary.gpkg", driver="GPKG")

    ox.settings.use_cache = True
    graph = ox.graph_from_polygon(polygon_wgs84, network_type="all", simplify=True)
    edges = _normalize_and_clip_edges(
        ox.graph_to_gdfs(graph, nodes=False, edges=True).to_crs(32618), polygon)

    print("highway types in study area:")
    print(edges.highway.astype(str).value_counts().to_string())

    driveway = edges[edges.highway.str.contains(DRIVEWAY_HIGHWAY_PATTERN, case=False, na=False)]
    driveway.to_file(out / "streets_driveway.gpkg", driver="GPKG")

    print(f"\nstudy area: {polygon.area / 1e6:.3f} km2 -- {len(edges)} ways total, "
          f"{len(driveway)} driveway")
    return driveway


def _drop_reversed_duplicates(edges: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """Drop the second copy of a bidirectional OSM way (two directed edges,
    same centerline, reversed). normalize() makes an exact reverse compare equal.
    """
    norm_key = edges.geometry.apply(lambda g: g.normalize().wkb)
    return edges[~norm_key.duplicated()]


def _filter_edges(edges: gpd.GeoDataFrame, keep_pattern: str | None,
                   exclude_pattern: str | None) -> gpd.GeoDataFrame:
    """Keep only names matching `keep_pattern`, then drop names matching `exclude_pattern`."""
    if keep_pattern is not None:
        edges = edges[edges.nm.str.contains(keep_pattern, case=False, na=False)]
    if exclude_pattern is not None:
        edges = edges[~edges.nm.str.contains(exclude_pattern, case=False, na=False)]
    return edges


def plot_grid(grid: gpd.GeoDataFrame, out: Path) -> None:
    """Plot the filtered grid edges over a real OSM basemap -- a quick visual
    sanity check on which streets survived keep_pattern/exclude_pattern,
    before sampling nodes along them. Same basemap/style as
    nodes.plot_nodes so the two figures read as one series.
    """
    import contextily as ctx
    import matplotlib.pyplot as plt

    grid_3857 = grid.to_crs(3857)
    fig, ax = plt.subplots(figsize=(8, 10))

    boundary_path = out / "boundary.gpkg"
    if boundary_path.exists():
        gpd.read_file(boundary_path).to_crs(3857).boundary.plot(
            ax=ax, color="#333333", linewidth=1.2, linestyle="--", zorder=2)

    grid_3857.plot(ax=ax, color="#1f77b4", linewidth=1.5, zorder=3)

    ctx.add_basemap(ax, crs=grid_3857.crs, source=ctx.providers.CartoDB.Voyager, zorder=1)
    ax.set_title(f"Grid -- {len(grid)} edges")
    ax.set_axis_off()
    plt.tight_layout()
    plt.savefig(out / "figure_grid.png", dpi=300, bbox_inches="tight")
    plt.close(fig)


def generate_grid(out: Path, border_path: Path = BORDER_PATH,
                   keep_pattern: str | None = KEEP_PATTERN,
                   exclude_pattern: str | None = EXCLUDE_HIGHWAY_NAME,
                   ) -> gpd.GeoDataFrame:
    """This study's grid: fetch OSM ways in the boundary, restrict to
    drivable streets, and filter to `keep_pattern` minus `exclude_pattern`.
    All "which streets count" decisions live here. Writes grid.gpkg.
    nodes.sample_nodes_from_grid reads it and does the actual point
    sampling. Returns driveway_edges.
    """
    driveway = fetch_and_export_streets(out, border_path)

    driveway = _drop_reversed_duplicates(driveway)
    driveway = _filter_edges(driveway, keep_pattern, exclude_pattern)
    driveway.to_file(out / "grid.gpkg", driver="GPKG")

    plot_grid(driveway, out)

    return driveway


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Generate the Murray Hill study's sampling grid (grid.gpkg).")
    parser.add_argument("--out", type=Path, default=Path(__file__).resolve().parent / "output",
                         help="output directory for grid.gpkg (default: example/output)")
    parser.add_argument("--border", type=Path, default=BORDER_PATH,
                         help="path to the study-area boundary polygon "
                              "(default: example/murray_hill_polygon.geojson)")
    args = parser.parse_args()

    args.out.mkdir(parents=True, exist_ok=True)
    driveway = generate_grid(args.out, args.border)
    print(f"\nwrote {args.out / 'grid.gpkg'} ({len(driveway)} driveway edges)")
