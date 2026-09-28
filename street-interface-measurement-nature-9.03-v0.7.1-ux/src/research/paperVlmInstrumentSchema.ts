import type {
  PaperVlmInstrumentFieldId,
  PaperVlmInstrumentFieldResult,
  PaperVlmInstrumentRun,
  PaperVlmPaperVariableId,
  PaperVlmRung,
  PaperVlmRungProbabilities,
} from '../types';

const EPSILON = 1e-6;
const PROBABILITY_SUM_TOLERANCE = 1e-3;

// The teammate Qwen exporter computes EV / argmax from full-precision
// probabilities, then stores p1..p7 rounded to 4 decimals. Therefore a CSV
// reconstructed from stored p1..p7 can legitimately differ slightly from the
// stored full-precision EV.
const STORED_PROBABILITY_DECIMALS = 4;
const STORED_PROBABILITY_ROUNDING_HALF_STEP =
  0.5 * 10 ** -STORED_PROBABILITY_DECIMALS;
const EV_RECONSTRUCTION_TOLERANCE = 3e-3;
const ARGMAX_ROUNDING_TOLERANCE =
  2 * STORED_PROBABILITY_ROUNDING_HALF_STEP + EPSILON;

export const REQUIRED_PAPER_VLM_INSTRUMENT_FIELDS: readonly PaperVlmInstrumentFieldId[] = [
  'vertical_greenery',
  'vertical_hardscape',
  'green_eye_level',
  'sky_openness',
  'walkable_ground',
  'green_softening',
  'signage_detail',
  'facade_variation',
  'ground_floor_activity',
  'resting_affordance',
] as const;

export const PAPER_VARIABLE_BY_INSTRUMENT_FIELD: Readonly<
  Record<PaperVlmInstrumentFieldId, PaperVlmPaperVariableId>
> = {
  vertical_greenery: 'V_nat',
  vertical_hardscape: 'V_built',
  green_eye_level: 'GVI_eye',
  sky_openness: 'sky_openness_proxy',
  walkable_ground: 'V_pave',
  green_softening: 'GMI',
  signage_detail: 'V_sign',
  facade_variation: 'SFV',
  ground_floor_activity: 'GFAPI',
  resting_affordance: 'IAS',
};

