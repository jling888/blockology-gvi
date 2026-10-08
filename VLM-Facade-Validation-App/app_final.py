
import streamlit as st
import pandas as pd
import numpy as np
import json
import matplotlib.pyplot as plt
from scipy.stats import spearmanr
from pathlib import Path


# =========================================================
# PAGE SETUP
# =========================================================

st.set_page_config(
    page_title="VLM Facade Validation",
    page_icon="🏙️",
    layout="wide"
)

st.title("VLM Facade Validation Tool")

st.caption(
    "Validation of VLM-derived facade variation and GFAPI using "
    "quantitative physical evidence extracted from segmentation masks. "
    "Segmentation features are treated as supporting evidence rather than direct ground truth."
)


# =========================================================
# PATHS
# =========================================================

BASE_DIR = Path(__file__).resolve().parent

DEMO_DATA_PATH = BASE_DIR / "validation_master.csv"
CONFIG_PATH = BASE_DIR / "facade_score_config.json"


# =========================================================
# LOAD CALIBRATION CONFIG
# =========================================================

try:
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        score_config = json.load(f)

except Exception as e:
    st.error(
        "Cannot load facade_score_config.json. "
        "Please make sure Step 26A has been completed."
    )
    st.exception(e)
    st.stop()


score_features = list(
    score_config["features"].keys()
)


# =========================================================
# FUNCTIONS
# =========================================================

def safe_spearman(data, x, y):

    if x not in data.columns or y not in data.columns:
        return np.nan, np.nan, 0

    temp = data[[x, y]].dropna()

    if len(temp) < 3:
        return np.nan, np.nan, len(temp)

    if (
        temp[x].nunique() < 2
        or temp[y].nunique() < 2
    ):
        return np.nan, np.nan, len(temp)

    rho, p = spearmanr(
        temp[x],
        temp[y]
    )

    return float(rho), float(p), len(temp)



def calculate_facade_mask_score(data, config):

    result = data.copy()

    normalized_columns = []

    out_of_range_flags = []

    for feature, settings in config["features"].items():

        if feature not in result.columns:
            raise ValueError(
                f"Required mask feature missing: {feature}"
            )

        result[feature] = pd.to_numeric(
            result[feature],
            errors="coerce"
        )

        feature_min = float(settings["min"])
        feature_max = float(settings["max"])

        denominator = feature_max - feature_min

        if denominator == 0:
            normalized_raw = pd.Series(
                0,
                index=result.index,
                dtype=float
            )
        else:
            normalized_raw = (
                result[feature] - feature_min
            ) / denominator

        # Record whether a new observation falls outside
        # the pilot calibration range.
        outside = (
            (normalized_raw < 0)
            | (normalized_raw > 1)
        )

        out_of_range_flags.append(outside)

        # Fixed calibration:
        # values beyond the reference range are clipped
        # for the composite score.
        normalized = normalized_raw.clip(
            lower=0,
            upper=1
        )

        norm_col = f"{feature}_norm"

        result[norm_col] = normalized

        normalized_columns.append(norm_col)


    # Equal-weight average
    result["facade_mask_score"] = (
        result[normalized_columns]
        .mean(axis=1)
        * 100
    )


    # Calibration range warning
    if len(out_of_range_flags) > 0:

        combined_flag = out_of_range_flags[0].copy()

        for flag in out_of_range_flags[1:]:
            combined_flag = combined_flag | flag

        result["calibration_out_of_range"] = (
            combined_flag
        )

    else:
        result["calibration_out_of_range"] = False


    return result



def build_validation_dataset(
    vlm_df,
    mask_df,
    config
):

    # -----------------------------------------------------
    # Required VLM columns
    # -----------------------------------------------------

    required_vlm = [
        "file",
        "facade_variation"
    ]

    missing_vlm = [
        c for c in required_vlm
        if c not in vlm_df.columns
    ]

    if missing_vlm:
        raise ValueError(
            "VLM CSV missing columns: "
            + ", ".join(missing_vlm)
        )


    # -----------------------------------------------------
    # Required mask columns
    # -----------------------------------------------------

    required_mask = [
        "source_name"
    ] + list(
        config["features"].keys()
    )

    missing_mask = [
        c for c in required_mask
        if c not in mask_df.columns
    ]

    if missing_mask:
        raise ValueError(
            "BATCH_SUMMARY CSV missing columns: "
            + ", ".join(missing_mask)
        )


    # -----------------------------------------------------
    # Prevent accidental duplicate expansion
    # -----------------------------------------------------

    duplicate_vlm = vlm_df[
        "file"
    ].duplicated().sum()

    duplicate_mask = mask_df[
        "source_name"
    ].duplicated().sum()


    # -----------------------------------------------------
    # Merge
    # -----------------------------------------------------

    # Keep VLM ratings authoritative when a BATCH_SUMMARY
    # already carries copied facade_variation / ground_floor_activity
    # columns from an earlier processing step.
    mask_for_merge = mask_df.drop(
        columns=[
            c for c in [
                "facade_variation",
                "ground_floor_activity"
            ]
            if c in mask_df.columns
        ],
        errors="ignore"
    )

    merged = mask_for_merge.merge(
        vlm_df,
        left_on="source_name",
        right_on="file",
        how="left",
        suffixes=("_mask", "_vlm")
    )


    # -----------------------------------------------------
    # Calculate score
    # -----------------------------------------------------

    merged = calculate_facade_mask_score(
        merged,
        config
    )


    return (
        merged,
        duplicate_vlm,
        duplicate_mask
    )



