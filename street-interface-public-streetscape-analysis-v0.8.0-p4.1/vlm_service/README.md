P3 Qwen VLM GPU Worker

Source-backed worker for the public live VLM stage.

Pinned source:

repository: mikellu12/murrayhill-v12

commit: f1d204df09da572db3417999f04aaf195ebd6ca6

model: Qwen/Qwen2-VL-7B-Instruct

10 fields, 7 verbal anchors per field

logits read over digit tokens 1..7

active readout: one least-likely rung pruned, then interpolated ordinal median

Public-photo difference: Street View mast erasure is disabled because arbitrary
user photos have no calibrated mast geometry. This is recorded as
PUBLIC_SINGLE_PHOTO_UNCALIBRATED; it is not claimed to be paper-equivalent
orthogonal/hemispheric sampling.

Build

docker build -f vlm_service/Dockerfile.gpu -t street-interface-vlm-p3 .

Run on the same laptop GPU

The P2B VM worker can stay running because P3 adds post-VM CUDA release and the
Qwen worker releases its model after each request by default. Both workers
should not infer concurrently on an 8 GB GPU.

docker run --gpus all `
  -p 8020:8020 `
  -e VLM_SERVICE_TOKEN="street-interface-vlm-test-token" `
  -v street-interface-hf:/models/huggingface `
  --name street-interface-vlm `
  street-interface-vlm-p3

Health check:

curl.exe `
  -H "Authorization: Bearer street-interface-vlm-test-token" `
  http://127.0.0.1:8020/health

The first real inference downloads/loads Qwen weights and will be much slower
than later cached runs. loaded:false is normal before an inference and again
after it when VLM_RELEASE_MODEL_AFTER_INFER=true.

Independent VLM visual commentary

The same /infer request now also attempts one open-text Qwen description after
all ten quantitative fields have been read. It reuses the already-loaded model
so an 8 GB GPU does not have to load Qwen twice.

The description instrument is pinned separately to:

repository: mikellu12/murrayhill-v12

commit: 550c0567d709c7b870eda30b34f0c2a9b4e84c66

path: tools/sim_vlm_describe.py

Git blob: 286d4731cd817fb2cd91fc77928fc6ebaf224e8a

scene question: What is it like to walk down this street?

decoding: greedy (do_sample=False), max_new_tokens=110

The response field is commentary. It is explicitly
ILLUSTRATIVE_NOT_VALIDATION with scoreDependency: NONE: no field ratings,
I/Y/D terms, SIM score, face, or enumerated feature menu are supplied to the
commentary prompt, and the generated text is never used by P4 synthesis. If
commentary generation fails, the worker returns commentary.status =
"unavailable" while preserving the valid quantitative VLM result.