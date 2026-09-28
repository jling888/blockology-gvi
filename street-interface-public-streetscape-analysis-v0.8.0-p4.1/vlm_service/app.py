from __future__ import annotations

import base64
import binascii
import os
from typing import Literal

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from source_runtime import (
    CONTRACT_VERSION,
    DESCRIPTION_SOURCE_BLOB,
    DESCRIPTION_SOURCE_COMMIT,
    DESCRIPTION_SOURCE_PATH,
    DESCRIPTION_SOURCE_REPOSITORY,
    FIELD_IDS,
    MAX_IMAGE_BYTES,
    MODEL_ID,
    MODEL_REVISION,
    PROCESSOR_POLICY,
    READOUT_NAME,
    RUNTIME_LOCK_ID,
    SOURCE_BLOBS,
    SOURCE_COMMIT,
    SOURCE_REPOSITORY,
    SourceBackedVlmRuntime,
    VlmSourceError,
)

app = FastAPI(title="Street Interface P3 Qwen VLM GPU Worker", version="0.8.0-P3")
runtime = SourceBackedVlmRuntime()


class InferRequest(BaseModel):
    requestId: str = Field(min_length=1, max_length=160)
    imageBase64: str = Field(min_length=1)
    imageMimeType: Literal["image/jpeg", "image/png", "image/webp"]
    imageFilename: str | None = None


def _authorize(authorization: str | None) -> None:
    expected = os.environ.get("VLM_SERVICE_TOKEN", "").strip()
    if not expected:
        return
    if authorization != f"Bearer {expected}":
        raise HTTPException(status_code=401, detail="Invalid VLM service token.")


@app.get("/health")
def health(authorization: str | None = Header(default=None)):
    _authorize(authorization)
    status = runtime.prerequisite_status()
    return {
        "success": True,
        "ready": bool(status["ready"]),
        "loaded": bool(status["loaded"]),
        "contractVersion": CONTRACT_VERSION,
        "sourceRepository": SOURCE_REPOSITORY,
        "sourceCommit": SOURCE_COMMIT,
        "sourceBlobs": SOURCE_BLOBS,
        "modelId": MODEL_ID,
        "modelRevision": MODEL_REVISION,
        "processorPolicy": PROCESSOR_POLICY,
        "runtimeLockId": RUNTIME_LOCK_ID,
        "runtimeVersions": status["runtimeVersions"],
        "runtimeLockOk": status["runtimeLockOk"],
        "fieldCount": len(FIELD_IDS),
        "commentarySourceReady": bool(status["commentarySourceReady"]),
        "commentarySource": {
            "repository": DESCRIPTION_SOURCE_REPOSITORY,
            "commit": DESCRIPTION_SOURCE_COMMIT,
            "path": DESCRIPTION_SOURCE_PATH,
            "blob": DESCRIPTION_SOURCE_BLOB,
        },
        "readout": READOUT_NAME,
        "cudaAvailable": status["cudaAvailable"],
        "gpuName": status["gpuName"],
        "detail": (
            "CUDA/source/runtime lock ready; Qwen loads lazily on first inference."
            if status["ready"]
            else "CUDA, pinned Murray Hill source, or P3.1 runtime lock is unavailable/mismatched."
        ),
    }


@app.post("/infer")
def infer(payload: InferRequest, authorization: str | None = Header(default=None)):
    _authorize(authorization)
    try:
        image_bytes = base64.b64decode(payload.imageBase64, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise HTTPException(status_code=400, detail="imageBase64 is invalid base64.") from exc
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Decoded image is empty.")
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Decoded image exceeds 15 MB.")
    try:
        return runtime.infer(payload.requestId, image_bytes, payload.imageMimeType)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except VlmSourceError as exc:
        raise HTTPException(status_code=500, detail=f"VLM source contract failure: {exc}") from exc
    except Exception as exc:
        print(f"[P3 VLM runtime error] {type(exc).__name__}: {exc}", flush=True)
        raise HTTPException(status_code=500, detail="Source-backed Qwen VLM inference failed.") from exc
