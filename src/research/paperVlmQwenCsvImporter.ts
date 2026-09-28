import type {
  PaperVlmInstrumentFieldId,
  PaperVlmInstrumentFieldResult,
  PaperVlmInstrumentRun,
  PaperVlmRung,
  PaperVlmRungProbabilities,
} from '../types';

import {
  PAPER_VLM_FIELD_ORDER,
  getPaperVlmInstrumentFieldSpec,
  normalizePaperVlmExpectedValue,
} from './paperVlmInstrument';

/**
 * Step 4 — Teammate Qwen CSV importer
 * ---------------------------------------------------------------------------
 * Reads the actual results/tables/sim_vlm.csv layout produced by
 * tools/sim_vlm_run.py in the vlm-scaffolding-comparison branch.
 *
 * Important provenance rules:
 * 1. p1..p7 are imported only from the real CSV columns.
 * 2. We never fabricate a probability distribution from a generated scalar.
 * 3. EV remains the primary continuous readout.
 * 4. Model ID and horizon verification are explicit import-time provenance.
 * 5. The Nature 9.02 canonical path accepts only clearly identifiable standardized 90° rows.
 */

const EV_RECONSTRUCTION_TOLERANCE = 3e-3;

export interface QwenCsvIdentity {
  file: string;
  street: string;
  walk: string;
  seq: number;
  node_id: string;
  cardinal: string;
  side: string;
}

export interface QwenCsvRowSummary extends QwenCsvIdentity {
  rowIndex: number;
  team90ViewRecognized: boolean;
  viewProtocol:
    | 'team_walk_relative_half_90'
    | 'team_along_street_180'
    | 'unrecognized';
  viewCenterOffsetFromWalkDegrees: -45 | 0 | 45 | null;
  orientationAlignmentStatus:
    | 'unreconciled'
    | 'UNRESOLVED_PAPER_PROTOCOL_ALIGNMENT';
  completeInstrumentColumns: boolean;
  missingColumns: string[];
}

export interface QwenCsvImportOptions {
  /**
   * The teammate CSV does not store this teacher-protocol gate.
   * It must therefore be explicitly verified by the operator / preprocessing.
   */
  horizonAlignmentVerified: boolean;

  /**
   * The CSV does not store model ID. Require explicit provenance rather than
   * silently assuming that every CSV came from the branch default.
   *
   * Current teammate branch default:
   * Qwen/Qwen2-VL-7B-Instruct
   */
  modelId: string;

  /**
   * Active paper path should leave this true.
   * Set false only for diagnostics / legacy inspection.
   */
  requireRecognized90View?: boolean;
}

export interface QwenCsvImportedRecord {
  run: PaperVlmInstrumentRun;
  sourceIdentity: QwenCsvIdentity;
  sourceProtocol: {
    recognized_team_90_view: boolean;
    source_csv_format:
      | 'murrayhill_sim_vlm'
      | 'vlm_observations_murrayhill';
    source_filename?: string;
    source_schema?: 'MEDIAN_LED_REPOSITORY_TABLE' | 'LEGACY_SIM_VLM_TABLE';
    probability_storage_decimals: 4;
    view_protocol:
      | 'team_walk_relative_half_90'
      | 'team_along_street_180'
      | null;
    orientation_alignment_status:
      | 'unreconciled'
      | 'UNRESOLVED_SOURCE_PROTOCOL'
      | 'UNRESOLVED_PAPER_PROTOCOL_ALIGNMENT';
    view_center_offset_from_walk_degrees: -45 | 0 | 45 | null;
    field_of_view_degrees?: 90 | 180 | null;
  };
}

type CsvRow = Record<string, string>;

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

/**
 * Small dependency-free CSV parser suitable for the teammate output.
 * Handles quoted commas and escaped double quotes.
 */
export function parseQwenCsv(csvText: string): CsvRow[] {
  const normalized = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const physicalLines = normalized.split('\n');

  // Reconstruct records that contain newlines inside quoted cells.
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
    throw new Error('CSV contains an unterminated quoted field.');
  }

  if (records.length < 2) {
    throw new Error('CSV must contain a header and at least one data row.');
  }

  const headers = splitCsvLine(records[0]).map((header) => header.trim());

  if (new Set(headers).size !== headers.length) {
    throw new Error('CSV contains duplicate column names.');
  }

  return records.slice(1).map((record, rowIndex) => {
    const values = splitCsvLine(record);

    if (values.length !== headers.length) {
      throw new Error(
        `CSV row ${rowIndex + 2} has ${values.length} cells; expected ${headers.length}.`,
      );
    }

    return Object.fromEntries(
      headers.map((header, index) => [header, values[index]]),
    );
  });
}

