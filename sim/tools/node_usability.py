"""usable: True/False on every node, for any city.

Draw a polygon and the rest should follow, so nothing here may depend on an
artefact only one city happens to have. The old version did: the interior test
read `sim_profiles.npz`, which is written by a GPU pass that has only ever run
for Murray Hill, and on a missing file it returned an empty dict. That is
indistinguishable from "ran, found nothing", so the City of London was
exported, rated, described, scored and published with Bank station concourses
in it as street frontage, while this tool printed a confident "0 tunnel".

So: EVERY CHECK REPORTS WHETHER IT RAN. A check that cannot run says so and
the summary says so, because a zero and a no-op look identical in a count and
only one of them is a finding.

THE CHECKS, in the order a frame acquires them:

  listed        node ids under `excluded_nodes` in the city config. Hand
                picked, eye-checked, and final -- it is the only check that
                can act on something no measurement can see. `kept_nodes` is
                its inverse and wins over everything.

  user_pano     Google's own captures carry 22-character pano ids; user
                photospheres carry long CAoS... ids. The id format is the
                provenance record, it needs only metadata.csv, and it works
                in any city.

  interior      inside a building or station rather than on a street. Two
                implementations, whichever the frame supports:

                  profiles    sky < 2% AND classified < 78%, from
                              sim_profiles.npz. This is really a "the
                              segmenter is confused" test: it catches Murray
                              Hill's five road-tunnel bores, whose tiled
                              vaults it cannot parse, at 60-76% classified.

                              It does NOT generalise. A Tube concourse has
                              walls, doors, signage and people, so a 30-class
                              segmenter labels it confidently -- London's
                              missed interiors sit at 0.98 to 1.00 classified,
                              BETTER than the average street.

                  seg         sky < 2% AND (no sidewalk OR classified < 78%),
                              from a segmentation_results.csv. The sidewalk
                              term asks the question directly, and holds
                              however confidently the walls get labelled: on
                              the City's zero-sky nodes the median sidewalk
                              share is 0.000 inside and 0.127 on a genuine
                              covered street.

A SKY THRESHOLD ALONE WOULD BE WRONG, which is why `listed` exists. Half the
City's zero-sky nodes are real: Leadenhall Market, Change Alley, Ship Tavern
Passage, and Angel Court, which is the highest-M node in the whole study. The
automatic checks are tuned to miss rather than over-reach, and what they miss
goes to a review sheet for the eye to settle.

    .venv/Scripts/python tools/node_usability.py
    SIM_CONFIG=config_london.yaml .venv/Scripts/python tools/node_usability.py
"""
import argparse
import hashlib
import sys
from pathlib import Path

import numpy as np
import pandas as pd

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / "src"))
sys.path.insert(0, str(HERE))
from common import CFG, PROC, RAW, RES, banner
from export_svi_180 import _tunnel_nodes, TUNNEL_MAX_SKY, TUNNEL_MAX_MASS

SEG_MAX_SKY = 0.02
SEG_MAX_WALK = 0.005
SEG_MAX_MASS = 0.78
# each named list in config keeps its own reason, so the table says WHY
EXCLUDE_LISTS = {
    "viaduct": "Park Avenue viaduct deck, no sidewalk",
    "viaduct_approach": "viaduct approach ramp, leaves the straight avenue",
    "interior": "inside a building or station, not a street",
}


class Check:
    """One usability test, and whether it was able to run at all."""

    def __init__(self, name):
        self.name, self.hits, self.ran, self.note = name, {}, False, ""

    def skip(self, why):
        self.ran, self.note = False, why
        return self

    def done(self, hits, note=""):
        self.hits, self.ran, self.note = hits, True, note
        return self


def frame_fingerprint(node_ids):
    """A short hash of the frame's node ids.

    NODE IDS ARE POSITIONAL. n00659 is Globe View Walkway in the City and
    something else entirely in Murray Hill or in the next city, so a config
    list keyed on bare ids is only meaningful against the frame it was written
    for. Copy config_london.yaml as a template for city three and its 31
    interior ids will quietly exclude 31 unrelated nodes -- ids that exist, so
    nothing errors, and the wrong 31 places vanish from the study.

    The fingerprint is the check. It is cheap, it is stable under re-ordering,
    and it changes the moment the frame is rebuilt or renumbered.
    """
    h = hashlib.sha1("|".join(sorted(map(str, node_ids))).encode()).hexdigest()
    return f"{len(set(node_ids))}:{h[:10]}"


def check_listed(nodes):
    c = Check("listed")
    cfg = CFG.get("excluded_nodes", {}) or {}
    hits = {}
    for key, why in EXCLUDE_LISTS.items():
        for nid in cfg.get(key, []) or []:
            hits[nid] = why
    have = set(nodes.node_id)
    fp = frame_fingerprint(nodes.node_id)
    stated = cfg.get("frame")
    if hits and stated and stated != fp:
        raise SystemExit(
            f"excluded_nodes.frame says {stated} but this frame is {fp}. "
            f"The listed node ids were written for a different frame and are "
            f"positional -- applying them here would exclude unrelated nodes. "
            f"Re-check the list against this frame, then update the field.")
    missing = sorted(set(hits) - have)
    note = "from the city config"
    if hits and not stated:
        note += f"; frame {fp} (add it as excluded_nodes.frame to pin this)"
    if missing:
        note += f"; {len(missing)} listed id(s) NOT in this frame"
    return c.done({k: v for k, v in hits.items() if k in have}, note)


