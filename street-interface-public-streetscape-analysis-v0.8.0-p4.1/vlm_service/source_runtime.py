"""Source-backed Qwen2-VL adapter for the public P3 runtime.

The instrument is extracted from the pinned Murray Hill repository rather than
reworded here: exact 10-field order, seven-rung prompts, assistant prefix,
p1..p7 logit read, and prune-once interpolated-median readout are all verified
against Git blob SHAs at worker startup.

Public uploads intentionally do NOT use the repository's Google Street View
mast erasure because arbitrary phone photos have no calibration set. That
capture-protocol difference is explicit provenance; P3 is a live public-photo
instrument, not a claim of paper-equivalent directional sampling.
"""
from __future__ import annotations

import ast
import gc
import hashlib
import io
import os
import subprocess
import threading
from importlib import metadata as importlib_metadata
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image

CONTRACT_VERSION = "public_vlm_contract_v1_1"
SOURCE_REPOSITORY = "mikellu12/murrayhill-v12"
SOURCE_COMMIT = "f1d204df09da572db3417999f04aaf195ebd6ca6"
SOURCE_BLOBS = {
    "simVlmRun": "5b95c4e994e29fe080a18ce4966ed049cd91e474",
    "simFields": "416423f0ffa279d3483ae8fd16cf5278c3f49bb4",
    "simScale": "5072c85e22793e44a78811025e7327d7eef9eb50",
    "simReadout": "d446e44d5291ca78beaaae168e5c786eee8f7bf2",
}
MODEL_ID = "Qwen/Qwen2-VL-7B-Instruct"
# Freeze the Hugging Face repository state used by the P3.1 reproducibility lock.
# This revision is the model repo state current after the 2025-02-06 metadata merge;
# the model weights themselves are unchanged by later README-only edits.
MODEL_REVISION = "eed13092ef92e448dd6875b2a00151bd3f7db0ac"
PROCESSOR_POLICY = "SLOW_USE_FAST_FALSE"
RUNTIME_LOCK_ID = "P3_1_QWEN_REPRO_LOCK_2026_09_09"
EXPECTED_RUNTIME_VERSIONS = {
    "torch": "2.6.0+cu124",
    "torchvision": "0.21.0+cu124",
    "transformers": "4.57.3",
    "accelerate": "1.14.0",
    "bitsandbytes": "0.48.2",
}
MAX_PIXELS = 1024 * 28 * 28
MAX_IMAGE_BYTES = 15 * 1024 * 1024
READOUT_NAME = "PRUNE_ONCE_INTERPOLATED_MEDIAN"
CAPTURE_PROTOCOL = "PUBLIC_SINGLE_PHOTO_UNCALIBRATED"
MAST_POLICY = "DISABLED_PUBLIC_UPLOAD"

# Independent natural-language description source. This is deliberately pinned
# separately from the frozen P3 rating source: commentary is illustrative only
# and must never alter the 10-field logits or downstream SIM score.
DESCRIPTION_SOURCE_REPOSITORY = "mikellu12/murrayhill-v12"
DESCRIPTION_SOURCE_COMMIT = "550c0567d709c7b870eda30b34f0c2a9b4e84c66"
DESCRIPTION_SOURCE_PATH = "tools/sim_vlm_describe.py"
DESCRIPTION_SOURCE_BLOB = "286d4731cd817fb2cd91fc77928fc6ebaf224e8a"
DESCRIPTION_PROMPT_ID = "scene_open_v1"
DESCRIPTION_ROLE = "ILLUSTRATIVE_NOT_VALIDATION"
DESCRIPTION_SCORE_DEPENDENCY = "NONE"
DESCRIPTION_DECODING = "GREEDY_DO_SAMPLE_FALSE"
DESCRIPTION_MAX_NEW_TOKENS = 110