function parseFiniteNumber(
  row: CsvRow,
  column: string,
  rowNumber: number,
): number {
  const raw = row[column];

  if (raw === undefined || raw.trim() === '') {
    throw new Error(`Row ${rowNumber}: missing numeric column "${column}".`);
  }

  const value = Number(raw);

  if (!Number.isFinite(value)) {
    throw new Error(
      `Row ${rowNumber}: "${column}" must be numeric; received "${raw}".`,
    );
  }

  return value;
}

function parseRung(
  row: CsvRow,
  column: string,
  rowNumber: number,
): PaperVlmRung {
  const value = parseFiniteNumber(row, column, rowNumber);

  if (!Number.isInteger(value) || value < 1 || value > 7) {
    throw new Error(
      `Row ${rowNumber}: "${column}" must be an integer rung from 1 to 7.`,
    );
  }

  return value as PaperVlmRung;
}

function getRequiredInstrumentColumns(): string[] {
  const columns = [
    'file',
    'street',
    'walk',
    'seq',
    'node_id',
    'cardinal',
    'side',
  ];

  for (const fieldId of PAPER_VLM_FIELD_ORDER) {
    columns.push(fieldId);
    columns.push(`${fieldId}_ev`);
    columns.push(`${fieldId}_argmax`);

    for (let k = 1; k <= 7; k += 1) {
      columns.push(`${fieldId}_p${k}`);
    }
  }

  return columns;
}

export const QWEN_CSV_REQUIRED_COLUMNS = getRequiredInstrumentColumns();

/**
 * The teammate runner supports:
 *   ..._<N/E/S/W>_<L/R>.jpg  -> explicit 90° half-view naming
 *   ..._<N/E/S/W>.jpg        -> legacy / 180° naming
 *
 * The teacher-paper active path must not silently reinterpret the latter.
 */
export function isRecognizedTeam90View(row: CsvRow): boolean {
  const file = (row.file || '').replace(/\\/g, '/');
  const side = (row.side || '').trim().toUpperCase();

  return (
    /^[LR]$/.test(side) &&
    /_[NESW]_[LR]\.(?:jpg|jpeg|png)$/i.test(file)
  );
}

export function teamHalfViewOffsetFromWalk(
  side: string,
): -45 | 45 | null {
  const normalized = side.trim().toUpperCase();

  if (normalized === 'L') {
    return -45;
  }

  if (normalized === 'R') {
    return 45;
  }

  return null;
}

function getIdentity(row: CsvRow, rowNumber: number): QwenCsvIdentity {
  const requiredIdentity = [
    'file',
    'street',
    'walk',
    'node_id',
    'cardinal',
    'side',
  ] as const;

  for (const column of requiredIdentity) {
    if (!row[column] || !row[column].trim()) {
      throw new Error(`Row ${rowNumber}: missing identity column "${column}".`);
    }
  }

  return {
    file: row.file,
    street: row.street,
    walk: row.walk,
    seq: parseFiniteNumber(row, 'seq', rowNumber),
    node_id: row.node_id,
    cardinal: row.cardinal,
    side: row.side,
  };
}

function getProbabilities(
  row: CsvRow,
  fieldId: PaperVlmInstrumentFieldId,
  rowNumber: number,
): PaperVlmRungProbabilities {
  const values = Array.from({ length: 7 }, (_, index) =>
    parseFiniteNumber(row, `${fieldId}_p${index + 1}`, rowNumber),
  );

  for (const [index, value] of values.entries()) {
    if (value < 0 || value > 1) {
      throw new Error(
        `Row ${rowNumber}: ${fieldId}_p${index + 1} must lie in [0,1].`,
      );
    }
  }

  const total = values.reduce((sum, value) => sum + value, 0);

  if (Math.abs(total - 1) > 1e-3) {
    throw new Error(
      `Row ${rowNumber}: ${fieldId} p1–p7 sum to ${total.toFixed(
        6,
      )}, not approximately 1.`,
    );
  }

  // Preserve the stored four-decimal values exactly in the imported record.
  return {
    p1: values[0],
    p2: values[1],
    p3: values[2],
    p4: values[3],
    p5: values[4],
    p6: values[5],
    p7: values[6],
  };
}

