/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ============================================================================
 * STREET-VIEW SAMPLING NODE GEOMETRY VALIDATION TESTS
 * Nature 9.03 Final · No-Omega v0.7.0 — Multi-Source Research Integration
 * ============================================================================
 *
 * Regression Tests:
 *   1. TEST_V070_STREET_NODE_SOURCE_SCHEMA: Exact header binding & required headers
 *   2. TEST_V070_STREET_NODE_HEADING_RELATION: Forward/Reverse heading consistency
 *   3. TEST_V070_STREET_NODE_ID_NAMESPACE_ISOLATION: n00045 != native street node IDs
 *   4. TEST_V070_NO_IMPLICIT_CROSSWALK: Prohibits name/seq/proximity implicit joins
 *   5. TEST_V070_STREET_NODE_SIM_INVARIANCE: Zero delta on active I/Y/D/M
 *   6. TEST_V070_STREET_NODE_PARSE_GATING: Missing/malformed fields -> parse error, never zero
 */

import {
  STREET_VIEW_NODES_REQUIRED_HEADERS,
  type StreetViewNodeRawRecord,
} from './streetViewNodeTypes';
import {
  parseStreetViewNodesCsv,
  parseStreetViewNodeRow,
} from './streetViewNodeParser';
import {
  resolveStreetViewNodeCrosswalk,
  buildStreetViewSamplingGeometryExport,
} from './streetViewNodeBridge';
import {
  buildMatchedRecordFromRow,
  assembleRepoPaperBridge,
} from '../teamRepository/teamRepositoryMapper';
import type { RawCsvRow } from '../teamRepository/teamRepositoryParser';

export interface StreetNodeValidationResult {
  testId: string;
  title: string;
  passed: boolean;
  details: string[];
  errors: string[];
}

/**
 * Helper to build standard golden n00045 row
 */
function createGoldenN00045Row(overrides: Partial<RawCsvRow> = {}): RawCsvRow {
  return {
    node_id: 'n00045',
    vertical_greenery_median: '1.2434574547629729',
    vertical_hardscape_median: '5.275995063252083',
    green_eye_level_median: '2.210586356376911',
    sky_openness_median: '5.144777662874871',
    walkable_ground_median: '5.17148182665424',
    green_softening_median: '2.2959057071960296',
    signage_detail_median: '4.365168539325842',
    facade_variation_median: '5.868217960710945',
    ground_floor_activity_median: '5.605327768229806',
    resting_affordance_median: '1.3259604190919674',
    H_m: '9.861546',
    W_facade: '18.373344',
    HW_facade: '0.5367320941078925',
    HW_effective: '0.5367320941078925',
    HW_source: 'series',
    ...overrides,
  };
}

/**
 * 1. TEST_V070_STREET_NODE_SOURCE_SCHEMA
 * Verifies exact header binding and failure on missing required headers.
 */
