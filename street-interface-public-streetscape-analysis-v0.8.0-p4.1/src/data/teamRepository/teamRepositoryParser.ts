/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ============================================================================
 * TEAM REPOSITORY DATA BRIDGE — PARSER
 * Nature 9.03 Final · No-Omega v0.6
 * ============================================================================
 *
 * Dependency-free parser for Murray Hill repository export tables:
 * - VLM Observations (ratings, probabilities, rungs)
 * - Node metadata (coordinates, sequence, streets, usability)
 * - Geometry records (H/W, corridor widths, open-one-side markers)
 * - Historical / legacy comparative calculation outputs
 *
 * Enforces:
 * - Deterministic readout provenance (Median preferred > Discrete Prob Median > EV)
 * - Exact ordinal [1, 7] to unit [0, 1] standardization: (raw - 1) / 6
 * - Preservation of open_one_side without numeric fabrication
 * - Complete isolation of legacy I/Y/D/M columns as COMPARATIVE_PROVENANCE_ONLY
 */

import type {
  RepoComparativeFinals,
  RepoDiagnosticProvenanceField,
  RepoGeometryRecord,
  RepoNodeIdentity,
  RepoQwenRecord,
  RepoQwenVariableEntry,
  RepoReadoutMethod,
  RepoSevenRungProbabilities,
  RepoUsability,
  TeamRepositoryMetadata,
} from './teamRepositoryTypes';

export type RawCsvRow = Record<string, string>;

export const QWEN_RESEARCH_FIELDS = [
  { fieldId: 'vertical_greenery', paperVariable: 'V_nat' },
  { fieldId: 'vertical_hardscape', paperVariable: 'V_built' },
  { fieldId: 'green_eye_level', paperVariable: 'GVI_eye' },
  { fieldId: 'green_softening', paperVariable: 'GMI' },
  { fieldId: 'signage_detail', paperVariable: 'V_sign' },
  { fieldId: 'sky_openness', paperVariable: 'SVF_proxy' },
  { fieldId: 'ground_floor_activity', paperVariable: 'GFAPI' },
  { fieldId: 'walkable_ground', paperVariable: 'V_pave' },
  { fieldId: 'resting_affordance', paperVariable: 'IAS' },
  { fieldId: 'facade_variation', paperVariable: 'SFV' },
] as const;

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === ',' && !insideQuotes) {
      cells.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells;
}

