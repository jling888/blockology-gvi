/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ============================================================================
 * STREET-VIEW SAMPLING NODE CSV PARSER
 * Nature 9.03 Final · No-Omega v0.7.0 — Multi-Source Research Integration
 * ============================================================================
 *
 * Strict CSV Parser Rules:
 *   - Binds ONLY by exact CSV header names.
 *   - No positional column assumptions.
 *   - No silent defaults.
 *   - Parse failure: value = null, status = SOURCE_PARSE_ERROR.
 *   - Never replace missing numbers with 0.
 *
 * Validation:
 *   - lat: -90 <= lat <= 90
 *   - lng: -180 <= lng <= 180
 *   - heading: 0 <= heading < 360
 *   - sequence: positive integer (>= 1)
 *   - boolean diagnostics: parse exact supported representations only
 *
 * Heading Consistency:
 *   expected_reverse = (heading_fwd_deg + 180) % 360
 *   If supplied differs beyond tolerance:
 *     status = SOURCE_HEADING_INCONSISTENCY
 *   Do not silently repair the source value.
 *   Preserve both source_heading_rev_deg and derived_expected_heading_rev_deg.
 */

import {
  STREET_VIEW_NODES_REQUIRED_HEADERS,
  type StreetViewNodeRawRecord,
  type StreetViewNodeParseStatus,
  type StreetViewNodeHeadingConsistencyStatus,
} from './streetViewNodeTypes';

export interface StreetViewCsvParseResult {
  schemaValid: boolean;
  requiredHeadersFound: string[];
  missingHeaders: string[];
  records: StreetViewNodeRawRecord[];
  errors: string[];
  totalRowsParsed: number;
}

/**
 * Split CSV line taking quoted fields into account
 */
function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parse source integer flag (0 or 1, or string "0" or "1").
 * Section O: Do not accept arbitrary boolean synonyms (e.g. 'true', 'yes').
 */
export function parseBooleanDiagnostic(val: string | undefined | null): {
  parsed: boolean | null;
  valid: boolean;
} {
  if (val === undefined || val === null || val.trim() === '') {
    return { parsed: null, valid: false };
  }
  const clean = val.trim();
  if (clean === '1') {
    return { parsed: true, valid: true };
  }
  if (clean === '0') {
    return { parsed: false, valid: true };
  }
  return { parsed: null, valid: false };
}

/**
 * Circular angular difference on [0, 360)
 */
export function calculateCircularHeadingDiff(a: number, b: number): number {
  const rawDiff = Math.abs(a - b) % 360;
  return Math.min(rawDiff, 360 - rawDiff);
}

/**
 * Parse a single row mapped from header-name to raw string value
 */
