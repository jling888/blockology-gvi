"""Stage 3 -- Street View raw image download.

Billed Google Street View Static API call. Fetches by pano_id, not lat/lon,
so every shot at a node comes from the same panorama; coordinates can snap
to a different pano per heading, which would corrupt the GVI sum.

Google Street View Static API params used here:
- heading: compass direction the camera faces, 0-360 (0/360=N, 90=E,
180=S). Left unspecified, Google aims it at the input location from
the nearest pano; we set it explicitly so every shot is reproducible.
- fov (default 90): horizontal field of view in degrees, max 120 (API hard cap).
Acts as zoom on a fixed-size viewport: smaller fov = more zoomed in.
- pitch (default 0): camera's up/down angle relative to the Street
View vehicle, not always level. Positive angles up (90 = straight up),
negative angles down (-90 = straight down); PITCH stays 0 here.

Heading scheme: full 360-degree coverage, 6 shots per node at exactly
60-degree spacing (OFFSETS), one raw shot per offset -- no stitching.
Spacing equals FOV, so each shot's angular footprint exactly abuts its
neighbors: zero overlap (no pixel double-counted toward GVI) and zero gap
(no pixel missed).

Offsets are grid-relative, not absolute compass headings. GRID_BEARING
rotates them per node so offset 0 always faces along the street (the
direction of travel) and offset 180 faces back the way you came, regardless
of the street's own compass bearing -- Manhattan avenues run ~29 degrees off
true north, cross streets ~119. Summed across all 6 shots, total angular
coverage would be the same at any starting rotation, but which real-world
view each individual offset corresponds to would not be: without this
correction, "offset 0" would mean a different, typology-dependent slice of
the scene at every node. Anchoring offset 0 to the direction of travel is
what makes the shots line up with a walking pedestrian's own field of
view -- forward, behind, and to each side -- rather than an arbitrary,
incomparable slice of the compass.

Why fov=60, not wider. Street View images are a rectilinear projection: a
real-world angle theta off a shot's own center lands at a pixel position
proportional to tan(theta), so content stretches toward the edges, faster
than theta grows, as the shot's own half-angle widens. A narrower fov keeps
that stretch smaller and gives more pixels per degree of scene for
segmentation. GVI/VEI are computed as a flat pixel-count ratio (see
metrics.py for why no geometric correction is applied), so this stretch
isn't corrected after the fact -- fov=60 is the
actual mitigation, not a starting point a later stage arithmetically
cancels out.
"""

import sys
from pathlib import Path

import hashlib
import pandas as pd
import requests
from tqdm.auto import tqdm

SV_URL = "https://maps.googleapis.com/maps/api/streetview"

GRID_BEARING = {"avenue": 29, "mid_block": 119}

OFFSETS = [0, 60, 120, 180, 240, 300]  # grid-relative; 60-degree spacing == FOV -> zero overlap, zero gap

FOV = 60
PITCH = 0
IMG_SIZE = "640x640"  # Street View Static API images can be returned in any size up to 640 x 640 pixels.


def _pano_tag(pano_id: str) -> str:
    """Short, filename-safe tag derived from pano_id -- changes iff the
    panorama does, which is what makes the file path content-derived.
    """
    return hashlib.sha1(pano_id.encode()).hexdigest()[:8]


def _fetch_streetview(pano_id: str, heading: int, img_size: str, fov: int,
                       pitch: int, gmaps_key: str) -> bytes | None:
    """One Street View Static image, or None on any failure (network error,
    non-200, or a suspiciously small body -- Google's grey "no imagery"
    placeholder is a valid 200 response but far under 5 KB).
    """
    try:
        resp = requests.get(SV_URL, params={
            "pano": pano_id, "size": img_size, "heading": heading,
            "fov": fov, "pitch": pitch, "key": gmaps_key,
        }, timeout=30)
    except Exception:
        return None
    if resp.status_code != 200 or len(resp.content) < 5000:
        return None
    return resp.content


def _path_for(out: Path, r, offset: int, heading: int) -> Path:
    # typology + absolute heading are redundant with offset + street_bearing
    # (both recoverable from the manifest), but baked into the filename so
    # a folder of images can be skimmed by eye -- street type and compass
    # direction -- without opening raw_manifest.csv.
    return out / f"{r.node_id}_{r.typology}_{offset:03d}_{heading:03d}_{r.pano_tag}.jpg"


def download_imagery(meta: pd.DataFrame, gmaps_key: str, out: Path,
                      offsets: list[int] = OFFSETS,
                      img_size: str = IMG_SIZE, fov: int = FOV,
                      pitch: int = PITCH, auto_confirm: bool = False) -> pd.DataFrame:
    """Download raw Street View shots by pano_id -- one per (node, offset).
    No stitching or compositing downstream; each shot stands alone.

    Images land under out/raw/; the manifest is written to out/ itself, so a
    listing of `out` separates "one CSV to read" from "a folder of JPEGs to
    browse" instead of interleaving thousands of files with it.
    """
    raw_dir = out / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    usable = meta[meta.usable].copy()
    usable["pano_tag"] = usable.pano_id.map(_pano_tag)
    usable["street_bearing"] = usable.typology.map(GRID_BEARING)

    jobs = [(r, offset, round(r.street_bearing + offset) % 360)
            for _, r in usable.iterrows() for offset in offsets]

    # Existing JPEGs are always skipped below, so this counts only what
    # would actually be billed -- an interrupted download resumes at the
    # individual shot level instead of re-billing whatever already
    # landed on disk.
    to_fetch = sum(1 for r, offset, heading in jobs if not _path_for(raw_dir, r, offset, heading).exists())
    if to_fetch == 0:
        print("all raw imagery already on disk -- nothing to download")
    else:
        # This is a BILLED Google Maps API call
        if auto_confirm:  # --yes flag: skip the prompt for unattended runs
            print("--yes passed: proceeding without confirmation.")
        elif not sys.stdin.isatty():
            raise RuntimeError(
                "Refusing to make a paid API call in a non-interactive session "
                "without confirmation. Re-run with --yes, or run interactively."
            )
        elif input("Proceed? [y/N] ").strip().lower() not in ("y", "yes"):
            raise RuntimeError("Cancelled by user before a paid API call.")

    manifest = []
    failures = 0

    for i, (r, offset, heading) in enumerate(tqdm(jobs, desc="imagery", mininterval=2.0)):
        fp = _path_for(raw_dir, r, offset, heading)
        if not fp.exists():
            content = _fetch_streetview(r.pano_id, heading, img_size, fov, pitch, gmaps_key)
            if content is None:
                failures += 1
                continue
            fp.write_bytes(content)
        manifest.append({"node_id": r.node_id, "pano_id": r.pano_id, "pano_tag": r.pano_tag,
                          "typology": r.typology, "offset": offset, "heading": heading,
                          "path": str(fp)})

        # Checkpoint every ~50 nodes' worth of shots so a disconnect never loses the index.
        if i % (50 * len(offsets)) == 0 and manifest:
            pd.DataFrame(manifest).to_csv(out / "raw_manifest.csv", index=False)

    manifest_df = pd.DataFrame(manifest)
    manifest_df.to_csv(out / "raw_manifest.csv", index=False)
    print(f"{len(manifest_df)} raw images across {manifest_df.node_id.nunique()} nodes")
    print(f"failed requests: {failures}")
    print("on disk:", len(list(raw_dir.glob("*.jpg"))), "jpg files")
    assert len(manifest_df) > 0, "No imagery downloaded -- check the metadata probe output."
    return manifest_df
