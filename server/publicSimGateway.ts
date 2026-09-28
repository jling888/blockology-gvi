import type { Express, Request, Response } from 'express';
import {
  PUBLIC_SIM_ACTIVE_FORMULA,
  PUBLIC_SIM_CALIBRATION_STATUS,
  PUBLIC_SIM_CONTRACT_VERSION,
  PUBLIC_SIM_ELASTICITY_SOURCE,
  PUBLIC_SIM_ENGINE_SHA256,
  PUBLIC_SIM_ENGINE_VERSION,
  PUBLIC_SIM_ROUTE,
  PUBLIC_SIM_SCIENTIFIC_CORE,
  PUBLIC_SIM_STAGE,
  PUBLIC_SIM_STATUS_ROUTE,
  type PublicSimAnalyzeFailure,
  type PublicSimAnalyzeRequest,
  type PublicSimAnalyzeSuccess,
  type PublicSimNormalizedInputs,
  type PublicSimStatusResponse,
} from '../src/publicSimContract';
import {
  PUBLIC_VLM_CONTRACT_VERSION,
  PUBLIC_VLM_FIELD_IDS,
  PUBLIC_VLM_MODEL_ID,
  PUBLIC_VLM_MODEL_REVISION,
  PUBLIC_VLM_PROCESSOR_POLICY,
  PUBLIC_VLM_READOUT,
  PUBLIC_VLM_RUNTIME_LOCK_ID,
  PUBLIC_VLM_SOURCE_BLOBS,
  PUBLIC_VLM_SOURCE_COMMIT,
  PUBLIC_VLM_SOURCE_REPOSITORY,
  type PublicVlmAnalyzeSuccess,
  type PublicVlmFieldId,
  type PublicVlmFieldResult,
} from '../src/publicVlmContract';
import {
  PUBLIC_LIVE_VALIDATION_PROFILE,
  PUBLIC_VALIDATION_CONTRACT_VERSION,
} from '../src/publicValidationContract';
import {
  PUBLIC_VM_CONTRACT_VERSION,
  PUBLIC_VM_SOURCE_COMMIT,
  PUBLIC_VM_SOURCE_REPOSITORY,
  PUBLIC_VM_TAXONOMY,
} from '../src/publicVmContract';
import {
  NATURE_903_CWMC_REFERENCE,
  PAPER_ALIGNED_SIM_ENGINE_VERSION,
  computePaperSynthesis,
  type PaperResearchInputs,
} from '../src/utils/simComputationEngine';

const EPS = 1e-8;

function failure(
  res: Response,
  status: number,
  code: PublicSimAnalyzeFailure['code'],
  message: string,
  requestId?: string,
  gates?: string[]
) {
  const body: PublicSimAnalyzeFailure = {
    success: false,
    requestId,
    stage: status >= 500 ? 'SIM_FAILED' : 'SIM_NOT_RUN',
    code,
    message,
    contractVersion: PUBLIC_SIM_CONTRACT_VERSION,
    ...(gates ? { gates } : {}),
  };
  res.status(status).json(body);
}