def format_p(p):

    if pd.isna(p):
        return "N/A"

    if p < 0.001:
        return "< 0.001"

    return f"{p:.4f}"


# =========================================================
# SIDEBAR — DATA SOURCE
# =========================================================

st.sidebar.header("Data Source")

data_mode = st.sidebar.radio(
    "Choose validation mode",
    [
        "Pilot dataset",
        "Upload new dataset"
    ]
)


# =========================================================
# MODE A — PILOT
# =========================================================

if data_mode == "Pilot dataset":

    try:
        validation_df = pd.read_csv(
            DEMO_DATA_PATH
        )

    except Exception as e:
        st.error(
            "Pilot validation_master.csv "
            "could not be loaded."
        )

        st.exception(e)
        st.stop()

    st.sidebar.success(
        "Using 20-case pilot dataset"
    )

    match_total = len(validation_df)
    matched_count = len(validation_df)
    missing_count = 0

    duplicate_vlm = 0
    duplicate_mask = 0


# =========================================================
# MODE B — UPLOAD
# =========================================================

else:

    st.sidebar.markdown(
        """
        Upload both files:

        **1. VLM results**
        `vlm_measured.csv`

        **2. Segmentation summary**
        `BATCH_SUMMARY.csv`

        The App keeps VLM ratings from
        `vlm_measured.csv` as the authoritative
        SFV / GFA values during matching.
        """
    )

    uploaded_vlm = st.sidebar.file_uploader(
        "Upload VLM CSV",
        type=["csv"],
        key="vlm_upload"
    )

    uploaded_mask = st.sidebar.file_uploader(
        "Upload BATCH_SUMMARY CSV",
        type=["csv"],
        key="mask_upload"
    )


    if (
        uploaded_vlm is None
        or uploaded_mask is None
    ):

        st.info(
            "Upload both the VLM CSV and "
            "BATCH_SUMMARY CSV to begin validation."
        )

        st.stop()


    try:

        vlm_df = pd.read_csv(
            uploaded_vlm
        )

        mask_df = pd.read_csv(
            uploaded_mask
        )


        match_total = len(mask_df)

        validation_df, duplicate_vlm, duplicate_mask = (
            build_validation_dataset(
                vlm_df,
                mask_df,
                score_config
            )
        )


        matched_count = (
            validation_df[
                "facade_variation"
            ]
            .notna()
            .sum()
        )

        missing_count = (
            validation_df[
                "facade_variation"
            ]
            .isna()
            .sum()
        )


    except Exception as e:

        st.error(
            "Validation dataset could not be created."
        )

        st.exception(e)
        st.stop()


# =========================================================
# CONVERT NUMERIC COLUMNS
# =========================================================

numeric_candidates = [
    "facade_variation",
    "ground_floor_activity",
    "upper_facade_pct",
    "upper_glazing_pct",
    "ground_glazing_pct",
    "stoop_pct",
    "awning_pct",
    "scaffold_pct",
    "facade_mask_score"
]

for col in numeric_candidates:

    if col in validation_df.columns:

        validation_df[col] = pd.to_numeric(
            validation_df[col],
            errors="coerce"
        )


# =========================================================
# SIDEBAR — CALIBRATION INFORMATION
# =========================================================

st.sidebar.divider()

st.sidebar.header(
    "Facade Mask Score"
)

st.sidebar.write(
    f"Version: **{score_config.get('version', 'v1')}**"
)

st.sidebar.write(
    "Normalization: **Fixed Min-Max**"
)

st.sidebar.write(
    "Weighting: **Equal**"
)

st.sidebar.caption(
    "Normalization parameters are fixed "
    "from the pilot calibration dataset."
)


# =========================================================
# 1 — DATA MATCHING
# =========================================================

st.header("1. Data Matching")

