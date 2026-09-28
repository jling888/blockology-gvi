/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ============================================================================
 * v3.3-RC1 DETERMINISTIC MECHANICAL AUDIT ENGINE (Rules A–K)
 * ============================================================================
 *
 * Application-side deterministic mechanical validator for V33StreetInterfaceMeasurement.
 * Operates strictly in parallel with and isolated from the legacy v3.2 Mechanical Audit A–D.
 *
 * Checks:
 * - Rule A: Original-Only Evidence Isolation
 * - Rule B: v3.3 Schema Completeness
 * - Rule C: Enum & Categorical Integrity
 * - Rule D: Evidence-Limitation Consistency
 * - Rule E: Segmentation Taxonomy Gate
 * - Rule F: Taxonomy-Audit Status Consistency
 * - Rule G: Confidence-Uncertainty Consistency
 * - Rule H: Measurement Ownership Boundary (No forbidden research indices/downstream keys)
 * - Rule I: Legacy Score Exclusion (No 1–7 scores)
 * - Rule J: v3.3 Research Scope Integrity (No Place Attachment structured fields)
 * - Rule K: Secondary Contribution Minimalism (Conservative pattern safeguard)
 *
 * Location Anonymity Note:
 * Real-world location anonymity is enforced via model-level system prompts.
 * Full NLP verification of arbitrary entity names is outside deterministic scope.
 */

import {
  V33StreetInterfaceMeasurement,
  V33MechanicalAuditResult,
  V33MechanicalAuditCheck,
  V33TaxonomyStatus,
} from '../types';

// Valid enum member dictionaries
const VALID_CONFIDENCE_LEVELS = new Set(['low', 'medium', 'high']);
const VALID_TERTIARY_LEVELS = new Set(['low', 'medium', 'high', 'uncertain']);
const VALID_PRESENCE_LEVELS = new Set(['present', 'absent', 'uncertain']);
const VALID_AUDIT_STATUS = new Set(['pass', 'review_required']);

const VALID_GREENERY_TYPES = new Set([
  'low_planter',
  'hedge_or_shrub',
  'low_tree',
  'tree_canopy',
  'vertical_green_wall',
  'elevated_planter_vegetation',
  'ground_vegetation',
  'other',
  'none',
  'uncertain',
]);

const VALID_VERTICAL_POSITIONS = new Set([
  'below_eye_level',
  'within_eye_level',
  'above_eye_level',
  'mixed',
  'uncertain',
]);

const VALID_EDGE_TYPES = new Set([
  'stoop',
  'yard',
  'planter_wall',
  'low_wall_or_ledge',
  'landscape_buffer',
  'bollard_or_physical_barrier',
  'direct_facade_sidewalk',
  'none',
  'uncertain',
]);

const VALID_PERCEIVED_HW_RATIOS = new Set([
  'under_enclosed',
  'human_scale',
  'deep_canyon',
  'uncertain',
]);

const VALID_STATIONARY_AFFORDANCE_TYPES = new Set([
  'bench_or_seat',
  'usable_ledge_or_low_wall',
  'stoop',
  'planter_edge',
  'parasol_or_shade_structure',
  'street_furniture',
  'active_ground_floor_interface',
  'other',
  'none',
  'uncertain',
]);

// Forbidden research-index / downstream calculation keys
const FORBIDDEN_RESEARCH_KEYS = new Set([
  'gvi_eye',
  'ebc',
  'tef',
  'sai',
  'svf',
  'gmi',
  'gfapi',
  'place_imageability',
  'place_identity',
  'place_dependence',
  'sim',
  'sim_i',
  't_base',
  't_effective',
  'dwell_duration',
  'proxy_dwell_effect',
  'proxy_dwell_effect_density',
  'natural_built_above_ground_ratio',
  'natural_built_ratio',
  'signboard_detail_ratio',
  'sidewalk_paver_ratio',
  'sfv',
  'exact_hw',
  'hw_ratio_numeric',
]);

// Forbidden legacy score keys
const FORBIDDEN_LEGACY_SCORE_KEYS = new Set([
  'eye_level_greenery_score',
  'eye_level_greenery_score_primary',
  'framing_score',
  'framing_score_primary',
  'place_identity_score',
  'place_identity_score_primary',
  'place_attachment_score',
  'place_attachment_score_primary',
  'place_dependence_score',
  'place_dependence_score_primary',
  'score_change_summary',
  'original_only_evidence_used_for_score',
]);