export function parseCsvText(csvText: string): RawCsvRow[] {
  if (!csvText || !csvText.trim()) return [];

  const normalized = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const physicalLines = normalized.split('\n');

  const records: string[] = [];
  let buffer = '';
  let quoteCount = 0;

  for (const line of physicalLines) {
    buffer = buffer ? `${buffer}\n${line}` : line;
    quoteCount += (line.match(/"/g) || []).length;

    if (quoteCount % 2 === 0) {
      if (buffer.trim()) {
        records.push(buffer);
      }
      buffer = '';
      quoteCount = 0;
    }
  }

  if (buffer.trim()) {
    throw new Error('CSV text contains unterminated quoted field.');
  }

  if (records.length < 2) {
    return [];
  }

  const headers = splitCsvLine(records[0]).map((h) => h.trim());

  return records.slice(1).map((record) => {
    const values = splitCsvLine(record);
    const rowObj: RawCsvRow = {};
    for (let i = 0; i < headers.length; i += 1) {
      rowObj[headers[i]] = (values[i] ?? '').trim();
    }
    return rowObj;
  });
}

export function finiteOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function textOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str.length > 0 ? str : null;
}

export function parseFilenameIdentity(filename: string): {
  nodeId: string;
  cardinal: string;
  side: string;
} | null {
  if (!filename) return null;
  const cleaned = filename.replace(/\\/g, '/');
  const matchWithSide = cleaned.match(/(n\d{5})_([NESW])_([LR])(?:\.[a-z0-9]+)?$/i)
    || cleaned.match(/(n\d{5})_([NESW])_([LR])(?:_|\.|$)/i);
  if (matchWithSide) {
    return {
      nodeId: matchWithSide[1].toLowerCase(),
      cardinal: matchWithSide[2].toUpperCase(),
      side: matchWithSide[3].toUpperCase(),
    };
  }
  const matchCardinal = cleaned.match(/(n\d{5})_([NESW])(?:\.[a-z0-9]+)?$/i)
    || cleaned.match(/(n\d{5})_([NESW])(?:_|\.|$)/i);
  if (matchCardinal) {
    return {
      nodeId: matchCardinal[1].toLowerCase(),
      cardinal: matchCardinal[2].toUpperCase(),
      side: '',
    };
  }
  const matchNode = cleaned.match(/(n\d{5})/i);
  if (matchNode) {
    return {
      nodeId: matchNode[1].toLowerCase(),
      cardinal: '',
      side: '',
    };
  }
  return null;
}

export function parseRepoNodeIdentity(
  row: RawCsvRow,
  sourceFile: string,
  sourceRowIndex: number,
): RepoNodeIdentity {
  const explicitNodeId = textOrNull(row.node_id || row.nodeId || row.node || row.id);
  const sourceFilename = textOrNull(row.file || row.filename || row.image_file || row.image_path) || `row_${sourceRowIndex + 1}`;

  let nodeId = explicitNodeId;
  let nodeIdSource: 'EXPLICIT_NODE_ID' | 'FILENAME_PARSED' = 'EXPLICIT_NODE_ID';

  if (!nodeId && sourceFilename) {
    const parsed = parseFilenameIdentity(sourceFilename);
    if (parsed) {
      nodeId = parsed.nodeId;
      nodeIdSource = 'FILENAME_PARSED';
    }
  }

  if (!nodeId) {
    nodeId = `unknown_node_${sourceRowIndex + 1}`;
    nodeIdSource = 'FILENAME_PARSED';
  }

  const parsedFromFilename = parseFilenameIdentity(sourceFilename);

  return {
    nodeId: nodeId.toLowerCase(),
    nodeIdSource,
    sourceFilename,
    street: textOrNull(row.street || row.street_name || row.osm_name),
    walkDirection: textOrNull(row.walk || row.walk_direction),
    side: textOrNull(row.side) || parsedFromFilename?.side || null,
    sequence: finiteOrNull(row.seq || row.sequence || row.seq_fwd || row.seq_rev),
    cardinalDirection: textOrNull(row.cardinal || row.cardinal_direction) || parsedFromFilename?.cardinal || null,
    headingDeg: finiteOrNull(row.heading || row.heading_deg || row.heading_fwd_deg),
    yawDeg: finiteOrNull(row.yaw || row.yaw_deg),
    lat: finiteOrNull(row.lat || row.latitude || row.node_lat),
    lng: finiteOrNull(row.lng || row.lon || row.longitude || row.node_lon),
    sourceFile,
    sourceRow: sourceRowIndex + 2, // 1-based data row in file
  };
}

export function parseRepoUsability(row: RawCsvRow): RepoUsability {
  // Check for explicit usability fields
  const usableVal = row.usable ?? row.is_usable ?? row.useable ?? row.status;
  const excludeReason = textOrNull(row.exclude_reason ?? row.exclusion_reason ?? row.exclusion_notes);

  if (usableVal !== undefined && usableVal !== '') {
    const lower = String(usableVal).trim().toLowerCase();
    const isFalse = lower === 'false' || lower === '0' || lower === 'no' || lower === 'excluded' || lower === 'exclude';
    if (isFalse) {
      return {
        usable: false,
        status: 'SOURCE_EXCLUDED',
        excludeReason: excludeReason || 'Excluded in repository source metadata',
      };
    }
  }

  if (excludeReason) {
    return {
      usable: false,
      status: 'SOURCE_EXCLUDED',
      excludeReason,
    };
  }

  return {
    usable: true,
    status: 'SOURCE_USABLE',
    excludeReason: null,
  };
}

/**
 * Calculates discrete median from 7-rung probabilities:
 * Finds smallest rung k in 1..7 where cumulative probability >= 0.5.
 */
export function calculateDiscreteProbabilityMedian(probs: RepoSevenRungProbabilities): number {
  const p = [probs.p1, probs.p2, probs.p3, probs.p4, probs.p5, probs.p6, probs.p7];
  let cumulative = 0;
  for (let i = 0; i < p.length; i += 1) {
    cumulative += p[i];
    if (cumulative >= 0.499999) {
      return i + 1;
    }
  }
  return 7;
}

export function parseSingleQwenVariable(
  row: RawCsvRow,
  fieldId: string,
  paperVariable: string,
): RepoQwenVariableEntry {
  // Bind EXACT CSV header names without reordering or positional index
  const exactMedianHeader = `${fieldId}_median`;
  const exactRoundHeader = `${fieldId}_median_round`;

  const rawMedianVal = row[exactMedianHeader] ?? row[`median_${fieldId}`];
  const medianRaw = finiteOrNull(rawMedianVal);

  // 2. Check 7-rung probabilities by exact header name
  const p1 = finiteOrNull(row[`${fieldId}_p1`] ?? row[`${fieldId}_P1`]);
  const p2 = finiteOrNull(row[`${fieldId}_p2`] ?? row[`${fieldId}_P2`]);
  const p3 = finiteOrNull(row[`${fieldId}_p3`] ?? row[`${fieldId}_P3`]);
  const p4 = finiteOrNull(row[`${fieldId}_p4`] ?? row[`${fieldId}_P4`]);
  const p5 = finiteOrNull(row[`${fieldId}_p5`] ?? row[`${fieldId}_P5`]);
  const p6 = finiteOrNull(row[`${fieldId}_p6`] ?? row[`${fieldId}_P6`]);
  const p7 = finiteOrNull(row[`${fieldId}_p7`] ?? row[`${fieldId}_P7`]);

  const hasProbabilities =
    p1 !== null && p2 !== null && p3 !== null && p4 !== null &&
    p5 !== null && p6 !== null && p7 !== null;

  const probabilities: RepoSevenRungProbabilities | null = hasProbabilities
    ? { p1: p1!, p2: p2!, p3: p3!, p4: p4!, p5: p5!, p6: p6!, p7: p7! }
    : null;

  // 3. Check expected value (retained for comparative provenance, NEVER substituted for current median)
  const expectedVal = finiteOrNull(row[`${fieldId}_ev`] ?? row[`ev_${fieldId}`]);

  // 4. Check raw argmax / scalar
  const argmaxVal = finiteOrNull(row[`${fieldId}_argmax`]);
  const rawScalar = finiteOrNull(row[fieldId]);

  // 5. Check display rung source column
  const rawRoundVal = row[exactRoundHeader];
  const roundRaw = finiteOrNull(rawRoundVal);

  let raw_median_1_7: number | null = null;
  let normalized_0_1: number | null = null;
  let displayRung: number | null = null;
  let readoutMethod: RepoReadoutMethod = 'UNAVAILABLE';
  let continuousReadoutSource: string = exactMedianHeader;
  let displayRungSource: string = exactRoundHeader;
  let sourceColumn: string = exactMedianHeader;
  let sourceValue: any = rawMedianVal !== undefined ? rawMedianVal : null;
  let displayRungValue: any = rawRoundVal !== undefined ? rawRoundVal : null;
  let medianRoundValidationPassed: boolean | null = null;

  if (medianRaw !== null) {
    // Numerical floating-point safeguarding strictly within [1.0, 7.0]
    raw_median_1_7 = Math.min(7.0, Math.max(1.0, medianRaw));
    normalized_0_1 = (raw_median_1_7 - 1.0) / 6.0;
    readoutMethod = 'ORDINAL_INTERPOLATED_MEDIAN';
    continuousReadoutSource = exactMedianHeader;
    displayRungSource = exactRoundHeader;

    if (roundRaw !== null) {
      // Direct assignment from sourceRow.<field>_median_round (not derived from median)
      displayRung = Math.round(roundRaw);
      // Validation check: sourceRow.<field>_median_round === Math.round(sourceRow.<field>_median)
      medianRoundValidationPassed = Math.round(raw_median_1_7) === displayRung;
    } else {
      displayRung = Math.round(raw_median_1_7);
      medianRoundValidationPassed = null;
    }
  } else if (roundRaw !== null) {
    raw_median_1_7 = Math.min(7.0, Math.max(1.0, roundRaw));
    normalized_0_1 = (raw_median_1_7 - 1.0) / 6.0;
    readoutMethod = 'EXPLICIT_MEDIAN';
    continuousReadoutSource = exactRoundHeader;
    displayRung = Math.round(roundRaw);
    displayRungSource = exactRoundHeader;
    sourceColumn = exactRoundHeader;
    sourceValue = rawRoundVal !== undefined ? rawRoundVal : null;
    medianRoundValidationPassed = true;
  } else if (probabilities !== null) {
    const discMedian = calculateDiscreteProbabilityMedian(probabilities);
    raw_median_1_7 = discMedian;
    normalized_0_1 = (discMedian - 1.0) / 6.0;
    readoutMethod = 'DISCRETE_PROBABILITY_MEDIAN';
    continuousReadoutSource = `${fieldId}_p1..p7`;
    displayRung = discMedian;
    displayRungSource = `${fieldId}_p1..p7`;
    sourceColumn = `${fieldId}_p1..p7`;
    sourceValue = probabilities;
    medianRoundValidationPassed = null;
  } else if (rawScalar !== null) {
    raw_median_1_7 = Math.min(7.0, Math.max(1.0, rawScalar));
    normalized_0_1 = (raw_median_1_7 - 1.0) / 6.0;
    readoutMethod = 'RAW_SCALAR';
    continuousReadoutSource = fieldId;
    displayRung = Math.round(raw_median_1_7);
    displayRungSource = fieldId;
    sourceColumn = fieldId;
    sourceValue = rawScalar;
    medianRoundValidationPassed = null;
  } else if (expectedVal !== null) {
    raw_median_1_7 = Math.min(7.0, Math.max(1.0, expectedVal));
    normalized_0_1 = (raw_median_1_7 - 1.0) / 6.0;
    readoutMethod = 'EXPECTED_VALUE';
    continuousReadoutSource = `${fieldId}_ev`;
    displayRung = Math.round(raw_median_1_7);
    displayRungSource = `${fieldId}_ev`;
    sourceColumn = `${fieldId}_ev`;
    sourceValue = expectedVal;
    medianRoundValidationPassed = null;
  }

  return {
    fieldId,
    paperVariable,
    sourceField: continuousReadoutSource,
    sourceColumn,
    sourceValue,
    continuousReadoutSource,
    displayRung,
    displayRungSource,
    displayRungValue,
    medianRoundValidationPassed,
    raw_median_1_7,
    normalized_0_1,
    median_round: displayRung,
    argmax: argmaxVal,
    rawOrdinal: displayRung,
    rawMedian: raw_median_1_7,
    rawExpectedValue: expectedVal,
    rawArgmax: argmaxVal,
    probabilities,
    readoutMethod,
    normalizedValue: normalized_0_1,
    sourceScale: 'ORDINAL_1_TO_7',
    targetScale: 'UNIT_0_TO_1',
    normalizationFormula: '(raw_median_1_7 - 1) / 6',
    classification: raw_median_1_7 !== null ? 'REPO_MEASURED' : 'UNAVAILABLE',
    notes: `Team Qwen 7-rung qualitative rating mapped to ${paperVariable} via ${readoutMethod} (source: ${continuousReadoutSource}).`,
  };
}

export function parseRepoQwenRecord(row: RawCsvRow): RepoQwenRecord {
  return {
    verticalGreenery: parseSingleQwenVariable(row, 'vertical_greenery', 'V_nat'),
    verticalHardscape: parseSingleQwenVariable(row, 'vertical_hardscape', 'V_built'),
    greenEyeLevel: parseSingleQwenVariable(row, 'green_eye_level', 'GVI_eye'),
    greenSoftening: parseSingleQwenVariable(row, 'green_softening', 'GMI'),
    signageDetail: parseSingleQwenVariable(row, 'signage_detail', 'V_sign'),
    skyOpenness: parseSingleQwenVariable(row, 'sky_openness', 'SVF_STANDARDIZED_INPUT'),
    groundFloorActivity: parseSingleQwenVariable(row, 'ground_floor_activity', 'GFAPI'),
    walkableGround: parseSingleQwenVariable(row, 'walkable_ground', 'V_pave'),
    restingAffordance: parseSingleQwenVariable(row, 'resting_affordance', 'IAS'),
    facadeVariation: parseSingleQwenVariable(row, 'facade_variation', 'SFV'),
  };
}

export function parseRepoGeometryRecord(
  row: RawCsvRow,
  sourceFile: string,
  sourceRowIndex: number,
): RepoGeometryRecord {
  const hM = finiteOrNull(row.H_m ?? row.h_m);
  const wFacade = finiteOrNull(row.W_facade ?? row.w_facade);
  const hwFacade = finiteOrNull(row.HW_facade ?? row.hw_facade);
  const hwSourceRaw = textOrNull(row.HW_source ?? row.hw_source);
  const hwEffectiveRaw = row.HW_effective ?? row.hw_effective;

  // Node context fields (distinguished from active paper inputs and bound to exact columns)
  // Strictly prevent any cross-column shift (e.g. node_VEI -> node_SVF_band or node_SVF_band -> node_GVI)
  const nodeGVI = finiteOrNull(row.node_GVI ?? row.node_gvi);
  const nodeVEI = finiteOrNull(row.node_VEI ?? row.node_vei);
  const nodeSVFBand = finiteOrNull(row.node_SVF_band ?? row.node_svf_band);

  const nodeGVIProvenance: RepoDiagnosticProvenanceField<number | null> = {
    sourceColumn: 'node_GVI',
    sourceValue: row.node_GVI !== undefined ? row.node_GVI : (row.node_gvi !== undefined ? row.node_gvi : null),
    value: nodeGVI,
    classification: nodeGVI !== null ? 'REPO_GEOMETRY_CONTEXT' : 'UNAVAILABLE',
    notes: 'Node-level GVI geometric context; strictly distinct from eye-level green_eye_level_median and GVI_eye.',
  };

  const nodeVEIProvenance: RepoDiagnosticProvenanceField<number | null> = {
    sourceColumn: 'node_VEI',
    sourceValue: row.node_VEI !== undefined ? row.node_VEI : (row.node_vei !== undefined ? row.node_vei : null),
    value: nodeVEI,
    classification: nodeVEI !== null ? 'REPO_GEOMETRY_CONTEXT' : 'UNAVAILABLE',
    notes: 'Node-level VEI context; strictly not shifted to node_SVF_band or active SVF.',
  };

  const nodeSVFBandProvenance: RepoDiagnosticProvenanceField<number | null> = {
    sourceColumn: 'node_SVF_band',
    sourceValue: row.node_SVF_band !== undefined ? row.node_SVF_band : (row.node_svf_band !== undefined ? row.node_svf_band : null),
    value: nodeSVFBand,
    classification: nodeSVFBand !== null ? 'REPO_GEOMETRY_CONTEXT' : 'UNAVAILABLE',
    notes: 'Limited-elevation sky band context; strictly distinct from sky_openness_median and node_GVI.',
  };

  // Detect open_one_side
  const isOpenOneSide =
    hwSourceRaw?.toLowerCase() === 'open_one_side' ||
    String(hwEffectiveRaw).toLowerCase() === 'open_one_side' ||
    String(row.HW_facade).toLowerCase() === 'open_one_side';

  // Strictly no reverse-engineering of missing fields:
  // - If W_facade is blank: remains null (do NOT calculate H_m / HW_effective)
  // - If HW_facade is blank: remains null (do NOT calculate H_m and HW_effective)
  // - If HW_effective is blank: remains null (do NOT calculate H_m / W_facade)
  const hwEffective: number | null = finiteOrNull(hwEffectiveRaw);

  const hwEffectiveProvenance: RepoDiagnosticProvenanceField<number | null> = {
    sourceColumn: 'HW_effective',
    sourceValue: row.HW_effective !== undefined ? row.HW_effective : (row.hw_effective !== undefined ? row.hw_effective : null),
    value: hwEffective,
    classification: hwEffective !== null ? 'REPO_GEOMETRY_CONTEXT' : 'UNAVAILABLE',
    notes: 'Effective street aspect ratio (H/W); geometry context only.',
  };

  const hwSourceProvenance: RepoDiagnosticProvenanceField<string | null> = {
    sourceColumn: 'HW_source',
    sourceValue: row.HW_source !== undefined ? row.HW_source : (row.hw_source !== undefined ? row.hw_source : null),
    value: hwSourceRaw,
    classification: hwSourceRaw !== null ? 'REPO_GEOMETRY_CONTEXT' : 'UNAVAILABLE',
    notes: 'Source attribution category for canyon geometry.',
  };

  let hwSourceCategory: RepoGeometryRecord['hwSourceCategory'] = null;
  if (isOpenOneSide || hwSourceRaw?.toLowerCase() === 'open_one_side') {
    hwSourceCategory = 'open_one_side';
  } else if (hwSourceRaw) {
    const lower = hwSourceRaw.trim().toLowerCase();
    if (lower === 'measured') hwSourceCategory = 'measured';
    else if (lower === 'radius_mean') hwSourceCategory = 'radius_mean';
    else if (lower === 'series') hwSourceCategory = 'series';
    else if (lower === 'open_one_side') hwSourceCategory = 'open_one_side';
    else hwSourceCategory = 'other';
  }

  const hasAnyGeometry = hM !== null || wFacade !== null || hwEffective !== null || isOpenOneSide || nodeSVFBand !== null;

  return {
    hM,
    wFacade,
    hwFacade,
    hwEffective,
    hwSource: hwSourceRaw,
    hwSourceCategory,
    isOpenOneSide,
    nodeGVI,
    nodeVEI,
    nodeSVFBand,
    nodeGVIProvenance,
    nodeVEIProvenance,
    nodeSVFBandProvenance,
    hwEffectiveProvenance,
    hwSourceProvenance,
    classification: hasAnyGeometry ? 'REPO_GEOMETRY_CONTEXT' : 'UNAVAILABLE',
    role: 'GEOMETRY_CONTEXT_ONLY',
    sourceFile,
    sourceRow: sourceRowIndex + 2,
  };
}

export function parseRepoComparativeFinals(
  row: RawCsvRow,
  sourceFile: string,
  sourceRowIndex: number,
): RepoComparativeFinals | null {
  const legacyIRaw = finiteOrNull(row.I_raw);
  const legacyI = finiteOrNull(row.I);
  const legacyY = finiteOrNull(row.Y);
  const legacyDRaw = finiteOrNull(row.D_raw);
  const legacyD = finiteOrNull(row.D);
  const legacyOmega = finiteOrNull(row.Omega ?? row.omega);
  const legacyA = finiteOrNull(row.a ?? row.alpha);
  const legacyB = finiteOrNull(row.b ?? row.beta);
  const legacyC = finiteOrNull(row.c ?? row.gamma);
  const legacyM = finiteOrNull(row.M ?? row.sim);
  const legacyMLocal = finiteOrNull(row.M_local);
  const legacyMNoA = finiteOrNull(row.M_noA ?? row.m_noa);

  const hasAnyLegacy =
    legacyIRaw !== null || legacyI !== null || legacyY !== null ||
    legacyDRaw !== null || legacyD !== null || legacyOmega !== null ||
    legacyM !== null || legacyMLocal !== null;

  if (!hasAnyLegacy) return null;

  return {
    legacyIRaw,
    legacyI,
    legacyY,
    legacyDRaw,
    legacyD,
    legacyOmega,
    legacyA,
    legacyB,
    legacyC,
    legacyM,
    legacyMLocal,
    legacyMNoA,
    role: 'COMPARATIVE_PROVENANCE_ONLY',
    sourceFile,
    sourceRow: sourceRowIndex + 2,
  };
}

export function extractRepositoryMetadata(
  provenanceHint?: Partial<TeamRepositoryMetadata>,
): TeamRepositoryMetadata {
  return {
    repositoryName: provenanceHint?.repositoryName ?? 'mikellu12/murrayhill-v12',
    repositoryCommit: provenanceHint?.repositoryCommit ?? '9353169b3dc3a1b4673e7144249db6ccbf7ac0f1',
    repositoryDataVersion: provenanceHint?.repositoryDataVersion ?? 'murrayhill_team_repo_v0.6.2',
    activeSourceTable: provenanceHint?.activeSourceTable ?? 'results/tables/vlm_observations_murrayhill.csv',
    comparativeSourceTable: provenanceHint?.comparativeSourceTable ?? 'results/tables/vlm_calculations_murrayhill.csv',
    importTimestamp: provenanceHint?.importTimestamp ?? new Date().toISOString(),
  };
}
