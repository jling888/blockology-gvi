/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Teacher 8/31 Appendix — VLM Visual Grounding & Prompt Protocol v3.0
 * Active paper-variable extraction pass for normalized [0,1] visual inputs.
 *
 * IMPORTANT:
 * - This module does NOT compute I_i, Y_i, D_i, A_i, M_i, F_i or D(x,y).
 * - It only returns the visual-semantic component variables defined by the
 *   manuscript appendix.
 * - SFV is intentionally not invented here because the supplied strict JSON
 *   template does not expose a dedicated numerical SFV field.
 */

import { GoogleGenAI, ThinkingLevel, MediaResolution } from '@google/genai';
import sharp from 'sharp';
import {
  PaperVlmImageQuadrant,
  PaperVlmV30Measurement,
} from '../src/types';
import { PAPER_VLM_V30_SCHEMA } from './paperVlmMeasurementSchema';

export const PAPER_VLM_PROTOCOL_VERSION = 'teacher_vlm_v3.0_8.31';

export const PAPER_VLM_SYSTEM_INSTRUCTION = `You are an advanced, double-blind validated computer vision system and expert urban morphologist specializing in environmental psychology and behavioral mapping.

Your objective is to execute highly rigorous visual-semantic reasoning and open-vocabulary streetscape analysis on a standardized eye-level perspective image to extract quantitative parameters for the Street Interface Matrix (SIM).

You must strictly adhere to the operational definitions, exclusion rules, score boundaries, and structured JSON output format provided in the user instructions.

IMPORTANT SCOPE BOUNDARY:
- You output ONLY visual component variables and reasoning.
- You do NOT calculate Place Imageability I_i, Place Identity Y_i, Place Dependence D_i, Environmental TFP A_i, GWR coefficients, local elasticities, SIM M_i, Stayability Factor F_i, t_effective, or D(x,y).
- Every numeric score must lie in [0.00, 1.00].
- Do not infer a numerical SFV value because the supplied strict 8/31 JSON template does not define one.
- Return only one valid JSON object matching the response schema.`;

export function buildPaperVlmUserPrompt(
  imageId: string,
  quadrant: PaperVlmImageQuadrant
): string {
  return `### CASE METADATA
Image ID: ${imageId}
Image Quadrant: ${quadrant}
Required capture standard: FOV=90°, h_eye=1.5m, camera pitch=0°.

### THREE-STAGE COGNITIVE ROUTING
1. Project an imaginary 3×3 grid over the image (Left/Center/Right × Top/Middle/Bottom) and locate relevant built/natural components.
2. Evaluate contextual morphology and behavioral affordances using the operational rules below.
3. Translate the assessment into the strict JSON quantitative fields.

### MODULE 1 — NATURAL ENVIRONS & IMAGEABILITY
A. V_nat [0,1]
- Visual attention probability of living vegetation above ground: tree leaves/branches, vertical green walls, climbing ivy, low planter beds, window-box foliage, hedges.
- EXCLUDE flat grass lawns, horizontal park turf, and weeds in pavement cracks.
- 0.00 = complete absence; 1.00 = vegetation fills the visual cone.

B. GVI_eye [0,1]
- Proportion of vegetative foliage within the primary foveal cone from 0° to 15° below the horizontal line of sight.
- High overhead canopy that requires looking upward should contribute little.
- Low shrubs, stoop planters and window boxes should contribute strongly.

C. GMI [0,1]
- Structural interaction measuring how eye-level greenery softens vertical hardscape walls.
- 0.00 = no greenery mitigation.
- 1.00 = dense vertical/low-tier greenery substantially masks the lower ~3m facade zone.

### MODULE 2 — MORPHOLOGICAL CONTAINMENT & IDENTITY
A. V_built [0,1]
- Visual attention probability of vertical structural surfaces bounding the street canyon: facades, storefront frames, columns, brick/stone walls, overhead cantilevers.
- EXCLUDE all walkable ground planes: roadway, sidewalks, paving stones, curb gutters.

B. Standardized Canyon Enclosure (1-SVF) [0,1]
- Estimate structural enclosure of the street section.
- Severe canyon, H/W≥3.0 with narrow sky slit: typically ≥0.85.
- Broad low-rise street around H/W≈1.0: typically 0.35–0.55.

C. V_sign [0,1]
- Density/articulation of cognitive visual anchors: historic masonry detail, decorative ironwork, recessed window divisions, legible ground-level signage.

### MODULE 3 — PHYSICAL UTILITY & PLACE DEPENDENCE
A. V_pave [0,1]
- Continuous unobstructed concrete/stone surface dedicated to pedestrian transit.
- Reduce for scaffolding, bins, grates, trash piles and other obstacles that reduce usable clearance.

B. GFAPI [0,1]
- Visual/physical transparency of the ground-floor street wall.
- ≥0.75 for continuous active transparent storefront glazing with visible activity and frequent entrances.
- ≤0.15 for blank/opaque facades, service doors, or sealed/tinted reflective lobby walls.

C. IAS [0,1]
- Density and quality of tactile human-scale invitations for informal sitting/rest.
- Historic masonry stoops: 0.9–1.5m height.
- Seating ledges/planter edges: 0.4–0.6m height, depth ≥0.3m.
- If an apparent affordance is blocked by spikes, defensive architecture or inaccessible railings, its contribution must be 0.00.

### HORIZON CHECK
Set horizon_alignment_verified=true only when the image visually appears level and compatible with the required standardized human-horizon protocol. If not verifiable, return false; do not compensate by inventing geometry.

### STRICT OUTPUT
Return only the JSON object required by the response schema. Use image_quadrant="${quadrant}" exactly.`;
}

