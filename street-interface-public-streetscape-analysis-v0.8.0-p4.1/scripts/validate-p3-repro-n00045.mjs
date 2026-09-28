import {
  PUBLIC_VLM_CAPTURE_PROTOCOL,
  PUBLIC_VLM_CONTRACT_VERSION,
  PUBLIC_VLM_FIELD_IDS,
  PUBLIC_VLM_MANUSCRIPT_TERMS,
  PUBLIC_VLM_MAST_POLICY,
  PUBLIC_VLM_MAX_PIXELS,
  PUBLIC_VLM_MODEL_ID,
  PUBLIC_VLM_MODEL_REVISION,
  PUBLIC_VLM_PROCESSOR_POLICY,
  PUBLIC_VLM_READOUT,
  PUBLIC_VLM_RUNTIME_LOCK_ID,
  PUBLIC_VLM_RUNTIME_VERSIONS,
  PUBLIC_VLM_SOURCE_BLOBS,
  PUBLIC_VLM_SOURCE_COMMIT,
  PUBLIC_VLM_SOURCE_REPOSITORY,
} from '../src/publicVlmContract';
import { mapNormalizedInputs } from '../server/publicSimGateway';
import { isPublicVlmAnalyzeSuccess } from '../server/publicVlmValidation';
import { computePaperSynthesis, NATURE_903_CWMC_REFERENCE } from '../src/utils/simComputationEngine';

const medians = {
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

const vlm = {
  success: true,
  requestId: 'golden_n00045',
  stage: 'VLM_COMPLETE',
  fields: PUBLIC_VLM_FIELD_IDS.map((fieldId) => {
    const readoutMedian = medians[fieldId];
    return {
      fieldId,
      manuscriptTerm: PUBLIC_VLM_MANUSCRIPT_TERMS[fieldId],
      surveyRoundEv: readoutMedian,
      expectedValue: readoutMedian,
      argmax: Math.max(1, Math.min(7, Math.round(readoutMedian))),
      probabilities: [1, 0, 0, 0, 0, 0, 0],
      readoutMedian,
      normalized01: (readoutMedian - 1) / 6,
    };
  }),
  instrument: {
    modelId: PUBLIC_VLM_MODEL_ID,
    modelRevision: PUBLIC_VLM_MODEL_REVISION,
    processorPolicy: PUBLIC_VLM_PROCESSOR_POLICY,
    processorClass: 'Qwen2VLImageProcessor',
    runtimeLockId: PUBLIC_VLM_RUNTIME_LOCK_ID,
    fieldCount: 10,
    anchorsPerField: 7,
    readout: PUBLIC_VLM_READOUT,
    maxPixels: PUBLIC_VLM_MAX_PIXELS,
    captureProtocol: PUBLIC_VLM_CAPTURE_PROTOCOL,
    mastPolicy: PUBLIC_VLM_MAST_POLICY,
    promptPlace: null,
  },
  provenance: {
    repository: PUBLIC_VLM_SOURCE_REPOSITORY,
    commit: PUBLIC_VLM_SOURCE_COMMIT,
    sourceBlobs: PUBLIC_VLM_SOURCE_BLOBS,
    contractVersion: PUBLIC_VLM_CONTRACT_VERSION,
    runtimeLockId: PUBLIC_VLM_RUNTIME_LOCK_ID,
    runtimeVersions: PUBLIC_VLM_RUNTIME_VERSIONS,
    runtimeService: 'GOLDEN_TEST',
  },
};

if (!isPublicVlmAnalyzeSuccess(vlm)) {
  console.error('P3.1 -> P4 canonical VLM validator: FAIL');
  process.exit(1);
}
console.log('P3.1 -> P4 canonical VLM validator: PASS');

const n = mapNormalizedInputs(vlm);
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
  imageabilityRaw: result.imageabilityRaw.value,
  imageability: result.placeImageability.value,
  identity: result.placeIdentity.value,
  dependenceRaw: result.dependenceRaw.value,
  dependence: result.placeDependence.value,
  score: result.sim.value,
};

let pass = true;
for (const key of Object.keys(expected)) {
  const delta = Math.abs(actual[key] - expected[key]);
  const ok = delta <= 1e-12;
  pass &&= ok;
  console.log(`${key.padEnd(18)} actual=${actual[key].toPrecision(16)} expected=${expected[key].toPrecision(16)} delta=${delta.toExponential(3)} ${ok ? 'PASS' : 'FAIL'}`);
}

const e = result.localElasticities.value;
const elasticityOk = e.a === 0.4 && e.b === 0.2 && e.c === 0.4 && e.source === 'PAPER_GLOBAL_REFERENCE' && e.calibrationStatus === 'REFERENCE_NOT_LOCAL_GWR';
pass &&= elasticityOk;
console.log(`elasticities       a=${e.a} b=${e.b} c=${e.c} source=${e.source} ${elasticityOk ? 'PASS' : 'FAIL'}`);
console.log(`P4 GOLDEN RESULT: ${pass ? 'PASS' : 'FAIL'}`);
process.exit(pass ? 0 : 1);
