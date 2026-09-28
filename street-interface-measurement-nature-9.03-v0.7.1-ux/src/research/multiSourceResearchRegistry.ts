/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ============================================================================
 * MULTI-SOURCE RESEARCH REGISTRY
 * Street Interface Measurement — Nature 9.03 Final · No-Omega v0.7.0
 * — Multi-Source Research Integration
 * ============================================================================
 *
 * Explicit Provenance:
 * scientific_core: "v0.6.3 GOLDEN FREEZE / paper_aligned_sim_engine_v0.5.2_nature_9_03_no_omega"
 * development_layer: "v0.7.0_multi_source_research_integration"
 *
 * "v0.7.0 extends the frozen v0.6.3 scientific core.
 * The active Nature 9.03 SIM mathematics are unchanged."
 *
 * Strict Classification Rules:
 * Every external research value must be classified using ONLY:
 *   - REPO_MEASURED
 *   - REPO_DERIVED
 *   - PAPER_REPORTED
 *   - PAPER_SPECIFICATION
 *   - DEMO_ONLY
 *   - UNAVAILABLE
 *   - RETIRED_COMPARATIVE
 *
 * No silent defaults.
 * No invented numeric constants.
 * No paper-wide diagnostic may masquerade as a node-specific observation.
 */

import { PINNED_GWR_MACHINERY_ROWS, type GwrMachineryRow } from '../data/teamRepository/gwrMachinery';

export type MultiSourceResearchClassification =
  | 'REPO_MEASURED'
  | 'REPO_DERIVED'
  | 'REPO_GEOMETRY_CONTEXT'
  | 'PAPER_REPORTED'
  | 'PAPER_SPECIFICATION'
  | 'DEMO_ONLY'
  | 'UNAVAILABLE'
  | 'RETIRED_COMPARATIVE'
  | 'PAPER_REPORTED_MODEL_RESULT'
  | 'REPO_DERIVED_GWR_MACHINERY'
  | 'UNAVAILABLE_NODE_LEVEL_CALIBRATION'
  | 'REPOSITORY_HISTORICAL_MANUSCRIPT_REFERENCE';

export const EVIDENCE_CLASSES = {
  PAPER_REPORTED_MODEL_RESULT: 'PAPER_REPORTED_MODEL_RESULT',
  PAPER_SPECIFICATION: 'PAPER_SPECIFICATION',
  REPO_DERIVED_GWR_MACHINERY: 'REPO_DERIVED_GWR_MACHINERY',
  UNAVAILABLE_NODE_LEVEL_CALIBRATION: 'UNAVAILABLE_NODE_LEVEL_CALIBRATION',
} as const;

// ============================================================================
// VERSION & PROVENANCE METADATA
// ============================================================================

export const V070_VERSION_METADATA = {
  appDisplayVersion: 'Nature 9.03 Final · No-Omega v0.7.0 — Multi-Source Research Integration',
  releaseCandidateVersion: 'V0_7_0_MULTI_SOURCE_INTEGRATION_RC1',
  releaseCandidateStatus: 'V0_7_0_MULTI_SOURCE_INTEGRATION_RC1',
  releaseDisplayVersion: 'Nature 9.03 Final · No-Omega v0.7.0-RC1 — Multi-Source Integration Verified',
  scientificCore: 'v0.6.3_GOLDEN_FREEZE',
  scientificCoreDetails: 'v0.6.3 GOLDEN FREEZE / paper_aligned_sim_engine_v0.5.2_nature_9_03_no_omega',
  developmentLayer: 'v0.7.0_multi_source_research_integration',
  uiStatement: 'v0.7.0 extends the frozen v0.6.3 scientific core. The active Nature 9.03 SIM mathematics are unchanged.',
  frozenBaseline: {
    I: 6.785792291750779,
    Y: 4.275239548226926,
    D: 6.861271847132807,
    a: 0.4,
    b: 0.2,
    c: 0.4,
    M: 6.214327916148292,
  },
} as const;

export const MULTI_SOURCE_PROVENANCE_RESOLUTION_RECORD = {
  title: 'MULTI-SOURCE PROVENANCE RESOLUTION',
  rows: [
    {
      sourceBoundary: 'Paper vs Repository GWR',
      status: 'RESOLVED BY SEPARATION',
      code: 'RESOLVED_BY_SEPARATION',
      description:
        'Paper reports final manuscript GWR diagnostics (N=2,840 active observations / 710 active nodes, Model 2 R²=0.8316, adaptive bi-square reported BW=100 m). Repository retains outcome-independent feasibility machinery (Gaussian kernel, tr(S), tr(S\'S)). Kept strictly separated.',
    },
    {
      sourceBoundary: 'Paper Behavioral Method vs Repository Outcome',
      status: 'SOURCE-GATED',
      code: 'SOURCE_GATED',
      description:
        'Paper specifies dwell duration equations (t_base, F_i, t_effective). Static street-view imagery lacks temporal sensor dwell observations. Gated without assigning zero.',
    },
    {
      sourceBoundary: 'Blockology λ=1',
      status: 'DEMO_ONLY',
      code: 'DEMO_ONLY',
      description:
        'Blockology dwell lambda=1.0 is an uncalibrated repository demonstration placeholder. Isolated from active SIM synthesis.',
    },
    {
      sourceBoundary: 'Street Node ↔ Murray Hill Crosswalk',
      status: 'UNRESOLVED unless explicit mapping exists',
      code: 'UNRESOLVED',
      description:
        'OSM sampling geometry street_node_* IDs and Murray Hill n* IDs occupy distinct namespaces. Implicit spatial proximity joins are prohibited.',
    },
    {
      sourceBoundary: '180° Team Source vs Orthogonal 90° Paper Protocol',
      status: 'UNRESOLVED_PAPER_PROTOCOL_ALIGNMENT',
      code: 'UNRESOLVED_PAPER_PROTOCOL_ALIGNMENT',
      description:
        'Team source verified as bidirectional along-street 180° views. Equivalence to paper orthogonal 90° analytical protocol remains unresolved.',
    },
  ],
  visual_semantic_orientation: {
    source_protocol: 'TEAM_ALONG_STREET_180',
    fov_degrees: 180,
    directionality: 'BIDIRECTIONAL_FORWARD_BACKWARD',
    axis_alignment: 'STREET_AXIS',
    paper_protocol_alignment: 'UNRESOLVED_PAPER_PROTOCOL_ALIGNMENT',
  },
  footerNotice: 'None of these are runtime errors. They are provenance boundaries.',
} as const;

export const MULTI_SOURCE_RESEARCH_REGISTRY = {
  version: 'Nature 9.03 Final · No-Omega v0.7.0',
  releaseCandidateVersion: 'V0_7_0_MULTI_SOURCE_INTEGRATION_RC1',
  scientificCore: 'v0.6.3_GOLDEN_FREEZE',
  provenanceResolutions: MULTI_SOURCE_PROVENANCE_RESOLUTION_RECORD,
} as const;

// ============================================================================
// SOURCE IDENTITIES & ROLES
// ============================================================================

export const STREET_VIEW_NODES_SOURCE = {
  repositoryName: 'ex032895-crypto/street-view-nodes',
  repositoryCommit: '51f0250de0c446313b5fba912becabd03db8b572',
  role: 'STREET_NETWORK_SAMPLING_GEOMETRY',
  classification: 'REPO_GEOMETRY_CONTEXT' as MultiSourceResearchClassification,
  spacingM: 20,
  coordinateReferenceSystem: 'WGS84',
  activeSimEvidence: false,
} as const;

export const MURRAY_HILL_GEOMETRY_SOURCE = {
  repositoryName: 'mikellu12/murrayhill-v12',
  repositoryCommit: '9353169b3dc3a1b4673e7144249db6ccbf7ac0f1',
  sourceTable: 'results/tables/vlm_observations_murrayhill.csv',
  sourceBlob: '975feac25b631c0839fb694db68ffd2e4da51e98',
  role: 'MURRAY_HILL_MORPHOLOGY_GEOMETRY',
  classification: 'REPO_GEOMETRY_CONTEXT' as MultiSourceResearchClassification,
  activeSimEvidence: false,
} as const;

