/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ============================================================================
 * PAPER-ALIGNED RESEARCH MEASUREMENT OWNERSHIP & DATA PROVENANCE REGISTRY
 * Street Interface Measurement — Nature 9.03 Final · No-Omega v0.5 · Space Syntax/GWR
 * ============================================================================
 *
 * ACTIVE RESEARCH ARCHITECTURE
 *
 * 1. Vision / semantic segmentation measurements
 * 2. Approved Team Qwen 7-rung visual-semantic evidence + legacy comparator isolation
 * 3. Geometry / GIS measurements
 * 4. Deterministic paper-variable assembly
 * 5. Deterministic Place Imageability / Identity / Dependence synthesis
 * 6. GWR network calibration and local elasticities
 * 7. Street Interface Matrix synthesis (No-Omega)
 * 8. Behavioral observations (t_raw) + deterministic t_base normalization
 * 9. Network-level spatial modeling
 *
 * ACTIVE PAPER CHAIN
 *
 * Evidence
 *   ↓
 * V_nat, V_built, GVI_eye, GMI
 * V_sign, SVF, GFAPI (SFV supplementary provenance only)
 * V_pave, IAS
 * Choice_i, Integration_i (Space Syntax, R=800m)
 *   ↓
 * I_i, Y_i, D_i
 *   ↓
 * Space Syntax-controlled local GWR:
 * β_0(s_i), β_I(s_i), β_Y(s_i), β_D(s_i),
 * β_Choice(s_i), β_Int(s_i)
 *   ↓
 * a_i, b_i, c_i
 *   ↓
 * M_i = I_i^a_i × Y_i^b_i × D_i^c_i (No-Omega)
 *   ↓
 * F_i = 1 + λM_i
 *   ↓
 * t_raw (seconds) → clip [0,300] → t_base ∈ [0,1]
 *   ↓
 * t_effective = F_i × t_base
 *   ↓
 * D(x,y)
 *
 * CRITICAL SAFEGUARDS
 *
 * - VLM is evidence reasoning, NOT the calculator for final research indices.
 * - Exact H/W and true SVF are owned by geometry / GIS.
 * - Pixel quantities require a documented segmentation taxonomy.
 * - Missing measurement capability must never silently become numerical zero.
 * - GWR cannot be calibrated from one uploaded image.
 * - Qwen paper variables remain source/horizon/orientation gated; legacy Teacher Gemma remains comparator-only.
 * - The former additive SIM formulation is retired from the active workflow.
 */

export type V33MeasurementOwner =
  | 'pixel_classification_code'
  | 'vlm_spatial_reasoning'
  | 'geometry_gis'
  | 'behavioral_observation'
  | 'deterministic_synthesis'
  | 'spatial_model'
  | 'pending_definition';

export type V33DefinitionStatus =
  | 'defined'
  | 'conditionally_defined'
  | 'pending_formal_specification'
  | 'downstream';

export type V33AppImplementationStatus =
  | 'active'
  | 'legacy_available'
  | 'candidate_available'
  | 'not_implemented'
  | 'outside_current_scope';

export interface V33MeasurementOwnershipEntry {
  key: string;
  label: string;
  researchLayer: string;
  primaryOwner: V33MeasurementOwner;
  definitionStatus: V33DefinitionStatus;
  dependencies: string[];
  currentAppStatus: V33AppImplementationStatus;
  notes: string;
}

export interface V33SegmentationTaxonomyMapping {
  taxonomy_id: string;
  class_mappings: Record<string, string[]>;
  status: 'not_configured' | 'configured';
  warning: string;
}

export const TAXONOMY_REQUIREMENT_WARNING =
  'Pixel-derived numerical metrics require a documented segmentation taxonomy / legend. Missing taxonomy capability must never be interpreted as measured absence.';

export const DEFAULT_SEGMENTATION_TAXONOMY_PLACEHOLDER: V33SegmentationTaxonomyMapping =
  {
    taxonomy_id: 'pending_formal_taxonomy',
    class_mappings: {},
    status: 'not_configured',
    warning: TAXONOMY_REQUIREMENT_WARNING,
  };

