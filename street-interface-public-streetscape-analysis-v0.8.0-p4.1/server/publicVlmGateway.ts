/**
 * Public VLM Gateway — P3
 *
 * Source-backed Qwen2-VL 10-field inference. The browser never talks directly
 * to the CUDA worker. This gateway validates image payloads and the returned
 * source/instrument/readout contract. P3 does NOT compute I/Y/D/M.
 */
import type { Express, Request, Response } from 'express';
import {
  PUBLIC_VLM_ACCEPTED_MIME_TYPES,
  PUBLIC_VLM_CONTRACT_VERSION,
  PUBLIC_VLM_FIELD_IDS,
  PUBLIC_VLM_MAX_IMAGE_BYTES,
  PUBLIC_VLM_MODEL_ID,
  PUBLIC_VLM_MODEL_REVISION,
  PUBLIC_VLM_PROCESSOR_POLICY,
  PUBLIC_VLM_READOUT,
  PUBLIC_VLM_RUNTIME_LOCK_ID,
  PUBLIC_VLM_RUNTIME_VERSIONS,
  PUBLIC_VLM_ROUTE,
  PUBLIC_VLM_SOURCE_BLOBS,
  PUBLIC_VLM_SOURCE_COMMIT,
  PUBLIC_VLM_SOURCE_REPOSITORY,
  PUBLIC_VLM_STAGE,
  PUBLIC_VLM_STATUS_ROUTE,
  type PublicVlmAcceptedMimeType,
  type PublicVlmAnalyzeFailure,
  type PublicVlmAnalyzeRequest,
  type PublicVlmStatusResponse,
} from '../src/publicVlmContract';
import { isPublicVlmAnalyzeSuccess } from './publicVlmValidation';

const DEFAULT_STATUS_TIMEOUT_MS = 2500;
const DEFAULT_INFERENCE_TIMEOUT_MS = 15 * 60 * 1000;
const RUNTIME_LABEL = 'SOURCE_BACKED_QWEN_FASTAPI_GPU_WORKER_P3_1_REPRO_LOCK';

function cleanBase64(value: string): string {
  const comma = value.indexOf(',');
  if (value.startsWith('data:') && comma >= 0) return value.slice(comma + 1);
  return value;
}

function decodedBase64Length(value: string): number {
  const clean = cleanBase64(value).replace(/\s/g, '');
  if (!clean) return 0;
  const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  return Math.floor((clean.length * 3) / 4) - padding;
}

function serviceBaseUrl(): string | null {
  const raw = process.env.CUDA_VLM_INFERENCE_ENDPOINT?.trim();
  return raw ? raw.replace(/\/+$/, '') : null;
}

function serviceUrl(path: '/health' | '/infer'): string | null {
  const base = serviceBaseUrl();
  return base ? `${base}${path}` : null;
}

function requestHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  const token = process.env.CUDA_VLM_SERVICE_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function probeRuntime(): Promise<PublicVlmStatusResponse['runtime']> {
  const url = serviceUrl('/health');
  if (!url) {
    return {
      configured: false,
      reachable: false,
      ready: false,
      detail: 'CUDA_VLM_INFERENCE_ENDPOINT is not configured.',
    };
  }
  const timeoutMs = Number(process.env.CUDA_VLM_STATUS_TIMEOUT_MS) || DEFAULT_STATUS_TIMEOUT_MS;
  try {
    const response = await fetchWithTimeout(url, { method: 'GET', headers: requestHeaders() }, timeoutMs);
    if (!response.ok) {
      return { configured: true, reachable: true, ready: false, detail: `Qwen worker health returned HTTP ${response.status}.` };
    }
    const body = (await response.json()) as Record<string, unknown>;
    const sourceBlobs = body.sourceBlobs as Record<string, unknown> | undefined;
    const blobsOk = Object.entries(PUBLIC_VLM_SOURCE_BLOBS).every(([key, value]) => sourceBlobs?.[key] === value);
    const ready =
      body.ready === true &&
      body.contractVersion === PUBLIC_VLM_CONTRACT_VERSION &&
      body.sourceCommit === PUBLIC_VLM_SOURCE_COMMIT &&
      body.modelId === PUBLIC_VLM_MODEL_ID &&
      body.modelRevision === PUBLIC_VLM_MODEL_REVISION &&
      body.processorPolicy === PUBLIC_VLM_PROCESSOR_POLICY &&
      body.runtimeLockId === PUBLIC_VLM_RUNTIME_LOCK_ID &&
      body.runtimeLockOk === true &&
      body.readout === PUBLIC_VLM_READOUT &&
      body.fieldCount === PUBLIC_VLM_FIELD_IDS.length &&
      blobsOk;
    return {
      configured: true,
      reachable: true,
      ready,
      modelRevision: typeof body.modelRevision === 'string' ? body.modelRevision : null,
      processorPolicy: typeof body.processorPolicy === 'string' ? body.processorPolicy : null,
      runtimeLockId: typeof body.runtimeLockId === 'string' ? body.runtimeLockId : null,
      runtimeVersions: body.runtimeVersions && typeof body.runtimeVersions === 'object'
        ? body.runtimeVersions as Record<string, string | null>
        : null,
      runtimeLockOk: body.runtimeLockOk === true,
      detail: ready
        ? 'Source-backed Qwen CUDA worker is reachable and P3.1 reproducibility-locked.'
        : 'Qwen worker is reachable but its source/runtime/processor reproducibility lock does not match.',
    };
  } catch (error) {
    return {
      configured: true,
      reachable: false,
      ready: false,
      detail: error instanceof Error ? error.message : 'Qwen worker health probe failed.',
    };
  }
}

function failure(
  res: Response,
  status: number,
  code: PublicVlmAnalyzeFailure['code'],
  message: string,
  requestId?: string,
  stage: PublicVlmAnalyzeFailure['stage'] = 'VLM_NOT_RUN',
): void {
  const payload: PublicVlmAnalyzeFailure = {
    success: false,
    requestId,
    stage,
    code,
    message,
    contractVersion: PUBLIC_VLM_CONTRACT_VERSION,
  };
  res.status(status).json(payload);
}


