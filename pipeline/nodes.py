"""Stage 1 -- node sampling.

This stage is generic, city-agnostic
geometry: given whatever edges it's handed, it walks each one every
`spacing` metres, dedupes, optionally typology-labels, and plots the result
as a sanity check before any imagery is downloaded.
"""

from pathlib import Path

import geopandas as gpd
import numpy as np
import pandas as pd
from shapely.ops import linemerge

AVENUE_PATTERN = r"Ave"  # any avenue by OSM name
GRID_SPACING_M = 20  # sampling interval along street centrelines
DEDUPE_RADIUS_M = 10  # merge nodes closer than this (intersections)


def _merge_street_lines(group: gpd.GeoDataFrame) -> list:
    """One street's edges merged into continuous line(s). OSM splits a
    physical street into many short edges -- at every intersection, but
    also wherever a tag changes (lanes, speed, a highway=primary/residential
    switch mid-block, ...) -- so merging same-name edges first avoids
    restarting the walk (a sawtooth of short and long gaps) at every one of
    those splits.
    """
    lines = [g for g in group.geometry if g is not None and not g.is_empty]
    if not lines:
        return []
    merged = linemerge(lines)
    return [merged] if merged.geom_type == "LineString" else list(merged.geoms)


def _sample_line_points(name, parts: list, spacing: float) -> list[dict]:
    """Walk each merged line part every `spacing` metres, emitting one point
    record per step.
    """
    samples = []
    for line in parts:
        if line.length < 1:
            continue
        n = int(line.length // spacing)
        for i in range(n + 1):
            d = min(i * spacing, line.length)
            samples.append({
                "geometry": line.interpolate(d),
                "osm_name": name,
            })
    return samples


def _dedupe_by_grid_cell(nodes: gpd.GeoDataFrame, radius: float) -> gpd.GeoDataFrame:
    """Snap to a `radius`-metre grid and keep one point per cell -- this is
    what collapses the near-duplicate points that two different streets
    each drop close to where they actually cross.
    """
    gx = (nodes.geometry.x / radius).round().astype(int)
    gy = (nodes.geometry.y / radius).round().astype(int)
    nodes = nodes[~pd.DataFrame({"gx": gx, "gy": gy}).duplicated().values]
    return nodes.reset_index(drop=True)


def sample_nodes_from_edges(edges: gpd.GeoDataFrame, out: Path,
                             avenue_pattern: str | None = None,
                             spacing: float = GRID_SPACING_M,
                             dedupe_radius: float = DEDUPE_RADIUS_M) -> gpd.GeoDataFrame:
    """Densify `edges` to a `spacing`-metre point grid, deduplicate, and
    label typology. Fully generic and unfiltered: `edges` just needs
    `nm`/`geometry` columns, already whatever subset the caller wants
    sampled -- see example/murray_hill.py's generate_grid() for where that
    filtering happens.
    """
    samples = []
    for name, group in edges.groupby("nm", dropna=False):
        parts = _merge_street_lines(group)
        samples.extend(_sample_line_points(name, parts, spacing))

    # An empty `samples` list has no inferable geometry column -- e.g. a
    # boundary with zero matching ways -- so gpd.GeoDataFrame(samples, ...)
    # would raise instead of just producing zero nodes.
    nodes = gpd.GeoDataFrame(samples, geometry="geometry", crs=edges.crs) if samples \
        else gpd.GeoDataFrame({"geometry": [], "osm_name": []}, crs=edges.crs)
    nodes = _dedupe_by_grid_cell(nodes, dedupe_radius)
    nodes["node_id"] = [f"n{i:05d}" for i in range(len(nodes))]

    if avenue_pattern is not None:
        nodes["typology"] = np.where(
            nodes.osm_name.str.contains(avenue_pattern, case=False, na=False),
            "avenue", "mid_block",
        )

    nodes_wgs = nodes.to_crs(4326)
    nodes["lat"] = nodes_wgs.geometry.y
    nodes["lon"] = nodes_wgs.geometry.x

    nodes.to_file(out / "nodes.gpkg", driver="GPKG")
    return nodes


def sample_nodes_from_grid(out: Path, grid_path: Path,
                            avenue_pattern: str | None = AVENUE_PATTERN) -> gpd.GeoDataFrame:
    """Sample nodes at 20 m intervals over an already-generated grid.

    Purely mechanical: reads `grid_path` (driveway edges, already filtered
    to whatever streets this study wants -- see example/murray_hill.py's
    generate_grid()) and densifies/deduplicates/typology-labels it. No
    border, no OSM fetch, no filtering here -- that's all upstream, in
    generate_grid().
    """
    driveway = gpd.read_file(grid_path)
    nodes = sample_nodes_from_edges(driveway, out, avenue_pattern=avenue_pattern)

    # 6 raw Street View shots/node, one per 60-degree offset (fov 60, no
    # stitching). See imagery.py.
    print(f"\n{len(nodes)} sampling nodes -> {len(nodes) * 6} images "
          f"(est. ${len(nodes) * 6 * 0.007:.2f})")
    print()
    print(nodes.typology.value_counts().to_string())
    print()
    print(nodes.osm_name.value_counts().to_string())
    return nodes


def plot_nodes(nodes: gpd.GeoDataFrame, out: Path) -> None:
    """Plot the sample nodes, colored by typology, over a real OSM basemap
    -- a quick visual sanity check on the geometry this stage produces, before
    spending any money downloading imagery for it.
    """
    import contextily as ctx
    import matplotlib.pyplot as plt

    nodes_3857 = nodes.to_crs(3857)
    fig, ax = plt.subplots(figsize=(8, 10))

    boundary_path = out / "boundary.gpkg"
    if boundary_path.exists():
        gpd.read_file(boundary_path).to_crs(3857).boundary.plot(
            ax=ax, color="#333333", linewidth=1.2, linestyle="--", zorder=2)

    # Default color cycle, not a hand-picked palette -- deterministic
    # groupby order + a fresh axes per figure means "avenue" and
    # "mid_block" still land on the same two colors here and in
    # plot_summary_figures's scatter, with no shared color table needed.
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
