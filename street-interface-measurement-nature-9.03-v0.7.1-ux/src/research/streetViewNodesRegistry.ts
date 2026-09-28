/**
 * Street View Nodes sampling-geometry bridge.
 *
 * Source contract: ex032895-crypto/street-view-nodes @ pinned main commit.
 * This module only owns upstream capture-node geometry/provenance.
 */

export const STREETVIEW_NODES_AUDIT_PROVENANCE = {
  classification: 'DERIVED_APP_AUDIT_ARTIFACT' as const,
  externalStatus: 'EXTERNAL_SUPPLEMENTARY_PROVENANCE' as const,
  evidenceStatus: 'NOT_ACTIVE_SIM_EVIDENCE' as const,
  artifactPath: 'public/data/street_view_nodes_repo_audit.json',
  targetRepository: 'ex032895-crypto/street-view-nodes',
  targetCommit: '51f0250de0c446313b5fba912becabd03db8b572',
  upstreamMurrayHillSource: 'data/processed/nodes.csv',
  nativeResearchSource: false,
  role: 'Application-generated audit artifact evaluating upstream OSM street-network to camera-node sampling geometry; EXTERNAL_SUPPLEMENTARY_PROVENANCE and NOT_ACTIVE_SIM_EVIDENCE. It is not a native Murray Hill research repository table and never affects active SIM variables.',
  protectedActiveVariables: [
    'V_nat', 'V_built', 'GVI_eye', 'GMI', 'V_sign', 'SVF',
    'GFAPI', 'V_pave', 'IAS', 'I', 'Y', 'D', 'a', 'b', 'c', 'M',
  ] as const,
} as const;

export type StreetViewNodesAppStatus =
  | 'available'
  | 'app_derived_only'
  | 'optional_upstream'
  | 'not_resolved'
  | 'not_provided'
  | 'no_ownership';

export interface StreetViewNodesRepoAudit {
  schema_version: string;
  source_repository: string;
  source_branch: string;
  source_commit: string;
  source_commit_date: string;
  source_commit_message: string;
  repository_role: string;
  committed_generated_node_dataset: boolean;
  node_output_contract: string[];
  sampling_defaults: Record<string, string | number | boolean>;
  heading_semantics: Record<string, string>;
  qa_output_fields: string[];
  streetview_metadata_validation: {
    available_in_repo: boolean;
    default_enabled: boolean;
    upstream_behavior: string;
    pano_id_persisted_to_node_output: boolean;
    capture_date_persisted_to_node_output: boolean;
    imagery_download_in_repo: boolean;
  };
  app_relevance: Array<{
    key: string;
    status: StreetViewNodesAppStatus;
    role: string;
  }>;
  current_main_consistency_audit: {
    status: 'review_required';
    finding: string;
    app_policy: string;
  };
  boundaries: string[];
}

export interface StreetViewNodeRecord {
  nodeId: string;
  streetName: string;
  lat: number;
  lng: number;
  headingFwdDeg: number;
  headingRevDeg: number;
  seqFwd: number;
  seqRev: number;
  isTunnel: boolean;
  isBridge: boolean;
}

export interface StreetViewNodeCsvResult {
  rows: StreetViewNodeRecord[];
  warnings: string[];
}

let cachedAudit: StreetViewNodesRepoAudit | null = null;

export async function loadStreetViewNodesRepoAudit():
  Promise<StreetViewNodesRepoAudit> {
  if (cachedAudit) return cachedAudit;

  const response = await fetch('/data/street_view_nodes_repo_audit.json');
  if (!response.ok) {
    throw new Error('Street-view-nodes repository audit could not be loaded.');
  }

  cachedAudit = await response.json() as StreetViewNodesRepoAudit;
  return cachedAudit;
}

function parseCsvMatrix(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];

    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      quoted = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }

  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }

  return rows.filter((r) => r.some((v) => v.trim() !== ''));
}

function finite(value: string, field: string, rowNumber: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(`Row ${rowNumber}: ${field} must be numeric.`);
  }
  return n;
}

function bool01(value: string): boolean {
  const t = value.trim().toLowerCase();
  return t === '1' || t === 'true' || t === 'yes';
}

