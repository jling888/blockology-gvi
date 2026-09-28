/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Public VM Gateway — P2B
 *
 * The browser never talks directly to the CUDA worker. This gateway validates
 * the public request, forwards it to the configured GPU service, verifies the
 * returned scientific contract, and only then exposes it to the client.
 */

import type { Express, Request, Response } from 'express';
import {
  PUBLIC_VM_CONTRACT_VERSION,
  PUBLIC_VM_STAGE,
  PUBLIC_VM_ROUTE,
  PUBLIC_VM_STATUS_ROUTE,
  PUBLIC_VM_SOURCE_REPOSITORY,
  PUBLIC_VM_SOURCE_COMMIT,
  PUBLIC_VM_SOURCE_BLOB,
  PUBLIC_VM_TAXONOMY,
  PUBLIC_VM_CLASS_COUNT,
  PUBLIC_VM_IGNORE_INDEX,
  PUBLIC_VM_MAX_IMAGE_BYTES,
  PUBLIC_VM_ACCEPTED_MIME_TYPES,
  type PublicVmAcceptedMimeType,
  type PublicVmStatusResponse,
  type PublicVmAnalyzeRequest,
  type PublicVmAnalyzeFailure,
  type PublicVmAnalyzeSuccess,
} from '../src/publicVmContract';

const DEFAULT_STATUS_TIMEOUT_MS = 2500;
const DEFAULT_INFERENCE_TIMEOUT_MS = 15 * 60 * 1000;
const RUNTIME_LABEL = 'SOURCE_BACKED_FASTAPI_GPU_WORKER';

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
  const raw = process.env.CUDA_VM_INFERENCE_ENDPOINT?.trim();
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
  const token = process.env.CUDA_VM_SERVICE_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<globalThis.Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function probeRuntime(): Promise<PublicVmStatusResponse['runtime']> {
  const url = serviceUrl('/health');
  if (!url) {
    return {
      configured: false,
      reachable: false,
      ready: false,
      detail: 'CUDA_VM_INFERENCE_ENDPOINT is not configured.',
    };
  }

  const timeoutMs = Number(process.env.CUDA_VM_STATUS_TIMEOUT_MS) || DEFAULT_STATUS_TIMEOUT_MS;
  try {
    const response = await fetchWithTimeout(
      url,
      { method: 'GET', headers: requestHeaders() },
      timeoutMs,
    );
    if (!response.ok) {
      return {
        configured: true,
        reachable: true,
        ready: false,
        detail: `GPU worker health returned HTTP ${response.status}.`,
      };
    }
    const body = (await response.json()) as Record<string, unknown>;
    const contractOk =
      body.contractVersion === PUBLIC_VM_CONTRACT_VERSION &&
      body.taxonomyVersion === PUBLIC_VM_TAXONOMY &&
      body.sourceCommit === PUBLIC_VM_SOURCE_COMMIT;
    const ready = body.ready === true && contractOk;
    return {
      configured: true,
      reachable: true,
      ready,
      detail: ready
        ? 'Source-backed CUDA worker is reachable and contract-aligned.'
        : 'GPU worker is reachable but not ready or its source contract does not match.',
    };
  } catch (error) {
    return {
      configured: true,
      reachable: false,
      ready: false,
      detail: error instanceof Error ? error.message : 'GPU worker health probe failed.',
    };
  }
}

function failure(
  res: Response,
  status: number,
  code: PublicVmAnalyzeFailure['code'],
  message: string,
  requestId?: string,
  stage: PublicVmAnalyzeFailure['stage'] = 'VM_NOT_RUN',
): void {
  const payload: PublicVmAnalyzeFailure = {
    success: false,
    requestId,
    stage,
    code,
    message,
    contractVersion: PUBLIC_VM_CONTRACT_VERSION,
  };
  res.status(status).json(payload);
}

function isAnalyzeSuccess(value: unknown): value is PublicVmAnalyzeSuccess {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<PublicVmAnalyzeSuccess>;
  const s = v.segmentation;
  const p = v.provenance;
  if (v.success !== true || v.stage !== 'VM_COMPLETE' || !s || !p) return false;
  if (
    s.taxonomyVersion !== PUBLIC_VM_TAXONOMY ||
    s.classCount !== PUBLIC_VM_CLASS_COUNT ||
    s.ignoreIndex !== PUBLIC_VM_IGNORE_INDEX ||
    s.labelMapMimeType !== 'image/png' ||
    typeof s.labelMapStableBase64 !== 'string' ||
    s.labelMapStableBase64.length === 0 ||
    !Array.isArray(s.classShares) ||
    s.classShares.length !== PUBLIC_VM_CLASS_COUNT
  ) return false;

  const ids = new Set(s.classShares.map((x) => x.classId));
  if (ids.size !== PUBLIC_VM_CLASS_COUNT) return false;
  for (let id = 0; id < PUBLIC_VM_CLASS_COUNT; id += 1) {
    if (!ids.has(id)) return false;
  }

  return (
    p.repository === PUBLIC_VM_SOURCE_REPOSITORY &&
    p.commit === PUBLIC_VM_SOURCE_COMMIT &&
    p.taxonomyVersion === PUBLIC_VM_TAXONOMY &&
    p.contractVersion === PUBLIC_VM_CONTRACT_VERSION
  );
}

