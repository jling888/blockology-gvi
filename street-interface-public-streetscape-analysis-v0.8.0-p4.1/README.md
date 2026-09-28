# Street Interface · Public Streetscape Analysis — v0.8.0-P4.1

A public-facing automated streetscape analysis application that transforms a single uploaded street photograph into semantic segmentation, Qwen2-VL perceptual analysis, VLM visual commentary, and a Nature 9.03 Street Interface score.

This repository contains the **public-facing automated interface** of the Street Interface research project.

The application is designed to hide most of the technical processing in the backend so that the user only needs to provide one existing streetscape photograph.

---

## Purpose

The goal of this application is to make the Street Interface research workflow easier to access and use.

Unlike the research-oriented Street Interface Measurement interface, this version does not require the user to manually prepare a segmentation mask or manually import VLM measurement files.

The public workflow begins with:

```text
One original street photograph
```

The backend then automatically performs the remaining analysis.

The long-term goal is to develop this interface into a public-facing streetscape analysis tool.

---

## User Input

The primary public workflow requires only one input:

1. **Original streetscape photograph**

The uploaded image is passed through the automated VM → VLM → SIM pipeline.

No manually prepared segmentation mask is required for the primary public workflow.

No manual VLM CSV import is required for the primary public workflow.

---

## Automated Pipeline

The current public pipeline is:

```text
Original Street Photograph
        ↓
P2B Vision Segmentation
        ↓
30-Class Scientific Label Map
        ↓
P3.1 Qwen2-VL Perceptual Analysis
        ↓
10 Quantitative VLM Fields
        ↓
P4 Nature 9.03 SIM Synthesis
        ↓
Imageability / Identity / Dependence
        ↓
Street Interface Score
        ↓
Public Score Visualization
```

In parallel with the quantitative VLM output, the Qwen worker also generates an independent visual commentary:

```text
Original RGB Image
        ↓
Open-Text Qwen Description
        ↓
VLM Visual Commentary
```

The commentary is descriptive only and does not affect the Street Interface score.

---

## Pipeline Stages

### P1 — Photo Input

The user uploads one existing RGB streetscape photograph.

The public application treats this as:

```text
PUBLIC_SINGLE_PHOTO_UNCALIBRATED
```

The public single-photo workflow is not claimed to be equivalent to the canonical research 90° half-view sampling protocol.

---

### P2B — Vision Segmentation

The public application connects to a source-backed CUDA Vision Model worker.

The worker produces the scientific 30-class segmentation label map used by the public measurement workflow.

Current taxonomy:

```text
street_interface_v1.5.7.1
```

The scientific output is the one-channel stable label map using class IDs 0–29 with `IGNORE=255`.

Display overlays and RGB visualization products are audit / presentation artifacts and are not the scientific classification source.

---

### P3.1 — Qwen2-VL Perceptual Measurement

The public VLM stage uses:

```text
Qwen/Qwen2-VL-7B-Instruct
```

The reproducibility-locked VLM instrument evaluates 10 perceptual fields.

For each field, the worker preserves the probability distribution over ordinal responses:

```text
p1 ... p7
```

The active readout uses the locked ordinal readout implemented by the P3.1 worker.

The VLM stage does not directly compute Imageability, Identity, Dependence, or the final Street Interface score.

Those values are produced later by the deterministic P4 synthesis stage.

---

## VLM Visual Commentary

The same Qwen worker also generates an independent open-text streetscape description.

The commentary instrument uses the open-ended scene question:

```text
What is it like to walk down this street?
```

The commentary is generated with deterministic greedy decoding:

```text
do_sample = false
max_new_tokens = 110
```

The application explicitly labels this output:

```text
VLM VISUAL COMMENTARY
NOT SCORE VALIDATION
```

The commentary has:

```text
role = ILLUSTRATIVE_NOT_VALIDATION
scoreDependency = NONE
```

The commentary prompt does not receive:

