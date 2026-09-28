from __future__ import annotations

import base64
import binascii
import os
from typing import Literal

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from source_runtime import (
    CLASS_COUNT,
    CONTRACT_VERSION,
    MAX_IMAGE_BYTES,
    SOURCE_BLOB,
    SOURCE_COMMIT,
    SOURCE_REPOSITORY,
    TAXONOMY_VERSION,
    SourceBackedVmRuntime,
    VmSourceError,
)

app = FastAPI(title="Street Interface P2B VM GPU Worker", version="0.8.0-P2B")
runtime = SourceBackedVmRuntime()


class InferRequest(BaseModel):
    requestId: str = Field(min_length=1, max_length=160)
    imageBase64: str = Field(min_length=1)
    imageMimeType: Literal["image/jpeg", "image/png", "image/webp"]
    imageFilename: str | None = None


def _authorize(authorization: str | None) -> None:
    expected = os.environ.get("VM_SERVICE_TOKEN", "").strip()
    if not expected:
        return
    if authorization != f"Bearer {expected}":
        raise HTTPException(status_code=401, detail="Invalid VM service token.")


@app.get("/health")
def health(authorization: str | None = Header(default=None)):
    _authorize(authorization)
    status = runtime.prerequisite_status()
    return {
        "success": True,
        "ready": bool(status["ready"]),
        "loaded": bool(status["loaded"]),
        "contractVersion": CONTRACT_VERSION,
        "taxonomyVersion": TAXONOMY_VERSION,
        "classCount": CLASS_COUNT,
        "sourceRepository": SOURCE_REPOSITORY,
        "sourceCommit": SOURCE_COMMIT,
        "sourceBlob": SOURCE_BLOB,
        "cudaAvailable": status["cudaAvailable"],
        "gpuName": status["gpuName"],
        "detail": (
            "CUDA/source prerequisites ready; models load lazily on first inference."
            if status["ready"]
            else "CUDA or pinned segmentation source is unavailable."
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
    except VmSourceError as exc:
        raise HTTPException(status_code=500, detail=f"VM source contract failure: {exc}") from exc
    except Exception as exc:
        # Detailed stack remains in worker logs, not in the public response.
        print(f"[P2B VM runtime error] {type(exc).__name__}: {exc}", flush=True)
        raise HTTPException(status_code=500, detail="Source-backed VM inference failed.") from exc
