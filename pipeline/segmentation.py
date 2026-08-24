"""Segmentation stage -- delegates to segmentation/cat-seg/ (CAT-Seg) as a
subprocess rather than importing it, since detectron2 and the CAT-Seg
repo are heavy, GPU-bound, and only needed here. segmentation/ is
model-agnostic on purpose -- this has already swapped models once (CLIPSeg
-> CAT-Seg) and may again, and each model gets its own sibling subfolder
there rather than sharing one flat directory. See
segmentation/cat-seg/README.md.

Two backends: `run_local` runs setup + inference on this machine (same
interpreter/venv, via sys.executable) -- needs a local GPU and pulls in
detectron2 on first use. `run_colab` runs
segmentation/cat-seg/run_on_colab.sh, which provisions a Google Colab GPU
session instead -- the images (and, for node_id-linked metrics,
raw_manifest.csv) must already be manually uploaded to Google Drive
first, since `colab drivemount` only mounts existing Drive content.
"""

import subprocess
import sys
from pathlib import Path

CATSEG_DIR = Path(__file__).resolve().parents[1] / "segmentation" / "cat-seg"


def run_local(images_dir: Path, manifest_path: Path, out_dir: Path,
              checkpoint_dir: Path, force: bool) -> None:
    print(f"local CAT-Seg backend -- installs detectron2 and downloads the "
          f"checkpoint into {checkpoint_dir} on first use; a local GPU is "
          f"strongly recommended (falls back to slow CPU otherwise).")
    repo_dir = checkpoint_dir / "CAT-Seg"
    subprocess.run([
        sys.executable, str(CATSEG_DIR / "setup_catseg.py"),
        "--repo-dir", str(repo_dir),
        "--checkpoint-dir", str(checkpoint_dir),
    ], check=True)

    cmd = [
        sys.executable, str(CATSEG_DIR / "run_inference.py"),
        "--repo-dir", str(repo_dir),
        "--checkpoint", str(checkpoint_dir / "model_large.pth"),
        "--vocab", str(CATSEG_DIR / "vocabulary.json"),
        "--images-dir", str(images_dir),
        "--out-dir", str(out_dir),
        "--manifest", str(manifest_path),
    ]
    if force:
        cmd.append("--force")
    subprocess.run(cmd, check=True)


def run_colab(seg_dir: Path, images_dir: str | None, checkpoint_dir: str | None,
              out_dir: str | None) -> None:
    print(
        "colab CAT-Seg backend -- this requires the images (and, for "
        "node_id-linked metrics, output/imagery/raw_manifest.csv) to already "
        "be manually uploaded to Google Drive yourself; `colab drivemount` "
        "only mounts existing Drive content, it cannot pull from local "
        "disk. See segmentation/cat-seg/README.md before continuing."
    )
    # run_on_colab.sh's positional args default via bash's ${1:-default},
    # which treats "" the same as unset -- passing "" for an unset override
    # lets the script fall back to its own baked-in Drive paths. seg_dir is
    # always passed as local_out_dir so pixel_counts.csv lands exactly where
    # the metrics stage reads it, no manual `cp` step needed.
    subprocess.run([
        str(CATSEG_DIR / "run_on_colab.sh"),
        images_dir or "", checkpoint_dir or "", out_dir or "", str(seg_dir),
    ], check=True)
