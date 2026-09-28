/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import { VlmStreetscapeEvaluationV31, MechanicalAuditResult } from '../types';

export function downloadJsonFile(data: any, filename: string) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportEvaluationToCsv(
  evaluation: VlmStreetscapeEvaluationV31,
  mechanicalAudit: MechanicalAuditResult,
  filename = `vlm_streetscape_${evaluation.image_id || 'evaluation'}.csv`
) {
  const rowData: Record<string, any> = {
    image_id: evaluation.image_id,

    // Scores
    eye_level_greenery_score_primary: evaluation.eye_level_greenery_score_primary,
    eye_level_greenery_score_final: evaluation.eye_level_greenery_score,
    framing_score_primary: evaluation.framing_score_primary,
    framing_score_final: evaluation.framing_score,
    place_identity_score_primary: evaluation.place_identity_score_primary,
    place_identity_score_final: evaluation.place_identity_score,
    place_attachment_score_primary: evaluation.place_attachment_score_primary,
    place_attachment_score_final: evaluation.place_attachment_score,
    place_dependence_score_primary: evaluation.place_dependence_score_primary,
    place_dependence_score_final: evaluation.place_dependence_score,

    // Greenery
    greenery_types: Array.isArray(evaluation.greenery_types)
      ? evaluation.greenery_types.join('; ')
      : evaluation.greenery_types,
    greenery_vertical_position: evaluation.greenery_vertical_position,
    eye_level_greenery_rationale: evaluation.eye_level_greenery_rationale,
    greenery_confidence: evaluation.greenery_confidence,

    // Edge
    barrier_present: evaluation.barrier_present,
    edge_type: evaluation.edge_type,
    edge_spatial_relationship: evaluation.edge_spatial_relationship,
    buffering_quality: evaluation.buffering_quality,
    lingering_affordance: evaluation.lingering_affordance,
    edge_effect_rationale: evaluation.edge_effect_rationale,
    edge_confidence: evaluation.edge_confidence,

    // Enclosure
    street_wall_continuity: evaluation.street_wall_continuity,
    building_vertical_presence: evaluation.building_vertical_presence,
    sky_exposure: evaluation.sky_exposure,
    setback_openness: evaluation.setback_openness,
    vegetation_enclosure: evaluation.vegetation_enclosure,
    perceived_hw_ratio: evaluation.perceived_hw_ratio,
    enclosure_rationale: evaluation.enclosure_rationale,
    enclosure_confidence: evaluation.enclosure_confidence,

    // Sense of Place
    place_identity_rationale: evaluation.place_identity_rationale,
    place_identity_confidence: evaluation.place_identity_confidence,
    place_attachment_rationale: evaluation.place_attachment_rationale,
    place_attachment_confidence: evaluation.place_attachment_confidence,
    place_dependence_rationale: evaluation.place_dependence_rationale,
    place_dependence_confidence: evaluation.place_dependence_confidence,

    // Audit
    original_secondary_contribution: evaluation.original_secondary_contribution,
    original_only_observations: evaluation.original_only_observations,
    classification_limitations: evaluation.classification_limitations,
    score_change_summary: evaluation.score_change_summary,
    original_only_evidence_used_for_score: evaluation.original_only_evidence_used_for_score,
    model_audit_status: evaluation.audit_status,
    mechanical_audit_status: mechanicalAudit.overallStatus,
    uncertainty: evaluation.uncertainty,
    primary_evidence_summary: evaluation.primary_evidence_summary
  };

  const headers = Object.keys(rowData);
  const values = headers.map((h) => {
    const val = rowData[h];
    if (val === undefined || val === null) return '""';
    return `"${String(val).replace(/"/g, '""')}"`;
  });

  const csvContent = `${headers.join(',')}\n${values.join(',')}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function waitForAssets(element: HTMLElement) {
  try {
    if ((document as any).fonts?.ready) {
      await (document as any).fonts.ready;
    }
  } catch {
    // Font readiness is non-fatal.
  }

  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        })
    )
  );
}

interface ExportDisclosureState {
  element: HTMLDetailsElement;
  wasOpen: boolean;
  hadOpenAttribute: boolean;
}

/**
 * PDF-only layout preparation.
 *
 * Step 16C expanded <details> only inside html2canvas's cloned DOM. That made
 * the captured canvas taller than the live DOM used by collectDomBreakCandidates,
 * so page-break coordinates could no longer match the rendered canvas.
 *
 * Step 16D temporarily expands ONLY opt-in disclosures in the REAL DOM,
 * waits for layout, captures the canvas AND computes DOM break candidates from
 * the same geometry, then restores every disclosure to its original state.
 *
 * The user never has to manually open anything and the live APP returns to the
 * exact open/closed state it had before export.
 */
function expandMarkedDisclosuresForExport(
  root: HTMLElement
): ExportDisclosureState[] {
  const details =
    Array.from(
      root.querySelectorAll<HTMLDetailsElement>(
        'details[data-export-expand="true"]'
      )
    );

  return details.map(
    (element) => {
      const state: ExportDisclosureState = {
        element,
        wasOpen: element.open,
        hadOpenAttribute:
          element.hasAttribute('open'),
      };

      element.open = true;
      element.setAttribute('open', '');
      element.setAttribute(
        'data-export-expanded',
        'true'
      );

      return state;
    }
  );
}

function restoreMarkedDisclosuresAfterExport(
  states: ExportDisclosureState[]
) {
  states.forEach(
    ({
      element,
      wasOpen,
      hadOpenAttribute,
    }) => {
      element.open =
        wasOpen;

      element.removeAttribute(
        'data-export-expanded'
      );

      if (
        hadOpenAttribute
      ) {
        element.setAttribute(
          'open',
          ''
        );
      } else if (
        !wasOpen
      ) {
        element.removeAttribute(
          'open'
        );
      }
    }
  );
}

async function waitForStableLayout(
  root: HTMLElement
): Promise<void> {
  /**
   * Native <details> expansion and Tailwind layout can settle over the next
   * animation frame. Two frames makes the DOM geometry deterministic before
   * html2canvas and pagination inspect it.
   */
  await new Promise<void>(
    (resolve) =>
      requestAnimationFrame(
        () =>
          requestAnimationFrame(
            () => resolve()
          )
      )
  );

  await waitForAssets(
    root
  );
}

async function captureElement(
  element: HTMLElement
): Promise<HTMLCanvasElement> {
  return html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });
}

/**
 * Capture a report region with all export-marked disclosures expanded, and
 * derive page-break candidates from that SAME expanded DOM geometry.
 *
 * This is the key Step 16D invariant:
 *
 *   DOM geometry used for pagination === DOM geometry used for capture
 */
async function capturePdfRegion(
  element: HTMLElement
): Promise<{
  canvas: HTMLCanvasElement;
  candidates: PdfBreakCandidate[];
}> {
  const states =
    expandMarkedDisclosuresForExport(
      element
    );

  try {
    await waitForStableLayout(
      element
    );

    const canvas =
      await captureElement(
        element
      );

    const candidates =
      collectDomBreakCandidates(
        element,
        canvas
      );

    return {
      canvas,
      candidates,
    };
  } finally {
    restoreMarkedDisclosuresAfterExport(
      states
    );
  }
}

export async function exportElementAsPng(
  elementId: string,
  filename = 'streetscape_report.png'
) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found for PNG export.`);
  }

  await waitForAssets(element);
  const canvas = await captureElement(element);

  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


