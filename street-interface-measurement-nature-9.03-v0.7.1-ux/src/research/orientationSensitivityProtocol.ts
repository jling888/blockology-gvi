/**
 * STEP 10 — Orientation Sensitivity Validation Protocol
 *
 * PURPOSE
 * Compare the same Murray Hill nodes under:
 * A) teacher orthogonal 90° frames
 * B) implemented team walk-relative ±45° half-views
 *
 * This is a proposed validation scaffold. It does NOT declare equivalence and
 * it does NOT set publication acceptance thresholds on behalf of the research
 * team.
 */

export const ORIENTATION_SENSITIVITY_PROTOCOL_VERSION =
  'orientation_sensitivity_v0.3' as const;

export type OrientationSensitivityStudyStatus =
  | 'not_started'
  | 'paired_images_ready'
  | 'paired_qwen_scores_ready'
  | 'analysis_complete'
  | 'research_decision_recorded';

export interface OrientationSensitivityMetricSpec {
  id:
    | 'paired_absolute_difference'
    | 'paired_signed_difference'
    | 'spearman_rank_correlation'
    | 'mean_absolute_difference'
    | 'median_absolute_difference';

  label: string;
  purpose: string;
}

export const ORIENTATION_SENSITIVITY_METRICS:
  readonly OrientationSensitivityMetricSpec[] = [
    {
      id: 'paired_absolute_difference',
      label: 'Per-node |Δ|',
      purpose:
        'Directly measures how much each field changes when the same node is rendered under the alternative orientation protocol.',
    },
    {
      id: 'paired_signed_difference',
      label: 'Per-node signed Δ',
      purpose:
        'Detects systematic directional bias rather than only magnitude of disagreement.',
    },
    {
      id: 'spearman_rank_correlation',
      label: 'Spearman ρ',
      purpose:
        'Checks whether node ordering is preserved even when exact scores shift.',
    },
    {
      id: 'mean_absolute_difference',
      label: 'Mean absolute difference',
      purpose:
        'Summarizes average score sensitivity on the normalized [0,1] paper-variable scale.',
    },
    {
      id: 'median_absolute_difference',
      label: 'Median absolute difference',
      purpose:
        'Provides a robust summary less sensitive to a small number of extreme node-level shifts.',
    },
  ] as const;

export const ORIENTATION_SENSITIVITY_FIELDS = [
  'V_nat',
  'V_built',
  'GVI_eye',
  'sky_openness_proxy',
  'V_pave',
  'GMI',
  'V_sign',
  'SFV',
  'GFAPI',
  'IAS',
] as const;

export interface OrientationSensitivityStudyDesign {
  status: OrientationSensitivityStudyStatus;

  pairedUnit: string;
  requiredSourceMatch: string;
  requiredModelMatch: string;
  requiredInstrumentMatch: string;

  teacherArm: string;
  teamArm: string;

  aggregationRule: string;

  thresholdsStatus:
    | 'not_defined'
    | 'research_team_defined';

  currentDecisionRule: string;

  requiredOutputs: readonly string[];
}

export const ORIENTATION_SENSITIVITY_STUDY:
  OrientationSensitivityStudyDesign = {
    status: 'not_started',

    pairedUnit:
      'Same physical Murray Hill node evaluated under both orientation protocols.',

    requiredSourceMatch:
      'Same panorama / node provenance before frame extraction.',

    requiredModelMatch:
      'Use the same Qwen model checkpoint and inference configuration for both arms.',

    requiredInstrumentMatch:
      'Use the same 10-field one-field-per-call 7-rung instrument and score-token readout.',

    teacherArm:
      'Teacher orthogonal 90° sectors aligned parallel/perpendicular to the street axis.',

    teamArm:
      'Implemented team walk-relative 90° L/R halves centered ±45° from walking bearing.',

    aggregationRule:
      'Compare like-for-like field outputs on the normalized EV [0,1] scale. Preserve each per-view probability distribution before any node-level aggregation.',

    thresholdsStatus: 'not_defined',

    currentDecisionRule:
      'Do not declare the two orientation protocols equivalent until the paired analysis is complete and the research team explicitly defines and accepts field-level decision thresholds.',

    requiredOutputs: [
      'Paired node identifier and exact source-image provenance',
      'Both orientation protocol identifiers',
      'All 10 normalized EV fields for both arms',
      'Per-field paired signed and absolute differences',
      'Per-field Spearman rank correlation across paired nodes',
      'Per-field mean and median absolute difference',
      'Explicit list of fields showing material orientation sensitivity',
      'Recorded research decision: retain team protocol, rerun orthogonal protocol, or accept equivalence with documented evidence',
    ],
  };