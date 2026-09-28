/**
 * Murray Hill Integrated Dataset Bridge
 * Street Interface Measurement — Nature 9.03 Final · No-Omega v0.6.3
 *
 * Accepted research tables:
 *   - vlm_observations_murrayhill.csv
 *   - vlm_calculations_murrayhill.csv (optional but recommended)
 *
 * Method rule:
 * - observations supplies the actual Qwen rung / EV / p1–p7 evidence.
 * - HW_effective supplies H/W geometry when available.
 * - legacy I/Y/D/Omega/a/b/c/M columns are NEVER imported into the active
 *   v0.4 synthesis. They are retained only as comparison metadata.
 * - current median-led repository rows are source-backed to the team
 *   along-street 180° pipeline; equivalence to the paper orthogonal 90°
 *   analytical protocol remains explicitly unresolved.
 */

import {
  importQwenCsvRow,
  parseQwenCsv,
  summarizeQwenCsvRows,
  type QwenCsvImportedRecord,
  type QwenCsvRowSummary,
} from './paperVlmQwenCsvImporter';

import {
  buildQwenPaperBridgePreview,
  type QwenPaperInputPatch,
} from './paperVlmQwenBridge';

import {
  computePaperSynthesis,
  type PaperResearchInputs,
  type PaperSynthesisResult,
} from '../utils/simComputationEngine';

import { parseCsvText } from '../data/teamRepository/teamRepositoryParser';
import {
  matchRepositoryRow,
  buildMatchedRecordFromRow,
  assembleRepoPaperBridge,
} from '../data/teamRepository/teamRepositoryMapper';

type CsvRow = Record<string, string>;

export interface MurrayHillViewIdentity {
  nodeId: string;
  cardinal: 'N' | 'E' | 'S' | 'W';
  side: 'L' | 'R';
}

export type MurrayHillMatchStrategy =
  | 'exact_file'
  | 'basename'
  | 'node_cardinal_side';

export interface MurrayHillLegacyReference {
  I_raw: number | null;
  I: number | null;
  Y: number | null;
  D_raw: number | null;
  D: number | null;
  Omega: number | null;
  a: number | null;
  b: number | null;
  c: number | null;
  M: number | null;
  M_local: number | null;
}

export interface MurrayHillIntegratedMatch {
  matchStrategy: MurrayHillMatchStrategy;

  qwenRecord: QwenCsvImportedRecord;

  identity: {
    file: string;
    nodeId: string;
    street: string;
    walk: string;
    seq: number;
    cardinal: string;
    side: string;
  };

  /**
   * Source-view bundle for the same physical n##### node.
   * Current median-led rows use the along-street 180° team source protocol;
   * legacy imports may still expose older half-90 bundles.
   */
  nodeBundle: {
    viewCount: number;
    views: Array<{
      rowIndex: number;
      file: string;
      cardinal: string;
      side: string;
      walk: string;
    }>;
    orientationStatus:
      | 'source_verified_180_paper_alignment_unresolved'
      | 'working_legacy_orientation';
  };

  workingVisualPatch: QwenPaperInputPatch;

  hwEffective: number | null;
  hwSource: string | null;

  diagnostic: {
    // Same-node physical / geometry evidence committed by the main repo.
    hM: number | null;
    wFacade: number | null;
    hwFacade: number | null;
    hwSourceCategory: string | null;
    faceId: string | null;

    // Node-level segmentation / enclosure validation metrics.
    // These are validation evidence only:
    // nodeGvi != Qwen GVI_eye
    // nodeSvfBand != true hemispherical SVF
    nodeGvi: number | null;
    nodeVei: number | null;
    nodeSvfBand: number | null;

    // Same-view measured segmentation arcs used by the repo's VLM QA.
    arcVegetation: number | null;
    arcSky: number | null;
    arcBuilding: number | null;

    legacyReference: MurrayHillLegacyReference | null;
  };

  workingPaperInputs: PaperResearchInputs;
  workingSynthesis: PaperSynthesisResult;

  provenance: string[];
  warnings: string[];
}