/**
 * BLOCK-AWARE UNIFORM-SCALE PDF EXPORT
 *
 * Step 16G retains Step 16D's stable expanded-layout capture and adds
 * orphan-tail rebalancing.
 *
 * The remaining defect after Step 16D was not a truly blank PDF page:
 * a very short final DOM block (for example one audit/disclaimer card) could
 * become a standalone continuation page. That produced a visually almost
 * empty page even though content was technically present.
 *
 * Step 16G detects a short final continuation slice and moves the preceding
 * complete DOM block onto that final page when a safe boundary exists.
 * No research content is dropped and width scale stays uniform.
 *
 * Core rules:
 * 1. Width scale is still fixed across the whole report.
 * 2. Page breaks prefer REAL DOM block boundaries rather than pixel whitespace.
 * 3. Candidate boundaries are collected from:
 *    - direct children of each data-pdf-page stage
 *    - sections/articles/details
 *    - common card/panel containers
 * 4. A page break is accepted only if it fills a useful portion of the page.
 * 5. If one indivisible block is taller than an A4 body, the exporter falls
 *    back to a quiet visual boundary inside that oversized block.
 * 6. Near-empty continuation slices are skipped.
 *
 * This changes presentation only. Research state/calculation is untouched.
 */

interface PdfBreakCandidate {
  yPx: number;
  priority: number;
}

