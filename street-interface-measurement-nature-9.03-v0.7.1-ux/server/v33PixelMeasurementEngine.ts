/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ============================================================================
 * v3.3-RC1 DETERMINISTIC PIXEL MEASUREMENT ENGINE
 * ============================================================================
 *
 * METHODOLOGICAL PRINCIPLES:
 * 1. Operates exclusively on PRIMARY ANALYTICAL EVIDENCE: PIXEL_CLASSIFICATION.
 *    NEVER inspects Original image for pixel measurements.
 * 2. Requires a validated, researcher-supplied V33SegmentationTaxonomy.
 *    Default state is null / not_configured.
 * 3. Exact RGB matching ONLY. No color tolerance, no nearest-color approximations,
 *    no reverse-engineering of semantic labels.
 * 4. Supports Lossless PNG only. Lossy JPEG/JPG files are explicitly rejected
 *    (UNSUPPORTED_LOSSY_FORMAT) because DCT compression corrupts exact RGB values.
 * 5. Deterministic pixel accounting:
 *    - Valid analytical pixels (fully transparent pixels with alpha=0 are excluded).
 *    - Unmapped pixels are tracked and recorded (not silently guessed).
 *    - Research group aggregations strictly follow taxonomy group memberships.
 * 6. Downstream research variables (GVI_eye, EBC, TEF, SAI, exact H/W, SVF, GFAPI,
 *    GMI, SIM, D(x,y)) remain strictly uncalculated or pending formal specification.
 */

import sharp, { Metadata } from "sharp";
import {
  V33SegmentationTaxonomy,
  V33ResearchPixelGroup,
  V33PixelMeasurementResult,
  V33ClassPixelMeasurement,
  V33GroupPixelMeasurements,
  validateV33Taxonomy,
} from "../src/types";

export interface PixelMeasurementEngineParams {
  pixelClassificationBase64: string;
  pixelClassificationMimeType?: string;
  taxonomy?: V33SegmentationTaxonomy | null;
}

/**
 * Strips data URL prefix if present and returns pure Base64 string.
 */
function cleanBase64(dataUrl: string): string {
  const match = dataUrl.match(/^data:[^;]+;base64,(.+)$/);
  return match ? match[1] : dataUrl;
}

/**
 * Executes deterministic exact-RGB pixel counting on a lossless PNG classification map.
 */
