"""Aggregate the segmentation stage's per-image pixel counts to per-node
GVI/VEI, and a view-share for every other class it detected.

The segmentation stage (CAT-Seg, via segmentation/cat-seg/run_inference.py --
either subprocess backend, see segmentation.py) already produces one row
per image with px_total, px_veg, px_sky, px_bldg, px_scaffold, and a
px_<class> column for every other CLASS_KEYS entry -- one model pass,
nothing left to merge across models here. This stage's only job is
grouping those six-heading rows into one row per node and turning counts
into the ratios the study reports: GVI/VEI for the headline result, a
`<class>_frac` share of the full view for everything else.

Scaffolding is reported separately (`px_scaffold`/`scaffold_frac`), not
folded into `bldg` -- a pixel is exclusively one class (CAT-Seg picks a
single winner per pixel via argmax), but scaffolding visually occludes the
facade behind it, so folding scaffold into bldg would misrepresent what's
actually visible there. See typology_contrast()'s scaffolding-sensitivity
check for how it's used.

Plain pixel counting, no geometric weighting.

    GVI = sum(px_veg) / sum(px_total) * 100%          (over 6 headings)
    VEI = sum(px_bldg) / sum(px_sky + px_bldg)         (over 6 headings)
"""

from pathlib import Path

import geopandas as gpd
import numpy as np
import pandas as pd
from scipy.stats import mannwhitneyu

N_HEADINGS = 6  # == len(imagery.OFFSETS)


def compute_node_metrics(seg_df: pd.DataFrame, nodes: gpd.GeoDataFrame, out: Path) -> gpd.GeoDataFrame:
    """Aggregate a node's six headings into GVI/VEI, plus a `<class>_frac`
    share of the full view for every other px_<class> column the
    segmentation stage recorded (sidewalk, vehicles, benches, ...).
    """
    # Only nodes with every heading enter the analysis; a partial sum biases
    # the denominator.
    complete = seg_df.groupby("node_id").size().eq(N_HEADINGS)
    keep = complete[complete].index
    sub = seg_df[seg_df.node_id.isin(keep)]

    px_cols = [c for c in sub.columns if c.startswith("px_")]
    agg = sub.groupby("node_id")[px_cols].sum().reset_index()

    agg["GVI"] = agg.px_veg / agg.px_total * 100
    agg["VEI"] = agg.px_bldg / (agg.px_sky + agg.px_bldg).replace(0, np.nan)
    for col in px_cols:
        if col in ("px_total", "px_veg", "px_sky", "px_bldg"):
            continue
        agg[col[len("px_"):] + "_frac"] = agg[col] / agg.px_total

    metrics = (nodes[["node_id", "lat", "lon", "osm_name", "typology", "geometry"]]
               .merge(agg, on="node_id"))
    metrics = gpd.GeoDataFrame(metrics, geometry="geometry", crs=nodes.crs)

    print(f"{len(metrics)}/{nodes.node_id.nunique()} nodes complete (all {N_HEADINGS} headings)")
    print(metrics[["GVI", "VEI"]].describe().round(3).to_string())
    metrics.to_file(out / "metrics.gpkg", driver="GPKG")
    metrics.drop(columns="geometry").to_csv(out / "metrics.csv", index=False)
    assert len(metrics) > 0, "No complete nodes -- check the segmentation stage output."
    return metrics


def typology_contrast(df: pd.DataFrame, label: str) -> None:
    print(f"\n--- {label} (n={len(df)}) ---")
    print(df.groupby("typology")[["GVI", "VEI"]]
            .agg(["mean", "std", "count"]).round(3).to_string())
    for m in ["GVI", "VEI"]:
        a = df.loc[df.typology.eq("avenue"), m].dropna()
        b = df.loc[df.typology.eq("mid_block"), m].dropna()
        if len(a) < 5 or len(b) < 5:
            print(f"{m}: insufficient n ({len(a)} vs {len(b)})")
            continue
        u, p = mannwhitneyu(a, b)
        # rank-biserial effect size -- report this, not just the p-value
        r = 1 - (2 * u) / (len(a) * len(b))
        print(f"{m}: U={u:.0f}  p={p:.2e}  rank-biserial r={r:+.3f}")