function createCanvasSlice(
  source: HTMLCanvasElement,
  sourceY: number,
  sourceHeight: number
): HTMLCanvasElement {
  const slice =
    document.createElement('canvas');

  slice.width =
    source.width;

  slice.height =
    Math.max(
      1,
      Math.ceil(
        sourceHeight
      )
    );

  const ctx =
    slice.getContext(
      '2d'
    );

  if (!ctx) {
    throw new Error(
      'Unable to create PDF canvas slice.'
    );
  }

  ctx.fillStyle =
    '#ffffff';

  ctx.fillRect(
    0,
    0,
    slice.width,
    slice.height
  );

  ctx.drawImage(
    source,
    0,
    sourceY,
    source.width,
    sourceHeight,
    0,
    0,
    source.width,
    sourceHeight
  );

  return slice;
}

/**
 * Returns true when a rendered slice contains meaningful visible content.
 * This prevents accidental mostly-empty continuation pages.
 */
function canvasHasMeaningfulContent(
  canvas: HTMLCanvasElement,
  minimumInkFraction = 0.0015
): boolean {
  const ctx =
    canvas.getContext(
      '2d',
      {
        willReadFrequently:
          true,
      }
    );

  if (!ctx) {
    return true;
  }

  const sampleWidth =
    Math.min(
      canvas.width,
      240
    );

  const sampleHeight =
    Math.min(
      canvas.height,
      320
    );

  const sx =
    canvas.width /
    sampleWidth;

  const sy =
    canvas.height /
    sampleHeight;

  let ink =
    0;

  let samples =
    0;

  for (
    let y = 0;
    y < sampleHeight;
    y += 3
  ) {
    for (
      let x = 0;
      x < sampleWidth;
      x += 3
    ) {
      const px =
        Math.min(
          canvas.width - 1,
          Math.floor(
            x *
            sx
          )
        );

      const py =
        Math.min(
          canvas.height - 1,
          Math.floor(
            y *
            sy
          )
        );

      const pixel =
        ctx.getImageData(
          px,
          py,
          1,
          1
        ).data;

      samples++;

      if (
        pixel[0] < 245 ||
        pixel[1] < 245 ||
        pixel[2] < 245
      ) {
        ink++;
      }
    }
  }

  return (
    samples === 0 ||
    ink / samples >=
      minimumInkFraction
  );
}

/**
 * Pixel fallback used ONLY when a single DOM block itself exceeds one A4 body.
 */
/**
 * Detect whether a slice has content distributed over a meaningful vertical
 * range. A tiny separator/border artifact near one edge should not create an
 * otherwise blank PDF continuation page.
 */