m1, m2, m3, m4 = st.columns(4)

m1.metric(
    "Mask Cases",
    match_total
)

m2.metric(
    "Matched",
    int(matched_count)
)

m3.metric(
    "Unmatched",
    int(missing_count)
)

match_rate = (
    matched_count / match_total * 100
    if match_total > 0
    else 0
)

m4.metric(
    "Match Rate",
    f"{match_rate:.1f}%"
)


if duplicate_vlm > 0:
    st.warning(
        f"VLM file contains "
        f"{duplicate_vlm} duplicated file IDs."
    )

if duplicate_mask > 0:
    st.warning(
        f"BATCH_SUMMARY contains "
        f"{duplicate_mask} duplicated source_name values."
    )


if missing_count == 0:
    st.success(
        "All mask cases were matched "
        "to VLM observations."
    )

else:

    st.warning(
        f"{missing_count} mask case(s) "
        "could not be matched."
    )

    if "source_name" in validation_df.columns:

        unmatched = validation_df[
            validation_df[
                "facade_variation"
            ].isna()
        ]

        with st.expander(
            "View unmatched cases"
        ):

            st.dataframe(
                unmatched[
                    ["source_name"]
                ],
                use_container_width=True,
                hide_index=True
            )


# =========================================================
# KEEP MATCHED CASES FOR VALIDATION
# =========================================================

analysis_df = validation_df[
    validation_df[
        "facade_variation"
    ].notna()
].copy()


st.divider()


# =========================================================
# 2 — VALIDATION OVERVIEW
# =========================================================

st.header("2. Validation Overview")

rho_sfv, p_sfv, n_sfv = safe_spearman(
    analysis_df,
    "facade_variation",
    "facade_mask_score"
)

rho_gfa, p_gfa, n_gfa = safe_spearman(
    analysis_df,
    "ground_floor_activity",
    "facade_mask_score"
)


c1, c2, c3, c4 = st.columns(4)

c1.metric(
    "Validation Cases",
    len(analysis_df)
)


if pd.notna(rho_sfv):
    c2.metric(
        "SFV ↔ Mask Score",
        f"ρ = {rho_sfv:.3f}"
    )
else:
    c2.metric(
        "SFV ↔ Mask Score",
        "N/A"
    )


c3.metric(
    "SFV p-value",
    format_p(p_sfv)
)


if pd.notna(rho_gfa):

    c4.metric(
        "GFAPI ↔ Facade Mask Score",
        f"ρ = {rho_gfa:.3f}"
    )

else:

    c4.metric(
        "GFAPI ↔ Facade Mask Score",
        "N/A"
    )


if pd.notna(rho_sfv):

    if p_sfv < 0.05:

        st.success(
            f"Facade Mask Score shows a statistically "
            f"significant positive association with "
            f"VLM facade variation "
            f"(Spearman ρ = {rho_sfv:.3f}, "
            f"p = {format_p(p_sfv)}, "
            f"n = {n_sfv})."
        )

    else:

        st.info(
            f"Facade Mask Score and VLM facade variation: "
            f"Spearman ρ = {rho_sfv:.3f}, "
            f"p = {format_p(p_sfv)}, "
            f"n = {n_sfv}."
        )


st.caption(
    "Spearman correlation is used because "
    "VLM facade variation is an ordinal rating. "
    "Correlation is not equivalent to prediction accuracy."
)


# =========================================================
# OUT-OF-RANGE CALIBRATION CHECK
# =========================================================

if "calibration_out_of_range" in analysis_df.columns:

    out_range_n = int(
        analysis_df[
            "calibration_out_of_range"
        ].sum()
    )

    if out_range_n > 0:

        st.warning(
            f"{out_range_n} case(s) contain mask feature values "
            f"outside the pilot calibration range. "
            f"The normalized values were clipped to 0–1 "
            f"for Facade Mask Score calculation."
        )


st.divider()


# =========================================================
# 3 — SFV GROUP COMPARISON
# =========================================================

st.header(
    "3. VLM Facade Variation Groups"
)

group_summary = (
    analysis_df
    .groupby(
        "facade_variation"
    )[
        "facade_mask_score"
    ]
    .agg(
        n="count",
        mean="mean",
        median="median",
        std="std"
    )
    .reset_index()
)


if len(group_summary) > 0:

    group_summary[
        ["mean", "median", "std"]
    ] = group_summary[
        ["mean", "median", "std"]
    ].round(3)


    g1, g2 = st.columns(
        [1, 1.5]
    )


    with g1:

        st.markdown(
            "#### Group Statistics"
        )

        st.dataframe(
            group_summary,
            use_container_width=True,
            hide_index=True
        )


    with g2:

        st.markdown(
            "#### Mean Facade Mask Score"
        )

        chart_df = (
            group_summary[
                [
                    "facade_variation",
                    "mean"
                ]
            ]
            .set_index(
                "facade_variation"
            )
        )

        st.bar_chart(
            chart_df
        )


