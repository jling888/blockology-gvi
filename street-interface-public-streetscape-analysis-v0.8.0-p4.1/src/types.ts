/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ConfidenceLevel = 'high' | 'medium' | 'low' | string;

export interface VlmStreetscapeEvaluationV31 {
  image_id: string;
  primary_evidence_summary: string;

  // Eye-Level Greenery
  greenery_types: (
    | 'low_planter'
    | 'hedge_or_shrub'
    | 'low_tree'
    | 'tree_canopy'
    | 'vertical_green_wall'
    | 'ground_vegetation'
    | 'other'
    | 'none'
  )[];
  greenery_vertical_position:
    | 'below_eye_level'
    | 'within_eye_level'
    | 'above_eye_level'
    | 'mixed'
    | 'uncertain';
  eye_level_greenery_score_primary: number;
  eye_level_greenery_score: number;
  eye_level_greenery_rationale: string;
  greenery_confidence: ConfidenceLevel;

  // Edge / Interface
  barrier_present: 'present' | 'absent' | 'uncertain';
  edge_type:
    | 'stoop'
    | 'yard'
    | 'planter_wall'
    | 'low_wall_or_ledge'
    | 'landscape_buffer'
    | 'bollard_or_physical_barrier'
    | 'direct_facade_sidewalk'
    | 'none'
    | 'uncertain';
  edge_spatial_relationship: string;
  buffering_quality: 'low' | 'medium' | 'high' | 'uncertain';
  lingering_affordance: 'low' | 'medium' | 'high' | 'uncertain';
  edge_effect_rationale: string;
  edge_confidence: ConfidenceLevel;

  // Street Canyon / Enclosure
  street_wall_continuity: 'low' | 'medium' | 'high' | 'uncertain';
  building_vertical_presence: 'low' | 'medium' | 'high' | 'uncertain';
  sky_exposure: 'low' | 'medium' | 'high' | 'uncertain';
  setback_openness: 'low' | 'medium' | 'high' | 'uncertain';
  vegetation_enclosure: 'low' | 'medium' | 'high' | 'uncertain';
  perceived_hw_ratio:
    | 'under_enclosed'
    | 'human_scale'
    | 'deep_canyon'
    | 'uncertain';
  framing_score_primary: number;
  framing_score: number;
  enclosure_rationale: string;
  enclosure_confidence: ConfidenceLevel;

  // Sense of Place — Morphological Support Potential
  place_identity_score_primary: number;
  place_identity_score: number;
  place_identity_rationale: string;
  place_identity_confidence: ConfidenceLevel;

  place_attachment_score_primary: number;
  place_attachment_score: number;
  place_attachment_rationale: string;
  place_attachment_confidence: ConfidenceLevel;

  place_dependence_score_primary: number;
  place_dependence_score: number;
  place_dependence_rationale: string;
  place_dependence_confidence: ConfidenceLevel;

  // Evidence Audit
  original_secondary_contribution: string;
  original_only_observations: string;
  classification_limitations: string;
  score_change_summary: string;
  original_only_evidence_used_for_score: boolean;
  audit_status: 'pass' | 'review_required' | string;
  uncertainty: string;
}

export interface MechanicalAuditCheck {
  id: string;
  ruleName: string;
  description: string;
  status: 'pass' | 'review_required';
  detail: string;
}

export interface MechanicalAuditResult {
  overallStatus: 'pass' | 'review_required';
  checks: MechanicalAuditCheck[];
  timestamp: string;
}

export interface EvaluationSession {
  id: string;
  imageId: string;
  timestamp: string;
  pixelClassificationImage: string; // Data URL or URL
  originalImage: string; // Data URL or URL
  pixelClassificationFilename: string;
  originalFilename: string;
  modelOutput: VlmStreetscapeEvaluationV31;
  rawResponseText: string;
  mechanicalAudit: MechanicalAuditResult;
  modelUsed: string;
}

export interface ScorePairMetric {
  name: string;
  category: string;
  primaryKey: keyof VlmStreetscapeEvaluationV31;
  finalKey: keyof VlmStreetscapeEvaluationV31;
  rationaleKey?: keyof VlmStreetscapeEvaluationV31;
  confidenceKey?: keyof VlmStreetscapeEvaluationV31;
  description: string;
}

// ============================================================================
// v3.3 Research Alignment Architecture Types (Parallel non-runtime descriptors)
// ============================================================================

