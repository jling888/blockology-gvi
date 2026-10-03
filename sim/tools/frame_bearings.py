"""The true bearing of every rendered frame, and which way it faces.

NOTHING HERE IS READ OUT OF A FILENAME except the node id, which is a join
key. The cardinal letter in a London filename is stale -- rerender_bearings
replaced pixels and kept names on purpose -- and the sequence number counts
along a fitted axis, which is what went wrong on the curved streets. Both have
now cost this study several days, so they are not consulted.

A frame's true bearing has two possible sources and both are recorded:

  RE-RENDERED frames have it in render_bearing.csv, written when the pixels
  were replaced.

  EVERY OTHER frame still carries what export_svi_180 gave it: the walk's
  fitted street axis. That is reconstructed here the same way the exporter
  computed it -- principal direction of the street's own node positions, split
  into two travel bearings -- so the number is the one actually in the pixels,
  not an assumption about them.

`facing` then compares that bearing with the direction the walk TRAVELS, taken
from the stored traversal (chain, run, seq_fwd) and the node coordinates:

  forward   the view looks along the direction of travel
  reverse   it looks back down the street

A reverse frame is NOT broken. It is a real 180-degree view of the same place
from the other side, and the rating on it is a real observation -- of that
view. It only has to be labelled, so that anything walking a street in one
direction picks the frames that face that way. Every node here has two frames
and, for 359 of the 371 checked pairs, they are ~180 degrees apart -- so both
directions already exist on disk and nothing needs re-rendering.

    .venv/Scripts/python tools/frame_bearings.py --city london
"""
import argparse
import sys
from pathlib import Path