export const RESEARCH_SOURCE_IDENTITIES = {
  STREET_VIEW_NODES: {
    repository: STREET_VIEW_NODES_SOURCE.repositoryName,
    commit: STREET_VIEW_NODES_SOURCE.repositoryCommit,
    role: STREET_VIEW_NODES_SOURCE.role,
    classification: STREET_VIEW_NODES_SOURCE.classification,
    spacingM: STREET_VIEW_NODES_SOURCE.spacingM,
    coordinateReferenceSystem: STREET_VIEW_NODES_SOURCE.coordinateReferenceSystem,
    activeSimEvidence: STREET_VIEW_NODES_SOURCE.activeSimEvidence,
    allowedOutputs: [
      'node coordinates',
      'lat',
      'lng',
      'sequence',
      'forward heading',
      'reverse heading',
      'street/corridor topology',
      'tunnel / bridge flags',
      '20 m sampling provenance',
    ] as const,
    prohibitedFrom: [
      'visual semantic variables',
      'Space Syntax Choice/Integration unless explicitly present',
      'GWR coefficients',
      'behavioral dwell',
      'lambda',
    ] as const,
    notes: 'Provides physical spatial sampling network geometry. Strictly prohibited from injecting econometric or visual variables.',
  },

  MURRAY_HILL: {
    repository: 'mikellu12/murrayhill-v12',
    role: 'MURRAY_HILL_MORPHOLOGY_AND_VLM',
    allowedGeometryContextOutputs: [
      'H_m',
      'W_facade',
      'HW_facade',
      'HW_effective',
      'HW_source',
      'node_GVI',
      'node_VEI',
      'node_SVF_band',
    ] as const,
    allowedVlmOutputs: [
      'existing approved median-led repository bridge only',
    ] as const,
    prohibitedFrom: [
      'node_SVF_band overwriting true whole-sky SVF or Qwen sky openness proxy',
      'node_GVI overwriting foveal GVI_eye',
      'HW_effective directly altering active Nature 9.03 SIM calculation',
    ] as const,
    notes: 'Murray Hill morphological geometry and Qwen VLM evaluations. node_SVF_band is NOT true whole-sky SVF. node_GVI is NOT GVI_eye.',
  },

  BLOCKOLOGY: {
    repository: 'jling888/blockology-gvi',
    role: 'BLOCKOLOGY_GEOMETRY_AND_GVI_PROVENANCE',
    allowedOutputs: [
      'morphology / blockology provenance',
      'segmentation / GVI / VEI contextual outputs',
      'methodology provenance',
    ] as const,
    prohibitedFrom: [
      'DEMO_ONLY outputs must NEVER enter active paper synthesis',
    ] as const,
    notes: 'Blockology morphological and GVI provenance. Demonstration-only outputs are strictly barred from active paper synthesis.',
  },
} as const;

// ============================================================================
// PAPER-REPORTED SPACE SYNTAX / GWR REGISTRY
// ============================================================================

// ============================================================================
// FINAL PAPER SAMPLE ACCOUNTING (Nature09.03 end.docx)
// ============================================================================

export const FINAL_PAPER_SAMPLE_ACCOUNTING = {
  rawDualDirectionalObservations: 2848,
  rawPhysicalNodes: 712,
  excludedTunnelObservations: 8,
  excludedTunnelNodes: 2,
  activeObservations: 2840,
  activePhysicalNodes: 710,
  derivation: {
    observationsFormula: '2848 - 8 = 2840',
    nodesFormula: '712 - 2 = 710',
  },
  classification: 'PAPER_REPORTED_MODEL_RESULT' as MultiSourceResearchClassification,
  historicalSample1320Classification: 'REPOSITORY_HISTORICAL_MANUSCRIPT_REFERENCE' as MultiSourceResearchClassification,
  note: 'Nature09.03 end.docx authoritative sample. Historical manuscript sample sizes (e.g. 1320, 3056) are retired comparative references.',
} as const;

// ============================================================================
// SPACE SYNTAX PAPER SPECIFICATION
// ============================================================================

export const SPACE_SYNTAX_PAPER_SPECIFICATION = {
  choiceDefinition: 'Segment Choice at pedestrian radius R = 800 m',
  integrationDefinition: 'Segment Integration at pedestrian radius R = 800 m',
  walkingRadiusM: 800,
  kernelSpecification: 'ROW_STANDARDIZED_ADAPTIVE_BI_SQUARE',
  classification: 'PAPER_SPECIFICATION' as MultiSourceResearchClassification,
  nodeLevelStatus: 'UNAVAILABLE_NODE_LEVEL_SOURCE' as const,
  rule: 'Do not derive Choice or Integration from street names, sequence, road hierarchy, heading, H/W, typology, or paper averages. No surrogate values.',
} as const;

// ============================================================================
// PAPER-REPORTED SPACE SYNTAX / GWR REGISTRY
// ============================================================================

/**
 * Authoritative paper-reported model diagnostics from Nature 09.03 final manuscript.
 * CLASSIFICATION: PAPER_REPORTED_MODEL_RESULT
 *
 * CRITICAL RULE:
 * These are paper-wide empirical model diagnostics.
 * They MUST NOT populate node-level fields:
 *   spaceSyntaxChoice, spaceSyntaxIntegration, beta0, betaI, betaY, betaD, betaChoice, betaIntegration
 * for n00045 or any other node. Those remain null unless a source-backed node-level table is imported.
 */
export const NATURE_903_FINAL_GWR_DIAGNOSTICS = {
  model1R2: 0.8142,
  model2R2: 0.8316,
  deltaR2: 0.0174,
  deltaAicc: '>140',
  model1ResidualMoransI: 0.002545,
  model2ResidualMoransI: -0.00843,
  model2MoransP: 0.584,
  model1VifMax: 5.87,
  model2VifMax: 6.78,
  reportedOptimizedBandwidthM: 100,
  kernel: 'ROW_STANDARDIZED_ADAPTIVE_BI_SQUARE',
  classification: 'PAPER_REPORTED_MODEL_RESULT' as MultiSourceResearchClassification,
  paperSample: {
    rawObservations: 2848,
    rawNodes: 712,
    excludedTunnelObservations: 8,
    excludedTunnelNodes: 2,
    activeObservations: 2840,
    activePhysicalNodes: 710,
  },
  note: 'Manuscript-reported empirical Model 2 statistics. Never injected into node-level local beta regression.',
} as const;

export const NATURE_903_GWR_PAPER_DIAGNOSTICS = {
  ...NATURE_903_FINAL_GWR_DIAGNOSTICS,
  classification: 'PAPER_REPORTED' as MultiSourceResearchClassification,
  source: 'Nature09.03 end manuscript',
  walkingRadiusM: 800,
  gwrKernel: 'ROW_STANDARDIZED_ADAPTIVE_BI_SQUARE',
  bandwidthSelection: 'AICc-optimized / manuscript-reported',
  spaceSyntaxControls: {
    choice: 'Segment Choice at pedestrian R = 800 m (Through-movement)',
    integration: 'Segment Integration at pedestrian R = 800 m (To-movement)',
  },
} as const;

// ============================================================================
// REPOSITORY GWR FEASIBILITY & MACHINERY
// ============================================================================

export const repositoryGwrCalibrationStatus = 'BLOCKED_MISSING_T_BASE_OUTCOME' as const;

