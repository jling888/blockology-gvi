# P2B Source-Backed CUDA VM Worker

This worker is the real Vision Model boundary for the Public App. It does **not**
reimplement or approximate the segmentation logic. It loads the pinned upstream
`segmentation_local.py` from:

- repository: `guanyupan2002-png/Street-View-Semantic-Segmentation`
- commit: `ba4a14731074e744d798956d0f38493c19c773cd`
- Git blob: `804dd7e287becd464c8716626a69d7df54bf3924`
- taxonomy: `street_interface_v1.5.7.1`

The adapter cuts the upstream script immediately before its batch benchmark loop,
so model initialization and `process_one_image()` are retained while the batch
runner is not executed. The four model objects stay warm in one worker process.
Inference is serialized because the upstream source uses a shared model/state
namespace and is not thread-safe.

## API

- `GET /health`
- `POST /infer`

The public browser never calls this worker directly. The Node gateway calls it
through `CUDA_VM_INFERENCE_ENDPOINT` and validates the returned source/taxonomy
contract before forwarding any result.

## Run with NVIDIA GPU

```bash
docker build -f vm_service/Dockerfile.gpu -t street-interface-vm-p2b .
docker run --gpus all -p 8010:8010 \
  -e VM_SERVICE_TOKEN=change-me \
  -v street-interface-hf:/models/huggingface \
  street-interface-vm-p2b
```

Then configure the Public App server:

```text
CUDA_VM_INFERENCE_ENDPOINT=http://<gpu-worker-host>:8010
CUDA_VM_SERVICE_TOKEN=change-me
CUDA_VM_INFERENCE_TIMEOUT_MS=900000
```

`CUDA_VM_INFERENCE_ENDPOINT` is server-only and is never returned to the browser.

## Important deployment notes

- The first request may be slow because Hugging Face model weights are downloaded
  unless they already exist in `HF_HOME`.
- Upstream `requirements.txt` does not install a CUDA PyTorch build; this worker's
  Dockerfile installs CUDA PyTorch explicitly before the upstream dependencies.
- Run one Uvicorn worker per GPU unless GPU memory capacity has been validated.
- Scientific output is the one-channel `*_LABEL_MAP_STABLE.png` with IDs 0–29 and
  `IGNORE=255`. `RGB_CLEAN` and `OVERLAY_CLEAN` are display/audit artifacts only.
- Uploaded originals and generated artifacts are deleted after the response by
  default. Set `VM_RETAIN_ARTIFACTS=true` only in a controlled research environment.
