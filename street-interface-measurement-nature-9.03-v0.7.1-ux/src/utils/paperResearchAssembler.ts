/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ============================================================================
 * PAPER RESEARCH VARIABLE ASSEMBLER
 * Street Interface Measurement — Nature 9.03 Final · No-Omega v0.5
 * ============================================================================
 *
 * This layer separates:
 *   1) deterministic frozen-taxonomy Vision evidence,
 *   2) approved Team Qwen visual-semantic paper variables,
 *   3) GIS / physical geometry,
 *   4) Space Syntax / GWR network calibration,
 *   5) behavioral observations,
 * from the deterministic paper equations.
 *
 * Current v0.5 Nature 9.03 ownership:
 * - Approved Qwen 7-rung measurements supply V_nat, V_built, GVI_eye, GMI,
 *   V_sign, V_pave, IAS, GFAPI (into Identity Y_i), and standardized enclosure proxy.
 * - SFV is retained as supplementary validation provenance only.
 * - Environmental TFP (A_i) and canyon parameters are retired from active SIM.
 */

import {
  FROZEN_30_CLASS_TAXONOMY,
  V33PixelMeasurementResult,
  V33SegmentationTaxonomy,
} from '../types';

import {
  GWRLocalBetas,
  PaperResearchInputs,
  normalizeRawStayabilitySeconds,
  STAYABILITY_RAW_MAX_SECONDS,
  STAYABILITY_RAW_MIN_SECONDS,
} from './simComputationEngine';

export type PaperVariableAssemblyStatus =
  | 'paper_ready'
  | 'candidate_mapping'
  | 'taxonomy_gap'
  | 'external_input'
  | 'method_gated'
  | 'unavailable'
  | 'invalid';

export interface PaperVariableRecord {
  key: string;
  symbol: string;
  label: string;
  value: number | null;
  candidateValue?: number | null;
  status: PaperVariableAssemblyStatus;
  source:
    | 'vision'
    | 'vlm'
    | 'gis'
    | 'behavior'
    | 'gwr'
    | 'paper_method'
    | 'derived';
  usableForComputation: boolean;
  reason: string;
  provenance: string[];
  normalization?: string;
}

/**
 * Values provided by analytical owners outside the exact-RGB pixel engine.
 * Canonical VLM fields are populated only after an approved Team Qwen record
 * passes the active provenance / orientation / source-image gates.
 */
export type PaperVisualInputMode =
  | 'manual_or_unclassified'
  | 'approved_qwen'
  | 'murrayhill_dataset_working';

export interface PaperExternalResearchInputs {
  /**
   * Provenance mode for the visual-semantic fields below.
   *
   * murrayhill_dataset_working:
   *   values may enter interim current-formula computation, but variable cards
   *   remain visibly marked as WORKING / CANDIDATE until the orientation
   *   protocol is reconciled.
   */
  visualInputMode: PaperVisualInputMode;
  visualInputProvenance: string | null;

  // Approved Team Qwen quantitative visual-semantic paper inputs
  vlmVNat: number | null;
  vlmVBuilt: number | null;
  gviEye: number | null;
  gmi: number | null;
  vSign: number | null;
  vPave: number | null;
  canyonEnclosureRatio: number | null; // standardized 90° enclosure proxy, [0,1]; not true whole-sky SVF

  // VLM / validated rubric inputs
  sfv: number | null;
  ias: number | null;
  gfapi: number | null;

  // GIS / physical geometry
  hwRatio: number | null;
  svf: number | null; // optional true/geometric SVF override

  // Space Syntax + GWR
  spaceSyntaxChoice: number | null;
  spaceSyntaxIntegration: number | null;
  gwrLocalBetas: GWRLocalBetas | null;

  // Behavior
  /**
   * Nature 9.03 Final primary behavioral observation in seconds.
   * The assembler deterministically clips to [0,300] and normalizes to t_base.
   */
  tRawSeconds: number | null;

  /**
   * Manual normalized t_base override retained for migration / audit only.
   * tRawSeconds takes precedence whenever it is supplied.
   */
  tBase: number | null;
}

