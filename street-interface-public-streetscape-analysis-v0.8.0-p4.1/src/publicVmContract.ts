import { FROZEN_TAXONOMY_VERSION } from './research/v33SegmentationTaxonomy';

export const PUBLIC_VM_CONTRACT_VERSION = 'public_vm_contract_v1';
export const PUBLIC_VM_STAGE = 'P2B_VM_GPU_INFERENCE';
export const PUBLIC_VM_ROUTE = '/api/public/vm/analyze';
export const PUBLIC_VM_STATUS_ROUTE = '/api/public/vm/status';
export const PUBLIC_VM_SOURCE_REPOSITORY =
  'guanyupan2002-png/Street-View-Semantic-Segmentation';
export const PUBLIC_VM_SOURCE_COMMIT =
  'ba4a14731074e744d798956d0f38493c19c773cd';
export const PUBLIC_VM_SOURCE_BLOB =
  '804dd7e287becd464c8716626a69d7df54bf3924';
export const PUBLIC_VM_TAXONOMY = FROZEN_TAXONOMY_VERSION;
export const PUBLIC_VM_CLASS_COUNT = 30;
export const PUBLIC_VM_IGNORE_INDEX = 255;
export const PUBLIC_VM_MAX_IMAGE_BYTES = 15 * 1024 * 1024;

export const PUBLIC_VM_ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type PublicVmAcceptedMimeType =
  (typeof PUBLIC_VM_ACCEPTED_MIME_TYPES)[number];

export interface PublicVmAnalyzeRequest {
  requestId: string;
  imageBase64: string;
  imageMimeType: PublicVmAcceptedMimeType;
  imageFilename?: string;
}

export interface PublicVmClassShare {
  classId: number;
  className: string;
  pixels: number;
  shareOfValidPixels: number;
}

export interface PublicVmQaSummary {
  totalPixels: number;
  validPixels: number;
  ignoredPixels: number;
  ignoreShare: number;
  otherUnknownPixels: number;
  otherUnknownShareOfValidPixels: number;
}

export interface PublicVmSegmentationOutput {
  labelMapStableBase64: string;
  labelMapMimeType: 'image/png';
  rgbCleanBase64?: string | null;
  overlayCleanBase64?: string | null;
  taxonomyVersion: typeof PUBLIC_VM_TAXONOMY;
  classCount: typeof PUBLIC_VM_CLASS_COUNT;
  ignoreIndex: typeof PUBLIC_VM_IGNORE_INDEX;
  classShares: PublicVmClassShare[];
  qa: PublicVmQaSummary;
}

export interface PublicVmProvenance {
  repository: typeof PUBLIC_VM_SOURCE_REPOSITORY;
  commit: typeof PUBLIC_VM_SOURCE_COMMIT;
  sourceBlob?: typeof PUBLIC_VM_SOURCE_BLOB;
  taxonomyVersion: typeof PUBLIC_VM_TAXONOMY;
  contractVersion: typeof PUBLIC_VM_CONTRACT_VERSION;
  runtimeService?: string | null;
  modelIds?: {
    ade: string;
    mapillary: string;
    groundingDino: string;
    sam2: string;
  };
}

export interface PublicVmAnalyzeSuccess {
  success: true;
  requestId: string;
  stage: 'VM_COMPLETE';
  segmentation: PublicVmSegmentationOutput;
  provenance: PublicVmProvenance;
}

export type PublicVmFailureCode =
  | 'INVALID_VM_REQUEST'
  | 'IMAGE_TOO_LARGE'
  | 'UNSUPPORTED_IMAGE_TYPE'
  | 'VM_INFERENCE_NOT_CONNECTED_P2B'
  | 'VM_SERVICE_UNAVAILABLE'
  | 'VM_SERVICE_TIMEOUT'
  | 'VM_SERVICE_CONTRACT_MISMATCH'
  | 'VM_RUNTIME_ERROR';

export interface PublicVmAnalyzeFailure {
  success: false;
  requestId?: string;
  stage: 'VM_NOT_RUN' | 'VM_FAILED';
  code: PublicVmFailureCode;
  message: string;
  contractVersion: typeof PUBLIC_VM_CONTRACT_VERSION;
}

export interface PublicVmRuntimeStatus {
  configured: boolean;
  reachable: boolean;
  ready: boolean;
  detail: string;
}

export interface PublicVmStatusResponse {
  success: true;
  stage: typeof PUBLIC_VM_STAGE;
  contractVersion: typeof PUBLIC_VM_CONTRACT_VERSION;
  analyzeRoute: typeof PUBLIC_VM_ROUTE;
  inferenceConnected: boolean;
  providerMode: 'EXTERNAL_GPU_SERVICE';
  acceptedMimeTypes: readonly PublicVmAcceptedMimeType[];
  maxImageBytes: number;
  expectedOutput: {
    scientificLabelMap: 'LABEL_MAP_STABLE_PNG';
    taxonomyVersion: typeof PUBLIC_VM_TAXONOMY;
    classCount: typeof PUBLIC_VM_CLASS_COUNT;
    ignoreIndex: typeof PUBLIC_VM_IGNORE_INDEX;
    classStatistics: true;
    qaSummary: true;
  };
  runtime: PublicVmRuntimeStatus;
  provenance: PublicVmProvenance;
}

export type PublicVmAnalyzeResponse = PublicVmAnalyzeSuccess | PublicVmAnalyzeFailure;