export type V33DomainStatus =
  | 'PARTIALLY AVAILABLE IN LEGACY v3.2 OUTPUT'
  | 'ARCHITECTURE DEFINED — NOT YET COMPUTED'
  | 'PLANNED — NOT COMPUTED IN STEP 1'
  | 'FUTURE DETERMINISTIC SYNTHESIS — NOT YET COMPUTED'
  | 'DOWNSTREAM SPATIAL MODEL — OUTSIDE CURRENT SINGLE-CASE INFERENCE';

export interface V33MeasurementDomain {
  id: string;
  title: string;
  notation: string;
  status: V33DomainStatus;
  legacyBasis: string[];
  description: string;
}

export interface V33ResearchDimension {
  id: string;
  title: string;
  label: string;
  status: V33DomainStatus;
  plannedVariables: string[];
  conceptualDescription: string;
}

export interface V33DownstreamModel {
  id: string;
  title: string;
  notation: string;
  status: V33DomainStatus;
  description: string;
}

// ============================================================================
// v3.3-RC1 Candidate Structured Output Contract (Parallel Non-Active)
// ============================================================================

export type V33TaxonomyStatus = 'not_configured' | 'configured' | 'invalid';

export interface V33TaxonomyClassMapping {
  classId: number | string;
  className: string;
  category: string;
  description?: string;
}

export interface V33SegmentationTaxonomyConfig {
  status: V33TaxonomyStatus;
  taxonomyName?: string;
  version?: string;
  classes?: V33TaxonomyClassMapping[];
  notes?: string;
}

export type V33GreeneryType =
  | 'low_planter'
  | 'hedge_or_shrub'
  | 'low_tree'
  | 'tree_canopy'
  | 'vertical_green_wall'
  | 'elevated_planter_vegetation'
  | 'ground_vegetation'
  | 'other'
  | 'none'
  | 'uncertain';

export type V33VerticalPosition =
  | 'below_eye_level'
  | 'within_eye_level'
  | 'above_eye_level'
  | 'mixed'
  | 'uncertain';

export type V33TertiaryLevel = 'low' | 'medium' | 'high' | 'uncertain';
export type V33ConfidenceLevel = 'low' | 'medium' | 'high';
export type V33Presence = 'present' | 'absent' | 'uncertain';

export type V33EdgeType =
  | 'stoop'
  | 'yard'
  | 'planter_wall'
  | 'low_wall_or_ledge'
  | 'landscape_buffer'
  | 'bollard_or_physical_barrier'
  | 'direct_facade_sidewalk'
  | 'none'
  | 'uncertain';

export type V33PerceivedHwRatio =
  | 'under_enclosed'
  | 'human_scale'
  | 'deep_canyon'
  | 'uncertain';

export type V33StationaryAffordanceType =
  | 'bench_or_seat'
  | 'usable_ledge_or_low_wall'
  | 'stoop'
  | 'planter_edge'
  | 'parasol_or_shade_structure'
  | 'street_furniture'
  | 'active_ground_floor_interface'
  | 'other'
  | 'none'
  | 'uncertain';

export interface V33EyeLevelGreennessDomain {
  greenery_types: V33GreeneryType[];
  greenery_vertical_position: V33VerticalPosition;
  greenery_continuity: V33TertiaryLevel;
  greenery_pedestrian_relationship: string;
  confidence: V33ConfidenceLevel;
}

export interface V33EdgeBarrierDensityDomain {
  barrier_present: V33Presence;
  edge_type: V33EdgeType;
  barrier_continuity: V33TertiaryLevel;
  buffering_quality: V33TertiaryLevel;
  edge_spatial_relationship: string;
  confidence: V33ConfidenceLevel;
}

export interface V33TransitionalStructuralEnclosureDomain {
  street_wall_continuity: V33TertiaryLevel;
  building_vertical_presence: V33TertiaryLevel;
  sky_exposure: V33TertiaryLevel;
  setback_openness: V33TertiaryLevel;
  vegetation_enclosure: V33TertiaryLevel;
  perceived_hw_ratio: V33PerceivedHwRatio;
  enclosure_spatial_relationship: string;
  confidence: V33ConfidenceLevel;
}

export interface V33MicroSpatialAffordancesDomain {
  stationary_affordance_present: V33Presence;
  stationary_affordance_types: V33StationaryAffordanceType[];
  lingering_affordance: V33TertiaryLevel;
  ground_floor_active_permeability: V33TertiaryLevel;
  affordance_spatial_relationship: string;
  confidence: V33ConfidenceLevel;
}

