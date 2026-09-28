"""
STEP 12B — Qwen runner for Teacher-Orthogonal sensitivity Arm A.

This is an isolated companion to tools/sim_vlm_run.py.

It deliberately preserves the team's existing Qwen measurement instrument:
- same Qwen/Qwen2-VL-7B-Instruct model
- same FIELDS registry
- same seven-rung prompts
- same one-field-per-call batched-per-image inference
- same next-token probability readout
- same EV / rounded rung / argmax / p1..p7 logic

The ONLY methodological change is image protocol provenance:
input frames are the Step 12A orthogonal 90° renders
(O000/O090/O180/O270), not the team's walk-relative L/R renders.

Default output:
    results/tables/sim_vlm_orthogonal_v1.csv

The original:
    results/tables/sim_vlm_v3.csv
is never modified by this script.

Smoke test:
    .venv-gpu/Scripts/python tools/sim_vlm_run_orthogonal.py \
        --sample 12 --restart

Full run:
    .venv-gpu/Scripts/python tools/sim_vlm_run_orthogonal.py

Resume interrupted run:
    .venv-gpu/Scripts/python tools/sim_vlm_run_orthogonal.py

IMPORTANT
---------
This produces sensitivity-study Arm A. It does not declare the teacher and team
orientation protocols equivalent and does not unlock Paper Assembly.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import numpy as np
import pandas as pd

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / "src"))

from common import PROC, RES, banner
from sim_fields import FIELDS, SYSTEM, prompt
from sim_scale import prompt7
from mast import erase_mast


MODEL = "Qwen/Qwen2-VL-7B-Instruct"
MAX_PIXELS = 1024 * 28 * 28

# Step 12A naming:
#   001_n00045_N_O000.jpg
#   001_n00045_E_O090.jpg
#   001_n00045_S_O180.jpg
#   001_n00045_W_O270.jpg
NAME_ORTHO = re.compile(
    r"(\d+)_(n\d+)_([NESW])_(O(?:000|090|180|270))\.jpg$",
    re.IGNORECASE,
)

ORDER = list(FIELDS)

VIEW_PROTOCOL = "teacher_orthogonal_candidate_90"
ORIENTATION_ARM = "A"
MAST_CALIBRATION_SET = "svi_90"


def one(txt, field):
    """Compatibility helper retained from the team runner."""
    m = re.search(r"\{.*\}", txt, re.S)

    if m:
        try:
            v = json.loads(m.group()).get(field)

            if isinstance(v, dict):
                v = v.get("score", v.get("value"))

            return float(v)
        except Exception:
            pass

    m = re.search(r"\b([1-7])\b", txt)
    return float(m.group(1)) if m else np.nan


def dist(d, field):
    """Stored p1..p7 distribution as an n x 7 probability array."""
    return d[
        [f"{field}_p{k}" for k in range(1, 8)]
    ].to_numpy(float)


def offset_degrees(side: str) -> int:
    value = side.upper()

    mapping = {
        "O000": 0,
        "O090": 90,
        "O180": 180,
        "O270": 270,
    }

    if value not in mapping:
        raise ValueError(
            f"Unrecognized orthogonal side token: {side}"
        )

    return mapping[value]


def column_order(fields):
    """
    Preserve the teammate full-schema ordering, with three extra provenance
    columns inserted after the standard identity fields.

    Existing downstream readers that use column names rather than positions
    remain compatible.
    """
    ident = [
        "file",
        "street",
        "walk",
        "seq",
        "node_id",
        "cardinal",
        "side",
        "view_protocol",
        "orientation_arm",
        "view_center_offset_from_street_axis_degrees",
    ]

    return (
        ident
        + list(fields)
        + [f + "_ev" for f in fields]
        + [f + "_argmax" for f in fields]
        + [
            f"{f}_p{k}"
            for f in fields
            for k in range(1, 8)
        ]
    )


def index(src: Path) -> pd.DataFrame:
    """
    Index only Step 12A orthogonal images.

    Expected directory form:
        <src>/<street>/orthogonal/<file>.jpg

    `walk` is intentionally stored as "orthogonal" for compatibility with the
    teammate CSV identity schema. `side` stores O000/O090/O180/O270 rather than
    inventing L/R labels.
    """
    rows = []

    for jpg in sorted(Path(src).rglob("*.jpg")):
        match = NAME_ORTHO.search(jpg.name)

        if not match:
            continue

        side = match.group(4).upper()

        rows.append(
            {
                "file": str(
                    jpg.relative_to(src)
                ).replace("\\", "/"),
                "src_path": jpg,
                "street": jpg.parent.parent.name,
                "walk": jpg.parent.name,
                "seq": int(match.group(1)),
                "node_id": match.group(2),
                "cardinal": match.group(3).upper(),
                "side": side,
                "view_protocol": VIEW_PROTOCOL,
                "orientation_arm": ORIENTATION_ARM,
                "view_center_offset_from_street_axis_degrees":
                    offset_degrees(side),
            }
        )

    return pd.DataFrame(rows)


def main():
    global ORDER

    parser = argparse.ArgumentParser(
        description=(
            "Run the existing Qwen 7-rung SIM instrument on "
            "Step 12A teacher-orthogonal 90° frames."
        )
    )

    parser.add_argument(
        "--src",
        type=Path,
        default=Path("data/raw/svi_90_orthogonal"),
    )

    parser.add_argument(
        "--table",
        type=Path,
        default=(
            RES
            / "tables"
            / "sim_vlm_orthogonal_v1.csv"
        ),
    )

    parser.add_argument(
        "--mast-set",
        default=MAST_CALIBRATION_SET,
        help=(
            "mast calibration set. Default is svi_90 because "
            "orthogonal Arm A uses the same 90° frame geometry."
        ),
    )

    parser.add_argument(
        "--sample",
        type=int,
        default=None,
    )

    parser.add_argument(
        "--seed",
        type=int,
        default=7,
    )

    parser.add_argument(
        "--checkpoint",
        type=int,
        default=25,
    )

    parser.add_argument(
        "--restart",
        action="store_true",
    )

    parser.add_argument(
        "--anchors",
        default="7",
        choices=["2", "7"],
        help=(
            "Keep 7 for the validated seven-rung instrument. "
            "2 is retained only for comparison with the team runner."
        ),
    )

    parser.add_argument(
        "--fields",
        nargs="+",
        default=None,
        help=(
            "Rerun only named fields; output contains only those fields "
            "plus identity/provenance columns."
        ),
    )

    parser.add_argument(
        "--show-prompts",
        action="store_true",
    )

    args = parser.parse_args()

    if args.fields:
        bad = [
            field
            for field in args.fields
            if field not in FIELDS
        ]

        if bad:
            sys.exit(
                f"unknown field(s): {bad}"
            )

        ORDER = list(args.fields)

        print(
            "rerunning "
            f"{len(ORDER)} field(s) only: "
            + ", ".join(ORDER)
        )

    if args.show_prompts:
        ask = (
            prompt7
            if args.anchors == "7"
            else prompt
        )

        banner(
            "orthogonal Arm A prompts "
            f"as sent, --anchors {args.anchors}"
        )

        print("SYSTEM\n" + SYSTEM + "\n")

        for field in ORDER:
            twin = (
                FIELDS[field][3]
                or "no measured counterpart"
            )

            print("-" * 72)
            print(
                f"{field}   "
                f"[{FIELDS[field][2]}]   "
                f"twin: {twin}\n"
            )
            print(
                ask(field) + "\n"
            )

        return

    banner(
        "Qwen SIM ratings — "
        "Teacher-Orthogonal sensitivity Arm A"
    )

    files = index(args.src)

    if files.empty:
        sys.exit(
            "no Step 12A orthogonal images found under "
            f"{args.src}\n"
            "Expected filenames such as "
            "001_n00045_N_O000.jpg"
        )

    print(
        f"{len(files)} images, "
        f"{files.node_id.nunique()} nodes, "
        f"{files.street.nunique()} streets"
    )

    print(
        "view protocol: "
        f"{VIEW_PROTOCOL}"
    )

    print(
        "orthogonal offsets: "
        f"{sorted(files.view_center_offset_from_street_axis_degrees.unique())}"
    )

    print(
        f"instrument fields: {len(ORDER)} "
        f"({', '.join(ORDER)})"
    )

    done = pd.DataFrame()

    if (
        args.table.exists()
        and not args.restart
    ):
        done = pd.read_csv(
            args.table
        )

        files = files[
            ~files.file.isin(
                set(done.file)
            )
        ]

        print(
            f"{len(done)} already done, "
            f"{len(files)} remaining"
        )

    if args.sample:
        metrics = pd.read_csv(
            PROC / "metrics.csv"
        )[["node_id", "GVI"]]

        files = (
            files
            .merge(
                metrics,
                on="node_id",
                how="left",
            )
            .dropna(
                subset=["GVI"]
            )
        )

        files["q"] = pd.qcut(
            files.GVI,
            4,
            labels=False,
            duplicates="drop",
        )

        per = max(
            1,
            args.sample
            // max(
                1,
                files.q.nunique(),
            ),
        )

        files = pd.concat(
            [
                group.sample(
                    min(
                        len(group),
                        per,
                    ),
                    random_state=args.seed,
                )
                for _, group
                in files.groupby("q")
            ]
        ).head(
            args.sample
        )

        print(
            "stratified smoke test: "
            f"{len(files)} images, "
            f"GVI {files.GVI.min():.1f} "
            f"to {files.GVI.max():.1f}"
        )

    if files.empty:
        print(
            "nothing to do"
        )
        return

    print(
        f"{len(files)} images x "
        f"{len(ORDER)} fields = "
        f"{len(files) * len(ORDER)} calls\n"
    )

    import torch
    from PIL import Image
    from tqdm.auto import tqdm
    from transformers import (
        AutoProcessor,
        BitsAndBytesConfig,
        Qwen2VLForConditionalGeneration,
    )

    qconfig = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16,
        bnb_4bit_use_double_quant=True,
    )

    processor = AutoProcessor.from_pretrained(
        MODEL,
        max_pixels=MAX_PIXELS,
    )

    # Preserve the teammate runner's verified batched decoding behavior.
    processor.tokenizer.padding_side = "left"

    model = (
        Qwen2VLForConditionalGeneration
        .from_pretrained(
            MODEL,
            quantization_config=qconfig,
            device_map="cuda",
        )
        .eval()
    )

    ask = (
        prompt7
        if args.anchors == "7"
        else prompt
    )

    texts = []

    for field in ORDER:
        messages = [
            {
                "role": "system",
                "content": SYSTEM,
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                    },
                    {
                        "type": "text",
                        "text": ask(field),
                    },
                ],
            },
        ]

        texts.append(
            processor.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=True,
            )
            + f'{{"{field}": '
        )

    tokenizer = processor.tokenizer

    ids = [
        tokenizer.encode(
            str(k),
            add_special_tokens=False,
        )[0]
        for k in range(1, 8)
    ]

    ks = np.arange(
        1,
        8,
    )

    mast_set = args.mast_set

    if (
        mast_set is None
        or str(mast_set).lower() == "none"
    ):
        mast_set = None
        print(
            "mast erase: DISABLED"
        )
    else:
        print(
            "mast erase: calibration set "
            f"{mast_set!r}"
        )

    out_rows = []

    for row in tqdm(
        list(files.itertuples()),
        desc="orthogonal images",
        mininterval=10.0,
    ):
        image = (
            Image
            .open(row.src_path)
            .convert("RGB")
        )

        if mast_set:
            # Orthogonal Arm A is still a 90° frame at the same px/degree and
            # vertical projection as team svi_90, so use that calibration.
            image, _ = erase_mast(
                image,
                mast_set,
            )

        inputs = processor(
            text=texts,
            images=[image] * len(ORDER),
            padding=True,
            return_tensors="pt",
        ).to("cuda")

        with torch.no_grad():
            logits = model(
                **inputs
            ).logits[:, -1, :].float()

        record = {
            "file": row.file,
            "street": row.street,
            "walk": row.walk,
            "seq": row.seq,
            "node_id": row.node_id,
            "cardinal": row.cardinal,
            "side": row.side,
            "view_protocol":
                row.view_protocol,
            "orientation_arm":
                row.orientation_arm,
            "view_center_offset_from_street_axis_degrees":
                row.view_center_offset_from_street_axis_degrees,
        }

        for index_, field in enumerate(
            ORDER
        ):
            probabilities = torch.softmax(
                logits[index_, ids],
                -1,
            ).cpu().numpy()

            probabilities = (
                probabilities
                / probabilities.sum()
            )

            ev = float(
                (
                    probabilities
                    * ks
                ).sum()
            )

            record[field] = int(
                np.clip(
                    round(ev),
                    1,
                    7,
                )
            )

            record[
                field + "_ev"
            ] = ev

            record[
                field + "_argmax"
            ] = int(
                ks[
                    probabilities.argmax()
                ]
            )

            # Preserve the teammate CSV's four-decimal storage convention.
            for k in range(7):
                record[
                    f"{field}_p{k + 1}"
                ] = round(
                    float(
                        probabilities[k]
                    ),
                    4,
                )

        out_rows.append(
            record
        )

        if (
            len(out_rows)
            % args.checkpoint
            == 0
        ):
            args.table.parent.mkdir(
                parents=True,
                exist_ok=True,
            )

            pd.concat(
                [
                    done,
                    pd.DataFrame(
                        out_rows
                    ),
                ],
                ignore_index=True,
            ).to_csv(
                args.table,
                index=False,
            )

    data = pd.concat(
        [
            done,
            pd.DataFrame(
                out_rows
            ),
        ],
        ignore_index=True,
    )

    data = data.sort_values(
        [
            "street",
            "seq",
            "side",
        ]
    )

    data = data.reindex(
        columns=[
            column
            for column
            in column_order(
                ORDER
            )
            if column in data.columns
        ]
    )

    args.table.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    data.to_csv(
        args.table,
        index=False,
    )

    print(
        f"\n{len(data)} rows -> "
        f"{args.table}\n"
    )

    print(
        "Orientation provenance:"
    )
    print(
        f"  arm: {ORIENTATION_ARM}"
    )
    print(
        f"  protocol: {VIEW_PROTOCOL}"
    )
    print(
        "  center offsets from local street axis: "
        "0°, 90°, 180°, 270°"
    )
    print(
        f"  mast calibration: {mast_set or 'disabled'}"
    )

    print(
        "\nInstrument preservation:"
    )
    print(
        f"  model: {MODEL}"
    )
    print(
        f"  fields: {len(ORDER)}"
    )
    print(
        "  readout: rung + EV + argmax + p1..p7"
    )
    print(
        "  p1..p7 storage: 4 decimals"
    )

    print(
        "\nNEXT:"
    )
    print(
        "  Do not overwrite sim_vlm_v3.csv."
    )
    print(
        "  After the Arm A CSV is complete, load it together with "
        "sim_vlm_v3.csv in the APP's Paired Orientation Analyzer."
    )


if __name__ == "__main__":
    main()