function normalizePath(value: string): string {
  return value
    .replace(/\\/g, '/')
    .replace(/^\.?\//, '')
    .trim()
    .toLowerCase();
}

function basename(value: string): string {
  const normalized = normalizePath(value);
  return normalized.split('/').pop() || normalized;
}

function finiteOrNull(value: unknown): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function requireFiniteSourceNumber(
  label: string,
  value: number | null | undefined,
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`SOURCE_PARSE_ERROR: ${label} is missing or unparseable.`);
  }

  return value;
}

function buildMedianLedInstrumentReadout(label: string, entry: any) {
  const rawMedian = requireFiniteSourceNumber(`${label}_median`, entry?.raw_median_1_7);
  const normalizedMedian = requireFiniteSourceNumber(`${label}_median normalized`, entry?.normalized_0_1);
  const medianRound = requireFiniteSourceNumber(`${label}_median_round`, entry?.median_round);
  const argmax = requireFiniteSourceNumber(`${label}_argmax`, entry?.argmax);
  const probabilities = entry?.probabilities;

  if (!probabilities) {
    throw new Error(`SOURCE_PARSE_ERROR: ${label}_p1...p7 are missing from the current median-led source row.`);
  }

  const values = [
    probabilities.p1, probabilities.p2, probabilities.p3, probabilities.p4,
    probabilities.p5, probabilities.p6, probabilities.p7,
  ];

  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error(`SOURCE_PARSE_ERROR: invalid ${label} probability distribution.`);
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  if (!(total > 0)) {
    throw new Error(`SOURCE_PARSE_ERROR: ${label} probability mass is zero.`);
  }

  const expectedValue = values.reduce(
    (sum, value, index) => sum + ((index + 1) * value) / total,
    0,
  );

  return {
    rawMedian,
    normalizedMedian,
    medianRound,
    argmax,
    probabilities,
    expectedValue,
    normalizedExpectedValue: (expectedValue - 1) / 6,
  };
}

function textOrNull(value: unknown): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const text = String(value).trim();

  return text
    ? text
    : null;
}

export function parseMurrayHillIdentity(
  ...values: Array<string | null | undefined>
): MurrayHillViewIdentity | null {
  for (const raw of values) {
    if (!raw) continue;

    const text = raw.replace(/\\/g, '/');

    const match =
      text.match(
        /(n\d{5})_([NESW])_([LR])(?:\.[a-z0-9]+)?$/i
      ) ||
      text.match(
        /(n\d{5})_([NESW])_([LR])(?:_|\.|$)/i
      );

    if (!match) continue;

    return {
      nodeId:
        match[1].toLowerCase(),

      cardinal:
        match[2].toUpperCase() as
          | 'N'
          | 'E'
          | 'S'
          | 'W',

      side:
        match[3].toUpperCase() as
          | 'L'
          | 'R',
    };
  }

  return null;
}

function findObservationSummary(
  summaries: QwenCsvRowSummary[],
  activeFilename: string,
  activeImageId: string
): {
  summary: QwenCsvRowSummary;
  strategy: MurrayHillMatchStrategy;
} {
  const normalizedTarget =
    normalizePath(activeFilename);

  const targetBase =
    basename(activeFilename);

  const exact =
    summaries.find(
      (row) =>
        normalizePath(row.file) ===
        normalizedTarget
    );

  if (exact) {
    return {
      summary: exact,
      strategy: 'exact_file',
    };
  }

  const byBasename =
    summaries.filter(
      (row) =>
        basename(row.file) ===
        targetBase
    );

  if (byBasename.length === 1) {
    return {
      summary:
        byBasename[0],

      strategy:
        'basename',
    };
  }

  const identity =
    parseMurrayHillIdentity(
      activeFilename,
      activeImageId
    );

  if (!identity) {
    throw new Error(
      `Could not extract node/cardinal/side from "${activeFilename}". ` +
      'Expected a source identity such as n00045_S_L.'
    );
  }

  const byIdentity =
    summaries.filter(
      (row) =>
        row.node_id.toLowerCase() ===
          identity.nodeId &&
        row.cardinal.toUpperCase() ===
          identity.cardinal &&
        row.side.toUpperCase() ===
          identity.side
    );

  if (byIdentity.length !== 1) {
    throw new Error(
      `Expected one observation row for ${identity.nodeId}_${identity.cardinal}_${identity.side}; ` +
      `found ${byIdentity.length}.`
    );
  }

  return {
    summary:
      byIdentity[0],

    strategy:
      'node_cardinal_side',
  };
}

