# Street Interface Measurement — Nature 9.03 v0.7.1 UX

A research-oriented application for inspecting, validating, and documenting the full Street Interface Measurement workflow.

This repository contains the **research / technical interface** of the Street Interface project. It is designed to expose the analytical process rather than hide it behind a simplified public-facing workflow.

---

## Purpose

This version is intended for researchers, planners, and technical users who need to understand how the Street Interface score is produced.

Unlike the public-facing application, this version exposes the analytical workflow, intermediate variables, formulas, provenance, validation logic, and final calculation results.

The emphasis of this interface is:

- Methodological transparency
- Research validation
- Technical inspection
- Reproducibility
- Scientific provenance
- Step-by-step review of the Street Interface calculation process

---

## Required Inputs

The primary workflow uses three main inputs:

1. **Original street-view image**
2. **Semantic segmentation mask**
3. **VLM-generated CSV file**

### 1. Original Street-View Image

The original RGB street-view image provides the visual reference for the analyzed street scene.

### 2. Semantic Segmentation Mask

The segmentation mask provides pixel-classified evidence used for quantitative streetscape measurements and taxonomy-based analysis.

### 3. VLM-Generated CSV

The VLM CSV provides structured perceptual evidence used by the Street Interface synthesis workflow.

The current workflow is designed around matched VLM observation data associated with the corresponding street-view node.

---

## Workflow

The application presents the Street Interface analysis pipeline step by step.

The workflow includes:

- Original street-view image input
- Semantic segmentation mask input
- Segmentation-based quantitative measurements
- VLM observation data integration
- Street-view node matching
- Provenance checks
- Research-data validation
- Nature 9.03 variables and formulas
- Imageability calculation
- Identity calculation
- Dependence calculation
- Street Interface Matrix synthesis
- Final Street Interface score
- Validation panels
- Research diagnostics
- Export and reporting functions

The purpose of this workflow is not only to produce a final score, but also to make the analytical process inspectable.

---

## Research Role

This interface is intended to support:

- Research validation
- Planning analysis
- Method inspection
- Reproducibility checks
- Review of intermediate measurements
- Scientific provenance inspection
- Comparison between image-derived and VLM-derived evidence
- Verification of Street Interface Matrix calculations
- Technical review of the Nature 9.03 workflow

The application should therefore be treated primarily as a **research and technical instrument**.

---

## Scientific Baseline

Current workflow candidate:

```text
v0.7.1-UX1.3 FINAL UI CLEANUP CANDIDATE
```

Base verified release:

```text
v0.7.0 RELEASE VERIFIED
```

Scientific core:

```text
v0.6.3_GOLDEN_FREEZE
```

Integration schema:

```text
V0_7_0_MULTI_SOURCE_INTEGRATION_RC1
```

Deterministic validation:

```text
66 / 66 PASS
```

Current release status:

```text
WORKFLOW_CANDIDATE
```

Host lint / build validation:

```text
PENDING_USER_HOST_VALIDATION
```

Scientific change:

```text
false
```

Workflow change:

```text
true
```

The v0.7.1 UX update modifies the user interface and operator workflow only.

It does **not** modify the frozen scientific computation, Qwen mapping logic, GWR values, or the frozen Street Interface Matrix engine.

---

## Street Interface Structure

The current scientific synthesis follows the **Nature 9.03 No-Omega framework**.

The interface exposes three principal dimensions:

- **Imageability**
- **Identity**
- **Dependence**

These dimensions are combined by the frozen Street Interface synthesis engine to produce the final Street Interface score.

The current verified scientific structure uses:

```text
M = I^a × Y^b × D^c
```

where:

- `I` = Imageability
- `Y` = Identity
- `D` = Dependence
- `a`, `b`, and `c` = calibrated exponents

The current frozen verification record uses:

```text
a = 0.4
b = 0.2
c = 0.4
```

The current scientific core does not use:

- Active Omega weighting
- External environmental A_i term

---

## Verified Scientific Invariants

The current release verification record preserves the following scientific invariants:

```text
Imageability (I) = 6.785792291750779
Identity (Y)     = 4.275239548226926
Dependence (D)   = 6.861271847132807

a = 0.4
b = 0.2
c = 0.4

Street Interface Score (M) = 6.214327916148292
```

Verification status:

```text
NATURE_9_03_V0_7_0_MULTI_SOURCE_RESEARCH_INTEGRATION_VERIFIED
```

These values are part of the deterministic validation baseline and are not intended to represent every user-uploaded street scene.

---

## UX Workflow Changes

