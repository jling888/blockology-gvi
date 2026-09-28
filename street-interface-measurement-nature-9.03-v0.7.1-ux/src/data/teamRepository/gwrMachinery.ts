/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ============================================================================
 * GWR MACHINERY TABLE & PARSER
 * Nature 9.03 Final · No-Omega v0.7.0
 * Pinned Source: results/tables/gwr_machinery.csv
 * Classification: REPO_DERIVED_GWR_MACHINERY
 * ============================================================================
 *
 * Repository gwr_machinery.py computes outcome-independent GWR trace machinery
 * on candidate bandwidths (60, 100, 150, 250, 400 m) over the street network frame.
 *
 * It does NOT fit local coefficients (beta0, betaI, betaY, betaD, etc.) and
 * cannot minimize empirical AICc without observed outcome t_base.
 */

export interface GwrMachineryRow {
  bandwidth: number;
  tr_S: number;
  tr_SS: number;
  eff_df: number;
  s2_divisor: number;
  aicc_penalty: number;
}

export const GWR_MACHINERY_CSV_HEADERS = [
  'bandwidth',
  'tr_S',
  'tr_SS',
  'eff_df',
  's2_divisor',
  'aicc_penalty',
] as const;

export const RAW_PINNED_GWR_MACHINERY_CSV = `bandwidth,tr_S,tr_SS,eff_df,s2_divisor,aicc_penalty
60,97.19922039706658,61.63792241315478,583.8007796029334,548.2394816190216,910.8851133752079
100,42.66357115679539,26.199468878295285,638.3364288432047,621.8723265647045,774.4565132844356
150,22.70126389574217,14.006946061004948,658.2987361042578,649.6044182695206,730.186627445939
250,10.976372333882086,7.015799072959707,670.0236276661179,666.0630544051955,705.4180272122053
400,6.56020560964402,4.735319183534273,674.4397943903559,672.6149079642462,696.3128951115551`;

export function parseGwrMachineryCsv(csvText: string): {
  sourceFile: string;
  classification: 'REPO_DERIVED_GWR_MACHINERY';
  headers: string[];
  rows: GwrMachineryRow[];
} {
  const lines = csvText.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    throw new Error('Invalid GWR machinery CSV: empty or missing header');
  }

  const headerLine = lines[0];
  const headers = headerLine.split(',').map((h) => h.trim());

  // Verify headers match exactly
  for (const expected of GWR_MACHINERY_CSV_HEADERS) {
    if (!headers.includes(expected)) {
      throw new Error(`Missing expected GWR machinery header: ${expected}`);
    }
  }

  const bwIdx = headers.indexOf('bandwidth');
  const trSIdx = headers.indexOf('tr_S');
  const trSSIdx = headers.indexOf('tr_SS');
  const effDfIdx = headers.indexOf('eff_df');
  const s2Idx = headers.indexOf('s2_divisor');
  const aiccIdx = headers.indexOf('aicc_penalty');

  const rows: GwrMachineryRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map((p) => p.trim());
    if (parts.length < headers.length) continue;
    rows.push({
      bandwidth: parseFloat(parts[bwIdx]),
      tr_S: parseFloat(parts[trSIdx]),
      tr_SS: parseFloat(parts[trSSIdx]),
      eff_df: parseFloat(parts[effDfIdx]),
      s2_divisor: parseFloat(parts[s2Idx]),
      aicc_penalty: parseFloat(parts[aiccIdx]),
    });
  }

  return {
    sourceFile: 'results/tables/gwr_machinery.csv',
    classification: 'REPO_DERIVED_GWR_MACHINERY',
    headers,
    rows,
  };
}

export const PINNED_GWR_MACHINERY_PARSED = parseGwrMachineryCsv(RAW_PINNED_GWR_MACHINERY_CSV);
export const PINNED_GWR_MACHINERY_ROWS = PINNED_GWR_MACHINERY_PARSED.rows;