export const REPOSITORY_GWR_CALIBRATION_RECORD = {
  status: repositoryGwrCalibrationStatus,
  classification: 'REPO_DERIVED_GWR_MACHINERY' as MultiSourceResearchClassification,
  repositoryStatement:
    'The proposed local regression requires t_base, but this study does not have localized pedestrian stayability outcomes, therefore the regression cannot be run.',
  feasibilityKernel: 'GAUSSIAN' as const,
  feasibilityKernelClassification: 'REPO_FEASIBILITY_GAUSSIAN' as const,
  paperKernelClassification: 'PAPER_REPORTED_ADAPTIVE_BISQUARE' as const,
  machineryStatus: 'OUTCOME_INDEPENDENT_ONLY' as const,
  candidateBandwidthsM: [60, 100, 150, 250, 400] as const,
  machineryTable: PINNED_GWR_MACHINERY_ROWS,
  historicalPaperNReference: 1320,
  historicalNStatus: 'REPOSITORY_HISTORICAL_MANUSCRIPT_REFERENCE' as const,
  feasibilityDiagnostics: [
    'log-domain validity for I / Y / D',
    'regressor separability',
    'VIF',
    'local effective sample size',
    "X'WX invertibility",
    'local condition number',
  ] as const,
  activeSIMFallback: {
    source: 'PAPER_GLOBAL_REFERENCE' as const,
    calibrationStatus: 'REFERENCE_NOT_LOCAL_GWR' as const,
    a: 0.40,
    b: 0.20,
    c: 0.40,
    reason:
      'Node-specific local GWR coefficients are unavailable. Paper global reference elasticities remain the active fallback.',
  },
  meaning:
    'The repository can contain GWR machinery / feasibility / diagnostic implementation, but this must remain distinct from the paper-reported empirical results. Do not fabricate local coefficients.',
} as const;

// ============================================================================
// AUDIT NOTICES & PROVENANCE BOUNDARIES
// ============================================================================

export const GWR_SAMPLE_PROVENANCE_AUDIT = {
  currentFinalPaper: {
    rawObservations: 2848,
    rawPhysicalNodes: 712,
    excludedTunnelObservations: 8,
    excludedTunnelNodes: 2,
    activeObservations: 2840,
    activeNodes: 710,
    classification: 'PAPER_REPORTED_MODEL_RESULT' as const,
  },
  repositoryHistoricalReference: {
    paperN: 1320,
    classification: 'REPOSITORY_HISTORICAL_MANUSCRIPT_REFERENCE' as const,
  },
  uiNotice:
    'The pinned repository GWR machinery was written against an earlier manuscript sample specification. Nature09.03 end reports 2,840 active observations / 710 active nodes. Repository machinery outputs are retained for provenance and feasibility audit, not treated as a reproduction of the final manuscript empirical GWR.',
} as const;

export const PAPER_REPOSITORY_CALIBRATION_BOUNDARY = {
  title: 'PAPER / REPOSITORY CALIBRATION PROVENANCE BOUNDARY',
  notice:
    'The final Nature 9.03 manuscript reports completed Space Syntax-controlled GWR diagnostics. The pinned repository contains feasibility and outcome-independent GWR machinery but explicitly states that empirical local regression cannot be run without t_base.\n\nThe App therefore preserves both records without merging them:\n\n• manuscript statistics = PAPER_REPORTED\n• repository machinery = REPO_DERIVED_GWR_MACHINERY\n• node local coefficients = UNAVAILABLE\n• active SIM elasticities = PAPER_GLOBAL_REFERENCE fallback',
  resolution: 'PAPER_AND_REPOSITORY_RETAINED_SEPARATELY' as const,
} as const;

export const FORMULA_VERSION_BOUNDARY = {
  paperReportedGwrFormulaText: 'PAPER_REPORTED_LEGACY_NOTATION_CONTEXT' as const,
  activeAppSimFormula: 'FROZEN_NATURE_903_NO_OMEGA' as const,
  rule: 'Never reintroduce A_i or Omega into active computation merely because the manuscript diagnostics section contains stale legacy notation.',
} as const;

export const NODE_LEVEL_GWR_CALIBRATION_STATUS = {
  choice: null,
  integration: null,
  localBetas: null,
  beta0: null,
  betaI: null,
  betaY: null,
  betaD: null,
  betaChoice: null,
  betaIntegration: null,
  status: 'UNAVAILABLE_NODE_LEVEL_CALIBRATION' as const,
} as const;

// ============================================================================
// BEHAVIORAL OBSERVATION SPECIFICATION & NODE STATUSES
// ============================================================================

export const NATURE_903_BEHAVIORAL_SPECIFICATION = {
  classification: 'PAPER_SPECIFICATION' as MultiSourceResearchClassification,
  source: 'Nature09.03 end.docx',
  tMinSeconds: 0,
  tMaxSeconds: 300,
  formula: 't_base = [min(300, max(0, t_raw))] / 300',
  tBaseFormula: '(min(300,max(0,t_raw))-0)/(300-0)',
  stayabilityFormula: 'F_i = 1 + lambda * M_i',
  effectiveDwellFormula: 't_effective = F_i * t_base',
  proxyDwellMethod: 'GAUSSIAN_SPATIAL_KERNEL' as const,
  targetRange: '0 <= t_base <= 1',
  description:
    'Raw observed stayability duration is clipped to 0–300 seconds and normalized deterministically to t_base ∈ [0,1]. Missing t_raw is not t_raw=0.',
} as const;

/**
 * Pure formula evaluation for t_base unit testing.
 * Returns null if t_raw is null or undefined (missing t_raw is NOT t_raw=0).
 */
export function calculateTBase(tRaw: number | null | undefined): number | null {
  if (tRaw === null || tRaw === undefined || isNaN(tRaw)) {
    return null;
  }
  const tMin = NATURE_903_BEHAVIORAL_SPECIFICATION.tMinSeconds;
  const tMax = NATURE_903_BEHAVIORAL_SPECIFICATION.tMaxSeconds;
  return (Math.min(tMax, Math.max(tMin, tRaw)) - tMin) / (tMax - tMin);
}

/**
 * Repository demo placeholder lambda isolation (jling888/blockology-gvi).
 * Strictly DEMO_ONLY and prohibited from active behavioral calculation.
 */
export const BLOCKOLOGY_PLACEHOLDER_LAMBDA_RECORD = {
  repositoryName: 'jling888/blockology-gvi',
  dwellLambda: 1.0,
  classification: 'DEMO_ONLY' as const,
  status: 'PLACEHOLDER_NOT_FITTED' as const,
  activeBehavioralInput: false as const,
  prohibitedFrom: [
    'active_lambda',
    'F_i',
    't_effective',
    'paper_synthesis',
    'final_behavioral_export_as_calibrated_value',
  ] as const,
  comment:
    'The manuscript gives no fitted lambda; 1.0 is a repository demo placeholder and must not be reported as fitted or used actively.',
} as const;

export const BEHAVIORAL_SOURCE_PROVENANCE_STATUS =
  'PAPER_SPECIFIED_REPOSITORY_OUTCOME_UNAVAILABLE' as const;

export const BEHAVIORAL_EVIDENCE_PROVENANCE_BOUNDARY = {
  title: 'BEHAVIORAL EVIDENCE PROVENANCE BOUNDARY',
  text: 'The Nature 9.03 final manuscript specifies a temporal baseline stayability pipeline from t_raw to t_base, F_i and t_effective.\n\nThe pinned repositories currently do not contain a validated measured pedestrian dwell-duration outcome for the active Murray Hill dataset.\n\nRepository demo/placeholder dwell parameters are retained for audit only and are prohibited from active behavioral synthesis.',
} as const;

/**
 * Proxy Dwell Effect Density Surface D(x,y) Specification.
 * Note: D_xy is strictly isolated from D_i (Place Dependence).
 */
export const PROXY_DWELL_PAPER_SPECIFICATION = {
  variableId: 'D_xy' as const,
  symbol: 'D(x,y)',
  name: 'Proxy Dwell Effect Density Surface D(x,y)',
  classification: 'PAPER_SPECIFICATION' as const,
  method: 'GAUSSIAN_SPATIAL_KERNEL' as const,
  samplingDiscretizationM: 20,
  requiredInputs: [
    'multiple georeferenced nodes',
    't_effective_i for each contributing node',
    'spatial distance d_i,(x,y)',
    'validated/final kernel bandwidth R',
    'network evaluation coordinates',
  ] as const,
  status: 'NETWORK_MODEL_GATED' as const,
  bandwidthR: null,
  bandwidthStatus: 'UNRESOLVED_PROXY_DWELL_BANDWIDTH' as const,
  activeSimEvidence: false as const,
  gwrBandwidthDistinction:
    'GWR bandwidth (100 m) is econometric local regression bandwidth; D_xy R is behavioral spatial smoothing bandwidth. They must not be conflated.',
  samplingSpacingDistinction:
    '20 m is street-view node sampling interval, not spatial smoothing bandwidth R.',
} as const;