export interface V33EvidenceAudit {
  original_secondary_contribution: string;
  original_only_observations: string;
  classification_limitations: string;
  original_only_evidence_used_for_measurement: boolean;
  audit_status: 'pass' | 'review_required';
  uncertainty: string;
}

export interface V33MechanicalAuditCheck {
  id: string;
  ruleName: string;
  status: 'pass' | 'review_required';
  detail: string;
}

export interface V33MechanicalAuditResult {
  overallStatus: 'pass' | 'review_required';
  checks: V33MechanicalAuditCheck[];
  timestamp: string;
}

export interface V33StreetInterfaceMeasurement {
  schema_version: string;
  image_id: string;
  primary_evidence_summary: string;

  measurement_domains: {
    eye_level_greenness: V33EyeLevelGreennessDomain;
    edge_barrier_density: V33EdgeBarrierDensityDomain;
    transitional_structural_enclosure: V33TransitionalStructuralEnclosureDomain;
    micro_spatial_affordances: V33MicroSpatialAffordancesDomain;
  };

  evidence_audit: V33EvidenceAudit;
}

export * from './research/v33SegmentationTaxonomy';

export type V33PixelMeasurementStatus =
  | 'computed'
  | 'taxonomy_required'
  | 'unsupported_lossy_format'
  | 'unsupported_image_format'
  | 'processing_error';

export interface V33ClassPixelMeasurement {
  class_id: string;
  label: string;
  rgb: [number, number, number];
  research_groups: string[];
  pixel_count: number;
  fraction_of_valid_pixels: number;
}

export interface V33GroupPixelMeasurements {
  P_natural_above_ground: number | null;
  P_built_above_ground: number | null;
  P_vegetation: number | null;
  P_sidewalk: number | null;
  P_paver: number | null;
  P_signboard: number | null;
  P_architectural_detail: number | null;
  P_outdoor_seating: number | null;
  P_parasol: number | null;
  P_planter: number | null;
  P_street_furniture: number | null;
}

export interface V33DerivedRatioMetric {
  value: number | null;
  status: 'computed' | 'undefined_zero_denominator' | 'taxonomy_group_unavailable' | 'pending_eye_level_roi_definition';
  numerator?: number;
  denominator?: number;
  description?: string;
}

export interface V33PixelMeasurementResult {
  status: V33PixelMeasurementStatus;
  status_reason?: string;
  provenance: {
    source: 'PIXEL_CLASSIFICATION';
    method: 'EXACT RGB TAXONOMY MATCH';
    analysis_roi: 'full_valid_pixel_classification_frame';
    timestamp: string;
  };
  taxonomy: {
    status: 'not_configured' | 'configured' | 'invalid';
    taxonomy_id: string | null;
    taxonomy_version: string | null;
    mapping_mode: 'exact_rgb' | null;
  };
  image: {
    width_px: number;
    height_px: number;

    /**
     * Actual analytical source format.
     * "png" may be reported only after PNG signature verification.
     */
    format: string;

    total_pixel_count: number;

    /**
     * v0.3 source-integrity provenance.
     * Optional for backward compatibility with older stored node records.
     */
    source_filename?: string | null;
    source_mime_type?: string | null;
    source_kind?: 'uploaded' | 'built_in_sample' | 'unknown';
    source_integrity?:
      | 'verified_png_signature'
      | 'synthetic_demo_rasterized_from_svg'
      | 'rejected_non_png'
      | 'unknown';
    png_signature_verified?: boolean;
  };
  coverage: {
    valid_pixel_count: number;
    transparent_pixel_count: number;
    mapped_pixel_count: number;
    unmapped_pixel_count: number;
    mapped_fraction: number;
    unmapped_fraction: number;
  };
  class_measurements: V33ClassPixelMeasurement[];
  group_measurements: V33GroupPixelMeasurements;
  derived_metrics: {
    natural_built_above_ground_ratio: V33DerivedRatioMetric;
    sidewalk_paver_ratio: V33DerivedRatioMetric;
    signboard_detail_ratio: V33DerivedRatioMetric;
    GVI_eye: {
      value: null;
      status: 'pending_eye_level_roi_definition';
      note: string;
    };
  };
}

/**
 * Eventual one-row-per-sampling-node dataset architecture.
 */
export interface V33ResearchNodeRecord {
  record_id?: string;
  image_id: string;
  created_at?: string;
  schema_version?: string;
  taxonomy_status?: 'not_configured' | 'configured' | 'invalid';
  vlm_measurement?: V33StreetInterfaceMeasurement;
  pixel_measurements?: V33PixelMeasurementResult | null;

