"""Re-render the London frames whose bearing was materially wrong, in place.

export_svi_180 fits ONE bearing per street from the node positions. Manhattan's
streets are straight to 0.2 degrees so that loses nothing. The City of London's
are not: Finsbury Circus is a ring whose own heading_fwd_deg sweeps 336 degrees,
and every one of its nodes was rendered facing west. The correct view of n00594
is half tree canopy; the shipped one is a corner with almost no vegetation, and
its greenery ratings were taken from that.

nodes.csv already carries heading_fwd_deg / heading_rev_deg per node, so the fix
needs no re-fetch -- the panorama is recomposed locally from the cached heading
tiles in data/london/raw/svi.

ONLY THE NODES THAT ARE ACTUALLY OFF. Per node the median error is 5.9 degrees,
and below about 15 the fitted axis IS the node's own heading to within a
fraction of the frame. Re-rendering those would change pixels for no reason and
force a re-measure of the whole city. So a threshold, and everything under it is
left alone.

IN PLACE, KEEPING THE FILENAME. The cardinal letter in the name is derived from
the bearing, so a correct re-render would rename 022_n00594_W to 018_n00594_S --
and every table in the study keys on that path. Remapping `file` across
ratings, observations, calculations, descriptions and the segmentation CSV is
five chances to lose a join for a label nobody reads. The pixels are replaced,
the name is kept, and the TRUE bearing is written to render_bearing.csv, which
is where anything needing it should look. The letter in the filename is
therefore not trustworthy for London; that is recorded in the sidecar's header
and in docs/london.md.

    .venv/Scripts/python tools/rerender_bearings.py --threshold 15 --dry-run
    .venv/Scripts/python tools/rerender_bearings.py --threshold 15
"""
import argparse
import importlib.util
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from PIL import Image

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / "src"))
sys.path.insert(0, str(HERE))
from common import banner