export const EMPTY_PAPER_EXTERNAL_INPUTS: PaperExternalResearchInputs = {
  visualInputMode: 'manual_or_unclassified',
  visualInputProvenance: null,

  vlmVNat: null,
  vlmVBuilt: null,
  gviEye: null,
  gmi: null,
  vSign: null,
  vPave: null,
  canyonEnclosureRatio: null,

  sfv: null,
  ias: null,
  gfapi: null,

  hwRatio: null,
  svf: null,

  spaceSyntaxChoice: null,
  spaceSyntaxIntegration: null,
  gwrLocalBetas: null,

  tRawSeconds: null,
  tBase: null,
};

export interface PaperMappingApprovalConfig {
  approveNaturalBuiltMapping: boolean;
  approveVSignProxy: boolean;
  approveVPaveMapping: boolean;
}

/** Exact-RGB Vision mappings remain candidates unless explicitly approved. */
export const STRICT_PAPER_MAPPING_CONFIG: PaperMappingApprovalConfig = {
  approveNaturalBuiltMapping: false,
  approveVSignProxy: false,
  approveVPaveMapping: false,
};

export interface PaperResearchAssemblyResult {
  strictPaperMode: boolean;
  protocolVersion: string;

  variables: {
    vNat: PaperVariableRecord;
    vBuilt: PaperVariableRecord;
    naturalBuiltRatio: PaperVariableRecord;
    vSign: PaperVariableRecord;
    vPave: PaperVariableRecord;

    gviEye: PaperVariableRecord;
    gmi: PaperVariableRecord;
    canyonEnclosureRatio: PaperVariableRecord;

    sfv: PaperVariableRecord;
    ias: PaperVariableRecord;
    gfapi: PaperVariableRecord;

    hwRatio: PaperVariableRecord;
    svf: PaperVariableRecord;

    spaceSyntaxChoice: PaperVariableRecord;
    spaceSyntaxIntegration: PaperVariableRecord;

    tBase: PaperVariableRecord;
  };

  paperInputs: PaperResearchInputs;

  taxonomyCapabilities: {
    hasSidewalk: boolean;
    hasPaver: boolean;
    hasSignboard: boolean;
    hasArchitecturalDetail: boolean;
    hasNaturalAboveGround: boolean;
    hasBuiltAboveGround: boolean;
  };