function canvasHasUsefulVerticalExtent(
  canvas: HTMLCanvasElement
): boolean {
  const ctx =
    canvas.getContext(
      '2d',
      {
        willReadFrequently:
          true,
      }
    );

  if (!ctx) {
    return true;
  }

  const sampleX =
    Math.min(
      220,
      canvas.width
    );

  const sampleY =
    Math.min(
      360,
      canvas.height
    );

  const scaleX =
    canvas.width /
    sampleX;

  const scaleY =
    canvas.height /
    sampleY;

  let firstInkY:
    number | null =
    null;

  let lastInkY:
    number | null =
    null;

  let inkRows =
    0;

  for (
    let y = 0;
    y < sampleY;
    y += 2
  ) {
    let rowHasInk =
      false;

    for (
      let x = 0;
      x < sampleX;
      x += 3
    ) {
      const px =
        Math.min(
          canvas.width - 1,
          Math.floor(
            x *
            scaleX
          )
        );

      const py =
        Math.min(
          canvas.height - 1,
          Math.floor(
            y *
            scaleY
          )
        );

      const pixel =
        ctx.getImageData(
          px,
          py,
          1,
          1
        ).data;

      if (
        pixel[0] < 242 ||
        pixel[1] < 242 ||
        pixel[2] < 242
      ) {
        rowHasInk =
          true;

        break;
      }
    }

    if (
      rowHasInk
    ) {
      if (
        firstInkY ===
        null
      ) {
        firstInkY =
          y;
      }

      lastInkY =
        y;

      inkRows++;
    }
  }

  if (
    firstInkY ===
      null ||
    lastInkY ===
      null
  ) {
    return false;
  }

  const verticalExtent =
    lastInkY -
    firstInkY;

  return (
    inkRows >=
      3 &&
    verticalExtent >=
      4
  );
}

function findQuietSliceBoundary(
  canvas: HTMLCanvasElement,
  idealY: number,
  minimumY: number,
  maximumY: number
): number {
  const ctx =
    canvas.getContext(
      '2d',
      {
        willReadFrequently:
          true,
      }
    );

  if (!ctx) {
    return idealY;
  }

  const start =
    Math.max(
      minimumY,
      Math.floor(
        idealY - 100
      )
    );

  const end =
    Math.min(
      maximumY,
      Math.ceil(
        idealY
      )
    );

  if (
    end <= start
  ) {
    return idealY;
  }

  const image =
    ctx.getImageData(
      0,
      start,
      canvas.width,
      end - start
    );

  const stepX =
    Math.max(
      1,
      Math.floor(
        canvas.width /
        260
      )
    );

  let bestY =
    idealY;

  let bestScore =
    Number.POSITIVE_INFINITY;

  for (
    let localY = 0;
    localY < end - start;
    localY += 2
  ) {
    let ink =
      0;

    for (
      let x = 0;
      x < canvas.width;
      x += stepX
    ) {
      const index =
        (
          localY *
            canvas.width +
          x
        ) *
        4;

      const r =
        image.data[
          index
        ];

      const g =
        image.data[
          index + 1
        ];

      const b =
        image.data[
          index + 2
        ];

      if (
        r < 242 ||
        g < 242 ||
        b < 242
      ) {
        ink++;
      }
    }

    const absoluteY =
      start +
      localY;

    const distancePenalty =
      Math.abs(
        idealY -
        absoluteY
      ) *
      0.03;

    const score =
      ink +
      distancePenalty;

    if (
      score <
      bestScore
    ) {
      bestScore =
        score;

      bestY =
        absoluteY;
    }
  }

  return Math.max(
    minimumY,
    Math.min(
      bestY,
      maximumY
    )
  );
}

function isVisibleElement(
  element: HTMLElement
): boolean {
  const rect =
    element.getBoundingClientRect();

  if (
    rect.width <= 1 ||
    rect.height <= 1
  ) {
    return false;
  }

  const style =
    window.getComputedStyle(
      element
    );

  return (
    style.display !==
      'none' &&
    style.visibility !==
      'hidden' &&
    Number(
      style.opacity ||
        '1'
    ) >
      0
  );
}