export function registerPublicVmGateway(app: Express): void {
  app.get(PUBLIC_VM_STATUS_ROUTE, async (_req: Request, res: Response) => {
    const runtime = await probeRuntime();
    const statusPayload: PublicVmStatusResponse = {
      success: true,
      stage: PUBLIC_VM_STAGE,
      contractVersion: PUBLIC_VM_CONTRACT_VERSION,
      analyzeRoute: PUBLIC_VM_ROUTE,
      inferenceConnected: runtime.ready,
      providerMode: 'EXTERNAL_GPU_SERVICE',
      acceptedMimeTypes: PUBLIC_VM_ACCEPTED_MIME_TYPES,
      maxImageBytes: PUBLIC_VM_MAX_IMAGE_BYTES,
      expectedOutput: {
        scientificLabelMap: 'LABEL_MAP_STABLE_PNG',
        taxonomyVersion: PUBLIC_VM_TAXONOMY,
        classCount: PUBLIC_VM_CLASS_COUNT,
        ignoreIndex: PUBLIC_VM_IGNORE_INDEX,
        classStatistics: true,
        qaSummary: true,
      },
      runtime,
      provenance: {
        repository: PUBLIC_VM_SOURCE_REPOSITORY,
        commit: PUBLIC_VM_SOURCE_COMMIT,
        sourceBlob: PUBLIC_VM_SOURCE_BLOB,
        taxonomyVersion: PUBLIC_VM_TAXONOMY,
        contractVersion: PUBLIC_VM_CONTRACT_VERSION,
        // Never expose the internal worker URL to the browser.
        runtimeService: runtime.configured ? RUNTIME_LABEL : null,
      },
    };
    res.json(statusPayload);
  });

  app.post(PUBLIC_VM_ROUTE, async (req: Request, res: Response) => {
    const body = (req.body || {}) as Partial<PublicVmAnalyzeRequest>;
    const effectiveRequestId =
      body.requestId || `vm_req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    if (!body.imageBase64 || typeof body.imageBase64 !== 'string') {
      failure(res, 400, 'INVALID_VM_REQUEST', 'imageBase64 must be provided.', effectiveRequestId);
      return;
    }

    if (
      !body.imageMimeType ||
      !PUBLIC_VM_ACCEPTED_MIME_TYPES.includes(body.imageMimeType as PublicVmAcceptedMimeType)
    ) {
      failure(
        res,
        400,
        'UNSUPPORTED_IMAGE_TYPE',
        `Image MIME type must be one of: ${PUBLIC_VM_ACCEPTED_MIME_TYPES.join(', ')}`,
        effectiveRequestId,
      );
      return;
    }

    const normalizedBase64 = cleanBase64(body.imageBase64);
    const decodedBytes = decodedBase64Length(normalizedBase64);
    if (decodedBytes <= 0) {
      failure(res, 400, 'INVALID_VM_REQUEST', 'Image payload is empty or invalid.', effectiveRequestId);
      return;
    }
    if (decodedBytes > PUBLIC_VM_MAX_IMAGE_BYTES) {
      failure(
        res,
        413,
        'IMAGE_TOO_LARGE',
        `Image payload (${decodedBytes} bytes) exceeds the 15 MB limit.`,
        effectiveRequestId,
      );
      return;
    }

    const inferUrl = serviceUrl('/infer');
    if (!inferUrl) {
      failure(
        res,
        503,
        'VM_INFERENCE_NOT_CONNECTED_P2B',
        'P2B gateway is installed, but CUDA_VM_INFERENCE_ENDPOINT is not configured. No segmentation was fabricated.',
        effectiveRequestId,
      );
      return;
    }

    const requestPayload: PublicVmAnalyzeRequest = {
      requestId: effectiveRequestId,
      imageBase64: normalizedBase64,
      imageMimeType: body.imageMimeType as PublicVmAcceptedMimeType,
      imageFilename: body.imageFilename,
    };

    const timeoutMs = Number(process.env.CUDA_VM_INFERENCE_TIMEOUT_MS) || DEFAULT_INFERENCE_TIMEOUT_MS;
    let workerResponse: globalThis.Response;
    try {
      workerResponse = await fetchWithTimeout(
        inferUrl,
        {
          method: 'POST',
          headers: requestHeaders(),
          body: JSON.stringify(requestPayload),
        },
        timeoutMs,
      );
    } catch (error) {
      const timedOut = error instanceof Error && error.name === 'AbortError';
      failure(
        res,
        timedOut ? 504 : 503,
        timedOut ? 'VM_SERVICE_TIMEOUT' : 'VM_SERVICE_UNAVAILABLE',
        timedOut
          ? `CUDA VM inference exceeded ${timeoutMs} ms.`
          : `CUDA VM service could not be reached: ${error instanceof Error ? error.message : 'unknown error'}`,
        effectiveRequestId,
        'VM_FAILED',
      );
      return;
    }

    let workerBody: unknown;
    try {
      workerBody = await workerResponse.json();
    } catch {
      failure(
        res,
        502,
        'VM_SERVICE_CONTRACT_MISMATCH',
        'CUDA VM service returned a non-JSON response.',
        effectiveRequestId,
        'VM_FAILED',
      );
      return;
    }

    if (!workerResponse.ok) {
      const candidate = workerBody as Partial<PublicVmAnalyzeFailure>;
      if (candidate?.success === false && candidate.contractVersion === PUBLIC_VM_CONTRACT_VERSION) {
        res.status(workerResponse.status).json(candidate);
      } else {
        failure(
          res,
          502,
          'VM_RUNTIME_ERROR',
          `CUDA VM worker failed with HTTP ${workerResponse.status}.`,
          effectiveRequestId,
          'VM_FAILED',
        );
      }
      return;
    }

    if (!isAnalyzeSuccess(workerBody)) {
      failure(
        res,
        502,
        'VM_SERVICE_CONTRACT_MISMATCH',
        'CUDA VM worker response failed the frozen P2B source/taxonomy contract.',
        effectiveRequestId,
        'VM_FAILED',
      );
      return;
    }

    res.json(workerBody);
  });
}