- Street Interface score
- Imageability value
- Identity value
- Dependence value
- Score visualization / smiley
- Quantitative VLM field ratings
- Enumerated feature menu

The generated commentary is never fed back into the P4 Street Interface synthesis.

If commentary generation fails, the valid quantitative VLM result and Street Interface score remain usable.

---

## P4 — Nature 9.03 Street Interface Synthesis

The final public Street Interface calculation is performed server-side using the frozen scientific synthesis engine.

Current scientific core:

```text
v0.6.3_GOLDEN_FREEZE
```

Active formula:

```text
M_i = I_i^a_i × Y_i^b_i × D_i^c_i
```

where:

- `I` = Imageability
- `Y` = Identity
- `D` = Dependence
- `M` = Street Interface score

Current fallback elasticities:

```text
a = 0.4
b = 0.2
c = 0.4
```

Elasticity source:

```text
PAPER_GLOBAL_REFERENCE
```

Calibration status:

```text
REFERENCE_NOT_LOCAL_GWR
```

The current scientific core uses:

```text
No active Omega
No external environmental A_i
```

---

## Public Output

After a successful analysis, the public interface presents:

- Semantic segmentation result
- 30-class quantitative segmentation evidence
- Qwen2-VL quantitative perceptual measurements
- Imageability
- Identity
- Dependence
- Final Street Interface score
- Public score visualization
- VLM visual commentary
- Runtime / validation status

The public interface intentionally simplifies the presentation relative to the research-oriented application.

---

## Validation Architecture

The v0.8.0-P4.1 release separates two different validation classes.

### Research Golden Validation

```text
Validation class:
RESEARCH_90_HALF_VIEW_GOLDEN

Input protocol:
MURRAY_HILL_CANONICAL_90_DEG_HALF_VIEW

Comparison mode:
EXACT_NUMERIC_GOLDEN_PARITY

Historical golden comparable:
true
```

Packaging validation status:

```text
PASS_IN_PACKAGING_ENVIRONMENT
```

---

### Public Live Validation

```text
Validation class:
PUBLIC_SINGLE_PHOTO_LIVE

Input protocol:
PUBLIC_SINGLE_PHOTO_UNCALIBRATED

Comparison mode:
SAME_INPUT_RUNTIME_STABILITY

Historical golden comparable:
false
```

Current status:

```text
PENDING_USER_HOST_REPEAT_RUN_AUDIT
```

The public single-photo result should therefore not be interpreted as a direct historical-golden parity test.

Repeat-run stability using the same public image is the appropriate live validation method.

---

## Scientific Golden Reference

The packaged P4.1 validation record preserves the canonical research golden reference.

Expected values:

```text
I_raw = 0.4746845369069087
I     = 6.785792291750779
Y     = 4.275239548226926
D_raw = 0.7495737076243679
D     = 6.861271847132807
M     = 6.214327916148292
```

Packaging regression result:

```text
PASS
```

Maximum absolute delta:

```text
8.881784197001252e-16
```

Tolerance:

```text
1e-12
```

These values belong to the canonical research validation case and are not expected values for arbitrary public street photographs.

---

## Current Release Status

Application version:

```text
v0.8.0-P4.1
```

Release label:

```text
v0.8.0-P4.1 PROTOCOL-AWARE VALIDATION CANDIDATE
```

Release status:

```text
PUBLIC_DEVELOPMENT_CANDIDATE
```

Parent public branch:

```text
v0.8.0-P4
```

Base verified research release:

```text
v0.7.0 RELEASE VERIFIED
```

Scientific core:

```text
v0.6.3_GOLDEN_FREEZE
```

Scientific change:

```text
false
```

Validation architecture change:

```text
true
```

Public UI change:

```text
true
```

Host lint / build validation:

```text
PENDING_USER_HOST_P4_1_VALIDATION
```

Public live repeat-run stability:

```text
PENDING_USER_HOST_REPEAT_RUN_AUDIT
```

