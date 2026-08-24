"""Runs ON the Colab VM (via `colab exec -f`, see run_on_colab.sh) --
clones CAT-Seg, installs its dependencies, and downloads the ViT-L/14
checkpoint onto Drive if it isn't already there. Idempotent: safe to
re-run on a fresh session without re-doing finished work.
"""

import argparse
import subprocess
import sys
from pathlib import Path

REPO_URL = "https://github.com/KU-CVLAB/CAT-Seg.git"
CKPT_URL = "https://huggingface.co/spaces/hamacojr/CAT-Seg-weights/resolve/main/model_large.pth"

# cat_seg/modeling/transformer/cat_seg_predictor.py does `import open_clip`
# unconditionally, even on the ViT-L/14 path that never calls it --
# upstream's requirements.txt doesn't list it. The rest of that file (scipy,
# opencv, pillow, setuptools pinned to 2021-era versions) is left alone:
# those pins predate Colab's current Python/CUDA and forcing them risks
# breaking packages Colab's own image already relies on.
EXTRA_PACKAGES = ["ftfy", "regex", "einops", "timm", "open_clip_torch"]


def run(cmd: list[str]) -> None:
    print("+", " ".join(cmd))
    subprocess.run(cmd, check=True)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo-dir", default="/content/CAT-Seg")
    ap.add_argument("--checkpoint-dir", required=True,
                     help="Drive-mounted dir to hold model_large.pth so it persists across sessions")
    args = ap.parse_args()

    repo_dir = Path(args.repo_dir)
    if not repo_dir.exists():
        run(["git", "clone", "--depth", "1", REPO_URL, str(repo_dir)])
    else:
        print(f"{repo_dir} already present, skipping clone")

    run([sys.executable, "-m", "pip", "install", "-q",
         "git+https://github.com/facebookresearch/detectron2.git"])
    run([sys.executable, "-m", "pip", "install", "-q", *EXTRA_PACKAGES])

    ckpt_dir = Path(args.checkpoint_dir)
    ckpt_dir.mkdir(parents=True, exist_ok=True)
    ckpt_path = ckpt_dir / "model_large.pth"
    if not ckpt_path.exists():
        run(["curl", "-L", "-o", str(ckpt_path), CKPT_URL])
    else:
        print(f"{ckpt_path} already present, skipping download")

    print("setup complete:", repo_dir, ckpt_path)


if __name__ == "__main__":
    main()
