/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Presentation Screenshot Recovery
 * --------------------------------
 * Explicitly DEMO-ONLY.
 *
 * Screenshot / rendered figures can perturb palette RGB values.
 * This utility snaps an opaque pixel to the nearest frozen taxonomy color
 * only when RGB Euclidean distance <= maxDistance.
 *
 * It never changes the formal research method:
 * publication/research mode still requires the original RGB_CLEAN PNG.
 */

import type {
  V33SegmentationTaxonomy,
} from '../types';

export interface PresentationMaskRecoveryReport {
  dataUrl: string;
  totalOpaquePixels: number;
  exactPixelsBefore: number;
  recoveredPixels: number;
  unresolvedPixels: number;
  exactFractionBefore: number;
  recoveredFractionAfter: number;
  maxDistance: number;
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(
        new Error(
          'Unable to load screenshot-derived mask for presentation recovery.'
        )
      );

    image.src = dataUrl;
  });
}

export async function recoverScreenshotMaskToFrozenPalette(
  dataUrl: string,
  taxonomy: V33SegmentationTaxonomy,
  maxDistance: number = 40
): Promise<PresentationMaskRecoveryReport> {
  const image = await loadImage(dataUrl);

  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', {
    willReadFrequently: true,
  });

  if (!ctx) {
    throw new Error('Canvas 2D context unavailable.');
  }

  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const palette = taxonomy.classes.map((c) => c.rgb);

  const exactKeys = new Set<number>(
    palette.map(
      ([r, g, b]) =>
        (r << 16) |
        (g << 8) |
        b
    )
  );

  const maxDistanceSq = maxDistance * maxDistance;

  let totalOpaquePixels = 0;
  let exactPixelsBefore = 0;
  let recoveredPixels = 0;
  let unresolvedPixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) {
      continue;
    }

    totalOpaquePixels++;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const exactKey =
      (r << 16) |
      (g << 8) |
      b;

    if (exactKeys.has(exactKey)) {
      exactPixelsBefore++;
      recoveredPixels++;
      continue;
    }

    let nearestIndex = -1;
    let nearestDistanceSq = Number.POSITIVE_INFINITY;

    for (let p = 0; p < palette.length; p++) {
      const [pr, pg, pb] = palette[p];

      const dr = r - pr;
      const dg = g - pg;
      const db = b - pb;

      const distanceSq =
        dr * dr +
        dg * dg +
        db * db;

      if (distanceSq < nearestDistanceSq) {
        nearestDistanceSq = distanceSq;
        nearestIndex = p;
      }
    }

    if (
      nearestIndex >= 0 &&
      nearestDistanceSq <= maxDistanceSq
    ) {
      const [nr, ng, nb] = palette[nearestIndex];

      data[i] = nr;
      data[i + 1] = ng;
      data[i + 2] = nb;

      recoveredPixels++;
    } else {
      unresolvedPixels++;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  return {
    dataUrl: canvas.toDataURL('image/png'),
    totalOpaquePixels,
    exactPixelsBefore,
    recoveredPixels,
    unresolvedPixels,
    exactFractionBefore:
      totalOpaquePixels > 0
        ? exactPixelsBefore / totalOpaquePixels
        : 0,
    recoveredFractionAfter:
      totalOpaquePixels > 0
        ? recoveredPixels / totalOpaquePixels
        : 0,
    maxDistance,
  };
}
