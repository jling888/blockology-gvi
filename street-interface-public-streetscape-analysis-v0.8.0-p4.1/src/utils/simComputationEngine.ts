/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ============================================================================
 * PAPER-ALIGNED DETERMINISTIC SIM COMPUTATION ENGINE
 * Street Interface Measurement — Nature 9.03 Final · No-Omega v0.5
 * ============================================================================
 *
 * ACTIVE NATURE 9.03 FINAL COMPUTATION
 * -------------------------------------
 * Source Paper: nature9.03finalno-omega.docx
 * Method Status: FINAL_NO_OMEGA
 *
 * Place Imageability (I_i):
 *   I_raw = α1·(V_nat/V_built) + α2·GVI_eye + α3·GMI
 *   I_i   = 1 + 6 / [1 + exp(-κ_I·(I_raw - τ_I))]
 *
 * Place Identity (Y_i):
 *   Y_raw = β1·V_sign + β2·(1 - SVF) + β3·GFAPI
 *   Y_i   = 1 + 6·[Y_raw / (β1 + β2 + β3)]
 *   (SFV is removed from active Y_i; retained as supplementary validation provenance)
 *
 * Place Dependence (D_i):
 *   D_raw = γ1·V_pave + γ2·IAS
 *   D_i   = 1 + 6 / [1 + exp(-κ_D·(D_raw - τ_D))]
 *   (D_raw enters sigmoid directly with no calibration divisor; D_calibration_input is legacy diagnostic only)
 *
 * Street Interface Matrix (M_i):
 *   M_i = I_i^{a_i} × Y_i^{b_i} × D_i^{c_i}
 *   (Environmental TFP A_i, Omega_i, canyonThreshold, canyonPsi are retired from active calculation)
 *
 * Local Elasticities (a_i, b_i, c_i):
 *   From Space Syntax-controlled GWR:
 *   a_i = |β_I| / (|β_I| + |β_Y| + |β_D|)
 *   b_i = |β_Y| / (|β_I| + |β_Y| + |β_D|)
 *   c_i = |β_D| / (|β_I| + |β_Y| + |β_D|)
 *   (β0, β_Choice, β_Integration recorded in provenance; excluded from denominator)
 *   Fallback Profile: { a: 0.333333, b: 0.333333, c: 0.333334 } (provenance: FALLBACK_GLOBAL_REFERENCE_9_03)
 *
 * Stayability Amplification & Dwell Time:
 *   F_i = 1 + λ·M_i
 *   t_effective = F_i · t_base
 */

export const PAPER_ALIGNED_SIM_ENGINE_VERSION =
  'paper_aligned_sim_engine_v0.5.2_nature_9_03_no_omega';

export const NATURE_903_PAPER_SOURCE = 'nature9.03finalno-omega.docx';
export const NATURE_903_METHOD_STATUS = 'FINAL_NO_OMEGA';

export type PaperComputationStatus =
  | 'computed'
  | 'input_gated'
  | 'method_gated'
  | 'invalid_input';

export interface PaperMetric<T = number> {
  value: T | null;
  status: PaperComputationStatus;
  reason: string;
  formula?: string;
  substatus?: string;
}

export interface PaperWeightTriple {
  first: number | null;
  second: number | null;
  third: number | null;
}

export interface GWRLocalBetas {
  /**
   * Local intercept from the full Space Syntax-controlled GWR.
   * Recorded as provenance; β0 does NOT enter a_i/b_i/c_i normalization.
   */
  betaIntercept: number | null;

  betaImageability: number | null;
  betaIdentity: number | null;
  betaDependence: number | null;
  betaChoice: number | null;
  betaIntegration: number | null;
}

export interface SpaceSyntaxControls {
  choice: number | null;
  integration: number | null;
  radiusMeters: number;
}

export type ElasticitySource =
  | 'LOCAL_GWR_CALIBRATED'
  | 'SOURCE_BACKED_TYPOLOGY_REFERENCE'
  | 'PAPER_GLOBAL_REFERENCE';

export interface LocalElasticities {
  a: number;
  b: number;
  c: number;
  sum: number;
  source: ElasticitySource;
  calibrationStatus: string;
  methodNote: string;
  typologyKey?: string;
}

export interface PaperCalibrationConfig {
  alpha: PaperWeightTriple;
  identityWeights: PaperWeightTriple;
  gamma: PaperWeightTriple;

  tauI: number;
  kappaI: number;

  tauD: number;
  kappaD: number;

  canyonThreshold: number;
  canyonPsi: number;

  lambda: number | null;
  lambdaStatus: 'UNRESOLVED_BEHAVIORAL_CALIBRATION';
  lambdaSource: 'PAPER_SYMBOLIC_ONLY';
  lambdaNote: string;

  calibrationMode:
    | 'CWMC_MANUSCRIPT_REFERENCE_9_03'
    | 'CWMC_MANUSCRIPT_REFERENCE_9_02'
    | 'EXTERNAL_CITY_PROFILE';

  tauISource: string;
  tauDSource: string;
  canyonThresholdSource: string;
  calibrationNote: string;
}

export interface PaperResearchInputs {
  // Place Imageability: Authoritative inputs for V_nat / V_built execution ownership
  vNat?: number | null;
  vBuilt?: number | null;
  naturalBuiltRatio: number | null;
  gviEye: number | null;
  gmi: number | null;