def run_typology_contrast(metrics: gpd.GeoDataFrame) -> None:
    """Avenue vs mid-block contrast, with a scaffolding sensitivity check."""
    typology_contrast(metrics, "full sample")

    # Scaffolding segments as building and inflates VEI, so the contrast is
    # repeated on nodes largely free of it. If the effect holds in both,
    # scaffolding is not driving the result.
    clean = metrics[metrics.scaffold_frac.fillna(0) < 0.05]
    typology_contrast(clean, "scaffolding <5% of pixels")
    print(f"\nexcluded as scaffold-heavy: {len(metrics) - len(clean)} nodes")


def plot_metrics_map(metrics: gpd.GeoDataFrame, out: Path) -> None:
    """GVI and VEI plotted on a real basemap, one colored dot per node --
    a spatial sanity check (do the leafy/enclosed blocks look right?) that
    a table of numbers can't give you.
    """
    import contextily as ctx
    import matplotlib.pyplot as plt

    metrics_3857 = metrics.to_crs(3857)

    # Size the figure to the data's own aspect ratio -- a fixed guess (e.g.
    # square panels for a wide-and-short study area) leaves set_aspect("equal")
    # shrinking the plotted map well below its allotted axes box, which
    # tight_layout/bbox_inches can't compact back out.
    minx, miny, maxx, maxy = metrics_3857.total_bounds
    panel_w = 6.0
    panel_h = panel_w / ((maxx - minx) / (maxy - miny))
    # constrained (not tight_layout): tight_layout sizes spacing once, before
    # set_aspect("equal") shrinks each axes at render time, leaving a stale
    # gap above the maps; constrained layout resolves it during rendering.
    fig, axes = plt.subplots(1, 2, figsize=(2 * panel_w + 2, panel_h + 1), layout="constrained")

    for ax, col, cmap in [(axes[0], "GVI", "YlGn"), (axes[1], "VEI", "BuPu")]:
        sc = ax.scatter(metrics_3857.geometry.x, metrics_3857.geometry.y,
                         c=metrics_3857[col], cmap=cmap, s=14, zorder=3)
        # Same basemap source as nodes.py's plot_nodes -- see its
        # comment for why CartoDB, not tile.openstreetmap.org directly.
        ctx.add_basemap(ax, crs=metrics_3857.crs, source=ctx.providers.CartoDB.Voyager, zorder=1)
        ax.set_aspect("equal")
        ax.set_axis_off()
        ax.set_title(col)
        fig.colorbar(sc, ax=ax, shrink=0.6, label=col)

    fig.suptitle(f"Node metrics -- {len(metrics)} nodes")
    plt.savefig(out / "figure_metrics_map.png", dpi=300, bbox_inches="tight")
    plt.close(fig)
    print(f"wrote {out / 'figure_metrics_map.png'}")


def plot_metrics_distributions(metrics: gpd.GeoDataFrame, out: Path) -> None:
    """GVI/VEI histograms split by typology -- the same comparison
    typology_contrast() reports as a p-value, shown as a shape instead.
    """
    import matplotlib.pyplot as plt

    fig, axes = plt.subplots(1, 2, figsize=(11, 4.5))
    for ax, col in zip(axes, ["GVI", "VEI"]):
        # Same groupby order as plot_nodes's scatter, so "avenue"/"mid_block"
        # land on the same two default-cycle colors across figures.
        for t, s in metrics.groupby("typology"):
            ax.hist(s[col].dropna(), bins=25, alpha=0.6, label=t)
        ax.set_xlabel(col)
        ax.set_ylabel("nodes")
        ax.legend(frameon=False)

    fig.suptitle("GVI / VEI distribution by typology")
    plt.tight_layout()
    plt.savefig(out / "figure_metrics_distributions.png", dpi=300, bbox_inches="tight")
    plt.close(fig)
    print(f"wrote {out / 'figure_metrics_distributions.png'}")