  /**
   * Physical / vector geometry measurements from 3D GIS or survey.
   */
  geometry_measurements?: {
    street_canyon_hw_ratio?: number;
    SVF?: number;
  };

  /**
   * Baseline behavioral inputs (outside single-case static image inference scope).
   */
  behavioral_inputs?: {
    t_base?: number;
  };

  /**
   * Deterministic derived research indices and synthesis layers.
   */
  derived_indices?: {
    natural_built_above_ground_ratio?: number;
    signboard_detail_ratio?: number;
    sidewalk_paver_ratio?: number;
    EBC?: number; // Pending formal specification
    TEF?: number; // Pending formal specification
    SAI?: number; // Pending formal specification
    GMI?: number; // Pending formal specification
    GFAPI?: number; // Pending formal specification
    place_imageability?: number;
    place_identity?: number;
    place_dependence?: number;
    SIM_i?: number;
    t_effective?: number;
  };

  /**
   * Downstream 2D spatial kernel density modeling surface.
   */
  spatial_output?: {
    proxy_dwell_effect_density?: number;
  };
}





// ============================================================================
// Teacher 8/31 Appendix — VLM Visual Grounding Protocol v3.0
// ============================================================================

export type PaperVlmImageQuadrant = 'North' | 'East' | 'South' | 'West';

export interface PaperVlmV30Measurement {
  node_metadata: {
    image_quadrant: PaperVlmImageQuadrant;
    horizon_alignment_verified: boolean;
  };

  natural_environs_imageability: {
    v_nat_reasoning: string;
    v_nat_score: number;
    gvi_eye_reasoning: string;
    gvi_eye_score: number;
    gmi_reasoning: string;
    gmi_score: number;
  };

  morphological_containment_identity: {
    v_built_reasoning: string;
    v_built_score: number;
    canyon_enclosure_ratio: number;
    v_sign_reasoning: string;
    v_sign_score: number;
  };

  physical_utility_dependence: {
    v_pave_reasoning: string;
    v_pave_score: number;
    gfapi_reasoning: string;
    gfapi_score: number;
    ias_reasoning: string;
    ias_score: number;
  };

  analytical_summary: {
    dominant_behavioral_driver: 'Transit' | 'Restoration' | 'Pause';
    perceptual_coherence_index: number;
    vlm_confidence_score: number;
  };
}


// ============================================================================
// v0.3 — Team Qwen-Compatible VLM Instrument Contract
// Teacher 8/31 paper variables + Murray Hill validated 7-rung scaffolding
//
// IMPORTANT:
// - This contract is additive. It does NOT replace PaperVlmV30Measurement.
// - Each perceptual field is evaluated independently.
// - Full 1–7 probability mass is retained.
// - expected_value is the primary continuous model readout.
// - normalized_ev = (expected_value - 1) / 6 bridges the 1–7 instrument to [0,1].
// - Final I/Y/D/A_i/M_i/F_i remain deterministic downstream computations.
// ============================================================================

export type PaperVlmInstrumentVersion = 'qwen_7_rung_v0.3';

export type PaperVlmInstrumentFieldId =
  | 'vertical_greenery'
  | 'vertical_hardscape'
  | 'green_eye_level'
  | 'sky_openness'
  | 'walkable_ground'
  | 'green_softening'
  | 'signage_detail'
  | 'facade_variation'
  | 'ground_floor_activity'
  | 'resting_affordance';

export type PaperVlmPaperVariableId =
  | 'V_nat'
  | 'V_built'
  | 'GVI_eye'
  | 'sky_openness_proxy'
  | 'V_pave'
  | 'GMI'
  | 'V_sign'
  | 'SFV'
  | 'GFAPI'
  | 'IAS';

export type PaperVlmRung = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface PaperVlmRungProbabilities {
  p1: number;
  p2: number;
  p3: number;
  p4: number;
  p5: number;
  p6: number;
  p7: number;
}

export type PaperVlmValidationStrength =
  | 'strong'
  | 'moderate'
  | 'weak'
  | 'construct_validation_pending'
  | 'vlm_only_no_pixel_twin';

export interface PaperVlmValidationDescriptor {
  /**
   * Research validation status is NOT the same thing as model confidence.
   */
  strength: PaperVlmValidationStrength;

  /**
   * Name of the deterministic / segmentation comparison target when one exists.
   * Example: vegetation arc share.
   */
  measured_twin?: string;