  // Place Identity
  vSign: number | null;
  svf: number | null;
  sfv: number | null; // Supplementary validation provenance only; excluded from final Y_i/D_i/SIM

  // Place Dependence (V_pave, IAS) + GFAPI (Identity)
  vPave: number | null;
  ias: number | null;
  gfapi: number | null; // Nature 9.03: Enters Place Identity
  dCalibrationInput?: number | null; // Historical diagnostic only; ignored by active engine

  // Canyon geometry (legacy / comparative audit only)
  hwRatio: number | null;

  // Space Syntax + network GWR
  spaceSyntaxChoice: number | null;
  spaceSyntaxIntegration: number | null;
  gwrLocalBetas: GWRLocalBetas | null;

  // Optional source-backed typology (activates ONLY from legitimate research field)
  sourceBackedTypology?: 'avenue_canyon' | 'covenant_midblock' | 'porous_pops' | null;

  // Behavioral input
  tBase: number | null;
}

export interface PaperSynthesisResult {
  engineVersion: string;
  calibration: PaperCalibrationConfig;

  imageabilityRaw: PaperMetric;
  placeImageability: PaperMetric;

  placeIdentity: PaperMetric;

  dependenceRaw: PaperMetric;
  placeDependence: PaperMetric;

  /**
   * Retired from active calculation under Nature 9.03 Final (No-Omega).
   * Kept for comparative diagnostics only.
   */
  environmentalTfp: PaperMetric;
  spaceSyntaxControls: PaperMetric<SpaceSyntaxControls>;
  localElasticities: PaperMetric<LocalElasticities>;

  sim: PaperMetric;
  stayabilityFactor: PaperMetric;
  tEffective: PaperMetric;

  gates: string[];

  elasticitySource: ElasticitySource;
  calibrationStatus: string;

  // D_raw Normalization Provenance (locked paper formula; legacy diagnostic isolated)
  dRawPaper: number | null;
  dCalibrationInput: number | null;
  dNormalizationProvenance: 'LEGACY_IMPLEMENTATION_DIAGNOSTIC';
  dPaperStatus: 'PAPER_FORMULA_LOCKED';
  dImplementationStatus: 'RAW_LINEAR_COMBINATION';
  dValueEnteringSigmoid: 'D_raw_paper';
  dLegacyClassification?: 'LEGACY_IMPLEMENTATION_DIAGNOSTIC';
  dLegacyStatus?: 'NON_ACTIVE';
  dFormulaStatus?: 'NOT_PAPER_FORMULA';

  // I_raw Normalization Provenance
  iRawPaper: number | null;
  iCalibrationInput: number | null;
  iNormalizationProvenance: 'PAPER_EXPLICIT';
  iPaperStatus: 'PAPER_EXPLICIT';
  iImplementationStatus: 'RAW_LINEAR_COMBINATION';
  iValueEnteringSigmoid: 'I_raw_paper';
}

/**
 * Nature 9.03 Final (No-Omega) reference calibration profile.
 */
export const NATURE_903_CWMC_REFERENCE: PaperCalibrationConfig = {
  alpha: { first: 1, second: 1, third: 1 },
  identityWeights: { first: 1, second: 1, third: 1 },
  gamma: { first: 1, second: 1, third: null },

  tauI: 0.20,
  kappaI: 12,

  tauD: 0.50,
  kappaD: 15,

  // Legacy canyon constants (retired from active SIM)
  canyonThreshold: 2.0,
  canyonPsi: 0.15,

  lambda: null,
  lambdaStatus: 'UNRESOLVED_BEHAVIORAL_CALIBRATION',
  lambdaSource: 'PAPER_SYMBOLIC_ONLY',
  lambdaNote:
    'Nature 9.03 defines λ symbolically as the calibration parameter in F_i = 1 + λM_i but does not provide a validated implementation value.',

  calibrationMode: 'CWMC_MANUSCRIPT_REFERENCE_9_03',
  tauISource: 'city-wide median(I_raw) — manuscript reference (tau_I = 0.20)',
  tauDSource: 'city-wide median(D_raw) — manuscript reference (tau_D = 0.50)',
  canyonThresholdSource: 'city-wide median(H/W) — retired from active calculation',
  calibrationNote:
    'Nature 9.03 Final (No-Omega) calibration profile. Active SIM is computed as M_i = I_i^a_i × Y_i^b_i × D_i^c_i. Values tau_I=0.20, tau_D=0.50 are manuscript Murray Hill reference values.',
};

export const MURRAY_HILL_CWMC_REFERENCE = NATURE_903_CWMC_REFERENCE;

export const STAYABILITY_RAW_MIN_SECONDS = 0;
export const STAYABILITY_RAW_MAX_SECONDS = 300;

/**
 * Nature behavioral normalization:
 * t_base = [min(t_max, max(t_min, t_raw)) - t_min] / (t_max - t_min)
 */
