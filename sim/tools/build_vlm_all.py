"""One table per city, keyed on the FRAME, carrying everything about it.

This exists because of a bug that has now recurred three times in different
costumes: joining on a proxy for the thing rather than the thing.

    a fitted street axis instead of the stored heading_fwd_deg
    a filename sequence number instead of the stored seq_fwd
    node_id instead of file -- a node has TWO frames facing opposite ways, so
    it can never answer "what does this view show". The walk showed a node's
    other frame after the bearing fix and kept the first frame's description
    beside it: trees on the right, in a view with the trees on the left.

The unit of observation in this study is a HALF-VIEW, not a node and not a
street. Every measurement -- the ten ratings, the four descriptions, the
sub-indices, M -- is computed per frame. So the join key is `file`, one row
per frame, and anything that needs a node or a street groups up from here
rather than joining sideways.

WHAT IT DOES NOT DO is average. A node's two frames stay two rows. Collapsing
them is a choice each figure makes for its own reason, and burying that choice
in a shared table would hide it.

    .venv/Scripts/python tools/build_vlm_all.py
    SIM_CONFIG=config_london.yaml .venv/Scripts/python tools/build_vlm_all.py
"""
import argparse
import sys
from pathlib import Path

import pandas as pd

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / "src"))
sys.path.insert(0, str(HERE))
from common import PROC, RES, banner

# what a node contributes: identity and position, never a measurement
NODE_COLS = ["node_id", "osm_name", "street_name", "cleaned_street", "chain",
             "seq_fwd", "seq_rev", "heading_fwd_deg", "heading_rev_deg",
             "lat", "lon", "easting_m", "northing_m", "typology",
             "in_study", "usable", "exclude_reason"]


def norm(d):
    if d is not None and "file" in d.columns:
        d = d.copy()
        d["file"] = d.file.astype(str).str.replace("\\", "/", regex=False)
    return d


def pick(patterns, what):
    for pat in patterns:
        hits = sorted((RES / "tables").glob(pat))
        if hits:
            p = max(hits, key=lambda q: q.stat().st_mtime)
            print(f"  {what:<14}{p.name}")
            return norm(pd.read_csv(p))
    print(f"  {what:<14}-- none found for {patterns}")
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", type=Path, default=None)
    args = ap.parse_args()
    banner("vlm_all: one row per frame")

    calc = pick(["vlm_calculations_*.csv", "vlm_calculations.csv"],
                "calculations")
    obs = pick(["vlm_observations_*.csv", "vlm_observations.csv"],
               "observations")
    desc = pick(["vlm_descriptions_v*.csv", "vlm_descriptions_180_v*.csv",
                 "vlm_descriptions*.csv"], "descriptions")
    if obs is None:
        raise SystemExit("no observations table; nothing to key on")

    nodes = pd.read_csv(PROC / "nodes.csv")
    keep = [c for c in NODE_COLS if c in nodes.columns]
    nodes = nodes[keep]

    # OBSERVATIONS IS THE SPINE. It holds every frame that was rated,
    # including the ones set aside as unusable -- which is the widest honest
    # population. calculations drops those, so starting there would silently
    # lose the tagged rows this table exists to make visible.
    a = obs.copy()
    if "node_id" not in a.columns:
        a["node_id"] = a.file.astype(str).str.extract(r"(n\d+)")[0]
    n0 = len(a)

    if calc is not None:
        skip = {"file", "node_id", "city", "street", "walk", "side", "seq",
                "cardinal"}
        cols = [c for c in calc.columns
                if c not in skip and c not in a.columns]
        a = a.merge(calc[["file"] + cols], on="file", how="left")
    # THE FRAME'S OWN BEARING AND FACING. This is the column whose absence
    # caused the bug: nothing in any joined table said which way a frame
    # looked, so a node's two opposite views were interchangeable to every
    # consumer. With it, any join can be checked against direction as well as
    # node -- which is the point of having one table.
    fb = None
    for cand in ((RES / "tables" / "london_frame_bearings.csv"),
                 (RES / "tables" / "frame_bearings.csv")):
        if cand.exists():
            fb = norm(pd.read_csv(cand))
            print(f"  {'bearings':<14}{cand.name}")
            break
    if fb is not None:
        cols = [c for c in ("bearing", "travel", "offset_deg", "facing",
                            "source") if c in fb.columns]
        fb = fb.drop_duplicates("file")
        a = a.merge(fb[["file"] + cols].rename(
            columns={"source": "bearing_source"}), on="file", how="left")

    if desc is not None:
        cols = [c for c in desc.columns
                if c not in ("file", "node_id", "M") and c not in a.columns]
        a = a.merge(desc[["file"] + cols], on="file", how="left")
    # the observations table already carries usable / exclude_reason, and the
    # node merge would add an identical second copy. Verified equal, then
    # dropped: two columns that must agree are two chances to read the wrong
    # one, which is the whole reason this table exists.
    dupe = [c for c in nodes.columns
            if c in a.columns and c != "node_id"]
    a = a.merge(nodes.drop(columns=dupe), on="node_id", how="left")

    # WHICH RULE SET THIS FRAME'S EXPONENTS. a/b/c are in the table but the
    # reason for them is not, and there are three different reasons: an H/W
    # band, the one-sided flag (a setback with no second wall has a height and
    # no opposing wall, so the ratio is undefined rather than unmeasured), or
    # the global fallback where H/W could not be measured at all. Reading that
    # off the numbers in a spreadsheet means memorising six triples.
    if {"a", "b", "c"} <= set(a.columns):
        BANDS = [(0.8, "band <0.8 under-enclosed"),
                 (1.2, "band 0.8-1.2 human scale"),
                 (2.0, "band 1.2-2.0 transitional"),
                 (3.0, "band 2.0-3.0 enclosed"),
                 (float("inf"), "band >=3.0 deep canyon")]

        def regime(r):
            if pd.isna(r.get("a")):
                return None
            if str(r.get("HW_source", "")) == "open_one_side":
                return "one-sided setback (flagged, no H/W)"
            hw = r.get("HW_effective")
            if pd.isna(hw):
                return "no H/W measurable — global fallback"
            for hi, name in BANDS:
                if hw < hi:
                    return name
            return BANDS[-1][1]

        a["regime"] = a.apply(regime, axis=1)

    assert len(a) == n0, f"join changed row count {n0} -> {len(a)}"
    front = [c for c in ("file", "node_id", "street", "walk", "seq",
                         "seq_fwd", "seq_rev", "cardinal", "side",
                         "heading_fwd_deg", "bearing", "facing", "usable",
                         "a", "b", "c", "regime", "HW_effective",
                         "HW_source")
             if c in a.columns]
    a = a[front + [c for c in a.columns if c not in front]]

    out = args.out or (RES / "tables" / "vlm_all.csv")
    out.parent.mkdir(parents=True, exist_ok=True)
    a.to_csv(out, index=False)

    print(f"\n  {len(a)} frames x {len(a.columns)} columns")
    for name, cnt in (("with M", a.M.notna().sum() if "M" in a else 0),
                      ("with a description",
                       a.scene.notna().sum() if "scene" in a else 0),
                      ("usable", a.usable.astype(bool).sum()
                       if "usable" in a else len(a))):
        print(f"    {name:<22}{int(cnt)}")
    dup = int(a.file.duplicated().sum())
    print(f"    duplicate file keys   {dup}"
          + ("   <- the key is not unique, fix before using" if dup else ""))
    print(f"\nwrote {out}")


if __name__ == "__main__":
    main()