function isFiniteUnit(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

function sourceBlobsMatch(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const actual = value as Record<string, unknown>;
  return Object.entries(PUBLIC_VLM_SOURCE_BLOBS).every(([key, expected]) => actual[key] === expected);
}

function validateVlmResult(vlm: unknown): vlm is PublicVlmAnalyzeSuccess {
  if (!vlm || typeof vlm !== 'object') return false;
  const v = vlm as PublicVlmAnalyzeSuccess;
  if (v.success !== true || v.stage !== 'VLM_COMPLETE') return false;
  if (!Array.isArray(v.fields) || v.fields.length !== PUBLIC_VLM_FIELD_IDS.length) return false;
  if (
    v.instrument?.modelId !== PUBLIC_VLM_MODEL_ID ||
    v.instrument?.modelRevision !== PUBLIC_VLM_MODEL_REVISION ||
    v.instrument?.processorPolicy !== PUBLIC_VLM_PROCESSOR_POLICY ||
    v.instrument?.runtimeLockId !== PUBLIC_VLM_RUNTIME_LOCK_ID ||
    v.instrument?.fieldCount !== 10 ||
    v.instrument?.anchorsPerField !== 7 ||
    v.instrument?.readout !== PUBLIC_VLM_READOUT
  ) return false;
  if (
    v.provenance?.repository !== PUBLIC_VLM_SOURCE_REPOSITORY ||
    v.provenance?.commit !== PUBLIC_VLM_SOURCE_COMMIT ||
    v.provenance?.contractVersion !== PUBLIC_VLM_CONTRACT_VERSION ||
    v.provenance?.runtimeLockId !== PUBLIC_VLM_RUNTIME_LOCK_ID ||
    !sourceBlobsMatch(v.provenance?.sourceBlobs)
  ) return false;

  const byId = new Map<PublicVlmFieldId, PublicVlmFieldResult>();
  for (const field of v.fields) {
    if (!PUBLIC_VLM_FIELD_IDS.includes(field.fieldId)) return false;
    if (byId.has(field.fieldId)) return false;
    if (!Array.isArray(field.probabilities) || field.probabilities.length !== 7) return false;
    if (!field.probabilities.every((p) => typeof p === 'number' && Number.isFinite(p) && p >= 0)) return false;
    const pSum = field.probabilities.reduce((sum, p) => sum + p, 0);
    if (Math.abs(pSum - 1) > 0.02) return false;
    if (typeof field.readoutMedian !== 'number' || !Number.isFinite(field.readoutMedian) || field.readoutMedian < 1 || field.readoutMedian > 7) return false;
    if (!isFiniteUnit(field.normalized01)) return false;
    if (Math.abs(field.normalized01 - (field.readoutMedian - 1) / 6) > EPS) return false;
    byId.set(field.fieldId, field);
  }
  return PUBLIC_VLM_FIELD_IDS.every((id) => byId.has(id));
}

function validateVmReceipt(receipt: PublicSimAnalyzeRequest['vmReceipt'] | undefined): boolean {
  return !!receipt &&
    typeof receipt.requestId === 'string' && receipt.requestId.length > 0 &&
    receipt.stage === 'VM_COMPLETE' &&
    receipt.contractVersion === PUBLIC_VM_CONTRACT_VERSION &&
    receipt.taxonomyVersion === PUBLIC_VM_TAXONOMY &&
    receipt.repository === PUBLIC_VM_SOURCE_REPOSITORY &&
    receipt.commit === PUBLIC_VM_SOURCE_COMMIT;
}

export function mapNormalizedInputs(
  vlm: { fields: readonly Pick<PublicVlmFieldResult, 'fieldId' | 'normalized01'>[] },
): PublicSimNormalizedInputs {
  const byId = new Map(vlm.fields.map((field) => [field.fieldId, field.normalized01] as const));
  const get = (id: PublicVlmFieldId) => {
    const value = byId.get(id);
    if (!isFiniteUnit(value)) throw new Error(`Missing or invalid normalized Qwen field: ${id}`);
    return value;
  };

  const vNat = get('vertical_greenery');
  const vBuilt = get('vertical_hardscape');
  const naturalBuiltRatio = vBuilt > 0 ? vNat / vBuilt : Number.NaN;

  return {
    vNat,
    vBuilt,
    naturalBuiltRatio,
    gviEye: get('green_eye_level'),
    gmi: get('green_softening'),
    svf: get('sky_openness'),
    vSign: get('signage_detail'),
    sfv: get('facade_variation'),
    vPave: get('walkable_ground'),
    gfapi: get('ground_floor_activity'),
    ias: get('resting_affordance'),
  };
}

export function registerPublicSimGateway(app: Express): void {
  app.get(PUBLIC_SIM_STATUS_ROUTE, (_req: Request, res: Response) => {
    const payload: PublicSimStatusResponse = {
      success: true,
      stage: PUBLIC_SIM_STAGE,
      contractVersion: PUBLIC_SIM_CONTRACT_VERSION,
      analyzeRoute: PUBLIC_SIM_ROUTE,
      ready: true,
      providerMode: 'LOCAL_DETERMINISTIC_FROZEN_CORE',
      scientificCore: PUBLIC_SIM_SCIENTIFIC_CORE,
      engineVersion: PUBLIC_SIM_ENGINE_VERSION,
      engineSha256: PUBLIC_SIM_ENGINE_SHA256,
      activeFormula: PUBLIC_SIM_ACTIVE_FORMULA,
      noOmega: true,
      noExternalAi: true,
      validation: {
        contractVersion: PUBLIC_VALIDATION_CONTRACT_VERSION,
        liveProfile: PUBLIC_LIVE_VALIDATION_PROFILE,
      },
      fallbackElasticities: {
        a: 0.4,
        b: 0.2,
        c: 0.4,
        source: PUBLIC_SIM_ELASTICITY_SOURCE,
        calibrationStatus: PUBLIC_SIM_CALIBRATION_STATUS,
      },
    };
    res.json(payload);
  });

  app.post(PUBLIC_SIM_ROUTE, (req: Request, res: Response) => {
    const body = (req.body || {}) as Partial<PublicSimAnalyzeRequest>;
    const effectiveRequestId = body.requestId || `sim_req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    try {
      if (!validateVmReceipt(body.vmReceipt)) {
        failure(res, 400, 'VM_RECEIPT_CONTRACT_MISMATCH', 'P4.1 requires a valid source-backed P2B VM completion receipt.', effectiveRequestId);
        return;
      }
      if (!validateVlmResult(body.vlmResult)) {
        failure(res, 400, 'VLM_RESULT_CONTRACT_MISMATCH', 'P4.1 requires a valid P3.1 reproducibility-locked Qwen result.', effectiveRequestId);
        return;
      }

      const normalized = mapNormalizedInputs(body.vlmResult);
      if (!Number.isFinite(normalized.naturalBuiltRatio)) {
        failure(res, 422, 'SIM_INPUT_GATED', 'V_built is zero, so the frozen V_nat/V_built Imageability term is undefined. No score was fabricated.', effectiveRequestId);
        return;
      }

      const inputs: PaperResearchInputs = {
        vNat: normalized.vNat,
        vBuilt: normalized.vBuilt,
        naturalBuiltRatio: null,
        gviEye: normalized.gviEye,
        gmi: normalized.gmi,
        vSign: normalized.vSign,
        svf: normalized.svf,
        sfv: normalized.sfv,
        vPave: normalized.vPave,
        ias: normalized.ias,
        gfapi: normalized.gfapi,
        dCalibrationInput: null,
        hwRatio: null,
        spaceSyntaxChoice: null,
        spaceSyntaxIntegration: null,
        gwrLocalBetas: null,
        sourceBackedTypology: null,
        tBase: null,
      };

      const synthesis = computePaperSynthesis(inputs, NATURE_903_CWMC_REFERENCE);
      const activeMetrics = [
        synthesis.imageabilityRaw,
        synthesis.placeImageability,
        synthesis.placeIdentity,
        synthesis.dependenceRaw,
        synthesis.placeDependence,
        synthesis.localElasticities,
        synthesis.sim,
      ];
      if (activeMetrics.some((metric) => metric.status !== 'computed' || metric.value === null)) {
        const activeGates = activeMetrics
          .filter((metric) => metric.status !== 'computed' || metric.value === null)
          .map((metric) => metric.reason);
        failure(res, 422, 'SIM_INPUT_GATED', 'The frozen Nature 9.03 synthesis could not be completed from the supplied evidence. No score was fabricated.', effectiveRequestId, activeGates);
        return;
      }

      if (PAPER_ALIGNED_SIM_ENGINE_VERSION !== PUBLIC_SIM_ENGINE_VERSION) {
        failure(res, 500, 'SIM_RUNTIME_ERROR', 'Frozen engine version mismatch.', effectiveRequestId);
        return;
      }

      const elasticities = synthesis.localElasticities.value!;
      if (
        elasticities.source !== PUBLIC_SIM_ELASTICITY_SOURCE ||
        elasticities.calibrationStatus !== PUBLIC_SIM_CALIBRATION_STATUS ||
        Math.abs(elasticities.a - 0.4) > EPS ||
        Math.abs(elasticities.b - 0.2) > EPS ||
        Math.abs(elasticities.c - 0.4) > EPS
      ) {
        failure(res, 500, 'SIM_RUNTIME_ERROR', 'P4.1 fallback elasticity lock was not preserved.', effectiveRequestId);
        return;
      }

      const payload: PublicSimAnalyzeSuccess = {
        success: true,
        requestId: effectiveRequestId,
        stage: 'SIM_COMPLETE',
        result: {
          imageabilityRaw: synthesis.imageabilityRaw.value!,
          imageability: synthesis.placeImageability.value!,
          identity: synthesis.placeIdentity.value!,
          dependenceRaw: synthesis.dependenceRaw.value!,
          dependence: synthesis.placeDependence.value!,
          score: synthesis.sim.value!,
          elasticities: {
            a: elasticities.a,
            b: elasticities.b,
            c: elasticities.c,
            source: PUBLIC_SIM_ELASTICITY_SOURCE,
            calibrationStatus: PUBLIC_SIM_CALIBRATION_STATUS,
          },
        },
        normalizedInputs: normalized,
        validation: {
          ...PUBLIC_LIVE_VALIDATION_PROFILE,
          contractVersion: PUBLIC_VALIDATION_CONTRACT_VERSION,
        },
        supplementary: {
          sfv: normalized.sfv,
          note: 'SFV_SUPPLEMENTARY_ONLY',
        },
        inactiveGates: {
          stayabilityFactor: synthesis.stayabilityFactor.status === 'computed' ? null : synthesis.stayabilityFactor.reason,
          tEffective: synthesis.tEffective.status === 'computed' ? null : synthesis.tEffective.reason,
          spaceSyntaxControls: synthesis.spaceSyntaxControls.status === 'computed' ? null : synthesis.spaceSyntaxControls.reason,
        },
        provenance: {
          scientificCore: PUBLIC_SIM_SCIENTIFIC_CORE,
          engineVersion: PUBLIC_SIM_ENGINE_VERSION,
          engineSha256: PUBLIC_SIM_ENGINE_SHA256,
          activeFormula: PUBLIC_SIM_ACTIVE_FORMULA,
          noOmega: true,
          noExternalAi: true,
          sourceVlmRequestId: body.vlmResult.requestId,
          sourceVmRequestId: body.vmReceipt!.requestId,
          publicSimContractVersion: PUBLIC_SIM_CONTRACT_VERSION,
          validationContractVersion: PUBLIC_VALIDATION_CONTRACT_VERSION,
        },
      };

      res.json(payload);
    } catch (error) {
      failure(
        res,
        500,
        'SIM_RUNTIME_ERROR',
        `P4.1 deterministic synthesis failed: ${error instanceof Error ? error.message : 'unknown error'}`,
        effectiveRequestId
      );
    }
  });
}
