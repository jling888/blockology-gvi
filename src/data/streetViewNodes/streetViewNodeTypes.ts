/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ============================================================================
 * STREET-VIEW SAMPLING NODE GEOMETRY TYPES
 * Nature 9.03 Final · No-Omega v0.7.0 — Multi-Source Research Integration
 * ============================================================================
 *
 * Pinned External Source:
 *   Repository: "ex032895-crypto/street-view-nodes"
 *   Pinned commit: "51f0250de0c446313b5fba912becabd03db8b572"
 *   Role: "STREET_NETWORK_SAMPLING_GEOMETRY"
 *   Classification: "REPO_GEOMETRY_CONTEXT"
 *   Evidence role: "SAMPLING_GEOMETRY_CONTEXT_ONLY"
 *
 * CRITICAL SCIENTIFIC CONTRACT:
 *   Street-view-node geometry is CONTEXT / SAMPLING PROVENANCE ONLY.
 *   It must produce ZERO change in active I/Y/D/M.
 *   Never classify this repository as active SIM evidence (active_sim_evidence: false).
 */

import type { MultiSourceResearchClassification } from '../../research/multiSourceResearchRegistry';

export const STREET_VIEW_NODES_PINNED_REPO = {
  repositoryName: 'ex032895-crypto/street-view-nodes',
  repositoryCommit: '51f0250de0c446313b5fba912becabd03db8b572',
  role: 'STREET_NETWORK_SAMPLING_GEOMETRY',
  classification: 'REPO_GEOMETRY_CONTEXT' as MultiSourceResearchClassification,
  spacingM: 20.0,
  coordinateReferenceSystem: 'WGS84',
  headingReference: '0_NORTH_CLOCKWISE',
  activeSimEvidence: false,
} as const;

/**
 * Required exact CSV column headers in pinned repository
 */
export const STREET_VIEW_NODES_REQUIRED_HEADERS = [
  'node_id',
  'street_name',
  'lat',
  'lng',
  'heading_fwd_deg',
  'heading_rev_deg',
  'seq_fwd',
  'seq_rev',
  'is_tunnel',
  'is_bridge',
] as const;

export type StreetViewNodeHeader = typeof STREET_VIEW_NODES_REQUIRED_HEADERS[number];

export type StreetViewNodeParseStatus = 'PARSED' | 'SOURCE_PARSE_ERROR';

export type StreetViewNodeHeadingConsistencyStatus =
  | 'CONSISTENT'
  | 'SOURCE_HEADING_INCONSISTENCY'
  | 'INDETERMINATE';

export interface StreetViewNodeRawRecord {
  node_id: string | null;
  street_name: string | null;
  lat: number | null;
  lng: number | null;
  heading_fwd_deg: number | null;
  heading_rev_deg: number | null;
  seq_fwd: number | null;
  seq_rev: number | null;
  is_tunnel: boolean | null;
  is_bridge: boolean | null;

  // Diagnostic / audit fields
  source_heading_rev_deg: number | null;
  derived_expected_heading_rev_deg: number | null;
  heading_consistency_status: StreetViewNodeHeadingConsistencyStatus;
  status: StreetViewNodeParseStatus;
  parse_errors: string[];
}

export type CrosswalkMethod =
  | 'EXPLICIT_SOURCE_CROSSWALK'
  | 'EXISTING_DERIVED_APP_AUDIT_CROSSWALK'
  | 'NO_MATCH';

export type CrosswalkStatus =
  | 'RESOLVED_EXPLICIT_CROSSWALK'
  | 'UNRESOLVED_NODE_CROSSWALK';

export interface StreetViewMatchedNodeFields {
  street_name: string | null;
  lat: number | null;
  lng: number | null;
  heading_fwd_deg: number | null;
  heading_rev_deg: number | null;
  seq_fwd: number | null;
  seq_rev: number | null;
  is_tunnel: boolean | null;
  is_bridge: boolean | null;
}

export interface StreetViewNodeCrosswalkResult {
  murray_hill_node_id: string;
  external_node_id: string | null;
  method: CrosswalkMethod;
  status: CrosswalkStatus;
  classification: 'DERIVED_APP_AUDIT_ARTIFACT' | 'REPO_GEOMETRY_CONTEXT' | 'UNRESOLVED';
  upstream_repository: string;
  upstream_commit: string;
  matched_node: StreetViewMatchedNodeFields | null;
  active_sim_evidence: false;
  details: string;
}

export interface StreetViewSamplingGeometryExport {
  source: {
    repository_name: string;
    repository_commit: string;
    role: string;
  };
  source_specification: {
    spacing_m: number;
    crs: string;
    heading_reference: string;
  };
  crosswalk: {
    murray_hill_node_id: string;
    external_node_id: string | null;
    method: string;
    status: string;
  };
  matched_node: StreetViewMatchedNodeFields | null;
  active_sim_evidence: false;
}
