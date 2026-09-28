/**
 * Nature 9.02 manuscript alignment registry.
 *
 * This file stores manuscript REFERENCE protocol values and benchmark
 * diagnostics. It does not imply that the current APP run has reproduced
 * those empirical results.
 */

export const NATURE_902_PROTOCOL_VERSION =
  'nature_9_02_manuscript_alignment_v0.4';

export const NATURE_902_DATASET = {
  rawPhysicalNodes: 766,
  rawObservations: 3064,

  excludedTunnelNodes: 2,
  excludedTunnelObservations: 8,

  activePhysicalNodes: 764,
  activeObservations: 3056,

  viewsPerNode: 4,
  spacingMeters: 20,
} as const;

export const NATURE_902_CANONICAL_SAMPLING = {
  eyeHeightMeters: 1.5,
  pitchDegrees: 0,
  fovDegreesPerQuadrant: 90,

  relativeYawDegrees: [
    0,
    90,
    180,
    270,
  ] as const,

  sourcePanoramaDegrees: 360,
  azimuthColumnDegrees: 1,
  azimuthColumnsPerPanorama: 360,
  columnsPerQuadrant: 90,

  targetSamplingAxis:
    'DUAL_SIDEWALK_CENTERLINES',

  canonicalProtocolId:
    'teacher_orthogonal_4x90_nature_9_02',
} as const;

export const NATURE_902_CWMC_REFERENCE = {
  calibrationMode:
    'MANUSCRIPT_REFERENCE_NOT_RECOMPUTED',

  tauI: 0.20,
  tauISource:
    'city-wide median(I_raw)',

  kappaI: 12,

  tauD: 0.50,
  tauDSource:
    'city-wide median(D_raw)',

  kappaD: 15,

  canyonThreshold: 2.0,
  canyonThresholdSource:
    'city-wide median(H/W)',

  canyonPsi: 0.15,
} as const;

export const NATURE_902_BEHAVIOR = {
  tRawMinSeconds: 0,
  tRawMaxSeconds: 300,

  formula:
    't_base = [min(t_max,max(t_min,t_raw)) - t_min] / (t_max - t_min)',
} as const;

export const NATURE_902_GWR = {
  choiceRadiusMeters: 800,
  integrationRadiusMeters: 800,

  kernel:
    'adaptive bi-square',

  distance:
    'network distance',

  bandwidthOptimization:
    'Golden Section Search',

  objective:
    'minimize AICc',

  multipleTesting:
    'Benjamini-Hochberg FDR',

  correctedLocalTThreshold:
    2.65,

  correctedAlphaApprox:
    0.008,

  reportedBandwidthText:
    '100 m reported in manuscript; verify adaptive/fixed parameterization before operational hard-coding',
} as const;

export const NATURE_902_MODEL_BENCHMARKS = {
  model1: {
    label:
      'Baseline GWR (I/Y/D)',
    r2: 0.8142,
    residualMoranI:
      0.002545,
  },

  model2: {
    label:
      'Space Syntax Controlled GWR',
    r2: 0.8316,
    deltaR2: 0.0174,
    deltaAicc:
      '> 140 decrease',
    residualMoranI:
      -0.00843,
    residualMoranP:
      0.584,
    vifMax:
      6.78,
  },

  withoutEnvironmentalTfp: {
    r2: 0.7812,
    aiccIncrease:
      182.4,
    residualMoranI:
      0.1425,
    residualMoranZ:
      21.4,
    vifMax:
      12.45,
  },
} as const;

export const NATURE_902_KMEANS_REFERENCE = {
  k: 3,
  silhouette:
    0.784,

  clusters: [
    {
      key:
        'covenant_midblocks',
      label:
        'Covenant Mid-Blocks',
      nodes:
        373,
      observations:
        1492,
      I:
        0.772,
      Y:
        0.350,
      D:
        0.824,
    },

    {
      key:
        'porous_pops',
      label:
        'Porous POPS & Plazas',
      nodes:
        113,
      observations:
        452,
      I:
        0.590,
      Y:
        0.526,
      D:
        0.714,
    },

    {
      key:
        'avenue_canyons',
      label:
        'Avenue Canyons',
      nodes:
        278,
      observations:
        1112,
      I:
        0.125,
      Y:
        0.855,
      D:
        0.159,
    },
  ],
} as const;

export const NATURE_902_REFERENCE_ELASTICITIES = {
  global: {
    a: 0.40,
    b: 0.20,
    c: 0.40,
  },

  avenueCanyon: {
    a: 0.10,
    b: 0.30,
    c: 0.60,
  },

  covenantMidblock: {
    a: 0.50,
    b: 0.30,
    c: 0.20,
  },

  porousPops: {
    a: 0.45,
    b: 0.15,
    c: 0.40,
  },
} as const;

/**
 * Convert the current canonical 1–7 perceptual scale to a 0–1 comparison
 * scale used by several manuscript result/cluster presentations.
 *
 * This helper is COMPARISON ONLY. It does not change the active paper scale.
 */
export function paperSevenPointToUnitScale(
  value:
    number | null | undefined
): number | null {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return null;
  }

  return Math.max(
    0,
    Math.min(
      1,
      (
        value -
        1
      ) /
        6
    )
  );
}