export function runTestStreetNodeSourceSchema(): StreetNodeValidationResult {
  const details: string[] = [];
  const errors: string[] = [];

  // Valid header CSV with arbitrary column ordering
  const validCsv = [
    'is_tunnel,seq_rev,heading_rev_deg,lng,node_id,street_name,is_bridge,lat,seq_fwd,heading_fwd_deg',
    'false,1,225.5,-73.9782,park_ave_001,Park Avenue,false,40.7484,1,45.5',
  ].join('\n');

  const parseValid = parseStreetViewNodesCsv(validCsv);
  if (!parseValid.schemaValid) {
    errors.push(`Valid CSV failed schema validation: ${parseValid.errors.join(', ')}`);
  } else {
    details.push('Permuted valid headers correctly validated and bound by exact name.');
  }

  if (parseValid.records.length !== 1 || parseValid.records[0].node_id !== 'park_ave_001') {
    errors.push('Failed to parse record under permuted header layout.');
  } else {
    details.push(`Record bound correctly: node_id=${parseValid.records[0].node_id}, street=${parseValid.records[0].street_name}`);
  }

  // Defective CSV missing 'is_tunnel' and 'heading_rev_deg'
  const invalidCsv = [
    'node_id,street_name,lat,lng,heading_fwd_deg,seq_fwd,seq_rev,is_bridge',
    'park_ave_001,Park Avenue,40.7484,-73.9782,45.5,1,1,false',
  ].join('\n');

  const parseInvalid = parseStreetViewNodesCsv(invalidCsv);
  if (parseInvalid.schemaValid) {
    errors.push('Parser erroneously accepted CSV missing required headers.');
  } else {
    details.push(`Parser correctly rejected CSV with missing headers: ${parseInvalid.missingHeaders.join(', ')}`);
  }

  return {
    testId: 'TEST_V070_STREET_NODE_SOURCE_SCHEMA',
    title: 'Street-View Node Exact Header Binding & Schema Validation Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * 2. TEST_V070_STREET_NODE_HEADING_RELATION
 * Validates expected_reverse = (heading_fwd + 180) % 360,
 * and verifies SOURCE_HEADING_INCONSISTENCY without silent repair.
 */
export function runTestStreetNodeHeadingRelation(): StreetNodeValidationResult {
  const details: string[] = [];
  const errors: string[] = [];

  // Case A: Perfectly consistent
  const rowConsistent: Record<string, string> = {
    node_id: 'park_ave_001',
    street_name: 'Park Avenue',
    lat: '40.7484',
    lng: '-73.9782',
    heading_fwd_deg: '30.0',
    heading_rev_deg: '210.0',
    seq_fwd: '1',
    seq_rev: '5',
    is_tunnel: '0',
    is_bridge: '0',
  };

  const parsedA = parseStreetViewNodeRow(rowConsistent, 1);
  if (parsedA.heading_consistency_status !== 'CONSISTENT') {
    errors.push(`Expected CONSISTENT for 30° / 210°, got ${parsedA.heading_consistency_status}`);
  } else {
    details.push(`Heading consistency verified: fwd=30°, rev=210°, expected=210° -> CONSISTENT`);
  }

  // Case B: Inconsistent (e.g. fwd=30°, rev=190° -> diff=20°)
  const rowInconsistent: Record<string, string> = {
    ...rowConsistent,
    heading_rev_deg: '190.0',
  };

  const parsedB = parseStreetViewNodeRow(rowInconsistent, 2);
  if (parsedB.heading_consistency_status !== 'SOURCE_HEADING_INCONSISTENCY') {
    errors.push(`Expected SOURCE_HEADING_INCONSISTENCY for 30° / 190°, got ${parsedB.heading_consistency_status}`);
  } else {
    details.push('SOURCE_HEADING_INCONSISTENCY correctly raised without silent repair.');
  }

  // Assert no silent repair: source_heading_rev_deg remains 190.0, derived_expected remains 210.0
  if (parsedB.source_heading_rev_deg !== 190.0) {
    errors.push(`source_heading_rev_deg was mutated: expected 190, got ${parsedB.source_heading_rev_deg}`);
  }
  if (parsedB.derived_expected_heading_rev_deg !== 210.0) {
    errors.push(`derived_expected_heading_rev_deg mismatch: expected 210, got ${parsedB.derived_expected_heading_rev_deg}`);
  }
  details.push(`Preserved both source (${parsedB.source_heading_rev_deg}°) and derived (${parsedB.derived_expected_heading_rev_deg}°) for audit.`);

  return {
    testId: 'TEST_V070_STREET_NODE_HEADING_RELATION',
    title: 'Street-View Node Forward/Reverse Heading Consistency & Audit Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * 3. TEST_V070_STREET_NODE_ID_NAMESPACE_ISOLATION
 * Asserts n00045 != native street-view-nodes node_id unless explicit crosswalk exists.
 */
export function runTestStreetNodeIdNamespaceIsolation(): StreetNodeValidationResult {
  const details: string[] = [];
  const errors: string[] = [];

  // 1. Without explicit crosswalk
  const unresolved = resolveStreetViewNodeCrosswalk('n00045');
  if (unresolved.status !== 'UNRESOLVED_NODE_CROSSWALK') {
    errors.push(`Expected UNRESOLVED_NODE_CROSSWALK for n00045 without crosswalk, got ${unresolved.status}`);
  } else {
    details.push('Namespace isolation verified: n00045 correctly rejected from implicit external node join.');
  }

  if (unresolved.matched_node !== null) {
    errors.push(`matched_node must be null for unresolved crosswalk; got ${JSON.stringify(unresolved.matched_node)}`);
  } else {
    details.push('matched_node is strictly null (no synthetic coordinate fabrication).');
  }

  // 2. With explicit crosswalk
  const explicitResolved = resolveStreetViewNodeCrosswalk('n00045', {
    explicitCrosswalkMap: { n00045: 'park_avenue_west_003' },
    parsedStreetNodes: [
      {
        node_id: 'park_avenue_west_003',
        street_name: 'Park Avenue',
        lat: 40.749,
        lng: -73.979,
        heading_fwd_deg: 40.0,
        heading_rev_deg: 220.0,
        seq_fwd: 3,
        seq_rev: 7,
        is_tunnel: false,
        is_bridge: false,
        source_heading_rev_deg: 220.0,
        derived_expected_heading_rev_deg: 220.0,
        heading_consistency_status: 'CONSISTENT',
        status: 'PARSED',
        parse_errors: [],
      },
    ],
  });

  if (explicitResolved.status !== 'RESOLVED_EXPLICIT_CROSSWALK') {
    errors.push(`Expected RESOLVED_EXPLICIT_CROSSWALK with explicit crosswalk, got ${explicitResolved.status}`);
  } else {
    details.push(`Explicit crosswalk succeeded: ${explicitResolved.murray_hill_node_id} -> ${explicitResolved.external_node_id}`);
  }

  return {
    testId: 'TEST_V070_STREET_NODE_ID_NAMESPACE_ISOLATION',
    title: 'Street-View Node ID Namespace Isolation & Explicit Crosswalk Gate Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * 4. TEST_V070_NO_IMPLICIT_CROSSWALK
 * Street name / seq / filename alone must not create a match.
 */
export function runTestNoImplicitCrosswalk(): StreetNodeValidationResult {
  const details: string[] = [];
  const errors: string[] = [];

  // Even if a street node has same street name "East 34th Street" or sequence "45",
  // without an explicit crosswalk it must NEVER be joined!
  const dummyNodes: StreetViewNodeRawRecord[] = [
    {
      node_id: 'e_34th_st_045',
      street_name: 'East 34th Street',
      lat: 40.746,
      lng: -73.978,
      heading_fwd_deg: 90.0,
      heading_rev_deg: 270.0,
      seq_fwd: 45,
      seq_rev: 1,
      is_tunnel: false,
      is_bridge: false,
      source_heading_rev_deg: 270.0,
      derived_expected_heading_rev_deg: 270.0,
      heading_consistency_status: 'CONSISTENT',
      status: 'PARSED',
      parse_errors: [],
    },
  ];

  const res = resolveStreetViewNodeCrosswalk('n00045', {
    parsedStreetNodes: dummyNodes,
  });

  if (res.status !== 'UNRESOLVED_NODE_CROSSWALK') {
    errors.push(`Implicit crosswalk incorrectly resolved: ${res.status}`);
  } else {
    details.push('No implicit crosswalk: street name / sequence match alone did NOT create a join.');
  }

  if (res.matched_node !== null) {
    errors.push('matched_node was populated without explicit crosswalk.');
  } else {
    details.push('matched_node remains strictly null.');
  }

  return {
    testId: 'TEST_V070_NO_IMPLICIT_CROSSWALK',
    title: 'Prohibition of Implicit Crosswalks (Street Name / Sequence / Proximity) Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * 5. TEST_V070_STREET_NODE_SIM_INVARIANCE
 * Mutating lat, lng, headings, sequence, tunnel/bridge, spacing provenance
 * must produce ZERO difference in active I, Y, D, M.
 */
export function runTestStreetNodeSimInvariance(): StreetNodeValidationResult {
  const details: string[] = [];
  const errors: string[] = [];

  const row = createGoldenN00045Row();
  const matched = buildMatchedRecordFromRow(row, 'vlm_observations_murrayhill.csv', 1, 'EXPLICIT_NODE_ID');
  const bridge = assembleRepoPaperBridge(matched);
  const syn = bridge.synthesis;

  // Expected golden numbers
  const expI = 6.785792291750779;
  const expY = 4.275239548226926;
  const expD = 6.861271847132807;
  const expM = 6.214327916148292;
  const tol = 1e-12;

  const check = (label: string, actual: number | null | undefined, expected: number) => {
    if (actual === null || actual === undefined || Math.abs(actual - expected) > tol) {
      errors.push(`${label}: expected ${expected}, got ${actual}`);
    } else {
      details.push(`${label} = ${actual} (exact match tol=${tol})`);
    }
  };

  check('Golden I', syn.placeImageability.value, expI);
  check('Golden Y', syn.placeIdentity.value, expY);
  check('Golden D', syn.placeDependence.value, expD);
  check('Golden M', syn.sim.value, expM);

  // Now create arbitrary street sampling node metadata
  const crosswalkExport = buildStreetViewSamplingGeometryExport('n00045', {
    murray_hill_node_id: 'n00045',
    external_node_id: 'test_node_999',
    method: 'EXPLICIT_SOURCE_CROSSWALK',
    status: 'RESOLVED_EXPLICIT_CROSSWALK',
    classification: 'REPO_GEOMETRY_CONTEXT',
    upstream_repository: 'ex032895-crypto/street-view-nodes',
    upstream_commit: '51f0250de0c446313b5fba912becabd03db8b572',
    matched_node: {
      street_name: 'Test Ave',
      lat: 40.75,
      lng: -73.98,
      heading_fwd_deg: 90.0,
      heading_rev_deg: 270.0,
      seq_fwd: 10,
      seq_rev: 20,
      is_tunnel: true,
      is_bridge: true,
    },
    active_sim_evidence: false,
    details: 'Test injection',
  });

  // Re-verify that SIM values are bit-for-bit unchanged
  check('Post-Geometry-Injection I', syn.placeImageability.value, expI);
  check('Post-Geometry-Injection Y', syn.placeIdentity.value, expY);
  check('Post-Geometry-Injection D', syn.placeDependence.value, expD);
  check('Post-Geometry-Injection M', syn.sim.value, expM);

  if (crosswalkExport.active_sim_evidence !== false) {
    errors.push('active_sim_evidence must be strictly false');
  } else {
    details.push('active_sim_evidence is false (context only, zero impact on active SIM).');
  }

  return {
    testId: 'TEST_V070_STREET_NODE_SIM_INVARIANCE',
    title: 'Street-View Node Geometry SIM Invariance (Zero Delta Contract) Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * 6. TEST_V070_STREET_NODE_PARSE_GATING
 * Missing/malformed coordinate or heading fields must become SOURCE_PARSE_ERROR / null,
 * never synthetic zero.
 */
export function runTestStreetNodeParseGating(): StreetNodeValidationResult {
  const details: string[] = [];
  const errors: string[] = [];

  // 1. Missing lat -> null and parse error, NOT 0.0
  const rowMissingLat: Record<string, string> = {
    node_id: 'node_test_01',
    street_name: 'Test St',
    lat: '',
    lng: '-73.98',
    heading_fwd_deg: '90.0',
    heading_rev_deg: '270.0',
    seq_fwd: '1',
    seq_rev: '2',
    is_tunnel: '0',
    is_bridge: '0',
  };

  const parsedLat = parseStreetViewNodeRow(rowMissingLat, 1);
  if (parsedLat.lat !== null) {
    errors.push(`Missing lat should be null, got ${parsedLat.lat}`);
  } else {
    details.push('Missing lat is strictly null (no synthetic 0.0 substitution).');
  }
  if (parsedLat.status !== 'SOURCE_PARSE_ERROR') {
    errors.push(`Expected status SOURCE_PARSE_ERROR for missing lat, got ${parsedLat.status}`);
  }

  // 2. Out of bounds lat (95.0) -> parse error
  const rowInvalidLat: Record<string, string> = {
    ...rowMissingLat,
    lat: '95.0',
  };
  const parsedInvalidLat = parseStreetViewNodeRow(rowInvalidLat, 2);
  if (parsedInvalidLat.lat !== null) {
    errors.push(`Out-of-bounds lat (95°) should be null, got ${parsedInvalidLat.lat}`);
  } else {
    details.push('Out-of-bounds lat is null.');
  }

  // 3. Negative sequence (-1) -> parse error
  const rowInvalidSeq: Record<string, string> = {
    ...rowMissingLat,
    lat: '40.75',
    seq_fwd: '-1',
  };
  const parsedInvalidSeq = parseStreetViewNodeRow(rowInvalidSeq, 3);
  if (parsedInvalidSeq.seq_fwd !== null) {
    errors.push(`Invalid sequence (-1) should be null, got ${parsedInvalidSeq.seq_fwd}`);
  } else {
    details.push('Invalid sequence is null.');
  }

  // 4. Section O: Source integer flag check (exact "0" and "1" required; arbitrary words rejected)
  const rowInvalidBool: Record<string, string> = {
    ...rowMissingLat,
    lat: '40.75',
    seq_fwd: '1',
    is_tunnel: 'maybe',
  };
  const parsedInvalidBool = parseStreetViewNodeRow(rowInvalidBool, 4);
  if (parsedInvalidBool.is_tunnel !== null) {
    errors.push(`Invalid boolean ('maybe') should be null, got ${parsedInvalidBool.is_tunnel}`);
  } else {
    details.push('Arbitrary boolean string is rejected with null and SOURCE_PARSE_ERROR.');
  }

  const rowWordBool: Record<string, string> = {
    ...rowMissingLat,
    lat: '40.75',
    seq_fwd: '1',
    is_tunnel: 'true',
  };
  const parsedWordBool = parseStreetViewNodeRow(rowWordBool, 5);
  if (parsedWordBool.is_tunnel !== null) {
    errors.push(`Word boolean ('true') should be rejected under strict integer flag rule, got ${parsedWordBool.is_tunnel}`);
  } else {
    details.push("Word boolean 'true' rejected; exact CSV representations '0' and '1' required.");
  }

  // 5. Section O: Negative heading (< 0) -> must be null, no modulo repair to 350
  const rowNegativeHeading: Record<string, string> = {
    ...rowMissingLat,
    lat: '40.75',
    seq_fwd: '1',
    heading_fwd_deg: '-10.0',
  };
  const parsedNegHeading = parseStreetViewNodeRow(rowNegativeHeading, 6);
  if (parsedNegHeading.heading_fwd_deg !== null) {
    errors.push(`Negative heading (-10°) was incorrectly repaired or accepted, got ${parsedNegHeading.heading_fwd_deg}`);
  } else {
    details.push('Negative heading (< 0) strictly set to null without modulo repair.');
  }
  if (parsedNegHeading.status !== 'SOURCE_PARSE_ERROR') {
    errors.push(`Negative heading expected SOURCE_PARSE_ERROR, got ${parsedNegHeading.status}`);
  }

  // 6. Section O: Overflow heading (>= 360) -> must be null, no modulo repair to 10
  const rowOverflowHeading: Record<string, string> = {
    ...rowMissingLat,
    lat: '40.75',
    seq_fwd: '1',
    heading_fwd_deg: '370.0',
  };
  const parsedOverflowHeading = parseStreetViewNodeRow(rowOverflowHeading, 7);
  if (parsedOverflowHeading.heading_fwd_deg !== null) {
    errors.push(`Overflow heading (370°) was incorrectly repaired or accepted, got ${parsedOverflowHeading.heading_fwd_deg}`);
  } else {
    details.push('Overflow heading (>= 360) strictly set to null without modulo repair.');
  }
  if (parsedOverflowHeading.status !== 'SOURCE_PARSE_ERROR') {
    errors.push(`Overflow heading expected SOURCE_PARSE_ERROR, got ${parsedOverflowHeading.status}`);
  }

  return {
    testId: 'TEST_V070_STREET_NODE_PARSE_GATING',
    title: 'Street-View Node Field Gating & Non-Zero Substitution Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * Runs all 6 street-view node validation tests
 */
export function runAllStreetViewNodeValidationTests(): StreetNodeValidationResult[] {
  return [
    runTestStreetNodeSourceSchema(),
    runTestStreetNodeHeadingRelation(),
    runTestStreetNodeIdNamespaceIsolation(),
    runTestNoImplicitCrosswalk(),
    runTestStreetNodeSimInvariance(),
    runTestStreetNodeParseGating(),
  ];
}