def check_user_pano(nodes):
    c = Check("user_pano")
    path = RAW / "metadata.csv"
    if not path.exists():
        return c.skip(f"no {path}")
    meta = pd.read_csv(path)
    if "pano_id" not in meta.columns:
        return c.skip("metadata.csv has no pano_id column")
    ids = meta.pano_id.astype(str)
    long = meta.loc[ids.str.len() > 22, "node_id"]
    return c.done({n: "user-contributed panorama, not a Street View capture"
                   for n in long}, "pano id longer than 22 characters")


def _seg_table(node_ids):
    """Whatever segmentation covers THIS city, as node -> shares.

    Chosen by how many of the city own nodes a candidate table contains, not
    by path. A repo accumulates smoke tests and per-model comparison runs, so
    picking the first match alphabetically found a 12-image _smoke directory
    and reported it as the city segmentation. Searched from the repo results
    root as well as the city own, because a shared tool writes to
    results/180_seg_Julian/<city>/ while RES points at results/<city>/.
    """
    want, best, seen = set(node_ids), (None, None, -1), set()
    for root in {RES, Path("results")}:
        if not root.exists():
            continue
        for q in sorted(root.rglob("segmentation_results.csv")):
            if q in seen:
                continue
            seen.add(q)
            s = pd.read_csv(q)
            need = {"sky_pct", "sidewalk_pct", "other_unknown_pct"}
            if not need <= set(s.columns):
                continue
            if "relative_path" not in s.columns:
                continue
            s["node_id"] = (s.relative_path.astype(str)
                            .str.replace("\\", "/", regex=False)
                            .str.rsplit("/", n=1).str[-1]
                            .str.split("_").str[1])
            cover = len(want & set(s.node_id))
            if cover > best[2]:
                g = s.groupby("node_id")
                best = (q, pd.DataFrame(
                    {"sky": g.sky_pct.mean(),
                     "walk": g.sidewalk_pct.mean() / 100,
                     "mass": 1 - g.other_unknown_pct.mean() / 100}), cover)
    return best[0], best[1]


def check_interior(nodes):
    c = Check("interior")
    prof = _tunnel_nodes(nodes.node_id, required=False)
    hits, how = {}, []
    if prof is not None:
        for nid, (sky, mass) in prof.items():
            hits[nid] = (f"tunnel interior (sky {sky:.1%} < {TUNNEL_MAX_SKY:.0%}"
                         f", classified {mass:.1%} < {TUNNEL_MAX_MASS:.0%})")
        how.append(f"profiles:{len(prof)}")
    path, seg = _seg_table(nodes.node_id)
    if seg is not None:
        rule = ((seg.sky < SEG_MAX_SKY)
                & ((seg.walk <= SEG_MAX_WALK) | (seg.mass < SEG_MAX_MASS)))
        for nid in seg[rule].index:
            if nid not in hits:
                r = seg.loc[nid]
                hits[nid] = (f"interior (sky {r.sky:.1%}, sidewalk "
                             f"{r.walk:.1%}, classified {r.mass:.0%})")
        how.append(f"seg:{int(rule.sum())} of {len(seg)} from "
                       f"{path.parent.name}")
    if not how:
        return c.skip("no sim_profiles.npz and no segmentation_results.csv")
    return c.done({k: v for k, v in hits.items() if k in set(nodes.node_id)},
                  " + ".join(how))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    banner("usable: True/False on every node")

    path = PROC / "nodes.csv"
    nodes = pd.read_csv(path)
    checks = [check_listed(nodes), check_user_pano(nodes),
              check_interior(nodes)]
    kept = set(CFG.get("kept_nodes", []) or [])
    if kept:
        fp = frame_fingerprint(nodes.node_id)
        stated = (CFG.get("excluded_nodes", {}) or {}).get("frame")
        if stated and stated != fp:
            raise SystemExit(
                f"kept_nodes is keyed on node ids and this config is pinned to "
                f"frame {stated}, not {fp}.")
        absent = sorted(kept - set(nodes.node_id))
        if absent:
            print(f"  !! kept_nodes lists {len(absent)} id(s) absent from this "
                  f"frame: {', '.join(absent[:6])}")

    reason = pd.Series("", index=nodes.index)
    for ch in checks:
        for i, nid in enumerate(nodes.node_id):
            if reason.iat[i] == "" and nid in ch.hits and nid not in kept:
                reason.iat[i] = ch.hits[nid]
    nodes["usable"] = reason == ""
    nodes["exclude_reason"] = reason
    if not args.dry_run:
        nodes.to_csv(path, index=False)

    print(f"{len(nodes)} nodes, {int((~nodes.usable).sum())} not usable\n")
    print(f"  {'check':<12}{'ran':>5}{'excluded':>10}   detail")
    for ch in checks:
        n_hit = int(sum(1 for r in reason if r in set(ch.hits.values())))
        got = len(set(ch.hits) & set(nodes.node_id)) if ch.ran else 0
        print(f"  {ch.name:<12}{'yes' if ch.ran else 'NO':>5}"
              f"{(got if ch.ran else 0):>10}   {ch.note}")
    for ch in checks:
        if not ch.ran:
            print(f"\n  !! the {ch.name} check DID NOT RUN ({ch.note}).")
            print(f"     Nothing is excluded on that ground. This is not the "
                  f"same as finding none, and the count above says 0 either "
                  f"way -- read the 'ran' column, not the number.")
    if kept:
        print(f"\n  {len(kept)} node(s) forced usable by kept_nodes in the "
              f"config, overriding every check above")
    print("")
    for r, k in nodes[~nodes.usable].exclude_reason.value_counts().items():
        print(f"  {k:>5}  {r[:88]}")
    if args.dry_run:
        print("\n  dry run, nodes.csv not written")


if __name__ == "__main__":
    main()
