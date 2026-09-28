/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Deterministic Client-Side Exact-RGB Pixel Measurement Engine
 *
 * v0.3 source-integrity rule:
 * - uploaded analytical masks must be true PNG files verified by PNG signature;
 * - filename / MIME labels alone are never sufficient;
 * - built-in SVG sample cases remain runnable only as explicitly labeled
 *   synthetic demonstrations and can never pass the source-PNG provenance audit.
 *
 * Canvas decoding is used only after source-integrity classification.
 */

import {
  V33SegmentationTaxonomy,
  V33PixelMeasurementResult,
  V33ClassPixelMeasurement,
  V33GroupPixelMeasurements,
  validateV33Taxonomy,
  V33DerivedRatioMetric,
  FROZEN_30_CLASS_TAXONOMY,
} from '../types';

export type VisionMaskSourceKind =
  | 'uploaded'
  | 'built_in_sample'
  | 'unknown';

interface VisionMaskSourceMetadata {
  filename?: string | null;
  mimeType?: string | null;
  sourceKind?: VisionMaskSourceKind;
}

function dataUrlMimeType(
  dataUrl: string
): string | null {
  const match =
    dataUrl.match(/^data:([^;,]+)[;,]/i);

  return match?.[1]?.toLowerCase() ?? null;
}

function filenameExtension(
  filename: string | null | undefined
): string | null {
  if (!filename) {
    return null;
  }

  const match =
    filename
      .trim()
      .toLowerCase()
      .match(/\.([a-z0-9]+)$/);

  return match?.[1] ?? null;
}

function decodeBase64Prefix(
  dataUrl: string,
  maxBytes: number
): Uint8Array | null {
  const match =
    dataUrl.match(
      /^data:[^;]+;base64,([a-z0-9+/=]+)/i
    );

  if (!match) {
    return null;
  }

  try {
    const raw =
      atob(match[1].slice(0, 64));

    return Uint8Array.from(
      raw
        .slice(0, maxBytes)
        .split('')
        .map((char) =>
          char.charCodeAt(0)
        )
    );
  } catch {
    return null;
  }
}

function hasPngSignature(
  dataUrl: string
): boolean {
  const bytes =
    decodeBase64Prefix(
      dataUrl,
      8
    );

  if (!bytes || bytes.length < 8) {
    return false;
  }

  const signature = [
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
  ];

  return signature.every(
    (value, index) =>
      bytes[index] === value
  );
}

function hasJpegSignature(
  dataUrl: string
): boolean {
  const bytes =
    decodeBase64Prefix(
      dataUrl,
      3
    );

  return Boolean(
    bytes &&
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  );
}

function emptyGroups(): V33GroupPixelMeasurements {
  return {
    P_natural_above_ground: null,
    P_built_above_ground: null,
    P_vegetation: null,
    P_sidewalk: null,
    P_paver: null,
    P_signboard: null,
    P_architectural_detail: null,
    P_outdoor_seating: null,
    P_parasol: null,
    P_planter: null,
    P_street_furniture: null,
  };
}