st.caption(
    "Increasing mask-derived scores across "
    "higher VLM SFV groups indicate ordinal consistency."
)


st.divider()


# =========================================================
# 4 — MASK FEATURE VALIDATION
# =========================================================

st.header(
    "4. Individual Mask Feature Validation"
)

feature_cols = [
    "stoop_pct",
    "ground_glazing_pct",
    "upper_glazing_pct",
    "upper_facade_pct",
    "scaffold_pct",
    "awning_pct"
]

feature_results = []

for feature in feature_cols:

    if feature in analysis_df.columns:

        rho, p, n = safe_spearman(
            analysis_df,
            "facade_variation",
            feature
        )

        feature_results.append(
            {
                "Mask Feature": feature,
                "Spearman rho": rho,
                "p-value": p,
                "n": n
            }
        )


feature_corr = pd.DataFrame(
    feature_results
)


if len(feature_corr) > 0:

    feature_corr = (
        feature_corr
        .sort_values(
            "Spearman rho",
            ascending=False
        )
    )

    feature_corr[
        "Spearman rho"
    ] = feature_corr[
        "Spearman rho"
    ].round(3)

    feature_corr[
        "p-value"
    ] = feature_corr[
        "p-value"
    ].round(4)


    f1, f2 = st.columns(
        [1.3, 1]
    )


    with f1:

        st.dataframe(
            feature_corr,
            use_container_width=True,
            hide_index=True
        )


    with f2:

        feature_chart = (
            feature_corr[
                [
                    "Mask Feature",
                    "Spearman rho"
                ]
            ]
            .set_index(
                "Mask Feature"
            )
        )

        st.bar_chart(
            feature_chart
        )


st.divider()


# =========================================================
# 5 — SFV CONSTRUCT VALIDATION
# =========================================================

st.header(
    "5. SFV Construct Validation"
)

st.caption(
    "Comparison between the VLM-derived ordinal SFV rating "
    "and the segmentation-derived Facade Mask Score."
)

scatter_cols = [
    "facade_variation",
    "facade_mask_score"
]

if "case_id" in analysis_df.columns:
    scatter_cols.insert(
        0,
        "case_id"
    )

scatter_data = (
    analysis_df[
        scatter_cols
    ]
    .dropna(
        subset=[
            "facade_variation",
            "facade_mask_score"
        ]
    )
)

rho_sfv_plot, p_sfv_plot, n_sfv_plot = safe_spearman(
    scatter_data,
    "facade_variation",
    "facade_mask_score"
)

fig_sfv, ax_sfv = plt.subplots(
    figsize=(9, 6)
)

ax_sfv.scatter(
    scatter_data["facade_variation"],
    scatter_data["facade_mask_score"],
    alpha=0.75,
    s=55
)

ax_sfv.set_xlim(
    0.5,
    7.5
)

ax_sfv.set_xticks(
    [1, 2, 3, 4, 5, 6, 7]
)

ax_sfv.set_xlabel(
    "VLM SFV Score (1–7)"
)

ax_sfv.set_ylabel(
    "Facade Mask Score (0–100)"
)

ax_sfv.set_ylim(
    0,
    100
)

ax_sfv.set_title(
    "SFV Construct Validation:\n"
    "VLM Rating vs. Facade Mask Score"
)

p_text = (
    "N/A"
    if pd.isna(p_sfv_plot)
    else (
        "< 0.001"
        if p_sfv_plot < 0.001
        else f"{p_sfv_plot:.4f}"
    )
)

stats_text = (
    f"Spearman ρ = {rho_sfv_plot:.3f}\n"
    f"p = {p_text}\n"
    f"n = {n_sfv_plot}"
)

ax_sfv.text(
    0.03,
    0.97,
    stats_text,
    transform=ax_sfv.transAxes,
    va="top",
    ha="left",
    fontsize=10,
    bbox=dict(
        boxstyle="round",
        alpha=0.15
    )
)

fig_sfv.tight_layout()

st.pyplot(
    fig_sfv,
    use_container_width=True
)

plt.close(fig_sfv)

st.caption(
    "Each point represents one matched street-view image. "
    "Spearman's ρ measures ordinal correspondence, not prediction accuracy."
)


st.divider()


# =========================================================
# 6 — GFAPI VALIDATION
# =========================================================

st.header(
    "6. Ground-Floor Active Permeability Index (GFAPI) Validation"
)

