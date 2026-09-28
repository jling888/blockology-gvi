import type { PublicVlmAnalyzeSuccess } from './publicVlmContract';
import {
  PUBLIC_LIVE_VALIDATION_PROFILE,
  PUBLIC_VALIDATION_CONTRACT_VERSION,
} from './publicValidationContract';

export const PUBLIC_SIM_CONTRACT_VERSION = 'public_sim_contract_v1_1';
export const PUBLIC_SIM_STAGE = 'P4_1_PROTOCOL_AWARE_NATURE_903_SYNTHESIS';
export const PUBLIC_SIM_ROUTE = '/api/public/sim/analyze';
export const PUBLIC_SIM_STATUS_ROUTE = '/api/public/sim/status';

export const PUBLIC_SIM_ENGINE_VERSION = 'paper_aligned_sim_engine_v0.5.2_nature_9_03_no_omega';
export const PUBLIC_SIM_ENGINE_SHA256 = '645ee93d6efe63e66e76ba1b4a4fb24bc7048d7b19c25ba49181cb4e2c280902';
export const PUBLIC_SIM_SCIENTIFIC_CORE = 'v0.6.3_GOLDEN_FREEZE';
export const PUBLIC_SIM_ACTIVE_FORMULA = 'M_i = I_i^a_i × Y_i^b_i × D_i^c_i';
export const PUBLIC_SIM_ELASTICITY_SOURCE = 'PAPER_GLOBAL_REFERENCE';
export const PUBLIC_SIM_CALIBRATION_STATUS = 'REFERENCE_NOT_LOCAL_GWR';

export interface PublicSimVmReceipt {
  requestId: string;
  stage: 'VM_COMPLETE';
  contractVersion: string;
  taxonomyVersion: string;
  repository: string;
  commit: string;
}

export interface PublicSimAnalyzeRequest {
  requestId: string;
  vmReceipt: PublicSimVmReceipt;
  vlmResult: PublicVlmAnalyzeSuccess;
}

export interface PublicSimNormalizedInputs {
  vNat: number;
  vBuilt: number;
  naturalBuiltRatio: number;
  gviEye: number;
  gmi: number;
  svf: number;
  vSign: number;
  sfv: number;
  vPave: number;
  gfapi: number;
  ias: number;
}

export interface PublicSimAnalyzeSuccess {
  success: true;
  requestId: string;
  stage: 'SIM_COMPLETE';
  result: {
    imageabilityRaw: number;
    imageability: number;
    identity: number;
    dependenceRaw: number;
    dependence: number;
    score: number;
    elasticities: {
      a: number;
      b: number;
      c: number;
      source: typeof PUBLIC_SIM_ELASTICITY_SOURCE;
      calibrationStatus: typeof PUBLIC_SIM_CALIBRATION_STATUS;
    };
  };
  normalizedInputs: PublicSimNormalizedInputs;
  validation: typeof PUBLIC_LIVE_VALIDATION_PROFILE & {
    contractVersion: typeof PUBLIC_VALIDATION_CONTRACT_VERSION;
  };
  supplementary: {
    sfv: number;
    note: 'SFV_SUPPLEMENTARY_ONLY';
  };
  inactiveGates: {
    stayabilityFactor: string | null;
    tEffective: string | null;
    spaceSyntaxControls: string | null;
  };
  provenance: {
    scientificCore: typeof PUBLIC_SIM_SCIENTIFIC_CORE;
    engineVersion: typeof PUBLIC_SIM_ENGINE_VERSION;
    engineSha256: typeof PUBLIC_SIM_ENGINE_SHA256;
    activeFormula: typeof PUBLIC_SIM_ACTIVE_FORMULA;
    noOmega: true;
    noExternalAi: true;
    sourceVlmRequestId: string;
    sourceVmRequestId: string;
    publicSimContractVersion: typeof PUBLIC_SIM_CONTRACT_VERSION;
    validationContractVersion: typeof PUBLIC_VALIDATION_CONTRACT_VERSION;
  };
}

export type PublicSimFailureCode =
  | 'INVALID_SIM_REQUEST'
  | 'VM_RECEIPT_CONTRACT_MISMATCH'
  | 'VLM_RESULT_CONTRACT_MISMATCH'
  | 'SIM_INPUT_GATED'
  | 'SIM_RUNTIME_ERROR';

export interface PublicSimAnalyzeFailure {
  success: false;
  requestId?: string;
  stage: 'SIM_NOT_RUN' | 'SIM_FAILED';
  code: PublicSimFailureCode;
  message: string;
  contractVersion: typeof PUBLIC_SIM_CONTRACT_VERSION;
  gates?: string[];
}

export interface PublicSimStatusResponse {
  success: true;
  stage: typeof PUBLIC_SIM_STAGE;
  contractVersion: typeof PUBLIC_SIM_CONTRACT_VERSION;
  analyzeRoute: typeof PUBLIC_SIM_ROUTE;
  ready: true;
  providerMode: 'LOCAL_DETERMINISTIC_FROZEN_CORE';
  scientificCore: typeof PUBLIC_SIM_SCIENTIFIC_CORE;
  engineVersion: typeof PUBLIC_SIM_ENGINE_VERSION;
  engineSha256: typeof PUBLIC_SIM_ENGINE_SHA256;
  activeFormula: typeof PUBLIC_SIM_ACTIVE_FORMULA;
  noOmega: true;
  noExternalAi: true;
  validation: {
    contractVersion: typeof PUBLIC_VALIDATION_CONTRACT_VERSION;
    liveProfile: typeof PUBLIC_LIVE_VALIDATION_PROFILE;
  };
  fallbackElasticities: {
    a: 0.4;
    b: 0.2;
    c: 0.4;
    source: typeof PUBLIC_SIM_ELASTICITY_SOURCE;
    calibrationStatus: typeof PUBLIC_SIM_CALIBRATION_STATUS;
  };
}

export type PublicSimAnalyzeResponse = PublicSimAnalyzeSuccess | PublicSimAnalyzeFailure;