// Forbidden scope keys (place attachment structured metrics)
const FORBIDDEN_SCOPE_KEYS = new Set([
  'place_attachment',
  'place_attachment_score',
  'place_attachment_potential',
  'place_attachment_rationale',
  'place_attachment_confidence',
]);

function isSubstantive(val?: string | null): boolean {
  if (!val) return false;
  const s = val.trim().toLowerCase();
  return s !== '' && s !== 'none' && s !== 'n/a' && s !== 'not applicable';
}

function getAllKeys(obj: any, prefix = ''): string[] {
  if (!obj || typeof obj !== 'object') return [];
  let keys: string[] = [];
  for (const k of Object.keys(obj)) {
    keys.push(k);
    if (obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
      keys = keys.concat(getAllKeys(obj[k], prefix ? `${prefix}.${k}` : k));
    }
  }
  return keys;
}

export function runV33MechanicalAudit(
  data: Partial<V33StreetInterfaceMeasurement> | null | undefined,
  taxonomyStatus: V33TaxonomyStatus = 'not_configured'
): V33MechanicalAuditResult {
  const checks: V33MechanicalAuditCheck[] = [];

  if (!data) {
    return {
      overallStatus: 'review_required',
      checks: [
        {
          id: 'RULE_NULL_PAYLOAD',
          ruleName: 'Payload Presence',
          status: 'review_required',
          detail: 'REVIEW REQUIRED: No evaluation payload provided.',
        },
      ],
      timestamp: new Date().toISOString(),
    };
  }

  // --------------------------------------------------------------------------
  // Rule A: Original-Only Evidence Isolation
  // --------------------------------------------------------------------------
  const originalOnlyUsed = data.evidence_audit?.original_only_evidence_used_for_measurement;
  const ruleAPassed = originalOnlyUsed === false;
  checks.push({
    id: 'RULE_A_ORIGINAL_EVIDENCE_ISOLATION',
    ruleName: 'Rule A: Original-Only Evidence Isolation',
    status: ruleAPassed ? 'pass' : 'review_required',
    detail: ruleAPassed
      ? 'PASS: Model reports false for original_only_evidence_used_for_measurement.'
      : `REVIEW REQUIRED: original_only_evidence_used_for_measurement is ${String(
          originalOnlyUsed
        )} (expected false).`,
  });

  // --------------------------------------------------------------------------
  // Rule B: v3.3 Schema Completeness
  // --------------------------------------------------------------------------
  const missingFields: string[] = [];

  if (!data.schema_version) missingFields.push('schema_version');
  if (!data.image_id) missingFields.push('image_id');
  if (data.primary_evidence_summary === undefined || data.primary_evidence_summary === null) {
    missingFields.push('primary_evidence_summary');
  }

  const domains = data.measurement_domains;
  if (!domains) {
    missingFields.push('measurement_domains');
  } else {
    // Domain 1
    const d1 = domains.eye_level_greenness;
    if (!d1) {
      missingFields.push('measurement_domains.eye_level_greenness');
    } else {
      if (d1.greenery_types === undefined) missingFields.push('eye_level_greenness.greenery_types');
      if (d1.greenery_vertical_position === undefined) missingFields.push('eye_level_greenness.greenery_vertical_position');
      if (d1.greenery_continuity === undefined) missingFields.push('eye_level_greenness.greenery_continuity');
      if (d1.greenery_pedestrian_relationship === undefined) missingFields.push('eye_level_greenness.greenery_pedestrian_relationship');
      if (d1.confidence === undefined) missingFields.push('eye_level_greenness.confidence');
    }

    // Domain 2
    const d2 = domains.edge_barrier_density;
    if (!d2) {
      missingFields.push('measurement_domains.edge_barrier_density');
    } else {
      if (d2.barrier_present === undefined) missingFields.push('edge_barrier_density.barrier_present');
      if (d2.edge_type === undefined) missingFields.push('edge_barrier_density.edge_type');
      if (d2.barrier_continuity === undefined) missingFields.push('edge_barrier_density.barrier_continuity');
      if (d2.buffering_quality === undefined) missingFields.push('edge_barrier_density.buffering_quality');
      if (d2.edge_spatial_relationship === undefined) missingFields.push('edge_barrier_density.edge_spatial_relationship');
      if (d2.confidence === undefined) missingFields.push('edge_barrier_density.confidence');
    }

    // Domain 3
    const d3 = domains.transitional_structural_enclosure;
    if (!d3) {
      missingFields.push('measurement_domains.transitional_structural_enclosure');
    } else {
      if (d3.street_wall_continuity === undefined) missingFields.push('transitional_structural_enclosure.street_wall_continuity');
      if (d3.building_vertical_presence === undefined) missingFields.push('transitional_structural_enclosure.building_vertical_presence');
      if (d3.sky_exposure === undefined) missingFields.push('transitional_structural_enclosure.sky_exposure');
      if (d3.setback_openness === undefined) missingFields.push('transitional_structural_enclosure.setback_openness');
      if (d3.vegetation_enclosure === undefined) missingFields.push('transitional_structural_enclosure.vegetation_enclosure');
      if (d3.perceived_hw_ratio === undefined) missingFields.push('transitional_structural_enclosure.perceived_hw_ratio');
      if (d3.enclosure_spatial_relationship === undefined) missingFields.push('transitional_structural_enclosure.enclosure_spatial_relationship');
      if (d3.confidence === undefined) missingFields.push('transitional_structural_enclosure.confidence');
    }

    // Domain 4
    const d4 = domains.micro_spatial_affordances;
    if (!d4) {
      missingFields.push('measurement_domains.micro_spatial_affordances');
    } else {
      if (d4.stationary_affordance_present === undefined) missingFields.push('micro_spatial_affordances.stationary_affordance_present');
      if (d4.stationary_affordance_types === undefined) missingFields.push('micro_spatial_affordances.stationary_affordance_types');
      if (d4.lingering_affordance === undefined) missingFields.push('micro_spatial_affordances.lingering_affordance');
      if (d4.ground_floor_active_permeability === undefined) missingFields.push('micro_spatial_affordances.ground_floor_active_permeability');
      if (d4.affordance_spatial_relationship === undefined) missingFields.push('micro_spatial_affordances.affordance_spatial_relationship');
      if (d4.confidence === undefined) missingFields.push('micro_spatial_affordances.confidence');
    }
  }

  const audit = data.evidence_audit;
  if (!audit) {
    missingFields.push('evidence_audit');
  } else {
    if (audit.original_secondary_contribution === undefined) missingFields.push('evidence_audit.original_secondary_contribution');
    if (audit.original_only_observations === undefined) missingFields.push('evidence_audit.original_only_observations');
    if (audit.classification_limitations === undefined) missingFields.push('evidence_audit.classification_limitations');
    if (audit.original_only_evidence_used_for_measurement === undefined) missingFields.push('evidence_audit.original_only_evidence_used_for_measurement');
    if (audit.audit_status === undefined) missingFields.push('evidence_audit.audit_status');
    if (audit.uncertainty === undefined) missingFields.push('evidence_audit.uncertainty');
  }

  const ruleBPassed = missingFields.length === 0;
  checks.push({
    id: 'RULE_B_V33_SCHEMA_COMPLETENESS',
    ruleName: 'Rule B: v3.3 Schema Completeness',
    status: ruleBPassed ? 'pass' : 'review_required',
    detail: ruleBPassed
      ? 'PASS: All required v3.3 top-level objects, 4 measurement domains, and audit fields are present.'
      : `REVIEW REQUIRED: Missing or undefined required fields: ${missingFields.join(', ')}`,
  });

  // --------------------------------------------------------------------------
  // Rule C: Enum & Categorical Integrity
  // --------------------------------------------------------------------------
  const invalidEnums: string[] = [];

  if (domains?.eye_level_greenness) {
    const d1 = domains.eye_level_greenness;
    if (d1.greenery_types && Array.isArray(d1.greenery_types)) {
      for (const t of d1.greenery_types) {
        if (!VALID_GREENERY_TYPES.has(t)) invalidEnums.push(`greenery_types contains invalid member "${t}"`);
      }
    }
    if (d1.greenery_vertical_position && !VALID_VERTICAL_POSITIONS.has(d1.greenery_vertical_position)) {
      invalidEnums.push(`greenery_vertical_position="${d1.greenery_vertical_position}"`);
    }
    if (d1.greenery_continuity && !VALID_TERTIARY_LEVELS.has(d1.greenery_continuity)) {
      invalidEnums.push(`greenery_continuity="${d1.greenery_continuity}"`);
    }
    if (d1.confidence && !VALID_CONFIDENCE_LEVELS.has(d1.confidence)) {
      invalidEnums.push(`eye_level_greenness.confidence="${d1.confidence}"`);
    }
  }

  if (domains?.edge_barrier_density) {
    const d2 = domains.edge_barrier_density;
    if (d2.barrier_present && !VALID_PRESENCE_LEVELS.has(d2.barrier_present)) {
      invalidEnums.push(`barrier_present="${d2.barrier_present}"`);
    }
    if (d2.edge_type && !VALID_EDGE_TYPES.has(d2.edge_type)) {
      invalidEnums.push(`edge_type="${d2.edge_type}"`);
    }
    if (d2.barrier_continuity && !VALID_TERTIARY_LEVELS.has(d2.barrier_continuity)) {
      invalidEnums.push(`barrier_continuity="${d2.barrier_continuity}"`);
    }
    if (d2.buffering_quality && !VALID_TERTIARY_LEVELS.has(d2.buffering_quality)) {
      invalidEnums.push(`buffering_quality="${d2.buffering_quality}"`);
    }
    if (d2.confidence && !VALID_CONFIDENCE_LEVELS.has(d2.confidence)) {
      invalidEnums.push(`edge_barrier_density.confidence="${d2.confidence}"`);
    }
  }

  if (domains?.transitional_structural_enclosure) {
    const d3 = domains.transitional_structural_enclosure;
    if (d3.street_wall_continuity && !VALID_TERTIARY_LEVELS.has(d3.street_wall_continuity)) {
      invalidEnums.push(`street_wall_continuity="${d3.street_wall_continuity}"`);
    }
    if (d3.building_vertical_presence && !VALID_TERTIARY_LEVELS.has(d3.building_vertical_presence)) {
      invalidEnums.push(`building_vertical_presence="${d3.building_vertical_presence}"`);
    }
    if (d3.sky_exposure && !VALID_TERTIARY_LEVELS.has(d3.sky_exposure)) {
      invalidEnums.push(`sky_exposure="${d3.sky_exposure}"`);
    }
    if (d3.setback_openness && !VALID_TERTIARY_LEVELS.has(d3.setback_openness)) {
      invalidEnums.push(`setback_openness="${d3.setback_openness}"`);
    }
    if (d3.vegetation_enclosure && !VALID_TERTIARY_LEVELS.has(d3.vegetation_enclosure)) {
      invalidEnums.push(`vegetation_enclosure="${d3.vegetation_enclosure}"`);
    }
    if (d3.perceived_hw_ratio && !VALID_PERCEIVED_HW_RATIOS.has(d3.perceived_hw_ratio)) {
      invalidEnums.push(`perceived_hw_ratio="${d3.perceived_hw_ratio}"`);
    }
    if (d3.confidence && !VALID_CONFIDENCE_LEVELS.has(d3.confidence)) {
      invalidEnums.push(`transitional_structural_enclosure.confidence="${d3.confidence}"`);
    }
  }

  if (domains?.micro_spatial_affordances) {
    const d4 = domains.micro_spatial_affordances;
    if (d4.stationary_affordance_present && !VALID_PRESENCE_LEVELS.has(d4.stationary_affordance_present)) {
      invalidEnums.push(`stationary_affordance_present="${d4.stationary_affordance_present}"`);
    }
    if (d4.stationary_affordance_types && Array.isArray(d4.stationary_affordance_types)) {
      for (const t of d4.stationary_affordance_types) {
        if (!VALID_STATIONARY_AFFORDANCE_TYPES.has(t)) invalidEnums.push(`stationary_affordance_types contains invalid member "${t}"`);
      }
    }
    if (d4.lingering_affordance && !VALID_TERTIARY_LEVELS.has(d4.lingering_affordance)) {
      invalidEnums.push(`lingering_affordance="${d4.lingering_affordance}"`);
    }
    if (d4.ground_floor_active_permeability && !VALID_TERTIARY_LEVELS.has(d4.ground_floor_active_permeability)) {
      invalidEnums.push(`ground_floor_active_permeability="${d4.ground_floor_active_permeability}"`);
    }
    if (d4.confidence && !VALID_CONFIDENCE_LEVELS.has(d4.confidence)) {
      invalidEnums.push(`micro_spatial_affordances.confidence="${d4.confidence}"`);
    }
  }

  if (audit?.audit_status && !VALID_AUDIT_STATUS.has(audit.audit_status)) {
    invalidEnums.push(`audit_status="${audit.audit_status}"`);
  }

  const ruleCPassed = invalidEnums.length === 0;
  checks.push({
    id: 'RULE_C_ENUM_CATEGORICAL_INTEGRITY',
    ruleName: 'Rule C: Enum & Categorical Integrity',
    status: ruleCPassed ? 'pass' : 'review_required',
    detail: ruleCPassed
      ? 'PASS: All categorical and enum values conform strictly to the v3.3 schema definition.'
      : `REVIEW REQUIRED: Found ${invalidEnums.length} invalid enum/categorical assignment(s): ${invalidEnums.join(', ')}`,
  });

  // --------------------------------------------------------------------------
  // Rule D: Evidence-Limitation Consistency
  // --------------------------------------------------------------------------
  const origOnlyObsSubstantive = isSubstantive(audit?.original_only_observations);
  const classLimitationsSubstantive = isSubstantive(audit?.classification_limitations);

  let ruleDPassed = true;
  let ruleDDetail = '';

  if (origOnlyObsSubstantive) {
    if (!classLimitationsSubstantive) {
      ruleDPassed = false;
      ruleDDetail = `REVIEW REQUIRED: original_only_observations reported substantive observations ("${audit?.original_only_observations}"), but classification_limitations is empty or "None".`;
    } else {
      ruleDDetail = `PASS: Substantive original-only observations are accompanied by substantive classification_limitations ("${audit?.classification_limitations}").`;
    }
  } else {
    ruleDDetail = `PASS: Evidence-limitation consistency satisfied (original_only_observations="${audit?.original_only_observations || 'None'}").`;
  }

  checks.push({
    id: 'RULE_D_EVIDENCE_LIMITATION_CONSISTENCY',
    ruleName: 'Rule D: Evidence-Limitation Consistency',
    status: ruleDPassed ? 'pass' : 'review_required',
    detail: ruleDDetail,
  });

  // --------------------------------------------------------------------------
  // Rule E: Segmentation Taxonomy Gate
  // --------------------------------------------------------------------------
  let ruleEPassed = true;
  const taxonomyViolations: string[] = [];

  if (taxonomyStatus === 'invalid') {
    ruleEPassed = false;
    taxonomyViolations.push('Supplied taxonomy is syntactically or methodologically invalid');
  } else if (taxonomyStatus === 'not_configured') {
    // When taxonomy is NOT_CONFIGURED, all semantic-dependent categorical fields must be uncertain
    const d1 = domains?.eye_level_greenness;
    if (d1) {
      const nonUncertainTypes = d1.greenery_types?.filter((t) => t !== 'uncertain' && t !== 'none');
      if (nonUncertainTypes && nonUncertainTypes.length > 0) {
        taxonomyViolations.push(`eye_level_greenness.greenery_types contains semantic claims [${nonUncertainTypes.join(', ')}] without taxonomy`);
      }
      if (d1.greenery_vertical_position !== 'uncertain') {
        taxonomyViolations.push(`greenery_vertical_position="${d1.greenery_vertical_position}" (expected "uncertain")`);
      }
      if (d1.greenery_continuity !== 'uncertain') {
        taxonomyViolations.push(`greenery_continuity="${d1.greenery_continuity}" (expected "uncertain")`);
      }
    }

    const d2 = domains?.edge_barrier_density;
    if (d2) {
      if (d2.barrier_present !== 'uncertain') {
        taxonomyViolations.push(`barrier_present="${d2.barrier_present}" (expected "uncertain")`);
      }
      if (d2.edge_type !== 'uncertain' && d2.edge_type !== 'none') {
        taxonomyViolations.push(`edge_type="${d2.edge_type}" (expected "uncertain")`);
      }
      if (d2.barrier_continuity !== 'uncertain') {
        taxonomyViolations.push(`barrier_continuity="${d2.barrier_continuity}" (expected "uncertain")`);
      }
      if (d2.buffering_quality !== 'uncertain') {
        taxonomyViolations.push(`buffering_quality="${d2.buffering_quality}" (expected "uncertain")`);
      }
    }

    const d3 = domains?.transitional_structural_enclosure;
    if (d3) {
      if (d3.street_wall_continuity !== 'uncertain') {
        taxonomyViolations.push(`street_wall_continuity="${d3.street_wall_continuity}" (expected "uncertain")`);
      }
      if (d3.building_vertical_presence !== 'uncertain') {
        taxonomyViolations.push(`building_vertical_presence="${d3.building_vertical_presence}" (expected "uncertain")`);
      }
      if (d3.sky_exposure !== 'uncertain') {
        taxonomyViolations.push(`sky_exposure="${d3.sky_exposure}" (expected "uncertain")`);
      }
      if (d3.setback_openness !== 'uncertain') {
        taxonomyViolations.push(`setback_openness="${d3.setback_openness}" (expected "uncertain")`);
      }
      if (d3.vegetation_enclosure !== 'uncertain') {
        taxonomyViolations.push(`vegetation_enclosure="${d3.vegetation_enclosure}" (expected "uncertain")`);
      }
      if (d3.perceived_hw_ratio !== 'uncertain') {
        taxonomyViolations.push(`perceived_hw_ratio="${d3.perceived_hw_ratio}" (expected "uncertain")`);
      }
    }

    const d4 = domains?.micro_spatial_affordances;
    if (d4) {
      if (d4.stationary_affordance_present !== 'uncertain') {
        taxonomyViolations.push(`stationary_affordance_present="${d4.stationary_affordance_present}" (expected "uncertain")`);
      }
      const nonUncertainAffordances = d4.stationary_affordance_types?.filter((t) => t !== 'uncertain' && t !== 'none');
      if (nonUncertainAffordances && nonUncertainAffordances.length > 0) {
        taxonomyViolations.push(`stationary_affordance_types contains [${nonUncertainAffordances.join(', ')}] without taxonomy`);
      }
      if (d4.lingering_affordance !== 'uncertain') {
        taxonomyViolations.push(`lingering_affordance="${d4.lingering_affordance}" (expected "uncertain")`);
      }
      if (d4.ground_floor_active_permeability !== 'uncertain') {
        taxonomyViolations.push(`ground_floor_active_permeability="${d4.ground_floor_active_permeability}" (expected "uncertain")`);
      }
    }

    // Verify classification limitations mentions taxonomy/class mapping
    const limText = (audit?.classification_limitations || '').toLowerCase();
    const mentionsTaxonomy =
      limText.includes('taxonomy') ||
      limText.includes('class mapping') ||
      limText.includes('legend') ||
      limText.includes('unlabeled') ||
      limText.includes('segmentation');

    if (!mentionsTaxonomy) {
      taxonomyViolations.push('classification_limitations does not explicitly document the missing segmentation taxonomy');
    }

    if (taxonomyViolations.length > 0) {
      ruleEPassed = false;
    }
  }

  let ruleEDetail = '';
  if (taxonomyStatus === 'configured') {
    ruleEDetail = 'PASS: Taxonomy state is CONFIGURED; semantic categorical assignments are grounded in validated taxonomy.';
  } else if (ruleEPassed) {
    ruleEDetail = `PASS: Taxonomy state is ${taxonomyStatus.toUpperCase()}; semantic fields correctly reflect conservative uncertainty protocols.`;
  } else {
    ruleEDetail = `REVIEW REQUIRED: Taxonomy is ${taxonomyStatus.toUpperCase()}, but output asserted ungrounded semantic certainty: ${taxonomyViolations.join('; ')}.`;
  }

  checks.push({
    id: 'RULE_E_SEGMENTATION_TAXONOMY_GATE',
    ruleName: 'Rule E: Segmentation Taxonomy Gate',
    status: ruleEPassed ? 'pass' : 'review_required',
    detail: ruleEDetail,
  });

  // --------------------------------------------------------------------------
  // Rule F: Taxonomy-Audit Status Consistency
  // --------------------------------------------------------------------------
  let ruleFPassed = true;
  let ruleFDetail = '';

  if (taxonomyStatus === 'not_configured') {
    if (audit?.audit_status === 'pass') {
      ruleFPassed = false;
      ruleFDetail = 'REVIEW REQUIRED: Taxonomy is NOT_CONFIGURED, preventing complete semantic measurement, but model audit_status reported "pass" (must be "review_required").';
    } else {
      ruleFDetail = 'PASS: Model audit_status is correctly set to "review_required" under NOT_CONFIGURED taxonomy state.';
    }
  } else {
    ruleFDetail = `PASS: Taxonomy is CONFIGURED; model audit_status is "${audit?.audit_status || 'review_required'}".`;
  }

  checks.push({
    id: 'RULE_F_TAXONOMY_AUDIT_STATUS_CONSISTENCY',
    ruleName: 'Rule F: Taxonomy-Audit Status Consistency',
    status: ruleFPassed ? 'pass' : 'review_required',
    detail: ruleFDetail,
  });

  // --------------------------------------------------------------------------
  // Rule G: Confidence-Uncertainty Consistency
  // --------------------------------------------------------------------------
  const confidenceViolations: string[] = [];

  if (domains) {
    // Check Greenery
    const d1 = domains.eye_level_greenness;
    if (d1) {
      const d1UncertainCount =
        (d1.greenery_vertical_position === 'uncertain' ? 1 : 0) +
        (d1.greenery_continuity === 'uncertain' ? 1 : 0) +
        (d1.greenery_types?.every((t) => t === 'uncertain' || t === 'none') ? 1 : 0);
      if (d1UncertainCount >= 2 && d1.confidence === 'high') {
        confidenceViolations.push('Eye-Level Greenness has high confidence despite being predominantly uncertain');
      }
    }

    // Check Edge Barrier
    const d2 = domains.edge_barrier_density;
    if (d2) {
      const d2UncertainCount =
        (d2.barrier_present === 'uncertain' ? 1 : 0) +
        (d2.edge_type === 'uncertain' || d2.edge_type === 'none' ? 1 : 0) +
        (d2.barrier_continuity === 'uncertain' ? 1 : 0) +
        (d2.buffering_quality === 'uncertain' ? 1 : 0);
      if (d2UncertainCount >= 3 && d2.confidence === 'high') {
        confidenceViolations.push('Edge Barrier Density has high confidence despite being predominantly uncertain');
      }
    }

    // Check Enclosure
    const d3 = domains.transitional_structural_enclosure;
    if (d3) {
      const d3UncertainCount =
        (d3.street_wall_continuity === 'uncertain' ? 1 : 0) +
        (d3.building_vertical_presence === 'uncertain' ? 1 : 0) +
        (d3.sky_exposure === 'uncertain' ? 1 : 0) +
        (d3.setback_openness === 'uncertain' ? 1 : 0) +
        (d3.vegetation_enclosure === 'uncertain' ? 1 : 0) +
        (d3.perceived_hw_ratio === 'uncertain' ? 1 : 0);
      if (d3UncertainCount >= 4 && d3.confidence === 'high') {
        confidenceViolations.push('Transitional Structural Enclosure has high confidence despite being predominantly uncertain');
      }
    }

    // Check Affordances
    const d4 = domains.micro_spatial_affordances;
    if (d4) {
      const d4UncertainCount =
        (d4.stationary_affordance_present === 'uncertain' ? 1 : 0) +
        (d4.lingering_affordance === 'uncertain' ? 1 : 0) +
        (d4.ground_floor_active_permeability === 'uncertain' ? 1 : 0) +
        (d4.stationary_affordance_types?.every((t) => t === 'uncertain' || t === 'none') ? 1 : 0);
      if (d4UncertainCount >= 3 && d4.confidence === 'high') {
        confidenceViolations.push('Micro-Spatial Affordances has high confidence despite being predominantly uncertain');
      }
    }
  }

  const ruleGPassed = confidenceViolations.length === 0;
  checks.push({
    id: 'RULE_G_CONFIDENCE_UNCERTAINTY_CONSISTENCY',
    ruleName: 'Rule G: Confidence-Uncertainty Consistency',
    status: ruleGPassed ? 'pass' : 'review_required',
    detail: ruleGPassed
      ? 'PASS: Domain confidence ratings are congruent with internal categorical uncertainty levels.'
      : `REVIEW REQUIRED: Incongruent confidence ratings detected: ${confidenceViolations.join('; ')}.`,
  });

  // --------------------------------------------------------------------------
  // Rule H: Measurement Ownership Boundary (No forbidden research indices)
  // --------------------------------------------------------------------------
  const allObjKeys = getAllKeys(data).map((k) => k.toLowerCase().trim());
  const detectedForbiddenResearchKeys = allObjKeys.filter((k) => {
    const rawKey = k.split('.').pop() || k;
    return FORBIDDEN_RESEARCH_KEYS.has(rawKey);
  });

  const ruleHPassed = detectedForbiddenResearchKeys.length === 0;
  checks.push({
    id: 'RULE_H_MEASUREMENT_OWNERSHIP_BOUNDARY',
    ruleName: 'Rule H: Measurement Ownership Boundary',
    status: ruleHPassed ? 'pass' : 'review_required',
    detail: ruleHPassed
      ? 'PASS: Structured response strictly contains VLM qualitative spatial observations; no downstream mathematical research indices (GVI_eye, EBC, TEF, SAI, SVF, SIM, etc.) detected.'
      : `REVIEW REQUIRED: Output contains forbidden calculated research index keys: ${detectedForbiddenResearchKeys.join(', ')}.`,
  });

  // --------------------------------------------------------------------------
  // Rule I: Legacy Score Exclusion (No 1–7 scores)
  // --------------------------------------------------------------------------
  const detectedLegacyScoreKeys = allObjKeys.filter((k) => {
    const rawKey = k.split('.').pop() || k;
    return FORBIDDEN_LEGACY_SCORE_KEYS.has(rawKey);
  });

  const ruleIPassed = detectedLegacyScoreKeys.length === 0;
  checks.push({
    id: 'RULE_I_LEGACY_SCORE_EXCLUSION',
    ruleName: 'Rule I: Legacy Score Exclusion',
    status: ruleIPassed ? 'pass' : 'review_required',
    detail: ruleIPassed
      ? 'PASS: No legacy 1–7 Likert scores, primary/final score pairs, or legacy score change keys detected.'
      : `REVIEW REQUIRED: Detected prohibited legacy score fields: ${detectedLegacyScoreKeys.join(', ')}.`,
  });

  // --------------------------------------------------------------------------
  // Rule J: v3.3 Research Scope Integrity (No Place Attachment structured keys)
  // --------------------------------------------------------------------------
  const detectedScopeKeys = allObjKeys.filter((k) => {
    const rawKey = k.split('.').pop() || k;
    return FORBIDDEN_SCOPE_KEYS.has(rawKey);
  });

  const ruleJPassed = detectedScopeKeys.length === 0;
  checks.push({
    id: 'RULE_J_V33_RESEARCH_SCOPE_INTEGRITY',
    ruleName: 'Rule J: v3.3 Research Scope Integrity',
    status: ruleJPassed ? 'pass' : 'review_required',
    detail: ruleJPassed
      ? 'PASS: Output adheres strictly to the 4-domain v3.3 Street Interface Measurement scope; no structured Place Attachment fields present.'
      : `REVIEW REQUIRED: Structured output contains prohibited Place Attachment fields: ${detectedScopeKeys.join(', ')}.`,
  });

  // --------------------------------------------------------------------------
  // Rule K: Secondary Contribution Minimalism
  // --------------------------------------------------------------------------
  const secContrib = (audit?.original_secondary_contribution || '').toLowerCase().trim();
  let ruleKPassed = true;
  let ruleKDetail = '';

  if (secContrib === '' || secContrib === 'none' || secContrib === 'n/a') {
    ruleKDetail = 'PASS: original_secondary_contribution is "None" (optimal compliance).';
  } else {
    // Check for obvious prohibited descriptive terms in secondary contribution
    const prohibitedPatterns = [
      /\b(flower|flowers|yellow flower|blooming|blossom)\b/i,
      /\b(plant species|botanical|soil texture|mulch)\b/i,
      /\b(car color|red car|blue car|sedan|suv|toyota|vehicle make)\b/i,
      /\b(autumn|winter|spring|summer|sunny day|cloudy weather)\b/i,
      /\b(red brick texture|stucco finish|aesthetic|beautiful)\b/i,
    ];

    const violations = prohibitedPatterns.filter((pattern) => pattern.test(secContrib));
    if (violations.length > 0) {
      ruleKPassed = false;
      ruleKDetail = `REVIEW REQUIRED: original_secondary_contribution contains prohibited descriptive commentary ("${audit?.original_secondary_contribution}"). (Note: Limited deterministic safeguard).`;
    } else {
      ruleKDetail = `PASS: original_secondary_contribution contains acceptable spatial clarification ("${audit?.original_secondary_contribution}"). (Note: Limited deterministic safeguard).`;
    }
  }

  checks.push({
    id: 'RULE_K_SECONDARY_CONTRIBUTION_MINIMALISM',
    ruleName: 'Rule K: Secondary Contribution Minimalism',
    status: ruleKPassed ? 'pass' : 'review_required',
    detail: ruleKDetail,
  });

  // --------------------------------------------------------------------------
  // Overall Status Calculation
  // --------------------------------------------------------------------------
  const allPassed = checks.every((c) => c.status === 'pass');

  return {
    overallStatus: allPassed ? 'pass' : 'review_required',
    checks,
    timestamp: new Date().toISOString(),
  };
}