function reconstructedEv(probabilities: PaperVlmRungProbabilities): number {
  const values = [
    probabilities.p1,
    probabilities.p2,
    probabilities.p3,
    probabilities.p4,
    probabilities.p5,
    probabilities.p6,
    probabilities.p7,
  ];

  const total = values.reduce((sum, value) => sum + value, 0);

  return values.reduce(
    (sum, probability, index) =>
      sum + (probability / total) * (index + 1),
    0,
  );
}

function buildFieldResult(
  row: CsvRow,
  fieldId: PaperVlmInstrumentFieldId,
  rowNumber: number,
): PaperVlmInstrumentFieldResult {
  const spec = getPaperVlmInstrumentFieldSpec(fieldId);

  const rung = parseRung(row, fieldId, rowNumber);
  const expectedValue = parseFiniteNumber(row, `${fieldId}_ev`, rowNumber);
  const argmax = parseRung(row, `${fieldId}_argmax`, rowNumber);
  const probabilities = getProbabilities(row, fieldId, rowNumber);

  if (expectedValue < 1 || expectedValue > 7) {
    throw new Error(
      `Row ${rowNumber}: ${fieldId}_ev must lie in [1,7].`,
    );
  }

  const evFromStoredProbabilities = reconstructedEv(probabilities);

  if (
    Math.abs(expectedValue - evFromStoredProbabilities) >
    EV_RECONSTRUCTION_TOLERANCE
  ) {
    throw new Error(
      `Row ${rowNumber}: ${fieldId}_ev is inconsistent with stored p1–p7. ` +
        `CSV EV=${expectedValue.toFixed(6)}, reconstructed=${evFromStoredProbabilities.toFixed(6)}.`,
    );
  }

  if (rung !== Math.round(expectedValue)) {
    throw new Error(
      `Row ${rowNumber}: ${fieldId} rung=${rung} does not equal round(EV=${expectedValue.toFixed(
        6,
      )}).`,
    );
  }

  return {
    field_id: fieldId,
    paper_variable: spec.paperVariable,
    rung,
    expected_value: expectedValue,
    argmax,
    probabilities,
    normalized_ev: normalizePaperVlmExpectedValue(expectedValue),
    instrument_version: 'qwen_7_rung_v0.3',
    validation: { ...spec.validation },
  };
}

export function summarizeQwenCsvRows(csvText: string): QwenCsvRowSummary[] {
  const rows = parseQwenCsv(csvText);

  return rows.map((row, index) => {
    const rowNumber = index + 2;
    const identity = getIdentity(row, rowNumber);
    const missingColumns = QWEN_CSV_REQUIRED_COLUMNS.filter(
      (column) => row[column] === undefined || row[column] === '',
    );

    const team90ViewRecognized = isRecognizedTeam90View(row);
    const offset = teamHalfViewOffsetFromWalk(identity.side);

    return {
      ...identity,
      rowIndex: index,
      team90ViewRecognized,
      viewProtocol: team90ViewRecognized
        ? 'team_walk_relative_half_90'
        : 'unrecognized',
      viewCenterOffsetFromWalkDegrees: offset,
      orientationAlignmentStatus: 'unreconciled',
      completeInstrumentColumns: missingColumns.length === 0,
      missingColumns,
    };
  });
}