def _exporter():
    """Import export_svi_180 without running its argparse."""
    spec = importlib.util.spec_from_file_location(
        "_ex", HERE / "export_svi_180.py")
    m = importlib.util.module_from_spec(spec)
    sys.modules["_ex"] = m
    try:
        spec.loader.exec_module(m)
    except SystemExit:
        pass
    return m


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--nodes", type=Path,
                    default=Path("data/london/processed/nodes.csv"))
    ap.add_argument("--frames", type=Path,
                    default=Path("data/london/raw/svi_180"))
    ap.add_argument("--manifest", type=Path,
                    default=Path("data/london/processed/manifest.csv"))
    ap.add_argument("--errors", type=Path,
                    default=Path("results/tables/london_bearing_error.csv"))
    ap.add_argument("--threshold", type=float, default=15.0)
    ap.add_argument("--width", type=int, default=2880)
    ap.add_argument("--quality", type=int, default=88)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--out", type=Path,
                    default=Path("results/tables/render_bearing.csv"))
    args = ap.parse_args()
    banner(f"re-render London frames off by more than {args.threshold:.0f} deg")

    err = pd.read_csv(args.errors)
    bad = set(err.loc[err.err > args.threshold, "node"])
    n = pd.read_csv(args.nodes).set_index("node_id")
    print(f"  {len(bad)} nodes over threshold, of {len(err)} with a heading")

    # every existing frame, by node
    byname = {}
    for p in args.frames.rglob("*.jpg"):
        node = p.stem.split("_")[1]
        byname.setdefault(node, []).append(p)

    ex = _exporter()
    # the exporter reads its tile list from the city manifest,
    # keyed by node_id with a heading per row -- what _load expects
    man = pd.read_csv(args.manifest)
    by_node = {k: g for k, g in man.groupby("node_id")}

    # WHICH SENSE A WALK RUNS IN IS DECIDED ONCE, FROM THE NODES.
    #
    # The first version of this asked, per frame, which stored heading was
    # closer to the CARDINAL LETTER IN THE FILENAME. That letter is derived
    # from the fitted axis this tool exists to correct, so the tool preserved
    # the error it was written to remove: on Finsbury Circus n00578's forward
    # heading is 81 degrees and it was rendered at 261, because "_W" is nearer
    # 261. Half of every affected ring came out facing backwards and the
    # garden swapped sides mid-walk.
    #
    # The direction a walk travels is in the node positions. Order its nodes by
    # the stored traversal, take the bearing from each to the next, and compare
    # with heading_fwd_deg: agreement means the walk runs forward and every
    # frame in it takes heading_fwd_deg, disagreement means it runs reverse and
    # every frame takes heading_rev_deg. One decision per walk, no filename.
    n["run"] = n.seq_fwd + n.seq_rev
    todo, senses = [], {}
    walk_dirs = sorted({q.parent for ps in byname.values() for q in ps})
    for walk_dir in walk_dirs:
        ids = [q.stem.split("_")[1] for q in walk_dir.glob("*.jpg")]
        g = n.loc[n.index.isin(ids)].copy()
        g = g.dropna(subset=["seq_fwd", "seq_rev", "heading_fwd_deg"])
        senses[walk_dir] = "heading_fwd_deg"
        if len(g) < 2:
            continue
        keys = ["chain", "run"] if "chain" in g.columns else ["run"]
        agree = 0
        for _, gg in g.groupby(keys):
            gg = gg.sort_values("seq_fwd")
            if len(gg) < 2:
                continue
            e, no = gg.easting_m.values, gg.northing_m.values
            trav = np.degrees(np.arctan2(np.diff(e), np.diff(no))) % 360
            off = (gg.heading_fwd_deg.values[:-1] - trav + 180) % 360 - 180
            agree += int((np.abs(off) < 90).sum()) - int((np.abs(off) >= 90).sum())
        if agree < 0:
            senses[walk_dir] = "heading_rev_deg"

    # every frame of an affected walk is re-rendered, not only the ones over
    # the threshold: leaving two nodes on the old fitted bearing is what left
    # n00589 and n00590 inconsistent with the rest of their own ring
    hit_walks = sorted({q.parent for node in bad if node in byname
                        for q in byname[node]})
    for walk_dir in hit_walks:
        hcol = senses[walk_dir]
        for q in sorted(walk_dir.glob("*.jpg")):
            node = q.stem.split("_")[1]          # join key only
            if node not in n.index:
                continue
            b = float(n.loc[node, hcol])
            if b != b:
                continue
            todo.append((q, node, b, hcol))

    print(f"  {len(todo)} frames to re-render "
          f"({len({t[1] for t in todo})} nodes)")
    if args.dry_run:
        for p, node, b, hcol in todo[:8]:
            print(f"    {p.relative_to(args.frames)}  ->  {b:.1f} deg ({hcol})")
        print("  dry run, nothing written")
        return

    from tqdm.auto import tqdm

    done, failed, rows = 0, [], []
    for p, node, b, hcol in tqdm(todo, desc="frames", mininterval=5.0):
        try:
            frames = ex._load(by_node[node]) if node in by_node else None

            if frames is None:
                failed.append(node)
                continue
            img = ex.panorama(frames, b, args.width)
            Image.fromarray(img).save(p, quality=args.quality, optimize=True)
            rows.append(dict(file=str(p.relative_to(args.frames)).replace(
                "\\", "/"), node_id=node, bearing=b, source=hcol,
                rerendered=True))
            done += 1
        except Exception as e:                       # noqa: BLE001
            failed.append(f"{node}: {e}")

    if rows:
        out = pd.DataFrame(rows)
        args.out.parent.mkdir(parents=True, exist_ok=True)
        out.to_csv(args.out, index=False)
        print(f"\n  wrote {args.out} -- the TRUE bearing per re-rendered "
              f"frame.\n  The cardinal letter in the London filenames is now "
              f"stale for these\n  frames and must not be read as the "
              f"direction of view.")
    print(f"\n  {done} re-rendered, {len(failed)} failed")
    if failed:
        print("   ", failed[:6])


if __name__ == "__main__":
    main()
