/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Nature 9.02 Aligned v0.4 — Qwen-owned + Space Syntax/GWR readiness registry.
 */

export type ResearchReadinessStatus =
  | 'DIRECTLY_MEASURED'
  | 'DERIVABLE'
  | 'PARTIAL'
  | 'VLM_REQUIRED'
  | 'GEOMETRY_REQUIRED'
  | 'BEHAVIOR_REQUIRED'
  | 'NOT_OPERATIONALIZED';

export interface ResearchVariableEntry {
  id: string;
  symbol: string;
  name: string;
  domain: string;
  readiness: ResearchReadinessStatus;
  primaryEvidenceSource: string;
  currentValueDescription?: string;
  missingRequirements?: string;
  methodologicalNote: string;
}

export const RESEARCH_VARIABLE_REGISTRY: ResearchVariableEntry[] = [
  {
    id: 'p_total',
    symbol: 'P_total',
    name: 'Total Valid Analytical Pixels',
    domain: 'Vision QA',
    readiness: 'DIRECTLY_MEASURED',
    primaryEvidenceSource: 'Frozen 30-Class Exact-RGB Mask',
    methodologicalNote: 'Deterministic raster accounting used for audit and candidate evidence. It is not automatically equivalent to the latest VLM paper variables.',
  },
  {
    id: 'p_natural_above_ground',
    symbol: 'V_nat',
    name: 'Natural Elements Above-Ground',
    domain: 'Place Imageability',
    readiness: 'VLM_REQUIRED',
    primaryEvidenceSource: 'Approved Team Qwen 7-rung instrument — standardized 90° source',
    missingRequirements: 'Approved Qwen record + standardized 90° image + verified horizon + reconciled orientation protocol',
    methodologicalNote: 'Latest Appendix defines V_nat as a normalized [0,1] visual attention probability. Exact-RGB natural_above_ground remains parallel validation evidence.',
  },
  {
    id: 'p_built_above_ground',
    symbol: 'V_built',
    name: 'Built Elements Above-Ground',
    domain: 'Place Imageability',
    readiness: 'VLM_REQUIRED',
    primaryEvidenceSource: 'Approved Team Qwen 7-rung instrument — standardized 90° source',
    missingRequirements: 'Approved Qwen record + standardized image / verified horizon + reconciled orientation protocol',
    methodologicalNote: 'Vertical structural surfaces only; walkable ground planes are excluded.',
  },
  {
    id: 'ratio_natural_built',
    symbol: 'V_nat / V_built',
    name: 'Natural-to-Built Ratio',
    domain: 'Place Imageability',
    readiness: 'DERIVABLE',
    primaryEvidenceSource: 'Approved Qwen V_nat and V_built',
    methodologicalNote: 'Computed deterministically with an explicit zero-denominator safeguard.',
  },
  {
    id: 'gvi_eye',
    symbol: 'GVI_eye',
    name: 'Foveal Green View Index',
    domain: 'Place Imageability',
    readiness: 'VLM_REQUIRED',
    primaryEvidenceSource: 'Approved Team Qwen green_eye_level instrument',
    methodologicalNote: 'Latest Appendix operationalizes GVI_eye as a normalized VLM score under standardized camera geometry. Whole-frame vegetation remains non-equivalent.',
  },
  {
    id: 'gmi',
    symbol: 'GMI',
    name: 'Green Mitigation Interaction',
    domain: 'Place Imageability',
    readiness: 'VLM_REQUIRED',
    primaryEvidenceSource: 'Approved Team Qwen green_softening instrument',
    methodologicalNote: '0 means no mitigation; 1 means dense eye-level/vertical greenery strongly masks lower hardscape enclosure.',
  },
  {
    id: 'ratio_sign_detail',
    symbol: 'V_sign',
    name: 'Cognitive Legibility Landmarks',
    domain: 'Place Identity',
    readiness: 'VLM_REQUIRED',
    primaryEvidenceSource: 'Approved Team Qwen signage_detail instrument',
    methodologicalNote: 'Historic detail, visual articulation and ground-level signage are scored together as a normalized [0,1] landmark density.',
  },
  {
    id: 'true_svf',
    symbol: 'SVF',
    name: 'Sky View / Standardized Openness',
    domain: 'Place Identity',
    readiness: 'PARTIAL',
    primaryEvidenceSource: 'Geometric SVF override or approved Qwen sky_openness proxy',
    methodologicalNote: 'True geometric / hemispherical SVF has precedence. Without it, the app may use an explicitly labeled standardized openness proxy derived from Qwen sky_openness; the proxy must never be relabeled as true SVF.',
  },
  {
    id: 'sfv',
    symbol: 'SFV',
    name: 'Street Facade Variation / Articulation',
    domain: 'Supplementary Validation Only',
    readiness: 'VLM_REQUIRED',
    primaryEvidenceSource: 'Approved Team Qwen facade_variation instrument',
    missingRequirements: 'Approved Qwen record under the active orientation/source-provenance gates',
    methodologicalNote: 'Under Nature 9.03 Final, SFV is retained for supplementary validation provenance only and is excluded from active Place Identity calculation. The legacy Teacher Gemma strict Appendix JSON omitted a dedicated SFV field.',
  },
  {
    id: 'ratio_pedestrian_ground',
    symbol: 'V_pave',
    name: 'Sidewalk & Paver Walkability',
    domain: 'Place Dependence',
    readiness: 'VLM_REQUIRED',
    primaryEvidenceSource: 'Approved Team Qwen walkable_ground instrument',
    methodologicalNote: 'Latest Appendix scores usable pedestrian ground after obstacle deductions. Enters Place Dependence along with IAS.',
  },
  {
    id: 'ias',
    symbol: 'IAS',
    name: 'Interface Affordance Score',
    domain: 'Place Dependence',
    readiness: 'VLM_REQUIRED',
    primaryEvidenceSource: 'Approved Team Qwen resting_affordance instrument',
    methodologicalNote: 'Stoops and ledges are scored only when physically usable; enters Place Dependence along with V_pave.',
  },
  {
    id: 'gfapi',
    symbol: 'GFAPI',
    name: 'Ground-Floor Active Permeability Index',
    domain: 'Place Identity',
    readiness: 'VLM_REQUIRED',
    primaryEvidenceSource: 'Approved Team Qwen ground_floor_activity instrument',
    methodologicalNote: 'Active transparency and entrance frequency evaluated contextually. Enters active Place Identity (Y_i) in Nature 9.03 Final alongside V_sign and (1-SVF).',
  },
  {
    id: 'hw_ratio',
    symbol: 'H/W',
    name: 'Street Canyon Aspect Ratio',
    domain: 'Geometry / Context Only',
    readiness: 'GEOMETRY_REQUIRED',
    primaryEvidenceSource: 'GIS / building height + street width geometry',
    methodologicalNote: 'H/W is a physical geometry/context measurement. In Nature 9.03 Final (No-Omega), Environmental TFP A_i is deprecated/retired from active SIM calculation.',
  },
  {
    id: 'environmental_tfp',
    symbol: 'A_i',
    name: 'Environmental TFP Canyon Efficiency Factor',
    domain: 'Environmental TFP',
    readiness: 'DERIVABLE',
    primaryEvidenceSource: 'H/W + CWMC Ω_th + ψ (Comparative Audit Only)',
    methodologicalNote: 'RETIRED FROM ACTIVE CALCULATION · NATURE 9.02 COMPARATIVE CONTEXT ONLY. Nature 9.03 Final removes A_i from active M_i.',
  },
  {
    id: 'place_imageability',
    symbol: 'I_i',
    name: 'Place Imageability',
    domain: 'SIM Dimension',
    readiness: 'DERIVABLE',
    primaryEvidenceSource: 'V_nat/V_built + GVI_eye + GMI',
    methodologicalNote: 'Nature 9.03 CWMC reference: α1=α2=α3=1, τ_I=0.20, κ_I=12. These are manuscript-reference values and remain city-calibration dependent.',
  },
  {
    id: 'place_identity',
    symbol: 'Y_i',
    name: 'Place Identity',
    domain: 'SIM Dimension',
    readiness: 'DERIVABLE',
    primaryEvidenceSource: 'V_sign + (1−SVF) + GFAPI',
    methodologicalNote: 'Nature 9.03 Final incorporates GFAPI into Place Identity with β1=β2=β3=1. SFV is retained for supplementary validation only.',
  },
  {
    id: 'place_dependence',
    symbol: 'D_i',
    name: 'Place Dependence',
    domain: 'SIM Dimension',
    readiness: 'DERIVABLE',
    primaryEvidenceSource: 'V_pave + IAS',
    methodologicalNote: 'Nature 9.03 Final uses 2-term D_raw = γ1·V_pave + γ2·IAS normalized by (γ1+γ2)=2.0, with τ_D=0.50, κ_D=15. GFAPI moved to Identity.',
  },
  {
    id: 'space_syntax_choice',
    symbol: 'Choice_i',
    name: 'Segment Choice / Betweenness',
    domain: 'Space Syntax Control',
    readiness: 'NOT_OPERATIONALIZED',
    primaryEvidenceSource: 'Space Syntax segment analysis, R=800m',
    methodologicalNote: 'Controls through-movement in the latest GWR. It does not enter the a/b/c normalization denominator.',
  },
  {
    id: 'space_syntax_integration',
    symbol: 'Integration_i',
    name: 'Segment Integration / Closeness',
    domain: 'Space Syntax Control',
    readiness: 'NOT_OPERATIONALIZED',
    primaryEvidenceSource: 'Space Syntax segment analysis, R=800m',
    methodologicalNote: 'Controls to-movement in the latest GWR. Positive values are required for the manuscript ln(Integration_i) transform.',
  },
  {
    id: 'gwr_elasticity',
    symbol: 'a_i, b_i, c_i',
    name: 'Spatially Varying Local Elasticities',
    domain: 'Space Syntax-Controlled GWR',
    readiness: 'NOT_OPERATIONALIZED',
    primaryEvidenceSource: 'Full local GWR: β₀, β_I, β_Y, β_D, β_Choice, β_Int after Choice/Integration controls',
    methodologicalNote: 'The complete local GWR provenance includes β₀(s_i), β_I(s_i), β_Y(s_i), β_D(s_i), β_Choice(s_i) and β_Int(s_i). Only β_I, β_Y and β_D are normalized into a_i,b_i,c_i; β₀ and the two Space Syntax control coefficients are excluded from the denominator, preserving a_i+b_i+c_i=1.',
  },
  {
    id: 'sim_i',
    symbol: 'M_i',
    name: 'Street Interface Matrix',
    domain: 'Composite Research Synthesis',
    readiness: 'DERIVABLE',
    primaryEvidenceSource: 'I_i, Y_i, D_i and local elasticities',
    methodologicalNote: 'Nature 9.03 Final active formulation: M_i = I_i^a_i · Y_i^b_i · D_i^c_i (No-Omega, A_i excluded).',
  },
  {
    id: 't_raw',
    symbol: 't_raw',
    name: 'Observed Raw Stay Duration',
    domain: 'Behavioral Observation',
    readiness: 'BEHAVIOR_REQUIRED',
    primaryEvidenceSource: 'Observed / sensor-derived pedestrian stay duration in seconds',
    missingRequirements: 'Validated temporal observation or tracking source',
    methodologicalNote: 'Nature 9.03 Final treats t_raw as empirical behavioral observation. The app requires validated temporal pedestrian tracking; static street-view imagery cannot supply temporal dwell duration.',
  },
  {
    id: 't_base',
    symbol: 't_base',
    name: 'Normalized Baseline Stayability Index',
    domain: 'Behavioral Synthesis',
    readiness: 'DERIVABLE',
    primaryEvidenceSource: 'Deterministic normalization of t_raw',
    missingRequirements: 'Observed temporal t_raw (static imagery cannot supply t_base)',
    methodologicalNote: 'Nature 9.03 Final deterministic rule: clip t_raw to [0,300] seconds, then t_base = clipped(t_raw)/300. Missing t_raw is strictly isolated from t_raw=0 and results in INPUT_GATED status.',
  },
  {
    id: 'stayability_factor',
    symbol: 'F_i',
    name: 'Stayability Amplification Factor',
    domain: 'Behavioral Synthesis',
    readiness: 'PARTIAL',
    primaryEvidenceSource: 'F_i = 1 + λM_i',
    missingRequirements: 'Validated λ',
    methodologicalNote: 'F_i is the Nature 9.03 Final stayability amplification factor (F_i = 1 + λ·M_i). A_i is strictly RETIRED_ENVIRONMENTAL_TFP (historical comparative provenance only; never active).',
  },
  {
    id: 't_effective',
    symbol: 't_effective',
    name: 'Effective Pedestrian Stayability',
    domain: 'Behavioral Synthesis',
    readiness: 'PARTIAL',
    primaryEvidenceSource: 'F_i × t_base',
    methodologicalNote: 'Computed only after M_i, λ and t_base are available.',
  },
  {
    id: 'd_xy',
    symbol: 'D(x,y)',
    name: 'Proxy Dwell Effect Density Surface',
    domain: 'Network Spatial Model',
    readiness: 'NOT_OPERATIONALIZED',
    primaryEvidenceSource: '20 m nodes + downstream spatial kernel + F_i·t_base',
    methodologicalNote: 'Network-level output; never a valid single-image output.',
  },
];