export function registerPublicVlmGateway(app: Express): void {
  app.get(PUBLIC_VLM_STATUS_ROUTE, async (_req: Request, res: Response) => {
    const runtime = await probeRuntime();
    const payload: PublicVlmStatusResponse = {
      success: true,
      stage: PUBLIC_VLM_STAGE,
      contractVersion: PUBLIC_VLM_CONTRACT_VERSION,
      analyzeRoute: PUBLIC_VLM_ROUTE,
      inferenceConnected: runtime.ready,
      providerMode: 'EXTERNAL_GPU_SERVICE',
      acceptedMimeTypes: PUBLIC_VLM_ACCEPTED_MIME_TYPES,
      maxImageBytes: PUBLIC_VLM_MAX_IMAGE_BYTES,
      expectedOutput: {
        fieldCount: 10,
        fields: PUBLIC_VLM_FIELD_IDS,
        probabilitiesPerField: 7,
        readout: PUBLIC_VLM_READOUT,
      },
      runtime,
      provenance: {
        repository: PUBLIC_VLM_SOURCE_REPOSITORY,
        commit: PUBLIC_VLM_SOURCE_COMMIT,
        sourceBlobs: PUBLIC_VLM_SOURCE_BLOBS,
        contractVersion: PUBLIC_VLM_CONTRACT_VERSION,
        runtimeLockId: PUBLIC_VLM_RUNTIME_LOCK_ID,
        runtimeVersions: PUBLIC_VLM_RUNTIME_VERSIONS,
        runtimeService: runtime.configured ? RUNTIME_LABEL : null,
      },
    };
    res.json(payload);
  });

  app.post(PUBLIC_VLM_ROUTE, async (req: Request, res: Response) => {
    const body = (req.body || {}) as Partial<PublicVlmAnalyzeRequest>;
    const effectiveRequestId = body.requestId || `vlm_req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    if (!body.imageBase64 || typeof body.imageBase64 !== 'string') {
      failure(res, 400, 'INVALID_VLM_REQUEST', 'imageBase64 must be provided.', effectiveRequestId);
      return;
    }
    if (!body.imageMimeType || !PUBLIC_VLM_ACCEPTED_MIME_TYPES.includes(body.imageMimeType as PublicVlmAcceptedMimeType)) {
      failure(res, 400, 'UNSUPPORTED_IMAGE_TYPE', `Image MIME type must be one of: ${PUBLIC_VLM_ACCEPTED_MIME_TYPES.join(', ')}`, effectiveRequestId);
      return;
    }
    const normalizedBase64 = cleanBase64(body.imageBase64);
    const decodedBytes = decodedBase64Length(normalizedBase64);
    if (decodedBytes <= 0) {
      failure(res, 400, 'INVALID_VLM_REQUEST', 'Image payload is empty or invalid.', effectiveRequestId);
      return;
    }
    if (decodedBytes > PUBLIC_VLM_MAX_IMAGE_BYTES) {
      failure(res, 413, 'IMAGE_TOO_LARGE', `Image payload (${decodedBytes} bytes) exceeds the 15 MB limit.`, effectiveRequestId);
      return;
    }
    const inferUrl = serviceUrl('/infer');
    if (!inferUrl) {
      failure(res, 503, 'VLM_INFERENCE_NOT_CONNECTED_P3', 'P3 gateway is installed, but CUDA_VLM_INFERENCE_ENDPOINT is not configured. No VLM ratings were fabricated.', effectiveRequestId);
      return;
    }
    const requestPayload: PublicVlmAnalyzeRequest = {
      requestId: effectiveRequestId,
      imageBase64: normalizedBase64,
      imageMimeType: body.imageMimeType as PublicVlmAcceptedMimeType,
      imageFilename: body.imageFilename,
    };
    const timeoutMs = Number(process.env.CUDA_VLM_INFERENCE_TIMEOUT_MS) || DEFAULT_INFERENCE_TIMEOUT_MS;
    let workerResponse: globalThis.Response;
    try {
      workerResponse = await fetchWithTimeout(inferUrl, {
        method: 'POST',
        headers: requestHeaders(),
        body: JSON.stringify(requestPayload),
      }, timeoutMs);
    } catch (error) {
      const timedOut = error instanceof Error && error.name === 'AbortError';
      failure(
        res,
        timedOut ? 504 : 503,
        timedOut ? 'VLM_SERVICE_TIMEOUT' : 'VLM_SERVICE_UNAVAILABLE',
        timedOut ? `Qwen VLM inference exceeded ${timeoutMs} ms.` : `Qwen VLM service could not be reached: ${error instanceof Error ? error.message : 'unknown error'}`,
        effectiveRequestId,
        'VLM_FAILED',
      );
      return;
    }
    let workerBody: unknown;
    try {
      workerBody = await workerResponse.json();
    } catch {
      failure(res, 502, 'VLM_SERVICE_CONTRACT_MISMATCH', 'Qwen VLM service returned a non-JSON response.', effectiveRequestId, 'VLM_FAILED');
      return;
    }
    if (!workerResponse.ok) {
      const candidate = workerBody as Partial<PublicVlmAnalyzeFailure>;
      if (candidate?.success === false && candidate.contractVersion === PUBLIC_VLM_CONTRACT_VERSION) {
        res.status(workerResponse.status).json(candidate);
      } else {
        failure(res, 502, 'VLM_RUNTIME_ERROR', `Qwen VLM worker failed with HTTP ${workerResponse.status}.`, effectiveRequestId, 'VLM_FAILED');
      }
      return;
    }
    if (!isPublicVlmAnalyzeSuccess(workerBody)) {
      failure(res, 502, 'VLM_SERVICE_CONTRACT_MISMATCH', 'Qwen VLM worker response failed the frozen P3 source/instrument/readout contract.', effectiveRequestId, 'VLM_FAILED');
      return;
    }
    // IMPORTANT: pass through the worker's already-validated P3.1 payload
    // byte-for-structure. Do not restamp provenance here: P4 consumes this
    // exact object and verifies it with the same canonical validator.
    res.json(workerBody);
  });
}