The current v0.7.1 UX candidate includes workflow and interface cleanup while preserving the scientific core.

Key workflow changes include:

- Simplified operator workflow
- Presentation screenshot recovery enabled automatically
- Presentation recovery hidden from the primary operator interface
- Duplicate Team Repository CSV upload removed
- Matched VLM working data automatically loaded
- Eligible matched repository rows automatically authorized for paper assembly
- Direct Qwen CSV import removed from the primary operator UI
- Team Repository and approval details moved into Advanced Provenance
- Report and PDF version labels synchronized with the current workflow candidate
- Authorization wording updated to distinguish automatic repository authorization from legacy explicit approval

These changes are workflow-level changes only.

---

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

On Windows PowerShell, if script execution blocks `npm`, use:

```powershell
npm.cmd install
npm.cmd run dev
```

---

## Environment Variables

The repository includes:

```text
.env.example
```

The example environment file contains placeholders only.

Do **not** commit a real `.env` file containing private API keys, service credentials, or deployment secrets.

For AI Studio / Gemini-related functions, configure required secrets through the appropriate environment or AI Studio Secrets panel.

Example placeholder structure:

```env
GEMINI_API_KEY="MY_GEMINI_API_KEY"
APP_URL="MY_APP_URL"
```

Never replace these placeholders with private credentials in a public GitHub commit.

---

## Repository Structure

Key directories include:

```text
src/
server/
public/
release/
scripts/
tool/
assets/
```

Key files include:

```text
README.md
package.json
server.ts
tsconfig.json
vite.config.ts
metadata.json
.env.example
.gitignore
```

### `src/`

Contains the main React / TypeScript application interface and research UI components.

### `server/`

Contains server-side logic and application services.

### `public/`

Contains public research assets and data used by the application.

### `release/`

Contains release status, scientific verification, integrity, reproducibility, and acceptance records.

### `scripts/`

Contains development, validation, or research workflow scripts.

### `tool/`

Contains supporting research and processing tools.

---

## Release and Verification Records

The `release/` directory contains files documenting the current workflow candidate and scientific baseline.

The current release metadata identifies:

```text
Release label:
v0.7.1-UX1.3 FINAL UI CLEANUP CANDIDATE

Release status:
WORKFLOW_CANDIDATE

Base verified release:
v0.7.0 RELEASE VERIFIED

Scientific core:
v0.6.3_GOLDEN_FREEZE

Deterministic validation:
66/66 PASS
```

The scientific computation is frozen relative to the verified baseline.

The remaining host-side validation status is:

```text
PENDING_USER_HOST_VALIDATION
```

---

## Data and Provenance

The repository includes research-data and provenance-related assets used by the application.

These may include:

- Street-view node contracts
- Blockology node context
- GWR-related research data
- Repository audit records
- Dataset manifests
- Research integration provenance

These resources support reproducibility and source tracking within the Street Interface research workflow.

---

## Relationship to the Public App

This repository represents the **transparent research-oriented version** of the Street Interface application.

A separate application, **Street Interface · Public Streetscape Analysis**, is designed around a different user experience.

The public-facing application automates the workflow from a single uploaded street photograph, including:

- Vision segmentation
- Semantic classification
- Qwen2-VL perceptual analysis
- VLM visual commentary
- Nature 9.03 Street Interface synthesis
- Final Street Interface score

The two applications therefore serve different purposes.

### This Repository

```text
Research / Technical Interface
```

Focus:

- Transparency
- Formula inspection
- Intermediate variables
- Manual research inputs
- Validation
- Provenance
- Methodological auditing

### Public Streetscape Analysis

```text
Automated / Public-Facing Interface
```

Focus:

- Accessibility
- Automation
- Minimal user input
- One-image workflow
- Simplified presentation of results

The two applications are based on the same broader Street Interface research framework but are designed for different users and use cases.

---

## Current Status

This repository is currently classified as:

```text
Research Prototype
Workflow Candidate
```

It should not yet be treated as a final production release.

Before final production release, remaining validation tasks include:

- Host lint validation
- Host build validation
- Project-specific acceptance checks
- Final deployment verification
- Additional reproducibility checks where required

---

## Notes

The current v0.7.1 UX work is intended to improve usability and operator workflow without introducing new scientific computation.

The frozen scientific baseline remains unchanged.

For research interpretation, validation records in the `release/` directory should be treated as the authoritative source for the current release candidate status.

---

## Repository

**Street Interface Measurement — Nature 9.03 v0.7.1 UX**

Research / technical interface for the Street Interface Matrix workflow.