function createUnsupportedClientResult(
  status:
    | 'unsupported_lossy_format'
    | 'unsupported_image_format',
  reason: string,
  taxonomy: V33SegmentationTaxonomy,
  metadata: VisionMaskSourceMetadata,
  detectedFormat: string
): V33PixelMeasurementResult {
  const now =
    new Date().toISOString();

  return {
    status,
    status_reason: reason,

    provenance: {
      source: 'PIXEL_CLASSIFICATION',
      method: 'EXACT RGB TAXONOMY MATCH',
      analysis_roi:
        'full_valid_pixel_classification_frame',
      timestamp: now,
    },

    taxonomy: {
      status: 'configured',
      taxonomy_id:
        taxonomy.taxonomy_id,
      taxonomy_version:
        taxonomy.taxonomy_version,
      mapping_mode: 'exact_rgb',
    },

    image: {
      width_px: 0,
      height_px: 0,
      format: detectedFormat,
      total_pixel_count: 0,
      source_filename:
        metadata.filename ?? null,
      source_mime_type:
        metadata.mimeType ?? null,
      source_kind:
        metadata.sourceKind ?? 'unknown',
      source_integrity:
        'rejected_non_png',
      png_signature_verified:
        false,
    },

    coverage: {
      valid_pixel_count: 0,
      transparent_pixel_count: 0,
      mapped_pixel_count: 0,
      unmapped_pixel_count: 0,
      mapped_fraction: 0,
      unmapped_fraction: 0,
    },

    class_measurements: [],
    group_measurements:
      emptyGroups(),

    derived_metrics: {
      natural_built_above_ground_ratio: {
        value: null,
        status:
          'taxonomy_group_unavailable',
        description:
          'Measurement blocked because analytical source integrity failed.',
      },

      sidewalk_paver_ratio: {
        value: null,
        status:
          'taxonomy_group_unavailable',
        description:
          'Measurement blocked because analytical source integrity failed.',
      },

      signboard_detail_ratio: {
        value: null,
        status:
          'taxonomy_group_unavailable',
        description:
          'Measurement blocked because analytical source integrity failed.',
      },

      GVI_eye: {
        value: null,
        status:
          'pending_eye_level_roi_definition',
        note:
          'Eye-level visual ROI and projection parameters remain separately defined.',
      },
    },
  };
}

export async function measureVisionMaskClient(
  imageUrl: string,
  imageId: string = 'IMG_001',
  filename: string = 'mask.png',
  mimeType?: string | null,
  sourceKind: VisionMaskSourceKind = 'uploaded'
): Promise<V33PixelMeasurementResult> {
  return runClientPixelMeasurementEngine(
    imageUrl,
    FROZEN_30_CLASS_TAXONOMY,
    {
      filename,
      mimeType,
      sourceKind,
    }
  );
}