export function normalizeRawStayabilitySeconds(rawSeconds: number): number {
  const clipped = Math.min(
    STAYABILITY_RAW_MAX_SECONDS,
    Math.max(STAYABILITY_RAW_MIN_SECONDS, rawSeconds)
  );

  return (
    (clipped - STAYABILITY_RAW_MIN_SECONDS) /
    (STAYABILITY_RAW_MAX_SECONDS - STAYABILITY_RAW_MIN_SECONDS)
  );
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNonNegativeFinite(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0;
}

function isPositiveFinite(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0;
}

function isUnitInterval(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0 && value <= 1;
}

function computed<T>(
  value: T,
  reason: string,
  formula?: string
): PaperMetric<T> {
  return { value, status: 'computed', reason, formula };
}

function inputGated<T = number>(
  reason: string,
  formula?: string
): PaperMetric<T> {
  return { value: null, status: 'input_gated', reason, formula };
}

function methodGated<T = number>(
  reason: string,
  formula?: string
): PaperMetric<T> {
  return { value: null, status: 'method_gated', reason, formula };
}

function invalidInput<T = number>(
  reason: string,
  formula?: string
): PaperMetric<T> {
  return { value: null, status: 'invalid_input', reason, formula };
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function allWeightsAvailable(
  weights: PaperWeightTriple
): weights is { first: number; second: number; third: number } {
  return (
    isFiniteNumber(weights.first) &&
    isFiniteNumber(weights.second) &&
    isFiniteNumber(weights.third)
  );
}

function weightsAreNonNegative(weights: {
  first: number | null;
  second: number | null;
  third: number | null;
}): boolean {
  if (weights.first !== null && (!isFiniteNumber(weights.first) || weights.first < 0)) return false;
  if (weights.second !== null && (!isFiniteNumber(weights.second) || weights.second < 0)) return false;
  if (weights.third !== null && (!isFiniteNumber(weights.third) || weights.third < 0)) return false;
  return true;
}

export function computePlaceImageability(
  inputs: PaperResearchInputs,
  config: PaperCalibrationConfig = NATURE_903_CWMC_REFERENCE
): {
  raw: PaperMetric;
  scaled: PaperMetric;
  iRawPaper: number | null;
  iCalibrationInput: number | null;
  normalizationProvenance: 'PAPER_EXPLICIT';
  paperStatus: 'PAPER_EXPLICIT';
  implementationStatus: 'RAW_LINEAR_COMBINATION';
  valueEnteringSigmoid: 'I_raw_paper';
  clippingApplied: boolean;
  ratioBoundingApplied: boolean;
} {
  const formulaRaw = 'I_raw = α1·(V_nat/V_built) + α2·GVI_eye + α3·GMI';
  const formulaScaled = 'I_i = 1 + 6 / [1 + exp(-κ_I·(I_raw - τ_I))]';

  const defaultMeta = {
    iRawPaper: null,
    iCalibrationInput: null,
    normalizationProvenance: 'PAPER_EXPLICIT' as const,
    paperStatus: 'PAPER_EXPLICIT' as const,
    implementationStatus: 'RAW_LINEAR_COMBINATION' as const,
    valueEnteringSigmoid: 'I_raw_paper' as const,
    clippingApplied: false,
    ratioBoundingApplied: false,
  };

  // Authoritative frozen engine computation path: receives vNat and vBuilt and performs
  // vNat / vBuilt inside the engine. Falls back to naturalBuiltRatio if vNat/vBuilt not provided.
  let authoritativeRatio: number | null = null;
  if (inputs.vNat !== undefined && inputs.vBuilt !== undefined) {
    if (inputs.vNat !== null && inputs.vBuilt !== null) {
      if (inputs.vBuilt > 0) {
        authoritativeRatio = inputs.vNat / inputs.vBuilt;
      } else {
        authoritativeRatio = null;
      }
    } else {
      authoritativeRatio = null;
    }
  } else {
    authoritativeRatio = inputs.naturalBuiltRatio;
  }

  if (authoritativeRatio === null) {
    return {
      ...defaultMeta,
      raw: inputGated('V_nat / V_built is unavailable.', formulaRaw),
      scaled: inputGated(
        'Place Imageability cannot be calculated without V_nat / V_built.',
        formulaScaled
      ),
    };
  }
  if (!isNonNegativeFinite(authoritativeRatio)) {
    return {
      ...defaultMeta,
      raw: invalidInput(
        'V_nat / V_built must be a finite non-negative ratio.',
        formulaRaw
      ),
      scaled: invalidInput('Invalid V_nat / V_built input.', formulaScaled),
    };
  }
  if (inputs.gviEye === null) {
    return {
      ...defaultMeta,
      raw: inputGated('GVI_eye is unavailable.', formulaRaw),
      scaled: inputGated('Place Imageability is gated by missing GVI_eye.', formulaScaled),
    };
  }
  if (!isUnitInterval(inputs.gviEye)) {
    return {
      ...defaultMeta,
      raw: invalidInput('GVI_eye must be normalized to [0,1].', formulaRaw),
      scaled: invalidInput('Invalid GVI_eye input.', formulaScaled),
    };
  }
  if (inputs.gmi === null) {
    return {
      ...defaultMeta,
      raw: inputGated(
        'GMI is unavailable because no approved Qwen green_softening measurement has entered the active paper inputs.',
        formulaRaw
      ),
      scaled: inputGated('Place Imageability is gated by missing GMI.', formulaScaled),
    };
  }
  if (!isUnitInterval(inputs.gmi)) {
    return {
      ...defaultMeta,
      raw: invalidInput('GMI must be normalized to [0,1].', formulaRaw),
      scaled: invalidInput('Invalid GMI input.', formulaScaled),
    };
  }
  if (!allWeightsAvailable(config.alpha)) {
    return {
      ...defaultMeta,
      raw: methodGated('Imageability α coefficients are not configured.', formulaRaw),
      scaled: methodGated('Place Imageability coefficients are unavailable.', formulaScaled),
    };
  }
  if (!weightsAreNonNegative(config.alpha)) {
    return {
      ...defaultMeta,
      raw: invalidInput('Imageability α coefficients must be non-negative.', formulaRaw),
      scaled: invalidInput('Invalid Imageability coefficient configuration.', formulaScaled),
    };
  }

  const raw =
    config.alpha.first * authoritativeRatio +
    config.alpha.second * inputs.gviEye +
    config.alpha.third * inputs.gmi;

  const scaled =
    1 + 6 * sigmoid(config.kappaI * (raw - config.tauI));

  return {
    raw: computed(raw, 'Imageability raw value computed deterministically from paper linear combination.', formulaRaw),
    scaled: computed(
      scaled,
      `Place Imageability mapped to 1–7 using ${config.calibrationMode} τ_I=${config.tauI}, κ_I=${config.kappaI} on raw paper linear combination.`,
      formulaScaled
    ),
    iRawPaper: raw,
    iCalibrationInput: raw,
    normalizationProvenance: 'PAPER_EXPLICIT',
    paperStatus: 'PAPER_EXPLICIT',
    implementationStatus: 'RAW_LINEAR_COMBINATION',
    valueEnteringSigmoid: 'I_raw_paper',
    clippingApplied: false,
    ratioBoundingApplied: false,
  };
}

/**
 * Place Identity (Y_i) — Nature 9.03 Final Formulation:
 * Y_raw = β1·V_sign + β2·(1 - SVF) + β3·GFAPI
 * Y_i   = 1 + 6·[Y_raw / (β1 + β2 + β3)]
 *
 * SFV is explicitly excluded from active Y_i and preserved only as supplementary validation.
 */
export function computePlaceIdentity(
  inputs: PaperResearchInputs,
  config: PaperCalibrationConfig = NATURE_903_CWMC_REFERENCE
): PaperMetric {
  const formula =
    'Y_raw = β1·V_sign + β2·(1−SVF) + β3·GFAPI, Y_i = 1 + 6·Y_raw / (β1+β2+β3)';

  if (inputs.vSign === null) return inputGated('V_sign is unavailable.', formula);
  if (!isUnitInterval(inputs.vSign)) return invalidInput('V_sign must be normalized to [0,1].', formula);

  if (inputs.svf === null) return inputGated('SVF / standardized canyon openness is unavailable.', formula);
  if (!isUnitInterval(inputs.svf)) return invalidInput('SVF must be normalized to [0,1].', formula);

  if (inputs.gfapi === null) return inputGated('GFAPI is unavailable.', formula);
  if (!isUnitInterval(inputs.gfapi)) return invalidInput('GFAPI must be normalized to [0,1].', formula);

  const b1 = config.identityWeights.first ?? 1.0;
  const b2 = config.identityWeights.second ?? 1.0;
  const b3 = config.identityWeights.third ?? 1.0;

  if (b1 < 0 || b2 < 0 || b3 < 0) {
    return invalidInput('Identity weights must be non-negative.', formula);
  }

  const denominator = b1 + b2 + b3;
  if (denominator <= 0) {
    return invalidInput('Identity weight denominator must be greater than zero.', formula);
  }

  const raw = b1 * inputs.vSign + b2 * (1 - inputs.svf) + b3 * inputs.gfapi;
  const normalizedIdentity = raw / denominator;
  const scaled = 1 + 6 * normalizedIdentity;

  return computed(
    scaled,
    'Place Identity computed using the Nature 9.03 Final formulation (V_sign, 1-SVF, GFAPI). SFV is excluded as supplementary provenance.',
    formula
  );
}

/**
 * Place Dependence (D_i) — Nature 9.03 Final Formulation:
 * D_raw = γ1·V_pave + γ2·IAS
 * D_i   = 1 + 6 / [1 + exp(-κ_D·(D_raw - τ_D))]
 * Evaluated directly in sigmoid with no normalization.
 * D_calibration_input is retained strictly as NON_ACTIVE LEGACY_IMPLEMENTATION_DIAGNOSTIC.
 */
export function computePlaceDependence(
  inputs: PaperResearchInputs,
  config: PaperCalibrationConfig = NATURE_903_CWMC_REFERENCE
): {
  raw: PaperMetric;
  scaled: PaperMetric;
  dRawPaper: number | null;
  dCalibrationInput: number | null;
  normalizationProvenance: 'LEGACY_IMPLEMENTATION_DIAGNOSTIC';
  paperStatus: 'PAPER_FORMULA_LOCKED';
  implementationStatus: 'RAW_LINEAR_COMBINATION';
  valueEnteringSigmoid: 'D_raw_paper';
  legacyClassification: 'LEGACY_IMPLEMENTATION_DIAGNOSTIC';
  legacyStatus: 'NON_ACTIVE';
  formulaStatus: 'NOT_PAPER_FORMULA';
} {
  const formulaRaw = 'D_raw = γ1·V_pave + γ2·IAS';
  const formulaScaled = 'D_i = 1 + 6 / [1 + exp(-κ_D·(D_raw - τ_D))]';

  const defaultMeta = {
    dRawPaper: null,
    dCalibrationInput: null,
    normalizationProvenance: 'LEGACY_IMPLEMENTATION_DIAGNOSTIC' as const,
    paperStatus: 'PAPER_FORMULA_LOCKED' as const,
    implementationStatus: 'RAW_LINEAR_COMBINATION' as const,
    valueEnteringSigmoid: 'D_raw_paper' as const,
    legacyClassification: 'LEGACY_IMPLEMENTATION_DIAGNOSTIC' as const,
    legacyStatus: 'NON_ACTIVE' as const,
    formulaStatus: 'NOT_PAPER_FORMULA' as const,
  };

  if (inputs.vPave === null) {
    return {
      ...defaultMeta,
      raw: inputGated('V_pave is unavailable.', formulaRaw),
      scaled: inputGated('Place Dependence is gated by missing V_pave.', formulaScaled),
    };
  }
  if (!isUnitInterval(inputs.vPave)) {
    return {
      ...defaultMeta,
      raw: invalidInput('V_pave must be normalized to [0,1].', formulaRaw),
      scaled: invalidInput('Invalid V_pave input.', formulaScaled),
    };
  }
  if (inputs.ias === null) {
    return {
      ...defaultMeta,
      raw: inputGated('IAS is unavailable.', formulaRaw),
      scaled: inputGated('Place Dependence is gated by missing IAS.', formulaScaled),
    };
  }
  if (!isUnitInterval(inputs.ias)) {
    return {
      ...defaultMeta,
      raw: invalidInput('IAS must be normalized to [0,1].', formulaRaw),
      scaled: invalidInput('Invalid IAS input.', formulaScaled),
    };
  }

  const g1 = config.gamma.first ?? 1.0;
  const g2 = config.gamma.second ?? 1.0;

  if (g1 < 0 || g2 < 0) {
    return {
      ...defaultMeta,
      raw: invalidInput('Dependence γ coefficients must be non-negative.', formulaRaw),
      scaled: invalidInput('Invalid Dependence coefficient configuration.', formulaScaled),
    };
  }

  // Active Place Dependence: D_raw enters sigmoid directly with no normalization
  const dRaw = g1 * inputs.vPave + g2 * inputs.ias;
  const scaled = 1 + 6 * sigmoid(config.kappaD * (dRaw - config.tauD));

  // Legacy diagnostic value only (NON_ACTIVE, NOT_PAPER_FORMULA)
  const legacyDenominator = g1 + g2;
  const legacyDCalibrationInput = legacyDenominator > 0 ? dRaw / legacyDenominator : null;

  return {
    raw: computed(
      dRaw,
      `Dependence paper composition: D_raw = ${g1}·V_pave + ${g2}·IAS = ${dRaw.toFixed(4)}. Evaluated directly in sigmoid with no active normalization.`,
      formulaRaw
    ),
    scaled: computed(
      scaled,
      `Place Dependence mapped to 1–7 using ${config.calibrationMode} τ_D=${config.tauD}, κ_D=${config.kappaD} directly on D_raw.`,
      formulaScaled
    ),
    dRawPaper: dRaw,
    dCalibrationInput: legacyDCalibrationInput,
    normalizationProvenance: 'LEGACY_IMPLEMENTATION_DIAGNOSTIC',
    paperStatus: 'PAPER_FORMULA_LOCKED',
    implementationStatus: 'RAW_LINEAR_COMBINATION',
    valueEnteringSigmoid: 'D_raw_paper',
    legacyClassification: 'LEGACY_IMPLEMENTATION_DIAGNOSTIC',
    legacyStatus: 'NON_ACTIVE',
    formulaStatus: 'NOT_PAPER_FORMULA',
  };
}

/**
 * Environmental TFP Canyon Factor (A_i)
 * RETIRED FROM ACTIVE CALCULATION · NATURE 9.02 COMPARATIVE CONTEXT ONLY.
 */
export function computeEnvironmentalTfp(
  inputs: PaperResearchInputs,
  config: PaperCalibrationConfig = NATURE_903_CWMC_REFERENCE
): PaperMetric {
  const formula = 'A_i = exp[-ψ·max(0, H_i/W_i − Ω_th)] (RETIRED FROM ACTIVE 9.03 SIM)';

  if (inputs.hwRatio === null) {
    return {
      value: null,
      status: 'method_gated',
      reason: 'RETIRED FROM ACTIVE CALCULATION · NATURE 9.02 COMPARATIVE CONTEXT ONLY (H/W unavailable)',
      formula,
    };
  }

  const penalty = Math.max(0, inputs.hwRatio - config.canyonThreshold);
  const a = Math.exp(-config.canyonPsi * penalty);

  return {
    value: a,
    status: 'method_gated',
    reason: 'RETIRED FROM ACTIVE CALCULATION · NATURE 9.02 COMPARATIVE CONTEXT ONLY',
    formula,
  };
}

export function computeSpaceSyntaxControls(
  inputs: PaperResearchInputs
): PaperMetric<SpaceSyntaxControls> {
  const formula =
    'GWR controls: β_Choice(s_i)·ln(Choice_i) + β_Int(s_i)·ln(Integration_i), R=800m';

  if (inputs.spaceSyntaxChoice === null || inputs.spaceSyntaxIntegration === null) {
    return {
      value: null,
      status: 'input_gated',
      substatus: 'LOCAL_GWR_NOT_AVAILABLE',
      reason:
        'Space Syntax Choice and Integration are network GWR control variables (LOCAL_GWR_NOT_AVAILABLE; not required for paper global reference M_i).',
      formula,
    };
  }

  if (!isPositiveFinite(inputs.spaceSyntaxChoice)) {
    return invalidInput<SpaceSyntaxControls>(
      'Choice_i must be a positive finite value because the GWR specification uses ln(Choice_i).',
      formula
    );
  }
  if (!isPositiveFinite(inputs.spaceSyntaxIntegration)) {
    return invalidInput<SpaceSyntaxControls>(
      'Integration_i must be a positive finite value because the GWR specification uses ln(Integration_i).',
      formula
    );
  }

  return computed<SpaceSyntaxControls>(
    {
      choice: inputs.spaceSyntaxChoice,
      integration: inputs.spaceSyntaxIntegration,
      radiusMeters: 800,
    },
    'Space Syntax segment controls supplied for the 800 m walking-radius GWR model.',
    formula
  );
}

/**
 * Local Elasticities (a_i, b_i, c_i)
 * Priority Hierarchy:
 * 1. LOCAL_GWR_CALIBRATED: If valid local GWR coefficients β_I, β_Y, β_D are supplied.
 * 2. SOURCE_BACKED_TYPOLOGY_REFERENCE: If source-backed research typology metadata is provided.
 * 3. PAPER_GLOBAL_REFERENCE: Default Nature 9.03 manuscript reference elasticities (a=0.40, b=0.20, c=0.40).
 */
export function computeLocalElasticities(
  inputs?: Partial<PaperResearchInputs> | null,
  _controls?: PaperMetric<SpaceSyntaxControls>
): PaperMetric<LocalElasticities> {
  const formula =
    'a_i,b_i,c_i = |β_I,β_Y,β_D| / (|β_I|+|β_Y|+|β_D|) [LOCAL_GWR] OR paper reference profile [GLOBAL/TYPOLOGY]';

  const betas = inputs?.gwrLocalBetas;

  // PRIORITY 1: LOCAL_GWR_CALIBRATED
  // If valid local GWR coefficients β_I, β_Y, β_D are supplied:
  // denominator = |β_I| + |β_Y| + |β_D|
  // a_i = |β_I| / denominator, b_i = |β_Y| / denominator, c_i = |β_D| / denominator
  // elasticity_source = LOCAL_GWR_CALIBRATED
  // Do not include β0, βChoice, or βIntegration in denominator.
  if (
    betas &&
    isFiniteNumber(betas.betaImageability) &&
    isFiniteNumber(betas.betaIdentity) &&
    isFiniteNumber(betas.betaDependence)
  ) {
    const absI = Math.abs(betas.betaImageability);
    const absY = Math.abs(betas.betaIdentity);
    const absD = Math.abs(betas.betaDependence);
    const denominator = absI + absY + absD;

    if (denominator > 0) {
      const a = absI / denominator;
      const b = absY / denominator;
      const c = absD / denominator;

      return {
        value: {
          a,
          b,
          c,
          sum: a + b + c,
          source: 'LOCAL_GWR_CALIBRATED',
          calibrationStatus: 'LOCAL_GWR_CALIBRATED',
          methodNote:
            'Local elasticities normalized from Space Syntax-controlled GWR (|β_I|, |β_Y|, |β_D|). β0, β_Choice, and β_Int recorded in provenance.',
        },
        status: 'computed',
        substatus: 'LOCAL_GWR_CALIBRATED',
        reason:
          'Local elasticities normalized from Space Syntax-controlled GWR (|β_I|, |β_Y|, |β_D|). β0, β_Choice, and β_Int excluded from denominator.',
        formula,
      };
    }
  }

  // PRIORITY 2: SOURCE_BACKED_TYPOLOGY_REFERENCE
  // Activates ONLY when typology classification comes from a legitimate source-backed research field.
  // Not inferred solely from image. Cannot override LOCAL_GWR_CALIBRATED.
  if (inputs?.sourceBackedTypology) {
    const typologyKey = inputs.sourceBackedTypology;
    let typologyProfile: { a: number; b: number; c: number } | null = null;
    if (typologyKey === 'avenue_canyon') {
      typologyProfile = { a: 0.10, b: 0.30, c: 0.60 };
    } else if (typologyKey === 'covenant_midblock') {
      typologyProfile = { a: 0.50, b: 0.30, c: 0.20 };
    } else if (typologyKey === 'porous_pops') {
      typologyProfile = { a: 0.45, b: 0.15, c: 0.40 };
    }

    if (typologyProfile) {
      return {
        value: {
          a: typologyProfile.a,
          b: typologyProfile.b,
          c: typologyProfile.c,
          sum: 1.0,
          source: 'SOURCE_BACKED_TYPOLOGY_REFERENCE',
          calibrationStatus: 'SOURCE_BACKED_TYPOLOGY_REFERENCE',
          methodNote: `Nature 9.03 paper typology profile applied from source-backed research field (${typologyKey}).`,
          typologyKey,
        },
        status: 'computed',
        substatus: 'SOURCE_BACKED_TYPOLOGY_REFERENCE',
        reason: `Nature 9.03 typology reference profile applied based on source-backed research classification: ${typologyKey}.`,
        formula,
      };
    }
  }

  // PRIORITY 3: PAPER_GLOBAL_REFERENCE
  // If local GWR β values are unavailable:
  // a_i = 0.40, b_i = 0.20, c_i = 0.40
  // elasticity_source = PAPER_GLOBAL_REFERENCE
  // calibration_status = REFERENCE_NOT_LOCAL_GWR
  // method_note = "Nature 9.03 explicitly permits global constants a=0.40, b=0.20, c=0.40 when node-specific elasticities are not available."
  return {
    value: {
      a: 0.40,
      b: 0.20,
      c: 0.40,
      sum: 1.0,
      source: 'PAPER_GLOBAL_REFERENCE',
      calibrationStatus: 'REFERENCE_NOT_LOCAL_GWR',
      methodNote:
        'Nature 9.03 explicitly permits global constants a=0.40, b=0.20, c=0.40 when node-specific elasticities are not available.',
    },
    status: 'computed',
    substatus: 'PAPER_GLOBAL_REFERENCE',
    reason:
      'Nature 9.03 explicitly permits global constants a=0.40, b=0.20, c=0.40 when node-specific elasticities are not available.',
    formula,
  };
}

/**
 * Street Interface Matrix (M_i) — Nature 9.03 Final (No-Omega) Formulation:
 * M_i = I_i^{a_i} × Y_i^{b_i} × D_i^{c_i}
 * Environmental TFP (A_i) is strictly retired from active calculation.
 */
export function computeSIM(
  imageability: PaperMetric,
  identity: PaperMetric,
  dependence: PaperMetric,
  elasticitiesOrTfp: PaperMetric<any>,
  maybeElasticities?: PaperMetric<LocalElasticities>
): PaperMetric {
  const formula = 'M_i = I_i^a_i × Y_i^b_i × D_i^c_i';

  // Support 4-arg or legacy 5-arg signature seamlessly
  const elasticities = (
    maybeElasticities !== undefined ? maybeElasticities : elasticitiesOrTfp
  ) as PaperMetric<LocalElasticities>;

  const dependencies: Array<[string, PaperMetric<any>]> = [
    ['Place Imageability', imageability],
    ['Place Identity', identity],
    ['Place Dependence', dependence],
    ['local elasticities', elasticities],
  ];

  for (const [label, metric] of dependencies) {
    if (metric.status !== 'computed' || metric.value === null) {
      return inputGated(`SIM blocked by ${label}: ${metric.reason}`, formula);
    }
  }

  if (
    (imageability.value as number) < 1 ||
    (imageability.value as number) > 7 ||
    (identity.value as number) < 1 ||
    (identity.value as number) > 7 ||
    (dependence.value as number) < 1 ||
    (dependence.value as number) > 7
  ) {
    return invalidInput('I_i, Y_i and D_i must lie within the 1–7 scale.', formula);
  }

  const { a, b, c, source } = elasticities.value as LocalElasticities;
  const elasticitySum = a + b + c;
  if (Math.abs(elasticitySum - 1) > 1e-4) {
    return invalidInput(
      `Local elasticities violate a_i+b_i+c_i=1: ${elasticitySum}.`,
      formula
    );
  }

  const m =
    Math.pow(imageability.value as number, a) *
    Math.pow(identity.value as number, b) *
    Math.pow(dependence.value as number, c);

  let substatus = 'COMPUTED_LOCAL_GWR';
  let reason =
    'Street Interface Matrix computed using Nature 9.03 Final (No-Omega) Cobb–Douglas formulation with local GWR-calibrated elasticities: M_i = I_i^a_i × Y_i^b_i × D_i^c_i.';

  if (source === 'PAPER_GLOBAL_REFERENCE') {
    substatus = 'COMPUTED_REFERENCE_ELASTICITY';
    reason =
      'Street Interface Matrix computed using Nature 9.03 Final (No-Omega) global reference elasticities (a=0.40, b=0.20, c=0.40): M_i = I_i^0.40 × Y_i^0.20 × D_i^0.40.';
  } else if (source === 'SOURCE_BACKED_TYPOLOGY_REFERENCE') {
    substatus = 'COMPUTED_TYPOLOGY_REFERENCE';
    reason =
      'Street Interface Matrix computed using Nature 9.03 Final (No-Omega) source-backed typology reference elasticities: M_i = I_i^a_i × Y_i^b_i × D_i^c_i.';
  }

  return {
    value: m,
    status: 'computed',
    substatus,
    reason,
    formula,
  };
}

export function computeStayabilityFactor(
  sim: PaperMetric,
  config: PaperCalibrationConfig = NATURE_903_CWMC_REFERENCE
): PaperMetric {
  const formula = 'F_i = 1 + λ·M_i';

  if (sim.status !== 'computed' || sim.value === null) {
    return {
      value: null,
      status: 'input_gated',
      substatus: 'GATED_MISSING_SIM',
      reason: `F_i blocked because M_i is unavailable: ${sim.reason}`,
      formula,
    };
  }

  if (config.lambda === null) {
    return {
      value: null,
      status: 'method_gated',
      substatus: 'GATED_MISSING_LAMBDA',
      reason:
        'Nature 9.03 defines λ symbolically as the calibration parameter in F_i = 1 + λM_i but does not provide a validated implementation value (UNRESOLVED_BEHAVIORAL_CALIBRATION).',
      formula,
    };
  }

  if (!isNonNegativeFinite(config.lambda)) {
    return {
      value: null,
      status: 'invalid_input',
      substatus: 'INVALID_LAMBDA',
      reason: 'λ must be a finite non-negative value.',
      formula,
    };
  }

  return {
    value: 1 + config.lambda * sim.value,
    status: 'computed',
    substatus: 'COMPUTED_STAYABILITY_FACTOR',
    reason: 'Stayability Amplification Factor computed deterministically.',
    formula,
  };
}

export function computeEffectiveStayability(
  inputs: PaperResearchInputs,
  stayabilityFactor: PaperMetric
): PaperMetric {
  const formula = 't_effective = F_i · t_base';

  if (stayabilityFactor.status !== 'computed' || stayabilityFactor.value === null) {
    return {
      value: null,
      status: 'input_gated',
      substatus:
        stayabilityFactor.substatus === 'GATED_MISSING_LAMBDA'
          ? 'GATED_MISSING_LAMBDA'
          : 'GATED_MISSING_STAYABILITY_FACTOR',
      reason: `t_effective blocked because F_i is unavailable: ${stayabilityFactor.reason}`,
      formula,
    };
  }

  if (inputs.tBase === null) {
    return {
      value: null,
      status: 'input_gated',
      substatus: 'GATED_MISSING_BEHAVIOR',
      reason: 'Empirical t_base is unavailable (GATED_MISSING_BEHAVIOR).',
      formula,
    };
  }

  if (!isNonNegativeFinite(inputs.tBase)) {
    return {
      value: null,
      status: 'invalid_input',
      substatus: 'INVALID_T_BASE',
      reason: 't_base must be finite and non-negative.',
      formula,
    };
  }

  return {
    value: stayabilityFactor.value * inputs.tBase,
    status: 'computed',
    substatus: 'COMPUTED_EFFECTIVE_STAYABILITY',
    reason: 'Effective stayability computed from F_i and baseline behavior.',
    formula,
  };
}

export function computePaperSynthesis(
  inputs: PaperResearchInputs,
  config: PaperCalibrationConfig = NATURE_903_CWMC_REFERENCE
): PaperSynthesisResult {
  const imageability = computePlaceImageability(inputs, config);
  const identity = computePlaceIdentity(inputs, config);
  const dependence = computePlaceDependence(inputs, config);
  const environmentalTfp = computeEnvironmentalTfp(inputs, config);
  const spaceSyntaxControls = computeSpaceSyntaxControls(inputs);
  const localElasticities = computeLocalElasticities(inputs, spaceSyntaxControls);

  const sim = computeSIM(
    imageability.scaled,
    identity,
    dependence.scaled,
    localElasticities
  );

  const stayabilityFactor = computeStayabilityFactor(sim, config);
  const tEffective = computeEffectiveStayability(inputs, stayabilityFactor);

  const gates: string[] = [];
  const collectGate = (label: string, metric: PaperMetric<any>) => {
    if (metric.status !== 'computed') gates.push(`${label}: ${metric.reason}`);
  };

  collectGate('I_raw', imageability.raw);
  collectGate('I_i', imageability.scaled);
  collectGate('Y_i', identity);
  collectGate('D_raw', dependence.raw);
  collectGate('D_i', dependence.scaled);
  // environmentalTfp is NOT collected in active calculation gates
  collectGate('a_i,b_i,c_i', localElasticities);
  collectGate('M_i', sim);
  collectGate('F_i', stayabilityFactor);
  collectGate('t_effective', tEffective);

  const elasticitySource =
    localElasticities.value?.source ?? 'PAPER_GLOBAL_REFERENCE';
  const calibrationStatus =
    localElasticities.value?.calibrationStatus ?? 'REFERENCE_NOT_LOCAL_GWR';

  return {
    engineVersion: PAPER_ALIGNED_SIM_ENGINE_VERSION,
    calibration: config,
    imageabilityRaw: imageability.raw,
    placeImageability: imageability.scaled,
    placeIdentity: identity,
    dependenceRaw: dependence.raw,
    placeDependence: dependence.scaled,
    environmentalTfp,
    spaceSyntaxControls,
    localElasticities,
    sim,
    stayabilityFactor,
    tEffective,
    gates,

    elasticitySource,
    calibrationStatus,

    dRawPaper: dependence.dRawPaper,
    dCalibrationInput: dependence.dCalibrationInput,
    dNormalizationProvenance: dependence.normalizationProvenance,
    dPaperStatus: dependence.paperStatus,
    dImplementationStatus: dependence.implementationStatus,
    dValueEnteringSigmoid: dependence.valueEnteringSigmoid,
    dLegacyClassification: dependence.legacyClassification,
    dLegacyStatus: dependence.legacyStatus,
    dFormulaStatus: dependence.formulaStatus,

    iRawPaper: imageability.iRawPaper,
    iCalibrationInput: imageability.iCalibrationInput,
    iNormalizationProvenance: imageability.normalizationProvenance,
    iPaperStatus: imageability.paperStatus,
    iImplementationStatus: imageability.implementationStatus,
    iValueEnteringSigmoid: imageability.valueEnteringSigmoid,
  };
}