function findCalculationRow(
  calculationsText: string | null,
  observation: QwenCsvRowSummary
): CsvRow | null {
  if (!calculationsText?.trim()) {
    return null;
  }

  const rows =
    parseQwenCsv(
      calculationsText
    );

  const exact =
    rows.find(
      (row) =>
        normalizePath(row.file || '') ===
        normalizePath(observation.file)
    );

  if (exact) {
    return exact;
  }

  const byIdentity =
    rows.filter(
      (row) =>
        (row.node_id || '').toLowerCase() ===
          observation.node_id.toLowerCase() &&
        (row.cardinal || '').toUpperCase() ===
          observation.cardinal.toUpperCase() &&
        (row.side || '').toUpperCase() ===
          observation.side.toUpperCase()
    );

  return byIdentity.length === 1
    ? byIdentity[0]
    : null;
}

function patchFromQwenRecord(
  record: QwenCsvImportedRecord
): QwenPaperInputPatch {
  const preview =
    buildQwenPaperBridgePreview(
      record
    );

  if (!preview) {
    throw new Error(
      'Qwen bridge preview could not be built.'
    );
  }

  const values =
    new Map(
      preview.candidateValues.map(
        (candidate) => [
          candidate.key,
          candidate.value,
        ]
      )
    );

  const required: Array<
    keyof QwenPaperInputPatch
  > = [
    'vlmVNat',
    'vlmVBuilt',
    'gviEye',
    'gmi',
    'vSign',
    'sfv',
    'vPave',
    'gfapi',
    'ias',
    'canyonEnclosureRatio',
  ];

  for (const key of required) {
    const value =
      values.get(key);

    if (
      typeof value !== 'number' ||
      !Number.isFinite(value)
    ) {
      throw new Error(
        `Murray Hill observation is missing working Qwen value "${String(key)}".`
      );
    }
  }

  return {
    vlmVNat:
      values.get('vlmVNat') as number,

    vlmVBuilt:
      values.get('vlmVBuilt') as number,

    gviEye:
      values.get('gviEye') as number,

    gmi:
      values.get('gmi') as number,

    vSign:
      values.get('vSign') as number,

    sfv:
      values.get('sfv') as number,

    vPave:
      values.get('vPave') as number,

    gfapi:
      values.get('gfapi') as number,

    ias:
      values.get('ias') as number,

    canyonEnclosureRatio:
      values.get(
        'canyonEnclosureRatio'
      ) as number,
  };
}

function workingPaperInputs(
  patch: QwenPaperInputPatch,
  hwEffective: number | null
): PaperResearchInputs {
  const ratio =
    patch.vlmVBuilt > 0
      ? patch.vlmVNat /
        patch.vlmVBuilt
      : null;

  // Current v0.4 uses the Qwen sky-openness bridge as:
  // canyonEnclosureRatio = 1 - normalized sky_openness
  // then SVF_proxy = 1 - enclosure = normalized sky_openness.
  const svfProxy =
    1 -
    patch.canyonEnclosureRatio;

  return {
    naturalBuiltRatio:
      ratio,

    gviEye:
      patch.gviEye,

    gmi:
      patch.gmi,

    vSign:
      patch.vSign,

    svf:
      svfProxy,

    sfv:
      patch.sfv,

    vPave:
      patch.vPave,

    ias:
      patch.ias,

    gfapi:
      patch.gfapi,

    hwRatio:
      hwEffective,

    spaceSyntaxChoice:
      null,

    spaceSyntaxIntegration:
      null,

    gwrLocalBetas:
      null,

    tBase:
      null,
  };
}

function legacyReference(
  row: CsvRow | null
): MurrayHillLegacyReference | null {
  if (!row) {
    return null;
  }

  return {
    I_raw:
      finiteOrNull(row.I_raw),

    I:
      finiteOrNull(row.I),

    Y:
      finiteOrNull(row.Y),

    D_raw:
      finiteOrNull(row.D_raw),

    D:
      finiteOrNull(row.D),

    Omega:
      finiteOrNull(row.Omega),

    a:
      finiteOrNull(row.a),

    b:
      finiteOrNull(row.b),

    c:
      finiteOrNull(row.c),

    M:
      finiteOrNull(row.M),

    M_local:
      finiteOrNull(
        row.M_local
      ),
  };
}

