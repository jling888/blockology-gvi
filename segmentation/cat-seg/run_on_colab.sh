#!/usr/bin/env bash
# Runs LOCALLY. One end-to-end CAT-Seg pass on a Colab L4 (via the `colab`
# CLI): provision -> mount Drive -> install CAT-Seg -> segment -> tear down
# -> download pixel_counts.csv.
#
# Usage: segmentation/cat-seg/run_on_colab.sh [imagery_dir] [checkpoint_dir] [out_dir] [local_out_dir]
# First arg is the Drive-mounted path to your uploaded output/imagery/ folder
# -- upload it wholesale (its raw/ subfolder + raw_manifest.csv sibling,
# exactly as the local pipeline writes them); images and the manifest are
# both derived from this one path. run_inference.py requires --manifest to
# exist and fails fast if it doesn't -- see that script's main().
# Second/third are also paths under Drive's mounted root; all three default
# to blockology-gvi/ in My Drive.
#
# Only pixel_counts.csv comes back locally (masks/overlays stay on Drive,
# pull via Drive sync/web) -- from /content/pixel_counts.csv, a plain-disk
# copy run_inference.py writes since Drive's FUSE mount makes the Jupyter
# Contents API download path unreliable.
#
# Billed while alive, so `cleanup` runs on any exit. Set KEEP_SESSION=1 to
# leave it up for `colab repl -s catseg` debugging. Safe to re-run --
# resumes from pixel_counts.csv.
set -euo pipefail

SESSION=catseg
IMAGERY_DIR="${1:-MyDrive/blockology-gvi/imagery}"
CHECKPOINT_DIR="${2:-MyDrive/blockology-gvi/}"
OUT_DIR="${3:-MyDrive/blockology-gvi/catseg_out}"
LOCAL_OUT_DIR="${4:-output/catseg}"
IMAGES_DIR="$IMAGERY_DIR/raw"

cd "$(dirname "$0")/../.."

TMP_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "$TMP_DIR"
  if [ "${KEEP_SESSION:-0}" != "1" ]; then
    echo "[cleanup] stopping session $SESSION"
    colab stop -s "$SESSION" || true  # harmless if colab new never succeeded
  fi
}
trap cleanup EXIT

if [ "${KEEP_SESSION:-0}" = "1" ]; then
  echo "KEEP_SESSION=1 set -- session '$SESSION' will be left running; stop it yourself with: colab stop -s $SESSION"
fi

colab new -s "$SESSION" --gpu L4
colab drivemount -s "$SESSION"
colab upload -s "$SESSION" segmentation/cat-seg/vocabulary.json /content/vocabulary.json

# Manifest sits next to raw/ inside imagery_dir, same as the local
# output/imagery/ layout. run_inference.py itself requires --manifest to exist
# and fails fast if not (see its main()) -- not re-checked here, to avoid
# duplicating that logic in two languages.
MANIFEST_PATH="/content/drive/$IMAGERY_DIR/raw_manifest.csv"

# `colab exec -f` has no argv option, so prepend a sys.argv assignment to
# the script's source and send that as the temp file instead.
exec_remote() {
  local script="$1"; shift
  local tmp="$TMP_DIR/$(basename "$script")"
  python3 -c '
import json, sys
script, tmp, args = sys.argv[1], sys.argv[2], sys.argv[3:]
with open(tmp, "w") as f:
    f.write(f"import sys\nsys.argv = {json.dumps([script] + args)}\n")
    f.write(open(script).read())
' "$script" "$tmp" "$@"
  # 30s default exec timeout is too short for detectron2 build + batch segmentation.
  colab exec -s "$SESSION" -f "$tmp" --timeout 21600
}

exec_remote segmentation/cat-seg/setup_catseg.py \
  --checkpoint-dir "/content/drive/$CHECKPOINT_DIR"

exec_remote segmentation/cat-seg/run_inference.py \
  --images-dir "/content/drive/$IMAGES_DIR" \
  --out-dir "/content/drive/$OUT_DIR" \
  --checkpoint "/content/drive/$CHECKPOINT_DIR/model_large.pth" \
  --vocab /content/vocabulary.json \
  --manifest "$MANIFEST_PATH"

mkdir -p "$LOCAL_OUT_DIR"
colab download -s "$SESSION" /content/pixel_counts.csv "$LOCAL_OUT_DIR/pixel_counts.csv"

echo "done -- $LOCAL_OUT_DIR/pixel_counts.csv (masks/overlays under Drive at $OUT_DIR/)"