/**
 * Collect DOM boundaries that are safe places to end a PDF page.
 *
 * priority:
 * 4 = explicit pdf block / direct stage child
 * 3 = section/article/details
 * 2 = strong card/panel container
 * 1 = ordinary large block
 */
function collectDomBreakCandidates(
  stage: HTMLElement,
  canvas: HTMLCanvasElement
): PdfBreakCandidate[] {
  const stageRect =
    stage.getBoundingClientRect();

  if (
    stageRect.height <= 0
  ) {
    return [];
  }

  const canvasPerCssY =
    canvas.height /
    stageRect.height;

  const candidates:
    PdfBreakCandidate[] =
    [];

  const pushBoundary = (
    element:
      HTMLElement,
    priority:
      number
  ) => {
    if (
      !isVisibleElement(
        element
      )
    ) {
      return;
    }

    const rect =
      element.getBoundingClientRect();

    const relativeBottom =
      rect.bottom -
      stageRect.top;

    const relativeTop =
      rect.top -
      stageRect.top;

    // Ignore tiny / out-of-stage geometry.
    if (
      relativeBottom <= 4 ||
      relativeTop >=
        stageRect.height
    ) {
      return;
    }

    candidates.push({
      yPx:
        Math.max(
          0,
          Math.min(
            canvas.height,
            Math.round(
              relativeBottom *
              canvasPerCssY
            )
          )
        ),

      priority,
    });
  };

  // Highest-value boundaries: every direct child of a research stage.
  Array.from(
    stage.children
  ).forEach(
    (child) => {
      if (
        child instanceof
        HTMLElement
      ) {
        pushBoundary(
          child,
          4
        );
      }
    }
  );

  const descendants =
    Array.from(
      stage.querySelectorAll<HTMLElement>(
        [
          '[data-pdf-block]',
          'section',
          'article',
          'details',
          '.rounded-xl',
          '.rounded-lg',
          '.rounded-md',
        ].join(',')
      )
    );

  descendants.forEach(
    (element) => {
      const isExplicit =
        element.hasAttribute(
          'data-pdf-block'
        );

      const tag =
        element.tagName.toLowerCase();

      const priority =
        isExplicit
          ? 4
          : (
              tag ===
                'section' ||
              tag ===
                'article' ||
              tag ===
                'details'
            )
          ? 3
          : 2;

      pushBoundary(
        element,
        priority
      );
    }
  );

  // Deduplicate nearby candidates and retain the stronger priority.
  const sorted =
    candidates
      .filter(
        (candidate) =>
          candidate.yPx >
            8 &&
          candidate.yPx <
            canvas.height -
              4
      )
      .sort(
        (
          a,
          b
        ) =>
          a.yPx -
          b.yPx ||
          b.priority -
          a.priority
      );

  const deduped:
    PdfBreakCandidate[] =
    [];

  sorted.forEach(
    (candidate) => {
      const previous =
        deduped[
          deduped.length -
            1
        ];

      if (
        previous &&
        Math.abs(
          previous.yPx -
          candidate.yPx
        ) <=
          5
      ) {
        if (
          candidate.priority >
          previous.priority
        ) {
          deduped[
            deduped.length -
              1
          ] =
            candidate;
        }

        return;
      }

      deduped.push(
        candidate
      );
    }
  );

  return deduped;
}

/**
 * Choose the latest safe DOM boundary before the page limit.
 *
 * The candidate must use at least 58% of the page body so we do not create
 * awkward tiny pages merely to preserve one card.
 */