export async function runV33PixelMeasurementEngine(
  params: PixelMeasurementEngineParams
): Promise<V33PixelMeasurementResult> {
  const now = new Date().toISOString();

  // 1. Check Taxonomy Status
  const taxonomyValidation = validateV33Taxonomy(params.taxonomy);
  if (!taxonomyValidation.valid || !taxonomyValidation.taxonomy) {
    return {
      status: taxonomyValidation.status === 'invalid' ? 'processing_error' : 'taxonomy_required',
      status_reason:
        taxonomyValidation.status === 'invalid'
          ? `Invalid taxonomy configuration: ${taxonomyValidation.errors.join('; ')}`
          : 'No documented segmentation taxonomy was provided. Semantic pixel measurements require a configured taxonomy.',
      provenance: {
        source: 'PIXEL_CLASSIFICATION',
        method: 'EXACT RGB TAXONOMY MATCH',
        analysis_roi: 'full_valid_pixel_classification_frame',
        timestamp: now,
      },
      taxonomy: {
        status: taxonomyValidation.status,
        taxonomy_id: null,
        taxonomy_version: null,
        mapping_mode: null,
      },
      image: {
        width_px: 0,
        height_px: 0,
        format: params.pixelClassificationMimeType || 'unknown',
        total_pixel_count: 0,
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
      group_measurements: {
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
      },
      derived_metrics: {
        natural_built_above_ground_ratio: {
          value: null,
          status: 'taxonomy_group_unavailable',
          description: 'Requires configured taxonomy with natural_above_ground and built_above_ground groups',
        },
        sidewalk_paver_ratio: {
          value: null,
          status: 'taxonomy_group_unavailable',
          description: 'Requires configured taxonomy with sidewalk and/or paver groups',
        },
        signboard_detail_ratio: {
          value: null,
          status: 'taxonomy_group_unavailable',
          description: 'Requires configured taxonomy with signboard and architectural_detail groups',
        },
        GVI_eye: {
          value: null,
          status: 'pending_eye_level_roi_definition',
          note: 'Eye-level visual ROI and projection parameters are pending formal teacher definition.',
        },
      },
    };
  }

  const taxonomy = taxonomyValidation.taxonomy;

  // 2. Decode image buffer and inspect format
  const rawBase64 = cleanBase64(params.pixelClassificationBase64);
  const imageBuffer = Buffer.from(rawBase64, 'base64');

  let imageMetadata: Metadata;
  try {
    imageMetadata = await sharp(imageBuffer).metadata();
  } catch (err: any) {
    return createErrorResult(
      'processing_error',
      `Failed to parse image file: ${err?.message || 'Invalid image buffer'}`,
      taxonomy,
      params.pixelClassificationMimeType || 'unknown',
      now
    );
  }

  const detectedFormat = (imageMetadata.format || '').toLowerCase();
  const declaredMime = (params.pixelClassificationMimeType || '').toLowerCase();

  // Lossy JPEG check
  if (
    detectedFormat === 'jpeg' ||
    detectedFormat === 'jpg' ||
    declaredMime.includes('jpeg') ||
    declaredMime.includes('jpg')
  ) {
    return createErrorResult(
      'unsupported_lossy_format',
      'JPEG compression introduces lossy color artifacts that alter exact RGB values. Exact RGB pixel matching requires lossless PNG classification maps.',
      taxonomy,
      'jpeg',
      now
    );
  }

  // Non-PNG format check (SVG, WebP, etc.)
  if (detectedFormat !== 'png') {
    return createErrorResult(
      'unsupported_image_format',
      `Unsupported format "${detectedFormat || declaredMime}". Pixel classification quantitative analysis in Step 6 supports lossless PNG maps only.`,
      taxonomy,
      detectedFormat || declaredMime,
      now
    );
  }

  // 3. Extract raw uncompressed pixel data
  let rawPixels: Buffer;
  let width: number;
  let height: number;
  let channels: number;

  try {
    const rawResult = await sharp(imageBuffer)
      .raw()
      .toBuffer({ resolveWithObject: true });

    rawPixels = rawResult.data;
    width = rawResult.info.width;
    height = rawResult.info.height;
    channels = rawResult.info.channels; // 3 for RGB, 4 for RGBA
  } catch (err: any) {
    return createErrorResult(
      'processing_error',
      `Raster decoding error: ${err?.message || 'Failed to extract raw raster pixels'}`,
      taxonomy,
      'png',
      now
    );
  }

  const totalPixelCount = width * height;

  // 4. Build high-speed exact RGB lookup table
  // Key: (r << 16) | (g << 8) | b
  const colorMap = new Map<number, { class_id: string; index: number }>();
  taxonomy.classes.forEach((c, idx) => {
    const key = (c.rgb[0] << 16) | (c.rgb[1] << 8) | c.rgb[2];
    colorMap.set(key, { class_id: c.class_id, index: idx });
  });

  // Track counts
  const classCounts = new Uint32Array(taxonomy.classes.length);
  let transparentPixelCount = 0;
  let validPixelCount = 0;
  let mappedPixelCount = 0;
  let unmappedPixelCount = 0;

  // 5. Exact RGB Raster Scan
  for (let i = 0; i < rawPixels.length; i += channels) {
    const r = rawPixels[i];
    const g = rawPixels[i + 1];
    const b = rawPixels[i + 2];

    // Check transparency in 4-channel RGBA
    if (channels === 4) {
      const a = rawPixels[i + 3];
      if (a === 0) {
        // Fully transparent pixel: excluded from valid analytical pixels
        transparentPixelCount++;
        continue;
      }
    }

    validPixelCount++;
    const key = (r << 16) | (g << 8) | b;
    const match = colorMap.get(key);

    if (match !== undefined) {
      classCounts[match.index]++;
      mappedPixelCount++;
    } else {
      unmappedPixelCount++;
    }
  }

  const mappedFraction = validPixelCount > 0 ? mappedPixelCount / validPixelCount : 0;
  const unmappedFraction = validPixelCount > 0 ? unmappedPixelCount / validPixelCount : 0;

  // 6. Build Class-Level Measurements
  const classMeasurements: V33ClassPixelMeasurement[] = taxonomy.classes.map((c, idx) => {
    const count = classCounts[idx];
    const fraction = validPixelCount > 0 ? count / validPixelCount : 0;
    return {
      class_id: c.class_id,
      label: c.label,
      rgb: c.rgb,
      research_groups: [...c.research_groups],
      pixel_count: count,
      fraction_of_valid_pixels: Number(fraction.toFixed(6)),
    };
  });

  // 7. Aggregate Research-Group Counts
  // Helper to check if any class defines a group
  const hasGroupInTaxonomy = (group: V33ResearchPixelGroup): boolean => {
    return taxonomy.classes.some((c) => c.research_groups.includes(group));
  };

  const sumGroupPixels = (group: V33ResearchPixelGroup): number | null => {
    if (!hasGroupInTaxonomy(group)) return null;
    let sum = 0;
    taxonomy.classes.forEach((c, idx) => {
      if (c.research_groups.includes(group)) {
        sum += classCounts[idx];
      }
    });
    return sum;
  };

  const groupMeasurements: V33GroupPixelMeasurements = {
    P_natural_above_ground: sumGroupPixels('natural_above_ground'),
    P_built_above_ground: sumGroupPixels('built_above_ground'),
    P_vegetation: sumGroupPixels('vegetation'),
    P_sidewalk: sumGroupPixels('sidewalk'),
    P_paver: sumGroupPixels('paver'),
    P_signboard: sumGroupPixels('signboard'),
    P_architectural_detail: sumGroupPixels('architectural_detail'),
    P_outdoor_seating: sumGroupPixels('outdoor_seating'),
    P_parasol: sumGroupPixels('parasol'),
    P_planter: sumGroupPixels('planter'),
    P_street_furniture: sumGroupPixels('street_furniture'),
  };

  // 8. Derived Research Ratios
  // 8.1 Natural / Built Above-Ground Ratio
  let naturalBuiltRatio: V33PixelMeasurementResult['derived_metrics']['natural_built_above_ground_ratio'];
  if (
    groupMeasurements.P_natural_above_ground !== null &&
    groupMeasurements.P_built_above_ground !== null
  ) {
    const num = groupMeasurements.P_natural_above_ground;
    const den = groupMeasurements.P_built_above_ground;
    if (den === 0) {
      naturalBuiltRatio = {
        value: null,
        status: 'undefined_zero_denominator',
        numerator: num,
        denominator: 0,
        description: 'Built above-ground pixels is zero; ratio is undefined without built vertical hardscape.',
      };
    } else {
      naturalBuiltRatio = {
        value: Number((num / den).toFixed(6)),
        status: 'computed',
        numerator: num,
        denominator: den,
        description: 'P_natural_above_ground / P_built_above_ground',
      };
    }
  } else {
    naturalBuiltRatio = {
      value: null,
      status: 'taxonomy_group_unavailable',
      description: 'Taxonomy does not configure both natural_above_ground and built_above_ground groups.',
    };
  }

  // 8.2 Sidewalk + Paver Ratio
  let sidewalkPaverRatio: V33PixelMeasurementResult['derived_metrics']['sidewalk_paver_ratio'];
  if (
    groupMeasurements.P_sidewalk !== null ||
    groupMeasurements.P_paver !== null
  ) {
    const sumWalk = (groupMeasurements.P_sidewalk ?? 0) + (groupMeasurements.P_paver ?? 0);
    sidewalkPaverRatio = {
      value: validPixelCount > 0 ? Number((sumWalk / validPixelCount).toFixed(6)) : null,
      status: 'computed',
      numerator: sumWalk,
      denominator: validPixelCount,
      description: '(P_sidewalk + P_paver) / P_total (full valid pixel classification frame)',
    };
  } else {
    sidewalkPaverRatio = {
      value: null,
      status: 'taxonomy_group_unavailable',
      description: 'Taxonomy does not configure sidewalk or paver groups.',
    };
  }

  // 8.3 Signboard + Architectural Detail Ratio
  let signboardDetailRatio: V33PixelMeasurementResult['derived_metrics']['signboard_detail_ratio'];
  if (
    groupMeasurements.P_signboard !== null ||
    groupMeasurements.P_architectural_detail !== null
  ) {
    const sumSignDetail =
      (groupMeasurements.P_signboard ?? 0) + (groupMeasurements.P_architectural_detail ?? 0);
    signboardDetailRatio = {
      value: validPixelCount > 0 ? Number((sumSignDetail / validPixelCount).toFixed(6)) : null,
      status: 'computed',
      numerator: sumSignDetail,
      denominator: validPixelCount,
      description: '(P_signboard + P_architectural_detail) / P_total',
    };
  } else {
    signboardDetailRatio = {
      value: null,
      status: 'taxonomy_group_unavailable',
      description: 'Taxonomy does not configure signboard or architectural_detail groups.',
    };
  }

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
      taxonomy_id: taxonomy.taxonomy_id,
      taxonomy_version: taxonomy.taxonomy_version,
      mapping_mode: 'exact_rgb',
    },
    image: {
      width_px: width,
      height_px: height,
      format: 'png',
      total_pixel_count: totalPixelCount,
    },
    coverage: {
      valid_pixel_count: validPixelCount,
      transparent_pixel_count: transparentPixelCount,
      mapped_pixel_count: mappedPixelCount,
      unmapped_pixel_count: unmappedPixelCount,
      mapped_fraction: Number(mappedFraction.toFixed(6)),
      unmapped_fraction: Number(unmappedFraction.toFixed(6)),
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
        note: 'Eye-level visual ROI boundary / projection is not yet formally specified. Whole-image vegetation percentage is not GVI_eye.',
      },
    },
  };
}