st.caption(
    "GFAPI is the VLM-derived ordinal rating stored in "
    "`ground_floor_activity`. Segmentation-derived variables are used "
    "as supporting physical evidence, not as direct ground truth, because "
    "their pixel-based definitions do not reproduce the GFAPI perceptual "
    "construct exactly."
)


gfapi_supporting_features = [
    "ground_glazing_pct",
    "awning_pct",
    "stoop_pct",
]

gfapi_diagnostic_features = [
    "upper_glazing_pct",
    "upper_facade_pct",
    "scaffold_pct",
]

gfapi_all_features = (
    gfapi_supporting_features
    + gfapi_diagnostic_features
)


gfapi_required = [
    "ground_floor_activity",
    "facade_variation",
] + gfapi_all_features


gfapi_missing = [
    c for c in gfapi_required
    if c not in analysis_df.columns
]


if gfapi_missing:

    st.warning(
        "GFAPI validation is unavailable because the current "
        "dataset is missing: "
        + ", ".join(gfapi_missing)
    )

else:

    gfapi_valid = analysis_df[
        analysis_df[
            "ground_floor_activity"
        ].notna()
    ].copy()

    # -----------------------------------------------------
    # 5.1 GFAPI DISTRIBUTION
    # -----------------------------------------------------

    gfapi_distribution = (
        gfapi_valid[
            "ground_floor_activity"
        ]
        .value_counts()
        .sort_index()
        .rename_axis(
            "ground_floor_activity"
        )
        .reset_index(
            name="n"
        )
    )

    gd1, gd2 = st.columns(
        [1, 1.5]
    )

    with gd1:

        st.markdown(
            "#### 6.1 GFAPI Distribution"
        )

        st.dataframe(
            gfapi_distribution,
            use_container_width=True,
            hide_index=True
        )

    with gd2:

        st.markdown(
            "#### 6.2 Physical-Evidence Roles"
        )

        role_table = pd.DataFrame(
            {
                "Feature":
                    gfapi_supporting_features
                    + gfapi_diagnostic_features,

                "Role":
                    ["Supporting Physical Evidence"] * len(
                        gfapi_supporting_features
                    )
                    + ["Diagnostic / Control"] * len(
                        gfapi_diagnostic_features
                    )
            }
        )

        st.dataframe(
            role_table,
            use_container_width=True,
            hide_index=True
        )

        st.caption(
            "These roles describe how the segmentation variables are used "
            "for validation. They do not redefine the VM outputs or the VLM GFAPI score."
        )


    # -----------------------------------------------------
    # 5.3 SPEARMAN CORRESPONDENCE
    # -----------------------------------------------------

    gfapi_results = []

    for feature in gfapi_all_features:

        rho_gfapi_f, p_gfapi_f, n_gfapi_f = (
            safe_spearman(
                gfapi_valid,
                "ground_floor_activity",
                feature
            )
        )

        rho_sfv_f, p_sfv_f, n_sfv_f = (
            safe_spearman(
                gfapi_valid,
                "facade_variation",
                feature
            )
        )

        gfapi_results.append(
            {
                "feature": feature,

                "role": (
                    "Supporting Physical Evidence"
                    if feature
                    in gfapi_supporting_features
                    else "Diagnostic / Control"
                ),

                "rho_GFAPI": rho_gfapi_f,
                "p_GFAPI": p_gfapi_f,

                "rho_SFV": rho_sfv_f,
                "p_SFV": p_sfv_f,

                "correspondence_delta_GFAPI_minus_SFV":
                    (
                        rho_gfapi_f - rho_sfv_f
                        if (
                            pd.notna(rho_gfapi_f)
                            and pd.notna(rho_sfv_f)
                        )
                        else np.nan
                    ),

                "n": n_gfapi_f
            }
        )


    gfapi_results_df = pd.DataFrame(
        gfapi_results
    )

    display_gfapi_results = (
        gfapi_results_df.copy()
    )

    for col in [
        "rho_GFAPI",
        "p_GFAPI",
        "rho_SFV",
        "p_SFV",
        "correspondence_delta_GFAPI_minus_SFV"
    ]:

        display_gfapi_results[col] = (
            display_gfapi_results[col]
            .round(4)
        )

    st.markdown(
        "#### 6.3 Spearman Correspondence"
    )

    st.dataframe(
        display_gfapi_results,
        use_container_width=True,
        hide_index=True
    )

    st.caption(
        "Spearman's ρ describes ordinal correspondence, not prediction accuracy. "
        "A weak coefficient does not by itself identify whether disagreement comes "
        "from the VLM rating, the segmentation measurement, or construct mismatch."
    )


    # -----------------------------------------------------
    # 5.4 GROUP MEAN / MEDIAN
    # -----------------------------------------------------

    gfapi_group_mean = (
        gfapi_valid
        .groupby(
            "ground_floor_activity"
        )[gfapi_all_features]
        .mean()
        .reset_index()
    )

    gfapi_group_median = (
        gfapi_valid
        .groupby(
            "ground_floor_activity"
        )[gfapi_all_features]
        .median()
        .reset_index()
    )

    st.markdown(
        "#### 6.4 Group-wise Physical Evidence"
    )

    gm1, gm2 = st.columns(2)

    with gm1:

        st.markdown(
            "##### Group Means"
        )

        st.dataframe(
            gfapi_group_mean.round(3),
            use_container_width=True,
            hide_index=True
        )

    with gm2:

        st.markdown(
            "##### Group Medians"
        )

        st.dataframe(
            gfapi_group_median.round(3),
            use_container_width=True,
            hide_index=True
        )


    # -----------------------------------------------------
    # FIGURE 1 — GFAPI vs SFV CORRESPONDENCE
    # -----------------------------------------------------

    st.markdown(
        "##### GFAPI vs SFV Correspondence"
    )

    fig1, ax1 = plt.subplots(
        figsize=(11, 6)
    )

    x = np.arange(
        len(gfapi_results_df)
    )

    width = 0.35

    ax1.bar(
        x - width / 2,
        gfapi_results_df["rho_GFAPI"],
        width,
        label="Correlation with GFAPI"
    )

    ax1.bar(
        x + width / 2,
        gfapi_results_df["rho_SFV"],
        width,
        label="Correlation with SFV"
    )

    ax1.axhline(
        0,
        linewidth=1
    )

    ax1.set_xticks(x)

    ax1.set_xticklabels(
        gfapi_results_df["feature"],
        rotation=35,
        ha="right"
    )

    ax1.set_ylabel(
        "Spearman's ρ"
    )

    ax1.set_title(
        "Correspondence of Segmentation-Derived Physical Evidence:\n"
        "GFAPI vs Facade Variation"
    )

    ax1.legend()

    fig1.tight_layout()

    st.pyplot(
        fig1,
        use_container_width=True
    )

    plt.close(fig1)


    # -----------------------------------------------------
    # FIGURE 2 — SUPPORTING FEATURE TRENDS
    # -----------------------------------------------------

    st.markdown(
        "##### Supporting Physical Evidence across GFAPI Levels"
    )

    fig2, ax2 = plt.subplots(
        figsize=(10, 6)
    )

    for feature in gfapi_supporting_features:

        means = (
            gfapi_valid
            .groupby(
                "ground_floor_activity"
            )[feature]
            .mean()
        )

        ax2.plot(
            means.index,
            means.values,
            marker="o",
            label=feature
        )

    ax2.set_xlabel(
        "VLM GFAPI Score"
    )

    ax2.set_ylabel(
        "Mean Mask Percentage (%)"
    )

    observed_levels = sorted(
        gfapi_valid[
            "ground_floor_activity"
        ]
        .dropna()
        .unique()
        .tolist()
    )

    ax2.set_xticks(
        observed_levels
    )

    ax2.set_title(
        "Supporting Segmentation Evidence across VLM GFAPI Levels"
    )

    ax2.legend()

    fig2.tight_layout()

    st.pyplot(
        fig2,
        use_container_width=True
    )

    plt.close(fig2)


    # -----------------------------------------------------
    # FIGURE 3 — GFAPI SPEARMAN CORRESPONDENCE
    # -----------------------------------------------------

    st.markdown(
        "##### GFAPI Spearman Correspondence"
    )

    fig3, ax3 = plt.subplots(
        figsize=(10, 6)
    )

    bars = ax3.bar(
        gfapi_results_df["feature"],
        gfapi_results_df["rho_GFAPI"]
    )

    ax3.axhline(
        0,
        linewidth=1
    )

    ax3.set_ylabel(
        "Spearman's ρ"
    )

    ax3.set_title(
        "Association between VLM GFAPI\n"
        "and Segmentation-Derived Physical Evidence"
    )

    ax3.tick_params(
        axis="x",
        rotation=35
    )

    for bar, rho, p in zip(
        bars,
        gfapi_results_df["rho_GFAPI"],
        gfapi_results_df["p_GFAPI"]
    ):

        if pd.isna(rho):
            continue

        y = bar.get_height()

        offset = (
            0.02
            if y >= 0
            else -0.04
        )

        p_text = (
            "N/A"
            if pd.isna(p)
            else (
                "<0.001"
                if p < 0.001
                else f"{p:.3f}"
            )
        )

        ax3.text(
            bar.get_x()
            + bar.get_width() / 2,
            y + offset,
            f"ρ={rho:.2f}\n"
            f"p={p_text}",
            ha="center",
            va=(
                "bottom"
                if y >= 0
                else "top"
            ),
            fontsize=8
        )

    fig3.tight_layout()

    st.pyplot(
        fig3,
        use_container_width=True
    )

    plt.close(fig3)


    # -----------------------------------------------------
    # 5.5 CASE-LEVEL DISAGREEMENT
    # -----------------------------------------------------

    st.markdown(
        "#### 6.5 Case-level Disagreement"
    )

    st.caption(
        "This diagnostic ranks cases where the ordinal position of VLM GFAPI "
        "differs most from segmentation-derived ground glazing. It does not "
        "change either measurement and does not label either model as correct."
    )

    disagreement_df = gfapi_valid[
        [
            c for c in [
                "source_name",
                "ground_floor_activity",
                "ground_glazing_pct"
            ]
            if c in gfapi_valid.columns
        ]
    ].dropna(
        subset=[
            "ground_floor_activity",
            "ground_glazing_pct"
        ]
    ).copy()

    if len(disagreement_df) > 0:

        disagreement_df["GFAPI_rank"] = (
            disagreement_df[
                "ground_floor_activity"
            ]
            .rank(
                method="average",
                pct=True
            )
        )

        disagreement_df["ground_glazing_rank"] = (
            disagreement_df[
                "ground_glazing_pct"
            ]
            .rank(
                method="average",
                pct=True
            )
        )

        disagreement_df["disagreement"] = (
            disagreement_df["GFAPI_rank"]
            - disagreement_df["ground_glazing_rank"]
        )

        disagreement_df = disagreement_df.sort_values(
            "disagreement",
            ascending=False
        )

        d1, d2 = st.columns(2)

        with d1:

            st.markdown(
                "##### GFAPI relatively higher"
            )

            st.dataframe(
                disagreement_df.head(6).round(4),
                use_container_width=True,
                hide_index=True
            )

        with d2:

            st.markdown(
                "##### Ground glazing relatively higher"
            )

            st.dataframe(
                disagreement_df.tail(6)
                .sort_values("disagreement")
                .round(4),
                use_container_width=True,
                hide_index=True
            )

    else:

        st.info(
            "No complete GFAPI / ground-glazing cases are available "
            "for disagreement inspection."
        )


    # -----------------------------------------------------
    # GFAPI EXPORTS
    # -----------------------------------------------------

    st.markdown(
        "#### GFAPI Validation Exports"
    )

    ex1, ex2, ex3, ex4 = (
        st.columns(4)
    )

    with ex1:

        st.download_button(
            label="GFAPI Dataset",
            data=(
                gfapi_valid
                .to_csv(
                    index=False
                )
                .encode("utf-8-sig")
            ),
            file_name=(
                "GFAPI_VALIDATION_DATASET.csv"
            ),
            mime="text/csv"
        )

    with ex2:

        st.download_button(
            label="Spearman Results",
            data=(
                gfapi_results_df
                .to_csv(
                    index=False
                )
                .encode("utf-8-sig")
            ),
            file_name=(
                "GFAPI_SPEARMAN_RESULTS.csv"
            ),
            mime="text/csv"
        )

    with ex3:

        st.download_button(
            label="Group Means",
            data=(
                gfapi_group_mean
                .to_csv(
                    index=False
                )
                .encode("utf-8-sig")
            ),
            file_name=(
                "GFAPI_GROUP_MEAN.csv"
            ),
            mime="text/csv"
        )

    with ex4:

        st.download_button(
            label="Group Medians",
            data=(
                gfapi_group_median
                .to_csv(
                    index=False
                )
                .encode("utf-8-sig")
            ),
            file_name=(
                "GFAPI_GROUP_MEDIAN.csv"
            ),
            mime="text/csv"
        )


