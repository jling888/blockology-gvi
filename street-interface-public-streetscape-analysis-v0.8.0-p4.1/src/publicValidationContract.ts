/**
 * P4.1 protocol-aware validation taxonomy.
 *
 * IMPORTANT: these are two different validation questions.
 * - RESEARCH_90_HALF_VIEW_GOLDEN verifies the frozen scientific core against
 *   the historical canonical n00045 research fixture.
 * - PUBLIC_SINGLE_PHOTO_LIVE verifies runtime stability for a user-uploaded
 *   single photo. It is NOT a historical golden-parity test.
 */
export const PUBLIC_VALIDATION_CONTRACT_VERSION = 'public_validation_contract_v1';

export const RESEARCH_GOLDEN_VALIDATION_CLASS = 'RESEARCH_90_HALF_VIEW_GOLDEN';
export const PUBLIC_LIVE_VALIDATION_CLASS = 'PUBLIC_SINGLE_PHOTO_LIVE';

export const RESEARCH_GOLDEN_VALIDATION_PROFILE = {
  validationClass: RESEARCH_GOLDEN_VALIDATION_CLASS,
  inputProtocol: 'MURRAY_HILL_CANONICAL_90_DEG_HALF_VIEW',
  comparisonMode: 'EXACT_NUMERIC_GOLDEN_PARITY',
  target: 'FROZEN_SIM_CORE',
  historicalGoldenComparable: true,
  expectedGeometry: '90_DEG_DIRECTIONAL_HALF_VIEW',
  statement:
    'Canonical historical Qwen medians are used to regression-test the frozen Nature 9.03 scientific core. Exact numerical parity is required.',
} as const;

export const PUBLIC_LIVE_VALIDATION_PROFILE = {
  validationClass: PUBLIC_LIVE_VALIDATION_CLASS,
  inputProtocol: 'PUBLIC_SINGLE_PHOTO_UNCALIBRATED',
  comparisonMode: 'SAME_INPUT_RUNTIME_STABILITY',
  target: 'LIVE_QWEN_PLUS_FROZEN_SIM',
  historicalGoldenComparable: false,
  expectedGeometry: 'USER_SUPPLIED_SINGLE_PHOTO',
  statement:
    'A public single-photo result is validated by repeat-run stability under the same locked runtime, not by numerical equality to a historical 90-degree half-view.',
} as const;

export type PublicValidationClass =
  | typeof RESEARCH_GOLDEN_VALIDATION_CLASS
  | typeof PUBLIC_LIVE_VALIDATION_CLASS;

export type PublicValidationProfile =
  | typeof RESEARCH_GOLDEN_VALIDATION_PROFILE
  | typeof PUBLIC_LIVE_VALIDATION_PROFILE;

export function validationProfileFor(
  validationClass: PublicValidationClass,
): PublicValidationProfile {
  return validationClass === RESEARCH_GOLDEN_VALIDATION_CLASS
    ? RESEARCH_GOLDEN_VALIDATION_PROFILE
    : PUBLIC_LIVE_VALIDATION_PROFILE;
}