function assertFiniteNumber(
  value: unknown,
  label: string,
): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`);
  }
}

function nearlyEqual(a: number, b: number, tolerance = EPSILON): boolean {
  return Math.abs(a - b) <= tolerance;
}

function getProbabilityArray(
  probabilities: PaperVlmRungProbabilities,
): number[] {
  return [
    probabilities.p1,
    probabilities.p2,
    probabilities.p3,
    probabilities.p4,
    probabilities.p5,
    probabilities.p6,
    probabilities.p7,
  ];
}

export function validateAndNormalizeRungProbabilities(
  probabilities: PaperVlmRungProbabilities,
): PaperVlmRungProbabilities {
  const values = getProbabilityArray(probabilities);

  values.forEach((value, index) => {
    assertFiniteNumber(value, `p${index + 1}`);

    if (value < 0 || value > 1) {
      throw new Error(`p${index + 1} must lie in [0,1].`);
    }
  });

  const total = values.reduce((sum, value) => sum + value, 0);

  if (total <= 0) {
    throw new Error('The seven rung probabilities contain no positive probability mass.');
  }

  if (Math.abs(total - 1) > PROBABILITY_SUM_TOLERANCE) {
    throw new Error(
      `The seven rung probabilities must sum to 1 (received ${total.toFixed(6)}).`,
    );
  }

  // Re-normalize only to remove harmless floating-point drift.
  const normalized = values.map((value) => value / total);

  return {
    p1: normalized[0],
    p2: normalized[1],
    p3: normalized[2],
    p4: normalized[3],
    p5: normalized[4],
    p6: normalized[5],
    p7: normalized[6],
  };
}

export function computeExpectedValueFromProbabilities(
  probabilities: PaperVlmRungProbabilities,
): number {
  const normalized = validateAndNormalizeRungProbabilities(probabilities);
  const values = getProbabilityArray(normalized);

  return values.reduce(
    (sum, probability, index) => sum + probability * (index + 1),
    0,
  );
}

export function computeArgmaxRung(
  probabilities: PaperVlmRungProbabilities,
): PaperVlmRung {
  const normalized = validateAndNormalizeRungProbabilities(probabilities);
  const values = getProbabilityArray(normalized);

  let bestIndex = 0;

  for (let index = 1; index < values.length; index += 1) {
    if (values[index] > values[bestIndex]) {
      bestIndex = index;
    }
  }

  return (bestIndex + 1) as PaperVlmRung;
}

export function computeRoundedExpectedRung(
  expectedValue: number,
): PaperVlmRung {
  assertFiniteNumber(expectedValue, 'expected_value');

  const rounded = Math.round(Math.min(7, Math.max(1, expectedValue)));
  return rounded as PaperVlmRung;
}

export function normalizeExpectedValueToUnitInterval(
  expectedValue: number,
): number {
  assertFiniteNumber(expectedValue, 'expected_value');

  if (expectedValue < 1 - EPSILON || expectedValue > 7 + EPSILON) {
    throw new Error(
      `expected_value must lie in [1,7] (received ${expectedValue}).`,
    );
  }

  return (Math.min(7, Math.max(1, expectedValue)) - 1) / 6;
}

export function validatePaperVlmInstrumentFieldResult(
  result: PaperVlmInstrumentFieldResult,
): void {
  const expectedPaperVariable =
    PAPER_VARIABLE_BY_INSTRUMENT_FIELD[result.field_id];

  if (!expectedPaperVariable) {
    throw new Error(`Unknown Paper VLM field_id: ${String(result.field_id)}.`);
  }

  if (result.paper_variable !== expectedPaperVariable) {
    throw new Error(
      `${result.field_id} must map to ${expectedPaperVariable}, not ${result.paper_variable}.`,
    );
  }

  if (result.instrument_version !== 'qwen_7_rung_v0.3') {
    throw new Error(
      `Unsupported instrument version: ${String(result.instrument_version)}.`,
    );
  }

  const probabilities = validateAndNormalizeRungProbabilities(
    result.probabilities,
  );

  const expectedValue = computeExpectedValueFromProbabilities(probabilities);
  const argmax = computeArgmaxRung(probabilities);
  const roundedRung = computeRoundedExpectedRung(expectedValue);
  const normalizedEv = normalizeExpectedValueToUnitInterval(expectedValue);

  if (
    !nearlyEqual(
      result.expected_value,
      expectedValue,
      EV_RECONSTRUCTION_TOLERANCE,
    )
  ) {
    throw new Error(
      `${result.field_id}: expected_value is inconsistent with p1–p7. ` +
        `Stored=${result.expected_value.toFixed(6)}, computed=${expectedValue.toFixed(6)}.`,
    );
  }

  if (result.argmax !== argmax) {
    // The teammate exporter stores argmax from full-precision probabilities,
    // but persists p1..p7 at four decimals. Near-ties can therefore change the
    // apparent winner after CSV rounding. Accept the stored argmax only when
    // its rounded probability remains indistinguishable from the rounded max.
    const values = getProbabilityArray(probabilities);
    const storedArgmaxProbability = values[result.argmax - 1];
    const reconstructedMaxProbability = Math.max(...values);

    if (
      reconstructedMaxProbability - storedArgmaxProbability >
      ARGMAX_ROUNDING_TOLERANCE
    ) {
      throw new Error(
        `${result.field_id}: argmax is inconsistent with p1–p7 beyond ` +
          `the four-decimal storage tolerance. Stored=${result.argmax}, ` +
          `reconstructed=${argmax}.`,
      );
    }
  }

  if (result.rung !== roundedRung) {
    throw new Error(
      `${result.field_id}: rung must equal round(expected_value). ` +
        `Stored=${result.rung}, computed=${roundedRung}.`,
    );
  }

  if (!nearlyEqual(result.normalized_ev, normalizedEv, 5e-4)) {
    throw new Error(
      `${result.field_id}: normalized_ev is inconsistent with expected_value. ` +
        `Stored=${result.normalized_ev.toFixed(6)}, computed=${normalizedEv.toFixed(6)}.`,
    );
  }

  if (
    result.model_confidence !== undefined &&
    (!Number.isFinite(result.model_confidence) ||
      result.model_confidence < 0 ||
      result.model_confidence > 1)
  ) {
    throw new Error(
      `${result.field_id}: model_confidence must lie in [0,1] when provided.`,
    );
  }

  if (
    result.validation.spearman_rho !== undefined &&
    (!Number.isFinite(result.validation.spearman_rho) ||
      result.validation.spearman_rho < -1 ||
      result.validation.spearman_rho > 1)
  ) {
    throw new Error(
      `${result.field_id}: validation Spearman rho must lie in [-1,1] when provided.`,
    );
  }
}

export interface PaperVlmInstrumentRunValidation {
  valid: boolean;
  complete: boolean;
  errors: string[];
  warnings: string[];
}

export function validatePaperVlmInstrumentRun(
  run: PaperVlmInstrumentRun,
): PaperVlmInstrumentRunValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (run.schema_version !== 'paper_vlm_instrument_v0.3') {
    errors.push(
      `Unsupported schema_version: ${String(run.schema_version)}.`,
    );
  }

  if (run.model.family !== 'Qwen') {
    errors.push('Paper VLM Instrument v0.3 requires a Qwen-family source record.');
  }

  if (run.model.inference_mode !== 'one_field_per_call') {
    errors.push('Inference mode must be one_field_per_call.');
  }

  if (run.model.score_readout !== 'next_token_logits_1_to_7') {
    errors.push(
      'Score readout must be next_token_logits_1_to_7; generated JSON scores must not be mislabeled as logits.',
    );
  }

  if (run.node_metadata.field_of_view_degrees !== 90) {
    errors.push('Instrument input must use a 90° field of view.');
  }

  if (run.node_metadata.eye_height_m !== 1.5) {
    errors.push('Instrument input must use eye height h_eye=1.5m.');
  }

  if (run.node_metadata.pitch_degrees !== 0) {
    errors.push('Instrument input must use camera pitch=0°.');
  }

  for (const fieldId of REQUIRED_PAPER_VLM_INSTRUMENT_FIELDS) {
    const result = run.fields[fieldId];

    if (!result) {
      continue;
    }

    try {
      validatePaperVlmInstrumentFieldResult(result);
    } catch (error: any) {
      errors.push(error?.message || String(error));
    }
  }

  const missingFields = REQUIRED_PAPER_VLM_INSTRUMENT_FIELDS.filter(
    (fieldId) => !run.fields[fieldId],
  );

  const complete = missingFields.length === 0;

  if (missingFields.length > 0) {
    warnings.push(
      `Instrument run is incomplete. Missing: ${missingFields.join(', ')}.`,
    );
  }

  if (!run.node_metadata.horizon_alignment_verified) {
    warnings.push(
      'Horizon alignment is not verified; this run must remain ineligible for paper-variable assembly.',
    );
  }

  if (run.complete !== complete) {
    errors.push(
      `Stored complete=${String(run.complete)} is inconsistent with field completeness=${String(complete)}.`,
    );
  }

  const expectedEligibility =
    complete &&
    run.node_metadata.horizon_alignment_verified &&
    errors.length === 0;

  if (run.eligible_for_paper_assembly !== expectedEligibility) {
    errors.push(
      `Stored eligible_for_paper_assembly=${String(
        run.eligible_for_paper_assembly,
      )} is inconsistent with the mechanical gate=${String(
        expectedEligibility,
      )}.`,
    );
  }

  return {
    valid: errors.length === 0,
    complete,
    errors,
    warnings,
  };
}

/**
 * Safety rule for the APP:
 *
 * p1–p7 must come from a backend that actually exposes the seven score-token
 * probabilities/logits. Do NOT synthesize these probabilities from a generated
 * scalar answer and do NOT fill them with artificial distributions.
 *
 * Compatibility note:
 * the teammate CSV stores p1..p7 to four decimals after EV / argmax have already
 * been computed from full-precision probabilities, so the validator explicitly
 * allows only the tiny discrepancy that this storage choice can create.
 */
export const PAPER_VLM_LOGIT_PROVENANCE_RULE =
  'p1–p7 must originate from actual 1–7 score-token probability/logit readout; never fabricate them from generated scalar output.';
