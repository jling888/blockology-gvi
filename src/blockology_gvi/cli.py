"""Command-line entry point. Parses args and calls into stages.run_stages()
-- see stages.py for the actual pipeline.

Grid generation lives outside this package entirely (see example/ --
e.g. example/murray_hill.py) since which streets belong in a study's
sample is a per-study call, not a generic one. Run that first to produce
grid.gpkg, then point --grid at the result.
"""

import argparse
from pathlib import Path

from .stages import STAGE_NAMES, run_stages

DEFAULT_OUT = Path("out")


def _build_arg_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="blockology-gvi",
                                description="VLM streetscape pipeline.")
    p.add_argument("--out", type=Path, default=DEFAULT_OUT,
                   help="output directory (default: out)")

    p.add_argument("--grid", type=Path,
                   help="path to an already-generated grid.gpkg -- see example/ "
                        "(e.g. example/murray_hill.py) for how to build one from a "
                        "hand-drawn boundary. Required unless --stage/--from-stage "
                        "skips the 'nodes' stage entirely.")
    p.add_argument("--yes", "-y", action="store_true",
                   help="skip confirmation prompts before paid API calls")
    p.add_argument("--force", action="store_true",
                   help="ignore a stage's checkpoint and re-run it from scratch, "
                        "for whichever stage(s) support it (currently: metadata, "
                        "segmentation -- not imagery, since that's billed)")
    p.add_argument("--stage", action="append", choices=STAGE_NAMES, metavar="STAGE",
                   help=f"run only this stage (repeatable). choices: {', '.join(STAGE_NAMES)}")
    p.add_argument("--from-stage", choices=STAGE_NAMES, metavar="STAGE",
                   help="run this stage through the end, instead of every stage")
    p.add_argument("--list-stages", action="store_true",
                   help="list stages in order and exit")
    return p


def main(argv: list[str] | None = None) -> None:
    args = _build_arg_parser().parse_args(argv)

    if args.list_stages:
        for name in STAGE_NAMES:
            print(f"  {name}")
        return

    if args.stage and args.from_stage:
        raise SystemExit("--stage and --from-stage are mutually exclusive")

    if args.stage:
        names = args.stage
    elif args.from_stage:
        names = STAGE_NAMES[STAGE_NAMES.index(args.from_stage):]
    else:
        names = None  # every stage

    if (names is None or "nodes" in names) and args.grid is None:
        raise SystemExit("--grid is required to run the 'nodes' stage -- generate one "
                          "first (see example/, e.g. example/murray_hill.py)")

    run_stages(names, out_dir=args.out, grid_path=args.grid, auto_confirm=args.yes,
               force=args.force)
