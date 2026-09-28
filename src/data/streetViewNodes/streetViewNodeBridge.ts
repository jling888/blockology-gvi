/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ============================================================================
 * STREET-VIEW SAMPLING NODE CROSSWALK & BRIDGE
 * Nature 9.03 Final · No-Omega v0.7.0 — Multi-Source Research Integration
 * ============================================================================
 *
 * CRITICAL NODE-ID BOUNDARY & NON-JOIN MANDATE:
 *   DO NOT directly equate:
 *     Murray Hill node: n00045
 *     with native street-view-nodes IDs such as: park_avenue_west_003
 *
 *   NEVER join these datasets merely because both columns are called "node_id".
 *
 * Allowed match sources:
 *   1. EXPLICIT_SOURCE_CROSSWALK
 *      A source-backed artifact explicitly maps the external street node to Murray Hill n#####.
 *   2. EXISTING_DERIVED_APP_AUDIT_CROSSWALK
 *      If the current app's existing street_view_nodes_repo_audit.json contains an explicit
 *      recorded mapping, preserve that mapping with:
 *        classification: DERIVED_APP_AUDIT_ARTIFACT
 *        upstream source: ex032895-crypto/street-view-nodes @ 51f0250de0c446313b5fba912becabd03db8b572
 *   3. Otherwise:
 *      NO MATCH -> status = UNRESOLVED_NODE_CROSSWALK, matched_node = null.
 *
 * Strict Prohibition:
 *   Do NOT invent:
 *     - filename-based crosswalk
 *     - sequence-based crosswalk
 *     - street-name-only crosswalk
 *     - nearest-node threshold
 *     - coordinate tolerance
 *   Do not fabricate coordinates for n00045.
 */

import {
  STREET_VIEW_NODES_PINNED_REPO,
  type StreetViewNodeRawRecord,
  type StreetViewNodeCrosswalkResult,
  type StreetViewSamplingGeometryExport,
  type CrosswalkMethod,
  type CrosswalkStatus,
} from './streetViewNodeTypes';

/**
 * Interface for optional explicit crosswalk table
 */
export type ExplicitCrosswalkDictionary = Record<string, string>;

/**
 * Resolves whether a Murray Hill node (e.g. n00045) has a valid, source-backed crosswalk
 * to a native street-view-nodes entity.
 *
 * Strictly enforces that without an explicit source crosswalk or verified audit artifact crosswalk,
 * no implicit match is permitted.
 */