function createErrorResult(
  status: V33PixelMeasurementResult['status'],
  statusReason: string,
  taxonomy: V33SegmentationTaxonomy | null,
  format: string,
  timestamp: string
): V33PixelMeasurementResult {
  return {
    status,
    status_reason: statusReason,
    provenance: {
      source: 'PIXEL_CLASSIFICATION',
      method: 'EXACT RGB TAXONOMY MATCH',
      analysis_roi: 'full_valid_pixel_classification_frame',
      timestamp,
    },
    taxonomy: {
      status: taxonomy ? 'configured' : 'not_configured',
      taxonomy_id: taxonomy?.taxonomy_id || null,
      taxonomy_version: taxonomy?.taxonomy_version || null,
      mapping_mode: taxonomy ? 'exact_rgb' : null,
    },
    image: {
      width_px: 0,
      height_px: 0,
      format,
      total_pixel_count: 0,
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
    group_measurements: {
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
    },
    derived_metrics: {
      natural_built_above_ground_ratio: {
        value: null,
        status: 'taxonomy_group_unavailable',
        description: 'Requires valid measurement computation',
      },
      sidewalk_paver_ratio: {
        value: null,
        status: 'taxonomy_group_unavailable',
        description: 'Requires valid measurement computation',
      },
      signboard_detail_ratio: {
        value: null,
        status: 'taxonomy_group_unavailable',
        description: 'Requires valid measurement computation',
      },
      GVI_eye: {
        value: null,
        status: 'pending_eye_level_roi_definition',
        note: 'Eye-level visual ROI and projection parameters are pending formal teacher definition.',
      },
    },
  };
}