This repository should therefore be treated as a **public development candidate**, not as a final production release.

---

## Architecture

The default application surface is:

```text
PublicStreetscapeApp
```

The primary runtime architecture is:

```text
Browser
  ↓
Node / React App
localhost:3000
  │
  ├── P2B VM Gateway
  │       ↓
  │   CUDA VM Worker
  │   localhost:8010
  │
  ├── P3.1 VLM Gateway
  │       ↓
  │   Qwen CUDA Worker
  │   localhost:8020
  │
  └── P4 SIM Gateway
          ↓
      Frozen Nature 9.03
      deterministic synthesis
```

The browser never directly communicates with the CUDA workers.

The Node server validates the worker contracts before forwarding scientific results to the client.

---

## Repository Structure

Key directories:

```text
src/
server/
vm_service/
vlm_service/
release/
scripts/
public/
```

### `src/`

Contains the React / TypeScript frontend, public contracts, UI components, and research application components.

Important public files include:

```text
src/PublicStreetscapeApp.tsx
src/publicAnalysisContract.ts
src/publicVmContract.ts
src/publicVlmContract.ts
src/publicSimContract.ts
```

### `server/`

Contains the Node / Express server gateways and deterministic backend services.

Important public gateway files include:

```text
server/publicVmGateway.ts
server/publicVlmGateway.ts
server/publicSimGateway.ts
server/publicVlmValidation.ts
```

### `vm_service/`

Contains the source-backed CUDA Vision Model FastAPI worker.

Important files include:

```text
vm_service/app.py
vm_service/Dockerfile.gpu
vm_service/README.md
```

### `vlm_service/`

Contains the reproducibility-locked Qwen2-VL FastAPI worker.

Important files include:

```text
vlm_service/app.py
vlm_service/source_runtime.py
vlm_service/Dockerfile.gpu
vlm_service/README.md
```

The independent visual-commentary source references are stored under:

```text
vlm_service/source_reference/
```

### `release/`

Contains protocol-aware validation records, scientific integrity metadata, and release status information.

---

## Local Development Requirements

For the full local automated pipeline, the current development setup requires:

- Node.js
- npm
- Docker
- NVIDIA GPU with CUDA support
- Sufficient GPU memory for the VM and Qwen workers
- Internet access or previously cached Hugging Face model weights

The current development pipeline has been tested with the VM and VLM workers running as separate Docker services.

---

## Install Node Dependencies

From the repository root:

```bash
npm install
```

On Windows PowerShell, if `npm.ps1` is blocked by the execution policy, use:

```powershell
npm.cmd install
```

---

## Environment Configuration

Copy or reproduce the values from:

```text
.env.example
```

Create a local:

```text
.env
```

Do not commit the real `.env` file.

Example local configuration:

```env
CUDA_VM_INFERENCE_ENDPOINT=http://127.0.0.1:8010
CUDA_VM_SERVICE_TOKEN=YOUR_VM_SERVICE_TOKEN
CUDA_VM_STATUS_TIMEOUT_MS=2500
CUDA_VM_INFERENCE_TIMEOUT_MS=900000

CUDA_VLM_INFERENCE_ENDPOINT=http://127.0.0.1:8020
CUDA_VLM_SERVICE_TOKEN=YOUR_VLM_SERVICE_TOKEN
CUDA_VLM_STATUS_TIMEOUT_MS=2500
CUDA_VLM_INFERENCE_TIMEOUT_MS=900000
```

The real service tokens should remain private.

---

## Run the P2B Vision Worker

Build:

```powershell
docker build -f vm_service/Dockerfile.gpu -t street-interface-vm-p2b .
```

Run:

```powershell
docker run --gpus all `
  -p 8010:8010 `
  -e VM_SERVICE_TOKEN="YOUR_VM_SERVICE_TOKEN" `
  -v street-interface-hf:/models/huggingface `
  --name street-interface-vm `
  street-interface-vm-p2b