st.divider()


# =========================================================
# 7 — INDIVIDUAL CASE INSPECTOR
# =========================================================

st.header(
    "7. Individual Case Inspector"
)


if len(analysis_df) > 0:

    if "case_id" in analysis_df.columns:

        case_labels = (
            analysis_df[
                "case_id"
            ]
            .astype(str)
            .tolist()
        )

        case_key = "case_id"

    else:

        case_labels = (
            analysis_df[
                "source_name"
            ]
            .astype(str)
            .tolist()
        )

        case_key = "source_name"


    selected_case = st.selectbox(
        "Select SVI case",
        case_labels
    )


    row = analysis_df[
        analysis_df[
            case_key
        ].astype(str)
        == selected_case
    ].iloc[0]


    st.markdown(
        f"### {selected_case}"
    )


    vlm_col, mask_col, qc_col = (
        st.columns(3)
    )


    # -----------------------------------------------------
    # VLM
    # -----------------------------------------------------

    with vlm_col:

        st.markdown(
            "#### VLM"
        )

        st.metric(
            "Facade Variation",
            f"{row['facade_variation']:.0f}"
        )

        if (
            "ground_floor_activity"
            in row.index
            and pd.notna(
                row["ground_floor_activity"]
            )
        ):

            st.metric(
                "GFAPI",
                f"{row['ground_floor_activity']:.0f}"
            )


    # -----------------------------------------------------
    # MASK
    # -----------------------------------------------------

    with mask_col:

        st.markdown(
            "#### Mask Validation"
        )

        st.metric(
            "Facade Mask Score",
            f"{row['facade_mask_score']:.2f}"
        )


        for feature in [
            "upper_facade_pct",
            "upper_glazing_pct",
            "ground_glazing_pct",
            "stoop_pct",
            "awning_pct"
        ]:

            if (
                feature in row.index
                and pd.notna(row[feature])
            ):

                st.write(
                    f"{feature}: "
                    f"{row[feature]:.2f}%"
                )


    # -----------------------------------------------------
    # QC
    # -----------------------------------------------------

    with qc_col:

        st.markdown(
            "#### Quality Control"
        )


        if (
            "scaffold_pct"
            in row.index
            and pd.notna(
                row["scaffold_pct"]
            )
        ):

            st.write(
                f"Scaffold: "
                f"{row['scaffold_pct']:.2f}%"
            )


        if (
            "calibration_out_of_range"
            in row.index
        ):

            if bool(
                row[
                    "calibration_out_of_range"
                ]
            ):

                st.warning(
                    "Outside pilot calibration range"
                )

            else:

                st.success(
                    "Within pilot calibration range"
                )


        if "warnings" in row.index:

            warning = row[
                "warnings"
            ]

            if (
                pd.notna(warning)
                and str(warning).strip()
            ):

                st.warning(
                    str(warning)
                )


    with st.expander(
        "View complete case data"
    ):

        case_table = pd.DataFrame(
            {
                "Variable": row.index,
                "Value": row.values
            }
        )

        st.dataframe(
            case_table,
            use_container_width=True,
            hide_index=True
        )


