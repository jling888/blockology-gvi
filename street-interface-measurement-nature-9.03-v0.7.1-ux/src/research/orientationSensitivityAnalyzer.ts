import {
  parseQwenCsv,
  QWEN_CSV_REQUIRED_COLUMNS,
} from './paperVlmQwenCsvImporter';

import {
  PAPER_VLM_FIELD_ORDER,
} from './paperVlmInstrument';

import type {
  PaperVlmInstrumentFieldId,
} from '../types';

/**
 * STEP 11 — Paired Orientation Sensitivity Analyzer
 *
 * Analysis-only choice:
 * each protocol supplies four non-overlapping 90° sectors per node.
 * For sensitivity comparison, the four view-level normalized EV values are
 * aggregated with equal angular weight (simple arithmetic mean) into one
 * node-level score per field.
 *
 * This aggregation is NOT claimed to be the final manuscript aggregation rule.
 */

export type OrientationSensitivityArmId =
  | 'teacher_orthogonal_90'
  | 'team_walk_relative_90';

export interface OrientationSensitivityArmSummary {
  armId: OrientationSensitivityArmId;
  filename: string;
  totalRows: number;
  uniqueNodes: number;
  completeFourViewNodes: number;
  excludedNodes: number;
  warnings: string[];
}

export interface OrientationSensitivityNodeAggregate {
  nodeId: string;
  viewCount: number;
  normalizedFieldMeans: Record<PaperVlmInstrumentFieldId, number>;
}

export interface OrientationSensitivityFieldResult {
  fieldId: PaperVlmInstrumentFieldId;
  pairedNodeCount: number;
  meanSignedDifference: number;
  meanAbsoluteDifference: number;
  medianAbsoluteDifference: number;
  spearmanRho: number | null;
  maxAbsoluteDifference: number;
}

export interface OrientationSensitivityAnalysisResult {
  teacherArm: OrientationSensitivityArmSummary;
  teamArm: OrientationSensitivityArmSummary;
  pairedNodeCount: number;
  teacherOnlyNodeCount: number;
  teamOnlyNodeCount: number;
  fields: OrientationSensitivityFieldResult[];
  warnings: string[];
}

type CsvRow = Record<string, string>;

function parseFinite(
  raw: string | undefined,
  label: string,
): number {
  if (raw === undefined || raw.trim() === '') {
    throw new Error(`Missing numeric value: ${label}.`);
  }

  const value = Number(raw);

  if (!Number.isFinite(value)) {
    throw new Error(`Invalid numeric value for ${label}: ${raw}.`);
  }

  return value;
}

function normalizedEvFromRow(
  row: CsvRow,
  fieldId: PaperVlmInstrumentFieldId,
): number {
  const ev = parseFinite(row[`${fieldId}_ev`], `${fieldId}_ev`);

  if (ev < 1 || ev > 7) {
    throw new Error(
      `${fieldId}_ev must lie in [1,7]; received ${ev}.`,
    );
  }

  return (ev - 1) / 6;
}

function requiredColumnsMissing(row: CsvRow): string[] {
  return QWEN_CSV_REQUIRED_COLUMNS.filter(
    (column) =>
      row[column] === undefined ||
      row[column].trim() === '',
  );
}

function buildNodeAggregates(
  csvText: string,
  armId: OrientationSensitivityArmId,
  filename: string,
): {
  summary: OrientationSensitivityArmSummary;
  nodes: Map<string, OrientationSensitivityNodeAggregate>;
} {
  const rows = parseQwenCsv(csvText);
  const byNode = new Map<string, CsvRow[]>();
  const warnings: string[] = [];

  rows.forEach((row, index) => {
    const nodeId = row.node_id?.trim();

    if (!nodeId) {
      warnings.push(`CSV row ${index + 2} has no node_id and was excluded.`);
      return;
    }

    const missing = requiredColumnsMissing(row);

    if (missing.length > 0) {
      warnings.push(
        `Node ${nodeId}, row ${index + 2} is missing ${missing.length} required full-schema columns and was excluded.`,
      );
      return;
    }

    const current = byNode.get(nodeId) ?? [];
    current.push(row);
    byNode.set(nodeId, current);
  });

  const nodes = new Map<string, OrientationSensitivityNodeAggregate>();
  let excludedNodes = 0;

  for (const [nodeId, nodeRows] of byNode.entries()) {
    if (nodeRows.length !== 4) {
      excludedNodes += 1;
      warnings.push(
        `Node ${nodeId} has ${nodeRows.length} valid rows; exactly 4 are required for equal-angular 360° aggregation.`,
      );
      continue;
    }

    const normalizedFieldMeans =
      {} as Record<PaperVlmInstrumentFieldId, number>;

    for (const fieldId of PAPER_VLM_FIELD_ORDER) {
      const values = nodeRows.map((row) =>
        normalizedEvFromRow(row, fieldId),
      );

      normalizedFieldMeans[fieldId] =
        values.reduce((sum, value) => sum + value, 0) /
        values.length;
    }

    nodes.set(nodeId, {
      nodeId,
      viewCount: 4,
      normalizedFieldMeans,
    });
  }

  return {
    summary: {
      armId,
      filename,
      totalRows: rows.length,
      uniqueNodes: byNode.size,
      completeFourViewNodes: nodes.size,
      excludedNodes,
      warnings,
    },
    nodes,
  };
}