export async function runClientPixelMeasurementEngine(
  imageUrl: string,
  taxonomy: V33SegmentationTaxonomy,
  sourceMetadata: VisionMaskSourceMetadata = {}
): Promise<V33PixelMeasurementResult> {
  const now = new Date().toISOString();

  // Validate taxonomy
  const validation = validateV33Taxonomy(taxonomy);
  if (!validation.valid || !validation.taxonomy) {
    throw new Error(`Taxonomy invalid: ${validation.errors.join('; ')}`);
  }

  const validTaxonomy = validation.taxonomy;

  const declaredMime =
    sourceMetadata.mimeType
      ?.toLowerCase() ??
    null;

  const dataMime =
    dataUrlMimeType(
      imageUrl
    );

  const extension =
    filenameExtension(
      sourceMetadata.filename
    );

  const sourceKind =
    sourceMetadata.sourceKind ??
    'unknown';

  const pngSignatureVerified =
    hasPngSignature(
      imageUrl
    );

  const isSyntheticSvgDemo =
    sourceKind ===
      'built_in_sample' &&
    dataMime ===
      'image/svg+xml';

  const isDeclaredJpeg =
    declaredMime?.includes(
      'jpeg'
    ) ||
    declaredMime?.includes(
      'jpg'
    ) ||
    dataMime?.includes(
      'jpeg'
    ) ||
    dataMime?.includes(
      'jpg'
    ) ||
    extension === 'jpg' ||
    extension === 'jpeg' ||
    hasJpegSignature(
      imageUrl
    );

  if (
    sourceKind !==
      'built_in_sample' &&
    isDeclaredJpeg
  ) {
    return createUnsupportedClientResult(
      'unsupported_lossy_format',
      'Rejected source mask: JPEG/JPG is lossy and can alter exact RGB taxonomy colors. Upload the original lossless PNG classification raster.',
      validTaxonomy,
      sourceMetadata,
      'jpeg'
    );
  }

  if (
    sourceKind !==
      'built_in_sample' &&
    !pngSignatureVerified
  ) {
    return createUnsupportedClientResult(
      'unsupported_image_format',
      `Rejected source mask: the uploaded file does not contain a verified PNG file signature (filename=${sourceMetadata.filename ?? 'unknown'}, MIME=${declaredMime ?? dataMime ?? 'unknown'}). Exact-RGB research measurement accepts source PNG only.`,
      validTaxonomy,
      sourceMetadata,
      dataMime ??
        extension ??
        'unknown'
    );
  }

  if (
    sourceKind !==
      'built_in_sample' &&
    (
      extension !== 'png' ||
      (
        declaredMime !== null &&
        declaredMime !==
          'image/png'
      ) ||
      (
        dataMime !== null &&
        dataMime !==
          'image/png'
      )
    )
  ) {
    return createUnsupportedClientResult(
      'unsupported_image_format',
      `Rejected PNG metadata mismatch: source signature is PNG but filename/MIME provenance is inconsistent (filename=${sourceMetadata.filename ?? 'unknown'}, declared MIME=${declaredMime ?? 'unknown'}, data MIME=${dataMime ?? 'unknown'}).`,
      validTaxonomy,
      sourceMetadata,
      'png_metadata_mismatch'
    );
  }

  if (
    sourceKind ===
      'built_in_sample' &&
    !isSyntheticSvgDemo &&
    !pngSignatureVerified
  ) {
    return createUnsupportedClientResult(
      'unsupported_image_format',
      'Built-in sample source is neither a verified PNG nor the documented synthetic SVG demo format.',
      validTaxonomy,
      sourceMetadata,
      dataMime ??
        extension ??
        'unknown'
    );
  }

  // Load image
  const img = new Image();
  img.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (e) => reject(new Error('Failed to load semantic classification image for raster analysis'));
    img.src = imageUrl;
  });

  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  const totalPixels = width * height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Canvas 2D context creation failed');
  }

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Build exact RGB lookup table
  const rgbMap = new Map<number, { classId: string; index: number }>();
  validTaxonomy.classes.forEach((c, idx) => {
    const key = (c.rgb[0] << 16) | (c.rgb[1] << 8) | c.rgb[2];
    rgbMap.set(key, { classId: c.class_id, index: idx });
  });

  const classCounts = new Array<number>(validTaxonomy.classes.length).fill(0);
  let transparentCount = 0;
  let mappedCount = 0;
  let unmappedCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Transparent pixel exclusion
    if (a === 0) {
      transparentCount++;
      continue;
    }

    const key = (r << 16) | (g << 8) | b;
    const match = rgbMap.get(key);

    if (match !== undefined) {
      classCounts[match.index]++;
      mappedCount++;
    } else {
      unmappedCount++;
    }
  }

  const validPixelCount = totalPixels - transparentCount;
  const mappedFraction = validPixelCount > 0 ? mappedCount / validPixelCount : 0;
  const unmappedFraction = validPixelCount > 0 ? unmappedCount / validPixelCount : 0;

  // Assemble class measurements
  const classMeasurements: V33ClassPixelMeasurement[] = validTaxonomy.classes.map((c, idx) => {
    const count = classCounts[idx];
    const fraction = validPixelCount > 0 ? count / validPixelCount : 0;
    return {
      class_id: c.class_id,
      label: c.label,
      rgb: c.rgb,
      research_groups: [...c.research_groups],
      pixel_count: count,
      fraction_of_valid_pixels: fraction,
    };
  });

  // Group aggregation
  const groupCounts: Record<string, number> = {
    natural_above_ground: 0,
    built_above_ground: 0,
    vegetation: 0,
    sidewalk: 0,
    paver: 0,
    signboard: 0,
    architectural_detail: 0,
    outdoor_seating: 0,
    parasol: 0,
    planter: 0,
    street_furniture: 0,
  };

  classMeasurements.forEach((cm) => {
    cm.research_groups.forEach((g) => {
      if (groupCounts[g] !== undefined) {
        groupCounts[g] += cm.pixel_count;
      }
    });
  });

  const groupMeasurements: V33GroupPixelMeasurements = {
    P_natural_above_ground: groupCounts.natural_above_ground,
    P_built_above_ground: groupCounts.built_above_ground,
    P_vegetation: groupCounts.vegetation,
    P_sidewalk: groupCounts.sidewalk,
    P_paver: groupCounts.paver,
    P_signboard: groupCounts.signboard,
    P_architectural_detail: groupCounts.architectural_detail,
    P_outdoor_seating: groupCounts.outdoor_seating,
    P_parasol: groupCounts.parasol,
    P_planter: groupCounts.planter,
    P_street_furniture: groupCounts.street_furniture,
  };

  // Derived metrics
  let naturalBuiltRatio: V33DerivedRatioMetric;
  const pNat = groupCounts.natural_above_ground;
  const pBuilt = groupCounts.built_above_ground;

  if (pBuilt === 0) {
    naturalBuiltRatio = {
      value: null,
      status: 'undefined_zero_denominator',
      numerator: pNat,
      denominator: 0,
      description: 'P_natural_above_ground / P_built_above_ground (Undefined: Zero vertical built hardscape pixels)',
    };
  } else {
    naturalBuiltRatio = {
      value: Number((pNat / pBuilt).toFixed(4)),
      status: 'computed',
      numerator: pNat,
      denominator: pBuilt,
      description: 'P_natural_above_ground / P_built_above_ground',
    };
  }

  const pSide = groupCounts.sidewalk;
  const pPaver = groupCounts.paver;
  const sidewalkPaverRatio: V33DerivedRatioMetric = {
    value: validPixelCount > 0 ? Number(((pSide + pPaver) / validPixelCount).toFixed(4)) : null,
    status: 'computed',
    numerator: pSide + pPaver,
    denominator: validPixelCount,
    description: '(P_sidewalk + P_paver) / P_total_valid',
  };

  const pSign = groupCounts.signboard;
  const pDetail = groupCounts.architectural_detail;
  const signboardDetailRatio: V33DerivedRatioMetric = {
    value: validPixelCount > 0 ? Number(((pSign + pDetail) / validPixelCount).toFixed(4)) : null,
    status: 'computed',
    numerator: pSign + pDetail,
    denominator: validPixelCount,
    description: '(P_signboard + P_architectural_detail) / P_total_valid',
  };

  return {
    status: 'computed',
    provenance: {
      source: 'PIXEL_CLASSIFICATION',
      method: 'EXACT RGB TAXONOMY MATCH',
      analysis_roi: 'full_valid_pixel_classification_frame',
      timestamp: now,
    },
    taxonomy: {
      status: 'configured',
      taxonomy_id: validTaxonomy.taxonomy_id,
      taxonomy_version: validTaxonomy.taxonomy_version,
      mapping_mode: 'exact_rgb',
    },
    image: {
      width_px: width,
      height_px: height,

      // Never infer source PNG merely because Canvas produced raster pixels.
      format:
        pngSignatureVerified
          ? 'png'
          : isSyntheticSvgDemo
          ? 'svg'
          : 'unknown',

      total_pixel_count:
        totalPixels,

      source_filename:
        sourceMetadata.filename ??
        null,

      source_mime_type:
        declaredMime ??
        dataMime,

      source_kind:
        sourceKind,

      source_integrity:
        pngSignatureVerified
          ? 'verified_png_signature'
          : isSyntheticSvgDemo
          ? 'synthetic_demo_rasterized_from_svg'
          : 'unknown',

      png_signature_verified:
        pngSignatureVerified,
    },
    coverage: {
      valid_pixel_count: validPixelCount,
      transparent_pixel_count: transparentCount,
      mapped_pixel_count: mappedCount,
      unmapped_pixel_count: unmappedCount,
      mapped_fraction: mappedFraction,
      unmapped_fraction: unmappedFraction,
    },
    class_measurements: classMeasurements,
    group_measurements: groupMeasurements,
    derived_metrics: {
      natural_built_above_ground_ratio: naturalBuiltRatio,
      sidewalk_paver_ratio: sidewalkPaverRatio,
      signboard_detail_ratio: signboardDetailRatio,
      GVI_eye: {
        value: null,
        status: 'pending_eye_level_roi_definition',
        note: 'Eye-level visual ROI and projection parameters are pending formal teacher definition.',
      },
    },
  };
}
