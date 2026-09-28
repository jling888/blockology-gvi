"""Source-backed adapter for the frozen v1.5.7.1 VM runner.

This file does not reimplement the research segmentation algorithm. It loads the
pinned upstream ``segmentation_local.py`` and executes only the import/runtime
prefix through the end of ``process_one_image``. The batch loop is deliberately
not executed. Models therefore load once per worker process and are reused for
all requests.
"""
from __future__ import annotations

import base64
import hashlib
import os
import re
import shutil
import subprocess
import threading
import uuid
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image

CONTRACT_VERSION = "public_vm_contract_v1"
SOURCE_REPOSITORY = "guanyupan2002-png/Street-View-Semantic-Segmentation"
SOURCE_COMMIT = "ba4a14731074e744d798956d0f38493c19c773cd"
SOURCE_BLOB = "804dd7e287becd464c8716626a69d7df54bf3924"
TAXONOMY_VERSION = "street_interface_v1.5.7.1"
CLASS_COUNT = 30
IGNORE_INDEX = 255
MAX_IMAGE_BYTES = 15 * 1024 * 1024

CLASS_NAMES = {
    0: "other_unknown",
    1: "roadway",
    2: "sidewalk",
    3: "bike_lane",
    4: "curb_edge",
    5: "upper_building_facade",
    6: "ground_floor_solid_facade",
    7: "ground_floor_glazing",
    8: "door_entrance",
    9: "signboard",
    10: "awning_canopy",
    11: "arcade_column",
    12: "arcade_soffit",
    13: "sidewalk_shed_scaffold",
    14: "stoop_stair",
    15: "wall_ledge",
    16: "fence_railing",
    17: "planter_container",
    18: "tree",
    19: "shrub_hedge",
    20: "ground_vegetation",
    21: "vertical_green_wall",
    22: "bench_seating",
    23: "pole_fixture",
    24: "traffic_sign_signal",
    25: "person",
    26: "vehicle",
    27: "sky",
    28: "upper_building_glazing",
    29: "traffic_cone_barrel",
}

MODEL_IDS = {
    "ade": "nvidia/segformer-b5-finetuned-ade-640-640",
    "mapillary": "facebook/mask2former-swin-large-mapillary-vistas-semantic",
    "groundingDino": "IDEA-Research/grounding-dino-base",
    "sam2": "facebook/sam2.1-hiera-small",
}

IMPORT_CUTOFF_MARKER = "# %% [markdown] Cell 16"


class VmSourceError(RuntimeError):
    pass


def _git_blob_sha1(content: bytes) -> str:
    header = f"blob {len(content)}\0".encode("utf-8")
    return hashlib.sha1(header + content).hexdigest()


def _safe_id(value: str) -> str:
    value = re.sub(r"[^A-Za-z0-9_-]+", "_", value).strip("_")
    return value[:96] or uuid.uuid4().hex


def _b64(path: Path | None) -> str | None:
    if path is None or not path.exists():
        return None
    return base64.b64encode(path.read_bytes()).decode("ascii")