export function parseStreetViewNodeRow(
  rowMap: Record<string, string>,
  rowIndex = 1
): StreetViewNodeRawRecord {
  const parseErrors: string[] = [];
  let status: StreetViewNodeParseStatus = 'PARSED';

  // 1. node_id
  const rawNodeId = rowMap['node_id'];
  const nodeId = rawNodeId && rawNodeId.trim() !== '' ? rawNodeId.trim() : null;
  if (!nodeId) {
    parseErrors.push(`Row ${rowIndex}: Missing required 'node_id'.`);
    status = 'SOURCE_PARSE_ERROR';
  }

  // 2. street_name
  const rawStreetName = rowMap['street_name'];
  const streetName = rawStreetName && rawStreetName.trim() !== '' ? rawStreetName.trim() : null;
  if (!streetName) {
    parseErrors.push(`Row ${rowIndex}: Missing required 'street_name'.`);
    status = 'SOURCE_PARSE_ERROR';
  }

  // 3. lat: -90 <= lat <= 90
  const rawLat = rowMap['lat'];
  let lat: number | null = null;
  if (rawLat === undefined || rawLat === null || rawLat.trim() === '') {
    parseErrors.push(`Row ${rowIndex}: Missing 'lat'.`);
    status = 'SOURCE_PARSE_ERROR';
  } else {
    const parsedLat = Number(rawLat.trim());
    if (isNaN(parsedLat) || !isFinite(parsedLat)) {
      parseErrors.push(`Row ${rowIndex}: Malformed non-numeric lat '${rawLat}'.`);
      status = 'SOURCE_PARSE_ERROR';
    } else if (parsedLat < -90 || parsedLat > 90) {
      parseErrors.push(`Row ${rowIndex}: Latitude ${parsedLat} outside valid WGS84 range [-90, 90].`);
      status = 'SOURCE_PARSE_ERROR';
    } else {
      lat = parsedLat;
    }
  }

  // 4. lng: -180 <= lng <= 180
  const rawLng = rowMap['lng'];
  let lng: number | null = null;
  if (rawLng === undefined || rawLng === null || rawLng.trim() === '') {
    parseErrors.push(`Row ${rowIndex}: Missing 'lng'.`);
    status = 'SOURCE_PARSE_ERROR';
  } else {
    const parsedLng = Number(rawLng.trim());
    if (isNaN(parsedLng) || !isFinite(parsedLng)) {
      parseErrors.push(`Row ${rowIndex}: Malformed non-numeric lng '${rawLng}'.`);
      status = 'SOURCE_PARSE_ERROR';
    } else if (parsedLng < -180 || parsedLng > 180) {
      parseErrors.push(`Row ${rowIndex}: Longitude ${parsedLng} outside valid WGS84 range [-180, 180].`);
      status = 'SOURCE_PARSE_ERROR';
    } else {
      lng = parsedLng;
    }
  }

  // 5. heading_fwd_deg: 0 <= heading < 360
  const rawHeadingFwd = rowMap['heading_fwd_deg'];
  let headingFwd: number | null = null;
  if (rawHeadingFwd === undefined || rawHeadingFwd === null || rawHeadingFwd.trim() === '') {
    parseErrors.push(`Row ${rowIndex}: Missing 'heading_fwd_deg'.`);
    status = 'SOURCE_PARSE_ERROR';
  } else {
    const parsedHeadingFwd = Number(rawHeadingFwd.trim());
    if (isNaN(parsedHeadingFwd) || !isFinite(parsedHeadingFwd)) {
      parseErrors.push(`Row ${rowIndex}: Malformed heading_fwd_deg '${rawHeadingFwd}'.`);
      status = 'SOURCE_PARSE_ERROR';
    } else if (parsedHeadingFwd < 0 || parsedHeadingFwd >= 360) {
      parseErrors.push(`Row ${rowIndex}: Heading forward ${parsedHeadingFwd} outside [0, 360).`);
      status = 'SOURCE_PARSE_ERROR';
    } else {
      headingFwd = parsedHeadingFwd;
    }
  }

  // 6. heading_rev_deg: 0 <= heading < 360
  const rawHeadingRev = rowMap['heading_rev_deg'];
  let headingRev: number | null = null;
  if (rawHeadingRev === undefined || rawHeadingRev === null || rawHeadingRev.trim() === '') {
    parseErrors.push(`Row ${rowIndex}: Missing 'heading_rev_deg'.`);
    status = 'SOURCE_PARSE_ERROR';
  } else {
    const parsedHeadingRev = Number(rawHeadingRev.trim());
    if (isNaN(parsedHeadingRev) || !isFinite(parsedHeadingRev)) {
      parseErrors.push(`Row ${rowIndex}: Malformed heading_rev_deg '${rawHeadingRev}'.`);
      status = 'SOURCE_PARSE_ERROR';
    } else if (parsedHeadingRev < 0 || parsedHeadingRev >= 360) {
      parseErrors.push(`Row ${rowIndex}: Heading reverse ${parsedHeadingRev} outside [0, 360).`);
      status = 'SOURCE_PARSE_ERROR';
    } else {
      headingRev = parsedHeadingRev;
    }
  }

  // 7. seq_fwd: positive integer >= 1
  const rawSeqFwd = rowMap['seq_fwd'];
  let seqFwd: number | null = null;
  if (rawSeqFwd === undefined || rawSeqFwd === null || rawSeqFwd.trim() === '') {
    parseErrors.push(`Row ${rowIndex}: Missing 'seq_fwd'.`);
    status = 'SOURCE_PARSE_ERROR';
  } else {
    const parsedSeqFwd = Number(rawSeqFwd.trim());
    if (isNaN(parsedSeqFwd) || !Number.isInteger(parsedSeqFwd) || parsedSeqFwd < 1) {
      parseErrors.push(`Row ${rowIndex}: Invalid seq_fwd '${rawSeqFwd}'; must be positive integer >= 1.`);
      status = 'SOURCE_PARSE_ERROR';
    } else {
      seqFwd = parsedSeqFwd;
    }
  }

  // 8. seq_rev: positive integer >= 1
  const rawSeqRev = rowMap['seq_rev'];
  let seqRev: number | null = null;
  if (rawSeqRev === undefined || rawSeqRev === null || rawSeqRev.trim() === '') {
    parseErrors.push(`Row ${rowIndex}: Missing 'seq_rev'.`);
    status = 'SOURCE_PARSE_ERROR';
  } else {
    const parsedSeqRev = Number(rawSeqRev.trim());
    if (isNaN(parsedSeqRev) || !Number.isInteger(parsedSeqRev) || parsedSeqRev < 1) {
      parseErrors.push(`Row ${rowIndex}: Invalid seq_rev '${rawSeqRev}'; must be positive integer >= 1.`);
      status = 'SOURCE_PARSE_ERROR';
    } else {
      seqRev = parsedSeqRev;
    }
  }

  // 9. is_tunnel
  const rawIsTunnel = rowMap['is_tunnel'];
  let isTunnel: boolean | null = null;
  const tunnelResult = parseBooleanDiagnostic(rawIsTunnel);
  if (!tunnelResult.valid) {
    parseErrors.push(`Row ${rowIndex}: Invalid boolean is_tunnel '${rawIsTunnel}'.`);
    status = 'SOURCE_PARSE_ERROR';
  } else {
    isTunnel = tunnelResult.parsed;
  }

  // 10. is_bridge
  const rawIsBridge = rowMap['is_bridge'];
  let isBridge: boolean | null = null;
  const bridgeResult = parseBooleanDiagnostic(rawIsBridge);
  if (!bridgeResult.valid) {
    parseErrors.push(`Row ${rowIndex}: Invalid boolean is_bridge '${rawIsBridge}'.`);
    status = 'SOURCE_PARSE_ERROR';
  } else {
    isBridge = bridgeResult.parsed;
  }

  // Heading consistency check:
  // expected_reverse = (heading_fwd_deg + 180) % 360
  let derivedExpectedHeadingRev: number | null = null;
  let headingConsistencyStatus: StreetViewNodeHeadingConsistencyStatus = 'INDETERMINATE';

  if (headingFwd !== null) {
    derivedExpectedHeadingRev = (headingFwd + 180) % 360;
    if (headingRev !== null) {
      const diff = calculateCircularHeadingDiff(headingRev, derivedExpectedHeadingRev);
      if (diff <= 0.01) {
        headingConsistencyStatus = 'CONSISTENT';
      } else {
        headingConsistencyStatus = 'SOURCE_HEADING_INCONSISTENCY';
        parseErrors.push(
          `Row ${rowIndex}: Heading inconsistency: supplied heading_rev_deg=${headingRev} differs from derived expected reverse=${derivedExpectedHeadingRev} (diff=${diff.toFixed(2)}°).`
        );
      }
    }
  }

  return {
    node_id: nodeId,
    street_name: streetName,
    lat,
    lng,
    heading_fwd_deg: headingFwd,
    heading_rev_deg: headingRev,
    seq_fwd: seqFwd,
    seq_rev: seqRev,
    is_tunnel: isTunnel,
    is_bridge: isBridge,
    source_heading_rev_deg: headingRev,
    derived_expected_heading_rev_deg: derivedExpectedHeadingRev,
    heading_consistency_status: headingConsistencyStatus,
    status,
    parse_errors: parseErrors,
  };
}