export interface NodeBehavioralObservationState {
  t_raw_seconds: {
    value: number | null;
    status: 'UNAVAILABLE_EMPIRICAL_BEHAVIORAL_OUTCOME' | 'UNAVAILABLE' | 'PRESENT';
    classification: MultiSourceResearchClassification;
  };
  t_base: {
    value: number | null;
    status: 'INPUT_GATED_MISSING_T_RAW' | 'DETERMINISTIC_COMPUTED';
    classification: MultiSourceResearchClassification;
  };
  lambda: {
    value: number | null;
    status: 'UNRESOLVED_BEHAVIORAL_CALIBRATION';
    classification: MultiSourceResearchClassification;
  };
  F_i: {
    value: number | null;
    status: 'METHOD_GATED_MISSING_LAMBDA' | 'COMPUTED';
    classification: MultiSourceResearchClassification;
  };
  t_effective: {
    value: number | null;
    status: 'INPUT_GATED' | 'COMPUTED';
    classification: MultiSourceResearchClassification;
  };
  D_xy: {
    value: number | null;
    status: 'NETWORK_MODEL_GATED';
    classification: MultiSourceResearchClassification;
  };
}

export const DEFAULT_N00045_BEHAVIORAL_STATE: NodeBehavioralObservationState = {
  t_raw_seconds: {
    value: null,
    status: 'UNAVAILABLE_EMPIRICAL_BEHAVIORAL_OUTCOME',
    classification: 'UNAVAILABLE',
  },
  t_base: {
    value: null,
    status: 'INPUT_GATED_MISSING_T_RAW',
    classification: 'UNAVAILABLE',
  },
  lambda: {
    value: null,
    status: 'UNRESOLVED_BEHAVIORAL_CALIBRATION',
    classification: 'PAPER_SPECIFICATION',
  },
  F_i: {
    value: null,
    status: 'METHOD_GATED_MISSING_LAMBDA',
    classification: 'UNAVAILABLE',
  },
  t_effective: {
    value: null,
    status: 'INPUT_GATED',
    classification: 'UNAVAILABLE',
  },
  D_xy: {
    value: null,
    status: 'NETWORK_MODEL_GATED',
    classification: 'PAPER_SPECIFICATION',
  },
};

/**
 * Builds the Step 5 Behavioral Stayability Reconciliation export object.
 */
export function buildBehavioralStayabilityReconciliationExport(
  nodeId: string = 'n00045',
  activeM: number | null = null
) {
  return {
    paper_specification: {
      t_min_seconds: NATURE_903_BEHAVIORAL_SPECIFICATION.tMinSeconds,
      t_max_seconds: NATURE_903_BEHAVIORAL_SPECIFICATION.tMaxSeconds,
      t_base_formula: NATURE_903_BEHAVIORAL_SPECIFICATION.tBaseFormula,
      stayability_formula: NATURE_903_BEHAVIORAL_SPECIFICATION.stayabilityFormula,
      effective_dwell_formula: NATURE_903_BEHAVIORAL_SPECIFICATION.effectiveDwellFormula,
      proxy_dwell_method: NATURE_903_BEHAVIORAL_SPECIFICATION.proxyDwellMethod,
      classification: NATURE_903_BEHAVIORAL_SPECIFICATION.classification,
    },
    empirical_node_observation: {
      node_id: nodeId,
      t_raw_seconds: null,
      t_raw_status: 'UNAVAILABLE_EMPIRICAL_BEHAVIORAL_OUTCOME' as const,
      t_base: null,
      t_base_status: 'INPUT_GATED_MISSING_T_RAW' as const,
    },
    calibration: {
      lambda: null,
      lambda_status: 'UNRESOLVED_BEHAVIORAL_CALIBRATION' as const,
      blockology_placeholder_lambda: BLOCKOLOGY_PLACEHOLDER_LAMBDA_RECORD.dwellLambda,
      placeholder_classification: BLOCKOLOGY_PLACEHOLDER_LAMBDA_RECORD.classification,
      placeholder_active: BLOCKOLOGY_PLACEHOLDER_LAMBDA_RECORD.activeBehavioralInput,
    },
    stayability: {
      M_i: activeM,
      F_i: null,
      F_i_status: 'METHOD_GATED_MISSING_LAMBDA' as const,
      t_effective: null,
      t_effective_status: 'INPUT_GATED' as const,
    },
    proxy_dwell_surface: {
      variable_id: PROXY_DWELL_PAPER_SPECIFICATION.variableId,
      value: null,
      status: PROXY_DWELL_PAPER_SPECIFICATION.status,
      kernel: 'GAUSSIAN' as const,
      bandwidth_R: PROXY_DWELL_PAPER_SPECIFICATION.bandwidthR,
      bandwidth_status: PROXY_DWELL_PAPER_SPECIFICATION.bandwidthStatus,
      active_sim_evidence: PROXY_DWELL_PAPER_SPECIFICATION.activeSimEvidence,
    },
    provenance_resolution: BEHAVIORAL_SOURCE_PROVENANCE_STATUS,
  };
}

// ============================================================================
// SOURCE-CONFLICT AUDIT & PROVENANCE BOUNDARY
// ============================================================================

export const SOURCE_CONFLICT_AUDIT_NOTICE = {
  title: 'PAPER / REPOSITORY CALIBRATION STATUS',
  paper:
    'reports completed Space Syntax-controlled Multi-Scalar GWR diagnostics.',
  repository:
    'node-specific calibration inputs / empirical behavioral outcome are not currently available to the APP.',
  resolution: [
    'paper diagnostics are displayed as PAPER_REPORTED',
    'repository machinery is displayed separately',
    'no paper statistic is injected into node-specific fields',
    'active SIM remains valid using PAPER_GLOBAL_REFERENCE elasticities when local GWR is unavailable',
  ] as const,
  verdict: 'This is NOT an error. It is a provenance boundary.',
} as const;

// ============================================================================
// EXPORT HELPER FOR MULTI-SOURCE RESEARCH INTEGRATION
// ============================================================================

export interface MurrayHillGeometryContextPayload {
  source: {
    repository_name: typeof MURRAY_HILL_GEOMETRY_SOURCE.repositoryName;
    repository_commit: typeof MURRAY_HILL_GEOMETRY_SOURCE.repositoryCommit;
    source_table: typeof MURRAY_HILL_GEOMETRY_SOURCE.sourceTable;
    source_blob: typeof MURRAY_HILL_GEOMETRY_SOURCE.sourceBlob;
  };
  node_id: string;
  H_m: {
    value: number | null;
    unit: 'm';
    source_column: 'H_m';
    classification: 'REPO_GEOMETRY_CONTEXT';
    status: string;
  };
  W_facade: {
    value: number | null;
    unit: 'm';
    source_column: 'W_facade';
    classification: 'REPO_GEOMETRY_CONTEXT';
    status: string;
  };
  HW_facade: {
    value: number | null;
    source_column: 'HW_facade';
    classification: 'REPO_GEOMETRY_CONTEXT';
    status: string;
  };
  HW_effective: {
    value: number | null;
    source_column: 'HW_effective';
    classification: 'REPO_GEOMETRY_CONTEXT';
    active_sim_evidence: false;
    status: string;
  };
  HW_source: {
    value: string | null;
    source_column: 'HW_source';
    classification: 'REPO_GEOMETRY_CONTEXT';
  };
  node_GVI: {
    value: number | null;
    source_column: 'node_GVI';
    classification: 'REPO_GEOMETRY_CONTEXT';
    paper_boundary: 'NOT_GVI_EYE';
  };
  node_VEI: {
    value: number | null;
    source_column: 'node_VEI';
    classification: 'REPO_GEOMETRY_CONTEXT';
  };
  node_SVF_band: {
    value: number | null;
    source_column: 'node_SVF_band';
    classification: 'REPO_GEOMETRY_CONTEXT';
    paper_boundary: 'NOT_TRUE_SVF_NOT_ACTIVE_Y_INPUT';
  };
}