class SourceBackedVmRuntime:
    """One warm CUDA runtime per process; inference is serialized by design."""

    def __init__(self) -> None:
        default_source = Path(__file__).resolve().parent.parent / "vendor" / "Street-View-Semantic-Segmentation" / "segmentation_local.py"
        self.source_file = Path(
            os.environ.get("VM_SEGMENTATION_SOURCE_FILE", str(default_source))
        ).expanduser().resolve()
        self.source_repo_dir = Path(
            os.environ.get("VM_SOURCE_REPO_DIR", str(self.source_file.parent))
        ).expanduser().resolve()
        self.runtime_root = Path(
            os.environ.get("VM_RUNTIME_ROOT", "/tmp/street-interface-vm")
        ).expanduser().resolve()
        self.retain_artifacts = os.environ.get("VM_RETAIN_ARTIFACTS", "false").lower() in {
            "1", "true", "yes", "on"
        }
        self.namespace: dict[str, Any] | None = None
        self._load_lock = threading.Lock()
        self._infer_lock = threading.Lock()

    @property
    def loaded(self) -> bool:
        return self.namespace is not None

    def prerequisite_status(self) -> dict[str, Any]:
        source_exists = self.source_file.is_file()
        try:
            import torch  # imported lazily so health still works on a non-GPU host

            cuda_available = bool(torch.cuda.is_available())
            gpu_name = torch.cuda.get_device_name(0) if cuda_available else None
            torch_version = str(torch.__version__)
        except Exception as exc:  # pragma: no cover - deployment diagnostic
            cuda_available = False
            gpu_name = None
            torch_version = None
            torch_error = f"{type(exc).__name__}: {exc}"
        else:
            torch_error = None

        return {
            "sourceExists": source_exists,
            "sourcePath": str(self.source_file),
            "cudaAvailable": cuda_available,
            "gpuName": gpu_name,
            "torchVersion": torch_version,
            "torchError": torch_error,
            "loaded": self.loaded,
            "ready": source_exists and cuda_available,
        }

    def _verify_source(self, source_bytes: bytes) -> None:
        blob_sha = _git_blob_sha1(source_bytes)
        if blob_sha != SOURCE_BLOB:
            raise VmSourceError(
                f"Pinned segmentation source blob mismatch: expected {SOURCE_BLOB}, got {blob_sha}."
            )

        text = source_bytes.decode("utf-8")
        required_fragments = [
            'TAXONOMY_VERSION = "street_interface_v1.5.7.1"',
            "IGNORE_INDEX = 255",
            "NUM_CLASSES = len(CLASS_NAMES)",
            "ADE_MODEL_ID = 'nvidia/segformer-b5-finetuned-ade-640-640'",
            "MAPILLARY_MODEL_ID = 'facebook/mask2former-swin-large-mapillary-vistas-semantic'",
            "GROUNDING_MODEL_ID = 'IDEA-Research/grounding-dino-base'",
            "SAM_MODEL_ID = 'facebook/sam2.1-hiera-small'",
            "def process_one_image(image_path: Path):",
            IMPORT_CUTOFF_MARKER,
        ]
        missing = [fragment for fragment in required_fragments if fragment not in text]
        if missing:
            raise VmSourceError(f"Pinned VM source is missing required markers: {missing}")

        # When a git checkout is mounted, verify the repository commit as a second guard.
        git_dir = self.source_repo_dir / ".git"
        if git_dir.exists():
            try:
                head = subprocess.check_output(
                    ["git", "-C", str(self.source_repo_dir), "rev-parse", "HEAD"],
                    text=True,
                    stderr=subprocess.STDOUT,
                    timeout=5,
                ).strip()
            except Exception as exc:
                raise VmSourceError(f"Could not verify mounted VM git commit: {exc}") from exc
            if head != SOURCE_COMMIT:
                raise VmSourceError(
                    f"Pinned VM commit mismatch: expected {SOURCE_COMMIT}, got {head}."
                )

    def load(self) -> None:
        if self.namespace is not None:
            return
        with self._load_lock:
            if self.namespace is not None:
                return
            if not self.source_file.is_file():
                raise VmSourceError(
                    "Pinned segmentation_local.py is not mounted. Set VM_SEGMENTATION_SOURCE_FILE "
                    "or build the provided GPU container."
                )

            source_bytes = self.source_file.read_bytes()
            self._verify_source(source_bytes)
            source_text = source_bytes.decode("utf-8")
            prefix, marker, _rest = source_text.partition(IMPORT_CUTOFF_MARKER)
            if not marker:
                raise VmSourceError("Could not isolate the importable VM runtime prefix.")

            input_dir = self.runtime_root / "input_images"
            output_dir = self.runtime_root / "outputs"
            input_dir.mkdir(parents=True, exist_ok=True)
            output_dir.mkdir(parents=True, exist_ok=True)

            # The upstream source has an import-time input-directory preflight. A tiny
            # placeholder satisfies that preflight; no inference is run on it because
            # the source is cut before the batch loop.
            bootstrap = input_dir / "__P2B_BOOTSTRAP__.png"
            Image.new("RGB", (2, 2), (0, 0, 0)).save(bootstrap)

            namespace: dict[str, Any] = {
                "__name__": "street_interface_vm_source_runtime",
                "__file__": str(self.source_file),
            }
            previous_cwd = Path.cwd()
            try:
                os.chdir(self.runtime_root)
                exec(compile(prefix, str(self.source_file), "exec"), namespace, namespace)
            finally:
                os.chdir(previous_cwd)
                bootstrap.unlink(missing_ok=True)

            if not callable(namespace.get("process_one_image")):
                raise VmSourceError("Pinned VM runtime did not expose process_one_image().")

            # Convert source-relative paths to absolute service-owned paths.
            namespace["INPUT_DIR"] = input_dir
            namespace["BATCH_OUTPUT_ROOT"] = output_dir
            namespace["MASTER_CSV"] = output_dir / "segmentation_results.csv"
            namespace["ERROR_LOG"] = output_dir / "errors.csv"
            namespace["MAX_IMAGES"] = None
            namespace["RESUME"] = False
            namespace["STOP_ON_ERROR"] = True
            namespace["SAVE_LABEL_MAP"] = True
            namespace["SAVE_SUMMARY_IMAGE"] = False
            namespace["SAVE_EXTRA_AUDIT_OUTPUTS"] = True
            namespace["VERBOSE_PER_IMAGE"] = False
            for sub in ("label_maps", "summary_images", "audit_outputs"):
                (output_dir / sub).mkdir(parents=True, exist_ok=True)

            if namespace.get("TAXONOMY_VERSION") != TAXONOMY_VERSION:
                raise VmSourceError("Loaded VM taxonomy version drifted from P2B contract.")
            if int(namespace.get("IGNORE_INDEX", -1)) != IGNORE_INDEX:
                raise VmSourceError("Loaded VM IGNORE index drifted from P2B contract.")
            if len(namespace.get("CLASS_NAMES", {})) != CLASS_COUNT:
                raise VmSourceError("Loaded VM class count drifted from P2B contract.")

            self.namespace = namespace

    def infer(self, request_id: str, image_bytes: bytes, mime_type: str) -> dict[str, Any]:
        if len(image_bytes) > MAX_IMAGE_BYTES:
            raise ValueError("Image exceeds 15 MB contract limit.")
        self.load()
        assert self.namespace is not None

        ext = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}.get(mime_type)
        if not ext:
            raise ValueError(f"Unsupported MIME type: {mime_type}")

        with self._infer_lock:
            request_tag = f"{_safe_id(request_id)}_{uuid.uuid4().hex[:8]}"
            image_path = Path(self.namespace["INPUT_DIR"]) / f"{request_tag}{ext}"
            image_path.write_bytes(image_bytes)

            # Verify bytes decode as an image before invoking the expensive pipeline.
            try:
                with Image.open(image_path) as probe:
                    probe.verify()
            except Exception:
                image_path.unlink(missing_ok=True)
                raise ValueError("Uploaded bytes are not a decodable image.")

            safe_test_id = self.namespace["safe_test_id"]
            test_id = safe_test_id(image_path, Path(self.namespace["INPUT_DIR"]))
            output_root = Path(self.namespace["BATCH_OUTPUT_ROOT"])
            label_path = output_root / "label_maps" / f"{test_id}_LABEL_MAP_STABLE.png"
            audit_dir = output_root / "audit_outputs" / test_id
            rgb_path = audit_dir / f"{test_id}_RGB_CLEAN.png"
            overlay_path = audit_dir / f"{test_id}_OVERLAY_CLEAN.png"

            try:
                row = self.namespace["process_one_image"](image_path)
                if row.get("status") != "ok":
                    raise VmSourceError(f"VM returned non-ok row: {row}")
                if not label_path.exists():
                    raise VmSourceError("VM completed without LABEL_MAP_STABLE output.")

                labels = np.array(Image.open(label_path), dtype=np.uint8)
                if labels.ndim != 2:
                    raise VmSourceError(f"Scientific label map must be one-channel; got {labels.shape}.")

                observed = set(np.unique(labels).astype(int).tolist())
                allowed = set(range(CLASS_COUNT)) | {IGNORE_INDEX}
                invalid = sorted(observed - allowed)
                if invalid:
                    raise VmSourceError(f"Undeclared label IDs in scientific output: {invalid}")
                if 3 in observed:
                    raise VmSourceError("bike_lane ID 3 survived the mandatory final roadway merge.")

                total = int(labels.size)
                ignored = int(np.sum(labels == IGNORE_INDEX))
                valid = total - ignored
                unknown = int(np.sum(labels == 0))
                valid_denom = max(valid, 1)

                class_shares = []
                for class_id in range(CLASS_COUNT):
                    pixels = int(np.sum(labels == class_id))
                    class_shares.append(
                        {
                            "classId": class_id,
                            "className": CLASS_NAMES[class_id],
                            "pixels": pixels,
                            "shareOfValidPixels": pixels / valid_denom,
                        }
                    )

                result = {
                    "success": True,
                    "requestId": request_id,
                    "stage": "VM_COMPLETE",
                    "segmentation": {
                        "labelMapStableBase64": _b64(label_path),
                        "labelMapMimeType": "image/png",
                        "rgbCleanBase64": _b64(rgb_path),
                        "overlayCleanBase64": _b64(overlay_path),
                        "taxonomyVersion": TAXONOMY_VERSION,
                        "classCount": CLASS_COUNT,
                        "ignoreIndex": IGNORE_INDEX,
                        "classShares": class_shares,
                        "qa": {
                            "totalPixels": total,
                            "validPixels": valid,
                            "ignoredPixels": ignored,
                            "ignoreShare": ignored / max(total, 1),
                            "otherUnknownPixels": unknown,
                            "otherUnknownShareOfValidPixels": unknown / valid_denom,
                        },
                    },
                    "provenance": {
                        "repository": SOURCE_REPOSITORY,
                        "commit": SOURCE_COMMIT,
                        "sourceBlob": SOURCE_BLOB,
                        "taxonomyVersion": TAXONOMY_VERSION,
                        "contractVersion": CONTRACT_VERSION,
                        "runtimeService": "SOURCE_BACKED_FASTAPI_GPU_WORKER",
                        "modelIds": MODEL_IDS,
                    },
                }
                return result
            finally:
                image_path.unlink(missing_ok=True)
                if not self.retain_artifacts:
                    label_path.unlink(missing_ok=True)
                    if audit_dir.exists():
                        shutil.rmtree(audit_dir, ignore_errors=True)

                # P3 same-GPU handoff: after the scientific result has been
                # fully materialized, move any LOW_VRAM_MODE source models back
                # to CPU and empty CUDA cache. This changes resource residency
                # only; it does not change segmentation inference or outputs.
                try:
                    if self.namespace.get("LOW_VRAM_MODE"):
                        model_objects = self.namespace.get("_MODEL_OBJECTS") or {}
                        for model in model_objects.values():
                            model.to("cpu")
                        self.namespace["_ACTIVE_MODEL"] = None
                        gc_module = self.namespace.get("gc")
                        torch_module = self.namespace.get("torch")
                        if gc_module is not None:
                            gc_module.collect()
                        if torch_module is not None and torch_module.cuda.is_available():
                            torch_module.cuda.empty_cache()
                except Exception as cleanup_error:
                    print(f"[P2B GPU release warning] {type(cleanup_error).__name__}: {cleanup_error}", flush=True)