function mean(values: number[]): number {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : NaN;
}

function median(values: number[]): number {
  if (!values.length) {
    return NaN;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const midpoint = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[midpoint - 1] + sorted[midpoint]) / 2
    : sorted[midpoint];
}

function averageRanks(values: number[]): number[] {
  const indexed = values
    .map((value, index) => ({ value, index }))
    .sort((a, b) => a.value - b.value);

  const ranks = new Array<number>(values.length);
  let i = 0;

  while (i < indexed.length) {
    let j = i + 1;

    while (
      j < indexed.length &&
      indexed[j].value === indexed[i].value
    ) {
      j += 1;
    }

    // Rank positions are 1-based.
    const averageRank = ((i + 1) + j) / 2;

    for (let k = i; k < j; k += 1) {
      ranks[indexed[k].index] = averageRank;
    }

    i = j;
  }

  return ranks;
}

function pearson(
  x: number[],
  y: number[],
): number | null {
  if (x.length !== y.length || x.length < 2) {
    return null;
  }

  const mx = mean(x);
  const my = mean(y);

  let numerator = 0;
  let dx2 = 0;
  let dy2 = 0;

  for (let i = 0; i < x.length; i += 1) {
    const dx = x[i] - mx;
    const dy = y[i] - my;

    numerator += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }

  if (dx2 === 0 || dy2 === 0) {
    return null;
  }

  return numerator / Math.sqrt(dx2 * dy2);
}

function spearman(
  x: number[],
  y: number[],
): number | null {
  if (x.length !== y.length || x.length < 2) {
    return null;
  }

  return pearson(
    averageRanks(x),
    averageRanks(y),
  );
}

export function analyzeOrientationSensitivity(
  teacherCsvText: string,
  teacherFilename: string,
  teamCsvText: string,
  teamFilename: string,
): OrientationSensitivityAnalysisResult {
  const teacher = buildNodeAggregates(
    teacherCsvText,
    'teacher_orthogonal_90',
    teacherFilename,
  );

  const team = buildNodeAggregates(
    teamCsvText,
    'team_walk_relative_90',
    teamFilename,
  );

  const pairedNodeIds = [...teacher.nodes.keys()].filter(
    (nodeId) => team.nodes.has(nodeId),
  );

  if (pairedNodeIds.length === 0) {
    throw new Error(
      'No common complete four-view node_id values were found between the two arms.',
    );
  }

  const teacherOnlyNodeCount =
    [...teacher.nodes.keys()].filter(
      (nodeId) => !team.nodes.has(nodeId),
    ).length;

  const teamOnlyNodeCount =
    [...team.nodes.keys()].filter(
      (nodeId) => !teacher.nodes.has(nodeId),
    ).length;

  const fields: OrientationSensitivityFieldResult[] =
    PAPER_VLM_FIELD_ORDER.map((fieldId) => {
      const teacherValues = pairedNodeIds.map(
        (nodeId) =>
          teacher.nodes.get(nodeId)!
            .normalizedFieldMeans[fieldId],
      );

      const teamValues = pairedNodeIds.map(
        (nodeId) =>
          team.nodes.get(nodeId)!
            .normalizedFieldMeans[fieldId],
      );

      const signedDifferences = teacherValues.map(
        (value, index) => value - teamValues[index],
      );

      const absoluteDifferences = signedDifferences.map(
        (value) => Math.abs(value),
      );

      return {
        fieldId,
        pairedNodeCount: pairedNodeIds.length,
        meanSignedDifference: mean(signedDifferences),
        meanAbsoluteDifference: mean(absoluteDifferences),
        medianAbsoluteDifference: median(absoluteDifferences),
        spearmanRho: spearman(teacherValues, teamValues),
        maxAbsoluteDifference: Math.max(...absoluteDifferences),
      };
    });

  const warnings = [
    ...teacher.summary.warnings,
    ...team.summary.warnings,
  ];

  warnings.push(
    'Node-level comparison uses an equal-angular-weight mean across four 90° views per protocol. This is a sensitivity-study analysis choice, not yet a finalized manuscript aggregation rule.',
  );

  warnings.push(
    'No equivalence threshold is applied. Statistical outputs describe orientation sensitivity only.',
  );

  return {
    teacherArm: teacher.summary,
    teamArm: team.summary,
    pairedNodeCount: pairedNodeIds.length,
    teacherOnlyNodeCount,
    teamOnlyNodeCount,
    fields,
    warnings,
  };
}