function chooseDomBoundary(
  candidates: PdfBreakCandidate[],
  sourceY: number,
  idealEndY: number,
  maxSliceHeightPx: number
): number | null {
  const minimumUsefulEnd =
    sourceY +
    maxSliceHeightPx *
      0.58;

  const eligible =
    candidates.filter(
      (candidate) =>
        candidate.yPx >
          minimumUsefulEnd &&
        candidate.yPx <=
          idealEndY - 4
    );

  if (
    eligible.length ===
    0
  ) {
    return null;
  }

  // Prefer strongest boundary class, but stay close to the bottom of the page.
  const scored =
    eligible.map(
      (candidate) => {
        const unused =
          idealEndY -
          candidate.yPx;

        // One priority point can compensate for ~8% page-height whitespace.
        const score =
          unused -
          candidate.priority *
            maxSliceHeightPx *
            0.08;

        return {
          ...candidate,
          score,
        };
      }
    );

  scored.sort(
    (
      a,
      b
    ) =>
      a.score -
      b.score
  );

  return (
    scored[0]
      ?.yPx ??
    null
  );
}


interface PdfSliceRange {
  sourceY: number;
  heightPx: number;
}

/**
 * Build the same block-aware slice plan that Step 16D used, but do not write
 * PDF pages yet. Keeping the slice plan in memory lets us inspect the FINAL
 * continuation page and correct orphan tails before jsPDF pages are created.
 */
function buildStageSliceRanges(
  canvas: HTMLCanvasElement,
  breakCandidates: PdfBreakCandidate[],
  maxSliceHeightPx: number
): PdfSliceRange[] {
  const ranges:
    PdfSliceRange[] =
    [];

  let sourceY =
    0;

  let safety =
    0;

  while (
    sourceY <
      canvas.height -
        2 &&
    safety <
      200
  ) {
    safety++;

    const remaining =
      canvas.height -
      sourceY;

    let sliceHeightPx =
      Math.min(
        maxSliceHeightPx,
        remaining
      );

    if (
      remaining >
      maxSliceHeightPx
    ) {
      const idealEndY =
        sourceY +
        maxSliceHeightPx;

      const domBoundary =
        chooseDomBoundary(
          breakCandidates,
          sourceY,
          idealEndY,
          maxSliceHeightPx
        );

      if (
        domBoundary !==
        null
      ) {
        sliceHeightPx =
          domBoundary -
          sourceY;
      } else {
        const quietBoundary =
          findQuietSliceBoundary(
            canvas,
            idealEndY,
            sourceY +
              Math.floor(
                maxSliceHeightPx *
                  0.72
              ),
            idealEndY
          );

        sliceHeightPx =
          Math.max(
            1,
            quietBoundary -
              sourceY
          );
      }
    }

    // Guard against pathological zero/tiny progress.
    if (
      sliceHeightPx <
        20 &&
      remaining >
        20
    ) {
      sliceHeightPx =
        Math.min(
          maxSliceHeightPx,
          remaining
        );
    }

    ranges.push({
      sourceY,
      heightPx:
        sliceHeightPx,
    });

    sourceY +=
      sliceHeightPx;
  }

  return ranges;
}

/**
 * Prevent a short last block from becoming an almost-empty standalone page.
 *
 * Example from the Step 16F report:
 *
 *   previous page:
 *     Stayability + Live Method Gate Audit
 *
 *   orphan page:
 *     one 156 px audit disclaimer
 *
 * Instead of deleting the disclaimer, move the previous COMPLETE DOM block
 * boundary upward so the final page contains a coherent block group:
 *
 *     Live Method Gate Audit + disclaimer
 *
 * Rules:
 * - Only rebalance when the final slice is < 20% of an A4 body.
 * - The new previous page must remain >= 50% full.
 * - The new final page should preferably be >= 28% full.
 * - The final page must still fit within one A4 body.
 * - Only real DOM boundaries are used; no arbitrary cut through a card.
 */