export function buildMurrayHillGeometryContext(
  nodeId: string = 'n00045',
  geom?: {
    hM?: number | null;
    wFacade?: number | null;
    hwFacade?: number | null;
    hwEffective?: number | null;
    hwSource?: string | null;
    nodeGVI?: number | null;
    nodeVEI?: number | null;
    nodeSVFBand?: number | null;
  } | null
): MurrayHillGeometryContextPayload {
  const hM = geom?.hM ?? null;
  const wFacade = geom?.wFacade ?? null;
  const hwFacade = geom?.hwFacade ?? null;
  const hwEffective = geom?.hwEffective ?? null;
  const hwSource = geom?.hwSource ?? null;
  const nodeGVI = geom?.nodeGVI ?? null;
  const nodeVEI = geom?.nodeVEI ?? null;
  const nodeSVFBand = geom?.nodeSVFBand ?? null;

  return {
    source: {
      repository_name: MURRAY_HILL_GEOMETRY_SOURCE.repositoryName,
      repository_commit: MURRAY_HILL_GEOMETRY_SOURCE.repositoryCommit,
      source_table: MURRAY_HILL_GEOMETRY_SOURCE.sourceTable,
      source_blob: MURRAY_HILL_GEOMETRY_SOURCE.sourceBlob,
    },
    node_id: nodeId,
    H_m: {
      value: hM,
      unit: 'm',
      source_column: 'H_m',
      classification: 'REPO_GEOMETRY_CONTEXT',
      status: hM !== null ? 'SOURCE-BACKED CONTEXT' : 'UNAVAILABLE IN SOURCE ROW',
    },
    W_facade: {
      value: wFacade,
      unit: 'm',
      source_column: 'W_facade',
      classification: 'REPO_GEOMETRY_CONTEXT',
      status: wFacade !== null ? 'SOURCE-BACKED CONTEXT' : 'UNAVAILABLE IN SOURCE ROW',
    },
    HW_facade: {
      value: hwFacade,
      source_column: 'HW_facade',
      classification: 'REPO_GEOMETRY_CONTEXT',
      status: hwFacade !== null ? 'SOURCE-BACKED CONTEXT' : 'UNAVAILABLE IN SOURCE ROW',
    },
    HW_effective: {
      value: hwEffective,
      source_column: 'HW_effective',
      classification: 'REPO_GEOMETRY_CONTEXT',
      active_sim_evidence: false,
      status: hwEffective !== null ? 'SOURCE-BACKED CONTEXT' : 'UNAVAILABLE IN SOURCE ROW',
    },
    HW_source: {
      value: hwSource,
      source_column: 'HW_source',
      classification: 'REPO_GEOMETRY_CONTEXT',
    },
    node_GVI: {
      value: nodeGVI,
      source_column: 'node_GVI',
      classification: 'REPO_GEOMETRY_CONTEXT',
      paper_boundary: 'NOT_GVI_EYE',
    },
    node_VEI: {
      value: nodeVEI,
      source_column: 'node_VEI',
      classification: 'REPO_GEOMETRY_CONTEXT',
    },
    node_SVF_band: {
      value: nodeSVFBand,
      source_column: 'node_SVF_band',
      classification: 'REPO_GEOMETRY_CONTEXT',
      paper_boundary: 'NOT_TRUE_SVF_NOT_ACTIVE_Y_INPUT',
    },
  };
}

export function buildSpaceSyntaxGwrReconciliationExport() {
  return {
    final_paper: {
      sample: {
        raw_observations: FINAL_PAPER_SAMPLE_ACCOUNTING.rawDualDirectionalObservations,
        raw_nodes: FINAL_PAPER_SAMPLE_ACCOUNTING.rawPhysicalNodes,
        excluded_tunnel_observations: FINAL_PAPER_SAMPLE_ACCOUNTING.excludedTunnelObservations,
        excluded_tunnel_nodes: FINAL_PAPER_SAMPLE_ACCOUNTING.excludedTunnelNodes,
        active_observations: FINAL_PAPER_SAMPLE_ACCOUNTING.activeObservations,
        active_nodes: FINAL_PAPER_SAMPLE_ACCOUNTING.activePhysicalNodes,
      },
      space_syntax: {
        radius_m: SPACE_SYNTAX_PAPER_SPECIFICATION.walkingRadiusM,
        choice_definition: SPACE_SYNTAX_PAPER_SPECIFICATION.choiceDefinition,
        integration_definition: SPACE_SYNTAX_PAPER_SPECIFICATION.integrationDefinition,
      },
      diagnostics: {
        model1_r2: NATURE_903_FINAL_GWR_DIAGNOSTICS.model1R2,
        model2_r2: NATURE_903_FINAL_GWR_DIAGNOSTICS.model2R2,
        delta_r2: NATURE_903_FINAL_GWR_DIAGNOSTICS.deltaR2,
        delta_aicc: NATURE_903_FINAL_GWR_DIAGNOSTICS.deltaAicc,
        model1_residual_morans_i: NATURE_903_FINAL_GWR_DIAGNOSTICS.model1ResidualMoransI,
        model2_residual_morans_i: NATURE_903_FINAL_GWR_DIAGNOSTICS.model2ResidualMoransI,
        model2_morans_p: NATURE_903_FINAL_GWR_DIAGNOSTICS.model2MoransP,
        model1_vif_max: NATURE_903_FINAL_GWR_DIAGNOSTICS.model1VifMax,
        model2_vif_max: NATURE_903_FINAL_GWR_DIAGNOSTICS.model2VifMax,
        reported_bandwidth_m: NATURE_903_FINAL_GWR_DIAGNOSTICS.reportedOptimizedBandwidthM,
      },
      classification: FINAL_PAPER_SAMPLE_ACCOUNTING.classification,
    },
    repository: {
      calibration_status: REPOSITORY_GWR_CALIBRATION_RECORD.status,
      feasibility_kernel: REPOSITORY_GWR_CALIBRATION_RECORD.feasibilityKernel,
      machinery_status: REPOSITORY_GWR_CALIBRATION_RECORD.machineryStatus,
      historical_paper_n_reference: REPOSITORY_GWR_CALIBRATION_RECORD.historicalPaperNReference,
      historical_n_status: REPOSITORY_GWR_CALIBRATION_RECORD.historicalNStatus,
      machinery_table: REPOSITORY_GWR_CALIBRATION_RECORD.machineryTable,
    },
    node_level: {
      choice: null,
      integration: null,
      local_betas: null,
      status: 'UNAVAILABLE_NODE_LEVEL_CALIBRATION' as const,
    },
    active_elasticity_execution: {
      a: REPOSITORY_GWR_CALIBRATION_RECORD.activeSIMFallback.a,
      b: REPOSITORY_GWR_CALIBRATION_RECORD.activeSIMFallback.b,
      c: REPOSITORY_GWR_CALIBRATION_RECORD.activeSIMFallback.c,
      source: REPOSITORY_GWR_CALIBRATION_RECORD.activeSIMFallback.source,
      calibration_status: REPOSITORY_GWR_CALIBRATION_RECORD.activeSIMFallback.calibrationStatus,
    },
    provenance_resolution: PAPER_REPOSITORY_CALIBRATION_BOUNDARY.resolution,
  };
}