FIELD_IDS = [
    "vertical_greenery",
    "vertical_hardscape",
    "green_eye_level",
    "sky_openness",
    "walkable_ground",
    "green_softening",
    "signage_detail",
    "facade_variation",
    "ground_floor_activity",
    "resting_affordance",
]
MANUSCRIPT_TERMS = {
    "vertical_greenery": "V_nat",
    "vertical_hardscape": "V_built",
    "green_eye_level": "GVI_eye",
    "sky_openness": "SVF",
    "walkable_ground": "V_pave",
    "green_softening": "GMI",
    "signage_detail": "V_sign",
    "facade_variation": "SFV",
    "ground_floor_activity": "GFAPI",
    "resting_affordance": "IAS",
}


class VlmSourceError(RuntimeError):
    pass


def _git_blob_sha1(content: bytes) -> str:
    header = f"blob {len(content)}\0".encode("utf-8")
    return hashlib.sha1(header + content).hexdigest()


def _literal_assignment(tree: ast.Module, name: str):
    for node in tree.body:
        if isinstance(node, (ast.Assign, ast.AnnAssign)):
            targets = node.targets if isinstance(node, ast.Assign) else [node.target]
            if any(isinstance(t, ast.Name) and t.id == name for t in targets):
                value = node.value
                try:
                    return ast.literal_eval(value)
                except Exception as exc:
                    raise VlmSourceError(f"Could not literal-evaluate {name}: {exc}") from exc
    raise VlmSourceError(f"Pinned source assignment {name} not found.")


def _compile_function(tree: ast.Module, name: str, namespace: dict[str, Any]):
    fn = next((n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == name), None)
    if fn is None:
        raise VlmSourceError(f"Pinned source function {name} not found.")
    module = ast.Module(body=[fn], type_ignores=[])
    ast.fix_missing_locations(module)
    exec(compile(module, f"<pinned:{name}>", "exec"), namespace, namespace)
    return namespace[name]