function rebalanceShortFinalSlice(
  ranges: PdfSliceRange[],
  breakCandidates: PdfBreakCandidate[],
  canvas: HTMLCanvasElement,
  maxSliceHeightPx: number
): PdfSliceRange[] {
  if (
    ranges.length <
    2
  ) {
    return ranges;
  }

  const last =
    ranges[
      ranges.length -
        1
    ];

  const previous =
    ranges[
      ranges.length -
        2
    ];

  const lastFill =
    last.heightPx /
    maxSliceHeightPx;

  if (
    lastFill >=
    0.20
  ) {
    return ranges;
  }

  const oldSplit =
    last.sourceY;

  const previousStart =
    previous.sourceY;

  const minimumPreviousEnd =
    previousStart +
    maxSliceHeightPx *
      0.50;

  // New tail must fit on one page.
  const minimumTailStart =
    canvas.height -
    maxSliceHeightPx;

  // Prefer at least 28% fill on the repaired final page.
  const preferredMaximumTailStart =
    canvas.height -
    maxSliceHeightPx *
      0.28;

  const eligible =
    breakCandidates.filter(
      (candidate) =>
        candidate.yPx >
          Math.max(
            minimumPreviousEnd,
            minimumTailStart
          ) &&
        candidate.yPx <
          oldSplit -
            8
    );

  if (
    eligible.length ===
    0
  ) {
    return ranges;
  }

  const targetFinalFill =
    0.36;

  const targetSplit =
    canvas.height -
    maxSliceHeightPx *
      targetFinalFill;

  const scored =
    eligible.map(
      (candidate) => {
        const finalHeight =
          canvas.height -
          candidate.yPx;

        const finalFill =
          finalHeight /
          maxSliceHeightPx;

        // Prefer a readable final page around 36%, while rewarding stronger
        // DOM boundaries. Heavy penalty if still below 28%.
        const underfillPenalty =
          finalFill <
            0.28
            ? (
                0.28 -
                finalFill
              ) *
              maxSliceHeightPx *
              5
            : 0;

        const distancePenalty =
          Math.abs(
            candidate.yPx -
            targetSplit
          );

        const priorityBonus =
          candidate.priority *
          maxSliceHeightPx *
          0.035;

        return {
          candidate,
          score:
            distancePenalty +
            underfillPenalty -
            priorityBonus,
        };
      }
    );

  scored.sort(
    (
      a,
      b
    ) =>
      a.score -
      b.score
  );

  const chosen =
    scored[0]
      ?.candidate;

  if (!chosen) {
    return ranges;
  }

  const newSplit =
    chosen.yPx;

  const newPreviousHeight =
    newSplit -
    previousStart;

  const newLastHeight =
    canvas.height -
    newSplit;

  if (
    newPreviousHeight <
      maxSliceHeightPx *
        0.50 ||
    newLastHeight >
      maxSliceHeightPx ||
    newLastHeight <
      40
  ) {
    return ranges;
  }

  return [
    ...ranges.slice(
      0,
      -2
    ),

    {
      sourceY:
        previousStart,

      heightPx:
        newPreviousHeight,
    },

    {
      sourceY:
        newSplit,

      heightPx:
        newLastHeight,
    },
  ];
}

