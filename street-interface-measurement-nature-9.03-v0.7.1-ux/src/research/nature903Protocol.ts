/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Nature 9.03 Final (No-Omega) manuscript alignment registry.
 * Authoritative paper source: nature9.03finalno-omega.docx
 * Method Status: FINAL_NO_OMEGA
 *
 * This file stores manuscript REFERENCE protocol values and benchmark
 * diagnostics. It defines the active Nature 9.03 Final (No-Omega) parameters,
 * where:
 * - Omega_i, Canyon threshold/decay, and Environmental TFP (A_i) are retired from active SIM calculation.
 * - Active SIM formula: M_i = I_i^{a_i} * Y_i^{b_i} * D_i^{c_i}
 * - Place Identity (Y_i) integrates GFAPI: Y_raw = beta1 * V_sign + beta2 * (1 - SVF) + beta3 * GFAPI
 * - SFV is removed from the active Identity equation and retained as supplementary validation provenance.
 * - Place Dependence (D_i) uses D_raw = gamma1 * V_pave + gamma2 * IAS
 * - Local elasticities a_i, b_i, c_i are normalized from GWR beta_I, beta_Y, beta_D (summing to 1).
 */

export const NATURE_903_PROTOCOL_VERSION =
  'nature_9_03_no_omega_final_v0.7.0_multi_source_research_integration';

export const NATURE_903_METHOD_METADATA = {
  paperSource: 'nature9.03finalno-omega.docx',
  methodStatus: 'FINAL_NO_OMEGA' as const,
  displayVersion: 'Nature 9.03 Final · No-Omega v0.7.0 — Multi-Source Research Integration',
  scientificCore: 'v0.6.3 GOLDEN FREEZE / paper_aligned_sim_engine_v0.5.2_nature_9_03_no_omega',
  developmentLayer: 'v0.7.0_multi_source_research_integration',
  uiStatement: 'v0.7.0 extends the frozen v0.6.3 scientific core. The active Nature 9.03 SIM mathematics are unchanged.',
  schemaVersion: 'street_interface_paper_aligned_v0.7.0_multi_source_research_integration',
  engineVersion: 'paper_aligned_sim_engine_v0.6.3_nature_9_03_no_omega',
  activeSimFormula: 'M_i = I_i^a_i × Y_i^b_i × D_i^c_i',
  activeIdentityFormula: 'Y_raw = β1·V_sign + β2·(1−SVF) + β3·GFAPI',
  activeDependenceFormula: 'D_raw = γ1·V_pave + γ2·IAS',
  activeImageabilityFormula: 'I_raw = α1·(V_nat/V_built) + α2·GVI_eye + α3·GMI',
  canyonStatus: 'RETIRED_FROM_ACTIVE_CALCULATION' as const,
  sfvStatus: 'SUPPLEMENTARY_VALIDATION_ONLY' as const,
  bridgeStatus: 'NATURE_9_03_V0_7_0_MULTI_SOURCE_RESEARCH_INTEGRATION' as const,
  pinnedRepository: 'mikellu12/murrayhill-v12',
  pinnedCommit: '9353169b3dc3a1b4673e7144249db6ccbf7ac0f1',
  pinnedBlobSha: '975feac25b631c0839fb694db68ffd2e4da51e98',
  activeSourceTable: 'results/tables/vlm_observations_murrayhill.csv',
  comparativeSourceTable: 'results/tables/vlm_calculations_murrayhill.csv',
  readoutMethod: 'ORDINAL_INTERPOLATED_MEDIAN',
} as const;

export const NATURE_903_DATASET = {
  rawPhysicalNodes: 712,
  rawObservations: 2848,

  excludedTunnelNodes: 2,
  excludedTunnelObservations: 8,

  activePhysicalNodes: 710,
  activeObservations: 2840,

  viewsPerNode: 4,
  spacingMeters: 20,
  provenance: 'Nature09.03 end.docx final paper sample accounting',
} as const;

export const NATURE_903_RETIRED_DATASET_REFERENCE = {
  rawPhysicalNodes: 766,
  rawObservations: 3064,
  activePhysicalNodes: 764,
  activeObservations: 3056,
  status: 'RETIRED_COMPARATIVE',
  note: 'Older manuscript/source snapshot retained only for historical provenance. It must not overwrite the Nature09.03 end final sample.',
} as const;