class SourceBackedVlmRuntime:
    def __init__(self) -> None:
        default_repo = Path(__file__).resolve().parent.parent / "vendor" / "murrayhill-v12"
        self.source_repo_dir = Path(os.environ.get("VLM_SOURCE_REPO_DIR", str(default_repo))).expanduser().resolve()
        default_description_source = Path(__file__).resolve().parent / "source_reference" / "sim_vlm_describe.py"
        self.description_source_file = Path(
            os.environ.get("VLM_DESCRIPTION_SOURCE_FILE", str(default_description_source))
        ).expanduser().resolve()
        self.release_after_infer = os.environ.get("VLM_RELEASE_MODEL_AFTER_INFER", "true").lower() in {"1", "true", "yes", "on"}
        self._instrument_loaded = False
        self._model = None
        self._processor = None
        self._torch = None
        self._load_lock = threading.Lock()
        self._infer_lock = threading.Lock()
        self.fields = None
        self.system_prompt = None
        self.prompt7 = None
        self.prune_once = None
        self.interpolated_median = None
        self.description_system_prompt = None
        self.description_scene_prompt = None

    @property
    def loaded(self) -> bool:
        return self._model is not None and self._processor is not None

    def prerequisite_status(self) -> dict[str, Any]:
        required = [
            self.source_repo_dir / "tools" / "sim_vlm_run.py",
            self.source_repo_dir / "src" / "sim_fields.py",
            self.source_repo_dir / "src" / "sim_scale.py",
            self.source_repo_dir / "tools" / "sim_readout.py",
        ]
        source_exists = all(path.is_file() for path in required)
        commentary_source_exists = self.description_source_file.is_file()
        commentary_source_blob_ok = False
        if commentary_source_exists:
            try:
                commentary_source_blob_ok = _git_blob_sha1(self.description_source_file.read_bytes()) == DESCRIPTION_SOURCE_BLOB
            except OSError:
                commentary_source_blob_ok = False
        try:
            import torch
            cuda_available = bool(torch.cuda.is_available())
            gpu_name = torch.cuda.get_device_name(0) if cuda_available else None
            torch_version = str(torch.__version__)
        except Exception as exc:
            cuda_available = False
            gpu_name = None
            torch_version = None
            torch_error = f"{type(exc).__name__}: {exc}"
        else:
            torch_error = None
        runtime_versions = {"torch": torch_version}
        for package_name in ("torchvision", "transformers", "accelerate", "bitsandbytes"):
            try:
                runtime_versions[package_name] = importlib_metadata.version(package_name)
            except importlib_metadata.PackageNotFoundError:
                runtime_versions[package_name] = None
        runtime_lock_ok = all(runtime_versions.get(k) == v for k, v in EXPECTED_RUNTIME_VERSIONS.items())
        return {
            "sourceExists": source_exists,
            "cudaAvailable": cuda_available,
            "gpuName": gpu_name,
            "torchVersion": torch_version,
            "torchError": torch_error,
            "runtimeVersions": runtime_versions,
            "runtimeLockId": RUNTIME_LOCK_ID,
            "runtimeLockOk": runtime_lock_ok,
            "processorPolicy": PROCESSOR_POLICY,
            "modelRevision": MODEL_REVISION,
            "loaded": self.loaded,
            "commentarySourceExists": commentary_source_exists,
            "commentarySourceBlobOk": commentary_source_blob_ok,
            "commentarySourceReady": commentary_source_exists and commentary_source_blob_ok,
            "ready": source_exists and cuda_available and runtime_lock_ok,
        }

    def _verify_repo(self) -> None:
        files = {
            "simVlmRun": self.source_repo_dir / "tools" / "sim_vlm_run.py",
            "simFields": self.source_repo_dir / "src" / "sim_fields.py",
            "simScale": self.source_repo_dir / "src" / "sim_scale.py",
            "simReadout": self.source_repo_dir / "tools" / "sim_readout.py",
        }
        for key, path in files.items():
            if not path.is_file():
                raise VlmSourceError(f"Pinned VLM source file missing: {path}")
            got = _git_blob_sha1(path.read_bytes())
            expected = SOURCE_BLOBS[key]
            if got != expected:
                raise VlmSourceError(f"Pinned VLM source blob mismatch for {key}: expected {expected}, got {got}.")
        git_dir = self.source_repo_dir / ".git"
        if git_dir.exists():
            head = subprocess.check_output(
                ["git", "-C", str(self.source_repo_dir), "rev-parse", "HEAD"],
                text=True,
                stderr=subprocess.STDOUT,
                timeout=5,
            ).strip()
            if head != SOURCE_COMMIT:
                raise VlmSourceError(f"Pinned VLM commit mismatch: expected {SOURCE_COMMIT}, got {head}.")

    def _load_instrument(self) -> None:
        if self._instrument_loaded:
            return
        self._verify_repo()
        fields_text = (self.source_repo_dir / "src" / "sim_fields.py").read_text(encoding="utf-8")
        scale_text = (self.source_repo_dir / "src" / "sim_scale.py").read_text(encoding="utf-8")
        readout_text = (self.source_repo_dir / "tools" / "sim_readout.py").read_text(encoding="utf-8")
        run_text = (self.source_repo_dir / "tools" / "sim_vlm_run.py").read_text(encoding="utf-8")

        for marker in [
            'MODEL = "Qwen/Qwen2-VL-7B-Instruct"',
            'MAX_PIXELS = 1024 * 28 * 28',
            'proc.tokenizer.padding_side = "left"',
            "BitsAndBytesConfig(load_in_4bit=True",
            "p = torch.softmax(logits[i, ids], -1)",
        ]:
            if marker not in run_text:
                raise VlmSourceError(f"Pinned sim_vlm_run.py missing runtime marker: {marker}")

        fields_tree = ast.parse(fields_text)
        scale_tree = ast.parse(scale_text)
        readout_tree = ast.parse(readout_text)
        self.fields = _literal_assignment(fields_tree, "FIELDS")
        self.system_prompt = _literal_assignment(fields_tree, "SYSTEM")
        scale = _literal_assignment(scale_tree, "SCALE")
        definition = _literal_assignment(scale_tree, "DEFINITION")
        if list(self.fields.keys()) != FIELD_IDS or list(scale.keys()) != FIELD_IDS:
            raise VlmSourceError(f"Pinned VLM field order drifted: {list(self.fields.keys())}")
        for field_id in FIELD_IDS:
            if self.fields[field_id][2] != MANUSCRIPT_TERMS[field_id]:
                raise VlmSourceError(f"Manuscript term drift for {field_id}.")
            if len(scale[field_id]) != 7:
                raise VlmSourceError(f"Seven-rung scale missing for {field_id}.")

        prompt_ns = {"SCALE": scale, "DEFINITION": definition, "PLACE": ""}
        self.prompt7 = _compile_function(scale_tree, "prompt7", prompt_ns)
        readout_ns = {"np": np}
        self.prune_once = _compile_function(readout_tree, "prune_once", readout_ns)
        self.interpolated_median = _compile_function(readout_tree, "interpolated_median", readout_ns)
        self._instrument_loaded = True

    def _load_description_instrument(self) -> None:
        if self.description_system_prompt is not None and self.description_scene_prompt is not None:
            return
        if not self.description_source_file.is_file():
            raise VlmSourceError(f"Pinned VLM commentary source file missing: {self.description_source_file}")
        content = self.description_source_file.read_bytes()
        got = _git_blob_sha1(content)
        if got != DESCRIPTION_SOURCE_BLOB:
            raise VlmSourceError(
                f"Pinned VLM commentary source blob mismatch: expected {DESCRIPTION_SOURCE_BLOB}, got {got}."
            )
        tree = ast.parse(content.decode("utf-8"))
        system_prompt = _literal_assignment(tree, "SYSTEM")
        questions = _literal_assignment(tree, "QUESTIONS")
        if not isinstance(system_prompt, str) or not system_prompt.strip():
            raise VlmSourceError("Pinned VLM commentary SYSTEM prompt is empty.")
        if not isinstance(questions, dict) or questions.get("scene") != "What is it like to walk down this street?":
            raise VlmSourceError("Pinned VLM commentary scene question drifted.")
        self.description_system_prompt = system_prompt
        self.description_scene_prompt = questions["scene"]

    def _generate_scene_commentary(self, image: Image.Image, proc: Any, model: Any, torch: Any) -> dict[str, Any]:
        self._load_description_instrument()
        assert self.description_system_prompt is not None
        assert self.description_scene_prompt is not None

        messages = [
            {"role": "system", "content": self.description_system_prompt},
            {"role": "user", "content": [
                {"type": "image"},
                {"type": "text", "text": self.description_scene_prompt},
            ]},
        ]
        text = proc.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        comment_inp = None
        generated = None
        try:
            comment_inp = proc(text=[text], images=[image], return_tensors="pt").to("cuda")
            with torch.no_grad():
                generated = model.generate(
                    **comment_inp,
                    max_new_tokens=DESCRIPTION_MAX_NEW_TOKENS,
                    do_sample=False,
                )
            prefix_len = comment_inp["input_ids"].shape[1]
            reply = proc.batch_decode(
                generated[:, prefix_len:],
                skip_special_tokens=True,
            )[0].strip().replace("\n", " ")
            if not reply:
                raise RuntimeError("Qwen returned an empty street commentary.")
            return {
                "status": "ready",
                "scene": reply,
                "promptId": DESCRIPTION_PROMPT_ID,
                "question": self.description_scene_prompt,
                "role": DESCRIPTION_ROLE,
                "scoreDependency": DESCRIPTION_SCORE_DEPENDENCY,
                "decoding": DESCRIPTION_DECODING,
                "maxNewTokens": DESCRIPTION_MAX_NEW_TOKENS,
                "source": {
                    "repository": DESCRIPTION_SOURCE_REPOSITORY,
                    "commit": DESCRIPTION_SOURCE_COMMIT,
                    "path": DESCRIPTION_SOURCE_PATH,
                    "blob": DESCRIPTION_SOURCE_BLOB,
                },
            }
        finally:
            comment_inp = None
            generated = None
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()

    def _load_model(self) -> None:
        self._load_instrument()
        if self.loaded:
            return
        with self._load_lock:
            if self.loaded:
                return
            import torch
            from transformers import AutoProcessor, BitsAndBytesConfig, Qwen2VLForConditionalGeneration

            if not torch.cuda.is_available():
                raise VlmSourceError("CUDA GPU not available for Qwen2-VL.")
            qcfg = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_compute_dtype=torch.bfloat16,
                bnb_4bit_use_double_quant=True,
            )
            # P3.1 reproducibility lock: the upstream script relied on the slow
            # Qwen2-VL image processor. Newer Transformers releases changed the
            # AutoProcessor default to the fast implementation, which can shift
            # image preprocessing and therefore p1..p7. Force the slow path and
            # fail closed if Transformers silently returns a Fast class.
            processor = AutoProcessor.from_pretrained(
                MODEL_ID,
                revision=MODEL_REVISION,
                max_pixels=MAX_PIXELS,
                use_fast=False,
            )
            image_processor_class = type(processor.image_processor).__name__
            if "Fast" in image_processor_class:
                raise VlmSourceError(
                    f"P3.1 processor lock failed: expected slow image processor, got {image_processor_class}."
                )
            processor.tokenizer.padding_side = "left"
            model = Qwen2VLForConditionalGeneration.from_pretrained(
                MODEL_ID,
                revision=MODEL_REVISION,
                quantization_config=qcfg,
                device_map="cuda",
            ).eval()
            self._torch = torch
            self._processor = processor
            self._model = model

    def _release_model(self) -> None:
        if self._model is None:
            return
        torch = self._torch
        self._model = None
        # Processor is small and source-independent; keep it cached.
        if torch is not None:
            gc.collect()
            torch.cuda.empty_cache()

    def infer(self, request_id: str, image_bytes: bytes, mime_type: str) -> dict[str, Any]:
        if len(image_bytes) > MAX_IMAGE_BYTES:
            raise ValueError("Image exceeds 15 MB contract limit.")
        if mime_type not in {"image/jpeg", "image/png", "image/webp"}:
            raise ValueError(f"Unsupported MIME type: {mime_type}")

        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception as exc:
            raise ValueError("Uploaded bytes are not a decodable image.") from exc

        with self._infer_lock:
            self._load_model()
            assert self._processor is not None and self._model is not None and self._torch is not None
            assert self.prompt7 is not None and self.system_prompt is not None
            assert self.prune_once is not None and self.interpolated_median is not None
            proc = self._processor
            model = self._model
            torch = self._torch

            # Public single-photo mode: no Street View calibration set exists,
            # so mast erasure is explicitly disabled rather than guessed.
            texts = []
            for field_id in FIELD_IDS:
                messages = [
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": [
                        {"type": "image"},
                        {"type": "text", "text": self.prompt7(field_id)},
                    ]},
                ]
                texts.append(
                    proc.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
                    + f'{{"{field_id}": '
                )

            token_ids = []
            for k in range(1, 8):
                encoded = proc.tokenizer.encode(str(k), add_special_tokens=False)
                if len(encoded) != 1:
                    raise VlmSourceError(f"Digit {k} is no longer one tokenizer token: {encoded}")
                token_ids.append(encoded[0])

            inp = None
            logits = None
            try:
                inp = proc(text=texts, images=[image] * len(FIELD_IDS), padding=True, return_tensors="pt").to("cuda")
                with torch.no_grad():
                    logits = model(**inp).logits[:, -1, :].float()

                probabilities = []
                for i in range(len(FIELD_IDS)):
                    p = torch.softmax(logits[i, token_ids], -1).cpu().numpy().astype(float)
                    p = p / p.sum()
                    probabilities.append(p)
                P = np.vstack(probabilities)
                medians = self.interpolated_median(self.prune_once(P.copy()))
                ks = np.arange(1, 8, dtype=float)

                fields = []
                for i, field_id in enumerate(FIELD_IDS):
                    p = P[i]
                    ev = float((p * ks).sum())
                    median = float(medians[i])
                    fields.append({
                        "fieldId": field_id,
                        "manuscriptTerm": MANUSCRIPT_TERMS[field_id],
                        "surveyRoundEv": int(np.clip(round(ev), 1, 7)),
                        "expectedValue": ev,
                        "argmax": int(np.argmax(p) + 1),
                        "probabilities": [float(x) for x in p.tolist()],
                        "readoutMedian": median,
                        "normalized01": (median - 1.0) / 6.0,
                    })

                # Release rating-pass tensors before open-text generation. The
                # commentary uses the same RGB image and loaded Qwen model, but
                # it receives no field values, no SIM score, and no smiley.
                # Therefore it cannot feed back into the quantitative result.
                inp = None
                logits = None
                gc.collect()
                torch.cuda.empty_cache()

                try:
                    commentary = self._generate_scene_commentary(image, proc, model, torch)
                except Exception as exc:
                    # Commentary is intentionally non-blocking. A generation or
                    # source-reference problem must never invalidate valid P3
                    # ratings or prevent P4 SIM synthesis.
                    print(f"[P3 VLM commentary unavailable] {type(exc).__name__}: {exc}", flush=True)
                    gc.collect()
                    torch.cuda.empty_cache()
                    commentary = {
                        "status": "unavailable",
                        "scene": None,
                        "promptId": DESCRIPTION_PROMPT_ID,
                        "question": "What is it like to walk down this street?",
                        "role": DESCRIPTION_ROLE,
                        "scoreDependency": DESCRIPTION_SCORE_DEPENDENCY,
                        "decoding": DESCRIPTION_DECODING,
                        "maxNewTokens": DESCRIPTION_MAX_NEW_TOKENS,
                        "source": {
                            "repository": DESCRIPTION_SOURCE_REPOSITORY,
                            "commit": DESCRIPTION_SOURCE_COMMIT,
                            "path": DESCRIPTION_SOURCE_PATH,
                            "blob": DESCRIPTION_SOURCE_BLOB,
                        },
                        "errorCode": "COMMENTARY_GENERATION_FAILED",
                    }

                return {
                    "success": True,
                    "requestId": request_id,
                    "stage": "VLM_COMPLETE",
                    "fields": fields,
                    "commentary": commentary,
                    "instrument": {
                        "modelId": MODEL_ID,
                        "modelRevision": MODEL_REVISION,
                        "processorPolicy": PROCESSOR_POLICY,
                        "processorClass": type(proc.image_processor).__name__,
                        "runtimeLockId": RUNTIME_LOCK_ID,
                        "fieldCount": 10,
                        "anchorsPerField": 7,
                        "readout": READOUT_NAME,
                        "maxPixels": MAX_PIXELS,
                        "captureProtocol": CAPTURE_PROTOCOL,
                        "mastPolicy": MAST_POLICY,
                        "promptPlace": None,
                    },
                    "provenance": {
                        "repository": SOURCE_REPOSITORY,
                        "commit": SOURCE_COMMIT,
                        "sourceBlobs": SOURCE_BLOBS,
                        "contractVersion": CONTRACT_VERSION,
                        "runtimeLockId": RUNTIME_LOCK_ID,
                        "runtimeVersions": {
                            "torch": str(torch.__version__),
                            "torchvision": importlib_metadata.version("torchvision"),
                            "transformers": importlib_metadata.version("transformers"),
                            "accelerate": importlib_metadata.version("accelerate"),
                            "bitsandbytes": importlib_metadata.version("bitsandbytes"),
                        },
                        "runtimeService": "SOURCE_BACKED_QWEN_FASTAPI_GPU_WORKER_P3_1_REPRO_LOCK",
                    },
                }
            finally:
                image.close()
                # Drop request-local CUDA tensors/model aliases before releasing
                # the service-owned model, otherwise the local references keep
                # VRAM live until after empty_cache().
                inp = None
                logits = None
                model = None
                gc.collect()
                # Development default for 8 GB laptop GPUs: release Qwen VRAM
                # after each request so the VM stage can run again. No output or
                # instrument semantics are changed by this resource cleanup.
                if self.release_after_infer:
                    self._release_model()