export async function exportElementAsPdf(
  elementId: string,
  filename =
    'streetscape_report.pdf'
) {
  const report =
    document.getElementById(
      elementId
    );

  if (!report) {
    throw new Error(
      `Element with id "${elementId}" not found for PDF export.`
    );
  }

  await waitForAssets(
    report
  );

  const stageGroups =
    Array.from(
      report.querySelectorAll<HTMLElement>(
        ':scope > [data-pdf-page]'
      )
    ).sort(
      (
        a,
        b
      ) => {
        const aPage =
          Number(
            a.dataset.pdfPage ||
              '0'
          );

        const bPage =
          Number(
            b.dataset.pdfPage ||
              '0'
          );

        return (
          aPage -
          bPage
        );
      }
    );

  const pdf =
    new jsPDF({
      orientation:
        'portrait',

      unit:
        'mm',

      format:
        'a4',

      compress:
        true,
    });

  const pageWidthMm =
    pdf.internal.pageSize.getWidth();

  const pageHeightMm =
    pdf.internal.pageSize.getHeight();

  const marginLeftMm =
    12;

  const marginRightMm =
    12;

  const marginTopMm =
    12;

  const marginBottomMm =
    14;

  const contentWidthMm =
    pageWidthMm -
    marginLeftMm -
    marginRightMm;

  const contentHeightMm =
    pageHeightMm -
    marginTopMm -
    marginBottomMm;

  let pagesWritten =
    0;

  const addStageCanvas =
    (
      canvas:
        HTMLCanvasElement,
      breakCandidates:
        PdfBreakCandidate[]
    ) => {
      if (
        canvas.width <= 0 ||
        canvas.height <= 0
      ) {
        return;
      }

      // WIDTH-ONLY scale keeps typography/cards uniform throughout the report.
      const pxPerMm =
        canvas.width /
        contentWidthMm;

      const maxSliceHeightPx =
        Math.max(
          1,
          Math.floor(
            contentHeightMm *
            pxPerMm
          )
        );

      const initialRanges =
        buildStageSliceRanges(
          canvas,
          breakCandidates,
          maxSliceHeightPx
        );

      const ranges =
        rebalanceShortFinalSlice(
          initialRanges,
          breakCandidates,
          canvas,
          maxSliceHeightPx
        );

      ranges.forEach(
        (
          range,
          rangeIndex
        ) => {
          const slice =
            createCanvasSlice(
              canvas,
              range.sourceY,
              range.heightPx
            );

          /**
           * A short continuation is allowed after orphan rebalancing because
           * it should now contain a coherent DOM block group. The existing
           * ink/vertical checks still prevent truly empty slices.
           */
          if (
            !canvasHasMeaningfulContent(
              slice
            ) ||
            !canvasHasUsefulVerticalExtent(
              slice
            )
          ) {
            return;
          }

          if (
            pagesWritten >
            0
          ) {
            pdf.addPage();
          }

          pagesWritten++;

          const renderHeightMm =
            slice.height /
            pxPerMm;

          pdf.addImage(
            slice.toDataURL(
              'image/png'
            ),
            'PNG',
            marginLeftMm,
            marginTopMm,
            contentWidthMm,
            renderHeightMm,
            undefined,
            'FAST'
          );
        }
      );
    };

  if (
    stageGroups.length >
    0
  ) {
    for (
      const stage
      of stageGroups
    ) {
      const {
        canvas,
        candidates,
      } =
        await capturePdfRegion(
          stage
        );

      addStageCanvas(
        canvas,
        candidates
      );
    }
  } else {
    // Migration fallback if explicit research stages are absent.
    const {
      canvas,
      candidates,
    } =
      await capturePdfRegion(
        report
      );

    addStageCanvas(
      canvas,
      candidates
    );
  }

  if (
    pagesWritten ===
    0
  ) {
    throw new Error(
      'Report export produced no visible PDF pages.'
    );
  }

  const totalPages =
    pdf.getNumberOfPages();

  for (
    let pageNo = 1;
    pageNo <= totalPages;
    pageNo++
  ) {
    pdf.setPage(
      pageNo
    );

    pdf.setDrawColor(
      226,
      226,
      226
    );

    pdf.line(
      marginLeftMm,
      pageHeightMm -
        10,
      pageWidthMm -
        marginRightMm,
      pageHeightMm -
        10
    );

    pdf.setFont(
      'helvetica',
      'normal'
    );

    pdf.setFontSize(
      7
    );

    pdf.setTextColor(
      115,
      115,
      115
    );

    pdf.text(
      'Street Interface Measurement - Nature 9.03 Final · No-Omega v0.7.1-UX1.3 — Simplified Workflow Candidate',
      marginLeftMm,
      pageHeightMm -
        5.5
    );

    pdf.text(
      `${pageNo} / ${totalPages}`,
      pageWidthMm -
        marginRightMm,
      pageHeightMm -
        5.5,
      {
        align:
          'right',
      }
    );
  }

  pdf.save(
    filename
  );
}

