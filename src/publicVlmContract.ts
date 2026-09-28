export const PUBLIC_VLM_CONTRACT_VERSION = 'public_vlm_contract_v1_1';
export const PUBLIC_VLM_STAGE = 'P3_1_QWEN_REPRO_LOCK';
export const PUBLIC_VLM_ROUTE = '/api/public/vlm/analyze';
export const PUBLIC_VLM_STATUS_ROUTE = '/api/public/vlm/status';

export const PUBLIC_VLM_SOURCE_REPOSITORY = 'mikellu12/murrayhill-v12';
export const PUBLIC_VLM_SOURCE_COMMIT = 'f1d204df09da572db3417999f04aaf195ebd6ca6';
export const PUBLIC_VLM_SOURCE_BLOBS = {
  simVlmRun: '5b95c4e994e29fe080a18ce4966ed049cd91e474',
  simFields: '416423f0ffa279d3483ae8fd16cf5278c3f49bb4',
  simScale: '5072c85e22793e44a78811025e7327d7eef9eb50',
  simReadout: 'd446e44d5291ca78beaaae168e5c786eee8f7bf2',
} as const;
export const PUBLIC_VLM_MODEL_ID = 'Qwen/Qwen2-VL-7B-Instruct';
export const PUBLIC_VLM_MODEL_REVISION = 'eed13092ef92e448dd6875b2a00151bd3f7db0ac';
export const PUBLIC_VLM_PROCESSOR_POLICY = 'SLOW_USE_FAST_FALSE';
export const PUBLIC_VLM_RUNTIME_LOCK_ID = 'P3_1_QWEN_REPRO_LOCK_2026_09_09';
export const PUBLIC_VLM_RUNTIME_VERSIONS = {
  torch: '2.6.0+cu124',
  torchvision: '0.21.0+cu124',
  transformers: '4.57.3',
  accelerate: '1.14.0',
  bitsandbytes: '0.48.2',
} as const;
export const PUBLIC_VLM_MAX_PIXELS = 1024 * 28 * 28;
export const PUBLIC_VLM_MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const PUBLIC_VLM_READOUT = 'PRUNE_ONCE_INTERPOLATED_MEDIAN';
export const PUBLIC_VLM_CAPTURE_PROTOCOL = 'PUBLIC_SINGLE_PHOTO_UNCALIBRATED';
export const PUBLIC_VLM_MAST_POLICY = 'DISABLED_PUBLIC_UPLOAD';

// Open-text VLM commentary is a separate, independently pinned instrument.
// It is generated from the image only and is never an input to I/Y/D/M.
export const PUBLIC_VLM_COMMENTARY_SOURCE_REPOSITORY = 'mikellu12/murrayhill-v12';
export const PUBLIC_VLM_COMMENTARY_SOURCE_COMMIT = '550c0567d709c7b870eda30b34f0c2a9b4e84c66';
export const PUBLIC_VLM_COMMENTARY_SOURCE_PATH = 'tools/sim_vlm_describe.py';
export const PUBLIC_VLM_COMMENTARY_SOURCE_BLOB = '286d4731cd817fb2cd91fc77928fc6ebaf224e8a';
export const PUBLIC_VLM_COMMENTARY_PROMPT_ID = 'scene_open_v1';
export const PUBLIC_VLM_COMMENTARY_QUESTION = 'What is it like to walk down this street?';
export const PUBLIC_VLM_COMMENTARY_ROLE = 'ILLUSTRATIVE_NOT_VALIDATION';
export const PUBLIC_VLM_COMMENTARY_SCORE_DEPENDENCY = 'NONE';
export const PUBLIC_VLM_COMMENTARY_DECODING = 'GREEDY_DO_SAMPLE_FALSE';
export const PUBLIC_VLM_COMMENTARY_MAX_NEW_TOKENS = 110;

