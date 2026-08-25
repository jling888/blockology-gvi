"""Command-line entry point. Parses args and calls into pipeline.stages.run_stages()
-- see pipeline/stages.py for the actual pipeline.

Node sampling happens outside this package entirely -- point --nodes at an
already-sampled nodes.gpkg (required columns: see pipeline/nodes.py's
RAW_COLUMNS).
"""

import argparse
from pathlib import Path

from pipeline.stages import STAGE_DESCRIPTIONS, STAGE_NAMES, run_stages

DEFAULT_OUTPUT = Path("output")
DEFAULT_NODES_PATH = Path("data/nodes.gpkg")


def _epilog() -> str:
    stage_lines = "\n".join(
        f"  {i}. {name:<13} {STAGE_DESCRIPTIONS[name]}"
        for i, name in enumerate(STAGE_NAMES, 1)
    )
    return f"""\
stages, run in this order by default:
{stage_lines}

Each stage checkpoints to its output file and skips work already done, so
an interrupted run resumes rather than restarting. Use --stage to run just
one (repeatable, any order), --from-stage to run a stage through the end,
or neither to run every stage in order.

segmentation runs CAT-Seg via segmentation/cat-seg/, either on this
machine (--seg-backend local, the default -- needs a local GPU, installs
detectron2 on first use) or on a Google Colab GPU session (--seg-backend
colab -- needs images manually uploaded to Google Drive first, see
segmentation/cat-seg/README.md).
"""


def _build_arg_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="cli.py",
                                description="VLM streetscape pipeline.",
                                epilog=_epilog(),
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--out", type=Path, default=DEFAULT_OUTPUT,
                   help="output directory (default: output)")

    p.add_argument("--nodes", type=Path, default=DEFAULT_NODES_PATH,
                   help="path to an already-sampled nodes.gpkg "
                        f"(default: {DEFAULT_NODES_PATH})")
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
                   help="list stages in order with a description, and exit")

    p.add_argument("--seg-backend", choices=["local", "colab"], default="local",
                   help="segmentation compute backend (default: local). 'local' runs "
                        "CAT-Seg on this machine; 'colab' runs it on a Google Colab GPU "
                        "session and requires images to already be manually uploaded to "
                        "Google Drive -- see segmentation/cat-seg/README.md")
    p.add_argument("--seg-checkpoint-dir", type=Path, default=None,
                   help="local dir to hold the CAT-Seg repo + checkpoint weights "
                        "(--seg-backend local only; default: <out>/segmentation/checkpoint)")
    p.add_argument("--drive-images-dir", default=None,
                   help="Drive-relative images dir (--seg-backend colab only; default: "
                        "segmentation/cat-seg/run_on_colab.sh's own default)")
    p.add_argument("--drive-checkpoint-dir", default=None,
                   help="Drive-relative checkpoint dir (--seg-backend colab only; default: "
                        "segmentation/cat-seg/run_on_colab.sh's own default)")
    p.add_argument("--drive-out-dir", default=None,
                   help="Drive-relative segmentation output dir (--seg-backend colab only; "
                        "default: segmentation/cat-seg/run_on_colab.sh's own default)")
    return p


def main(argv: list[str] | None = None) -> None:
    args = _build_arg_parser().parse_args(argv)

    if args.list_stages:
        for i, name in enumerate(STAGE_NAMES, 1):
            print(f"{i}. {name} -- {STAGE_DESCRIPTIONS[name]}")
        return

    if args.stage and args.from_stage:
        raise SystemExit("--stage and --from-stage are mutually exclusive")

    if args.stage:
        names = args.stage
    elif args.from_stage:
        names = STAGE_NAMES[STAGE_NAMES.index(args.from_stage):]
    else:
        names = None  # every stage

    run_stages(names, out_dir=args.out, nodes_path=args.nodes, auto_confirm=args.yes,
               force=args.force, seg_backend=args.seg_backend,
               seg_checkpoint_dir=args.seg_checkpoint_dir,
               drive_images_dir=args.drive_images_dir,
               drive_checkpoint_dir=args.drive_checkpoint_dir,
               drive_out_dir=args.drive_out_dir)


if __name__ == "__main__":
    main()