st.divider()


# =========================================================
# 8 — EXPORT
# =========================================================

st.header(
    "8. Validation Dataset"
)

st.dataframe(
    analysis_df,
    use_container_width=True,
    hide_index=True
)


csv_output = (
    analysis_df
    .to_csv(
        index=False
    )
    .encode("utf-8")
)


st.download_button(
    label="Download Validation Results",
    data=csv_output,
    file_name="vlm_facade_validation_results.csv",
    mime="text/csv"
)


# =========================================================
# METHOD NOTE
# =========================================================

with st.expander(
    "Method & Calibration Note"
):

    st.markdown(
        f"""
### Validation target

The primary validation target is the VLM-derived
**facade variation (SFV)** score.

### Objective evidence

Physical facade characteristics are extracted
from segmentation masks.

### Facade Mask Score {score_config.get("version", "v1")}

The current baseline uses:

- Upper facade
- Upper glazing
- Ground glazing
- Stoop
- Awning

Each variable is normalized using a **fixed
pilot calibration range** and combined using
**equal weighting**.

Scaffolding is excluded from the primary
composite score because it represents a
temporary urban condition.

### Calibration

Calibration dataset:

**{score_config.get("calibration", "pilot_20_svi")}**

The App does **not** refit Min-Max normalization
when a new batch is uploaded.

Values outside the pilot reference range are
flagged and clipped to the 0–1 normalization
range for score calculation.

### GFAPI validation

Ground-floor Active Permeability Index (**GFAPI**) is the
VLM-derived ordinal variable stored in
`ground_floor_activity`.

Segmentation-derived variables are used as
**supporting physical evidence**, not as direct GFAPI
ground truth. Their pixel-based definitions do not
reproduce the GFAPI perceptual construct exactly.

Supporting physical evidence:

- Ground glazing
- Awning
- Stoop

Diagnostic / control evidence:

- Upper glazing
- Upper facade
- Scaffolding

For each feature, the App reports Spearman
correspondence with **GFAPI** and **SFV**. A
case-level disagreement table is also provided for
diagnostic inspection.

No VM output, VLM score, prompt, segmentation taxonomy,
or source CSV value is modified by this validation layer.

### Statistical validation

Spearman rank correlation is used because
the VLM rating is ordinal.

A correlation coefficient should not be
interpreted as prediction accuracy.
        """
    )