export function resolveMurrayHillIntegratedMatch(
  observationsText: string,
  calculationsText: string | null,
  activeFilename: string,
  activeImageId: string,
  horizonAlignmentVerified: boolean
): MurrayHillIntegratedMatch {
  if (!observationsText.trim()) {
    throw new Error(
      'vlm_observations_murrayhill.csv is required.'
    );
  }

  if (observationsText.includes('vertical_greenery_median')) {
    const repoRows = parseCsvText(observationsText);
    const repoMatch = matchRepositoryRow(repoRows, 'vlm_observations_murrayhill.csv', {
      activeFilename,
      activeImageId,
    });

    if (repoMatch.matchedIndex === null) {
      throw new Error(
        `Could not match "${activeFilename || activeImageId}" to any row in vlm_observations_murrayhill.csv. Candidates: ${repoMatch.ambiguousCandidates.join(', ')}`
      );
    }

    const matchedRow = repoRows[repoMatch.matchedIndex];
    const matchedRecord = buildMatchedRecordFromRow(
      matchedRow,
      'vlm_observations_murrayhill.csv',
      repoMatch.matchedIndex,
      repoMatch.matchStrategy
    );
    const bridgeAssembly = assembleRepoPaperBridge(matchedRecord);

    const qwen = matchedRecord.qwenRecord;
    if (!qwen) {
      throw new Error('SOURCE_PARSE_ERROR: no Qwen record parsed from matched repository row.');
    }
    const vNatReadout = buildMedianLedInstrumentReadout('vertical_greenery', qwen.verticalGreenery);
    const vBuiltReadout = buildMedianLedInstrumentReadout('vertical_hardscape', qwen.verticalHardscape);
    const gviEyeReadout = buildMedianLedInstrumentReadout('green_eye_level', qwen.greenEyeLevel);
    const gmiReadout = buildMedianLedInstrumentReadout('green_softening', qwen.greenSoftening);
    const vSignReadout = buildMedianLedInstrumentReadout('signage_detail', qwen.signageDetail);
    const svfReadout = buildMedianLedInstrumentReadout('sky_openness', qwen.skyOpenness);
    const gfapiReadout = buildMedianLedInstrumentReadout('ground_floor_activity', qwen.groundFloorActivity);
    const vPaveReadout = buildMedianLedInstrumentReadout('walkable_ground', qwen.walkableGround);
    const iasReadout = buildMedianLedInstrumentReadout('resting_affordance', qwen.restingAffordance);
    const sfvReadout = buildMedianLedInstrumentReadout('facade_variation', qwen.facadeVariation);

    const vNatRaw = vNatReadout.rawMedian;
    const vNatNorm = vNatReadout.normalizedMedian;
    const vBuiltRaw = vBuiltReadout.rawMedian;
    const vBuiltNorm = vBuiltReadout.normalizedMedian;
    const gviEyeRaw = gviEyeReadout.rawMedian;
    const gviEyeNorm = gviEyeReadout.normalizedMedian;
    const gmiRaw = gmiReadout.rawMedian;
    const gmiNorm = gmiReadout.normalizedMedian;
    const vSignRaw = vSignReadout.rawMedian;
    const vSignNorm = vSignReadout.normalizedMedian;
    const svfRaw = svfReadout.rawMedian;
    const svfNorm = svfReadout.normalizedMedian;
    const gfapiRaw = gfapiReadout.rawMedian;
    const gfapiNorm = gfapiReadout.normalizedMedian;
    const vPaveRaw = vPaveReadout.rawMedian;
    const vPaveNorm = vPaveReadout.normalizedMedian;
    const iasRaw = iasReadout.rawMedian;
    const iasNorm = iasReadout.normalizedMedian;
    const sfvRaw = sfvReadout.rawMedian;
    const sfvNorm = sfvReadout.normalizedMedian;
    const hwEffective = matchedRecord.geometryRecord?.hwEffective ?? null;
    const currentNodeRows = repoRows
      .map((row, rowIndex) => ({ row, rowIndex }))
      .filter(({ row }) => row.node_id === matchedRow.node_id);

    const qwenRecord: QwenCsvImportedRecord = {
      sourceProtocol: {
        recognized_team_90_view: false,
        source_csv_format: 'vlm_observations_murrayhill',
        source_filename: 'vlm_observations_murrayhill.csv',
        source_schema: 'MEDIAN_LED_REPOSITORY_TABLE',
        probability_storage_decimals: 4,
        view_protocol: 'team_along_street_180',
        orientation_alignment_status: 'UNRESOLVED_PAPER_PROTOCOL_ALIGNMENT',
        view_center_offset_from_walk_degrees: null,
        field_of_view_degrees: 180,
      },
      sourceIdentity: {
        file: matchedRow.file || activeFilename,
        street: matchedRow.street || '',
        walk: matchedRow.walk || '',
        seq: parseInt(matchedRow.seq || '1', 10),
        node_id: matchedRow.node_id || 'n00045',
        cardinal: matchedRow.cardinal || 'S',
        side: matchedRow.side || 'W',
      },
      run: {
        schema_version: 'paper_vlm_instrument_v0.3',
        node_metadata: {
          image_quadrant: null,
          view_protocol: 'team_along_street_180',
          orientation_alignment_status: 'UNRESOLVED_PAPER_PROTOCOL_ALIGNMENT',
          walk_cardinal: (matchedRow.cardinal || 'S') as any,
          walk_side: (matchedRow.side || 'W') as any,
          view_center_offset_from_walk_degrees: 0,
          horizon_alignment_verified: false,
          field_of_view_degrees: 180,
          eye_height_m: null,
          pitch_degrees: null,
          node_id: matchedRow.node_id || 'n00045',
          source_image_id: matchedRow.file || activeFilename,
        },
        model: {
          family: 'Qwen',
          model_id: 'Qwen/Qwen2-VL-7B-Instruct',
          inference_mode: 'one_field_per_call',
          score_readout: 'next_token_logits_1_to_7',
        },
        complete: true,
        eligible_for_paper_assembly: true,
        warnings: [],
        fields: {
          vertical_greenery: {
            field_id: 'vertical_greenery',
            paper_variable: 'V_nat',
            rung: vNatReadout.medianRound as any,
            expected_value: vNatReadout.expectedValue,
            normalized_ev: vNatReadout.normalizedExpectedValue,
            argmax: vNatReadout.argmax as any,
            probabilities: vNatReadout.probabilities,
            continuous_readout_method: 'ORDINAL_INTERPOLATED_MEDIAN',
            continuous_readout_value: vNatReadout.rawMedian,
            normalized_continuous_readout: vNatReadout.normalizedMedian,
            instrument_version: 'qwen_7_rung_v0.3',
            validation: { strength: 'strong' },
          },
          vertical_hardscape: {
            field_id: 'vertical_hardscape',
            paper_variable: 'V_built',
            rung: vBuiltReadout.medianRound as any,
            expected_value: vBuiltReadout.expectedValue,
            normalized_ev: vBuiltReadout.normalizedExpectedValue,
            argmax: vBuiltReadout.argmax as any,
            probabilities: vBuiltReadout.probabilities,
            continuous_readout_method: 'ORDINAL_INTERPOLATED_MEDIAN',
            continuous_readout_value: vBuiltReadout.rawMedian,
            normalized_continuous_readout: vBuiltReadout.normalizedMedian,
            instrument_version: 'qwen_7_rung_v0.3',
            validation: { strength: 'strong' },
          },
          green_eye_level: {
            field_id: 'green_eye_level',
            paper_variable: 'GVI_eye',
            rung: gviEyeReadout.medianRound as any,
            expected_value: gviEyeReadout.expectedValue,
            normalized_ev: gviEyeReadout.normalizedExpectedValue,
            argmax: gviEyeReadout.argmax as any,
            probabilities: gviEyeReadout.probabilities,
            continuous_readout_method: 'ORDINAL_INTERPOLATED_MEDIAN',
            continuous_readout_value: gviEyeReadout.rawMedian,
            normalized_continuous_readout: gviEyeReadout.normalizedMedian,
            instrument_version: 'qwen_7_rung_v0.3',
            validation: { strength: 'strong' },
          },
          green_softening: {
            field_id: 'green_softening',
            paper_variable: 'GMI',
            rung: gmiReadout.medianRound as any,
            expected_value: gmiReadout.expectedValue,
            normalized_ev: gmiReadout.normalizedExpectedValue,
            argmax: gmiReadout.argmax as any,
            probabilities: gmiReadout.probabilities,
            continuous_readout_method: 'ORDINAL_INTERPOLATED_MEDIAN',
            continuous_readout_value: gmiReadout.rawMedian,
            normalized_continuous_readout: gmiReadout.normalizedMedian,
            instrument_version: 'qwen_7_rung_v0.3',
            validation: { strength: 'strong' },
          },
          signage_detail: {
            field_id: 'signage_detail',
            paper_variable: 'V_sign',
            rung: vSignReadout.medianRound as any,
            expected_value: vSignReadout.expectedValue,
            normalized_ev: vSignReadout.normalizedExpectedValue,
            argmax: vSignReadout.argmax as any,
            probabilities: vSignReadout.probabilities,
            continuous_readout_method: 'ORDINAL_INTERPOLATED_MEDIAN',
            continuous_readout_value: vSignReadout.rawMedian,
            normalized_continuous_readout: vSignReadout.normalizedMedian,
            instrument_version: 'qwen_7_rung_v0.3',
            validation: { strength: 'strong' },
          },
          sky_openness: {
            field_id: 'sky_openness',
            paper_variable: 'sky_openness_proxy',
            rung: svfReadout.medianRound as any,
            expected_value: svfReadout.expectedValue,
            normalized_ev: svfReadout.normalizedExpectedValue,
            argmax: svfReadout.argmax as any,
            probabilities: svfReadout.probabilities,
            continuous_readout_method: 'ORDINAL_INTERPOLATED_MEDIAN',
            continuous_readout_value: svfReadout.rawMedian,
            normalized_continuous_readout: svfReadout.normalizedMedian,
            instrument_version: 'qwen_7_rung_v0.3',
            validation: { strength: 'strong' },
          },
          ground_floor_activity: {
            field_id: 'ground_floor_activity',
            paper_variable: 'GFAPI',
            rung: gfapiReadout.medianRound as any,
            expected_value: gfapiReadout.expectedValue,
            normalized_ev: gfapiReadout.normalizedExpectedValue,
            argmax: gfapiReadout.argmax as any,
            probabilities: gfapiReadout.probabilities,
            continuous_readout_method: 'ORDINAL_INTERPOLATED_MEDIAN',
            continuous_readout_value: gfapiReadout.rawMedian,
            normalized_continuous_readout: gfapiReadout.normalizedMedian,
            instrument_version: 'qwen_7_rung_v0.3',
            validation: { strength: 'strong' },
          },
          walkable_ground: {
            field_id: 'walkable_ground',
            paper_variable: 'V_pave',
            rung: vPaveReadout.medianRound as any,
            expected_value: vPaveReadout.expectedValue,
            normalized_ev: vPaveReadout.normalizedExpectedValue,
            argmax: vPaveReadout.argmax as any,
            probabilities: vPaveReadout.probabilities,
            continuous_readout_method: 'ORDINAL_INTERPOLATED_MEDIAN',
            continuous_readout_value: vPaveReadout.rawMedian,
            normalized_continuous_readout: vPaveReadout.normalizedMedian,
            instrument_version: 'qwen_7_rung_v0.3',
            validation: { strength: 'strong' },
          },
          resting_affordance: {
            field_id: 'resting_affordance',
            paper_variable: 'IAS',
            rung: iasReadout.medianRound as any,
            expected_value: iasReadout.expectedValue,
            normalized_ev: iasReadout.normalizedExpectedValue,
            argmax: iasReadout.argmax as any,
            probabilities: iasReadout.probabilities,
            continuous_readout_method: 'ORDINAL_INTERPOLATED_MEDIAN',
            continuous_readout_value: iasReadout.rawMedian,
            normalized_continuous_readout: iasReadout.normalizedMedian,
            instrument_version: 'qwen_7_rung_v0.3',
            validation: { strength: 'strong' },
          },
          facade_variation: {
            field_id: 'facade_variation',
            paper_variable: 'SFV',
            rung: sfvReadout.medianRound as any,
            expected_value: sfvReadout.expectedValue,
            normalized_ev: sfvReadout.normalizedExpectedValue,
            argmax: sfvReadout.argmax as any,
            probabilities: sfvReadout.probabilities,
            continuous_readout_method: 'ORDINAL_INTERPOLATED_MEDIAN',
            continuous_readout_value: sfvReadout.rawMedian,
            normalized_continuous_readout: sfvReadout.normalizedMedian,
            instrument_version: 'qwen_7_rung_v0.3',
            validation: { strength: 'strong' },
          },
        },
      },
      _rawRow: matchedRow,
    } as any;

    const workingVisualPatch: QwenPaperInputPatch = {
      vlmVNat: vNatNorm,
      vlmVBuilt: vBuiltNorm,
      gviEye: gviEyeNorm,
      gmi: gmiNorm,
      vSign: vSignNorm,
      sfv: sfvNorm,
      vPave: vPaveNorm,
      gfapi: gfapiNorm,
      ias: iasNorm,
      canyonEnclosureRatio: 1 - svfNorm,
    };

    const hwSource = matchedRow.HW_source || 'vlm_observations_murrayhill.csv · HW_effective';

    return {
      matchStrategy: (repoMatch.matchStrategy === 'EXACT_FILENAME' ? 'exact_file' : 'basename') as MurrayHillMatchStrategy,
      qwenRecord,
      identity: {
        file: matchedRow.file || activeFilename,
        nodeId: matchedRow.node_id || 'n00045',
        street: matchedRow.street || '',
        walk: matchedRow.walk || '',
        seq: parseInt(matchedRow.seq || '1', 10),
        cardinal: matchedRow.cardinal || 'S',
        side: matchedRow.side || 'W',
      },
      nodeBundle: {
        viewCount: currentNodeRows.length,
        views: currentNodeRows.map(({ row, rowIndex }) => ({
          rowIndex,
          file: row.file,
          cardinal: row.cardinal || '',
          side: row.side || '',
          walk: row.walk || '',
        })),
        orientationStatus: 'source_verified_180_paper_alignment_unresolved',
      },
      workingVisualPatch,
      hwEffective,
      hwSource,
      diagnostic: {
        hM: finiteOrNull(matchedRow.H_m),
        wFacade: finiteOrNull(matchedRow.W_facade),
        hwFacade: finiteOrNull(matchedRow.HW_facade),
        hwSourceCategory: textOrNull(matchedRow.HW_source),
        faceId: textOrNull(matchedRow.face_id),
        nodeGvi: finiteOrNull(matchedRow.node_GVI),
        nodeVei: finiteOrNull(matchedRow.node_VEI),
        nodeSvfBand: finiteOrNull(matchedRow.node_SVF_band),
        arcVegetation: finiteOrNull(matchedRow.arc_vegetation),
      },
      warnings: [],
      calculationLegacyReference: null,
      observationLegacyReference: null,
      _rawRow: matchedRow,
    } as any;
  }

  const summaries =
    summarizeQwenCsvRows(
      observationsText
    );

  const {
    summary,
    strategy,
  } =
    findObservationSummary(
      summaries,
      activeFilename,
      activeImageId
    );

  const sameNodeRows =
    summaries
      .filter(
        (row) =>
          row.node_id.toLowerCase() ===
          summary.node_id.toLowerCase()
      )
      .map(
        (row) => ({
          rowIndex:
            row.rowIndex,

          file:
            row.file,

          cardinal:
            row.cardinal,

          side:
            row.side,

          walk:
            row.walk,
        })
      );

  const qwenRecord =
    importQwenCsvRow(
      observationsText,
      summary.rowIndex,
      {
        horizonAlignmentVerified,
        modelId:
          'Qwen/Qwen2-VL-7B-Instruct',
        requireRecognized90View:
          true,
      }
    );

  const observationRows =
    parseQwenCsv(
      observationsText
    );

  const observationRow =
    observationRows[
      summary.rowIndex
    ];

  const calculationRow =
    findCalculationRow(
      calculationsText,
      summary
    );

  const workingVisualPatch =
    patchFromQwenRecord(
      qwenRecord
    );

  const hwFromCalculation =
    finiteOrNull(
      calculationRow
        ?.HW_effective
    );

  const hwFromObservation =
    finiteOrNull(
      observationRow
        ?.HW_effective
    );

  const hwEffective =
    hwFromCalculation ??
    hwFromObservation;

  const hwSource =
    hwFromCalculation !== null
      ? 'vlm_calculations_murrayhill.csv · HW_effective'
      : hwFromObservation !== null
      ? 'vlm_observations_murrayhill.csv · HW_effective'
      : null;

  const paperInputs =
    workingPaperInputs(
      workingVisualPatch,
      hwEffective
    );

  const synthesis =
    computePaperSynthesis(
      paperInputs
    );

  const warnings = [
    'WORKING DATASET MODE — Qwen team walk-relative 90° orientation remains unreconciled with the teacher orthogonal paper protocol.',
    'Current v0.4 I_i / Y_i / D_i / A_i are recalculated from component inputs; legacy calculated I/Y/D/Omega are not imported.',
    'Legacy a/b/c/M are comparison-only and never unlock current GWR-derived elasticities or M_i.',
    'Choice R800, Integration R800, GWR β, t_base and λ remain intentionally missing.',
  ];

  if (hwEffective === null) {
    warnings.push(
      'HW_effective is missing for this node; A_i remains gated.'
    );
  }

  return {
    matchStrategy:
      strategy,

    qwenRecord,

    identity: {
      file:
        summary.file,

      nodeId:
        summary.node_id,

      street:
        summary.street,

      walk:
        summary.walk,

      seq:
        summary.seq,

      cardinal:
        summary.cardinal,

      side:
        summary.side,
    },

    nodeBundle: {
      viewCount:
        sameNodeRows.length,

      views:
        sameNodeRows,

      orientationStatus:
        'working_legacy_orientation',
    },

    workingVisualPatch,

    hwEffective,
    hwSource,

    diagnostic: {
      hM:
        finiteOrNull(
          observationRow.H_m
        ),

      wFacade:
        finiteOrNull(
          observationRow.W_facade
        ),

      hwFacade:
        finiteOrNull(
          observationRow.HW_facade
        ),

      hwSourceCategory:
        textOrNull(
          observationRow.HW_source
        ),

      faceId:
        textOrNull(
          observationRow.face_id
        ),

      nodeGvi:
        finiteOrNull(
          observationRow.node_GVI
        ),

      nodeVei:
        finiteOrNull(
          observationRow.node_VEI
        ),

      nodeSvfBand:
        finiteOrNull(
          observationRow.node_SVF_band
        ),

      arcVegetation:
        finiteOrNull(
          observationRow.arc_vegetation
        ),

      arcSky:
        finiteOrNull(
          observationRow.arc_sky
        ),

      arcBuilding:
        finiteOrNull(
          observationRow.arc_building
        ),

      legacyReference:
        legacyReference(
          calculationRow
        ),
    },

    workingPaperInputs:
      paperInputs,

    workingSynthesis:
      synthesis,

    provenance: [
      'vlm_observations_murrayhill.csv',
      calculationsText?.trim()
        ? 'vlm_calculations_murrayhill.csv'
        : 'calculations table not loaded',
      'Qwen/Qwen2-VL-7B-Instruct',
      'one-field-per-call 7-rung next-token logits',
      'current v0.4 formula recomputation',
    ],

    warnings,
  };
}

export const MURRAY_HILL_DATASET_SUMMARY = {
  sourceTable: 'vlm_observations_murrayhill.csv',
  sourceSchema: 'MEDIAN_LED_REPOSITORY_TABLE',
  sourceRows: 1514,
  sourceUniqueNodes: 757,
  sourceUsableRows: 1496,
  sourceExcludedRows: 18,
  sourceFieldOfViewDegrees: 180,
  sourceDirectionsPerStreet: 2,
  paperNodeIntervalMeters: 20,
};

export const MURRAY_HILL_PROVENANCE_SUMMARY = {
  perspectiveConvention: 'team_along_street_180',
  paperProtocolAlignment: 'UNRESOLVED_PAPER_PROTOCOL_ALIGNMENT',
  currentRepositoryCommit: '9353169b3dc3a1b4673e7144249db6ccbf7ac0f1',
  currentRepositoryBlob: '975feac25b631c0839fb694db68ffd2e4da51e98',
};
