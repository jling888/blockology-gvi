## Current Stable Version

**v1.5.7.1 — Share-Ready Audited**

Main notebook:

`Vision_Model_Segmentation_Taxonomy_v1_5_7_1_SHARE_READY_AUDITED.ipynb`

This is the current stable shared baseline for the Vision Model → Segmentation Taxonomy pipeline.

### Current pipeline features

- Semantic-backbone-protected segmentation
- Google Street View screenshot artifact handling
- Tree / glazing protection
- Woody trunk and branch recovery
- Scaffold precedence protection
- Boundary wall and awning recovery
- Bike lane merged into roadway in final outputs
- Local false-sidewalk → roadway cleanup
- 30-ID internal taxonomy for runtime compatibility
- Final scientific state synchronized across QA, statistics, label export, and visualization
- Layout-safe final summary figure

### Recommended Environment

Google Colab with GPU.

### Usage

1. Open the notebook in Google Colab.
2. Select a GPU runtime.
3. Run all cells.
4. Upload one street-view image when prompted.
5. Review the final Combined Semantic Mask and exported statistics.

### Status

This version is the current **share-ready audited baseline**.
