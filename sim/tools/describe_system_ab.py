"""Do the system prompt's prohibitions still earn their place?

The system message forbids four things and each clause was added for a
reason seen in an answer: reading out sign text, naming companies,
speculating about season or weather, and speculating about a building's
purpose or the neighbourhood. The ground and frontage questions carry their
own "ignore the roadway / ignore vehicles" besides.

Prohibitions are not free. Every one of them is an instruction the model
spends attention on, and a list of things not to say is the same shape of
mistake as a list of things to say -- which is what the enumerated ground
prompt turned out to be. So the question is whether removing them brings the
failures back, and that is answerable rather than arguable.

    CURRENT   the four prohibitions, plus the per-question ignore clauses
    MINIMAL   "describe only what is visible" and nothing else

SCORED ON THE FAILURES THE CLAUSES WERE ADDED FOR, not on which reads better:
sign text and company names, season and weather claims, purpose and
neighbourhood claims, and -- for ground and frontage -- the roadway and its
traffic appearing in an answer about the footway or the shopfronts.

WHAT THIS CANNOT SETTLE. It measures recurrence of four named failures on a
sample. A wording that avoids all four may still be worse in ways nobody
thought to count, which is why the answers are written out in full beside the
counts rather than only summarised.

    .venv-gpu/Scripts/python tools/describe_system_ab.py --n 24
"""
import argparse
import re
import sys
from pathlib import Path

import numpy as np
import pandas as pd

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / "src"))
sys.path.insert(0, str(HERE))
from common import RES, banner
from mast import erase_mast
from sim_vlm_describe import MODEL, MAX_PIXELS, SYSTEM, QUESTIONS

MINIMAL_SYSTEM = ("You are describing a street for an urban design study. "
                  "Answer in at most two sentences. Describe only what is "
                  "visible in the image. If something asked about is absent, "
                  "say so plainly.")
MINIMAL_QUESTIONS = {
    "scene": "What is it like to walk down this street?",
    "greenery": "What vegetation is visible in this view, and where?",
    "ground": "Describe the footway.",
    "frontage": "Describe the buildings at street level.",
}
FIELDS = ["scene", "greenery", "ground", "frontage"]

# each pattern is one clause's failure, in the words the failure took
SIGN_TEXT = re.compile(r'"[^"]{2,}"|\bsign (?:that )?(?:reads|says)\b'
                       r'|\breads\s+"|\bthe words\b', re.I)
BRANDS = re.compile(r"\b(Starbucks|Duane Reade|Dunkin|CVS|Walgreens|7-Eleven|"
                    r"Chase|Citibank|FedEx|UPS|McDonald'?s|Subway|Hyatt|"
                    r"Marriott|Whole Foods|Trader Joe'?s|Amazon|Google)\b")
SEASON = re.compile(r"\b(autumn|fall|winter|spring|summer|seasons?|"
                    r"sunny|overcast|cloudy|rain(?:y|ing)?|snow)\b", re.I)
PURPOSE = re.compile(r"\b(residential|commercial|office building|apartment "
                     r"building|neighbou?rhood|district|suggest(?:s|ing)|"
                     r"likely|appears to be a)\b", re.I)
ROADWAY = re.compile(r"\b(roadway|road|traffic|vehicles?|cars?|taxi|truck|"
                     r"van|bus|parked)\b", re.I)

CHECKS = [("sign text", SIGN_TEXT, FIELDS),
          ("brand named", BRANDS, FIELDS),
          ("season/weather", SEASON, FIELDS),
          ("purpose/area", PURPOSE, FIELDS),
          ("roadway in ground", ROADWAY, ["ground"]),
          ("roadway in frontage", ROADWAY, ["frontage"])]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", type=Path, default=Path("data/raw/svi_180"))
    ap.add_argument("--n", type=int, default=24)
    ap.add_argument("--seed", type=int, default=11)
    ap.add_argument("--mast-set", default="svi_180")
    ap.add_argument("--max-new", type=int, default=110)
    ap.add_argument("--table", type=Path,
                    default=RES / "tables" / "describe_system_ab.csv")
    args = ap.parse_args()
    banner("do the prohibitions still earn their place?")

    files = sorted(args.src.rglob("*.jpg"))
    rows = [{"file": str(p.relative_to(args.src)).replace("\\", "/"), "path": p}
            for p in files]
    fl = pd.DataFrame(rows).sample(args.n, random_state=args.seed)
    print(f"{len(files)} frames, {len(fl)} sampled\n")

    import torch
    from PIL import Image
    from tqdm.auto import tqdm
    from transformers import (AutoProcessor, BitsAndBytesConfig,
                              Qwen2VLForConditionalGeneration)

    qcfg = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4",
                              bnb_4bit_compute_dtype=torch.bfloat16,
                              bnb_4bit_use_double_quant=True)
    proc = AutoProcessor.from_pretrained(MODEL, max_pixels=MAX_PIXELS)
    model = Qwen2VLForConditionalGeneration.from_pretrained(
        MODEL, quantization_config=qcfg, device_map="cuda").eval()

    VARIANTS = {"current": (SYSTEM, QUESTIONS),
                "minimal": (MINIMAL_SYSTEM, MINIMAL_QUESTIONS)}
    out = []
    for r in tqdm(list(fl.itertuples()), desc="frames", mininterval=10.0):
        im = Image.open(r.path).convert("RGB")
        if args.mast_set:
            im, _ = erase_mast(im, args.mast_set)
        rec = {"file": r.file}
        for vname, (sysmsg, qs) in VARIANTS.items():
            for f in FIELDS:
                msg = [{"role": "system", "content": sysmsg},
                       {"role": "user", "content": [{"type": "image"},
                                                    {"type": "text",
                                                     "text": qs[f]}]}]
                text = proc.apply_chat_template(msg, tokenize=False,
                                                add_generation_prompt=True)
                inp = proc(text=[text], images=[im],
                           return_tensors="pt").to("cuda")
                with torch.no_grad():
                    gen = model.generate(**inp, max_new_tokens=args.max_new,
                                         do_sample=False)
                rec[f"{vname}_{f}"] = proc.batch_decode(
                    gen[:, inp["input_ids"].shape[1]:],
                    skip_special_tokens=True)[0].strip().replace("\n", " ")
        out.append(rec)

    d = pd.DataFrame(out)
    args.table.parent.mkdir(parents=True, exist_ok=True)
    d.to_csv(args.table, index=False)
    print(f"\nwrote {args.table}\n")

    n = len(d)
    print(f"{'failure the clause was added for':<26}{'current':>10}{'minimal':>10}")
    for label, pat, fields in CHECKS:
        line = f"{label:<26}"
        for v in ("current", "minimal"):
            hit = sum(int(bool(pat.search(str(d.at[i, f'{v}_{f}']))))
                      for i in d.index for f in fields)
            line += f"{hit:>6}/{n*len(fields):<4}"
        print(line)

    # boilerplate: has the checklist phrasing gone from both?
    print()
    for v in ("current", "minimal"):
        g = d[f"{v}_ground"].astype(str)
        kerb = g.str.contains(r"kerb|curb", case=False).mean()
        print(f"  {v:<8} ground mentions a kerb: {kerb:.0%}")

    print("\nfirst three frames, in full:")
    for i in d.index[:3]:
        print(f"\n  {d.at[i, 'file']}")
        for f in FIELDS:
            print(f"    [{f}]")
            print(f"      current: {str(d.at[i, f'current_{f}'])[:150]}")
            print(f"      minimal: {str(d.at[i, f'minimal_{f}'])[:150]}")


if __name__ == "__main__":
    main()