  gates: string[];
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isUnitInterval(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0 && value <= 1;
}

function hasResearchGroup(
  taxonomy: V33SegmentationTaxonomy,
  group: string
): boolean {
  return taxonomy.classes.some((cls) =>
    cls.research_groups.includes(group as any)
  );
}

function missingRecord(
  key: string,
  symbol: string,
  label: string,
  source: PaperVariableRecord['source'],
  reason: string,
  provenance: string[],
  status: PaperVariableAssemblyStatus = 'external_input',
  normalization?: string
): PaperVariableRecord {
  return {
    key,
    symbol,
    label,
    value: null,
    status,
    source,
    usableForComputation: false,
    reason,
    provenance,
    normalization,
  };
}

function numericalRecord(
  key: string,
  symbol: string,
  label: string,
  value: number | null,
  source: PaperVariableRecord['source'],
  reasonWhenMissing: string,
  provenance: string[],
  normalization?: string,
  validator: (v: number) => boolean = isFiniteNumber
): PaperVariableRecord {
  if (value === null) {
    return missingRecord(
      key,
      symbol,
      label,
      source,
      reasonWhenMissing,
      provenance,
      source === 'paper_method' ? 'method_gated' : 'external_input',
      normalization
    );
  }

  if (!isFiniteNumber(value) || !validator(value)) {
    return {
      key,
      symbol,
      label,
      value: null,
      candidateValue: isFiniteNumber(value) ? value : null,
      status: 'invalid',
      source,
      usableForComputation: false,
      reason: `${symbol} was supplied outside its valid numerical domain.`,
      provenance,
      normalization,
    };
  }

  return {
    key,
    symbol,
    label,
    value,
    status: 'paper_ready',
    source,
    usableForComputation: true,
    reason: `${symbol} supplied by its designated analytical owner as a source-backed input to the active Nature 9.03 Final · No-Omega paper-synthesis protocol.`,
    provenance,
    normalization,
  };
}

function visualSemanticRecord(
  key: string,
  symbol: string,
  label: string,
  value: number | null,
  externalInputs: PaperExternalResearchInputs,
  reasonWhenMissing: string,
  canonicalProvenance: string[],
  normalization?: string,
  validator: (v: number) => boolean = isFiniteNumber
): PaperVariableRecord {
  const record =
    numericalRecord(
      key,
      symbol,
      label,
      value,
      'vlm',
      reasonWhenMissing,
      canonicalProvenance,
      normalization,
      validator
    );

  if (!record.usableForComputation) {
    return record;
  }

  if (
    externalInputs.visualInputMode ===
      'murrayhill_dataset_working'
  ) {
    return {
      ...record,

      status:
        'candidate_mapping',

      usableForComputation:
        true,

      reason:
        `${symbol} is loaded from the Murray Hill integrated working dataset. ` +
        'It is allowed to enter interim current-formula I/Y/D computation, but it is not relabeled as canonical teacher-orientation-approved Qwen evidence.',

      provenance: [
        externalInputs.visualInputProvenance ||
          'Murray Hill integrated working dataset',
        ...canonicalProvenance,
        'WORKING DATASET — ORIENTATION RECONCILIATION PENDING',
      ],
    };
  }

  if (externalInputs.visualInputMode === 'approved_qwen') {
    return {
      ...record,
      reason:
        `${symbol} is a source-backed approved Team Repository input for Nature 9.03 Final · No-Omega paper synthesis.`,
    };
  }

  return record;
}

function pixelCandidateNaturalBuilt(
  pixelMeasurements: V33PixelMeasurementResult | null,
  config: PaperMappingApprovalConfig
): PaperVariableRecord {
  const metric =
    pixelMeasurements?.derived_metrics?.natural_built_above_ground_ratio;

  if (!pixelMeasurements || pixelMeasurements.status !== 'computed' || !metric) {
    return missingRecord(
      'natural_built_ratio',
      'V_nat / V_built',
      'Natural-to-Built Above-Ground Ratio',
      'vision',
      'No deterministic natural/built ratio is currently available.',
      ['PIXEL_CLASSIFICATION', 'Exact RGB taxonomy measurement'],
      'unavailable'
    );
  }

  if (metric.status === 'undefined_zero_denominator') {
    return missingRecord(
      'natural_built_ratio',
      'V_nat / V_built',
      'Natural-to-Built Above-Ground Ratio',
      'derived',
      'V_built denominator is zero; the ratio is undefined.',
      ['PIXEL_CLASSIFICATION', 'Zero-denominator safeguard'],
      'invalid'
    );
  }

  const candidate = metric.value;
  if (!isFiniteNumber(candidate)) {
    return missingRecord(
      'natural_built_ratio',
      'V_nat / V_built',
      'Natural-to-Built Above-Ground Ratio',
      'derived',
      'No valid deterministic natural/built ratio is available.',
      ['PIXEL_CLASSIFICATION'],
      'unavailable'
    );
  }

  if (!config.approveNaturalBuiltMapping) {
    return {
      key: 'natural_built_ratio',
      symbol: 'V_nat / V_built',
      label: 'Natural-to-Built Above-Ground Ratio',
      value: null,
      candidateValue: candidate,
      status: 'candidate_mapping',
      source: 'derived',
      usableForComputation: false,
      reason:
        'VISION VALIDATION CANDIDATE ONLY — Exact-RGB natural/built ratio is retained as deterministic evidence, but it is not a canonical V_nat/V_built paper input and does not enter I_i unless explicitly approved as a validated substitute.',
      provenance: [
        'PIXEL_CLASSIFICATION',
        'Frozen Vision research groups',
        'Paper mapping approval pending',
      ],
    };
  }

  return {
    key: 'natural_built_ratio',
    symbol: 'V_nat / V_built',
    label: 'Natural-to-Built Above-Ground Ratio',
    value: candidate,
    candidateValue: candidate,
    status: 'paper_ready',
    source: 'derived',
    usableForComputation: true,
    reason: 'Exact-RGB Vision mapping is explicitly approved for this protocol.',
    provenance: ['PIXEL_CLASSIFICATION', 'Paper mapping approved'],
  };
}

function pixelCandidateVSign(
  pixelMeasurements: V33PixelMeasurementResult | null,
  taxonomy: V33SegmentationTaxonomy,
  config: PaperMappingApprovalConfig
): PaperVariableRecord {
  const hasSign = hasResearchGroup(taxonomy, 'signboard');
  const hasDetail = hasResearchGroup(taxonomy, 'architectural_detail');
  if (!hasSign || !hasDetail) {
    return missingRecord(
      'v_sign',
      'V_sign',
      'Signage & Architectural Articulation Density',
      'vision',
      'Frozen taxonomy lacks complete signboard/detail capability.',
      ['Semantic taxonomy capability audit'],
      'taxonomy_gap',
      '(P_signboard + P_architectural_detail) / P_total_valid'
    );
  }

  const candidate = pixelMeasurements?.derived_metrics?.signboard_detail_ratio?.value;
  if (!isFiniteNumber(candidate)) {
    return missingRecord(
      'v_sign',
      'V_sign',
      'Signage & Architectural Articulation Density',
      'derived',
      'No valid signboard/detail candidate is available.',
      ['PIXEL_CLASSIFICATION'],
      'unavailable'
    );
  }

  if (!config.approveVSignProxy) {
    return {
      key: 'v_sign',
      symbol: 'V_sign',
      label: 'Signage & Architectural Articulation Density',
      value: null,
      candidateValue: candidate,
      status: 'candidate_mapping',
      source: 'derived',
      usableForComputation: false,
      reason:
        'VISION VALIDATION CANDIDATE ONLY — Exact-RGB signboard/detail fraction is retained for audit, while canonical V_sign is owned by the approved Qwen signage_detail instrument.',
      provenance: ['PIXEL_CLASSIFICATION', 'Candidate proxy'],
      normalization: '(P_signboard + P_architectural_detail) / P_total_valid',
    };
  }

  return {
    key: 'v_sign',
    symbol: 'V_sign',
    label: 'Signage & Architectural Articulation Density',
    value: candidate,
    candidateValue: candidate,
    status: 'paper_ready',
    source: 'derived',
    usableForComputation: true,
    reason: 'Vision V_sign proxy explicitly approved.',
    provenance: ['PIXEL_CLASSIFICATION', 'Paper mapping approved'],
    normalization: '(P_signboard + P_architectural_detail) / P_total_valid',
  };
}

function pixelCandidateVPave(
  pixelMeasurements: V33PixelMeasurementResult | null,
  taxonomy: V33SegmentationTaxonomy,
  config: PaperMappingApprovalConfig
): PaperVariableRecord {
  const hasSidewalk = hasResearchGroup(taxonomy, 'sidewalk');
  const hasPaver = hasResearchGroup(taxonomy, 'paver');
  const candidate = pixelMeasurements?.derived_metrics?.sidewalk_paver_ratio?.value ?? null;

  if (!hasPaver) {
    return {
      key: 'v_pave',
      symbol: 'V_pave',
      label: 'Walkable Ground Surface',
      value: null,
      candidateValue: isFiniteNumber(candidate) ? candidate : null,
      status: 'taxonomy_gap',
      source: 'vision',
      usableForComputation: false,
      reason:
        'Frozen taxonomy has no dedicated paver class; P_paver=0 is missing capability, not empirical absence.',
      provenance: [
        `Sidewalk capability: ${hasSidewalk ? 'available' : 'missing'}`,
        'Paver capability: missing',
      ],
      normalization: '(P_sidewalk + P_paver) / P_total_valid',
    };
  }

  if (!hasSidewalk || !isFiniteNumber(candidate)) {
    return missingRecord(
      'v_pave',
      'V_pave',
      'Walkable Ground Surface',
      'vision',
      'Complete sidewalk+paver deterministic candidate is unavailable.',
      ['PIXEL_CLASSIFICATION'],
      hasSidewalk ? 'unavailable' : 'taxonomy_gap'
    );
  }

  if (!config.approveVPaveMapping) {
    return {
      key: 'v_pave',
      symbol: 'V_pave',
      label: 'Walkable Ground Surface',
      value: null,
      candidateValue: candidate,
      status: 'candidate_mapping',
      source: 'derived',
      usableForComputation: false,
      reason:
        'VISION VALIDATION CANDIDATE ONLY — Exact-RGB sidewalk/paver evidence is retained for audit, while canonical V_pave is owned by the approved Qwen walkable_ground instrument.',
      provenance: ['PIXEL_CLASSIFICATION', 'Candidate proxy'],
      normalization: '(P_sidewalk + P_paver) / P_total_valid',
    };
  }

  return {
    key: 'v_pave',
    symbol: 'V_pave',
    label: 'Walkable Ground Surface',
    value: candidate,
    candidateValue: candidate,
    status: 'paper_ready',
    source: 'derived',
    usableForComputation: true,
    reason: 'Vision V_pave mapping explicitly approved.',
    provenance: ['PIXEL_CLASSIFICATION', 'Paper mapping approved'],
    normalization: '(P_sidewalk + P_paver) / P_total_valid',
  };
}

export function assemblePaperResearchInputs(
  pixelMeasurements: V33PixelMeasurementResult | null,
  externalInputs: PaperExternalResearchInputs = EMPTY_PAPER_EXTERNAL_INPUTS,
  taxonomy: V33SegmentationTaxonomy = FROZEN_30_CLASS_TAXONOMY,
  mappingConfig: PaperMappingApprovalConfig = STRICT_PAPER_MAPPING_CONFIG
): PaperResearchAssemblyResult {
  // -------------------------------------------------------------------------
  // VLM v3.0 natural/built values and ratio
  // -------------------------------------------------------------------------
  const vNat = visualSemanticRecord(
    'v_nat',
    'V_nat',
    'Natural Elements Above-Ground',
    externalInputs.vlmVNat,
    externalInputs,
    'Approved Qwen vertical_greenery / V_nat measurement has not been supplied.',
    ['Approved Team Qwen 7-rung instrument', 'vertical_greenery → V_nat'],
    '[0,1]',
    isUnitInterval
  );

  const vBuilt = visualSemanticRecord(
    'v_built',
    'V_built',
    'Built Elements Above-Ground',
    externalInputs.vlmVBuilt,
    externalInputs,
    'Approved Qwen vertical_hardscape / V_built measurement has not been supplied.',
    ['Approved Team Qwen 7-rung instrument', 'vertical_hardscape / enclosure provenance'],
    '[0,1]',
    isUnitInterval
  );

  let naturalBuiltRatio: PaperVariableRecord;
  if (vNat.usableForComputation && vBuilt.usableForComputation) {
    if ((vBuilt.value as number) <= 0) {
      naturalBuiltRatio = missingRecord(
        'natural_built_ratio',
        'V_nat / V_built',
        'Natural-to-Built Above-Ground Ratio',
        'derived',
        'V_built is zero; V_nat/V_built is undefined.',
        ['Approved Qwen V_nat', 'Approved Qwen V_built'],
        'invalid'
      );
    } else {
      const workingDataset =
        externalInputs.visualInputMode ===
          'murrayhill_dataset_working';

      naturalBuiltRatio = {
        key: 'natural_built_ratio',
        symbol: 'V_nat / V_built',
        label: 'Natural-to-Built Above-Ground Ratio',
        value: (vNat.value as number) / (vBuilt.value as number),
        status: workingDataset
          ? 'candidate_mapping'
          : 'paper_ready',
        source: 'derived',
        usableForComputation: true,
        reason: workingDataset
          ? 'Derived from Murray Hill working-dataset Qwen V_nat and V_built components. Usable for interim current-formula synthesis; canonical orientation approval remains pending.'
          : 'Derived from approved Qwen normalized V_nat and V_built paper inputs.',
        provenance: workingDataset
          ? [
              externalInputs.visualInputProvenance ||
                'Murray Hill integrated working dataset',
              'VLM V_nat',
              'VLM V_built',
              'V_nat / V_built',
              'WORKING DATASET — ORIENTATION RECONCILIATION PENDING',
            ]
          : ['VLM V_nat', 'VLM V_built', 'V_nat / V_built'],
      };
    }
  } else {
    naturalBuiltRatio = pixelCandidateNaturalBuilt(pixelMeasurements, mappingConfig);
  }

  // -------------------------------------------------------------------------
  // V_sign / V_pave: prefer latest VLM paper variables, retain pixel candidates
  // -------------------------------------------------------------------------
  const pixelVSign = pixelCandidateVSign(pixelMeasurements, taxonomy, mappingConfig);
  const vSign = externalInputs.vSign !== null
    ? visualSemanticRecord(
        'v_sign',
        'V_sign',
        'Cognitive Legibility Landmarks',
        externalInputs.vSign,
        externalInputs,
        'Approved Qwen signage_detail / V_sign measurement has not been supplied.',
        ['Approved Team Qwen 7-rung instrument', 'signage_detail → V_sign'],
        '[0,1]',
        isUnitInterval
      )
    : pixelVSign;

  const pixelVPave = pixelCandidateVPave(pixelMeasurements, taxonomy, mappingConfig);
  const vPave = externalInputs.vPave !== null
    ? visualSemanticRecord(
        'v_pave',
        'V_pave',
        'Sidewalk & Paver Walkability',
        externalInputs.vPave,
        externalInputs,
        'Approved Qwen walkable_ground / V_pave measurement has not been supplied.',
        ['Approved Team Qwen 7-rung instrument', 'walkable_ground → V_pave'],
        '[0,1]',
        isUnitInterval
      )
    : pixelVPave;

  const gviEye = visualSemanticRecord(
    'gvi_eye',
    'GVI_eye',
    'Foveal Green View Index',
    externalInputs.gviEye,
    externalInputs,
    'GVI_eye awaits an approved Qwen green_eye_level measurement under the standardized 90° / 1.5 m / pitch 0° instrument and active provenance gates.',
    ['Approved Team Qwen 7-rung instrument', 'green_eye_level → GVI_eye'],
    '[0,1]',
    isUnitInterval
  );

  const gmi = visualSemanticRecord(
    'gmi',
    'GMI',
    'Green Mitigation Interaction',
    externalInputs.gmi,
    externalInputs,
    'GMI awaits an approved Qwen green_softening measurement; construct-validation status remains separately tracked.',
    ['Approved Team Qwen 7-rung instrument', 'green_softening → GMI'],
    '[0,1]',
    isUnitInterval
  );

  const canyonEnclosureRatio = visualSemanticRecord(
    'canyon_enclosure_ratio',
    'E_proxy',
    'Standardized Canyon Enclosure Proxy',
    externalInputs.canyonEnclosureRatio,
    externalInputs,
    'Approved Qwen sky_openness-derived enclosure proxy has not been supplied.',
    [
      'Approved Team Qwen 7-rung instrument',
      'sky_openness → enclosure proxy',
      'PROXY — NOT WHOLE-SKY SVF',
    ],
    '[0,1]',
    isUnitInterval
  );

  const sfv = visualSemanticRecord(
    'sfv',
    'SFV',
    'Street Facade Variation (Supplementary Validation Only)',
    externalInputs.sfv,
    externalInputs,
    'SFV is retained as supplementary validation provenance and excluded from active Nature 9.03 calculation.',
    [
      'Approved Team Qwen 7-rung instrument',
      'facade_variation → SFV',
      'SUPPLEMENTARY VALIDATION ONLY — EXCLUDED FROM 9.03 SIM',
    ],
    '[0,1]',
    isUnitInterval
  );

  const ias = visualSemanticRecord(
    'ias',
    'IAS',
    'Interface Affordance Score',
    externalInputs.ias,
    externalInputs,
    'IAS awaits an approved Qwen resting_affordance measurement; enters active Place Dependence (D_i).',
    ['Approved Team Qwen 7-rung instrument', 'resting_affordance → IAS'],
    '[0,1]',
    isUnitInterval
  );

  const gfapi = visualSemanticRecord(
    'gfapi',
    'GFAPI',
    'Ground-Floor Active Permeability Index (Identity Term)',
    externalInputs.gfapi,
    externalInputs,
    'GFAPI enters active Place Identity (Y_i) under Nature 9.03 Final.',
    ['Approved Team Qwen 7-rung instrument', 'ground_floor_activity → GFAPI', 'Nature 9.03 Y_i term'],
    '[0,1]',
    isUnitInterval
  );

  const hwRatioBase = numericalRecord(
    'hw_ratio',
    'H/W',
    'Street Canyon Aspect Ratio',
    externalInputs.hwRatio,
    'gis',
    'H/W geometry context has not been supplied for this node.',
    ['Building height', 'Street width / right-of-way geometry'],
    undefined,
    (v) => v >= 0
  );

  const hwRatio = hwRatioBase.usableForComputation
    ? {
        ...hwRatioBase,
        reason:
          'H/W is retained as source-backed geometry context for Nature 9.03 Final · No-Omega provenance and does not directly modify active M_i.',
      }
    : hwRatioBase;

  // For Y_i: an explicitly supplied geometric / hemispherical SVF has
  // precedence. Otherwise, the approved Team Qwen along-street 180°
  // sky-openness measure may provide an operational openness proxy.
  //
  // IMPORTANT:
  // The 180° directional sky-openness proxy is not a true whole-sky /
  // hemispherical SVF. We retain the numerical bridge needed by the current
  // paper equation while keeping provenance explicit so the APP never silently
  // relabels the proxy as a geometric SVF measurement.
  let svf: PaperVariableRecord;
  if (externalInputs.svf !== null) {
    svf = numericalRecord(
      'svf',
      'SVF',
      'Geometric / Hemispherical Sky View Factor',
      externalInputs.svf,
      'gis',
      'Geometric SVF has not been supplied.',
      ['Geometry / hemispherical source', 'Explicit SVF input'],
      '[0,1]',
      isUnitInterval
    );
  } else if (canyonEnclosureRatio.usableForComputation) {
    const workingDataset =
      externalInputs.visualInputMode ===
        'murrayhill_dataset_working';

    svf = {
      key: 'svf',
      symbol: 'SVF_proxy',
      label: 'Standardized Openness Proxy for Y_i',
      value: 1 - (canyonEnclosureRatio.value as number),
      status: workingDataset
        ? 'candidate_mapping'
        : 'paper_ready',
      source: 'derived',
      usableForComputation: true,
      reason: workingDataset
        ? 'Derived from the Murray Hill working-dataset Qwen sky-openness component. Usable for interim Y_i synthesis, but not a true whole-sky SVF and not canonical orientation-approved evidence.'
        : 'Derived from the approved Team Qwen 180° along-street sky_openness source as the standardized openness proxy used in Y_i. This is an operational proxy, not a true whole-sky / hemispherical SVF measurement.',
      provenance: [
        workingDataset
          ? externalInputs.visualInputProvenance ||
            'Murray Hill integrated working dataset'
          : 'Approved Team Qwen 180° along-street sky_openness source',
        'openness_proxy = 1 − enclosure',
        'PROXY — NOT WHOLE-SKY SVF',
        ...(workingDataset
          ? ['WORKING DATASET — ORIENTATION RECONCILIATION PENDING']
          : []),
      ],
      normalization: '[0,1]',
    };
  } else {
    svf = missingRecord(
      'svf',
      'SVF / openness proxy',
      'Sky Openness Input for Y_i',
      'gis',
      'Neither geometric SVF nor a standardized VLM canyon-enclosure proxy is available.',
      ['Nature 9.03 Y_i equation', 'SVF provenance gate'],
      'external_input',
      '[0,1]'
    );
  }

  const spaceSyntaxChoice = numericalRecord(
    'space_syntax_choice',
    'Choice_i',
    'Space Syntax Segment Choice (Betweenness)',
    externalInputs.spaceSyntaxChoice,
    'gwr',
    'Choice_i is required as the 800 m through-movement control in the latest GWR model.',
    ['Space Syntax segment analysis', 'Walking radius R = 800 m'],
    'positive value for ln(Choice_i)',
    (v) => v > 0
  );

  const spaceSyntaxIntegration = numericalRecord(
    'space_syntax_integration',
    'Integration_i',
    'Space Syntax Segment Integration (Closeness)',
    externalInputs.spaceSyntaxIntegration,
    'gwr',
    'Integration_i is required as the 800 m to-movement control in the latest GWR model.',
    ['Space Syntax segment analysis', 'Walking radius R = 800 m'],
    'positive value for ln(Integration_i)',
    (v) => v > 0
  );

  let tBase:
    PaperVariableRecord;

  if (
    externalInputs.tRawSeconds !==
    null
  ) {
    if (
      !isFiniteNumber(
        externalInputs.tRawSeconds
      ) ||
      externalInputs.tRawSeconds <
        0
    ) {
      tBase = {
        key:
          't_base',
        symbol:
          't_base',
        label:
          'Baseline Stayability Index',
        value:
          null,
        status:
          'invalid',
        source:
          'behavior',
        usableForComputation:
          false,
        reason:
          't_raw must be a finite non-negative duration in seconds.',
        provenance: [
          'Nature 9.03 Final behavioral normalization',
        ],
        normalization:
          'clip t_raw to [0,300] seconds → normalize to [0,1]',
      };
    } else {
      const normalized =
        normalizeRawStayabilitySeconds(
          externalInputs.tRawSeconds
        );

      tBase = {
        key:
          't_base',
        symbol:
          't_base',
        label:
          'Baseline Stayability Index',
        value:
          normalized,
        status:
          'paper_ready',
        source:
          'derived',
        usableForComputation:
          true,
        reason:
          `Derived deterministically from t_raw=${externalInputs.tRawSeconds}s using the Nature 9.03 Final bounded baseline stayability formula.`,
        provenance: [
          'Observed / sensor-derived t_raw',
          `t_min=${STAYABILITY_RAW_MIN_SECONDS}s`,
          `t_max=${STAYABILITY_RAW_MAX_SECONDS}s`,
          'Nature 9.03 Final behavioral normalization',
        ],
        normalization:
          't_base = [min(300,max(0,t_raw)) - 0] / 300',
      };
    }
  } else {
    tBase =
      numericalRecord(
        't_base',
        't_base',
        'Baseline Stayability Index',
        externalInputs.tBase,
        'behavior',
        'Nature 9.03 Final derives t_base deterministically from observed t_raw when available. A manual normalized t_base override may be supplied only for migration/audit when raw duration is unavailable.',
        [
          'Manual normalized override',
          'Nature 9.03 Final migration / audit path',
        ],
        '[0,1]',
        isUnitInterval
      );
  }

  const taxonomyCapabilities = {
    hasSidewalk: hasResearchGroup(taxonomy, 'sidewalk'),
    hasPaver: hasResearchGroup(taxonomy, 'paver'),
    hasSignboard: hasResearchGroup(taxonomy, 'signboard'),
    hasArchitecturalDetail: hasResearchGroup(taxonomy, 'architectural_detail'),
    hasNaturalAboveGround: hasResearchGroup(taxonomy, 'natural_above_ground'),
    hasBuiltAboveGround: hasResearchGroup(taxonomy, 'built_above_ground'),
  };

  const paperInputs: PaperResearchInputs = {
    naturalBuiltRatio: naturalBuiltRatio.usableForComputation
      ? naturalBuiltRatio.value
      : null,
    gviEye: gviEye.usableForComputation ? gviEye.value : null,
    gmi: gmi.usableForComputation ? gmi.value : null,

    vSign: vSign.usableForComputation ? vSign.value : null,
    svf: svf.usableForComputation ? svf.value : null,
    sfv: sfv.usableForComputation ? sfv.value : null,

    vPave: vPave.usableForComputation ? vPave.value : null,
    ias: ias.usableForComputation ? ias.value : null,
    gfapi: gfapi.usableForComputation ? gfapi.value : null,

    hwRatio: hwRatio.usableForComputation ? hwRatio.value : null,

    spaceSyntaxChoice: spaceSyntaxChoice.usableForComputation
      ? spaceSyntaxChoice.value
      : null,
    spaceSyntaxIntegration: spaceSyntaxIntegration.usableForComputation
      ? spaceSyntaxIntegration.value
      : null,
    gwrLocalBetas: externalInputs.gwrLocalBetas,

    tBase: tBase.usableForComputation ? tBase.value : null,
  };

  const gates: string[] = [];
  const collectGate = (record: PaperVariableRecord) => {
    if (!record.usableForComputation) gates.push(`${record.symbol}: ${record.reason}`);
  };

  // Active variables required for Nature 9.03 calculation
  // (SFV is supplementary validation only; H/W is legacy comparative context only)
  [
    naturalBuiltRatio,
    vSign,
    vPave,
    gviEye,
    gmi,
    ias,
    gfapi,
    svf,
    spaceSyntaxChoice,
    spaceSyntaxIntegration,
    tBase,
  ].forEach(collectGate);

  return {
    strictPaperMode: true,
    protocolVersion: 'nature_9_03_no_omega_final_v0.5.2_qwen_space_syntax_gwr',
    variables: {
      vNat,
      vBuilt,
      naturalBuiltRatio,
      vSign,
      vPave,
      gviEye,
      gmi,
      canyonEnclosureRatio,
      sfv,
      ias,
      gfapi,
      hwRatio,
      svf,
      spaceSyntaxChoice,
      spaceSyntaxIntegration,
      tBase,
    },
    paperInputs,
    taxonomyCapabilities,
    gates,
  };
}