```

Health check:

```powershell
curl.exe `
  -H "Authorization: Bearer YOUR_VM_SERVICE_TOKEN" `
  http://127.0.0.1:8010/health
```

The first inference may be slower because model weights may need to be downloaded or loaded into GPU memory.

---

## Run the P3.1 Qwen VLM Worker

Build:

```powershell
docker build -f vlm_service/Dockerfile.gpu -t street-interface-vlm-p3 .
```

Run:

```powershell
docker run --gpus all `
  -p 8020:8020 `
  -e VLM_SERVICE_TOKEN="YOUR_VLM_SERVICE_TOKEN" `
  -v street-interface-hf:/models/huggingface `
  --name street-interface-vlm `
  street-interface-vlm-p3
```

Health check:

```powershell
curl.exe `
  -H "Authorization: Bearer YOUR_VLM_SERVICE_TOKEN" `
  http://127.0.0.1:8020/health
```

For the commentary-enabled worker, the health response should report the commentary source as ready.

A `loaded:false` state before inference can be normal because the model is loaded lazily and may be released again after inference.

---

## GPU Runtime Note

The VM and VLM workers may remain running as separate services.

On an 8 GB GPU, they should not perform heavy inference concurrently.

The public application pipeline runs the stages sequentially:

```text
VM → VLM → SIM
```

which helps reduce GPU-memory contention.

---

## Start the Public App

After both workers are configured, start the Node / React application:

```bash
npm run dev
```

On Windows PowerShell:

```powershell
npm.cmd run dev
```

The local application runs at:

```text
http://localhost:3000
```

---

## Gemini / AI Studio Compatibility

The repository preserves server-side Gemini-related research / comparator functionality inherited from the broader research application.

`GEMINI_API_KEY` is therefore still supported.

However, the primary public automated workflow:

```text
Photo → VM → Qwen VLM → SIM
```

uses the configured CUDA VM and VLM workers and does not depend on Gemini for its canonical public analysis path.

Do not commit a real Gemini API key.

---

## Environment Security

The repository includes:

```text
.env.example
```

The real:

```text
.env
```

must remain local and should never be committed.

The `.gitignore` is configured to ignore `.env*` while preserving `.env.example`.

Do not commit:

- Real API keys
- VM service tokens
- VLM service tokens
- Private deployment credentials
- Private server URLs
- Cloud credentials

---

## Internal Research Mode

The application defaults to the public-facing interface.

An inherited research workbench is also available through:

```text
?mode=research
```

This URL parameter is a diagnostic UI routing mechanism only.

It is **not** an access-control mechanism.

If the research interface is deployed outside a trusted environment, production authorization must be implemented separately.

---

## Relationship to Street Interface Measurement — Nature 9.03 v0.7.1 UX

The Street Interface project currently includes two different interfaces.

### Street Interface Measurement — Nature 9.03 v0.7.1 UX

Designed primarily for:

```text
Researchers
Technical planners
Methodological inspection
Scientific validation
```

Focus:

- Detailed analytical workflow
- Intermediate variables
- Formula inspection
- Provenance
- Validation
- Research diagnostics

### Street Interface · Public Streetscape Analysis

Designed primarily for:

```text
Simplified automated use
Future public-facing access
```

Focus:

- One-photo input
- Automated segmentation
- Automated Qwen perceptual analysis
- Automated Street Interface synthesis
- Simplified score presentation
- Independent VLM visual commentary

The two applications share the broader Street Interface research framework but serve different users and purposes.

---

## Research and Deployment Status

This application is currently a research prototype and public development candidate.

Before a final production release, remaining work includes:

- Public same-input repeat-run stability audit
- Full dependency-backed host lint validation
- Full host build validation
- Deployment verification
- Production access-control review
- Additional reproducibility and acceptance checks as required

---

## Repository

**Street Interface · Public Streetscape Analysis — v0.8.0-P4.1**

Automated public-facing interface for the Street Interface Matrix research workflow.