export interface EvaluatePaperVlmParams {
  imageId: string;
  imageQuadrant: PaperVlmImageQuadrant;
  originalBase64: string;
  originalMimeType?: string;
}

export interface EvaluatePaperVlmResult {
  evaluation: PaperVlmV30Measurement;
  rawText: string;
  modelUsed: string;
  protocolVersion: string;
}

async function parseImageData(
  data: string,
  defaultMime = 'image/jpeg'
): Promise<{ data: string; mimeType: string }> {
  let raw = data.trim();
  let mimeType = defaultMime;
  let buffer: Buffer;

  if (raw.startsWith('data:')) {
    const commaIdx = raw.indexOf(',');
    const prefix = commaIdx >= 0 ? raw.slice(0, commaIdx) : '';
    const body = commaIdx >= 0 ? raw.slice(commaIdx + 1) : raw;
    const mimeMatch = prefix.match(/^data:([^;]+)/);
    if (mimeMatch) mimeType = mimeMatch[1];
    buffer = prefix.includes('base64')
      ? Buffer.from(body.trim(), 'base64')
      : Buffer.from(decodeURIComponent(body), 'utf8');
  } else {
    buffer = Buffer.from(raw, 'base64');
  }

  if (mimeType.includes('svg') || buffer.toString('utf8', 0, 100).includes('<svg')) {
    buffer = await sharp(buffer).png().toBuffer();
    mimeType = 'image/png';
  }

  return { data: buffer.toString('base64'), mimeType };
}

function cleanAndParseJson<T>(rawText: string): T {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch (initialErr) {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    }
    throw initialErr;
  }
}

function validateMeasurement(
  data: PaperVlmV30Measurement,
  expectedQuadrant: PaperVlmImageQuadrant
): void {
  if (data.node_metadata?.image_quadrant !== expectedQuadrant) {
    throw new Error(
      `VLM quadrant mismatch: expected ${expectedQuadrant}, received ${data.node_metadata?.image_quadrant}.`
    );
  }

  const scores = [
    data.natural_environs_imageability?.v_nat_score,
    data.natural_environs_imageability?.gvi_eye_score,
    data.natural_environs_imageability?.gmi_score,
    data.morphological_containment_identity?.v_built_score,
    data.morphological_containment_identity?.canyon_enclosure_ratio,
    data.morphological_containment_identity?.v_sign_score,
    data.physical_utility_dependence?.v_pave_score,
    data.physical_utility_dependence?.gfapi_score,
    data.physical_utility_dependence?.ias_score,
    data.analytical_summary?.perceptual_coherence_index,
    data.analytical_summary?.vlm_confidence_score,
  ];

  for (const value of scores) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
      throw new Error(`Teacher VLM v3.0 output contains an invalid [0,1] score: ${String(value)}`);
    }
  }
}

function getErrorStatus(err: any): number | null {
  if (!err) return null;
  if (typeof err.status === 'number') return err.status;
  if (typeof err.statusCode === 'number') return err.statusCode;
  if (err.response && typeof err.response.status === 'number') return err.response.status;
  const match = String(err.message || err).match(/\b(408|429|500|502|503|504)\b/);
  return match ? Number(match[1]) : null;
}

function isTransientInferenceError(err: any): boolean {
  const status = getErrorStatus(err);
  if (status !== null) return status === 408 || status === 429 || (status >= 500 && status <= 504);
  const msg = String(err?.message || err || '').toLowerCase();
  return (
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('overloaded') ||
    msg.includes('unavailable') ||
    msg.includes('timeout') ||
    msg.includes('deadline exceeded') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout')
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function evaluatePaperVlmV30(
  params: EvaluatePaperVlmParams
): Promise<EvaluatePaperVlmResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemma-4-31b-it';
  const parsedImage = await parseImageData(
    params.originalBase64,
    params.originalMimeType || 'image/jpeg'
  );

  const contents = {
    parts: [
      { text: `ACTIVE PAPER VLM INPUT: ${params.imageId}_ORIGINAL` },
      {
        inlineData: {
          mimeType: parsedImage.mimeType,
          data: parsedImage.data,
        },
      },
      {
        text: buildPaperVlmUserPrompt(params.imageId, params.imageQuadrant),
      },
    ],
  };

  const maxAttempts = 4;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: PAPER_VLM_SYSTEM_INSTRUCTION,
          temperature: 0.2,
          topP: 0.9,
          seed: 42,
          maxOutputTokens: 8192,
          mediaResolution: MediaResolution.MEDIA_RESOLUTION_HIGH,
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          responseMimeType: 'application/json',
          responseSchema: PAPER_VLM_V30_SCHEMA,
        },
      });

      const rawText = response.text || '{}';
      const evaluation = cleanAndParseJson<PaperVlmV30Measurement>(rawText);
      validateMeasurement(evaluation, params.imageQuadrant);

      return {
        evaluation,
        rawText,
        modelUsed: model,
        protocolVersion: PAPER_VLM_PROTOCOL_VERSION,
      };
    } catch (err: any) {
      lastError = err;
      if (!isTransientInferenceError(err) || attempt >= maxAttempts) break;
      await sleep(1500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 500));
    }
  }

  throw new Error(
    `Teacher VLM v3.0 inference failed${getErrorStatus(lastError) ? ` (HTTP ${getErrorStatus(lastError)})` : ''}: ${lastError?.message || lastError}`
  );
}