/**
 * Parse an entire CSV string of street-view nodes strictly binding by header names
 */
export function parseStreetViewNodesCsv(csvText: string): StreetViewCsvParseResult {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) {
    return {
      schemaValid: false,
      requiredHeadersFound: [],
      missingHeaders: [...STREET_VIEW_NODES_REQUIRED_HEADERS],
      records: [],
      errors: ['Empty CSV content.'],
      totalRowsParsed: 0,
    };
  }

  const rawHeaders = splitCsvLine(lines[0]);
  const headerIndices = new Map<string, number>();
  rawHeaders.forEach((h, idx) => {
    headerIndices.set(h.trim(), idx);
  });

  const missingHeaders: string[] = [];
  const requiredHeadersFound: string[] = [];

  for (const req of STREET_VIEW_NODES_REQUIRED_HEADERS) {
    if (headerIndices.has(req)) {
      requiredHeadersFound.push(req);
    } else {
      missingHeaders.push(req);
    }
  }

  const schemaValid = missingHeaders.length === 0;
  const errors: string[] = [];
  if (!schemaValid) {
    errors.push(`Missing required CSV headers: ${missingHeaders.join(', ')}`);
  }

  const records: StreetViewNodeRawRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawCols = splitCsvLine(lines[i]);
    const rowMap: Record<string, string> = {};

    headerIndices.forEach((colIdx, colName) => {
      rowMap[colName] = colIdx < rawCols.length ? rawCols[colIdx] : '';
    });

    const parsed = parseStreetViewNodeRow(rowMap, i);
    records.push(parsed);
  }

  return {
    schemaValid,
    requiredHeadersFound,
    missingHeaders,
    records,
    errors,
    totalRowsParsed: records.length,
  };
}
