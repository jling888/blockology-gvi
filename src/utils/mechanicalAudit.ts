/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VlmStreetscapeEvaluationV31, MechanicalAuditResult, MechanicalAuditCheck } from '../types';

export function runMechanicalAudit(data: Partial<VlmStreetscapeEvaluationV31>): MechanicalAuditResult {
  const checks: MechanicalAuditCheck[] = [];

  // Rule A: original_only_evidence_used_for_score must equal false
  const ruleAPassed = data.original_only_evidence_used_for_score === false;
  checks.push({
    id: 'RULE_A_ORIGINAL_EVIDENCE_ISOLATION',
    ruleName: 'Rule A: Original-Only Evidence Isolation',
    description: 'original_only_evidence_used_for_score must equal false. Features visible solely in the Original image must not influence scores.',
    status: ruleAPassed ? 'pass' : 'review_required',
    detail: ruleAPassed
      ? 'PASS: Model reports false for original_only_evidence_used_for_score.'
      : `REVIEW REQUIRED: original_only_evidence_used_for_score is ${data.original_only_evidence_used_for_score} (expected false).`
  });

  // Rule B: For each of the five audited score pairs, if Primary != Final, score_change_summary must not be "None" or empty
  const scorePairs = [
    {
      name: 'Eye-Level Greenery',
      primary: data.eye_level_greenery_score_primary,
      final: data.eye_level_greenery_score,
      key: 'eye_level_greenery'
    },
    {
      name: 'Street Framing / Enclosure',
      primary: data.framing_score_primary,
      final: data.framing_score,
      key: 'framing'
    },
    {
      name: 'Place Identity',
      primary: data.place_identity_score_primary,
      final: data.place_identity_score,
      key: 'place_identity'
    },
    {
      name: 'Place Attachment Potential',
      primary: data.place_attachment_score_primary,
      final: data.place_attachment_score,
      key: 'place_attachment'
    },
    {
      name: 'Place Dependence Potential',
      primary: data.place_dependence_score_primary,
      final: data.place_dependence_score,
      key: 'place_dependence'
    }
  ];

  const changedScores = scorePairs.filter(p => p.primary !== undefined && p.final !== undefined && p.primary !== p.final);
  const summary = (data.score_change_summary || '').trim();
  const summaryEmpty = summary === '' || summary.toLowerCase() === 'none' || summary.toLowerCase() === 'n/a';

  let ruleBPassed = true;
  let ruleBDetail = '';

  if (changedScores.length > 0) {
    if (summaryEmpty) {
      ruleBPassed = false;
      ruleBDetail = `REVIEW REQUIRED: Detected ${changedScores.length} score change(s) (${changedScores.map(s => `${s.name}: ${s.primary} → ${s.final}`).join(', ')}), but score_change_summary is "${data.score_change_summary}". Valid justification required.`;
    } else {
      ruleBDetail = `PASS: Detected ${changedScores.length} permitted clarification score change(s) with valid justification: "${summary}"`;
    }
  } else {
    ruleBDetail = 'PASS: All Primary and Final scores are congruent (' + (summaryEmpty ? 'No changes made' : `Summary: ${summary}`) + ').';
  }

  checks.push({
    id: 'RULE_B_SCORE_CHANGE_JUSTIFICATION',
    ruleName: 'Rule B: Score Change Justification Audit',
    description: 'If Primary score differs from Final score, score_change_summary must provide explicit justification and must not be "None" or empty.',
    status: ruleBPassed ? 'pass' : 'review_required',
    detail: ruleBDetail
  });

  // Rule C: Every numeric score must be an integer from 1 to 7
  const allScores = [
    { name: 'eye_level_greenery_score_primary', val: data.eye_level_greenery_score_primary },
    { name: 'eye_level_greenery_score', val: data.eye_level_greenery_score },
    { name: 'framing_score_primary', val: data.framing_score_primary },
    { name: 'framing_score', val: data.framing_score },
    { name: 'place_identity_score_primary', val: data.place_identity_score_primary },
    { name: 'place_identity_score', val: data.place_identity_score },
    { name: 'place_attachment_score_primary', val: data.place_attachment_score_primary },
    { name: 'place_attachment_score', val: data.place_attachment_score },
    { name: 'place_dependence_score_primary', val: data.place_dependence_score_primary },
    { name: 'place_dependence_score', val: data.place_dependence_score }
  ];

  const invalidScores = allScores.filter(s => {
    if (typeof s.val !== 'number') return true;
    if (!Number.isInteger(s.val)) return true;
    if (s.val < 1 || s.val > 7) return true;
    return false;
  });

  const ruleCPassed = invalidScores.length === 0;
  checks.push({
    id: 'RULE_C_INTEGER_SCALE_1_TO_7',
    ruleName: 'Rule C: Integer Scale Validation (1–7)',
    description: 'Every numeric score (5 Primary + 5 Final) must be an integer strictly within [1, 7].',
    status: ruleCPassed ? 'pass' : 'review_required',
    detail: ruleCPassed
      ? 'PASS: All 10 scores are valid integers between 1 and 7.'
      : `REVIEW REQUIRED: Found invalid scores: ${invalidScores.map(s => `${s.name}=${s.val}`).join(', ')}`
  });

  // Rule D: All required schema properties must exist
  const requiredFields: (keyof VlmStreetscapeEvaluationV31)[] = [
    'image_id',
    'primary_evidence_summary',
    'greenery_types',
    'greenery_vertical_position',
    'greenery_confidence',
    'eye_level_greenery_rationale',
    'eye_level_greenery_score_primary',
    'eye_level_greenery_score',
    'barrier_present',
    'edge_type',
    'edge_spatial_relationship',
    'buffering_quality',
    'lingering_affordance',
    'edge_confidence',
    'edge_effect_rationale',
    'street_wall_continuity',
    'building_vertical_presence',
    'sky_exposure',
    'setback_openness',
    'vegetation_enclosure',
    'perceived_hw_ratio',
    'enclosure_confidence',
    'enclosure_rationale',
    'framing_score_primary',
    'framing_score',
    'place_identity_score_primary',
    'place_identity_score',
    'place_identity_rationale',
    'place_identity_confidence',
    'place_attachment_score_primary',
    'place_attachment_score',
    'place_attachment_rationale',
    'place_attachment_confidence',
    'place_dependence_score_primary',
    'place_dependence_score',
    'place_dependence_rationale',
    'place_dependence_confidence',
    'original_secondary_contribution',
    'original_only_observations',
    'classification_limitations',
    'score_change_summary',
    'original_only_evidence_used_for_score',
    'audit_status',
    'uncertainty'
  ];

  const missingFields = requiredFields.filter(f => data[f] === undefined || data[f] === null);
  const ruleDPassed = missingFields.length === 0;

  checks.push({
    id: 'RULE_D_SCHEMA_COMPLETENESS',
    ruleName: 'Rule D: Schema Completeness & Integrity',
    description: 'All 44 mandatory structured schema fields defined in the v3.1 specification must be present and populated.',
    status: ruleDPassed ? 'pass' : 'review_required',
    detail: ruleDPassed
      ? `PASS: All ${requiredFields.length} required fields are present.`
      : `REVIEW REQUIRED: Missing fields: ${missingFields.join(', ')}`
  });

  const overallStatus: 'pass' | 'review_required' = checks.every(c => c.status === 'pass') ? 'pass' : 'review_required';

  return {
    overallStatus,
    checks,
    timestamp: new Date().toISOString()
  };
}
