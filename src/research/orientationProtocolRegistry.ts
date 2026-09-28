/**
 * Orientation Protocol Registry
 * Nature 9.03 Final · No-Omega v0.7.0-RC1
 *
 * SOURCE protocol and PAPER analytical protocol are recorded separately.
 * The current Murray Hill team source is source-backed as along-street 180°.
 * This does NOT establish equivalence to the final paper's orthogonal 90° frames.
 */

export type OrientationProtocolId =
  | 'paper_orthogonal_90'
  | 'team_along_street_180'
  | 'legacy_team_walk_relative_half_90';

export interface OrientationProtocolDefinition {
  id: OrientationProtocolId;
  shortName: string;
  sourceStatus: 'paper_specification' | 'current_team_source' | 'legacy_team_source';
  fieldOfViewDegrees: 90 | 180;
  viewsPerNode: number;
  centerDefinition: string;
  coverage: string;
  researchUse: string;
}

export const PAPER_ORTHOGONAL_PROTOCOL: OrientationProtocolDefinition = {
  id: 'paper_orthogonal_90',
  shortName: 'Nature 9.03 Final Orthogonal 90° Analytical Frames',
  sourceStatus: 'paper_specification',
  fieldOfViewDegrees: 90,
  viewsPerNode: 4,
  centerDefinition:
    'Four street-relative orthogonal analytical frames centered at 0° / 90° / 180° / 270°.',
  coverage:
    'Final paper analytical specification: 712 raw nodes / 2,848 observations; after excluding 2 tunnel nodes / 8 observations, 710 active nodes / 2,840 observations.',
  researchUse:
    'Paper-side analytical target. Do not relabel the current team 180° source as these frames without an explicit reconciliation.',
};

export const TEAM_ALONG_STREET_180_PROTOCOL: OrientationProtocolDefinition = {
  id: 'team_along_street_180',
  shortName: 'Current Team Along-Street 180° Source',
  sourceStatus: 'current_team_source',
  fieldOfViewDegrees: 180,
  viewsPerNode: 2,
  centerDefinition:
    'Two opposing 180° directional renders centered on the fitted street axis.',
  coverage:
    'Current median-led repository source uses 1,514 directional rows / 757 unique source nodes.',
  researchUse:
    'Current source protocol for the approved Team Repository Qwen bridge. Source protocol is verified; equivalence to the paper orthogonal 90° analytical protocol remains unresolved.',
};

export const LEGACY_TEAM_WALK_RELATIVE_PROTOCOL: OrientationProtocolDefinition = {
  id: 'legacy_team_walk_relative_half_90',
  shortName: 'Legacy Team Walk-Relative 90° Halves',
  sourceStatus: 'legacy_team_source',
  fieldOfViewDegrees: 90,
  viewsPerNode: 4,
  centerDefinition:
    'Legacy L/R half-view representation centered ±45° from the walking direction.',
  coverage:
    'Historical source geometry retained only for comparative provenance.',
  researchUse:
    'RETIRED_COMPARATIVE. Do not use this label for the current median-led source.',
};

export interface OrientationProtocolReconciliation {
  status: 'SOURCE_180_VERIFIED_PAPER_ALIGNMENT_UNRESOLVED';
  sourceProtocol: 'team_along_street_180';
  paperProtocol: 'paper_orthogonal_90';
  sourceProtocolVerified: true;
  paperProtocolEquivalent: false;
  currentAppDecision: string;
  publicationActions: readonly string[];
}

export const ORIENTATION_RECONCILIATION: OrientationProtocolReconciliation = {
  status: 'SOURCE_180_VERIFIED_PAPER_ALIGNMENT_UNRESOLVED',
  sourceProtocol: 'team_along_street_180',
  paperProtocol: 'paper_orthogonal_90',
  sourceProtocolVerified: true,
  paperProtocolEquivalent: false,
  currentAppDecision:
    'Preserve the current 180° team source exactly in provenance while keeping paper-protocol equivalence explicitly unresolved.',
  publicationActions: [
    'Keep the active team source labeled as along-street 180° directional imagery.',
    'Do not relabel the team source as paper orthogonal 90° evidence.',
    'If strict protocol equivalence is required, document a separate reconciliation/rerun rather than transforming provenance silently.',
    'Keep source image identity, FOV, directionality, and approval state in every exported record.',
  ],
};

export function orientationProtocolIsPublicationReconciled(): boolean {
  return ORIENTATION_RECONCILIATION.paperProtocolEquivalent;
}
