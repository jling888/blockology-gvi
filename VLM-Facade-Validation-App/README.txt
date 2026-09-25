VLM FACADE VALIDATION APP
=========================

CONTENTS

app_final.py
    Main Streamlit application.

facade_score_config.json
    Frozen Facade Mask Score v1 calibration configuration.

validation_master.csv
    Pilot/demo validation dataset used by the application.

sample_data/BATCH_SUMMARY.csv
    Example segmentation output.

requirements.txt
    Python packages required to run the application.


HOW TO RUN
==========

1. Install Python.

2. Open a terminal in this folder.

3. Install dependencies:

   pip install -r requirements.txt

4. Start the application:

   streamlit run app_final.py

5. The application will open in your web browser.


UPLOAD MODE
===========

For a new validation batch, upload TWO CSV files:

1. vlm_measured.csv
2. BATCH_SUMMARY.csv

The application matches the VLM 'file' field with the
segmentation 'source_name' field.


IMPORTANT
=========

- VM/segmentation outputs are not modified by this App.
- VLM scores are not modified by this App.
- facade_score_config.json contains the frozen pilot calibration.
- Spearman correlation measures ordinal correspondence,
  not prediction accuracy.
