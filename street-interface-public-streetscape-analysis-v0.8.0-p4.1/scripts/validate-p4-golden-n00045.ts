import { PUBLIC_VLM_FIELD_IDS } from '../src/publicVlmContract';
import { mapNormalizedInputs } from '../server/publicSimGateway';
import {
  RESEARCH_GOLDEN_VALIDATION_PROFILE,
  PUBLIC_VALIDATION_CONTRACT_VERSION,
} from '../src/publicValidationContract';
import { computePaperSynthesis, NATURE_903_CWMC_REFERENCE } from '../src/utils/simComputationEngine';

console.log(`P4.1 VALIDATION CLASS: ${RESEARCH_GOLDEN_VALIDATION_PROFILE.validationClass}`);
console.log(`comparisonMode: ${RESEARCH_GOLDEN_VALIDATION_PROFILE.comparisonMode}`);
console.log(`inputProtocol: ${RESEARCH_GOLDEN_VALIDATION_PROFILE.inputProtocol}`);
console.log(`validationContract: ${PUBLIC_VALIDATION_CONTRACT_VERSION}`);
console.log('This test uses canonical historical Qwen medians. It does not run a public uploaded image through live Qwen.\n');

const medians: Record<(typeof PUBLIC_VLM_FIELD_IDS)[number], number> = {
  vertical_greenery: 1.2434574547629729,
  vertical_hardscape: 5.275995063252083,
  green_eye_level: 2.210586356376911,
  sky_openness: 5.144777662874871,
  walkable_ground: 5.17148182665424,
  green_softening: 2.2959057071960296,
  signage_detail: 4.365168539325842,
  facade_variation: 5.868217960710945,
  ground_floor_activity: 5.605327768229806,
  resting_affordance: 1.3259604190919674,
};

// Minimal research-golden field evidence only. Deliberately no public-photo
// captureProtocol or live-worker provenance is attached to this fixture.
const goldenFieldEvidence = {
  fields: PUBLIC_VLM_FIELD_IDS.map((fieldId) => ({
    fieldId,
    normalized01: (medians[fieldId] - 1) / 6,
  })),
};

const n = mapNormalizedInputs(goldenFieldEvidence);
const result = computePaperSynthesis({
  vNat: n.vNat,
  vBuilt: n.vBuilt,
  naturalBuiltRatio: null,
  gviEye: n.gviEye,
  gmi: n.gmi,
  vSign: n.vSign,
  svf: n.svf,
  sfv: n.sfv,
  vPave: n.vPave,
  ias: n.ias,
  gfapi: n.gfapi,
  dCalibrationInput: null,
  hwRatio: null,
  spaceSyntaxChoice: null,
  spaceSyntaxIntegration: null,
  gwrLocalBetas: null,
  sourceBackedTypology: null,
  tBase: null,
}, NATURE_903_CWMC_REFERENCE);

const expected = {
  imageabilityRaw: 0.4746845369069087,
  imageability: 6.785792291750779,
  identity: 4.275239548226926,
  dependenceRaw: 0.7495737076243679,
  dependence: 6.861271847132807,
  score: 6.214327916148292,
};
const actual = {
  imageabilityRaw: result.imageabilityRaw.value!,
  imageability: result.placeImageability.value!,
  identity: result.placeIdentity.value!,
  dependenceRaw: result.dependenceRaw.value!,
  dependence: result.placeDependence.value!,
  score: result.sim.value!,
};

let pass = true;
for (const key of Object.keys(expected) as Array<keyof typeof expected>) {
  const delta = Math.abs(actual[key] - expected[key]);
  const ok = delta <= 1e-12;
  pass &&= ok;
  console.log(`${key.padEnd(18)} actual=${actual[key].toPrecision(16)} expected=${expected[key].toPrecision(16)} delta=${delta.toExponential(3)} ${ok ? 'PASS' : 'FAIL'}`);
}

const e = result.localElasticities.value!;
const elasticityOk = e.a === 0.4 && e.b === 0.2 && e.c === 0.4 && e.source === 'PAPER_GLOBAL_REFERENCE' && e.calibrationStatus === 'REFERENCE_NOT_LOCAL_GWR';
pass &&= elasticityOk;
console.log(`elasticities       a=${e.a} b=${e.b} c=${e.c} source=${e.source} ${elasticityOk ? 'PASS' : 'FAIL'}`);
console.log(`P4.1 RESEARCH GOLDEN RESULT: ${pass ? 'PASS' : 'FAIL'}`);
process.exit(pass ? 0 : 1);
