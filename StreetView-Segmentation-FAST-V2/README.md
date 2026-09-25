# Street-View Semantic Segmentation — FAST V2 BALANCED

Batch semantic segmentation for street-view imagery using a hybrid pipeline:

- SegFormer B5 / ADE20K
- Mask2Former / Mapillary Vistas
- Grounding DINO
- SAM2

The pipeline produces a stable taxonomy label map, a standalone color mask, a visual summary, and per-image CSV percentages.

## Important

This repository contains the inference pipeline and taxonomy, not model weights. Model weights are downloaded automatically from Hugging Face on the first run.

The current scaffold refinement is **Scaffold Precision Fix V2**. It was designed to reduce scaffold false positives. It should still be validated on additional positive scaffold examples before being treated as a universal benchmark.

## Requirements

Recommended:

- Windows or Linux
- Python 3.11
- NVIDIA CUDA GPU
- 8 GB VRAM or more
- 16 GB+ system RAM
- Internet connection for the first model download

The notebook automatically uses low-VRAM model swapping when GPU VRAM is below 12 GB.

## Installation

### 1. Create an environment

```bash
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

Linux/macOS shell:

```bash
source .venv/bin/activate
```

### 2. Install CUDA-enabled PyTorch

Install the CUDA build of PyTorch appropriate for your system from the official PyTorch installation instructions.

Verify:

```bash
python -c "import torch; print(torch.cuda.is_available()); print(torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'NO GPU')"
```

`torch.cuda.is_available()` should return `True`.

### 3. Install the remaining packages

```bash
pip install -r requirements.txt
```

### 4. Start Jupyter

```bash
python -m notebook
```

Open `segmentation.ipynb`.

## Folder structure

```text
StreetView-Semantic-Segmentation/
├── segmentation.ipynb
├── requirements.txt
├── README.md
├── .gitignore
├── input_images/
│   └── .gitkeep
└── outputs/                  # created automatically; ignored by Git
```

Put street-view images inside `input_images/`.

## First run

The public notebook defaults to:

```python
MAX_IMAGES = 3
RESUME = True
```

Run three images first. After confirming everything works, change:

```python
MAX_IMAGES = None
```

Then restart the kernel and run all cells again.

## Outputs

```text
outputs/
├── summary_images/
├── mask_images/
├── label_maps/
├── audit_outputs/
├── segmentation_results.csv
└── errors.log
```

### Percentage denominator

Class percentages are calculated as:

```text
class pixels / all valid non-IGNORE pixels × 100
```

`IGNORE=255` pixels are excluded from the denominator.

`bike_lane` is remapped to `roadway` in final outputs.

## Models

The notebook downloads these models automatically:

- `nvidia/segformer-b5-finetuned-ade-640-640`
- `facebook/mask2former-swin-large-mapillary-vistas-semantic`
- `IDEA-Research/grounding-dino-base`
- `facebook/sam2.1-hiera-small`

## Notes on reproducibility

Exact masks can vary slightly across GPU models, CUDA/PyTorch versions, Transformers versions, and FP16 execution. The scientific taxonomy and refinement logic are fixed in the notebook, but bit-for-bit identity across machines is not guaranteed.

## License

No license file is included by default. Add a license only after deciding how you want others to reuse the code.