export interface MultiSourceMasterPayloadParams {
  nodeId?: string;
  isApproved?: boolean;
  activeSim?: {
    I: number | null;
    Y: number | null;
    D: number | null;
    a: number | null;
    b: number | null;
    c: number | null;
    M: number | null;
  } | null;
  geometry?: {
    hM: number | null;
    wFacade: number | null;
    hwFacade: number | null;
    hwEffective: number | null;
    hwSource: string | null;
    nodeGVI: number | null;
    nodeVEI: number | null;
    nodeSVFBand: number | null;
  } | null;
  streetSampling?: {
    murrayHillNodeId?: string;
    externalNodeId?: string | null;
    crosswalkStatus?: string;
    crosswalkMethod?: string;
    matchedNode?: {
      street_name: string | null;
      lat: number | null;
      lng: number | null;
      heading_fwd_deg: number | null;
      heading_rev_deg: number | null;
      seq_fwd: number | null;
      seq_rev: number | null;
      is_tunnel: boolean | null;
      is_bridge: boolean | null;
    } | null;
  } | null;
  sourceImageId?: string | null;
}

export interface MultiSourceMasterPayload {
  schema_version: 'V0_7_0_MULTI_SOURCE_INTEGRATION_RC1';
  release_candidate_status: 'V0_7_0_MULTI_SOURCE_INTEGRATION_RC1';
  active_scientific_core: 'v0.6.3_GOLDEN_FREEZE';
  frozen_golden_sim_n00045: 6.214327916148292;
  multi_source_version: string;
  release_candidate_version: string;
  scientific_core: string;

  qwen_visual_semantic: {
    source: string;
    approval_status: 'AUTHORIZED' | 'PREVIEW_ONLY_NOT_APPROVED';
    orientation_protocol: 'TEAM_ALONG_STREET_180';
    source_field_of_view_degrees: 180;
    source_directionality: 'BIDIRECTIONAL_FORWARD_BACKWARD';
    source_axis_alignment: 'STREET_AXIS';
    paper_protocol_alignment: 'UNRESOLVED_PAPER_PROTOCOL_ALIGNMENT';
    source_image_id: string | null;
  };

  street_view_sampling_geometry: {
    repository: string;
    repository_commit: string;
    role: string;
    spacing_m: number;
    crs: string;
    node_id: string | null;
    crosswalk_status: string;
    crosswalk_method: string;
    matched_node: {
      street_name: string | null;
      lat: number | null;
      lng: number | null;
      heading_fwd_deg: number | null;
      heading_rev_deg: number | null;
      seq_fwd: number | null;
      seq_rev: number | null;
      is_tunnel: boolean | null;
      is_bridge: boolean | null;
    } | null;
    headings: {
      heading_fwd_deg: number | null;
      heading_rev_deg: number | null;
    };
    active_sim_evidence: false;
  };

  morphology_geometry: {
    repository: string;
    repository_commit: string;
    source_table: string;
    source_blob: string;
    role: string;
    H_m: number | null;
    W_facade: number | null;
    HW_facade: number | null;
    HW_effective: number | null;
    HW_source: string | null;
    node_GVI: number | null;
    node_VEI: number | null;
    node_SVF_band: number | null;
    active_sim_evidence: false;
  };

  space_syntax_gwr: {
    space_syntax_radius_m: number;
    choice_definition: string;
    integration_definition: string;
    paper_sample_accounting: {
      raw_observations: number;
      raw_physical_nodes: number;
      excluded_tunnel_observations: number;
      excluded_tunnel_nodes: number;
      active_observations: number;
      active_physical_nodes: number;
    };
    paper_gwr_diagnostics: {
      model1_r2: number;
      model2_r2: number;
      delta_r2: number;
      delta_aicc: number | string;
      morans_i: number;
      morans_p: number;
      bandwidth_m: number;
      kernel: string;
    };
    repository_gwr_machinery: {
      repository_statement: string;
      calibration_status: string;
      machinery_status: string;
      feasibility_kernel: string;
      historical_paper_n_reference: number;
      bandwidth_100m: {
        tr_S: number;
        tr_SS: number;
        effective_df: number;
        s2_divisor: number;
        aicc_penalty: number;
      };
    };
    node_choice: number | null;
    node_choice_status: string;
    node_integration: number | null;
    node_integration_status: string;
    local_betas: Record<string, number | null> | null;
    local_gwr_status: string;
    active_elasticities: {
      a: number;
      b: number;
      c: number;
      source: string;
      calibration_status: string;
    };
  };

  active_sim: {
    I: number | null;
    Y: number | null;
    D: number | null;
    a: number | null;
    b: number | null;
    c: number | null;
    M: number | null;
  };

  gwr_active_elasticity: {
    a: number;
    b: number;
    c: number;
    source: string;
    calibration_status: string;
  };

  space_syntax_node_level: {
    choice: number | null;
    integration: number | null;
    status: string;
  };

  behavioral_observation: {
    paper_specification: {
      t_min: number;
      t_max: number;
      formula_t_base: string;
      formula_F_i: string;
      formula_t_effective: string;
    };
    node_empirical_observation: {
      t_raw_seconds: number | null;
      t_raw_status: string;
      t_base: number | null;
      t_base_status: string;
    };
    stayability_calibration: {
      active_M_i: number | null;
      lambda: number | null;
      lambda_status: string;
      F_i: number | null;
      F_i_status: string;
      t_effective: number | null;
      t_effective_status: string;
    };
    proxy_dwell_surface: {
      status: string;
      kernel_method: string;
      discretization_m: number;
      bandwidth_R: number | null;
      bandwidth_status: string;
      D_xy: number | null;
    };
  };

  stayability_calibration: {
    active_M_i: number | null;
    lambda: number | null;
    lambda_status: string;
    F_i: number | null;
    F_i_status: string;
    t_effective: number | null;
    t_effective_status: string;
  };

  proxy_dwell_surface: {
    status: string;
    kernel_method: string;
    discretization_m: number;
    bandwidth_R: number | null;
    bandwidth_status: string;
    D_xy: number | null;
  };

  provenance_resolutions: typeof MULTI_SOURCE_PROVENANCE_RESOLUTION_RECORD;

  provenance_boundaries: {
    paper_vs_repo_gwr: string;
    paper_behavioral_vs_repo: string;
    blockology_placeholder_lambda: string;
    street_node_crosswalk: string;
    view_protocol_alignment: string;
  };
}