export function resolveStreetViewNodeCrosswalk(
  murrayHillNodeId: string,
  options?: {
    explicitCrosswalkMap?: ExplicitCrosswalkDictionary;
    parsedStreetNodes?: StreetViewNodeRawRecord[];
    existingAuditArtifact?: {
      murrayhill_crosswalk_records?: Record<string, string>;
      key?: string;
    };
  }
): StreetViewNodeCrosswalkResult {
  const cleanMurrayId = murrayHillNodeId.trim();

  // 1. Check EXPLICIT_SOURCE_CROSSWALK
  if (options?.explicitCrosswalkMap && cleanMurrayId in options.explicitCrosswalkMap) {
    const externalId = options.explicitCrosswalkMap[cleanMurrayId];
    const matchedRecord = options.parsedStreetNodes?.find((r) => r.node_id === externalId);

    return {
      murray_hill_node_id: cleanMurrayId,
      external_node_id: externalId,
      method: 'EXPLICIT_SOURCE_CROSSWALK',
      status: 'RESOLVED_EXPLICIT_CROSSWALK',
      classification: 'REPO_GEOMETRY_CONTEXT',
      upstream_repository: STREET_VIEW_NODES_PINNED_REPO.repositoryName,
      upstream_commit: STREET_VIEW_NODES_PINNED_REPO.repositoryCommit,
      matched_node: matchedRecord
        ? {
            street_name: matchedRecord.street_name,
            lat: matchedRecord.lat,
            lng: matchedRecord.lng,
            heading_fwd_deg: matchedRecord.heading_fwd_deg,
            heading_rev_deg: matchedRecord.heading_rev_deg,
            seq_fwd: matchedRecord.seq_fwd,
            seq_rev: matchedRecord.seq_rev,
            is_tunnel: matchedRecord.is_tunnel,
            is_bridge: matchedRecord.is_bridge,
          }
        : null,
      active_sim_evidence: false,
      details: `Explicit source crosswalk resolved: ${cleanMurrayId} -> ${externalId}.`,
    };
  }

  // 2. Check EXISTING_DERIVED_APP_AUDIT_CROSSWALK
  if (
    options?.existingAuditArtifact?.murrayhill_crosswalk_records &&
    cleanMurrayId in options.existingAuditArtifact.murrayhill_crosswalk_records
  ) {
    const externalId = options.existingAuditArtifact.murrayhill_crosswalk_records[cleanMurrayId];
    const matchedRecord = options.parsedStreetNodes?.find((r) => r.node_id === externalId);

    return {
      murray_hill_node_id: cleanMurrayId,
      external_node_id: externalId,
      method: 'EXISTING_DERIVED_APP_AUDIT_CROSSWALK',
      status: 'RESOLVED_EXPLICIT_CROSSWALK',
      classification: 'DERIVED_APP_AUDIT_ARTIFACT',
      upstream_repository: STREET_VIEW_NODES_PINNED_REPO.repositoryName,
      upstream_commit: STREET_VIEW_NODES_PINNED_REPO.repositoryCommit,
      matched_node: matchedRecord
        ? {
            street_name: matchedRecord.street_name,
            lat: matchedRecord.lat,
            lng: matchedRecord.lng,
            heading_fwd_deg: matchedRecord.heading_fwd_deg,
            heading_rev_deg: matchedRecord.heading_rev_deg,
            seq_fwd: matchedRecord.seq_fwd,
            seq_rev: matchedRecord.seq_rev,
            is_tunnel: matchedRecord.is_tunnel,
            is_bridge: matchedRecord.is_bridge,
          }
        : null,
      active_sim_evidence: false,
      details: `Derived audit artifact crosswalk resolved: ${cleanMurrayId} -> ${externalId}.`,
    };
  }

  // 3. Otherwise: STRICT NO MATCH
  // Prohibits coordinate tolerance, nearest neighbor, sequence matching, or street name matching.
  const method: CrosswalkMethod = 'NO_MATCH';
  const status: CrosswalkStatus = 'UNRESOLVED_NODE_CROSSWALK';

  return {
    murray_hill_node_id: cleanMurrayId,
    external_node_id: null,
    method,
    status,
    classification: 'UNRESOLVED',
    upstream_repository: STREET_VIEW_NODES_PINNED_REPO.repositoryName,
    upstream_commit: STREET_VIEW_NODES_PINNED_REPO.repositoryCommit,
    matched_node: null,
    active_sim_evidence: false,
    details:
      'UNRESOLVED_NODE_CROSSWALK: External repository ex032895-crypto/street-view-nodes uses native street_slug_sequence IDs and does not provide an explicit crosswalk to Murray Hill n##### IDs. No coordinates are fabricated.',
  };
}

/**
 * Builds the exact multi_source_research_integration export block for street-view sampling geometry
 */
export function buildStreetViewSamplingGeometryExport(
  murrayHillNodeId: string,
  crosswalkResult?: StreetViewNodeCrosswalkResult
): StreetViewSamplingGeometryExport {
  const result = crosswalkResult ?? resolveStreetViewNodeCrosswalk(murrayHillNodeId);

  return {
    source: {
      repository_name: STREET_VIEW_NODES_PINNED_REPO.repositoryName,
      repository_commit: STREET_VIEW_NODES_PINNED_REPO.repositoryCommit,
      role: STREET_VIEW_NODES_PINNED_REPO.role,
    },
    source_specification: {
      spacing_m: STREET_VIEW_NODES_PINNED_REPO.spacingM,
      crs: STREET_VIEW_NODES_PINNED_REPO.coordinateReferenceSystem,
      heading_reference: STREET_VIEW_NODES_PINNED_REPO.headingReference,
    },
    crosswalk: {
      murray_hill_node_id: result.murray_hill_node_id,
      external_node_id: result.external_node_id,
      method: result.method,
      status: result.status,
    },
    matched_node: result.matched_node,
    active_sim_evidence: false,
  };
}