import numpy as np
import pandas as pd

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / "src"))
sys.path.insert(0, str(HERE))
from common import RES, banner
from export_svi_180 import _street_axis, _walks


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--nodes", type=Path,
                    default=Path("data/london/processed/nodes.csv"))
    ap.add_argument("--frames", type=Path,
                    default=Path("data/london/raw/svi_180"))
    ap.add_argument("--rendered", type=Path,
                    default=RES / "tables" / "render_bearing.csv")
    ap.add_argument("--out", type=Path,
                    default=RES / "tables" / "london_frame_bearings.csv")
    args = ap.parse_args()
    banner("true bearing and facing, per frame")

    n = pd.read_csv(args.nodes)
    n["run"] = n.seq_fwd + n.seq_rev
    ni = n.set_index("node_id")

    # a missing render_bearing.csv silently makes every re-rendered frame look
    # like it still carries its fitted axis, which is exactly backwards for the
    # 742 frames whose pixels were replaced. Fail instead.
    if not args.rendered.exists():
        raise SystemExit(
            f"{args.rendered} not found. Re-rendered frames carry a bearing "
            f"that is not the fitted axis; without this file every one of them "
            f"would be mislabelled. Pass --rendered explicitly (note SIM_CONFIG "
            f"moves the default under the city's own results root).")
    known = {}
    if True:
        rb = pd.read_csv(args.rendered)
        known = dict(zip(rb.file.astype(str).str.replace("\\", "/",
                                                         regex=False),
                         rb.bearing))

    rows = []
    for p in sorted(args.frames.rglob("*.jpg")):
        rel = "/".join(p.parts[-3:])
        rows.append(dict(file=rel, street=p.parts[-3], walk=p.parts[-2],
                         node_id=p.stem.split("_")[1]))
    f = pd.DataFrame(rows)
    f = f[f.node_id.isin(ni.index)].copy()
    print(f"  {len(f)} frames on {f.node_id.nunique()} nodes, "
          f"{f.street.nunique()} streets")

    # the axis the exporter fitted, per street, and its two travel bearings
    axis_of = {}
    for st, g in f.groupby("street"):
        pos = ni.loc[g.node_id.unique(), ["easting_m", "northing_m"]].dropna()
        if len(pos) < 2:
            continue
        ax = _street_axis(pos.easting_m.values, pos.northing_m.values)
        axis_of[st] = {name: b for b, name in _walks(ax)}

    f["bearing"] = [known.get(r.file, np.nan) for r in f.itertuples()]
    f["source"] = np.where(f.bearing.notna(), "re-rendered", "fitted axis")
    miss = f.bearing.isna()
    f.loc[miss, "bearing"] = [
        axis_of.get(r.street, {}).get(r.walk, np.nan)
        for r in f[miss].itertuples()]
    print(f"  bearing from render_bearing.csv: {int((~miss).sum())}")
    print(f"  bearing from the fitted axis:    {int(miss.sum())}"
          f"   ({int(f.bearing.isna().sum())} still unknown)")

    # DIRECTION OF TRAVEL, PER WALK. The first version sorted seq_fwd
    # ascending for BOTH walk folders of a street, so north_to_south and
    # south_to_north were handed the same travel bearing and therefore chose
    # the same frames -- one of the two then ran backwards through its own
    # frontage, which is what Abchurch Lane showed. The folder name says which
    # way the walk goes and the ordering has to follow it.
    AXIS = {"north_to_south": ("northing_m", False),
            "south_to_north": ("northing_m", True),
            "east_to_west": ("easting_m", False),
            "west_to_east": ("easting_m", True)}
    trav = {}
    for (_st, _wk), g in f.groupby(["street", "walk"]):
        d = ni.loc[g.node_id.unique()].dropna(
            subset=["seq_fwd", "seq_rev", "easting_m", "northing_m"])
        if len(d) < 2:
            continue
        for _, gg in d.groupby(["chain", "run"]):
            gg = gg.sort_values("seq_fwd")
            want = AXIS.get(_wk)
            if want is not None and len(gg) > 1:
                col, asc = want
                if (gg[col].iloc[-1] > gg[col].iloc[0]) != asc:
                    gg = gg.iloc[::-1]
            e, no = gg.easting_m.values, gg.northing_m.values
            b = np.degrees(np.arctan2(np.diff(e), np.diff(no))) % 360
            b = np.append(b, b[-1])
            for nid, bb in zip(gg.index, b):
                trav[(_st, _wk, nid)] = bb
    f["travel"] = [trav.get((r.street, r.walk, r.node_id), np.nan)
                   for r in f.itertuples()]

    off = (f.bearing - f.travel + 180) % 360 - 180
    f["offset_deg"] = off.round(1)
    f["facing"] = np.where(f.offset_deg.abs() <= 90, "forward", "reverse")
    f.loc[f.offset_deg.isna(), "facing"] = "unknown"

    # WHICH FRAME A WALK SHOULD USE AT EACH NODE. Every node has two frames
    # about 180 degrees apart, so for any travel direction one of them faces
    # the right way -- it just is not always the one filed under that walk.
    # Choosing by smallest angular distance to the travel bearing needs no
    # folder and no cardinal letter.
    cand = {}
    for r in f.dropna(subset=["bearing"]).itertuples():
        cand.setdefault(r.node_id, []).append((r.file, r.bearing))
    best = []
    for r in f.dropna(subset=["travel"]).itertuples():
        opts = cand.get(r.node_id, [])
        if not opts:
            continue
        fl, bg = min(opts, key=lambda ab: abs((ab[1] - r.travel + 180)
                                              % 360 - 180))
        best.append(dict(street=r.street, walk=r.walk, node_id=r.node_id,
                         file=fl, bearing=round(bg, 1),
                         travel=round(r.travel, 1),
                         offset_deg=round(abs((bg - r.travel + 180) % 360
                                              - 180), 1),
                         swapped=fl != r.file))
    B = pd.DataFrame(best).drop_duplicates(["street", "walk", "node_id"])
    bp = args.out.with_name("london_walk_frames.csv")
    B.to_csv(bp, index=False)
    print("")
    print(f"  walk frame choice -> {bp}")
    print(f"    {len(B)} (walk, node) slots; {int(B.swapped.sum())} take the "
          f"node's OTHER frame because the filed one faces backwards")
    print(f"    residual |offset| median {B.offset_deg.median():.0f} deg, "
          f"max {B.offset_deg.max():.0f}")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    f.round(2).to_csv(args.out, index=False)
    print("")
    print(f"  {'facing':<12}{'frames':>8}{'nodes':>8}")
    for k, g in f.groupby("facing"):
        print(f"  {k:<12}{len(g):>8}{g.node_id.nunique():>8}")
    both = f[f.facing != "unknown"].groupby("node_id").facing.nunique()
    print(f"\n  nodes with BOTH a forward and a reverse frame on disk: "
          f"{int((both == 2).sum())} of {len(both)}")
    print(f"  nodes with only one sense: {int((both == 1).sum())}"
          f"   (these are the ones a directional walk cannot fill)")
    print(f"\nwrote {args.out}")


if __name__ == "__main__":
    main()