export const V33_MEASUREMENT_OWNERSHIP: V33MeasurementOwnershipEntry[] = [
  // ==========================================================================
  // 1. RAW VISION / PIXEL MEASUREMENTS
  // ==========================================================================

  {
    key: 'P_total',
    label: 'Total Valid Analytical Pixels (P_total)',
    researchLayer: 'Vision Measurement Baseline',
    primaryOwner: 'pixel_classification_code',
    definitionStatus: 'defined',
    dependencies: [
      'Semantic Classification image',
      'Lossless raster encoding',
      'Alpha transparency handling',
    ],
    currentAppStatus: 'active',
    notes:
      'Computed deterministically from the semantic classification raster. Transparent pixels are excluded from the analytical denominator.',
  },

  {
    key: 'V_nat',
    label: 'Natural Elements Above-Ground (V_nat)',
    researchLayer: 'Place Imageability Input',
    primaryOwner: 'vlm_spatial_reasoning',
    definitionStatus: 'defined',
    dependencies: [
      'Approved Team Qwen 7-rung vertical_greenery instrument',
      'Standardized 90° source view',
      'h_eye = 1.5 m',
      'Pitch = 0°',
      'Verified source / horizon provenance',
      'Nature 9.02 orientation reconciliation',
    ],
    currentAppStatus: 'candidate_available',
    notes:
      'The active bridge maps approved Qwen vertical_greenery evidence to normalized V_nat in [0,1]. Frozen-taxonomy natural-above-ground coverage remains deterministic validation evidence and is not mathematically interchangeable with V_nat.',
  },

  {
    key: 'V_built',
    label: 'Built Elements Above-Ground (V_built)',
    researchLayer: 'Place Imageability Input',
    primaryOwner: 'vlm_spatial_reasoning',
    definitionStatus: 'defined',
    dependencies: [
      'Approved Team Qwen 7-rung vertical_hardscape instrument',
      'Standardized 90° source view',
      'h_eye = 1.5 m',
      'Pitch = 0°',
      'Ground-plane exclusion rule',
      'Nature 9.02 orientation reconciliation',
    ],
    currentAppStatus: 'candidate_available',
    notes:
      'The active bridge maps approved Qwen vertical_hardscape evidence to normalized V_built in [0,1]. Walkable ground is excluded; frozen-taxonomy built-above-ground coverage remains a separate deterministic validation layer.',
  },

  {
    key: 'natural_built_ratio',
    label: 'Natural-to-Built Ratio (V_nat / V_built)',
    researchLayer: 'Place Imageability Input',
    primaryOwner: 'deterministic_synthesis',
    definitionStatus: 'defined',
    dependencies: [
      'Canonical V_nat',
      'Canonical V_built',
      'Zero-denominator safeguard',
    ],
    currentAppStatus: 'active',
    notes:
      'Computed deterministically as V_nat / V_built. Undefined when V_built equals zero.',
  },

  {
    key: 'P_sidewalk',
    label: 'Sidewalk Surface Evidence',
    researchLayer: 'Place Dependence Input',
    primaryOwner: 'pixel_classification_code',
    definitionStatus: 'defined',
    dependencies: ['Documented sidewalk taxonomy class'],
    currentAppStatus: 'candidate_available',
    notes:
      'Direct semantic evidence for the pedestrian walking surface.',
  },

  {
    key: 'P_paver',
    label: 'Paver / Plaza Surface Evidence',
    researchLayer: 'Place Dependence Input',
    primaryOwner: 'pixel_classification_code',
    definitionStatus: 'conditionally_defined',
    dependencies: [
      'Dedicated paver / pedestrian plaza class in taxonomy',
    ],
    currentAppStatus: 'not_implemented',
    notes:
      'The current frozen taxonomy does not contain a dedicated paver class. Therefore zero paver pixels must not be interpreted as empirical absence.',
  },

  {
    key: 'V_pave',
    label: 'Sidewalk & Paver Walkability (V_pave)',
    researchLayer: 'Place Dependence Input',
    primaryOwner: 'vlm_spatial_reasoning',
    definitionStatus: 'defined',
    dependencies: [
      'Approved Team Qwen walkable_ground instrument',
      'Standardized 90° source provenance',
      'Continuous pedestrian walking surface',
      'Obstacle deduction rule',
    ],
    currentAppStatus: 'candidate_available',
    notes:
      'The active Qwen bridge supplies normalized V_pave in [0,1] after walkability/obstruction reasoning. Pixel sidewalk/paver evidence remains a separate deterministic validation layer.',
  },

  {
    key: 'P_signboard',
    label: 'Signboard Semantic Evidence',
    researchLayer: 'Place Identity Input',
    primaryOwner: 'pixel_classification_code',
    definitionStatus: 'defined',
    dependencies: ['Documented signboard class'],
    currentAppStatus: 'candidate_available',
    notes:
      'Direct semantic signboard evidence extracted from the classification mask.',
  },

  {
    key: 'P_architectural_detail',
    label: 'Architectural Articulation Semantic Evidence',
    researchLayer: 'Place Identity Input',
    primaryOwner: 'pixel_classification_code',
    definitionStatus: 'conditionally_defined',
    dependencies: [
      'Documented architectural-detail research-group mapping',
    ],
    currentAppStatus: 'candidate_available',
    notes:
      'Current taxonomy groups glazing, portals and selected facade articulation classes as architectural-detail evidence.',
  },

  {
    key: 'V_sign',
    label: 'Cognitive Legibility Landmarks (V_sign)',
    researchLayer: 'Place Identity Input',
    primaryOwner: 'vlm_spatial_reasoning',
    definitionStatus: 'defined',
    dependencies: [
      'Approved Team Qwen signage_detail instrument',
      'Historic / facade articulation cues',
      'Ground-level signage cues',
      'Nature 9.02 source/orientation gates',
    ],
    currentAppStatus: 'candidate_available',
    notes:
      'The active Qwen bridge supplies normalized V_sign in [0,1]. Pixel signboard + architectural-detail fractions remain candidate validation evidence and are not publication-equivalent without explicit validation.',
  },

  // ==========================================================================
  // 2. GVI / IMAGEABILITY-RELATED MEASUREMENTS
  // ==========================================================================

  {
    key: 'GVI_eye',
    label: 'Foveal Green View Index (GVI_eye)',
    researchLayer: 'Place Imageability Input',
    primaryOwner: 'vlm_spatial_reasoning',
    definitionStatus: 'defined',
    dependencies: [
      'Approved Team Qwen green_eye_level instrument',
      'Verified horizon alignment',
      'Standardized 90° source provenance',
      'Nature 9.02 orientation reconciliation',
    ],
    currentAppStatus: 'candidate_available',
    notes:
      'The active Qwen bridge supplies a normalized eye-level greenery score in [0,1] under the paper instrument. Whole-frame vegetation percentage remains non-equivalent to GVI_eye.',
  },

  {
    key: 'GMI',
    label: 'Green Mitigation Interaction (GMI)',
    researchLayer: 'Place Imageability Input',
    primaryOwner: 'vlm_spatial_reasoning',
    definitionStatus: 'defined',
    dependencies: [
      'Approved Team Qwen green_softening instrument',
      'Eye-level greenery evidence',
      'Lower-facade hardscape relationship',
      'Nature 9.02 source/orientation gates',
    ],
    currentAppStatus: 'candidate_available',
    notes:
      'The active Qwen bridge supplies normalized GMI in [0,1], representing the degree to which eye-level/vertical greenery visually mitigates lower hardscape enclosure.',
  },

  // ==========================================================================
  // 3. VLM CONTEXTUAL EVIDENCE
  // ==========================================================================

  {
    key: 'eye_level_greenness_evidence',
    label:
      'Eye-Level Greenness Morphology Evidence',
    researchLayer: 'VLM Evidence Layer',
    primaryOwner: 'vlm_spatial_reasoning',
    definitionStatus: 'defined',
    dependencies: [
      'Primary semantic classification',
      'Secondary photographic clarification',
    ],
    currentAppStatus: 'candidate_available',
    notes:
      'Qualitative vegetation type, vertical position, continuity and pedestrian relationship. This evidence must not be substituted for quantitative GVI_eye.',
  },

  {
    key: 'edge_barrier_evidence',
    label:
      'Pedestrian Edge / Barrier Morphology Evidence',
    researchLayer: 'VLM Evidence Layer',
    primaryOwner: 'vlm_spatial_reasoning',
    definitionStatus: 'defined',
    dependencies: [
      'Primary semantic classification',
      'Secondary photographic clarification',
    ],
    currentAppStatus: 'candidate_available',
    notes:
      'Describes edge type, continuity, buffering and spatial relationship. It remains contextual evidence rather than a standalone final paper index.',
  },

  {
    key: 'enclosure_evidence',
    label:
      'Street-Wall & Structural Enclosure Evidence',
    researchLayer: 'VLM Evidence Layer',
    primaryOwner: 'vlm_spatial_reasoning',
    definitionStatus: 'defined',
    dependencies: [
      'Primary semantic classification',
      'Secondary photographic clarification',
    ],
    currentAppStatus: 'candidate_available',
    notes:
      'VLM may describe street-wall continuity, setbacks, sky exposure and perceived enclosure. It must not estimate exact numerical H/W or true SVF.',
  },

  {
    key: 'micro_spatial_affordance_evidence',
    label:
      'Micro-Spatial Affordance Evidence',
    researchLayer: 'VLM Evidence Layer',
    primaryOwner: 'vlm_spatial_reasoning',
    definitionStatus: 'defined',
    dependencies: [
      'Primary semantic classification',
      'Secondary photographic clarification',
    ],
    currentAppStatus: 'candidate_available',
    notes:
      'Provides contextual evidence for whether stoops, ledges, seating, planter edges and ground-floor interfaces can plausibly support stationary or lingering use.',
  },

  // ==========================================================================
  // 4. PLACE IDENTITY — CONTEXTUAL / GEOMETRIC INPUTS
  // ==========================================================================

  {
    key: 'SFV',
    label: 'Street Facade Variation / Articulation (SFV)',
    researchLayer: 'Place Identity Input',
    primaryOwner: 'vlm_spatial_reasoning',
    definitionStatus: 'defined',
    dependencies: [
      'Approved Team Qwen facade_variation instrument',
      'Validated normalized 7-rung probability readout',
      'Nature 9.02 source/orientation gates',
    ],
    currentAppStatus: 'candidate_available',
    notes:
      'The active Qwen bridge supplies SFV through facade_variation normalized expected value. The legacy Teacher Gemma v3.0 strict JSON lacks a dedicated SFV field and therefore remains comparison-only for this variable.',
  },

  {
    key: 'SVF',
    label: 'True Sky View Factor (SVF)',
    researchLayer: 'Place Identity Input',
    primaryOwner: 'geometry_gis',
    definitionStatus: 'conditionally_defined',
    dependencies: [
      'Hemispherical / fisheye image geometry or 3D city model',
      'Optional explicitly labeled Qwen sky_openness proxy when true SVF is unavailable',
    ],
    currentAppStatus: 'active',
    notes:
      'The app accepts a true geometric SVF override and may separately consume a Qwen sky_openness-derived proxy. A perspective/proxy value must never be relabeled as true whole-sky SVF.',
  },

  // ==========================================================================
  // 5. PLACE DEPENDENCE — AFFORDANCE / PERMEABILITY INPUTS
  // ==========================================================================

  {
    key: 'IAS',
    label: 'Interface Affordance Score (IAS)',
    researchLayer: 'Place Dependence Input',
    primaryOwner: 'vlm_spatial_reasoning',
    definitionStatus: 'defined',
    dependencies: [
      'Approved Team Qwen resting_affordance instrument',
      'Stoop / ledge mechanical suitability checks',
      'Defensive-architecture correction rule',
      'Nature 9.02 source/orientation gates',
    ],
    currentAppStatus: 'candidate_available',
    notes:
      'The active Qwen bridge supplies normalized IAS in [0,1]. Stoop/ledge presence alone is insufficient; usability and defensive barriers remain part of the instrument logic.',
  },

  {
    key: 'GFAPI',
    label: 'Ground-Floor Active Permeability Index (GFAPI)',
    researchLayer: 'Place Dependence Input',
    primaryOwner: 'vlm_spatial_reasoning',
    definitionStatus: 'defined',
    dependencies: [
      'Approved Team Qwen ground_floor_activity instrument',
      'Active transparency / entrance evidence',
      'Nature 9.02 source/orientation gates',
    ],
    currentAppStatus: 'candidate_available',
    notes:
      'The active Qwen bridge supplies normalized GFAPI in [0,1]. Glazing presence alone is not sufficient; active ground-floor permeability is evaluated contextually.',
  },

  // ==========================================================================
  // 6. PHYSICAL GEOMETRY / CANYON MODULATION
  // ==========================================================================

  {
    key: 'street_canyon_hw_ratio',
    label: 'Exact Street Canyon Aspect Ratio (H/W)',
    researchLayer: 'Environmental TFP / Canyon Geometry',
    primaryOwner: 'geometry_gis',
    definitionStatus: 'defined',
    dependencies: [
      'Building height',
      'Street / right-of-way width',
      'Spatial node geometry',
    ],
    currentAppStatus: 'active',
    notes:
      'The app accepts exact H/W as an external GIS / physical-geometry input. In Nature 9.03 Final, H/W is outside Place Identity and Environmental TFP A_i is retired from active SIM calculation.',
  },

  {
    key: 'A_i_environmental_tfp',
    label: 'Environmental TFP Canyon Efficiency Factor (A_i)',
    researchLayer: 'Environmental TFP / Canyon Oppression',
    primaryOwner: 'deterministic_synthesis',
    definitionStatus: 'defined',
    dependencies: [
      'Exact H/W',
      'CWMC canyon threshold Ω_th',
      'Decay coefficient ψ',
    ],
    currentAppStatus: 'legacy_available',
    notes:
      'RETIRED FROM ACTIVE CALCULATION · NATURE 9.02 COMPARATIVE CONTEXT ONLY. Nature 9.03 Final removes A_i from active M_i = I_i^a_i · Y_i^b_i · D_i^c_i.',
  },

  // ==========================================================================
  // 7. THREE PLACE DIMENSIONS
  // ==========================================================================

  {
    key: 'place_imageability_index',
    label: 'Place Imageability (I_i)',
    researchLayer: 'SIM Dimension',
    primaryOwner: 'deterministic_synthesis',
    definitionStatus: 'conditionally_defined',
    dependencies: [
      'V_nat / V_built',
      'GVI_eye',
      'GMI',
      'α coefficients',
      'Imageability sigmoid calibration',
    ],
    currentAppStatus: 'active',
    notes:
      'Deterministic paper index. Current working formulation derives I_raw from V_nat/V_built, GVI_eye and GMI, followed by sigmoid transformation to the standardized 1–7 scale.',
  },

  {
    key: 'place_identity_index',
    label: 'Place Identity (Y_i)',
    researchLayer: 'SIM Dimension',
    primaryOwner: 'deterministic_synthesis',
    definitionStatus: 'conditionally_defined',
    dependencies: [
      'V_sign',
      'SVF',
      'GFAPI',
      'β weights',
    ],
    currentAppStatus: 'active',
    notes:
      'Deterministic paper index using V_sign, (1 − SVF) and GFAPI (Nature 9.03 Final). SFV is excluded from active Y_i as supplementary validation evidence.',
  },

  {
    key: 'place_dependence_index',
    label: 'Place Dependence (D_i)',
    researchLayer: 'SIM Dimension',
    primaryOwner: 'deterministic_synthesis',
    definitionStatus: 'conditionally_defined',
    dependencies: [
      'V_pave',
      'IAS',
      'γ coefficients',
      'Dependence sigmoid calibration',
    ],
    currentAppStatus: 'active',
    notes:
      'Deterministic paper index using V_pave and IAS (Nature 9.03 Final). D_raw_paper = γ1·V_pave + γ2·IAS is normalized by (γ1+γ2) into D_calibration_input, followed by sigmoid transformation to the standardized 1–7 scale.',
  },

  // ==========================================================================
  // 8. NETWORK / GWR CALIBRATION
  // ==========================================================================

  {
    key: 'sampling_node_metadata',
    label: 'Sampling Node Coordinates & Orientation',
    researchLayer: 'Spatial Sampling Network',
    primaryOwner: 'geometry_gis',
    definitionStatus: 'defined',
    dependencies: [
      'Node coordinates',
      'Street segment ID',
      'Camera orientation',
      '20 m sampling network',
    ],
    currentAppStatus: 'candidate_available',
    notes:
      'Node/segment provenance bridges are present for Murray Hill, but canonical Nature 9.02 orientation approval remains gated. Node location must come from georeferenced survey / GIS data, never filename inference.',
  },

  {
    key: 'Choice_i',
    label: 'Segment Choice / Betweenness (Choice_i)',
    researchLayer: 'Space Syntax Network Control',
    primaryOwner: 'spatial_model',
    definitionStatus: 'defined',
    dependencies: [
      'Segment-based Space Syntax network',
      'Walking radius R = 800 m',
      'Georeferenced sampling-node / segment linkage',
    ],
    currentAppStatus: 'active',
    notes:
      'Nature 9.02 GWR control for through-movement potential. The APP accepts Choice_i as an externally computed network input; it must not be inferred from a single street-view image and does not enter the Cobb–Douglas SIM directly.',
  },

  {
    key: 'Integration_i',
    label: 'Segment Integration / Closeness (Integration_i)',
    researchLayer: 'Space Syntax Network Control',
    primaryOwner: 'spatial_model',
    definitionStatus: 'defined',
    dependencies: [
      'Segment-based Space Syntax network',
      'Walking radius R = 800 m',
      'Georeferenced sampling-node / segment linkage',
    ],
    currentAppStatus: 'active',
    notes:
      'Nature 9.02 GWR control for to-movement / topological closeness. The APP accepts Integration_i as an externally computed network input; it must not be inferred from a single image and does not enter the Cobb–Douglas SIM directly.',
  },

  {
    key: 'GWR_local_betas',
    label: 'Space Syntax-Controlled Local GWR Coefficients',
    researchLayer: 'GWR Calibration',
    primaryOwner: 'spatial_model',
    definitionStatus: 'conditionally_defined',
    dependencies: [
      'Multi-node spatial dataset',
      'Node coordinates',
      'I_i',
      'Y_i',
      'D_i',
      'Calibration target M_obs',
      'Space Syntax Choice_i (R=800m)',
      'Space Syntax Integration_i (R=800m)',
      'Adaptive bi-square GWR specification',
      'β0(s_i), βI(s_i), βY(s_i), βD(s_i), βChoice(s_i), βInt(s_i)',
    ],
    currentAppStatus: 'active',
    notes:
      'Nature 9.02 uses β_Choice ln(Choice_i) and β_Int ln(Integration_i) controls to isolate design attraction from structural movement potential. The APP accepts externally calibrated local coefficients; it does not solve GWR from a single image.',
  },

  {
    key: 'local_elasticities',
    label: 'Local Cobb–Douglas Elasticities (a_i, b_i, c_i)',
    researchLayer: 'GWR Calibration',
    primaryOwner: 'deterministic_synthesis',
    definitionStatus: 'defined',
    dependencies: [
      'β_I(s_i)',
      'β_Y(s_i)',
      'β_D(s_i)',
      'β_Choice(s_i) and β_Int(s_i) as model-specification controls',
    ],
    currentAppStatus: 'active',
    notes:
      'Derived from β_I, β_Y and β_D only after the Space Syntax-controlled GWR is fitted. β_Choice and β_Int are controls and do not enter the a/b/c denominator.',
  },

  // ==========================================================================
  // 9. STREET INTERFACE MATRIX
  // ==========================================================================

  {
    key: 'SIM_i',
    label: 'Street Interface Matrix (M_i)',
    researchLayer: 'Street Interface Matrix Synthesis',
    primaryOwner: 'deterministic_synthesis',
    definitionStatus: 'defined',
    dependencies: [
      'I_i',
      'Y_i',
      'D_i',
      'a_i',
      'b_i',
      'c_i',
    ],
    currentAppStatus: 'active',
    notes:
      'Nature 9.03 Final active Cobb–Douglas formulation: M_i = I_i^a_i × Y_i^b_i × D_i^c_i, with a_i+b_i+c_i=1 (No-Omega, A_i excluded).',
  },

  // ==========================================================================
  // 10. BEHAVIORAL OBSERVATION & STAYABILITY
  // ==========================================================================

  {
    key: 't_raw',
    label: 'Observed Raw Stay Duration (t_raw, seconds)',
    researchLayer: 'Behavioral Observation',
    primaryOwner: 'behavioral_observation',
    definitionStatus: 'conditionally_defined',
    dependencies: [
      'Validated temporal pedestrian observation / tracking / sensor source',
    ],
    currentAppStatus: 'active',
    notes:
      'Nature 9.03 Final empirical behavioral input. The app requires validated temporal pedestrian tracking; it does not infer dwell duration from a static street-view image.',
  },

  {
    key: 't_base',
    label: 'Normalized Baseline Stayability Index (t_base)',
    researchLayer: 'Behavioral Synthesis',
    primaryOwner: 'deterministic_synthesis',
    definitionStatus: 'defined',
    dependencies: [
      'Observed temporal t_raw seconds (empirical pedestrian tracking)',
      'Nature 9.03 Final bounds t_min=0 s and t_max=300 s',
    ],
    currentAppStatus: 'active',
    notes:
      'The assembler deterministically computes t_base = min(300, max(0, t_raw))/300 when empirical t_raw is available. Missing t_raw is strictly isolated from t_raw=0; static imagery cannot supply t_base.',
  },

  {
    key: 'lambda',
    label: 'Stayability Scaling Parameter (λ)',
    researchLayer: 'Behavioral Synthesis',
    primaryOwner: 'pending_definition',
    definitionStatus: 'pending_formal_specification',
    dependencies: [
      'Behavioral calibration',
      'Protocol-approved / validated implementation value',
    ],
    currentAppStatus: 'not_implemented',
    notes:
      'The paper defines λ symbolically as the visual/architectural attraction scaling parameter on baseline dwell time, but does not establish one universally validated application value. Active λ remains UNRESOLVED_BEHAVIORAL_CALIBRATION.',
  },

  {
    key: 'F_i',
    label: 'Stayability Amplification Factor (F_i)',
    researchLayer: 'Behavioral Synthesis',
    primaryOwner: 'deterministic_synthesis',
    definitionStatus: 'defined',
    dependencies: [
      'M_i',
      'λ',
    ],
    currentAppStatus: 'active',
    notes:
      'Paper-defined deterministic relationship: F_i = 1 + λM_i. Requires validated λ. A_i is strictly retired environmental TFP.',
  },

  {
    key: 't_effective',
    label: 'Effective Pedestrian Stayability (t_effective)',
    researchLayer: 'Behavioral Synthesis',
    primaryOwner: 'deterministic_synthesis',
    definitionStatus: 'defined',
    dependencies: [
      'F_i',
      't_base',
    ],
    currentAppStatus: 'active',
    notes:
      'Computed downstream as t_effective = F_i × t_base after M_i, λ and the Nature 9.03 Final behavioral normalization are available.',
  },

  // ==========================================================================
  // 11. NETWORK-LEVEL SPATIAL MODEL
  // ==========================================================================

  {
    key: 'D_xy',
    label: 'Proxy Dwell Effect Density Surface D(x,y)',
    researchLayer: 'Network Spatial Model',
    primaryOwner: 'spatial_model',
    definitionStatus: 'downstream',
    dependencies: [
      'Georeferenced sampling nodes',
      't_effective values',
      'Spatial distances',
      'Final kernel / bandwidth specification',
    ],
    currentAppStatus: 'outside_current_scope',
    notes:
      'Network-level spatial density output. It cannot be generated legitimately from a single-case street-view analysis.',
  },
];