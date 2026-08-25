"""Free Street View coverage probe.

Checks every sampling node for panorama coverage and capture date before
spending anything on Stage 3 imagery -- this endpoint is free, so there's no
cost to probing every node up front instead of discovering gaps mid-download.
"""

from pathlib import Path

import geopandas as gpd
import pandas as pd
import requests
from tqdm.auto import tqdm

METADATA_URL = "https://maps.googleapis.com/maps/api/streetview/metadata"

NODE_SEARCH_RADIUS_M = 20  # matches the ~20m node spacing this pipeline expects nodes.gpkg to use


def _fetch_pano_metadata(lat: float, lng: float, gmaps_key: str) -> dict:
    """One Street View metadata lookup, normalized to a flat dict.

    - source="outdoor" steers away from indoor trekker coverage, since
      imagery fetches by pano_id with no source filter of its own -- this
      is the only point in the pipeline where indoor panos can be excluded.
    - radius=NODE_SEARCH_RADIUS_M caps the search to this node's own ~20 m
      cell. A node snapping to a pano from beyond that radius would be
      reporting another cell's imagery as its own; better to come back
      ZERO_RESULTS and get dropped than silently misattribute the GVI/VEI
      reading.
    """
    try:
        js = requests.get(METADATA_URL, params={
            "location": f"{lat},{lng}", "source": "outdoor",
            "radius": NODE_SEARCH_RADIUS_M, "key": gmaps_key,
        }, timeout=15).json()
    except Exception as e:
        js = {"status": "ERROR", "error": str(e)}
    return {
        "status": js.get("status"),
        "pano_id": js.get("pano_id"),
        "pano_date": js.get("date"),
        "pano_lat": (js.get("location") or {}).get("lat"),
        "pano_lon": (js.get("location") or {}).get("lng"),
    }


def _split_done_todo(ckpt: Path, nodes: gpd.GeoDataFrame) -> tuple[list[dict], gpd.GeoDataFrame]:
    """Reuse already-OK rows from a prior run at `ckpt`; return (their raw
    records, the remaining nodes still needing a probe).
    """
    if not ckpt.exists():
        return [], nodes
    raw_cols = ["node_id", "status", "pano_id", "pano_date", "pano_lat", "pano_lon"]
    prev = pd.read_csv(ckpt)
    done = prev[prev.status.eq("OK")]
    todo = nodes[~nodes.node_id.isin(done.node_id)]
    print(f"resuming: {len(done)} nodes already OK, {len(todo)} to probe")
    return done[raw_cols].to_dict("records"), todo


def _raise_no_usable_nodes(meta: pd.DataFrame) -> None:
    """Diagnose why probe_metadata found no panorama coverage, then raise."""
    counts = meta.status.value_counts()
    print("\n" + "=" * 66)
    print(f"ERROR: metadata probe found 0 usable nodes out of {len(meta)}")
    print("Status breakdown:")
    for status, n in counts.items():
        print(f"  {status:<20} {n}")
    if (meta.status == "REQUEST_DENIED").any():
        print("\nLikely cause: Street View Static API not enabled on this key, "
              "or no billing account.\nFix: console.cloud.google.com > APIs & Services > Library.")
    elif (meta.status == "ZERO_RESULTS").all():
        print("\nLikely cause: the study area is almost certainly wrong.\n"
              "Fix: check nodes/nodes.gpkg / nodes/figure_nodes.png against the real map.")
    print("=" * 66)
    raise RuntimeError("No usable nodes -- fix the above before continuing.")


def probe_metadata(nodes: gpd.GeoDataFrame, gmaps_key: str, out: Path,
                    force: bool = False) -> pd.DataFrame:
    """Free metadata probe for coverage and capture date.

    Resumable: a node whose last probe came back "OK" is trusted and
    skipped; anything else (missing, REQUEST_DENIED, ERROR, ...) is
    re-queried. It's a free endpoint, so there's no cost to retrying a
    transient failure -- e.g. a billing/API change that hadn't finished
    propagating yet.

    `force=True` ignores metadata.csv entirely and re-probes every node,
    overwriting it -- e.g. after changing `radius`/`source`, where a prior
    "OK" was against different search parameters and shouldn't be trusted.

    "usable" nodes are those matching the single most common capture date
    among this area's coverage -- restricting to one capture drive buys
    temporal coherence across nodes, and the largest one needs the fewest
    nodes dropped to get it.
    """
    ckpt = out / "metadata.csv"

    meta_rows, todo = ([], nodes) if force else _split_done_todo(ckpt, nodes)
    for _, r in tqdm(todo.iterrows(), total=len(todo), desc="metadata", mininterval=2.0):
        meta_rows.append({"node_id": r.node_id, **_fetch_pano_metadata(r.lat, r.lng, gmaps_key)})

    meta = pd.DataFrame(meta_rows)
    # Explicit format -- dateutil's fallback parsing will happily misread a
    # date and shift the whole filter without telling you.
    dt = pd.to_datetime(meta.pano_date, format="%Y-%m", errors="coerce")
    # Nullable Int64, not plain int -- a NaT date (missing/unparseable, e.g.
    # a non-OK status) would otherwise silently upgrade the whole column to
    # float64, printing every year/month as "2026.0" instead of "2026".
    meta["month"] = dt.dt.month.astype("Int64")
    meta["year"] = dt.dt.year.astype("Int64")

    ok = meta.status.eq("OK")
    recommended = meta.loc[ok, "pano_date"].value_counts().idxmax() if ok.any() else None
    meta["usable"] = ok & meta.pano_date.eq(recommended)
    # typology (avenue/mid_block) drives imagery.py's camera-aiming
    # heuristic -- derived from street_category in pipeline/nodes.py's load_nodes().
    meta = meta.merge(nodes[["node_id", "osm_name", "typology"]], on="node_id", how="left")

    meta.to_csv(ckpt, index=False)

    print(meta.status.value_counts().to_string())
    print(f"\nrecommended capture {recommended}: {meta.usable.sum()} / {len(meta)} nodes")
    print(f"cost: ${meta.usable.sum() * 6 * 0.007:.2f}")
    print("\ntypology split of the analytic sample:")
    print(meta[meta.usable].groupby("typology").size().to_string())
    print("\nall available captures (for the sample-flow paragraph):")
    print(pd.crosstab(meta.loc[ok, "year"], meta.loc[ok, "month"]).to_string())

    if meta.usable.sum() == 0:
        _raise_no_usable_nodes(meta)

    return meta