export const NATURE_903_CANONICAL_SAMPLING = {
  eyeHeightMeters: 1.5,
  pitchDegrees: 0,
  fovDegreesPerQuadrant: 90,

  relativeYawDegrees: [0, 90, 180, 270] as const,

  sourcePanoramaDegrees: 360,
  azimuthColumnDegrees: 1,
  azimuthColumnsPerPanorama: 360,
  columnsPerQuadrant: 90,

  targetSamplingAxis: 'DUAL_SIDEWALK_CENTERLINES',
  canonicalProtocolId: 'teacher_orthogonal_4x90_nature_9_03_final',
} as const;

export const NATURE_903_CALIBRATION_REFERENCE = {
  calibrationMode: 'MANUSCRIPT_REFERENCE_NOT_RECOMPUTED',

  tauI: 0.20,
  tauISource: 'city-wide median(I_raw)',
  kappaI: 12,

  tauD: 0.50,
  tauDSource: 'city-wide median(D_raw)',
  kappaD: 15,

  // Legacy reference retained only for provenance / comparative audit
  legacyCanyonThreshold: 2.0,
  legacyCanyonPsi: 0.15,
} as const;

export const NATURE_903_BEHAVIOR = {
  tRawMinSeconds: 0,
  tRawMaxSeconds: 300,
  formula: 't_base = [min(t_max,max(t_min,t_raw)) - t_min] / (t_max - t_min)',
  lambda: null,
  lambda_status: 'UNRESOLVED_BEHAVIORAL_CALIBRATION' as const,
  lambda_source: 'PAPER_SYMBOLIC_ONLY' as const,
  lambda_note:
    'Nature 9.03 defines λ symbolically as the calibration parameter in F_i = 1 + λM_i but does not provide a validated implementation value.',
} as const;

export const NATURE_903_GWR = {
  choiceRadiusMeters: 800,
  integrationRadiusMeters: 800,
  kernel: 'adaptive bi-square',
  distance: 'network distance',
  bandwidthOptimization: 'Golden Section Search',
  objective: 'minimize AICc',
  multipleTesting: 'Benjamini-Hochberg FDR',
  correctedLocalTThreshold: 2.65,
  correctedAlphaApprox: 0.008,
  reportedBandwidthText:
    '100 m reported in manuscript; verify adaptive/fixed parameterization before operational hard-coding',
} as const;

export const NATURE_903_GWR_PAPER_BENCHMARKS = {
  model2: {
    r2: 0.761,
    residualMoranI: 0.012,
    residualMoranP: '> 0.10',
    vifMax: 2.14,
  },
} as const;

export const NATURE_903_REFERENCE_ELASTICITIES = {
  global: {
    a: 0.40,
    b: 0.20,
    c: 0.40,
  },
  avenueCanyon: {
    a: 0.10,
    b: 0.30,
    c: 0.60,
  },
  covenantMidblock: {
    a: 0.50,
    b: 0.30,
    c: 0.20,
  },
  porousPops: {
    a: 0.45,
    b: 0.15,
    c: 0.40,
  },
} as const;

export const NATURE_903_NORMALIZATION_PROVENANCE = {
  dependence: {
    paperComposition: 'D_raw_paper = γ1·V_pave + γ2·IAS',
    implementationNormalization: 'D_calibration_input = D_raw_paper / (γ1 + γ2)',
    normalizationProvenance: 'REPO_IMPLEMENTATION_CONVENTION' as const,
    paperStatus: 'PAPER_VARIABLE_COMPOSITION_EXPLICIT' as const,
    implementationStatus: 'NORMALIZED_WEIGHTED_MEAN_FOR_UNIT_SCALE' as const,
    valueEnteringSigmoid: 'D_calibration_input' as const,
    note: 'The denominator (γ1 + γ2) is a repo implementation convention to normalize D_raw to unit scale before the sigmoid, not explicitly written in the Nature 9.03 manuscript equation.',
  },
  imageability: {
    paperComposition: 'I_raw = α1·(V_nat/V_built) + α2·GVI_eye + α3·GMI',
    implementationNormalization: 'None (raw linear combination enters sigmoid)',
    normalizationProvenance: 'PAPER_EXPLICIT' as const,
    paperStatus: 'PAPER_EXPLICIT' as const,
    implementationStatus: 'RAW_LINEAR_COMBINATION' as const,
    valueEnteringSigmoid: 'I_raw_paper' as const,
    clippingApplied: false,
    ratioBoundingApplied: false,
    note: 'I_raw enters the sigmoid directly without ratio bounding or scaling transformations.',
  },
} as const;

/**
 * Convert canonical 1–7 scale to 0–1 comparison scale for diagnostics.
 */
export function paperSevenPointToUnitScale(
  value: number | null | undefined,
): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }
  return Math.max(0, Math.min(1, (value - 1) / 6));
}