export function parseStreetViewNodesCsv(text: string): StreetViewNodeCsvResult {
  const matrix = parseCsvMatrix(text.replace(/^\uFEFF/, ''));
  if (matrix.length < 2) {
    throw new Error('Node CSV has no data rows.');
  }

  const headers = matrix[0].map((h) => h.trim());
  const required = [
    'node_id', 'street_name', 'lat', 'lng',
    'heading_fwd_deg', 'heading_rev_deg',
    'seq_fwd', 'seq_rev', 'is_tunnel', 'is_bridge',
  ];

  const missing = required.filter((h) => !headers.includes(h));
  if (missing.length) {
    throw new Error(`Node CSV missing required fields: ${missing.join(', ')}`);
  }

  const index = new Map(headers.map((h, i) => [h, i]));
  const value = (r: string[], key: string) => r[index.get(key) as number] ?? '';
  const warnings: string[] = [];

  const rows = matrix.slice(1).map((r, idx): StreetViewNodeRecord => {
    const rowNumber = idx + 2;
    const nodeId = value(r, 'node_id').trim();
    if (!nodeId) throw new Error(`Row ${rowNumber}: node_id is empty.`);

    const fwd = finite(value(r, 'heading_fwd_deg'), 'heading_fwd_deg', rowNumber);
    const rev = finite(value(r, 'heading_rev_deg'), 'heading_rev_deg', rowNumber);
    const expected = (fwd + 180) % 360;
    const circularDiff = Math.abs((((rev - expected) + 540) % 360) - 180);
    if (circularDiff > 0.2) {
      warnings.push(`${nodeId}: reverse heading differs from fwd+180 by ${circularDiff.toFixed(2)}°.`);
    }

    return {
      nodeId,
      streetName: value(r, 'street_name').trim(),
      lat: finite(value(r, 'lat'), 'lat', rowNumber),
      lng: finite(value(r, 'lng'), 'lng', rowNumber),
      headingFwdDeg: fwd,
      headingRevDeg: rev,
      seqFwd: finite(value(r, 'seq_fwd'), 'seq_fwd', rowNumber),
      seqRev: finite(value(r, 'seq_rev'), 'seq_rev', rowNumber),
      isTunnel: bool01(value(r, 'is_tunnel')),
      isBridge: bool01(value(r, 'is_bridge')),
    };
  });

  const ids = new Set<string>();
  for (const row of rows) {
    if (ids.has(row.nodeId)) warnings.push(`Duplicate node_id: ${row.nodeId}.`);
    ids.add(row.nodeId);
  }

  return { rows, warnings };
}

function normalized(s: string): string {
  return s.toLowerCase().replace(/\\/g, '/').split('/').pop()?.replace(/\.[^.]+$/, '') || '';
}

export function autoMatchStreetViewNode(
  rows: StreetViewNodeRecord[],
  activeFilename: string,
  activeImageId: string
): StreetViewNodeRecord | null {
  const targets = [normalized(activeFilename), normalized(activeImageId)].filter(Boolean);
  if (!targets.length) return null;

  const exact = rows.filter((r) => targets.includes(normalized(r.nodeId)));
  if (exact.length === 1) return exact[0];

  const included = rows.filter((r) => targets.some((t) => t.includes(normalized(r.nodeId))));
  return included.length === 1 ? included[0] : null;
}

export function deriveTeacherOrthogonalCandidate(headingFwdDeg: number): Array<{
  key: 'O000' | 'O090' | 'O180' | 'O270';
  offsetDeg: 0 | 90 | 180 | 270;
  headingDeg: number;
}> {
  const wrap = (v: number) => ((v % 360) + 360) % 360;
  return [
    { key: 'O000', offsetDeg: 0, headingDeg: wrap(headingFwdDeg) },
    { key: 'O090', offsetDeg: 90, headingDeg: wrap(headingFwdDeg + 90) },
    { key: 'O180', offsetDeg: 180, headingDeg: wrap(headingFwdDeg + 180) },
    { key: 'O270', offsetDeg: 270, headingDeg: wrap(headingFwdDeg + 270) },
  ];
}