  /**
   * Optional externally supplied validation statistic.
   * Do not fabricate this value in the APP.
   */
  spearman_rho?: number;

  notes?: string;
}

export interface PaperVlmInstrumentFieldResult {
  /**
   * Team instrument field, e.g. vertical_greenery.
   */
  field_id: PaperVlmInstrumentFieldId;

  /**
   * Teacher-paper variable that this field supplies.
   */
  paper_variable: PaperVlmPaperVariableId;

  /**
   * Rounded 1–7 rung retained for interpretation / display.
   */
  rung: PaperVlmRung;

  /**
   * Continuous expectation over the seven response logits:
   * EV = Σ p(k) * k
   */
  expected_value: number;

  /**
   * Most probable discrete rung.
   */
  argmax: PaperVlmRung;

  /**
   * Complete probability mass for rungs 1–7, or null if not measured.
   */
  probabilities: PaperVlmRungProbabilities | null;

  /**
   * Continuous bridge to the teacher Appendix [0,1] variable scale:
   * normalized_ev = (expected_value - 1) / 6
   */
  normalized_ev: number;

  /**
   * The exact instrument/scaffold version used to produce this result.
   */
  instrument_version: PaperVlmInstrumentVersion;

  /**
   * Optional short observable-evidence note.
   * This must not be used to invent downstream numerical variables.
   */
  evidence_note?: string;

  continuous_readout_method?: 'ORDINAL_INTERPOLATED_MEDIAN' | 'LOGIT_EXPECTED_VALUE' | string | null;
  continuous_readout_value?: number | null;
  normalized_continuous_readout?: number | null;

  /**
   * Model uncertainty / confidence remains separate from research validation.
   */
  model_confidence?: number;

  validation: PaperVlmValidationDescriptor;
}

export type PaperVlmInstrumentViewProtocol =
  | 'teacher_orthogonal_cardinal_90'
  | 'team_walk_relative_half_90'
  | 'team_along_street_180'
  | null;

export type PaperVlmOrientationAlignmentStatus =
  | 'teacher_aligned'
  | 'unreconciled'
  | 'UNRESOLVED_SOURCE_PROTOCOL';

export interface PaperVlmInstrumentNodeMetadata {
  /**
   * Only populated when the source is genuinely one of the teacher protocol's
   * orthogonal North / East / South / West frames.
   *
   * Team Murray Hill svi_90 half-views are walk-relative and therefore MUST
   * leave this null until an explicit protocol reconciliation / reprojection.
   */
  image_quadrant: PaperVlmImageQuadrant | null;

  /**
   * Exact orientation protocol that produced the evaluated image, or null if unresolved.
   */
  view_protocol: PaperVlmInstrumentViewProtocol;

  /**
   * Whether the source orientation is currently accepted as equivalent to the
   * teacher 8/31 Appendix orientation specification.
   */
  orientation_alignment_status: PaperVlmOrientationAlignmentStatus;

  /**
   * Team half-view provenance. L/R are relative to direction of travel.
   */
  walk_cardinal?: 'N' | 'E' | 'S' | 'W' | null;
  walk_side?: 'L' | 'R' | null;

  /**
   * Team export_svi_90 centres each half 45 degrees off the walk bearing.
   * Negative = left; positive = right.
   */
  view_center_offset_from_walk_degrees?: -45 | 45 | null;

  /**
   * Required safeguard before a result is eligible for paper-variable assembly.
   */
  horizon_alignment_verified: boolean;

  /**
   * Standardized single-view protocol expected by the research instrument, or null if unproven.
   */
  field_of_view_degrees: 90 | 180 | null;
  eye_height_m: 1.5 | null;
  pitch_degrees: 0 | null;

  node_id?: string;
  source_image_id?: string;
}

export interface PaperVlmInstrumentRun {
  schema_version: 'paper_vlm_instrument_v0.3';

  node_metadata: PaperVlmInstrumentNodeMetadata;

  model: {
    family: 'Qwen';
    model_id: string;
    inference_mode: 'one_field_per_call';
    score_readout: 'next_token_logits_1_to_7';
  };

  /**
   * Exactly one result per field. The evaluator will later enforce completeness.
   */
  fields: Partial<Record<PaperVlmInstrumentFieldId, PaperVlmInstrumentFieldResult>>;

  /**
   * True only after all ten required fields pass mechanical validation.
   */
  complete: boolean;

  /**
   * APP may only bridge normalized_ev values downstream when this is true.
   */
  eligible_for_paper_assembly: boolean;

  warnings: string[];
}