export const PUBLIC_VLM_FIELD_IDS = [
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

export type PublicVlmFieldId = (typeof PUBLIC_VLM_FIELD_IDS)[number];

export const PUBLIC_VLM_MANUSCRIPT_TERMS: Record<PublicVlmFieldId, string> = {
  vertical_greenery: 'V_nat',
  vertical_hardscape: 'V_built',
  green_eye_level: 'GVI_eye',
  sky_openness: 'SVF',
  walkable_ground: 'V_pave',
  green_softening: 'GMI',
  signage_detail: 'V_sign',
  facade_variation: 'SFV',
  ground_floor_activity: 'GFAPI',
  resting_affordance: 'IAS',
};

export const PUBLIC_VLM_ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;
export type PublicVlmAcceptedMimeType = (typeof PUBLIC_VLM_ACCEPTED_MIME_TYPES)[number];

export interface PublicVlmAnalyzeRequest {
  requestId: string;
  imageBase64: string;
  imageMimeType: PublicVlmAcceptedMimeType;
  imageFilename?: string;
}

export interface PublicVlmFieldResult {
  fieldId: PublicVlmFieldId;
  manuscriptTerm: string;
  surveyRoundEv: number;
  expectedValue: number;
  argmax: number;
  probabilities: [number, number, number, number, number, number, number];
  readoutMedian: number;
  normalized01: number;
}

export interface PublicVlmCommentary {
  status: 'ready' | 'unavailable';
  scene: string | null;
  promptId: typeof PUBLIC_VLM_COMMENTARY_PROMPT_ID;
  question: typeof PUBLIC_VLM_COMMENTARY_QUESTION;
  role: typeof PUBLIC_VLM_COMMENTARY_ROLE;
  scoreDependency: typeof PUBLIC_VLM_COMMENTARY_SCORE_DEPENDENCY;
  decoding: typeof PUBLIC_VLM_COMMENTARY_DECODING;
  maxNewTokens: typeof PUBLIC_VLM_COMMENTARY_MAX_NEW_TOKENS;
  source: {
    repository: typeof PUBLIC_VLM_COMMENTARY_SOURCE_REPOSITORY;
    commit: typeof PUBLIC_VLM_COMMENTARY_SOURCE_COMMIT;
    path: typeof PUBLIC_VLM_COMMENTARY_SOURCE_PATH;
    blob: typeof PUBLIC_VLM_COMMENTARY_SOURCE_BLOB;
  };
  errorCode?: 'COMMENTARY_GENERATION_FAILED';
}

export interface PublicVlmAnalyzeSuccess {
  success: true;
  requestId: string;
  stage: 'VLM_COMPLETE';
  fields: PublicVlmFieldResult[];
  /** Optional during rolling worker upgrades; new P3.1 workers always return it. */
  commentary?: PublicVlmCommentary;
  instrument: {
    modelId: typeof PUBLIC_VLM_MODEL_ID;
    modelRevision: typeof PUBLIC_VLM_MODEL_REVISION;
    processorPolicy: typeof PUBLIC_VLM_PROCESSOR_POLICY;
    processorClass: string;
    runtimeLockId: typeof PUBLIC_VLM_RUNTIME_LOCK_ID;
    fieldCount: 10;
    anchorsPerField: 7;
    readout: typeof PUBLIC_VLM_READOUT;
    maxPixels: typeof PUBLIC_VLM_MAX_PIXELS;
    captureProtocol: typeof PUBLIC_VLM_CAPTURE_PROTOCOL;
    mastPolicy: typeof PUBLIC_VLM_MAST_POLICY;
    promptPlace: null;
  };
  provenance: {
    repository: typeof PUBLIC_VLM_SOURCE_REPOSITORY;
    commit: typeof PUBLIC_VLM_SOURCE_COMMIT;
    sourceBlobs: typeof PUBLIC_VLM_SOURCE_BLOBS;
    contractVersion: typeof PUBLIC_VLM_CONTRACT_VERSION;
    runtimeLockId: typeof PUBLIC_VLM_RUNTIME_LOCK_ID;
    runtimeVersions: typeof PUBLIC_VLM_RUNTIME_VERSIONS;
    runtimeService?: string | null;
  };
}

export type PublicVlmFailureCode =
  | 'INVALID_VLM_REQUEST'
  | 'IMAGE_TOO_LARGE'
  | 'UNSUPPORTED_IMAGE_TYPE'
  | 'VLM_INFERENCE_NOT_CONNECTED_P3'
  | 'VLM_SERVICE_UNAVAILABLE'
  | 'VLM_SERVICE_TIMEOUT'
  | 'VLM_SERVICE_CONTRACT_MISMATCH'
  | 'VLM_RUNTIME_ERROR';

export interface PublicVlmAnalyzeFailure {
  success: false;
  requestId?: string;
  stage: 'VLM_NOT_RUN' | 'VLM_FAILED';
  code: PublicVlmFailureCode;
  message: string;
  contractVersion: typeof PUBLIC_VLM_CONTRACT_VERSION;
}

export interface PublicVlmRuntimeStatus {
  configured: boolean;
  reachable: boolean;
  ready: boolean;
  detail: string;
  modelRevision?: string | null;
  processorPolicy?: string | null;
  runtimeLockId?: string | null;
  runtimeVersions?: Record<string, string | null> | null;
  runtimeLockOk?: boolean | null;
}

export interface PublicVlmStatusResponse {
  success: true;
  stage: typeof PUBLIC_VLM_STAGE;
  contractVersion: typeof PUBLIC_VLM_CONTRACT_VERSION;
  analyzeRoute: typeof PUBLIC_VLM_ROUTE;
  inferenceConnected: boolean;
  providerMode: 'EXTERNAL_GPU_SERVICE';
  acceptedMimeTypes: readonly PublicVlmAcceptedMimeType[];
  maxImageBytes: number;
  expectedOutput: {
    fieldCount: 10;
    fields: readonly PublicVlmFieldId[];
    probabilitiesPerField: 7;
    readout: typeof PUBLIC_VLM_READOUT;
  };
  runtime: PublicVlmRuntimeStatus;
  provenance: {
    repository: typeof PUBLIC_VLM_SOURCE_REPOSITORY;
    commit: typeof PUBLIC_VLM_SOURCE_COMMIT;
    sourceBlobs: typeof PUBLIC_VLM_SOURCE_BLOBS;
    contractVersion: typeof PUBLIC_VLM_CONTRACT_VERSION;
    runtimeLockId: typeof PUBLIC_VLM_RUNTIME_LOCK_ID;
    runtimeVersions: typeof PUBLIC_VLM_RUNTIME_VERSIONS;
    runtimeService?: string | null;
  };
}

export type PublicVlmAnalyzeResponse = PublicVlmAnalyzeSuccess | PublicVlmAnalyzeFailure;