export function buildMultiSourceMasterPayload(
  params: MultiSourceMasterPayloadParams = {}
): MultiSourceMasterPayload {
  const nodeId = params.nodeId ?? 'UNSPECIFIED_NODE';
  const isApproved = params.isApproved ?? false;
  const geometry = params.geometry ?? null;
  const streetSampling = params.streetSampling ?? null;

  const activeSim = params.activeSim ?? {
    I: null,
    Y: null,
    D: null,
    a: null,
    b: null,
    c: null,
    M: null,
  };

  const activeElasticities = {
    a: REPOSITORY_GWR_CALIBRATION_RECORD.activeSIMFallback.a,
    b: REPOSITORY_GWR_CALIBRATION_RECORD.activeSIMFallback.b,
    c: REPOSITORY_GWR_CALIBRATION_RECORD.activeSIMFallback.c,
    source: REPOSITORY_GWR_CALIBRATION_RECORD.activeSIMFallback.source,
    calibration_status: REPOSITORY_GWR_CALIBRATION_RECORD.activeSIMFallback.calibrationStatus,
  };

  const machinery100 = PINNED_GWR_MACHINERY_ROWS.find((row) => row.bandwidth === 100);
  if (!machinery100) {
    throw new Error('PINNED_GWR_MACHINERY_ROWS is missing the required 100 m audit row.');
  }

  const stayabilityCal = {
    active_M_i: activeSim.M,
    lambda: null,
    lambda_status: 'UNRESOLVED_BEHAVIORAL_CALIBRATION',
    F_i: null,
    F_i_status: 'METHOD_GATED_MISSING_LAMBDA',
    t_effective: null,
    t_effective_status: 'INPUT_GATED',
  };

  const proxyDwell = {
    status: 'NETWORK_MODEL_GATED',
    kernel_method: 'GAUSSIAN_SPATIAL_KERNEL',
    discretization_m: 20,
    bandwidth_R: null,
    bandwidth_status: 'UNRESOLVED_PROXY_DWELL_BANDWIDTH',
    D_xy: null,
  };

  const matchedStreetNode = streetSampling?.matchedNode ?? null;

  return {
    schema_version: 'V0_7_0_MULTI_SOURCE_INTEGRATION_RC1',
    release_candidate_status: 'V0_7_0_MULTI_SOURCE_INTEGRATION_RC1',
    active_scientific_core: 'v0.6.3_GOLDEN_FREEZE',
    frozen_golden_sim_n00045: 6.214327916148292,
    multi_source_version: V070_VERSION_METADATA.appDisplayVersion,
    release_candidate_version: V070_VERSION_METADATA.releaseCandidateVersion,
    scientific_core: V070_VERSION_METADATA.scientificCore,

    qwen_visual_semantic: {
      source: 'team_repository_data_bridge',
      approval_status: isApproved ? 'AUTHORIZED' : 'PREVIEW_ONLY_NOT_APPROVED',
      orientation_protocol: 'TEAM_ALONG_STREET_180',
      source_field_of_view_degrees: 180,
      source_directionality: 'BIDIRECTIONAL_FORWARD_BACKWARD',
      source_axis_alignment: 'STREET_AXIS',
      paper_protocol_alignment: 'UNRESOLVED_PAPER_PROTOCOL_ALIGNMENT',
      source_image_id: params.sourceImageId ?? null,
    },

    street_view_sampling_geometry: {
      repository: STREET_VIEW_NODES_SOURCE.repositoryName,
      repository_commit: STREET_VIEW_NODES_SOURCE.repositoryCommit,
      role: STREET_VIEW_NODES_SOURCE.role,
      spacing_m: STREET_VIEW_NODES_SOURCE.spacingM,
      crs: STREET_VIEW_NODES_SOURCE.coordinateReferenceSystem,
      node_id: streetSampling?.externalNodeId ?? null,
      crosswalk_status: streetSampling?.crosswalkStatus ?? 'UNRESOLVED_NODE_CROSSWALK',
      crosswalk_method: streetSampling?.crosswalkMethod ?? 'NO_MATCH',
      matched_node: matchedStreetNode,
      headings: {
        heading_fwd_deg: matchedStreetNode?.heading_fwd_deg ?? null,
        heading_rev_deg: matchedStreetNode?.heading_rev_deg ?? null,
      },
      active_sim_evidence: false,
    },

    morphology_geometry: {
      repository: MURRAY_HILL_GEOMETRY_SOURCE.repositoryName,
      repository_commit: MURRAY_HILL_GEOMETRY_SOURCE.repositoryCommit,
      source_table: MURRAY_HILL_GEOMETRY_SOURCE.sourceTable,
      source_blob: MURRAY_HILL_GEOMETRY_SOURCE.sourceBlob,
      role: 'MORPHOLOGY_CONTEXT',
      H_m: geometry?.hM ?? null,
      W_facade: geometry?.wFacade ?? null,
      HW_facade: geometry?.hwFacade ?? null,
      HW_effective: geometry?.hwEffective ?? null,
      HW_source: geometry?.hwSource ?? null,
      node_GVI: geometry?.nodeGVI ?? null,
      node_VEI: geometry?.nodeVEI ?? null,
      node_SVF_band: geometry?.nodeSVFBand ?? null,
      active_sim_evidence: false,
    },

    space_syntax_gwr: {
      space_syntax_radius_m: SPACE_SYNTAX_PAPER_SPECIFICATION.walkingRadiusM,
      choice_definition: SPACE_SYNTAX_PAPER_SPECIFICATION.choiceDefinition,
      integration_definition: SPACE_SYNTAX_PAPER_SPECIFICATION.integrationDefinition,
      paper_sample_accounting: {
        raw_observations: FINAL_PAPER_SAMPLE_ACCOUNTING.rawDualDirectionalObservations,
        raw_physical_nodes: FINAL_PAPER_SAMPLE_ACCOUNTING.rawPhysicalNodes,
        excluded_tunnel_observations: FINAL_PAPER_SAMPLE_ACCOUNTING.excludedTunnelObservations,
        excluded_tunnel_nodes: FINAL_PAPER_SAMPLE_ACCOUNTING.excludedTunnelNodes,
        active_observations: FINAL_PAPER_SAMPLE_ACCOUNTING.activeObservations,
        active_physical_nodes: FINAL_PAPER_SAMPLE_ACCOUNTING.activePhysicalNodes,
      },
      paper_gwr_diagnostics: {
        model1_r2: NATURE_903_FINAL_GWR_DIAGNOSTICS.model1R2,
        model2_r2: NATURE_903_FINAL_GWR_DIAGNOSTICS.model2R2,
        delta_r2: NATURE_903_FINAL_GWR_DIAGNOSTICS.deltaR2,
        delta_aicc: NATURE_903_FINAL_GWR_DIAGNOSTICS.deltaAicc,
        morans_i: NATURE_903_FINAL_GWR_DIAGNOSTICS.model2ResidualMoransI,
        morans_p: NATURE_903_FINAL_GWR_DIAGNOSTICS.model2MoransP,
        bandwidth_m: NATURE_903_FINAL_GWR_DIAGNOSTICS.reportedOptimizedBandwidthM,
        kernel: NATURE_903_FINAL_GWR_DIAGNOSTICS.kernel,
      },
      repository_gwr_machinery: {
        repository_statement: REPOSITORY_GWR_CALIBRATION_RECORD.repositoryStatement,
        calibration_status: REPOSITORY_GWR_CALIBRATION_RECORD.status,
        machinery_status: REPOSITORY_GWR_CALIBRATION_RECORD.machineryStatus,
        feasibility_kernel: REPOSITORY_GWR_CALIBRATION_RECORD.feasibilityKernel,
        historical_paper_n_reference: REPOSITORY_GWR_CALIBRATION_RECORD.historicalPaperNReference,
        bandwidth_100m: {
          tr_S: machinery100.tr_S,
          tr_SS: machinery100.tr_SS,
          effective_df: machinery100.eff_df,
          s2_divisor: machinery100.s2_divisor,
          aicc_penalty: machinery100.aicc_penalty,
        },
      },
      node_choice: null,
      node_choice_status: 'UNAVAILABLE_NODE_LEVEL_SOURCE',
      node_integration: null,
      node_integration_status: 'UNAVAILABLE_NODE_LEVEL_SOURCE',
      local_betas: null,
      local_gwr_status: 'UNAVAILABLE_NODE_LEVEL_CALIBRATION',
      active_elasticities: activeElasticities,
    },

    active_sim: { ...activeSim },

    gwr_active_elasticity: activeElasticities,

    space_syntax_node_level: {
      choice: null,
      integration: null,
      status: 'UNAVAILABLE_NODE_LEVEL_SOURCE',
    },

    behavioral_observation: {
      paper_specification: {
        t_min: NATURE_903_BEHAVIORAL_SPECIFICATION.tMinSeconds,
        t_max: NATURE_903_BEHAVIORAL_SPECIFICATION.tMaxSeconds,
        formula_t_base: NATURE_903_BEHAVIORAL_SPECIFICATION.tBaseFormula,
        formula_F_i: NATURE_903_BEHAVIORAL_SPECIFICATION.stayabilityFormula,
        formula_t_effective: NATURE_903_BEHAVIORAL_SPECIFICATION.effectiveDwellFormula,
      },
      node_empirical_observation: {
        t_raw_seconds: null,
        t_raw_status: 'UNAVAILABLE_EMPIRICAL_BEHAVIORAL_OUTCOME',
        t_base: null,
        t_base_status: 'INPUT_GATED_MISSING_T_RAW',
      },
      stayability_calibration: stayabilityCal,
      proxy_dwell_surface: proxyDwell,
    },

    stayability_calibration: stayabilityCal,
    proxy_dwell_surface: proxyDwell,
    provenance_resolutions: MULTI_SOURCE_PROVENANCE_RESOLUTION_RECORD,
    provenance_boundaries: {
      paper_vs_repo_gwr: 'RESOLVED_BY_SEPARATION',
      paper_behavioral_vs_repo: 'SOURCE_GATED',
      blockology_placeholder_lambda: 'DEMO_ONLY',
      street_node_crosswalk: streetSampling?.crosswalkStatus ?? 'UNRESOLVED_NODE_CROSSWALK',
      view_protocol_alignment: 'UNRESOLVED_PAPER_PROTOCOL_ALIGNMENT',
    },
  };
}

