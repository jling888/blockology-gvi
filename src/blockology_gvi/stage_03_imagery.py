"""Stage 3 -- Street View imagery for every usable node.

Four frames per node at fov=90 on the cardinal headings. Four 90-degree
frames tile the full circle exactly: no gaps, no overlap, and the solid
angle each covers is known in closed form. That matters more than it looks,
because Stage 4 integrates over an angular window rather than over whole
images -- with the circle tiled, any field of view can be measured later
from the same imagery, including the 180-degree forward view a pedestrian
actually has. Buying only the forward view would fix the FOV at purchase
time and make every later question a re-purchase.

Requests are keyed by `pano_id`, not by lat/lon. Coordinates re-resolve to
whatever panorama is nearest today, so a re-run after Google's next capture
would silently mix two dates into one node; a pano id returns the same
photograph or nothing.

THIS STAGE SPENDS MONEY. Every other stage reads what is already on disk.
It asks before starting unless assume_yes is set, and it resumes rather than
re-downloading, so an interrupted run costs nothing the second time.
"""

from pathlib import Path

import pandas as pd
import requests
from tqdm.auto import tqdm

STREETVIEW_URL = "https://maps.googleapis.com/maps/api/streetview"

HEADINGS = (0, 90, 180, 270)     # tiles the circle at fov=90
FOV = 90
PITCH = 0                        # horizon-centred; a pedestrian's eyeline
IMAGE_SIZE = 640                 # the largest size the free tier serves
COST_PER_REQUEST = 0.007         # list price, for the estimate only


def _frame_path(imagery_dir: Path, node_id: str, heading: int) -> Path:
    return imagery_dir / f"{node_id}_{heading:03d}.jpg"


def _confirm(n_requests: int, assume_yes: bool) -> None:
    """State the cost and stop, unless the caller has already agreed."""
    cost = n_requests * COST_PER_REQUEST
    print(f"\n{n_requests} requests to the Street View Static API "
          f"(${cost:.2f} at list price)")
    if assume_yes:
        return
    if input("proceed? [y/N] ").strip().lower() not in ("y", "yes"):
        raise SystemExit("cancelled -- nothing downloaded")


def _split_done_todo(meta: pd.DataFrame,
                     imagery_dir: Path) -> tuple[list[dict], pd.DataFrame]:
    """Rows already on disk, and the nodes still missing at least one frame."""
    done, todo_ids = [], []
    for node_id in meta.node_id:
        have = [(h, _frame_path(imagery_dir, node_id, h)) for h in HEADINGS]
        if all(p.exists() for _, p in have):
            done += [{"node_id": node_id, "heading": h, "path": str(p)}
                     for h, p in have]
        else:
            todo_ids.append(node_id)
    if done:
        print(f"resuming: {len(done) // len(HEADINGS)} nodes already complete, "
              f"{len(todo_ids)} to download")
    return done, meta[meta.node_id.isin(todo_ids)]


def download_imagery(meta: pd.DataFrame,
                     gmaps_key: str,
                     imagery_dir: Path,
                     assume_yes: bool = False) -> pd.DataFrame:
    """Fetch four frames per usable node; write and return the manifest.

    `meta` is Stage 2's output. Only rows it marked usable are fetched, so
    the temporal-coherence rule set there decides what this stage pays for.
    """
    usable = meta[meta.usable.astype(bool)]
    if usable.empty:
        raise AssertionError(
            "no usable nodes in metadata.csv -- Stage 2 marks a node usable "
            "only when its capture date matches the study's; check that "
            "stage's output before paying for imagery."
        )
    print(f"{len(usable)} usable nodes of {len(meta)} probed")

    done, todo = _split_done_todo(usable, imagery_dir)
    manifest = list(done)

    if todo.empty:
        print("every frame already on disk -- nothing to download")
    else:
        _confirm(len(todo) * len(HEADINGS), assume_yes)
        failed = 0
        for row in tqdm(list(todo.itertuples()), desc="imagery", mininterval=2.0):
            for heading in HEADINGS:
                path = _frame_path(imagery_dir, row.node_id, heading)
                if path.exists():
                    manifest.append({"node_id": row.node_id, "heading": heading,
                                     "path": str(path)})
                    continue
                try:
                    resp = requests.get(STREETVIEW_URL, params={
                        "pano": row.pano_id,
                        "size": f"{IMAGE_SIZE}x{IMAGE_SIZE}",
                        "heading": heading, "fov": FOV, "pitch": PITCH,
                        "key": gmaps_key,
                    }, timeout=30)
                    resp.raise_for_status()
                    path.write_bytes(resp.content)
                except Exception:
                    failed += 1
                    continue
                manifest.append({"node_id": row.node_id, "heading": heading,
                                 "path": str(path)})
        if failed:
            print(f"{failed} frame(s) failed; re-run to retry just those")

    df = pd.DataFrame(manifest).sort_values(["node_id", "heading"])
    out_path = imagery_dir / "manifest.csv"
    df.to_csv(out_path, index=False)
    n_nodes = df.node_id.nunique()
    print(f"\n{len(df)} frames across {n_nodes} nodes -> {out_path}")
    if n_nodes < len(usable):
        print(f"  {len(usable) - n_nodes} usable node(s) have no complete set "
              "of four frames and are not in the manifest")
    return df