export function importQwenCsvRow(
  csvText: string,
  rowIndex: number,
  options: QwenCsvImportOptions,
): QwenCsvImportedRecord {
  const rows = parseQwenCsv(csvText);

  if (!Number.isInteger(rowIndex) || rowIndex < 0 || rowIndex >= rows.length) {
    throw new Error(`Invalid CSV rowIndex ${rowIndex}.`);
  }

  if (!options.modelId || !options.modelId.trim()) {
    throw new Error(
      'modelId is required because the teammate CSV does not store model provenance.',
    );
  }

  const row = rows[rowIndex];
  const rowNumber = rowIndex + 2;
  const identity = getIdentity(row, rowNumber);
  const recognized90 = isRecognizedTeam90View(row);
  const viewOffset = teamHalfViewOffsetFromWalk(identity.side);
  const require90 = options.requireRecognized90View !== false;

  if (require90 && !recognized90) {
    throw new Error(
      `Row ${rowNumber} is not an explicitly recognized team 90° half-view. ` +
        'The Nature 9.02 canonical paper path must not silently reinterpret a legacy/180° record as a standardized 90° quadrant.',
    );
  }

  if (viewOffset === null) {
    throw new Error(
      `Row ${rowNumber} has no valid L/R walk-relative side provenance.`,
    );
  }

  const fields: PaperVlmInstrumentRun['fields'] = {};

  for (const fieldId of PAPER_VLM_FIELD_ORDER) {
    fields[fieldId] = buildFieldResult(row, fieldId, rowNumber);
  }

  const complete = PAPER_VLM_FIELD_ORDER.every(
    (fieldId) => fields[fieldId] !== undefined,
  );

  const warnings: string[] = [];

  if (!recognized90) {
    warnings.push(
      'Source row is not identified as a team 90° half-view and is diagnostic-only.',
    );
  }

  if (!options.horizonAlignmentVerified) {
    warnings.push(
      'Horizon alignment is not verified; imported VLM values remain gated from paper-variable assembly.',
    );
  }

  warnings.push(
    'CSV does not encode model ID; the importer uses the model ID explicitly supplied by the operator.',
  );

  // The team rating set uses 90° halves centred ±45° from the walk bearing.
  // Nature 9.02 defines the canonical target as street-relative orthogonal
  // 0°/90°/180°/270° quadrants. Until the 45° boundary rotation is explicitly
  // reconciled or rerun, team CSV rows are comparison-only.
  const eligibleForPaperAssembly = false;

  warnings.push(
    'Orientation protocol is unreconciled: team svi_90 is walk-relative (centre = walk bearing ±45°), while Nature 9.02 canonical sampling uses street-relative 0°/90°/180°/270° quadrants. Import remains comparison-only.',
  );

  const run: PaperVlmInstrumentRun = {
    schema_version: 'paper_vlm_instrument_v0.3',

    node_metadata: {
      image_quadrant: null,
      view_protocol: 'team_walk_relative_half_90',
      orientation_alignment_status: 'unreconciled',
      walk_cardinal: identity.cardinal.trim().toUpperCase() as
        | 'N'
        | 'E'
        | 'S'
        | 'W',
      walk_side: identity.side.trim().toUpperCase() as 'L' | 'R',
      view_center_offset_from_walk_degrees: viewOffset,
      horizon_alignment_verified: options.horizonAlignmentVerified,
      field_of_view_degrees: 90,
      eye_height_m: 1.5,
      pitch_degrees: 0,
      node_id: identity.node_id,
      source_image_id: identity.file,
    },

    model: {
      family: 'Qwen',
      model_id: options.modelId.trim(),
      inference_mode: 'one_field_per_call',
      score_readout: 'next_token_logits_1_to_7',
    },

    fields,
    complete,
    eligible_for_paper_assembly: eligibleForPaperAssembly,
    warnings,
  };

  return {
    run,
    sourceIdentity: identity,
    sourceProtocol: {
      recognized_team_90_view: recognized90,
      source_csv_format: 'murrayhill_sim_vlm',
      probability_storage_decimals: 4,
      view_protocol: 'team_walk_relative_half_90',
      orientation_alignment_status: 'unreconciled',
      view_center_offset_from_walk_degrees: viewOffset,
    },
  };
}

export function findQwenCsvRowsByNodeId(
  csvText: string,
  nodeId: string,
): QwenCsvRowSummary[] {
  const target = nodeId.trim();

  return summarizeQwenCsvRows(csvText).filter(
    (row) => row.node_id === target,
  );
}

export function findQwenCsvRowByFile(
  csvText: string,
  file: string,
): QwenCsvRowSummary | null {
  const normalizedTarget = file.replace(/\\/g, '/');

  return (
    summarizeQwenCsvRows(csvText).find(
      (row) => row.file.replace(/\\/g, '/') === normalizedTarget,
    ) || null
  );
}