export interface MultiSourceExportPayload {
  version: 'v0.7.0';
  release_candidate_version: 'V0_7_0_MULTI_SOURCE_INTEGRATION_RC1';
  frozen_scientific_core: 'v0.6.3_GOLDEN_FREEZE';
  multi_source_master: MultiSourceMasterPayload;
  geometry_context: {
    h_m: number | null;
    w_facade: number | null;
    hw_facade: number | null;
    hw_effective: number | null;
    hw_source: string | null;
    node_gvi: number | null;
    node_vei: number | null;
    node_svf_band: number | null;
    status: string;
  };
  murray_hill_geometry_context: MurrayHillGeometryContextPayload;
  street_view_sampling_geometry: {
    source: {
      repository_name: string;
      repository_commit: string;
      role: string;
    };
    source_specification: {
      spacing_m: number;
      crs: string;
      heading_reference: string;
    };
    crosswalk: {
      murray_hill_node_id: string;
      external_node_id: string | null;
      method: string;
      status: string;
    };
    matched_node: {
      street_name: string | null;
      lat: number | null;
      lng: number | null;
      heading_fwd_deg: number | null;
      heading_rev_deg: number | null;
      seq_fwd: number | null;
      seq_rev: number | null;
      is_tunnel: boolean | null;
      is_bridge: boolean | null;
    } | null;
    active_sim_evidence: false;
  };
  paper_reported_gwr_diagnostics: typeof NATURE_903_GWR_PAPER_DIAGNOSTICS;
  space_syntax_gwr_reconciliation: ReturnType<typeof buildSpaceSyntaxGwrReconciliationExport>;
  behavioral_stayability_reconciliation: ReturnType<typeof buildBehavioralStayabilityReconciliationExport>;
  node_level_space_syntax: {
    choice: number | null;
    integration: number | null;
    status: 'UNAVAILABLE_NODE_LEVEL_SOURCE';
  };
  node_level_gwr: {
    local_betas: null;
    status: 'UNAVAILABLE_NODE_LEVEL_CALIBRATION';
    active_fallback: {
      source: 'PAPER_GLOBAL_REFERENCE';
      a: 0.40;
      b: 0.20;
      c: 0.40;
    };
  };
  behavioral_observation: {
    t_raw_seconds: number | null;
    t_base: number | null;
    lambda: null;
    status: 'SOURCE_GATED';
  };
  provenance_boundary: readonly string[];
}

export function buildMultiSourceExportPayload(
  geometry?: {
    hM: number | null;
    wFacade: number | null;
    hwFacade: number | null;
    hwEffective: number | null;
    hwSource: string | null;
    nodeGVI: number | null;
    nodeVEI: number | null;
    nodeSVFBand: number | null;
  },
  streetSampling?: {
    murrayHillNodeId?: string;
    externalNodeId?: string | null;
    method?: string;
    status?: string;
    matchedNode?: {
      street_name: string | null;
      lat: number | null;
      lng: number | null;
      heading_fwd_deg: number | null;
      heading_rev_deg: number | null;
      seq_fwd: number | null;
      seq_rev: number | null;
      is_tunnel: boolean | null;
      is_bridge: boolean | null;
    } | null;
  },
  extraParams?: {
    isApproved?: boolean;
    activeM?: number;
    activeSim?: {
      I: number | null;
      Y: number | null;
      D: number | null;
      a: number | null;
      b: number | null;
      c: number | null;
      M: number | null;
    } | null;
    sourceImageId?: string;
  }
): MultiSourceExportPayload {
  const master = buildMultiSourceMasterPayload({
    nodeId: streetSampling?.murrayHillNodeId ?? 'n00045',
    isApproved: extraParams?.isApproved ?? false,
    activeSim: extraParams?.activeSim ?? null,
    geometry,
    streetSampling: streetSampling
      ? {
          murrayHillNodeId: streetSampling.murrayHillNodeId,
          externalNodeId: streetSampling.externalNodeId,
          crosswalkStatus: streetSampling.status,
          crosswalkMethod: streetSampling.method,
          matchedNode: streetSampling.matchedNode,
        }
      : null,
    sourceImageId: extraParams?.sourceImageId ?? null,
  });

  return {
    version: 'v0.7.0',
    release_candidate_version: 'V0_7_0_MULTI_SOURCE_INTEGRATION_RC1',
    frozen_scientific_core: 'v0.6.3_GOLDEN_FREEZE',
    multi_source_master: master,
    geometry_context: {
      h_m: master.morphology_geometry.H_m,
      w_facade: master.morphology_geometry.W_facade,
      hw_facade: master.morphology_geometry.HW_facade,
      hw_effective: master.morphology_geometry.HW_effective,
      hw_source: master.morphology_geometry.HW_source,
      node_gvi: master.morphology_geometry.node_GVI,
      node_vei: master.morphology_geometry.node_VEI,
      node_svf_band: master.morphology_geometry.node_SVF_band,
      status: master.morphology_geometry.H_m !== null ? 'REPO_MEASURED_OR_DERIVED' : 'UNAVAILABLE',
    },
    murray_hill_geometry_context: buildMurrayHillGeometryContext(
      streetSampling?.murrayHillNodeId ?? 'n00045',
      geometry
    ),
    street_view_sampling_geometry: {
      source: {
        repository_name: STREET_VIEW_NODES_SOURCE.repositoryName,
        repository_commit: STREET_VIEW_NODES_SOURCE.repositoryCommit,
        role: STREET_VIEW_NODES_SOURCE.role,
      },
      source_specification: {
        spacing_m: STREET_VIEW_NODES_SOURCE.spacingM,
        crs: STREET_VIEW_NODES_SOURCE.coordinateReferenceSystem,
        heading_reference: '0_NORTH_CLOCKWISE',
      },
      crosswalk: {
        murray_hill_node_id: streetSampling?.murrayHillNodeId ?? 'n00045',
        external_node_id: streetSampling?.externalNodeId ?? null,
        method: streetSampling?.method ?? 'NO_MATCH',
        status: streetSampling?.status ?? 'UNRESOLVED_NODE_CROSSWALK',
      },
      matched_node: streetSampling?.matchedNode ?? null,
      active_sim_evidence: false,
    },
    paper_reported_gwr_diagnostics: NATURE_903_GWR_PAPER_DIAGNOSTICS,
    space_syntax_gwr_reconciliation: buildSpaceSyntaxGwrReconciliationExport(),
    behavioral_stayability_reconciliation: buildBehavioralStayabilityReconciliationExport(
      streetSampling?.murrayHillNodeId ?? 'n00045',
      extraParams?.activeSim?.M ?? extraParams?.activeM ?? null
    ),
    node_level_space_syntax: {
      choice: null,
      integration: null,
      status: 'UNAVAILABLE_NODE_LEVEL_SOURCE',
    },
    node_level_gwr: {
      local_betas: null,
      status: 'UNAVAILABLE_NODE_LEVEL_CALIBRATION',
      active_fallback: {
        source: 'PAPER_GLOBAL_REFERENCE',
        a: 0.40,
        b: 0.20,
        c: 0.40,
      },
    },
    behavioral_observation: {
      t_raw_seconds: null,
      t_base: null,
      lambda: null,
      status: 'SOURCE_GATED',
    },
    provenance_boundary: SOURCE_CONFLICT_AUDIT_NOTICE.resolution,
  };
}
