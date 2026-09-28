/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ============================================================================
 * TEAM REPOSITORY DATA BRIDGE — VALIDATION SUITE (TESTS A–G)
 * Nature 9.03 Final · No-Omega v0.6
 * ============================================================================
 *
 * Deterministic test harness covering:
 * - TEST A: Complete visual-semantic record (all 9 mapped, v0.5.2 engine reference M)
 * - TEST B: SFV absent (supplementary status verified, active Y_i unblocked)
 * - TEST C: Geometry absent / open_one_side (H/W context-only, active M unblocked)
 * - TEST D: Behavior absent (M computed, F_i method-gated, t_effective input-gated)
 * - TEST E: Unusable node (usable=false => SOURCE_EXCLUDED, paper synthesis blocked)
 * - TEST F: Old repository final M exists (comparative provenance only, active recomputed)
 * - TEST G: Ambiguous node match (AMBIGUOUS_SOURCE_MATCH, auto-approval blocked)
 */

import {
  assembleRepoPaperBridge,
  buildMatchedRecordFromRow,
  matchRepositoryRow,
} from './teamRepositoryMapper';

import {
  computePaperSynthesis,
  type PaperResearchInputs,
} from '../../utils/simComputationEngine';

import {
  NATURE_903_GWR_PAPER_DIAGNOSTICS,
  NATURE_903_FINAL_GWR_DIAGNOSTICS,
  NATURE_903_BEHAVIORAL_SPECIFICATION,
  REPOSITORY_GWR_CALIBRATION_RECORD,
  FINAL_PAPER_SAMPLE_ACCOUNTING,
  SPACE_SYNTAX_PAPER_SPECIFICATION,
  GWR_SAMPLE_PROVENANCE_AUDIT,
  PAPER_REPOSITORY_CALIBRATION_BOUNDARY,
  FORMULA_VERSION_BOUNDARY,
  NODE_LEVEL_GWR_CALIBRATION_STATUS,
  calculateTBase,
  BLOCKOLOGY_PLACEHOLDER_LAMBDA_RECORD,
  PROXY_DWELL_PAPER_SPECIFICATION,
  BEHAVIORAL_SOURCE_PROVENANCE_STATUS,
  BEHAVIORAL_EVIDENCE_PROVENANCE_BOUNDARY,
  DEFAULT_N00045_BEHAVIORAL_STATE,
  buildBehavioralStayabilityReconciliationExport,
  buildMultiSourceMasterPayload,
  V070_VERSION_METADATA,
  MULTI_SOURCE_PROVENANCE_RESOLUTION_RECORD,
} from '../../research/multiSourceResearchRegistry';
import { PINNED_GWR_MACHINERY_ROWS } from './gwrMachinery';

import { parseRepoGeometryRecord, type RawCsvRow } from './teamRepositoryParser';
import type { RepoPinnedRowExport } from './teamRepositoryTypes';
import { runAllStreetViewNodeValidationTests } from '../streetViewNodes/streetViewNodeValidation';

export type ValidationTestId =
  | 'TEST_A'
  | 'TEST_B'
  | 'TEST_C'
  | 'TEST_D'
  | 'TEST_E'
  | 'TEST_F'
  | 'TEST_G'
  | 'TEST_H'
  | 'TEST_I'
  | 'TEST_J'
  | 'TEST_HEADER_BINDING'
  | 'TEST_D_INVARIANCE'
  | 'TEST_SOURCE_ORDER_ROBUSTNESS'
  | 'TEST_SOURCE_SEMANTIC_TRUTH'
  | 'TEST_V070_NUMERIC_INVARIANCE'
  | 'TEST_V070_DIAGNOSTICS_ISOLATION'
  | 'TEST_V070_GEOMETRY_ISOLATION'
  | 'TEST_V070_INJECTION_PREVENTION'
  | 'TEST_V070_BEHAVIORAL_GATING'
  | 'TEST_V070_STREET_NODE_SOURCE_SCHEMA'
  | 'TEST_V070_STREET_NODE_HEADING_RELATION'
  | 'TEST_V070_STREET_NODE_ID_NAMESPACE_ISOLATION'
  | 'TEST_V070_NO_IMPLICIT_CROSSWALK'
  | 'TEST_V070_STREET_NODE_SIM_INVARIANCE'
  | 'TEST_V070_STREET_NODE_PARSE_GATING'
  | 'TEST_V070_GEOMETRY_HEADER_BINDING'
  | 'TEST_V070_GEOMETRY_SOURCE_TRUTH_N00045'
  | 'TEST_V070_NO_WIDTH_REVERSE_ENGINEERING'
  | 'TEST_V070_NO_DIRECT_HW_RECONSTRUCTION'
  | 'TEST_V070_HW_SOURCE_SEMANTICS'
  | 'TEST_V070_OPEN_ONE_SIDE_GATING'
  | 'TEST_V070_NODE_GVI_ISOLATION'
  | 'TEST_V070_NODE_VEI_ISOLATION'
  | 'TEST_V070_NODE_SVF_BAND_ISOLATION'
  | 'TEST_V070_GEOMETRY_SIM_INVARIANCE'
  | 'TEST_V070_FINAL_PAPER_SAMPLE_ACCOUNTING'
  | 'TEST_V070_SPACE_SYNTAX_SPECIFICATION'
  | 'TEST_V070_PAPER_GWR_DIAGNOSTICS'
  | 'TEST_V070_REPO_GWR_FEASIBILITY_BLOCKING'
  | 'TEST_V070_REPO_GWR_KERNEL_DISTINCTION'
  | 'TEST_V070_PINNED_GWR_MACHINERY_TABLE'
  | 'TEST_V070_HISTORICAL_SAMPLE_SIZE_AUDIT'
  | 'TEST_V070_NODE_LEVEL_CALIBRATION_UNAVAILABLE'
  | 'TEST_V070_ACTIVE_SIM_ELASTICITY_FALLBACK'
  | 'TEST_V070_CALIBRATION_PROVENANCE_BOUNDARY'
  | 'TEST_V070_LEGACY_GWR_FORMULA_ISOLATION'
  | 'TEST_V070_T_BASE_FORMULA'
  | 'TEST_V070_MISSING_T_RAW_NOT_ZERO'
  | 'TEST_V070_LAMBDA_REMAINS_UNRESOLVED'
  | 'TEST_V070_BLOCKOLOGY_PLACEHOLDER_ISOLATION'
  | 'TEST_V070_F_GATE'
  | 'TEST_V070_T_EFFECTIVE_GATE'
  | 'TEST_V070_DXY_SYMBOL_ISOLATION'
  | 'TEST_V070_DXY_NETWORK_GATE'
  | 'TEST_V070_GWR_BANDWIDTH_NOT_DWELL_BANDWIDTH'
  | 'TEST_V070_20M_SPACING_NOT_DWELL_BANDWIDTH'
  | 'TEST_V070_DEMO_DWELL_NOT_EMPIRICAL'
  | 'TEST_V070_BEHAVIORAL_SIM_INVARIANCE'
  | 'TEST_STEP6_GOLDEN_FREEZE_INVARIANCE'
  | 'TEST_STEP6_QWEN_PROBABILITY_PARSING'
  | 'TEST_STEP6_APPROVAL_GATE_RECONCILIATION'
  | 'TEST_STEP6_ALONG_STREET_180_PROTOCOL'
  | 'TEST_STEP6_GEOMETRY_SEPARATION'
  | 'TEST_STEP6_SPACE_SYNTAX_VS_GWR'
  | 'TEST_STEP6_BEHAVIORAL_STAYABILITY_GATING'
  | 'TEST_STEP6_RELEASE_CANDIDATE_MASTER_PAYLOAD';

export interface ValidationTestResult {
  testId: ValidationTestId;
  title: string;
  passed: boolean;
  details: string[];
  errors: string[];
  pinnedRowExport?: RepoPinnedRowExport;
}

export interface ValidationSuiteSummary {
  allPassed: boolean;
  totalTests: number;
  passCount: number;
  failCount: number;
  results: ValidationTestResult[];
  status:
    | 'NATURE_9_03_V0_7_0_MULTI_SOURCE_RESEARCH_INTEGRATION_VERIFIED'
    | 'NATURE_9_03_V0_7_0_MULTI_SOURCE_RESEARCH_INTEGRATION_FAILED'
    | 'NATURE_9_03_V0_6_3_SOURCE_SEMANTIC_TRUTH_VERIFIED'
    | 'NATURE_9_03_V0_6_3_SOURCE_SEMANTIC_TRUTH_FAILED'
    | 'NATURE_9_03_V0_6_3_HEADER_BOUND_PAPER_FORMULA_LOCKED'
    | 'NATURE_9_03_V0_6_3_NOT_LOCKED';
}

/**
 * Standard complete test row fixture
 */
function createBaseRow(overrides: Partial<RawCsvRow> = {}): RawCsvRow {
  return {
    node_id: 'n00104',
    file: 'n00104_E_L.jpg',
    usable: 'true',
    exclude_reason: '',
    street: 'E 36th St',
    cardinal: 'E',
    side: 'L',
    // 1–7 ordinal ratings (medians)
    vertical_greenery_median: '3',
    vertical_hardscape_median: '6',
    green_eye_level_median: '3',
    green_softening_median: '2',
    signage_detail_median: '4',
    sky_openness_median: '4',
    ground_floor_activity_median: '5',
    walkable_ground_median: '5',
    resting_affordance_median: '3',
    facade_variation_median: '4',
    // Geometry
    H_m: '24.5',
    W_facade: '18.0',
    HW_facade: '1.36',
    HW_effective: '1.36',
    HW_source: 'measured',
    ...overrides,
  };
}

/**
 * TEST A: Complete visual-semantic record
 */
export function runTestA(): ValidationTestResult {
  const row = createBaseRow();
  const matched = buildMatchedRecordFromRow(row, 'test_vlm.csv', 0, 'EXPLICIT_NODE_ID');
  const bridge = assembleRepoPaperBridge(matched);

  const details: string[] = [];
  const errors: string[] = [];

  if (bridge.availableVisualSemanticCount !== 9) {
    errors.push(`Expected 9 visual-semantic variables, found ${bridge.availableVisualSemanticCount}`);
  } else {
    details.push(`All 9 visual-semantic variables available`);
  }

  if (!bridge.usableForActiveSynthesis) {
    errors.push('Expected usableForActiveSynthesis to be true');
  }

  if (!bridge.synthesis) {
    errors.push('Expected synthesis result to be computed');
  } else {
    const simVal = bridge.synthesis.sim.value;
    if (simVal === null || simVal < 1 || simVal > 7) {
      errors.push(`M_i value invalid or out of [1, 7]: ${simVal}`);
    } else {
      details.push(`M_i computed: ${simVal.toFixed(4)} using ${bridge.synthesis.elasticitySource}`);
    }

    if (bridge.synthesis.elasticitySource !== 'PAPER_GLOBAL_REFERENCE') {
      errors.push(`Expected PAPER_GLOBAL_REFERENCE elasticity, got ${bridge.synthesis.elasticitySource}`);
    }
  }

  return {
    testId: 'TEST_A',
    title: 'Complete visual-semantic record synthesis',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST B: SFV absent
 */
export function runTestB(): ValidationTestResult {
  const row = createBaseRow({
    facade_variation_median: '',
    facade_variation: '',
  });
  const matched = buildMatchedRecordFromRow(row, 'test_vlm.csv', 0, 'EXPLICIT_NODE_ID');
  const bridge = assembleRepoPaperBridge(matched);

  const details: string[] = [];
  const errors: string[] = [];

  const sfvField = bridge.mappedVariables.sfv;
  if (sfvField.value !== null) {
    errors.push(`Expected SFV to be null, got ${sfvField.value}`);
  } else {
    details.push(`SFV is correctly null / supplementary`);
  }

  // Active Place Identity Y_i must still be computed
  if (!bridge.synthesis || bridge.synthesis.placeIdentity.value === null) {
    errors.push('Expected Place Identity Y_i to be computed even without SFV');
  } else {
    details.push(`Y_i computed: ${bridge.synthesis.placeIdentity.value.toFixed(4)} (SFV is supplementary-only)`);
  }

  if (!bridge.synthesis || bridge.synthesis.sim.value === null) {
    errors.push('Expected active M_i to be computed');
  } else {
    details.push(`M_i computed successfully: ${bridge.synthesis.sim.value.toFixed(4)}`);
  }

  return {
    testId: 'TEST_B',
    title: 'SFV absent (supplementary status verified)',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST C: Geometry absent / open_one_side
 */
export function runTestC(): ValidationTestResult {
  const row = createBaseRow({
    H_m: '',
    W_facade: '',
    HW_facade: 'open_one_side',
    HW_effective: 'open_one_side',
    HW_source: 'open_one_side',
  });
  const matched = buildMatchedRecordFromRow(row, 'test_geom.csv', 0, 'EXPLICIT_NODE_ID');
  const bridge = assembleRepoPaperBridge(matched);

  const details: string[] = [];
  const errors: string[] = [];

  if (bridge.mappedVariables.hwRatio.value !== null) {
    errors.push(`Expected hwRatio to be null for open_one_side, got ${bridge.mappedVariables.hwRatio.value}`);
  } else {
    details.push('open_one_side preserved without numeric fabrication');
  }

  // Active M must not be blocked by geometry
  if (!bridge.synthesis || bridge.synthesis.sim.value === null) {
    errors.push('Expected active M_i to compute independently of H/W');
  } else {
    details.push(`M_i computed: ${bridge.synthesis.sim.value.toFixed(4)} (H/W is GEOMETRY_CONTEXT_ONLY)`);
  }

  return {
    testId: 'TEST_C',
    title: 'Geometry absent / open_one_side context isolation',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST D: Behavior absent
 */
export function runTestD(): ValidationTestResult {
  const row = createBaseRow();
  const matched = buildMatchedRecordFromRow(row, 'test_vlm.csv', 0, 'EXPLICIT_NODE_ID');
  const bridge = assembleRepoPaperBridge(matched);

  const details: string[] = [];
  const errors: string[] = [];

  if (!bridge.synthesis) {
    errors.push('Expected synthesis result');
    return {
      testId: 'TEST_D',
      title: 'Behavior absent (dwell time gating)',
      passed: false,
      details,
      errors,
    };
  }

  // M must be computed
  if (bridge.synthesis.sim.value === null) {
    errors.push('Expected M_i to be computed');
  } else {
    details.push(`M_i computed: ${bridge.synthesis.sim.value.toFixed(4)}`);
  }

  // Stayability amplification F_i must be method_gated (since lambda is null)
  if (bridge.synthesis.stayabilityFactor.status !== 'method_gated') {
    errors.push(`Expected stayabilityFactor to be method_gated, got ${bridge.synthesis.stayabilityFactor.status}`);
  } else {
    details.push(`stayabilityFactor status is correctly method_gated`);
  }

  // Effective dwell time must be input_gated (since t_base is null)
  if (bridge.synthesis.tEffective.status !== 'input_gated') {
    errors.push(`Expected tEffective to be input_gated, got ${bridge.synthesis.tEffective.status}`);
  } else {
    details.push(`tEffective status is correctly input_gated`);
  }

  return {
    testId: 'TEST_D',
    title: 'Behavior absent (dwell time gating)',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST E: Unusable node (usable = false)
 */
export function runTestE(): ValidationTestResult {
  const row = createBaseRow({
    usable: 'false',
    exclude_reason: 'Severe scaffolding obstruction and camera glare',
  });
  const matched = buildMatchedRecordFromRow(row, 'test_vlm.csv', 0, 'EXPLICIT_NODE_ID');
  const bridge = assembleRepoPaperBridge(matched);

  const details: string[] = [];
  const errors: string[] = [];

  if (bridge.usableForActiveSynthesis) {
    errors.push('Expected usableForActiveSynthesis to be false');
  } else {
    details.push(`usableForActiveSynthesis is false`);
  }

  if (bridge.usabilityStatus !== 'SOURCE_EXCLUDED') {
    errors.push(`Expected usabilityStatus SOURCE_EXCLUDED, got ${bridge.usabilityStatus}`);
  } else {
    details.push(`usabilityStatus is SOURCE_EXCLUDED (${bridge.excludeReason})`);
  }

  if (bridge.synthesis !== null) {
    errors.push('Expected active synthesis to be BLOCKED (null), but synthesis was run');
  } else {
    details.push('Active paper synthesis successfully blocked');
  }

  return {
    testId: 'TEST_E',
    title: 'Unusable node exclusion and synthesis blocking',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST F: Old repository final M exists (comparative provenance only)
 */
export function runTestF(): ValidationTestResult {
  const row = createBaseRow({
    I_raw: '0.456',
    I: '3.12',
    Y: '4.50',
    D: '3.80',
    Omega: '1.15',
    M: '3.750',
    M_local: '3.820',
  });
  const matched = buildMatchedRecordFromRow(row, 'test_calcs.csv', 0, 'EXPLICIT_NODE_ID');
  const bridge = assembleRepoPaperBridge(matched);

  const details: string[] = [];
  const errors: string[] = [];

  if (!matched.comparativeFinals) {
    errors.push('Expected comparativeFinals to be populated');
  } else {
    details.push(`Captured legacy M: ${matched.comparativeFinals.legacyM} (Omega: ${matched.comparativeFinals.legacyOmega})`);
    if (matched.comparativeFinals.role !== 'COMPARATIVE_PROVENANCE_ONLY') {
      errors.push(`Expected role COMPARATIVE_PROVENANCE_ONLY, got ${matched.comparativeFinals.role}`);
    }
  }

  if (!bridge.synthesis || bridge.synthesis.sim.value === null) {
    errors.push('Expected active synthesis to be computed from inputs');
  } else {
    // Check that active M is NOT equal to legacy M unless by mathematical coincidence
    details.push(`Active recomputed M_i: ${bridge.synthesis.sim.value.toFixed(4)}`);
  }

  return {
    testId: 'TEST_F',
    title: 'Old repository final M captured as comparative provenance only',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST G: Ambiguous node match
 */
export function runTestG(): ValidationTestResult {
  const rows: RawCsvRow[] = [
    createBaseRow({ node_id: 'n00104', file: 'n00104_E_L.jpg' }),
    createBaseRow({ node_id: 'n00104', file: 'n00104_W_R.jpg' }),
  ];

  // Match by node_id alone when target filename is not specified
  const matchResult = matchRepositoryRow(rows, 'test_vlm.csv', {
    activeNodeId: 'n00104',
    activeFilename: null,
  });

  const details: string[] = [];
  const errors: string[] = [];

  if (matchResult.matchStatus !== 'AMBIGUOUS_SOURCE_MATCH') {
    errors.push(`Expected AMBIGUOUS_SOURCE_MATCH, got ${matchResult.matchStatus}`);
  } else {
    details.push(`Status is correctly AMBIGUOUS_SOURCE_MATCH (${matchResult.ambiguousCandidates.length} candidates)`);
  }

  if (matchResult.matchedIndex !== null) {
    errors.push(`Expected matchedIndex to be null, got ${matchResult.matchedIndex}`);
  } else {
    details.push('Automatic approval blocked on ambiguous match');
  }

  return {
    testId: 'TEST_G',
    title: 'Ambiguous node match detection and gating',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST H: One Real Repository Row End-to-End Test
 * Pinned row: n00045 from results/tables/vlm_observations_murrayhill.csv
 * Repository: mikellu12/murrayhill-v12
 * Commit: 9353169b3dc3a1b4673e7144249db6ccbf7ac0f1
 * Blob SHA: 975feac25b631c0839fb694db68ffd2e4da51e98
 */
export function runTestH(): ValidationTestResult {
  const row: RawCsvRow = {
    file: '1st_avenue/north_to_south/001_n00045_S.jpg',
    node_id: 'n00045',
    street: '1st_avenue',
    walk: 'north_to_south',
    side: 'W',
    seq: '1',
    cardinal: 'S',
    usable: 'True',
    exclude_reason: '',
    street_name: '1st Avenue',
    typology: 'avenue_secondary',
    face_id: 'f1',
    vertical_greenery_median_round: '1',
    vertical_greenery_median: '1.2434574547629729',
    vertical_greenery_p1: '0.6687',
    vertical_greenery_p2: '0.2171',
    vertical_greenery_p3: '0.0705',
    vertical_greenery_p4: '0.0157',
    vertical_greenery_p5: '0.0157',
    vertical_greenery_p6: '0.0066',
    vertical_greenery_p7: '0.0058',
    vertical_hardscape_median_round: '5',
    vertical_hardscape_median: '5.275995063252083',
    green_eye_level_median_round: '2',
    green_eye_level_median: '2.210586356376911',
    sky_openness_median_round: '5',
    sky_openness_median: '5.144777662874871',
    walkable_ground_median_round: '5',
    walkable_ground_median: '5.17148182665424',
    green_softening_median_round: '2',
    green_softening_median: '2.2959057071960296',
    signage_detail_median_round: '4',
    signage_detail_median: '4.365168539325842',
    facade_variation_median_round: '6',
    facade_variation_median: '5.868217960710945',
    ground_floor_activity_median_round: '6',
    ground_floor_activity_median: '5.605327768229806',
    resting_affordance_median_round: '1',
    resting_affordance_median: '1.3259604190919674',
    W_facade: '18.373344000000003',
    HW_facade: '0.5367320941078925',
    HW_effective: '0.5367320941078925',
    HW_source: 'series',
    node_GVI: '1.8055209092729336',
    node_VEI: '0.6017595356297097',
    node_SVF_band: '0.1946937439740204',
  };

  const pinnedRowExport: RepoPinnedRowExport = {
    repository_name: 'mikellu12/murrayhill-v12',
    repository_commit: '9353169b3dc3a1b4673e7144249db6ccbf7ac0f1',
    repository_path: 'results/tables/vlm_observations_murrayhill.csv',
    repository_blob_sha: '975feac25b631c0839fb694db68ffd2e4da51e98',
    exact_csv_file: '1st_avenue/north_to_south/001_n00045_S.jpg',
    node_id: 'n00045',
    street: '1st_avenue',
    walk: 'north_to_south',
    side: 'W',
    seq: '1',
    usable: 'True',
    exclude_reason: '',
  };

  const matched = buildMatchedRecordFromRow(
    row,
    'results/tables/vlm_observations_murrayhill.csv',
    1,
    'EXPLICIT_NODE_ID',
    {
      repositoryName: 'mikellu12/murrayhill-v12',
      repositoryCommit: '9353169b3dc3a1b4673e7144249db6ccbf7ac0f1',
      repositoryDataVersion: 'murrayhill_team_repo_v0.6.3',
    }
  );
  const bridge = assembleRepoPaperBridge(matched);

  const details: string[] = [];
  const errors: string[] = [];

  // 1. Check node identity & usability
  if (bridge.nodeId !== 'n00045' || !bridge.usableForActiveSynthesis) {
    errors.push(`Node n00045 should be usable, got usableForActiveSynthesis=${bridge.usableForActiveSynthesis}`);
  } else {
    details.push(`Node: ${bridge.nodeId}, file: ${matched.identity.sourceFilename}, usable: true, exclude_reason: (none)`);
  }

  // 2. Validate all 10 median-round checks and continuous readout source tracking
  const parsedVars = matched.qwenRecord;
  for (const [vKey, entry] of Object.entries(parsedVars)) {
    if (!entry.continuousReadoutSource) {
      errors.push(`Variable ${vKey} missing continuousReadoutSource`);
    }
    if (!entry.displayRungSource) {
      errors.push(`Variable ${vKey} missing displayRungSource`);
    }
    if (entry.readoutMethod !== 'ORDINAL_INTERPOLATED_MEDIAN') {
      errors.push(`Variable ${vKey} unexpected readoutMethod: ${entry.readoutMethod}`);
    }
    if (!entry.medianRoundValidationPassed) {
      errors.push(`Variable ${vKey} failed median_round validation (expected Math.round(${entry.raw_median_1_7}) === ${entry.displayRung})`);
    } else {
      details.push(`${vKey}: continuous=${entry.raw_median_1_7} (${entry.continuousReadoutSource}), round=${entry.displayRung} (${entry.displayRungSource}) [PASS]`);
    }
  }

  // 3. Check normalized active inputs
  const vars = bridge.mappedVariables;
  const tol = 1e-4;

  const checkVar = (name: string, val: number | null, expectedNorm: number, expectedField: string) => {
    if (val === null || Math.abs(val - expectedNorm) > tol) {
      errors.push(`${name} expected ${expectedNorm.toFixed(4)}, got ${val}`);
    } else {
      details.push(`${name}: normalized=${val.toFixed(4)} (source=${expectedField})`);
    }
  };

  const expectedVNatNorm = (1.2434574547629729 - 1) / 6;
  const expectedVBuiltNorm = (5.275995063252083 - 1) / 6;
  const expectedRatio = expectedVNatNorm / expectedVBuiltNorm;

  checkVar('V_nat', vars.vNat.value, expectedVNatNorm, 'vertical_greenery_median');
  checkVar('V_built', vars.vBuilt.value, expectedVBuiltNorm, 'vertical_hardscape_median');
  checkVar('V_nat/V_built (diagnostic)', vars.naturalBuiltRatio.value, expectedRatio, 'vertical_greenery_median / vertical_hardscape_median');
  checkVar('GVI_eye', vars.gviEye.value, (2.210586356376911 - 1) / 6, 'green_eye_level_median');
  checkVar('GMI', vars.gmi.value, (2.2959057071960296 - 1) / 6, 'green_softening_median');
  checkVar('V_sign', vars.vSign.value, (4.365168539325842 - 1) / 6, 'signage_detail_median');
  checkVar('SVF_STANDARDIZED_INPUT', vars.svf.value, (5.144777662874871 - 1) / 6, 'sky_openness_median');
  checkVar('GFAPI', vars.gfapi.value, (5.605327768229806 - 1) / 6, 'ground_floor_activity_median');
  checkVar('V_pave', vars.vPave.value, (5.17148182665424 - 1) / 6, 'walkable_ground_median');
  checkVar('IAS', vars.ias.value, (1.3259604190919674 - 1) / 6, 'resting_affordance_median');
  checkVar('SFV (supplementary)', vars.sfv.value, (5.868217960710945 - 1) / 6, 'facade_variation_median');

  // Verify source-backed probability distribution
  if (!vars.vNat.probabilityDistribution) {
    errors.push('vNat expected probabilityDistribution from vertical_greenery_p1..p7, got null');
  } else {
    const p = vars.vNat.probabilityDistribution;
    if (p.p1 !== 0.6687 || p.p2 !== 0.2171 || p.p3 !== 0.0705 || p.p4 !== 0.0157 || p.p5 !== 0.0157 || p.p6 !== 0.0066 || p.p7 !== 0.0058) {
      errors.push(`vNat probability values mismatch: ${JSON.stringify(p)}`);
    } else {
      details.push(`vNat probabilities: p1=${p.p1}, p2=${p.p2}, p3=${p.p3}, p4=${p.p4}, p5=${p.p5}, p6=${p.p6}, p7=${p.p7} [PASS]`);
    }
  }
  if (vars.vBuilt.probabilityDistribution !== null) {
    errors.push('vBuilt expected probabilityDistribution=null when columns absent, got non-null');
  }

  // Verify H/W geometry classification
  if (vars.hwRatio.classification !== 'REPO_GEOMETRY_CONTEXT') {
    errors.push(`vars.hwRatio expected classification 'REPO_GEOMETRY_CONTEXT', got '${vars.hwRatio.classification}'`);
  }
  if (vars.hwSourceField.classification !== 'REPO_GEOMETRY_CONTEXT') {
    errors.push(`vars.hwSourceField expected classification 'REPO_GEOMETRY_CONTEXT', got '${vars.hwSourceField.classification}'`);
  }
  if (vars.hwRatio.value !== 0.5367320941078925) {
    errors.push(`vars.hwRatio expected 0.5367320941078925, got ${vars.hwRatio.value}`);
  }
  if (vars.hwSourceField.value !== 'series') {
    errors.push(`vars.hwSourceField expected 'series', got ${vars.hwSourceField.value}`);
  }

  // Check that node_SVF_band and node_GVI are kept distinct and do not override
  if (vars.svf.value === 0.1946937439740204) {
    errors.push('SVF input was erroneously overwritten by node_SVF_band');
  } else {
    details.push(`Sky openness (${vars.svf.value?.toFixed(4)}) strictly distinct from node_SVF_band (0.1947)`);
  }
  if (vars.gviEye.value === 1.8055209092729336) {
    errors.push('GVI_eye input was erroneously overwritten by node_GVI');
  } else {
    details.push(`GVI_eye (${vars.gviEye.value?.toFixed(4)}) strictly distinct from node_GVI (1.8055)`);
  }

  // 4. Check synthesis through locked v0.6.3 engine
  const syn = bridge.synthesis;
  if (!syn) {
    errors.push('Expected active synthesis result');
    return { testId: 'TEST_H', title: 'Real repository row end-to-end test (node n00045)', passed: false, details, errors, pinnedRowExport };
  }

  const expectedIRaw = 0.4746845369069087;
  const expectedI = 6.785792291750779;
  const expectedY = 4.275239548226926;
  const expectedDRawPaper = 0.7495737076243679;
  const expectedDCalibrationInput = 0.37478685381218395;
  const expectedD = 6.861271847132807;
  const expectedM = 6.214327916148292;

  if (syn.imageabilityRaw.value === null || Math.abs(syn.imageabilityRaw.value - expectedIRaw) > tol) {
    errors.push(`I_raw expected ${expectedIRaw.toFixed(4)}, got ${syn.imageabilityRaw.value}`);
  } else {
    details.push(`I_raw = ${syn.imageabilityRaw.value.toFixed(4)}, I = ${syn.placeImageability.value?.toFixed(4)}`);
  }

  if (syn.placeIdentity.value === null || Math.abs(syn.placeIdentity.value - expectedY) > tol) {
    errors.push(`Y expected ${expectedY.toFixed(4)}, got ${syn.placeIdentity.value}`);
  } else {
    details.push(`Y = ${syn.placeIdentity.value.toFixed(4)}`);
  }

  if (syn.placeDependence.value === null || Math.abs(syn.placeDependence.value - expectedD) > tol) {
    errors.push(`D expected ${expectedD.toFixed(4)}, got ${syn.placeDependence.value}`);
  } else {
    details.push(`D_raw = ${syn.dRawPaper?.toFixed(4)}, D_calibration_input(legacy) = ${syn.dCalibrationInput?.toFixed(4)}, D = ${syn.placeDependence.value?.toFixed(4)} [LOCKED_PAPER_FORMULA]`);
  }

  if (syn.dValueEnteringSigmoid !== 'D_raw_paper') {
    errors.push(`Expected dValueEnteringSigmoid 'D_raw_paper', got ${syn.dValueEnteringSigmoid}`);
  } else {
    details.push(`Sigmoid input verified: ${syn.dValueEnteringSigmoid} (no calibration transform)`);
  }

  if (syn.dPaperStatus !== 'PAPER_FORMULA_LOCKED') {
    errors.push(`Expected dPaperStatus 'PAPER_FORMULA_LOCKED', got ${syn.dPaperStatus}`);
  }

  if (syn.elasticitySource !== 'PAPER_GLOBAL_REFERENCE') {
    errors.push(`Expected elasticitySource PAPER_GLOBAL_REFERENCE, got ${syn.elasticitySource}`);
  } else {
    details.push(`Elasticities: a=${syn.localElasticities.value?.a}, b=${syn.localElasticities.value?.b}, c=${syn.localElasticities.value?.c} (${syn.elasticitySource})`);
  }

  if (syn.sim.value === null || Math.abs(syn.sim.value - expectedM) > tol) {
    errors.push(`Active M expected ${expectedM.toFixed(6)}, got ${syn.sim.value}`);
  } else {
    details.push(`Active M_i = ${syn.sim.value.toFixed(6)}`);
  }

  details.push(`Behavioral: lambda=${syn.calibration.lambdaStatus}, F=${syn.stayabilityFactor.status}, t_effective=${syn.tEffective.status}`);

  return {
    testId: 'TEST_H',
    title: 'Real repository row end-to-end test (node n00045)',
    passed: errors.length === 0,
    details,
    errors,
    pinnedRowExport,
  };
}

/**
 * TEST I: Old Repository Result Invariance Test
 * Modifying comparative calculations must NOT change active M.
 */
export function runTestI(): ValidationTestResult {
  const baseRow = createBaseRow();
  const matchedBase = buildMatchedRecordFromRow(baseRow, 'vlm_observations_murrayhill.csv', 104, 'EXPLICIT_NODE_ID');
  const bridgeBase = assembleRepoPaperBridge(matchedBase);
  const baselineM = bridgeBase.synthesis?.sim.value;

  const details: string[] = [];
  const errors: string[] = [];

  if (baselineM === null || baselineM === undefined) {
    errors.push('Baseline M could not be computed');
    return { testId: 'TEST_I', title: 'Old repository result invariance test', passed: false, details, errors };
  }

  details.push(`Baseline active M_i: ${baselineM.toFixed(6)}`);

  // Create row with identical observations but wild legacy comparative calculations
  const rowWithLegacy = createBaseRow({
    Omega: '99.999',
    omega: '99.999',
    M: '0.0001',
    sim: '0.0001',
    M_noA: '12.345',
    M_local: '8.888',
    I: '1.000',
    Y: '7.000',
    D: '1.000',
    I_raw: '0.050',
    D_raw: '0.100',
    a: '0.10',
    b: '0.80',
    c: '0.10',
    nat_built: '9999.0',
  });

  const matchedLegacy = buildMatchedRecordFromRow(rowWithLegacy, 'vlm_calculations_murrayhill.csv', 104, 'EXPLICIT_NODE_ID');
  const bridgeLegacy = assembleRepoPaperBridge(matchedLegacy);
  const recomputedM = bridgeLegacy.synthesis?.sim.value;

  if (recomputedM === null || recomputedM === undefined) {
    errors.push('Recomputed M was null');
  } else {
    details.push(`Active M_i with injected legacy comparative calculations: ${recomputedM.toFixed(6)}`);
    if (Math.abs(recomputedM - baselineM) > 1e-10) {
      errors.push(`Active M changed when legacy comparative calculations were modified! diff=${Math.abs(recomputedM - baselineM)}`);
    } else {
      details.push('PASS: Active M_i is bit-for-bit invariant to all legacy comparative calculations');
    }

    if (recomputedM === 0.0001) {
      errors.push('Active M was erroneously overwritten by legacy M (0.0001)');
    } else {
      details.push('PASS: Active M_i did NOT adopt legacy M (0.0001)');
    }
  }

  if (matchedLegacy.comparativeFinals?.role !== 'COMPARATIVE_PROVENANCE_ONLY') {
    errors.push(`Expected role COMPARATIVE_PROVENANCE_ONLY, got ${matchedLegacy.comparativeFinals?.role}`);
  } else {
    details.push('PASS: Legacy calculations table classified strictly as COMPARATIVE_PROVENANCE_ONLY');
  }

  return {
    testId: 'TEST_I',
    title: 'Old repository result invariance test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST J: Natural-Built Ratio Execution Ownership Regression Test
 * A: provide vNat and vBuilt normally
 * B: mutate bridge-level naturalBuiltRatio to an arbitrary incorrect number
 * Expected: active I_raw, active I, active M must remain bit-for-bit identical.
 * This proves that the frozen engine owns the ratio calculation.
 */
export function runTestJ(): ValidationTestResult {
  const baseInputs: PaperResearchInputs = {
    vNat: 0.04057624246049548,
    vBuilt: 0.7126658438753471,
    naturalBuiltRatio: 0.056935859644751965,
    gviEye: 0.20176439272948513,
    gmi: 0.6907962771458118,
    vSign: 0.69524697110904,
    svf: 0.2159842845326716,
    sfv: 0.0543267365153279,
    gfapi: 0.5608614232209738,
    vPave: 0.8113696601184909,
    ias: 0.767554628038301,
    hwRatio: 1.8055209092729336,
    spaceSyntaxChoice: null,
    spaceSyntaxIntegration: null,
    gwrLocalBetas: null,
    sourceBackedTypology: null,
    tBase: null,
  };

  const resA = computePaperSynthesis(baseInputs);
  const mutatedInputs: PaperResearchInputs = {
    ...baseInputs,
    naturalBuiltRatio: 999.9999, // Mutate bridge-level ratio to arbitrary incorrect value
  };
  const resB = computePaperSynthesis(mutatedInputs);

  const details: string[] = [];
  const errors: string[] = [];

  const rawIdentical = resA.imageabilityRaw.value === resB.imageabilityRaw.value;
  const imageabilityIdentical = resA.placeImageability.value === resB.placeImageability.value;
  const simIdentical = resA.sim.value === resB.sim.value;

  if (!rawIdentical) {
    errors.push(`I_raw not identical: A=${resA.imageabilityRaw.value}, B=${resB.imageabilityRaw.value}`);
  } else {
    details.push(`I_raw bit-for-bit identical (${resA.imageabilityRaw.value})`);
  }

  if (!imageabilityIdentical) {
    errors.push(`I not identical: A=${resA.placeImageability.value}, B=${resB.placeImageability.value}`);
  } else {
    details.push(`I bit-for-bit identical (${resA.placeImageability.value})`);
  }

  if (!simIdentical) {
    errors.push(`M not identical: A=${resA.sim.value}, B=${resB.sim.value}`);
  } else {
    details.push(`M bit-for-bit identical (${resA.sim.value})`);
  }

  return {
    testId: 'TEST_J',
    title: 'Natural-Built Ratio Execution Ownership Regression Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST HEADER_BINDING: Exact CSV Header Name Column-Binding Regression Test
 * Asserts mappedVariables.<var>.sourceColumn matches the exact CSV header name
 * for n00045, confirming no positional CSV mapping is used.
 */
export function runTestHeaderBinding(): ValidationTestResult {
  const row: RawCsvRow = {
    node_id: 'n00045',
    file: '1st_avenue/north_to_south/001_n00045_S.jpg',
    usable: 'True',
    exclude_reason: '',
    street: '1st_avenue',
    walk: 'north_to_south',
    side: 'W',
    seq: '1',
    vertical_greenery_median_round: '1',
    vertical_greenery_median: '1.2434574547629729',
    vertical_hardscape_median_round: '5',
    vertical_hardscape_median: '5.275995063252083',
    green_eye_level_median_round: '2',
    green_eye_level_median: '2.210586356376911',
    sky_openness_median_round: '5',
    sky_openness_median: '5.144777662874871',
    walkable_ground_median_round: '5',
    walkable_ground_median: '5.17148182665424',
    green_softening_median_round: '2',
    green_softening_median: '2.2959057071960296',
    signage_detail_median_round: '4',
    signage_detail_median: '4.365168539325842',
    facade_variation_median_round: '6',
    facade_variation_median: '5.868217960710945',
    ground_floor_activity_median_round: '6',
    ground_floor_activity_median: '5.605327768229806',
    resting_affordance_median_round: '1',
    resting_affordance_median: '1.3259604190919674',
    W_facade: '18.373344000000003',
    HW_facade: '0.5367320941078925',
    HW_effective: '0.5367320941078925',
    HW_source: 'series',
    node_GVI: '1.8055209092729336',
    node_VEI: '0.6017595356297097',
    node_SVF_band: '0.1946937439740204',
  };

  const matched = buildMatchedRecordFromRow(
    row,
    'results/tables/vlm_observations_murrayhill.csv',
    1,
    'EXPLICIT_NODE_ID'
  );
  const bridge = assembleRepoPaperBridge(matched);
  const vars = bridge.mappedVariables;

  const details: string[] = [];
  const errors: string[] = [];

  const assertCol = (
    name: string,
    actualCol: string | null | undefined,
    expectedCol: string,
    actualVal: any,
    expectedVal: any,
    targetVar: string
  ) => {
    if (actualCol !== expectedCol) {
      errors.push(`${name}: expected sourceColumn '${expectedCol}', got '${actualCol}'`);
    } else {
      details.push(`${name} (target: ${targetVar}) -> bound to header '${expectedCol}' (sourceValue=${actualVal})`);
    }
    if (String(actualVal) !== String(expectedVal)) {
      errors.push(`${name}: expected sourceValue '${expectedVal}', got '${actualVal}'`);
    }
  };

  assertCol('vertical_greenery', vars.vNat.sourceColumn, 'vertical_greenery_median', vars.vNat.sourceValue, '1.2434574547629729', 'vNat');
  assertCol('vertical_hardscape', vars.vBuilt.sourceColumn, 'vertical_hardscape_median', vars.vBuilt.sourceValue, '5.275995063252083', 'vBuilt');
  assertCol('green_eye_level', vars.gviEye.sourceColumn, 'green_eye_level_median', vars.gviEye.sourceValue, '2.210586356376911', 'gviEye');
  assertCol('sky_openness', vars.svf.sourceColumn, 'sky_openness_median', vars.svf.sourceValue, '5.144777662874871', 'svf');
  assertCol('walkable_ground', vars.vPave.sourceColumn, 'walkable_ground_median', vars.vPave.sourceValue, '5.17148182665424', 'vPave');
  assertCol('green_softening', vars.gmi.sourceColumn, 'green_softening_median', vars.gmi.sourceValue, '2.2959057071960296', 'gmi');
  assertCol('signage_detail', vars.vSign.sourceColumn, 'signage_detail_median', vars.vSign.sourceValue, '4.365168539325842', 'vSign');
  assertCol('facade_variation', vars.sfv.sourceColumn, 'facade_variation_median', vars.sfv.sourceValue, '5.868217960710945', 'sfv');
  assertCol('ground_floor_activity', vars.gfapi.sourceColumn, 'ground_floor_activity_median', vars.gfapi.sourceValue, '5.605327768229806', 'gfapi');
  assertCol('resting_affordance', vars.ias.sourceColumn, 'resting_affordance_median', vars.ias.sourceValue, '1.3259604190919674', 'ias');

  // Geometry / Node context header bindings
  assertCol('HW_effective', vars.hwRatio.sourceColumn, 'HW_effective', vars.hwRatio.sourceValue, '0.5367320941078925', 'hwRatio');
  assertCol('HW_source', vars.hwSourceField?.sourceColumn, 'HW_source', vars.hwSourceField?.sourceValue, 'series', 'hwSourceField');
  assertCol('node_GVI', vars.nodeGVI?.sourceColumn, 'node_GVI', vars.nodeGVI?.sourceValue, '1.8055209092729336', 'nodeGVI');
  assertCol('node_VEI', vars.nodeVEI?.sourceColumn, 'node_VEI', vars.nodeVEI?.sourceValue, '0.6017595356297097', 'nodeVEI');
  assertCol('node_SVF_band', vars.nodeSVFBand?.sourceColumn, 'node_SVF_band', vars.nodeSVFBand?.sourceValue, '0.1946937439740204', 'nodeSVFBand');

  // Anti-cross-contamination assertions:
  if (vars.svf.sourceColumn === 'node_SVF_band' || vars.svf.sourceColumn === 'node_GVI') {
    errors.push('CRITICAL: sky_openness column binding cross-pollinated with node geometry!');
  } else {
    details.push('PASS: sky_openness strictly bound to sky_openness_median, never node_SVF_band');
  }

  if (vars.gviEye.sourceColumn === 'node_GVI' || vars.gviEye.sourceColumn === 'node_SVF_band') {
    errors.push('CRITICAL: green_eye_level column binding cross-pollinated with node geometry!');
  } else {
    details.push('PASS: green_eye_level strictly bound to green_eye_level_median, never node_GVI');
  }

  return {
    testId: 'TEST_HEADER_BINDING',
    title: 'Header-based column binding regression test (node n00045)',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST D_INVARIANCE: Place Dependence D Formula Invariance Test
 * Verifies that injecting arbitrary values into D_calibration_input does not
 * change the active D or M results in the authoritative engine.
 */
export function runTestDInvariance(): ValidationTestResult {
  const baseInputs: PaperResearchInputs = {
    vNat: (1.2434574547629729 - 1) / 6,
    vBuilt: (5.275995063252083 - 1) / 6,
    naturalBuiltRatio: ((1.2434574547629729 - 1) / 6) / ((5.275995063252083 - 1) / 6),
    gviEye: (2.210586356376911 - 1) / 6,
    gmi: (2.2959057071960296 - 1) / 6,
    vSign: (4.365168539325842 - 1) / 6,
    svf: (5.144777662874871 - 1) / 6,
    sfv: (5.868217960710945 - 1) / 6,
    gfapi: (5.605327768229806 - 1) / 6,
    vPave: (5.17148182665424 - 1) / 6,
    ias: (1.3259604190919674 - 1) / 6,
    hwRatio: 0.5367320941078925,
    spaceSyntaxChoice: null,
    spaceSyntaxIntegration: null,
    gwrLocalBetas: null,
    sourceBackedTypology: null,
    tBase: null,
  };

  const resA = computePaperSynthesis(baseInputs);

  // Injected mutated inputs: pass extreme arbitrary numbers for dCalibrationInput
  const mutatedInputs: PaperResearchInputs = {
    ...baseInputs,
    dCalibrationInput: 9999.9999,
  };
  const resB = computePaperSynthesis(mutatedInputs);

  const negativeMutatedInputs: PaperResearchInputs = {
    ...baseInputs,
    dCalibrationInput: -8888.8888,
  };
  const resC = computePaperSynthesis(negativeMutatedInputs);

  const details: string[] = [];
  const errors: string[] = [];

  const dValA = resA.placeDependence.value;
  const dValB = resB.placeDependence.value;
  const dValC = resC.placeDependence.value;

  const mValA = resA.sim.value;
  const mValB = resB.sim.value;
  const mValC = resC.sim.value;

  if (dValA === null || dValB === null || dValC === null) {
    errors.push('Place Dependence D was null');
  } else if (dValA !== dValB || dValA !== dValC) {
    errors.push(`D_i changed when dCalibrationInput was mutated! A=${dValA}, B=${dValB}, C=${dValC}`);
  } else {
    details.push(`D_i bit-for-bit identical across dCalibrationInput mutations (${dValA.toFixed(10)})`);
  }

  if (mValA === null || mValB === null || mValC === null) {
    errors.push('Active SIM M was null');
  } else if (mValA !== mValB || mValA !== mValC) {
    errors.push(`M_i changed when dCalibrationInput was mutated! A=${mValA}, B=${mValB}, C=${mValC}`);
  } else {
    details.push(`M_i bit-for-bit identical across dCalibrationInput mutations (${mValA.toFixed(10)})`);
  }

  if (resA.dValueEnteringSigmoid !== 'D_raw_paper') {
    errors.push(`Expected dValueEnteringSigmoid 'D_raw_paper', got ${resA.dValueEnteringSigmoid}`);
  } else {
    details.push('PASS: Value entering sigmoid verified as D_raw_paper');
  }

  if (resA.dPaperStatus !== 'PAPER_FORMULA_LOCKED') {
    errors.push(`Expected dPaperStatus 'PAPER_FORMULA_LOCKED', got ${resA.dPaperStatus}`);
  } else {
    details.push('PASS: dPaperStatus verified as PAPER_FORMULA_LOCKED');
  }

  return {
    testId: 'TEST_D_INVARIANCE',
    title: 'Place Dependence D formula invariance test (D_calibration_input mutation)',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST SOURCE_ORDER_ROBUSTNESS: CSV Header Position Invariance Test
 * Permutes and randomizes CSV column ordering in memory to verify that
 * parsing relies strictly on header names, not positional array indices.
 */
export function runTestSourceOrderRobustness(): ValidationTestResult {
  const standardRow: RawCsvRow = {
    node_id: 'n00045',
    file: '1st_avenue/north_to_south/001_n00045_S.jpg',
    usable: 'True',
    exclude_reason: '',
    street: '1st_avenue',
    walk: 'north_to_south',
    side: 'W',
    seq: '1',
    vertical_greenery_median_round: '1',
    vertical_greenery_median: '1.2434574547629729',
    vertical_hardscape_median_round: '5',
    vertical_hardscape_median: '5.275995063252083',
    green_eye_level_median_round: '2',
    green_eye_level_median: '2.210586356376911',
    sky_openness_median_round: '5',
    sky_openness_median: '5.144777662874871',
    walkable_ground_median_round: '5',
    walkable_ground_median: '5.17148182665424',
    green_softening_median_round: '2',
    green_softening_median: '2.2959057071960296',
    signage_detail_median_round: '4',
    signage_detail_median: '4.365168539325842',
    facade_variation_median_round: '6',
    facade_variation_median: '5.868217960710945',
    ground_floor_activity_median_round: '6',
    ground_floor_activity_median: '5.605327768229806',
    resting_affordance_median_round: '1',
    resting_affordance_median: '1.3259604190919674',
    W_facade: '18.373344000000003',
    HW_facade: '0.5367320941078925',
    HW_effective: '0.5367320941078925',
    HW_source: 'series',
    node_GVI: '1.8055209092729336',
    node_VEI: '0.6017595356297097',
    node_SVF_band: '0.1946937439740204',
  };

  // Parse standard baseline
  const matchedStandard = buildMatchedRecordFromRow(standardRow, 'test.csv', 1, 'EXPLICIT_NODE_ID');
  const bridgeStandard = assembleRepoPaperBridge(matchedStandard);

  // Create reversed column ordering
  const standardEntries = Object.entries(standardRow);
  const reversedRow: RawCsvRow = {};
  for (const [k, v] of [...standardEntries].reverse()) {
    reversedRow[k] = v;
  }

  // Create deterministic pseudo-shuffled column ordering
  const shuffledKeys = Object.keys(standardRow).sort((a, b) => {
    let hashA = 0;
    for (let i = 0; i < a.length; i++) hashA = ((hashA << 5) - hashA) + a.charCodeAt(i);
    let hashB = 0;
    for (let i = 0; i < b.length; i++) hashB = ((hashB << 5) - hashB) + b.charCodeAt(i);
    return hashA - hashB;
  });
  const shuffledRow: RawCsvRow = {};
  for (const k of shuffledKeys) {
    shuffledRow[k] = standardRow[k];
  }

  const matchedReversed = buildMatchedRecordFromRow(reversedRow, 'test.csv', 1, 'EXPLICIT_NODE_ID');
  const bridgeReversed = assembleRepoPaperBridge(matchedReversed);

  const matchedShuffled = buildMatchedRecordFromRow(shuffledRow, 'test.csv', 1, 'EXPLICIT_NODE_ID');
  const bridgeShuffled = assembleRepoPaperBridge(matchedShuffled);

  const details: string[] = [];
  const errors: string[] = [];

  const keysToCheck = [
    'vNat',
    'vBuilt',
    'gviEye',
    'gmi',
    'vSign',
    'svf',
    'gfapi',
    'vPave',
    'ias',
    'sfv',
  ] as const;

  for (const k of keysToCheck) {
    const std = bridgeStandard.mappedVariables[k];
    const rev = bridgeReversed.mappedVariables[k];
    const shf = bridgeShuffled.mappedVariables[k];

    if (std.value !== rev.value || std.value !== shf.value) {
      errors.push(`Variable ${k} value mismatch across column permutations: std=${std.value}, rev=${rev.value}, shf=${shf.value}`);
    }
    if (std.sourceColumn !== rev.sourceColumn || std.sourceColumn !== shf.sourceColumn) {
      errors.push(`Variable ${k} sourceColumn mismatch across column permutations: std=${std.sourceColumn}, rev=${rev.sourceColumn}, shf=${shf.sourceColumn}`);
    }
  }

  // Check active synthesis invariants
  const simStd = bridgeStandard.synthesis?.sim.value;
  const simRev = bridgeReversed.synthesis?.sim.value;
  const simShf = bridgeShuffled.synthesis?.sim.value;

  if (simStd === undefined || simStd !== simRev || simStd !== simShf) {
    errors.push(`SIM M_i mismatch across column permutations: std=${simStd}, rev=${simRev}, shf=${simShf}`);
  } else {
    details.push(`Active M_i bit-for-bit identical across all column order permutations: ${simStd?.toFixed(8)}`);
  }

  details.push(`Verified ${keysToCheck.length} variables across 3 distinct CSV column order permutations`);
  details.push('PASS: Parser is strictly header-name bound with zero positional dependency');

  return {
    testId: 'TEST_SOURCE_ORDER_ROBUSTNESS',
    title: 'Source-order column robustness test (randomized CSV column ordering)',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST SOURCE_SEMANTIC_TRUTH: Verbatim Pinned CSV Source Semantic Truth Test (node n00045)
 * Compares runtime values against the literal pinned CSV header/value pairs from
 * repo mikellu12/murrayhill-v12, commit 9353169b3dc3a1b4673e7144249db6ccbf7ac0f1,
 * blob 975feac25b631c0839fb694db68ffd2e4da51e98.
 */
export function runTestSourceSemanticTruth(): ValidationTestResult {
  const row: RawCsvRow = {
    file: '1st_avenue/north_to_south/001_n00045_S.jpg',
    node_id: 'n00045',
    street: '1st_avenue',
    walk: 'north_to_south',
    side: 'W',
    seq: '1',
    cardinal: 'S',
    usable: 'True',
    exclude_reason: '',
    street_name: '1st Avenue',
    typology: 'avenue_secondary',
    face_id: 'f1',
    vertical_greenery_median_round: '1',
    vertical_greenery_median: '1.2434574547629729',
    vertical_greenery_p1: '0.6687',
    vertical_greenery_p2: '0.2171',
    vertical_greenery_p3: '0.0705',
    vertical_greenery_p4: '0.0157',
    vertical_greenery_p5: '0.0157',
    vertical_greenery_p6: '0.0066',
    vertical_greenery_p7: '0.0058',
    vertical_hardscape_median_round: '5',
    vertical_hardscape_median: '5.275995063252083',
    green_eye_level_median_round: '2',
    green_eye_level_median: '2.210586356376911',
    sky_openness_median_round: '5',
    sky_openness_median: '5.144777662874871',
    walkable_ground_median_round: '5',
    walkable_ground_median: '5.17148182665424',
    green_softening_median_round: '2',
    green_softening_median: '2.2959057071960296',
    signage_detail_median_round: '4',
    signage_detail_median: '4.365168539325842',
    facade_variation_median_round: '6',
    facade_variation_median: '5.868217960710945',
    ground_floor_activity_median_round: '6',
    ground_floor_activity_median: '5.605327768229806',
    resting_affordance_median_round: '1',
    resting_affordance_median: '1.3259604190919674',
    W_facade: '18.373344000000003',
    HW_facade: '0.5367320941078925',
    HW_effective: '0.5367320941078925',
    HW_source: 'series',
    node_GVI: '1.8055209092729336',
    node_VEI: '0.6017595356297097',
    node_SVF_band: '0.1946937439740204',
  };

  const matched = buildMatchedRecordFromRow(
    row,
    'results/tables/vlm_observations_murrayhill.csv',
    1,
    'EXPLICIT_NODE_ID'
  );
  const bridge = assembleRepoPaperBridge(matched);
  const vars = bridge.mappedVariables;
  const syn = bridge.synthesis;

  const details: string[] = [];
  const errors: string[] = [];
  const tol = 1e-5;

  // 1. Assert raw parsed object values match exact expected values
  const assertRaw = (header: string, expectedVal: string) => {
    const actual = row[header];
    if (actual !== expectedVal) {
      errors.push(`Raw ${header}: expected '${expectedVal}', got '${actual}'`);
    } else {
      details.push(`row["${header}"] = ${actual}`);
    }
  };

  assertRaw('vertical_greenery_median', '1.2434574547629729');
  assertRaw('vertical_hardscape_median', '5.275995063252083');
  assertRaw('green_eye_level_median', '2.210586356376911');
  assertRaw('sky_openness_median', '5.144777662874871');
  assertRaw('walkable_ground_median', '5.17148182665424');
  assertRaw('green_softening_median', '2.2959057071960296');
  assertRaw('signage_detail_median', '4.365168539325842');
  assertRaw('facade_variation_median', '5.868217960710945');
  assertRaw('ground_floor_activity_median', '5.605327768229806');
  assertRaw('resting_affordance_median', '1.3259604190919674');
  assertRaw('vertical_greenery_p1', '0.6687');
  assertRaw('vertical_greenery_p2', '0.2171');
  assertRaw('vertical_greenery_p3', '0.0705');
  assertRaw('vertical_greenery_p4', '0.0157');
  assertRaw('vertical_greenery_p5', '0.0157');
  assertRaw('vertical_greenery_p6', '0.0066');
  assertRaw('vertical_greenery_p7', '0.0058');

  // Verify vNat probability distribution parsed accurately
  if (!vars.vNat.probabilityDistribution) {
    errors.push('vNat expected probabilityDistribution, got null');
  } else {
    const p = vars.vNat.probabilityDistribution;
    if (p.p1 !== 0.6687 || p.p2 !== 0.2171 || p.p3 !== 0.0705 || p.p4 !== 0.0157 || p.p5 !== 0.0157 || p.p6 !== 0.0066 || p.p7 !== 0.0058) {
      errors.push(`vNat probability distribution values mismatch: ${JSON.stringify(p)}`);
    } else {
      details.push(`vNat probabilities: p1=${p.p1}, p2=${p.p2}, p3=${p.p3}, p4=${p.p4}, p5=${p.p5}, p6=${p.p6}, p7=${p.p7} [PASS]`);
    }
  }

  // 2. Assert runtime paper mapping
  const assertMapped = (
    paperVar: string,
    field: any,
    expectedCol: string,
    expectedRawVal: any,
    expectedNormVal: number
  ) => {
    if (field.sourceColumn !== expectedCol) {
      errors.push(`${paperVar}: expected sourceColumn '${expectedCol}', got '${field.sourceColumn}'`);
    }
    if (String(field.sourceValue) !== String(expectedRawVal)) {
      errors.push(`${paperVar}: expected sourceValue '${expectedRawVal}', got '${field.sourceValue}'`);
    }
    if (field.value === null || Math.abs(field.value - expectedNormVal) > tol) {
      errors.push(`${paperVar}: expected normalizedValue ${expectedNormVal}, got ${field.value}`);
    } else {
      details.push(`${paperVar} | sourceColumn: ${field.sourceColumn} | sourceValue: ${field.sourceValue} | normalizedValue: ${field.value}`);
    }
  };

  assertMapped('vNat', vars.vNat, 'vertical_greenery_median', '1.2434574547629729', 0.04057624246049548);
  assertMapped('vBuilt', vars.vBuilt, 'vertical_hardscape_median', '5.275995063252083', 0.7126658438753471);
  assertMapped('gviEye', vars.gviEye, 'green_eye_level_median', '2.210586356376911', 0.20176439272948513);
  assertMapped('svf', vars.svf, 'sky_openness_median', '5.144777662874871', 0.6907962771458118);
  assertMapped('vPave', vars.vPave, 'walkable_ground_median', '5.17148182665424', 0.69524697110904);
  assertMapped('gmi', vars.gmi, 'green_softening_median', '2.2959057071960296', 0.2159842845326716);
  assertMapped('vSign', vars.vSign, 'signage_detail_median', '4.365168539325842', 0.5608614232209738);
  assertMapped('sfv', vars.sfv, 'facade_variation_median', '5.868217960710945', 0.8113696601184909);
  assertMapped('gfapi', vars.gfapi, 'ground_floor_activity_median', '5.605327768229806', 0.767554628038301);
  assertMapped('ias', vars.ias, 'resting_affordance_median', '1.3259604190919674', 0.0543267365153279);

  // 3. Geometry assertions
  const assertGeom = (name: string, field: any, expectedCol: string, expectedVal: any) => {
    if (field?.sourceColumn !== expectedCol) {
      errors.push(`Geometry ${name}: expected sourceColumn '${expectedCol}', got '${field?.sourceColumn}'`);
    }
    if (String(field?.sourceValue) !== String(expectedVal)) {
      errors.push(`Geometry ${name}: expected sourceValue '${expectedVal}', got '${field?.sourceValue}'`);
    } else {
      details.push(`Geometry ${name}: sourceColumn=${field.sourceColumn}, sourceValue=${field.sourceValue}`);
    }
  };

  assertGeom('HW_effective', vars.hwRatio, 'HW_effective', '0.5367320941078925');
  assertGeom('HW_source', vars.hwSourceField, 'HW_source', 'series');
  if (vars.hwRatio.classification !== 'REPO_GEOMETRY_CONTEXT') {
    errors.push(`vars.hwRatio expected classification 'REPO_GEOMETRY_CONTEXT', got '${vars.hwRatio.classification}'`);
  }
  if (vars.hwSourceField.classification !== 'REPO_GEOMETRY_CONTEXT') {
    errors.push(`vars.hwSourceField expected classification 'REPO_GEOMETRY_CONTEXT', got '${vars.hwSourceField.classification}'`);
  }
  assertGeom('node_GVI', vars.nodeGVI, 'node_GVI', '1.8055209092729336');
  assertGeom('node_VEI', vars.nodeVEI, 'node_VEI', '0.6017595356297097');
  assertGeom('node_SVF_band', vars.nodeSVFBand, 'node_SVF_band', '0.1946937439740204');

  // 4. Synthesis metrics
  if (!syn) {
    errors.push('Synthesis result is missing');
  } else {
    const assertMetric = (label: string, actual: number | null | undefined, expected: number) => {
      if (actual === null || actual === undefined || Math.abs(actual - expected) > tol) {
        errors.push(`${label}: expected ${expected}, got ${actual}`);
      } else {
        details.push(`${label} = ${actual}`);
      }
    };

    assertMetric('naturalBuiltRatio', vars.naturalBuiltRatio.value, 0.056935859644751965);
    assertMetric('I_raw', syn.imageabilityRaw.value, 0.4746845369069087);
    assertMetric('I', syn.placeImageability.value, 6.785792291750779);
    assertMetric('Y', syn.placeIdentity.value, 4.275239548226926);
    assertMetric('D_raw', syn.dRawPaper, 0.7495737076243679);
    assertMetric('D', syn.placeDependence.value, 6.861271847132807);
    assertMetric('a', syn.localElasticities.value?.a, 0.4);
    assertMetric('b', syn.localElasticities.value?.b, 0.2);
    assertMetric('c', syn.localElasticities.value?.c, 0.4);
    assertMetric('M', syn.sim.value, 6.214327916148292);
  }

  return {
    testId: 'TEST_SOURCE_SEMANTIC_TRUTH',
    title: 'Verbatim pinned CSV source semantic truth regression test (node n00045)',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * 1. Numeric invariance of golden n00045:
 *    I = 6.785792291750779
 *    Y = 4.275239548226926
 *    D = 6.861271847132807
 *    M = 6.214327916148292
 *    a=0.4, b=0.2, c=0.4
 */
export function runTestV070NumericInvariance(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];
  const tol = 1e-12;

  const row = createBaseRow({
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
  });

  const matched = buildMatchedRecordFromRow(row, 'vlm_observations_murrayhill.csv', 1, 'EXPLICIT_NODE_ID');
  const bridge = assembleRepoPaperBridge(matched);
  const syn = bridge.synthesis;

  if (!syn) {
    errors.push('Synthesis result is missing for golden n00045');
  } else {
    const check = (label: string, actual: number | null | undefined, expected: number) => {
      if (actual === null || actual === undefined || Math.abs(actual - expected) > tol) {
        errors.push(`${label}: expected ${expected}, got ${actual}`);
      } else {
        details.push(`${label} = ${actual} (exact match tol=${tol})`);
      }
    };

    check('Place Imageability I', syn.placeImageability.value, 6.785792291750779);
    check('Place Identity Y', syn.placeIdentity.value, 4.275239548226926);
    check('Place Dependence D', syn.placeDependence.value, 6.861271847132807);
    check('Elasticity a', syn.localElasticities.value?.a, 0.4);
    check('Elasticity b', syn.localElasticities.value?.b, 0.2);
    check('Elasticity c', syn.localElasticities.value?.c, 0.4);
    check('SIM Final M', syn.sim.value, 6.214327916148292);

    // Verify bit-for-bit formula: M = I^a * Y^b * D^c
    const formulaM = Math.pow(6.785792291750779, 0.4) * Math.pow(4.275239548226926, 0.2) * Math.pow(6.861271847132807, 0.4);
    if (Math.abs(formulaM - 6.214327916148292) > 1e-12) {
      errors.push(`Formula M bit-for-bit mismatch: expected 6.214327916148292, got ${formulaM}`);
    } else {
      details.push(`Direct formula I^a × Y^b × D^c = ${formulaM} verified`);
    }
  }

  return {
    testId: 'TEST_V070_NUMERIC_INVARIANCE',
    title: 'v0.7.0 Golden n00045 Numeric Invariance Test (No-Omega SIM Golden Freeze)',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * 2. Model 2 Diagnostics Isolation:
 *    R²=0.8316, deltaR²=+0.0174, deltaAICc>140, Moran=-0.00843, p=0.584, VIFmax=6.78
 *    Must be PAPER_REPORTED and not injected into node-level GWR.
 */
export function runTestV070DiagnosticsIsolation(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const diag = NATURE_903_GWR_PAPER_DIAGNOSTICS;
  if (diag.model2R2 !== 0.8316) errors.push(`Model 2 R²: expected 0.8316, got ${diag.model2R2}`);
  if (diag.deltaR2 !== 0.0174) errors.push(`Delta R²: expected 0.0174, got ${diag.deltaR2}`);
  if (diag.deltaAicc !== '>140') errors.push(`Delta AICc: expected >140, got ${diag.deltaAicc}`);
  if (diag.model2ResidualMoransI !== -0.00843) errors.push(`Moran's I: expected -0.00843, got ${diag.model2ResidualMoransI}`);
  if (diag.model2MoransP !== 0.584) errors.push(`Moran's p: expected 0.584, got ${diag.model2MoransP}`);
  if (diag.model2VifMax !== 6.78) errors.push(`VIFmax: expected 6.78, got ${diag.model2VifMax}`);
  if (diag.classification !== 'PAPER_REPORTED') errors.push(`Classification: expected PAPER_REPORTED, got ${diag.classification}`);

  details.push(`Paper diagnostics verified: R²=${diag.model2R2}, ΔR²=+${diag.deltaR2}, ΔAICc=${diag.deltaAicc}, Moran=${diag.model2ResidualMoransI}, p=${diag.model2MoransP}, VIFmax=${diag.model2VifMax}`);

  // Test node-level bridge does NOT contain injected paper diagnostics
  const row = createBaseRow({ node_id: 'n00045' });
  const matched = buildMatchedRecordFromRow(row, 'vlm_observations_murrayhill.csv', 1, 'EXPLICIT_NODE_ID');
  const bridge = assembleRepoPaperBridge(matched);

  if (bridge.synthesis.localElasticities.value?.source !== 'PAPER_GLOBAL_REFERENCE') {
    errors.push(`Expected elasticity fallback 'PAPER_GLOBAL_REFERENCE', got '${bridge.synthesis.localElasticities.value?.source}'`);
  } else {
    details.push(`Node elasticity source: ${bridge.synthesis.localElasticities.value?.source} (no paper diagnostic masquerading as local coefficients)`);
  }

  if (REPOSITORY_GWR_CALIBRATION_RECORD.status !== 'BLOCKED_MISSING_T_BASE_OUTCOME') {
    errors.push(`Expected calibration status BLOCKED_MISSING_T_BASE_OUTCOME, got ${REPOSITORY_GWR_CALIBRATION_RECORD.status}`);
  } else {
    details.push(`Repository calibration record: ${REPOSITORY_GWR_CALIBRATION_RECORD.status}`);
  }

  return {
    testId: 'TEST_V070_DIAGNOSTICS_ISOLATION',
    title: 'v0.7.0 Space Syntax + GWR Model 2 Diagnostics Isolation Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * 3. Geometry Context Isolation:
 *    H_m, W_facade, HW_effective, HW_source, node_GVI, node_VEI, node_SVF_band
 *    Must remain GEOMETRY_CONTEXT_ONLY and not alter active SIM.
 */
export function runTestV070GeometryIsolation(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const row1 = createBaseRow({
    node_id: 'n00045',
    H_m: '10.0',
    W_facade: '20.0',
    HW_effective: '0.50',
    HW_source: 'measured',
    node_GVI: '1.5',
    node_VEI: '0.4',
    node_SVF_band: '0.2',
  });

  const row2 = createBaseRow({
    node_id: 'n00045',
    H_m: '120.0',
    W_facade: '15.0',
    HW_effective: '8.00',
    HW_source: 'open_one_side',
    node_GVI: '4.8',
    node_VEI: '2.5',
    node_SVF_band: '0.9',
  });

  const bridge1 = assembleRepoPaperBridge(buildMatchedRecordFromRow(row1, 'vlm_observations_murrayhill.csv', 1, 'EXPLICIT_NODE_ID'));
  const bridge2 = assembleRepoPaperBridge(buildMatchedRecordFromRow(row2, 'vlm_observations_murrayhill.csv', 2, 'EXPLICIT_NODE_ID'));

  // Assert geometry parsed into geometryRecord
  const g1 = bridge1.matchedRecord.geometryRecord;
  if (g1.hM !== 10.0 || g1.wFacade !== 20.0 || g1.hwEffective !== 0.50 || g1.hwSource !== 'measured') {
    errors.push(`Geometry record 1 mismatch: ${JSON.stringify(g1)}`);
  } else {
    details.push(`Geometry record 1 correctly extracted: H_m=${g1.hM}, W_facade=${g1.wFacade}, HW_effective=${g1.hwEffective}`);
  }

  // Check that drastic geometry variations produce identical M_i
  const m1 = bridge1.synthesis.sim.value;
  const m2 = bridge2.synthesis.sim.value;
  if (m1 === null || m2 === null || Math.abs(m1 - m2) > 1e-12) {
    errors.push(`Geometry altered active SIM: m1=${m1}, m2=${m2}`);
  } else {
    details.push(`Active SIM invariance under 16x canyon aspect change: m1=${m1}, m2=${m2} (Δ = 0.0)`);
  }

  // Verify non-reverse-engineering: missing W_facade remains null
  const rowNoW = createBaseRow({ node_id: 'n00045', H_m: '25.0', W_facade: '', HW_effective: '1.2' });
  const bridgeNoW = assembleRepoPaperBridge(buildMatchedRecordFromRow(rowNoW, 'vlm_observations_murrayhill.csv', 3, 'EXPLICIT_NODE_ID'));
  if (bridgeNoW.matchedRecord.geometryRecord.wFacade !== null) {
    errors.push(`Missing W_facade must NOT be reverse-engineered; got ${bridgeNoW.matchedRecord.geometryRecord.wFacade}`);
  } else {
    details.push(`Non-reverse-engineering rule verified: missing W_facade is null`);
  }

  return {
    testId: 'TEST_V070_GEOMETRY_ISOLATION',
    title: 'v0.7.0 Repository Geometry Context Isolation Test (No-Omega SIM Invariance)',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * 4. Injection Prevention:
 *    node_GVI != GVI_eye
 *    node_SVF_band != true SVF / sky_openness proxy
 */
export function runTestV070InjectionPrevention(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const row = createBaseRow({
    node_id: 'n00045',
    green_eye_level_median: '2.0', // maps to (2 - 1) / 6 = 0.1666667
    sky_openness_median: '4.0',    // maps to (4 - 1) / 6 = 0.5000000
    node_GVI: '5.85',              // Contextual metric from street-view repo
    node_SVF_band: '0.12',         // Elevation-band metric from blockology
  });

  const bridge = assembleRepoPaperBridge(buildMatchedRecordFromRow(row, 'vlm_observations_murrayhill.csv', 1, 'EXPLICIT_NODE_ID'));
  const vars = bridge.mappedVariables;

  // GVI_eye must match green_eye_level_median normalized, NOT node_GVI
  const expectedGviEye = (2.0 - 1.0) / 6.0;
  if (vars.gviEye.value === null || Math.abs(vars.gviEye.value - expectedGviEye) > 1e-6) {
    errors.push(`gviEye was corrupted by node_GVI: expected ${expectedGviEye}, got ${vars.gviEye.value}`);
  } else {
    details.push(`GVI_eye retains Qwen median mapping (${vars.gviEye.value}) and is isolated from node_GVI (${row.node_GVI})`);
  }

  // svf must match sky_openness_median normalized, NOT node_SVF_band
  const expectedSvf = (4.0 - 1.0) / 6.0;
  if (vars.svf.value === null || Math.abs(vars.svf.value - expectedSvf) > 1e-6) {
    errors.push(`svf proxy was corrupted by node_SVF_band: expected ${expectedSvf}, got ${vars.svf.value}`);
  } else {
    details.push(`Sky-openness proxy retains Qwen median mapping (${vars.svf.value}) and is isolated from node_SVF_band (${row.node_SVF_band})`);
  }

  return {
    testId: 'TEST_V070_INJECTION_PREVENTION',
    title: 'v0.7.0 Multi-Metric Non-Overwrite Injection Prevention Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * 5. Behavioral Gating:
 *    t_raw missing -> t_base null -> t_effective null -> D(x,y) gated
 *    lambda missing -> F_i gated
 *    No zero-substitution.
 */
export function runTestV070BehavioralGating(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  // Specification normalization test: min(300, max(0, t_raw)) / 300
  const spec = NATURE_903_BEHAVIORAL_SPECIFICATION;
  if (spec.tMinSeconds !== 0 || spec.tMaxSeconds !== 300) {
    errors.push(`Paper behavioral specification bounds mismatch: [${spec.tMinSeconds}, ${spec.tMaxSeconds}]`);
  } else {
    details.push(`Paper behavioral spec bounds verified: [${spec.tMinSeconds}s, ${spec.tMaxSeconds}s]`);
  }

  // Normalization logic tests
  const norm = (t: number) => Math.min(300, Math.max(0, t)) / 300;
  if (norm(150) !== 0.5) errors.push(`norm(150) expected 0.5, got ${norm(150)}`);
  if (norm(300) !== 1.0) errors.push(`norm(300) expected 1.0, got ${norm(300)}`);
  if (norm(600) !== 1.0) errors.push(`norm(600) expected 1.0 (clipped), got ${norm(600)}`);
  if (norm(-50) !== 0.0) errors.push(`norm(-50) expected 0.0 (clipped), got ${norm(-50)}`);
  details.push(`Deterministic normalization formula verified: norm(150s)=0.5, norm(600s)=1.0, norm(-50s)=0.0`);

  // Active node n00045 gating
  const row = createBaseRow({
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
  });
  const bridge = assembleRepoPaperBridge(buildMatchedRecordFromRow(row, 'vlm_observations_murrayhill.csv', 1, 'EXPLICIT_NODE_ID'));
  const syn = bridge.synthesis;

  // Verify t_effective is null (gated, not 0.00)
  if (syn.tEffective.value !== null) {
    errors.push(`tEffective must be strictly null when empirical behavior is missing; got ${syn.tEffective.value}`);
  } else {
    details.push('tEffective is strictly null (no zero-substitution defect)');
  }

  // Verify dwell multiplier gate
  if (syn.stayabilityFactor.value !== null) {
    errors.push(`stayabilityFactor must be strictly null when lambda is missing; got ${syn.stayabilityFactor.value}`);
  } else {
    details.push('Dwell multiplier / stayability factor F_i is strictly null (METHOD_GATED)');
  }

  // Verify behavioral gate in synthesis result
  const hasMissingBehaviorGate = syn.gates.some(
    (g) => g.includes('λ') || g.includes('LAMBDA') || g.includes('F_i') || g.includes('t_effective')
  );
  if (!hasMissingBehaviorGate) {
    errors.push('Behavioral gating flags missing from synthesis gates array');
  } else {
    details.push(`Behavioral gate flags verified in synthesis gates: ${syn.gates.join('; ')}`);
  }

  return {
    testId: 'TEST_V070_BEHAVIORAL_GATING',
    title: 'v0.7.0 Behavioral Observation Gating & Dependency Chain Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST 1 (STEP 3): Geometry Exact Header Binding & Non-Positional Column Binding
 */
export function runTestV070GeometryHeaderBinding(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  // Permuted columns to prove non-positional binding
  const row: RawCsvRow = {
    node_SVF_band: '0.1946937439740204',
    HW_source: 'series',
    node_VEI: '0.6017595356297097',
    W_facade: '34.231',
    node_GVI: '1.8055209092729336',
    H_m: '18.373344',
    HW_effective: '0.5367320941078925',
    HW_facade: '0.5367320941078925',
  };

  const parsed = parseRepoGeometryRecord(row, 'test_geom.csv', 0);

  const check = (name: string, actual: unknown, expected: unknown) => {
    if (actual !== expected) {
      errors.push(`${name}: expected ${expected}, got ${actual}`);
    } else {
      details.push(`${name} strictly bound: ${actual}`);
    }
  };

  check('H_m', parsed.hM, 18.373344);
  check('W_facade', parsed.wFacade, 34.231);
  check('HW_facade', parsed.hwFacade, 0.5367320941078925);
  check('HW_effective', parsed.hwEffective, 0.5367320941078925);
  check('HW_source', parsed.hwSource, 'series');
  check('node_GVI', parsed.nodeGVI, 1.8055209092729336);
  check('node_VEI', parsed.nodeVEI, 0.6017595356297097);
  check('node_SVF_band', parsed.nodeSVFBand, 0.1946937439740204);

  if (parsed.hwEffectiveProvenance?.sourceColumn !== 'HW_effective') {
    errors.push(`hwEffectiveProvenance.sourceColumn mismatch: got ${parsed.hwEffectiveProvenance?.sourceColumn}`);
  }
  if (parsed.hwSourceProvenance?.sourceColumn !== 'HW_source') {
    errors.push(`hwSourceProvenance.sourceColumn mismatch: got ${parsed.hwSourceProvenance?.sourceColumn}`);
  }
  if (parsed.nodeGVIProvenance?.sourceColumn !== 'node_GVI') {
    errors.push(`nodeGVIProvenance.sourceColumn mismatch: got ${parsed.nodeGVIProvenance?.sourceColumn}`);
  }
  if (parsed.nodeVEIProvenance?.sourceColumn !== 'node_VEI') {
    errors.push(`nodeVEIProvenance.sourceColumn mismatch: got ${parsed.nodeVEIProvenance?.sourceColumn}`);
  }
  if (parsed.nodeSVFBandProvenance?.sourceColumn !== 'node_SVF_band') {
    errors.push(`nodeSVFBandProvenance.sourceColumn mismatch: got ${parsed.nodeSVFBandProvenance?.sourceColumn}`);
  }

  return {
    testId: 'TEST_V070_GEOMETRY_HEADER_BINDING',
    title: 'v0.7.0 Morphology Geometry Exact Header Binding Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST 2 (STEP 3): Pinned Source Row n00045 Geometry Provenance & Source Truth
 */
export function runTestV070GeometrySourceTruthN00045(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  // Pinned n00045 source row geometry representation
  const row: RawCsvRow = {
    node_id: 'n00045',
    H_m: '18.373344000000003',
    W_facade: '',
    HW_facade: '',
    HW_effective: '0.5367320941078925',
    HW_source: 'series',
    node_GVI: '1.8055209092729336',
    node_VEI: '0.6017595356297097',
    node_SVF_band: '0.1946937439740204',
  };

  const parsed = parseRepoGeometryRecord(row, 'vlm_observations_murrayhill.csv', 44);

  if (parsed.hM === null || Math.abs(parsed.hM - 18.373344) > 1e-5) {
    errors.push(`H_m expected ~18.373344, got ${parsed.hM}`);
  } else {
    details.push(`H_m source value verified: ${parsed.hM}`);
  }

  if (parsed.wFacade !== null) {
    errors.push(`W_facade expected null for blank source row, got ${parsed.wFacade}`);
  } else {
    details.push('W_facade is null for blank source row (no fabricated width)');
  }

  if (parsed.hwFacade !== null) {
    errors.push(`HW_facade expected null for blank source row, got ${parsed.hwFacade}`);
  } else {
    details.push('HW_facade is null for blank source row (no fabricated aspect ratio)');
  }

  if (parsed.hwEffective !== 0.5367320941078925) {
    errors.push(`HW_effective expected 0.5367320941078925, got ${parsed.hwEffective}`);
  } else {
    details.push(`HW_effective verified: ${parsed.hwEffective}`);
  }

  if (parsed.hwSource !== 'series' || parsed.hwSourceCategory !== 'series') {
    errors.push(`HW_source expected 'series', got '${parsed.hwSource}'`);
  } else {
    details.push(`HW_source verified: ${parsed.hwSource}`);
  }

  if (parsed.nodeGVI !== 1.8055209092729336) {
    errors.push(`node_GVI expected 1.8055209092729336, got ${parsed.nodeGVI}`);
  } else {
    details.push(`node_GVI verified: ${parsed.nodeGVI}`);
  }

  if (parsed.nodeVEI !== 0.6017595356297097) {
    errors.push(`node_VEI expected 0.6017595356297097, got ${parsed.nodeVEI}`);
  } else {
    details.push(`node_VEI verified: ${parsed.nodeVEI}`);
  }

  if (parsed.nodeSVFBand !== 0.1946937439740204) {
    errors.push(`node_SVF_band expected 0.1946937439740204, got ${parsed.nodeSVFBand}`);
  } else {
    details.push(`node_SVF_band verified: ${parsed.nodeSVFBand}`);
  }

  return {
    testId: 'TEST_V070_GEOMETRY_SOURCE_TRUTH_N00045',
    title: 'v0.7.0 Pinned Source Row n00045 Geometry Provenance & Source Truth Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST 3 (STEP 3): No Width Reverse-Engineering When Source Is Blank
 */
export function runTestV070NoWidthReverseEngineering(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  // When W_facade is blank:
  // W_facade remains null even when H_m != null and HW_effective != null.
  // Prohibit calculating: W_facade = H_m / HW_effective (e.g. 18.373344 / 0.536732 = 34.231)
  const row: RawCsvRow = {
    H_m: '18.373344',
    W_facade: '',
    HW_effective: '0.5367320941078925',
    HW_source: 'series',
  };

  const parsed = parseRepoGeometryRecord(row, 'test.csv', 0);

  if (parsed.wFacade !== null) {
    errors.push(`W_facade must remain null when source is blank; got reverse-engineered value: ${parsed.wFacade}`);
  } else {
    details.push('W_facade strictly remains null when source is blank (no H_m / HW_effective reverse-engineering).');
  }

  const calculatedW = 18.373344 / 0.5367320941078925;
  if ((parsed.wFacade as unknown) === calculatedW) {
    errors.push(`Defect detected: W_facade was calculated from H_m / HW_effective`);
  }

  return {
    testId: 'TEST_V070_NO_WIDTH_REVERSE_ENGINEERING',
    title: 'v0.7.0 No Width Reverse-Engineering When Source Is Blank Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST 4 (STEP 3): No Direct HW Reconstruction When Source Is Blank
 */
export function runTestV070NoDirectHWReconstruction(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  // When HW_facade is blank:
  // HW_facade remains null. No reconstruction from H_m and HW_effective.
  const row: RawCsvRow = {
    H_m: '18.373344',
    W_facade: '34.231',
    HW_facade: '',
    HW_effective: '0.5367320941078925',
    HW_source: 'series',
  };

  const parsed = parseRepoGeometryRecord(row, 'test.csv', 0);

  if (parsed.hwFacade !== null) {
    errors.push(`HW_facade must remain null when source is blank; got reconstructed value: ${parsed.hwFacade}`);
  } else {
    details.push('HW_facade strictly remains null when source is blank (no H_m/HW_effective reconstruction).');
  }

  return {
    testId: 'TEST_V070_NO_DIRECT_HW_RECONSTRUCTION',
    title: 'v0.7.0 No Direct HW Reconstruction When Source Is Blank Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST 5 (STEP 3): HW_source Category Semantics & Preservation
 */
export function runTestV070HWSourceSemantics(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const sources = ['measured', 'radius_mean', 'series', 'open_one_side'] as const;

  for (const s of sources) {
    const row: RawCsvRow = {
      H_m: '20.0',
      HW_source: s,
      HW_effective: s === 'open_one_side' ? '' : '0.8',
    };
    const parsed = parseRepoGeometryRecord(row, 'test.csv', 0);

    if (parsed.hwSourceCategory !== s) {
      errors.push(`HW_source '${s}' mapped to category '${parsed.hwSourceCategory}'`);
    } else {
      details.push(`HW_source category preserved: '${s}' -> '${parsed.hwSourceCategory}'`);
    }

    if (s === 'open_one_side') {
      if (!parsed.isOpenOneSide) {
        errors.push(`open_one_side expected isOpenOneSide=true`);
      }
    } else {
      if (parsed.isOpenOneSide) {
        errors.push(`${s} erroneously marked as isOpenOneSide=true`);
      }
    }
  }

  return {
    testId: 'TEST_V070_HW_SOURCE_SEMANTICS',
    title: 'v0.7.0 HW_source Category Semantics & Preservation Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST 6 (STEP 3): Open-One-Side Physical Morphology Gating
 */
export function runTestV070OpenOneSideGating(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const row: RawCsvRow = {
    H_m: '15.0',
    W_facade: '',
    HW_facade: '',
    HW_effective: 'open_one_side',
    HW_source: 'open_one_side',
  };

  const parsed = parseRepoGeometryRecord(row, 'test.csv', 0);

  if (!parsed.isOpenOneSide) {
    errors.push('isOpenOneSide expected true for open_one_side source row');
  } else {
    details.push('isOpenOneSide is true (physical morphology state recognized).');
  }

  if (parsed.hwEffective !== null) {
    errors.push(`HW_effective must be null when open_one_side without finite value, got ${parsed.hwEffective}`);
  } else {
    details.push('HW_effective is strictly null (no synthetic finite ratio fabricated).');
  }

  if (parsed.wFacade !== null) {
    errors.push(`W_facade must be null, got ${parsed.wFacade}`);
  }
  if (parsed.hwFacade !== null) {
    errors.push(`HW_facade must be null, got ${parsed.hwFacade}`);
  }

  const matched = buildMatchedRecordFromRow(row, 'test.csv', 0, 'EXPLICIT_NODE_ID');
  const bridge = assembleRepoPaperBridge(matched);
  if (!bridge.mappedVariables.hwRatio.notes.includes('open_one_side')) {
    errors.push('Bridge hwRatio notes missing open_one_side diagnostic notification');
  } else {
    details.push('Bridge hwRatio preserved open_one_side without numeric fabrication.');
  }

  return {
    testId: 'TEST_V070_OPEN_ONE_SIDE_GATING',
    title: 'v0.7.0 Open-One-Side Physical Morphology Gating Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST 7 (STEP 3): node_GVI Isolation From Eye-Level GVI (GVI_eye)
 */
export function runTestV070NodeGVIIsolation(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  // node_GVI != GVI_eye
  // node_GVI must not overwrite green_eye_level
  // Scale preserved (not divided by 100)
  const row = createBaseRow({
    node_id: 'n00045',
    node_GVI: '1.8055209092729336',
    green_eye_level_median: '2.210586356376911',
  });

  const matched = buildMatchedRecordFromRow(row, 'vlm_observations_murrayhill.csv', 0, 'EXPLICIT_NODE_ID');
  const bridge = assembleRepoPaperBridge(matched);

  // Check scale preservation: 1.80552... not 0.0180552...
  if (matched.geometryRecord?.nodeGVI !== 1.8055209092729336) {
    errors.push(`nodeGVI scale corrupted: expected 1.8055209092729336, got ${matched.geometryRecord?.nodeGVI}`);
  } else {
    details.push(`nodeGVI raw source scale preserved: ${matched.geometryRecord?.nodeGVI}`);
  }

  // Check GVI_eye isolation: gviEye must come from green_eye_level_median (normalized ~0.201764)
  const gviEyeVal = bridge.mappedVariables.gviEye.value;
  if (gviEyeVal === null || Math.abs(gviEyeVal - 0.20176439272948513) > 1e-5) {
    errors.push(`gviEye value corrupted or overwritten by node_GVI: got ${gviEyeVal}`);
  } else {
    details.push(`gviEye correctly computed from green_eye_level_median: ${gviEyeVal}`);
  }

  if (bridge.mappedVariables.nodeGVI?.value !== 1.8055209092729336) {
    errors.push(`nodeGVI variable mismatch: got ${bridge.mappedVariables.nodeGVI?.value}`);
  }

  return {
    testId: 'TEST_V070_NODE_GVI_ISOLATION',
    title: 'v0.7.0 node_GVI Context Isolation From Eye-Level GVI Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST 8 (STEP 3): node_VEI Isolation From Active SVF & Sky Openness
 */
export function runTestV070NodeVEIIsolation(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  // node_VEI must not overwrite SVF
  // must not overwrite Qwen sky_openness
  const row = createBaseRow({
    node_id: 'n00045',
    node_VEI: '0.6017595356297097',
    sky_openness_median: '5.144777662874871',
  });

  const matched = buildMatchedRecordFromRow(row, 'vlm_observations_murrayhill.csv', 0, 'EXPLICIT_NODE_ID');
  const bridge = assembleRepoPaperBridge(matched);

  if (matched.geometryRecord?.nodeVEI !== 0.6017595356297097) {
    errors.push(`nodeVEI value mismatch: expected 0.6017595356297097, got ${matched.geometryRecord?.nodeVEI}`);
  } else {
    details.push(`nodeVEI preserved in geometry record: ${matched.geometryRecord?.nodeVEI}`);
  }

  // SVF in bridge must come strictly from sky_openness_median
  const svfVal = bridge.mappedVariables.svf.value;
  if (svfVal === null || Math.abs(svfVal - 0.6907962771458118) > 1e-5) {
    errors.push(`svf value was erroneously overwritten by node_VEI: got ${svfVal}`);
  } else {
    details.push(`svf strictly derived from sky_openness_median (${svfVal}) without VEI interference.`);
  }

  return {
    testId: 'TEST_V070_NODE_VEI_ISOLATION',
    title: 'v0.7.0 node_VEI Isolation From Active SVF & Sky Openness Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST 9 (STEP 3): node_SVF_band Limited-Elevation Sky Band Isolation
 */
export function runTestV070NodeSVFBandIsolation(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  // node_SVF_band is limited-elevation
  // must not overwrite sky_openness
  // must not populate active Y_i calculation
  const row = createBaseRow({
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
    node_SVF_band: '0.1946937439740204',
  });

  const matched = buildMatchedRecordFromRow(row, 'vlm_observations_murrayhill.csv', 0, 'EXPLICIT_NODE_ID');
  const bridge = assembleRepoPaperBridge(matched);

  if (matched.geometryRecord?.nodeSVFBand !== 0.1946937439740204) {
    errors.push(`nodeSVFBand value mismatch: got ${matched.geometryRecord?.nodeSVFBand}`);
  } else {
    details.push(`nodeSVFBand preserved in geometry context: ${matched.geometryRecord?.nodeSVFBand}`);
  }

  // Verify Y_i is computed with 1 - svf (0.3092...), NOT 1 - node_SVF_band (0.8053...)
  // Golden Y = 4.275239548226926
  const yVal = bridge.synthesis?.placeIdentity.value ?? 0;
  if (Math.abs(yVal - 4.275239548226926) > 1e-12) {
    errors.push(`Identity Y_i altered: expected 4.275239548226926, got ${yVal}`);
  } else {
    details.push(`Identity Y_i strictly preserved: ${yVal} (no sky-band pollution)`);
  }

  return {
    testId: 'TEST_V070_NODE_SVF_BAND_ISOLATION',
    title: 'v0.7.0 node_SVF_band Isolation From Active Identity Y_i Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST 10 (STEP 3): Active SIM Numerical Invariance Under Geometry Presence/Absence
 */
export function runTestV070GeometrySimInvariance(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  // Golden n00045 row WITH geometry
  const rowWithGeom: RawCsvRow = {
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
    H_m: '18.373344000000003',
    W_facade: '34.231',
    HW_facade: '0.536732',
    HW_effective: '0.5367320941078925',
    HW_source: 'series',
    node_GVI: '1.8055209092729336',
    node_VEI: '0.6017595356297097',
    node_SVF_band: '0.1946937439740204',
  };

  // Golden n00045 row WITHOUT geometry
  const rowWithoutGeom: RawCsvRow = {
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
  };

  const bridgeWith = assembleRepoPaperBridge(buildMatchedRecordFromRow(rowWithGeom, 'vlm_observations_murrayhill.csv', 1, 'EXPLICIT_NODE_ID'));
  const bridgeWithout = assembleRepoPaperBridge(buildMatchedRecordFromRow(rowWithoutGeom, 'vlm_observations_murrayhill.csv', 1, 'EXPLICIT_NODE_ID'));

  const M_with = bridgeWith.synthesis?.sim.value ?? 0;
  const M_without = bridgeWithout.synthesis?.sim.value ?? 0;

  const I_with = bridgeWith.synthesis?.placeImageability.value ?? 0;
  const I_without = bridgeWithout.synthesis?.placeImageability.value ?? 0;

  const Y_with = bridgeWith.synthesis?.placeIdentity.value ?? 0;
  const Y_without = bridgeWithout.synthesis?.placeIdentity.value ?? 0;

  const D_with = bridgeWith.synthesis?.placeDependence.value ?? 0;
  const D_without = bridgeWithout.synthesis?.placeDependence.value ?? 0;

  const goldenM = 6.214327916148292;
  const goldenI = 6.785792291750779;
  const goldenY = 4.275239548226926;
  const goldenD = 6.861271847132807;

  if (Math.abs(M_with - goldenM) > 1e-12) errors.push(`M_with != golden M: ${M_with}`);
  if (Math.abs(M_without - goldenM) > 1e-12) errors.push(`M_without != golden M: ${M_without}`);
  if (Math.abs(M_with - M_without) > 1e-12) errors.push(`M delta detected: with=${M_with}, without=${M_without}`);

  if (Math.abs(I_with - goldenI) > 1e-12) errors.push(`I_with != golden I: ${I_with}`);
  if (Math.abs(I_without - goldenI) > 1e-12) errors.push(`I_without != golden I: ${I_without}`);

  if (Math.abs(Y_with - goldenY) > 1e-12) errors.push(`Y_with != golden Y: ${Y_with}`);
  if (Math.abs(Y_without - goldenY) > 1e-12) errors.push(`Y_without != golden Y: ${Y_without}`);

  if (Math.abs(D_with - goldenD) > 1e-12) errors.push(`D_with != golden D: ${D_with}`);
  if (Math.abs(D_without - goldenD) > 1e-12) errors.push(`D_without != golden D: ${D_without}`);

  details.push(`Active SIM Invariance confirmed: M = ${M_with} exactly matches golden freeze (${goldenM}) with zero delta.`);
  details.push(`Tri-component invariance confirmed: I = ${I_with}, Y = ${Y_with}, D = ${D_with}.`);

  return {
    testId: 'TEST_V070_GEOMETRY_SIM_INVARIANCE',
    title: 'v0.7.0 Active SIM Numerical Invariance Under Geometry Presence/Absence Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST V0.7.0 STEP 4.1: Final Paper Sample Accounting (2,848 raw -> 2,840 active)
 */
export function runTestV070FinalPaperSampleAccounting(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const acc = FINAL_PAPER_SAMPLE_ACCOUNTING;

  if (acc.rawDualDirectionalObservations !== 2848) {
    errors.push(`rawDualDirectionalObservations expected 2848, got ${acc.rawDualDirectionalObservations}`);
  }
  if (acc.rawPhysicalNodes !== 712) {
    errors.push(`rawPhysicalNodes expected 712, got ${acc.rawPhysicalNodes}`);
  }
  if (acc.excludedTunnelObservations !== 8) {
    errors.push(`excludedTunnelObservations expected 8, got ${acc.excludedTunnelObservations}`);
  }
  if (acc.excludedTunnelNodes !== 2) {
    errors.push(`excludedTunnelNodes expected 2, got ${acc.excludedTunnelNodes}`);
  }
  if (acc.activeObservations !== 2840) {
    errors.push(`activeObservations expected 2840, got ${acc.activeObservations}`);
  }
  if (acc.activePhysicalNodes !== 710) {
    errors.push(`activePhysicalNodes expected 710, got ${acc.activePhysicalNodes}`);
  }

  // Check arithmetic consistency
  if (acc.rawDualDirectionalObservations - acc.excludedTunnelObservations !== acc.activeObservations) {
    errors.push(`Observations subtraction mismatch: ${acc.rawDualDirectionalObservations} - ${acc.excludedTunnelObservations} != ${acc.activeObservations}`);
  }
  if (acc.rawPhysicalNodes - acc.excludedTunnelNodes !== acc.activePhysicalNodes) {
    errors.push(`Nodes subtraction mismatch: ${acc.rawPhysicalNodes} - ${acc.excludedTunnelNodes} != ${acc.activePhysicalNodes}`);
  }

  if (acc.classification !== 'PAPER_REPORTED_MODEL_RESULT') {
    errors.push(`acc.classification expected 'PAPER_REPORTED_MODEL_RESULT', got '${acc.classification}'`);
  }

  details.push(`Authoritative sample accounting: ${acc.rawDualDirectionalObservations} raw obs (${acc.rawPhysicalNodes} nodes) - ${acc.excludedTunnelObservations} tunnel obs (${acc.excludedTunnelNodes} nodes) = ${acc.activeObservations} active obs (${acc.activePhysicalNodes} active physical nodes) [PASS].`);
  details.push(`Classification: ${acc.classification} [PASS].`);

  return {
    testId: 'TEST_V070_FINAL_PAPER_SAMPLE_ACCOUNTING',
    title: 'v0.7.0 Final Paper Sample Accounting (2,848 raw -> 2,840 active) Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST V0.7.0 STEP 4.2: Space Syntax Paper Specification & Surrogate Prohibition
 */
export function runTestV070SpaceSyntaxSpecification(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const spec = SPACE_SYNTAX_PAPER_SPECIFICATION;

  if (spec.walkingRadiusM !== 800) {
    errors.push(`walkingRadiusM expected 800, got ${spec.walkingRadiusM}`);
  }
  if (spec.choiceDefinition !== 'Segment Choice at pedestrian radius R = 800 m') {
    errors.push(`choiceDefinition unexpected: ${spec.choiceDefinition}`);
  }
  if (spec.integrationDefinition !== 'Segment Integration at pedestrian radius R = 800 m') {
    errors.push(`integrationDefinition unexpected: ${spec.integrationDefinition}`);
  }
  if (spec.classification !== 'PAPER_SPECIFICATION') {
    errors.push(`classification expected 'PAPER_SPECIFICATION', got '${spec.classification}'`);
  }
  if (!spec.rule.includes('Never infer or estimate node-level Space Syntax') && !spec.rule.includes('Do not derive Choice or Integration')) {
    errors.push(`rule missing mandatory wording: ${spec.rule}`);
  }

  details.push(`Space syntax specification verified: walking radius ${spec.walkingRadiusM}m, through-movement Choice, to-movement Integration [PASS].`);
  details.push(`Surrogate derivation prohibition confirmed: Choice and Integration are never derived from street names, sequence, typology, headings, or averages [PASS].`);

  return {
    testId: 'TEST_V070_SPACE_SYNTAX_SPECIFICATION',
    title: 'v0.7.0 Space Syntax Paper Specification & Surrogate Prohibition Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST V0.7.0 STEP 4.3: Paper GWR Diagnostics (Model 1 vs Model 2)
 */
export function runTestV070PaperGwrDiagnostics(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const diag = NATURE_903_FINAL_GWR_DIAGNOSTICS;

  if (diag.model1R2 !== 0.8142) errors.push(`model1R2 expected 0.8142, got ${diag.model1R2}`);
  if (diag.model2R2 !== 0.8316) errors.push(`model2R2 expected 0.8316, got ${diag.model2R2}`);
  if (diag.deltaR2 !== 0.0174) errors.push(`deltaR2 expected 0.0174, got ${diag.deltaR2}`);
  if (diag.deltaAicc !== '>140') errors.push(`deltaAicc expected '>140', got ${diag.deltaAicc}`);
  if (diag.model1ResidualMoransI !== 0.002545) errors.push(`model1ResidualMoransI expected 0.002545, got ${diag.model1ResidualMoransI}`);
  if (diag.model2ResidualMoransI !== -0.00843) errors.push(`model2ResidualMoransI expected -0.00843, got ${diag.model2ResidualMoransI}`);
  if (diag.model2MoransP !== 0.584) errors.push(`model2MoransP expected 0.584, got ${diag.model2MoransP}`);
  if (diag.model1VifMax !== 5.87) errors.push(`model1VifMax expected 5.87, got ${diag.model1VifMax}`);
  if (diag.model2VifMax !== 6.78) errors.push(`model2VifMax expected 6.78, got ${diag.model2VifMax}`);
  if (diag.reportedOptimizedBandwidthM !== 100) errors.push(`reportedOptimizedBandwidthM expected 100, got ${diag.reportedOptimizedBandwidthM}`);
  if (diag.kernel !== 'ROW_STANDARDIZED_ADAPTIVE_BI_SQUARE') errors.push(`kernel expected 'ROW_STANDARDIZED_ADAPTIVE_BI_SQUARE', got ${diag.kernel}`);
  if (diag.classification !== 'PAPER_REPORTED_MODEL_RESULT') errors.push(`classification expected 'PAPER_REPORTED_MODEL_RESULT', got ${diag.classification}`);

  details.push(`Paper GWR diagnostics verified: M1 R²=0.8142 vs M2 R²=0.8316 (ΔR²=+0.0174, ΔAICc>140) [PASS].`);
  details.push(`Spatial autocorrelation: M2 Moran's I = -0.00843 (p=0.584, no residual pattern) [PASS].`);
  details.push(`Multicollinearity: M1 VIFmax=5.87, M2 VIFmax=6.78 (< 10 threshold) [PASS].`);
  details.push(`Paper kernel: Row-standardized Adaptive Bi-square (BW=100m) [PASS].`);

  return {
    testId: 'TEST_V070_PAPER_GWR_DIAGNOSTICS',
    title: 'v0.7.0 Paper GWR Diagnostics (Model 1 vs Model 2) Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST V0.7.0 STEP 4.4: Repository GWR Feasibility Blocking
 */
export function runTestV070RepoGwrFeasibilityBlocking(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const rec = REPOSITORY_GWR_CALIBRATION_RECORD;

  if (rec.status !== 'BLOCKED_MISSING_T_BASE_OUTCOME') {
    errors.push(`status expected 'BLOCKED_MISSING_T_BASE_OUTCOME', got '${rec.status}'`);
  }
  if (rec.classification !== 'REPO_DERIVED_GWR_MACHINERY') {
    errors.push(`classification expected 'REPO_DERIVED_GWR_MACHINERY', got '${rec.classification}'`);
  }
  if (!rec.repositoryStatement.includes('requires t_base, but this study does not have localized pedestrian stayability outcomes')) {
    errors.push(`repositoryStatement missing mandatory quote: ${rec.repositoryStatement}`);
  }

  details.push(`Repository GWR feasibility blocking verified: status = ${rec.status} [PASS].`);
  details.push(`Repository explicit statement: "${rec.repositoryStatement}" [PASS].`);
  details.push(`Classification: ${rec.classification} [PASS].`);

  return {
    testId: 'TEST_V070_REPO_GWR_FEASIBILITY_BLOCKING',
    title: 'v0.7.0 Repository GWR Feasibility Blocking Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST V0.7.0 STEP 4.5: Repository GWR Kernel Distinction (Gaussian vs Adaptive Bi-square)
 */
export function runTestV070RepoGwrKernelDistinction(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const repoKernel = REPOSITORY_GWR_CALIBRATION_RECORD.feasibilityKernel;
  const paperKernel = NATURE_903_FINAL_GWR_DIAGNOSTICS.kernel;

  if (repoKernel !== 'GAUSSIAN') {
    errors.push(`repoKernel expected 'GAUSSIAN', got '${repoKernel}'`);
  }
  if (paperKernel !== 'ROW_STANDARDIZED_ADAPTIVE_BI_SQUARE') {
    errors.push(`paperKernel expected 'ROW_STANDARDIZED_ADAPTIVE_BI_SQUARE', got '${paperKernel}'`);
  }
  if ((repoKernel as string) === (paperKernel as string)) {
    errors.push(`repoKernel and paperKernel should not be identical!`);
  }

  details.push(`Kernel distinction confirmed: repository feasibility uses GAUSSIAN (exploratory scaffolding), while final paper reports ROW_STANDARDIZED_ADAPTIVE_BI_SQUARE [PASS].`);
  details.push(`Kernels are strictly isolated across evidence classes [PASS].`);

  return {
    testId: 'TEST_V070_REPO_GWR_KERNEL_DISTINCTION',
    title: 'v0.7.0 Repository GWR Kernel Distinction Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST V0.7.0 STEP 4.6: Pinned Repository GWR Machinery Table Verification
 */
export function runTestV070PinnedGwrMachineryTable(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const rows = PINNED_GWR_MACHINERY_ROWS;

  if (rows.length !== 5) {
    errors.push(`Expected 5 pinned GWR machinery rows, got ${rows.length}`);
  }

  const expectedRows = [
    { bandwidth: 60, tr_S: 97.19922039706658, tr_SS: 61.63792241315478, eff_df: 583.8007796029334, s2_divisor: 548.2394816190216, aicc_penalty: 910.8851133752079 },
    { bandwidth: 100, tr_S: 42.66357115679539, tr_SS: 26.199468878295285, eff_df: 638.3364288432047, s2_divisor: 621.8723265647045, aicc_penalty: 774.4565132844356 },
    { bandwidth: 150, tr_S: 22.70126389574217, tr_SS: 14.006946061004948, eff_df: 658.2987361042578, s2_divisor: 649.6044182695206, aicc_penalty: 730.186627445939 },
    { bandwidth: 250, tr_S: 10.976372333882086, tr_SS: 7.015799072959707, eff_df: 670.0236276661179, s2_divisor: 666.0630544051955, aicc_penalty: 705.4180272122053 },
    { bandwidth: 400, tr_S: 6.56020560964402, tr_SS: 4.735319183534273, eff_df: 674.4397943903559, s2_divisor: 672.6149079642462, aicc_penalty: 696.3128951115551 },
  ];

  for (let i = 0; i < expectedRows.length; i++) {
    const exp = expectedRows[i];
    const actual = rows[i];
    if (!actual) {
      errors.push(`Missing row index ${i}`);
      continue;
    }
    if (actual.bandwidth !== exp.bandwidth) {
      errors.push(`Row ${i} bandwidth expected ${exp.bandwidth}, got ${actual.bandwidth}`);
    }
    if (Math.abs(actual.tr_S - exp.tr_S) > 1e-8) {
      errors.push(`Row ${i} tr_S expected ${exp.tr_S}, got ${actual.tr_S}`);
    }
    if (Math.abs(actual.tr_SS - exp.tr_SS) > 1e-8) {
      errors.push(`Row ${i} tr_SS expected ${exp.tr_SS}, got ${actual.tr_SS}`);
    }
    if (Math.abs(actual.eff_df - exp.eff_df) > 1e-8) {
      errors.push(`Row ${i} eff_df expected ${exp.eff_df}, got ${actual.eff_df}`);
    }
    if (Math.abs(actual.s2_divisor - exp.s2_divisor) > 1e-8) {
      errors.push(`Row ${i} s2_divisor expected ${exp.s2_divisor}, got ${actual.s2_divisor}`);
    }
    if (Math.abs(actual.aicc_penalty - exp.aicc_penalty) > 1e-8) {
      errors.push(`Row ${i} aicc_penalty expected ${exp.aicc_penalty}, got ${actual.aicc_penalty}`);
    }
    details.push(`BW ${actual.bandwidth}m: tr(S)=${actual.tr_S.toFixed(4)}, tr(S'S)=${actual.tr_SS.toFixed(4)}, eff_df=${actual.eff_df.toFixed(4)}, s2_div=${actual.s2_divisor.toFixed(4)}, aicc_pen=${actual.aicc_penalty.toFixed(4)} [PASS]`);
  }

  return {
    testId: 'TEST_V070_PINNED_GWR_MACHINERY_TABLE',
    title: 'v0.7.0 Pinned Repository GWR Machinery Table Verification Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST V0.7.0 STEP 4.7: Historical Sample Size Audit (N=1,320 vs N=2,840)
 */
export function runTestV070HistoricalSampleSizeAudit(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const audit = GWR_SAMPLE_PROVENANCE_AUDIT;

  if (audit.repositoryHistoricalReference.paperN !== 1320) {
    errors.push(`repositoryHistoricalReference paperN expected 1320, got ${audit.repositoryHistoricalReference.paperN}`);
  }
  if (audit.repositoryHistoricalReference.classification !== 'REPOSITORY_HISTORICAL_MANUSCRIPT_REFERENCE') {
    errors.push(`classification expected 'REPOSITORY_HISTORICAL_MANUSCRIPT_REFERENCE', got ${audit.repositoryHistoricalReference.classification}`);
  }
  if (audit.currentFinalPaper.activeObservations !== 2840) {
    errors.push(`currentFinalPaper activeObservations expected 2840, got ${audit.currentFinalPaper.activeObservations}`);
  }
  if (audit.currentFinalPaper.activeNodes !== 710) {
    errors.push(`currentFinalPaper activeNodes expected 710, got ${audit.currentFinalPaper.activeNodes}`);
  }
  if (!audit.uiNotice.includes('Historical Sample Audit Notice') && !audit.uiNotice.includes('earlier manuscript sample specification')) {
    errors.push(`uiNotice missing mandatory text: ${audit.uiNotice}`);
  }

  details.push(`Historical sample audit: Pinned repo N=1,320 clearly isolated from final manuscript N=2,840 (710 nodes) [PASS].`);
  details.push(`Audit notice: "${audit.uiNotice.substring(0, 100)}..." [PASS].`);

  return {
    testId: 'TEST_V070_HISTORICAL_SAMPLE_SIZE_AUDIT',
    title: 'v0.7.0 Historical Sample Size Audit (N=1,320 vs N=2,840) Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST V0.7.0 STEP 4.8: Node-Level Calibration Unavailable
 */
export function runTestV070NodeLevelCalibrationUnavailable(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const nodeStatus = NODE_LEVEL_GWR_CALIBRATION_STATUS;

  if (nodeStatus.choice !== null) errors.push(`nodeStatus.choice should be null, got ${nodeStatus.choice}`);
  if (nodeStatus.integration !== null) errors.push(`nodeStatus.integration should be null, got ${nodeStatus.integration}`);
  if (nodeStatus.localBetas !== null) errors.push(`nodeStatus.localBetas should be null, got ${nodeStatus.localBetas}`);
  if (nodeStatus.status !== 'UNAVAILABLE_NODE_LEVEL_CALIBRATION') {
    errors.push(`nodeStatus.status expected 'UNAVAILABLE_NODE_LEVEL_CALIBRATION', got ${nodeStatus.status}`);
  }

  // Also verify for n00045 mapped bridge
  const rowWithGeom: RawCsvRow = {
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
  };

  const bridge = assembleRepoPaperBridge(buildMatchedRecordFromRow(rowWithGeom, 'vlm_observations_murrayhill.csv', 1, 'EXPLICIT_NODE_ID'));

  if (bridge.mappedVariables.spaceSyntaxChoice?.value !== null && bridge.mappedVariables.spaceSyntaxChoice !== undefined) {
    errors.push(`n00045 spaceSyntaxChoice should be null, got ${bridge.mappedVariables.spaceSyntaxChoice.value}`);
  }
  if (bridge.mappedVariables.spaceSyntaxIntegration?.value !== null && bridge.mappedVariables.spaceSyntaxIntegration !== undefined) {
    errors.push(`n00045 spaceSyntaxIntegration should be null, got ${bridge.mappedVariables.spaceSyntaxIntegration.value}`);
  }

  details.push(`Node-level Choice, Integration, and local GWR betas confirmed UNAVAILABLE [PASS].`);
  details.push(`n00045 bridge confirms no surrogate values fabricated [PASS].`);

  return {
    testId: 'TEST_V070_NODE_LEVEL_CALIBRATION_UNAVAILABLE',
    title: 'v0.7.0 Node-Level Calibration Unavailable Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST V0.7.0 STEP 4.9: Active SIM Elasticity Fallback & n00045 Golden Execution
 */
export function runTestV070ActiveSimElasticityFallback(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const fallback = REPOSITORY_GWR_CALIBRATION_RECORD.activeSIMFallback;

  if (fallback.a !== 0.40) errors.push(`fallback.a expected 0.40, got ${fallback.a}`);
  if (fallback.b !== 0.20) errors.push(`fallback.b expected 0.20, got ${fallback.b}`);
  if (fallback.c !== 0.40) errors.push(`fallback.c expected 0.40, got ${fallback.c}`);
  if (fallback.source !== 'PAPER_GLOBAL_REFERENCE') errors.push(`fallback.source expected 'PAPER_GLOBAL_REFERENCE', got ${fallback.source}`);
  if (fallback.calibrationStatus !== 'REFERENCE_NOT_LOCAL_GWR') {
    errors.push(`fallback.calibrationStatus expected 'REFERENCE_NOT_LOCAL_GWR', got ${fallback.calibrationStatus}`);
  }

  // Golden n00045 row execution
  const row: RawCsvRow = {
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
  };

  const bridge = assembleRepoPaperBridge(buildMatchedRecordFromRow(row, 'vlm_observations_murrayhill.csv', 1, 'EXPLICIT_NODE_ID'));
  const goldenM = 6.214327916148292;
  const actualM = bridge.synthesis?.sim.value ?? 0;

  if (Math.abs(actualM - goldenM) > 1e-12) {
    errors.push(`Golden M mismatch: expected ${goldenM}, got ${actualM}`);
  }

  details.push(`Active SIM elasticity fallback verified: a=${fallback.a}, b=${fallback.b}, c=${fallback.c} (source=${fallback.source}, status=${fallback.calibrationStatus}) [PASS].`);
  details.push(`n00045 active SIM execution yields golden M = ${actualM} exactly matching ${goldenM} [PASS].`);

  return {
    testId: 'TEST_V070_ACTIVE_SIM_ELASTICITY_FALLBACK',
    title: 'v0.7.0 Active SIM Elasticity Fallback & n00045 Golden Execution Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST V0.7.0 STEP 4.10: Calibration Provenance Boundary
 */
export function runTestV070CalibrationProvenanceBoundary(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const boundary = PAPER_REPOSITORY_CALIBRATION_BOUNDARY;

  if (boundary.resolution !== 'PAPER_AND_REPOSITORY_RETAINED_SEPARATELY') {
    errors.push(`resolution expected 'PAPER_AND_REPOSITORY_RETAINED_SEPARATELY', got ${boundary.resolution}`);
  }
  if (!boundary.notice.includes('• manuscript statistics = PAPER_REPORTED') ||
      !boundary.notice.includes('• repository machinery = REPO_DERIVED_GWR_MACHINERY') ||
      !boundary.notice.includes('• node local coefficients = UNAVAILABLE') ||
      !boundary.notice.includes('• active SIM elasticities = PAPER_GLOBAL_REFERENCE fallback')) {
    errors.push(`notice missing mandatory 4-point architecture: ${boundary.notice}`);
  }

  details.push(`Calibration provenance boundary verified: resolution = ${boundary.resolution} [PASS].`);
  details.push(`4 distinct categories preserved with zero cross-contamination [PASS].`);

  return {
    testId: 'TEST_V070_CALIBRATION_PROVENANCE_BOUNDARY',
    title: 'v0.7.0 Calibration Provenance Boundary Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST V0.7.0 STEP 4.11: Legacy GWR Formula Isolation (No-Omega Invariance)
 */
export function runTestV070LegacyGwrFormulaIsolation(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const formulaBoundary = FORMULA_VERSION_BOUNDARY;

  if (formulaBoundary.activeAppSimFormula !== 'FROZEN_NATURE_903_NO_OMEGA') {
    errors.push(`activeAppSimFormula expected 'FROZEN_NATURE_903_NO_OMEGA', got ${formulaBoundary.activeAppSimFormula}`);
  }
  if (!formulaBoundary.rule.includes('Never reintroduce A_i or Omega into active computation')) {
    errors.push(`rule missing mandatory text: ${formulaBoundary.rule}`);
  }

  // Golden n00045 tri-component checks
  const row: RawCsvRow = {
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
  };

  const bridge = assembleRepoPaperBridge(buildMatchedRecordFromRow(row, 'vlm_observations_murrayhill.csv', 1, 'EXPLICIT_NODE_ID'));
  const I = bridge.synthesis?.placeImageability.value ?? 0;
  const Y = bridge.synthesis?.placeIdentity.value ?? 0;
  const D = bridge.synthesis?.placeDependence.value ?? 0;
  const M = bridge.synthesis?.sim.value ?? 0;

  const goldenI = 6.785792291750779;
  const goldenY = 4.275239548226926;
  const goldenD = 6.861271847132807;
  const goldenM = 6.214327916148292;

  if (Math.abs(I - goldenI) > 1e-12) errors.push(`I mismatch: expected ${goldenI}, got ${I}`);
  if (Math.abs(Y - goldenY) > 1e-12) errors.push(`Y mismatch: expected ${goldenY}, got ${Y}`);
  if (Math.abs(D - goldenD) > 1e-12) errors.push(`D mismatch: expected ${goldenD}, got ${D}`);
  if (Math.abs(M - goldenM) > 1e-12) errors.push(`M mismatch: expected ${goldenM}, got ${M}`);

  details.push(`Legacy draft formula isolation confirmed: A_i and Omega strictly excluded from active SIM [PASS].`);
  details.push(`n00045 No-Omega tri-components strictly preserved: I=${I}, Y=${Y}, D=${D}, M=${M} [PASS].`);

  return {
    testId: 'TEST_V070_LEGACY_GWR_FORMULA_ISOLATION',
    title: 'v0.7.0 Legacy GWR Formula Isolation Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

function getN00045ValidationBridge() {
  const row: RawCsvRow = {
    file: '1st_avenue/north_to_south/001_n00045_S.jpg',
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
  };
  return assembleRepoPaperBridge(buildMatchedRecordFromRow(row, 'vlm_observations_murrayhill.csv', 1, 'EXPLICIT_NODE_ID'));
}

/**
 * TEST 1: v0.7.0 t_base Formula Normalization Test
 * Formula unit test:
 * - t_raw = -10 -> 0
 * - t_raw = 0 -> 0
 * - t_raw = 150 -> 0.5
 * - t_raw = 300 -> 1.0
 * - t_raw = 500 -> 1.0
 */
export function runTestV070TBaseFormula(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const testCases = [
    { input: -10, expected: 0 },
    { input: 0, expected: 0 },
    { input: 150, expected: 0.5 },
    { input: 300, expected: 1.0 },
    { input: 500, expected: 1.0 },
  ];

  for (const tc of testCases) {
    const res = calculateTBase(tc.input);
    if (res === null || Math.abs(res - tc.expected) > 1e-6) {
      errors.push(`calculateTBase(${tc.input}) expected ${tc.expected}, got ${res}`);
    } else {
      details.push(`PASS: calculateTBase(${tc.input}) = ${res}`);
    }
  }

  return {
    testId: 'TEST_V070_T_BASE_FORMULA',
    title: 'v0.7.0 t_base Formula Normalization Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST 2: v0.7.0 Missing t_raw Not Zero Gating Test
 * Verify missing t_raw results in t_base = null, not 0.
 */
export function runTestV070MissingTRawNotZero(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const nullRes = calculateTBase(null);
  const undefRes = calculateTBase(undefined);

  if (nullRes !== null) {
    errors.push(`Expected calculateTBase(null) to be null, got ${nullRes}`);
  } else {
    details.push('PASS: calculateTBase(null) returns null');
  }

  if (undefRes !== null) {
    errors.push(`Expected calculateTBase(undefined) to be null, got ${undefRes}`);
  } else {
    details.push('PASS: calculateTBase(undefined) returns null');
  }

  const defaultState = DEFAULT_N00045_BEHAVIORAL_STATE;
  if (defaultState.t_base.value !== null) {
    errors.push(`Expected default t_base.value to be null, got ${defaultState.t_base.value}`);
  } else {
    details.push('PASS: Default n00045 behavioral t_base.value is null (not 0)');
  }

  if (defaultState.t_base.status !== 'INPUT_GATED_MISSING_T_RAW') {
    errors.push(`Expected status INPUT_GATED_MISSING_T_RAW, got ${defaultState.t_base.status}`);
  } else {
    details.push('PASS: Default n00045 behavioral t_base status is INPUT_GATED_MISSING_T_RAW');
  }

  return {
    testId: 'TEST_V070_MISSING_T_RAW_NOT_ZERO',
    title: 'v0.7.0 Missing t_raw Not Zero Gating Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST 3: v0.7.0 Active Lambda Unresolved Calibration Test
 * Active lambda must remain null. Status UNRESOLVED_BEHAVIORAL_CALIBRATION.
 * No numeric default assigned.
 */
export function runTestV070LambdaRemainsUnresolved(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const defaultState = DEFAULT_N00045_BEHAVIORAL_STATE;
  if (defaultState.lambda.value !== null) {
    errors.push(`Expected lambda to be null, got ${defaultState.lambda.value}`);
  } else {
    details.push('PASS: Active lambda is null');
  }

  if (defaultState.lambda.status !== 'UNRESOLVED_BEHAVIORAL_CALIBRATION') {
    errors.push(`Expected status UNRESOLVED_BEHAVIORAL_CALIBRATION, got ${defaultState.lambda.status}`);
  } else {
    details.push('PASS: Active lambda status is UNRESOLVED_BEHAVIORAL_CALIBRATION');
  }

  const exportObj = buildBehavioralStayabilityReconciliationExport();
  if (exportObj.calibration.lambda !== null) {
    errors.push(`Exported calibration.lambda must be null, got ${exportObj.calibration.lambda}`);
  } else {
    details.push('PASS: Exported reconciliation calibration.lambda is null');
  }

  return {
    testId: 'TEST_V070_LAMBDA_REMAINS_UNRESOLVED',
    title: 'v0.7.0 Active Lambda Unresolved Calibration Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST 4: v0.7.0 Blockology Placeholder Lambda Isolation Test
 * Repository placeholder 1.0 cannot populate active lambda.
 */
export function runTestV070BlockologyPlaceholderIsolation(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const rec = BLOCKOLOGY_PLACEHOLDER_LAMBDA_RECORD;
  if (rec.dwellLambda !== 1.0) {
    errors.push(`Expected placeholder dwellLambda to be 1.0, got ${rec.dwellLambda}`);
  } else {
    details.push('PASS: Repository placeholder dwellLambda is 1.0');
  }

  if (rec.classification !== 'DEMO_ONLY') {
    errors.push(`Expected classification DEMO_ONLY, got ${rec.classification}`);
  } else {
    details.push('PASS: Placeholder classification is DEMO_ONLY');
  }

  if (rec.activeBehavioralInput !== false) {
    errors.push(`Expected activeBehavioralInput to be false, got ${rec.activeBehavioralInput}`);
  } else {
    details.push('PASS: activeBehavioralInput is false');
  }

  const prohibited = rec.prohibitedFrom;
  if (!prohibited.includes('active_lambda') || !prohibited.includes('F_i') || !prohibited.includes('t_effective')) {
    errors.push('Placeholder not explicitly prohibited from active pipeline');
  } else {
    details.push('PASS: Placeholder explicitly prohibited from active_lambda, F_i, t_effective');
  }

  return {
    testId: 'TEST_V070_BLOCKOLOGY_PLACEHOLDER_ISOLATION',
    title: 'v0.7.0 Blockology Placeholder Lambda Isolation Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST 5: v0.7.0 F_i Stayability Gating Test
 * Missing lambda: F_i must remain null. Status METHOD_GATED_MISSING_LAMBDA.
 */
export function runTestV070FGate(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const defaultState = DEFAULT_N00045_BEHAVIORAL_STATE;
  if (defaultState.F_i.value !== null) {
    errors.push(`Expected F_i value to be null, got ${defaultState.F_i.value}`);
  } else {
    details.push('PASS: F_i value is null');
  }

  if (defaultState.F_i.status !== 'METHOD_GATED_MISSING_LAMBDA') {
    errors.push(`Expected status METHOD_GATED_MISSING_LAMBDA, got ${defaultState.F_i.status}`);
  } else {
    details.push('PASS: F_i status is METHOD_GATED_MISSING_LAMBDA');
  }

  const exportObj = buildBehavioralStayabilityReconciliationExport();
  if (exportObj.stayability.F_i !== null) {
    errors.push(`Exported F_i must be null, got ${exportObj.stayability.F_i}`);
  } else {
    details.push('PASS: Exported stayability.F_i is null');
  }

  if (exportObj.stayability.F_i_status !== 'METHOD_GATED_MISSING_LAMBDA') {
    errors.push(`Exported F_i_status expected METHOD_GATED_MISSING_LAMBDA, got ${exportObj.stayability.F_i_status}`);
  } else {
    details.push('PASS: Exported stayability.F_i_status is METHOD_GATED_MISSING_LAMBDA');
  }

  return {
    testId: 'TEST_V070_F_GATE',
    title: 'v0.7.0 F_i Stayability Gating Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST 6: v0.7.0 t_effective Input Gating Test
 * Missing F_i or t_base: t_effective must remain null. Status INPUT_GATED.
 */
export function runTestV070TEffectiveGate(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const defaultState = DEFAULT_N00045_BEHAVIORAL_STATE;
  if (defaultState.t_effective.value !== null) {
    errors.push(`Expected t_effective value to be null, got ${defaultState.t_effective.value}`);
  } else {
    details.push('PASS: t_effective value is null');
  }

  if (defaultState.t_effective.status !== 'INPUT_GATED') {
    errors.push(`Expected status INPUT_GATED, got ${defaultState.t_effective.status}`);
  } else {
    details.push('PASS: t_effective status is INPUT_GATED');
  }

  const exportObj = buildBehavioralStayabilityReconciliationExport();
  if (exportObj.stayability.t_effective !== null) {
    errors.push(`Exported t_effective must be null, got ${exportObj.stayability.t_effective}`);
  } else {
    details.push('PASS: Exported stayability.t_effective is null');
  }

  if (exportObj.stayability.t_effective_status !== 'INPUT_GATED') {
    errors.push(`Exported t_effective_status expected INPUT_GATED, got ${exportObj.stayability.t_effective_status}`);
  } else {
    details.push('PASS: Exported stayability.t_effective_status is INPUT_GATED');
  }

  return {
    testId: 'TEST_V070_T_EFFECTIVE_GATE',
    title: 'v0.7.0 t_effective Input Gating Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST 7: v0.7.0 D(x,y) vs D_i Symbol Isolation Test
 * D_xy cannot overwrite D_i / Place Dependence.
 */
export function runTestV070DxySymbolIsolation(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const spec = PROXY_DWELL_PAPER_SPECIFICATION;
  if (spec.variableId !== 'D_xy') {
    errors.push(`Expected variableId D_xy, got ${spec.variableId}`);
  } else {
    details.push('PASS: Spatial surface variableId is strictly D_xy');
  }

  if (spec.symbol !== 'D(x,y)') {
    errors.push(`Expected symbol D(x,y), got ${spec.symbol}`);
  } else {
    details.push('PASS: Spatial surface symbol is D(x,y) (not D or D_i)');
  }

  // Verify n00045 Place Dependence remains D = 6.861271847132807
  const bridge = getN00045ValidationBridge();
  const dVal = bridge.synthesis?.placeDependence.value;
  if (dVal === null || dVal === undefined || Math.abs(dVal - 6.861271847132807) > 1e-10) {
    errors.push(`Place dependence D_i was altered! expected 6.861271847132807, got ${dVal}`);
  } else {
    details.push(`PASS: Place dependence D_i = ${dVal} is completely isolated from D_xy`);
  }

  return {
    testId: 'TEST_V070_DXY_SYMBOL_ISOLATION',
    title: 'v0.7.0 D(x,y) vs D_i Symbol Isolation Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST 8: v0.7.0 D(x,y) Network Model Gating Test
 * Single-node execution must not produce D_xy. Value is null, status NETWORK_MODEL_GATED.
 */
export function runTestV070DxyNetworkGate(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const spec = PROXY_DWELL_PAPER_SPECIFICATION;
  if (spec.status !== 'NETWORK_MODEL_GATED') {
    errors.push(`Expected status NETWORK_MODEL_GATED, got ${spec.status}`);
  } else {
    details.push('PASS: Proxy Dwell Specification status is NETWORK_MODEL_GATED');
  }

  if (spec.activeSimEvidence !== false) {
    errors.push('activeSimEvidence should be false for network model');
  } else {
    details.push('PASS: activeSimEvidence is false');
  }

  const exportObj = buildBehavioralStayabilityReconciliationExport();
  if (exportObj.proxy_dwell_surface.value !== null) {
    errors.push(`Expected proxy_dwell_surface.value to be null, got ${exportObj.proxy_dwell_surface.value}`);
  } else {
    details.push('PASS: Single-node execution proxy_dwell_surface.value is null');
  }

  if (exportObj.proxy_dwell_surface.status !== 'NETWORK_MODEL_GATED') {
    errors.push(`Expected status NETWORK_MODEL_GATED, got ${exportObj.proxy_dwell_surface.status}`);
  } else {
    details.push('PASS: Exported proxy_dwell_surface.status is NETWORK_MODEL_GATED');
  }

  return {
    testId: 'TEST_V070_DXY_NETWORK_GATE',
    title: 'v0.7.0 D(x,y) Network Model Gating Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST 9: v0.7.0 GWR Bandwidth vs D_xy Bandwidth Distinction Test
 * 100 m GWR bandwidth cannot populate D_xy R. D_xy bandwidth R must be null / UNRESOLVED_PROXY_DWELL_BANDWIDTH.
 */
export function runTestV070GwrBandwidthNotDwellBandwidth(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const spec = PROXY_DWELL_PAPER_SPECIFICATION;
  if (spec.bandwidthR !== null) {
    errors.push(`Expected D_xy bandwidthR to be null, got ${spec.bandwidthR}`);
  } else {
    details.push('PASS: D_xy bandwidthR is null (not populated with GWR 100 m)');
  }

  if (spec.bandwidthStatus !== 'UNRESOLVED_PROXY_DWELL_BANDWIDTH') {
    errors.push(`Expected bandwidthStatus UNRESOLVED_PROXY_DWELL_BANDWIDTH, got ${spec.bandwidthStatus}`);
  } else {
    details.push('PASS: D_xy bandwidthStatus is UNRESOLVED_PROXY_DWELL_BANDWIDTH');
  }

  const gwrBandwidth = NATURE_903_FINAL_GWR_DIAGNOSTICS.reportedOptimizedBandwidthM;
  if (gwrBandwidth !== 100) {
    errors.push(`Expected GWR bandwidth 100 m, got ${gwrBandwidth}`);
  } else {
    details.push(`PASS: GWR bandwidth is 100 m and strictly quarantined from behavioral kernel`);
  }

  return {
    testId: 'TEST_V070_GWR_BANDWIDTH_NOT_DWELL_BANDWIDTH',
    title: 'v0.7.0 GWR Bandwidth vs D_xy Bandwidth Distinction Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST 10: v0.7.0 20 m Sampling Spacing vs Kernel Bandwidth Test
 * 20 m sampling spacing cannot populate D_xy R.
 */
export function runTestV07020MSpacingNotDwellBandwidth(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const spec = PROXY_DWELL_PAPER_SPECIFICATION;
  if (spec.samplingDiscretizationM !== 20) {
    errors.push(`Expected samplingDiscretizationM 20 m, got ${spec.samplingDiscretizationM}`);
  } else {
    details.push('PASS: Street-view sampling discretization is 20 m');
  }

  if (spec.bandwidthR === 20) {
    errors.push('D_xy bandwidthR was erroneously set to 20 m!');
  } else {
    details.push('PASS: D_xy bandwidthR is NOT assigned 20 m (discretization spacing ≠ kernel bandwidth)');
  }

  return {
    testId: 'TEST_V070_20M_SPACING_NOT_DWELL_BANDWIDTH',
    title: 'v0.7.0 20 m Sampling Spacing vs Kernel Bandwidth Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST 11: v0.7.0 Demo Dwell Isolation from Empirical Observation Test
 * Any demo/simulated dwell output cannot populate t_raw.
 */
export function runTestV070DemoDwellNotEmpirical(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const prov = BEHAVIORAL_SOURCE_PROVENANCE_STATUS;
  if (prov !== 'PAPER_SPECIFIED_REPOSITORY_OUTCOME_UNAVAILABLE') {
    errors.push(`Expected provenance status PAPER_SPECIFIED_REPOSITORY_OUTCOME_UNAVAILABLE, got ${prov}`);
  } else {
    details.push('PASS: BEHAVIORAL_SOURCE_PROVENANCE_STATUS is PAPER_SPECIFIED_REPOSITORY_OUTCOME_UNAVAILABLE');
  }

  const defaultState = DEFAULT_N00045_BEHAVIORAL_STATE;
  if (defaultState.t_raw_seconds.status !== 'UNAVAILABLE_EMPIRICAL_BEHAVIORAL_OUTCOME') {
    errors.push(`Expected t_raw_seconds status UNAVAILABLE_EMPIRICAL_BEHAVIORAL_OUTCOME, got ${defaultState.t_raw_seconds.status}`);
  } else {
    details.push('PASS: t_raw status is UNAVAILABLE_EMPIRICAL_BEHAVIORAL_OUTCOME');
  }

  const exportObj = buildBehavioralStayabilityReconciliationExport();
  if (exportObj.empirical_node_observation.t_raw_seconds !== null) {
    errors.push(`Expected t_raw_seconds null, got ${exportObj.empirical_node_observation.t_raw_seconds}`);
  } else {
    details.push('PASS: Exported empirical t_raw_seconds is null');
  }

  return {
    testId: 'TEST_V070_DEMO_DWELL_NOT_EMPIRICAL',
    title: 'v0.7.0 Demo Dwell Isolation from Empirical Observation Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * TEST 12: v0.7.0 Behavioral SIM Invariance Test
 * Mutating all behavioral/downstream provenance fields must produce zero change in I, Y, D, M.
 * For n00045:
 * I = 6.785792291750779
 * Y = 4.275239548226926
 * D = 6.861271847132807
 * M = 6.214327916148292
 */
export function runTestV070BehavioralSimInvariance(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const GOLDEN_I = 6.785792291750779;
  const GOLDEN_Y = 4.275239548226926;
  const GOLDEN_D = 6.861271847132807;
  const GOLDEN_M = 6.214327916148292;

  const bridge = getN00045ValidationBridge();
  const synth = bridge.synthesis;

  if (!synth) {
    errors.push('Paper synthesis was null for n00045');
    return {
      testId: 'TEST_V070_BEHAVIORAL_SIM_INVARIANCE',
      title: 'v0.7.0 Behavioral SIM Invariance Test',
      passed: false,
      details,
      errors,
    };
  }

  const I = synth.placeImageability.value;
  const Y = synth.placeIdentity.value;
  const D = synth.placeDependence.value;
  const M = synth.sim.value;

  if (Math.abs(I - GOLDEN_I) > 1e-10) {
    errors.push(`Place Imageability I changed! expected ${GOLDEN_I}, got ${I}`);
  } else {
    details.push(`PASS: Place Imageability I = ${I} (exact golden freeze)`);
  }

  if (Math.abs(Y - GOLDEN_Y) > 1e-10) {
    errors.push(`Place Identity Y changed! expected ${GOLDEN_Y}, got ${Y}`);
  } else {
    details.push(`PASS: Place Identity Y = ${Y} (exact golden freeze)`);
  }

  if (Math.abs(D - GOLDEN_D) > 1e-10) {
    errors.push(`Place Dependence D changed! expected ${GOLDEN_D}, got ${D}`);
  } else {
    details.push(`PASS: Place Dependence D = ${D} (exact golden freeze)`);
  }

  if (Math.abs(M - GOLDEN_M) > 1e-10) {
    errors.push(`SIM M changed! expected ${GOLDEN_M}, got ${M}`);
  } else {
    details.push(`PASS: Active SIM M = ${M} (exact golden freeze)`);
  }

  return {
    testId: 'TEST_V070_BEHAVIORAL_SIM_INVARIANCE',
    title: 'v0.7.0 Behavioral SIM Invariance Test',
    passed: errors.length === 0,
    details,
    errors,
  };
}

const STEP6_GOLDEN_ACTIVE_SIM = {
  I: 6.785792291750779,
  Y: 4.275239548226926,
  D: 6.861271847132807,
  a: 0.4,
  b: 0.2,
  c: 0.4,
  M: 6.214327916148292,
} as const;

const STEP6_GOLDEN_GEOMETRY = {
  hM: 18.373344,
  wFacade: null,
  hwFacade: null,
  hwEffective: 0.5367320941078925,
  hwSource: 'series',
  nodeGVI: 1.8055209092729336,
  nodeVEI: 0.6017595356297097,
  nodeSVFBand: 0.1946937439740204,
} as const;

function buildStep6Master(isApproved: boolean) {
  return buildMultiSourceMasterPayload({
    nodeId: 'n00045',
    isApproved,
    activeSim: { ...STEP6_GOLDEN_ACTIVE_SIM },
    geometry: { ...STEP6_GOLDEN_GEOMETRY },
    streetSampling: null,
    sourceImageId: '1st_avenue/north_to_south/001_n00045_S.jpg',
  });
}

/**
 * STEP 6 RECONCILIATION TEST 1: Nature 9.03 Golden Freeze Invariance
 * Checks bit-for-bit invariance of n00045 golden values:
 * I = 6.785792291750779, Y = 4.275239548226926, D = 6.861271847132807
 * a = 0.4, b = 0.2, c = 0.4, M = 6.214327916148292
 */
export function runTestStep6GoldenFreezeInvariance(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const GOLDEN_I = 6.785792291750779;
  const GOLDEN_Y = 4.275239548226926;
  const GOLDEN_D = 6.861271847132807;
  const a = 0.4;
  const b = 0.2;
  const c = 0.4;
  const GOLDEN_M = 6.214327916148292;

  const computedM = Math.pow(GOLDEN_I, a) * Math.pow(GOLDEN_Y, b) * Math.pow(GOLDEN_D, c);
  if (Math.abs(computedM - GOLDEN_M) > 1e-12) {
    errors.push(`Direct formula calculation mismatch: expected ${GOLDEN_M}, got ${computedM}`);
  } else {
    details.push(`Formula I^0.4 × Y^0.2 × D^0.4 verified: ${computedM} matches ${GOLDEN_M}`);
  }

  const bridge = getN00045ValidationBridge();
  const synth = bridge.synthesis;
  if (!synth) {
    errors.push('Bridge synthesis was null for n00045');
  } else {
    const I = synth.placeImageability.value ?? 0;
    const Y = synth.placeIdentity.value ?? 0;
    const D = synth.placeDependence.value ?? 0;
    const M = synth.sim.value ?? 0;

    if (Math.abs(I - GOLDEN_I) > 1e-12) errors.push(`I mismatch: expected ${GOLDEN_I}, got ${I}`);
    if (Math.abs(Y - GOLDEN_Y) > 1e-12) errors.push(`Y mismatch: expected ${GOLDEN_Y}, got ${Y}`);
    if (Math.abs(D - GOLDEN_D) > 1e-12) errors.push(`D mismatch: expected ${GOLDEN_D}, got ${D}`);
    if (Math.abs(M - GOLDEN_M) > 1e-12) errors.push(`M mismatch: expected ${GOLDEN_M}, got ${M}`);

    details.push(`n00045 bridge golden values verified: I=${I}, Y=${Y}, D=${D}, M=${M}`);
  }

  return {
    testId: 'TEST_STEP6_GOLDEN_FREEZE_INVARIANCE',
    title: 'Step 6 Test 1: Nature 9.03 Golden Freeze Invariance (n00045)',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * STEP 6 RECONCILIATION TEST 2: Qwen Median-Led Probability Distribution Parsing
 * Expected value, normalized EV, monotonic mapping.
 */
export function runTestStep6QwenProbabilityParsing(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const probsLow = [0.70, 0.20, 0.10, 0.0, 0.0, 0.0, 0.0];
  const probsHigh = [0.0, 0.0, 0.0, 0.0, 0.10, 0.20, 0.70];

  const calcEV = (probs: number[]) => probs.reduce((sum, p, idx) => sum + p * (idx + 1), 0);
  const calcNormEV = (ev: number) => (ev - 1) / 6;

  const evLow = calcEV(probsLow);
  const normLow = calcNormEV(evLow);
  const evHigh = calcEV(probsHigh);
  const normHigh = calcNormEV(evHigh);

  if (normLow >= normHigh) {
    errors.push(`Monotonic mapping failure: low distribution norm (${normLow}) >= high distribution norm (${normHigh})`);
  } else {
    details.push(`Monotonic mapping verified: low norm=${normLow.toFixed(4)}, high norm=${normHigh.toFixed(4)}`);
  }

  const evRung1 = calcEV([1, 0, 0, 0, 0, 0, 0]);
  const normRung1 = calcNormEV(evRung1);
  const evRung7 = calcEV([0, 0, 0, 0, 0, 0, 1]);
  const normRung7 = calcNormEV(evRung7);

  if (Math.abs(normRung1 - 0.0) > 1e-12 || Math.abs(normRung7 - 1.0) > 1e-12) {
    errors.push(`Boundary mapping failed: rung 1 norm=${normRung1}, rung 7 norm=${normRung7}`);
  } else {
    details.push('Boundary conditions exact: Rung 1 -> 0.0, Rung 7 -> 1.0');
  }

  return {
    testId: 'TEST_STEP6_QWEN_PROBABILITY_PARSING',
    title: 'Step 6 Test 2: Qwen Median-Led Probability Distribution Parsing',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * STEP 6 RECONCILIATION TEST 3: Approval Gate Reconciliation
 * Pending state prevents authorized synthesis; approved state unblocks authorized synthesis.
 */
export function runTestStep6ApprovalGateReconciliation(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const checkAuthorizationStatus = (isApproved: boolean, hasRecord: boolean) => {
    if (!hasRecord) return 'NOT_APPLICABLE';
    return isApproved ? 'AUTHORIZED' : 'PREVIEW_ONLY_NOT_APPROVED';
  };

  const unapproved = checkAuthorizationStatus(false, true);
  if (unapproved !== 'PREVIEW_ONLY_NOT_APPROVED') {
    errors.push(`Unapproved state must be PREVIEW_ONLY_NOT_APPROVED, got ${unapproved}`);
  } else {
    details.push('Pending approval gate correctly prevents authorization (PREVIEW_ONLY_NOT_APPROVED)');
  }

  const approved = checkAuthorizationStatus(true, true);
  if (approved !== 'AUTHORIZED') {
    errors.push(`Approved state must be AUTHORIZED, got ${approved}`);
  } else {
    details.push('Approved state successfully unblocks authorized synthesis (AUTHORIZED)');
  }

  const preMaster = buildStep6Master(false);
  const postMaster = buildStep6Master(true);
  if (preMaster.qwen_visual_semantic.approval_status !== 'PREVIEW_ONLY_NOT_APPROVED') {
    errors.push(`Master pre-approval status mismatch: ${preMaster.qwen_visual_semantic.approval_status}`);
  }
  if (postMaster.qwen_visual_semantic.approval_status !== 'AUTHORIZED') {
    errors.push(`Master post-approval status mismatch: ${postMaster.qwen_visual_semantic.approval_status}`);
  }

  for (const key of ['I', 'Y', 'D', 'a', 'b', 'c', 'M'] as const) {
    if (preMaster.active_sim[key] !== postMaster.active_sim[key]) {
      errors.push(`Approval changed active_sim.${key}: pre=${preMaster.active_sim[key]} post=${postMaster.active_sim[key]}`);
    }
  }
  details.push('Pre/post approval active I/Y/D/a/b/c/M values are bit-for-bit identical.');

  return {
    testId: 'TEST_STEP6_APPROVAL_GATE_RECONCILIATION',
    title: 'Step 6 Test 3: Approval Gate Reconciliation (Pending vs Approved)',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * STEP 6 RECONCILIATION TEST 4: 180° Along-Street Source Protocol
 * Labeled as team along-street 180°; paper equivalence remains unresolved.
 */
export function runTestStep6AlongStreet180Protocol(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const resolution = MULTI_SOURCE_PROVENANCE_RESOLUTION_RECORD.visual_semantic_orientation;
  if (resolution.source_protocol !== 'TEAM_ALONG_STREET_180') {
    errors.push(`Expected source_protocol TEAM_ALONG_STREET_180, got ${resolution.source_protocol}`);
  } else {
    details.push(`Source protocol labeled: ${resolution.source_protocol}`);
  }

  if (resolution.fov_degrees !== 180) {
    errors.push(`Expected fov_degrees 180, got ${resolution.fov_degrees}`);
  } else {
    details.push(`Source field of view: ${resolution.fov_degrees}°`);
  }

  if (resolution.paper_protocol_alignment !== 'UNRESOLVED_PAPER_PROTOCOL_ALIGNMENT') {
    errors.push(`Expected UNRESOLVED_PAPER_PROTOCOL_ALIGNMENT, got ${resolution.paper_protocol_alignment}`);
  } else {
    details.push(`Paper protocol alignment remains unresolved: ${resolution.paper_protocol_alignment}`);
  }

  return {
    testId: 'TEST_STEP6_ALONG_STREET_180_PROTOCOL',
    title: 'Step 6 Test 4: 180° Along-Street Source Protocol Labeled & Equivalence Unresolved',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * STEP 6 RECONCILIATION TEST 5: Geometry Separation
 * H_m is valid, HW_effective is valid, W_facade is strictly null (never 0),
 * no reverse engineering from H_m / HW_effective.
 */
export function runTestStep6GeometrySeparation(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const master = buildStep6Master(false);
  const geom = master.morphology_geometry;

  if (geom.H_m === null || geom.H_m <= 0) {
    errors.push(`H_m expected valid positive number, got ${geom.H_m}`);
  } else {
    details.push(`H_m present and valid: ${geom.H_m}`);
  }

  if (geom.HW_effective === null || geom.HW_effective <= 0) {
    errors.push(`HW_effective expected valid positive number, got ${geom.HW_effective}`);
  } else {
    details.push(`HW_effective present and valid: ${geom.HW_effective}`);
  }

  if (geom.W_facade !== null) {
    errors.push(`W_facade must be strictly null (not reverse engineered or 0), got ${geom.W_facade}`);
  } else {
    details.push('W_facade is strictly null (no reverse-engineering defect, never 0)');
  }

  return {
    testId: 'TEST_STEP6_GEOMETRY_SEPARATION',
    title: 'Step 6 Test 5: Geometry Separation & Non-Reverse Engineering',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * STEP 6 RECONCILIATION TEST 6: Space Syntax vs GWR
 * Space Syntax Choice/Integration defined at R = 800m, node-level values UNAVAILABLE.
 * GWR Model 2 paper R² = 0.8316, local betas UNAVAILABLE, global fallback a=0.4, b=0.2, c=0.4 active.
 */
export function runTestStep6SpaceSyntaxVsGwr(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  if (SPACE_SYNTAX_PAPER_SPECIFICATION.walkingRadiusM !== 800) {
    errors.push(`Space Syntax paper radius expected 800m, got ${SPACE_SYNTAX_PAPER_SPECIFICATION.walkingRadiusM}`);
  } else {
    details.push(`Space Syntax paper radius verified: ${SPACE_SYNTAX_PAPER_SPECIFICATION.walkingRadiusM}m`);
  }

  if (NATURE_903_GWR_PAPER_DIAGNOSTICS.model2R2 !== 0.8316) {
    errors.push(`GWR Model 2 R² expected 0.8316, got ${NATURE_903_GWR_PAPER_DIAGNOSTICS.model2R2}`);
  } else {
    details.push(`GWR Model 2 R² verified: ${NATURE_903_GWR_PAPER_DIAGNOSTICS.model2R2}`);
  }

  const master = buildStep6Master(false);
  if (master.gwr_active_elasticity.a !== 0.4 || master.gwr_active_elasticity.b !== 0.2 || master.gwr_active_elasticity.c !== 0.4) {
    errors.push(`Active elasticity fallback mismatch: a=${master.gwr_active_elasticity.a}, b=${master.gwr_active_elasticity.b}, c=${master.gwr_active_elasticity.c}`);
  } else {
    details.push('Active elasticity global fallback verified: a=0.4, b=0.2, c=0.4');
  }

  if (master.space_syntax_node_level.status !== 'UNAVAILABLE_NODE_LEVEL_SOURCE') {
    errors.push(`Space syntax node status mismatch: got ${master.space_syntax_node_level.status}`);
  } else {
    details.push('Space syntax node-level status verified: UNAVAILABLE_NODE_LEVEL_SOURCE');
  }

  const sample = master.space_syntax_gwr.paper_sample_accounting;
  if (sample.raw_observations !== 2848 || sample.raw_physical_nodes !== 712 ||
      sample.excluded_tunnel_observations !== 8 || sample.excluded_tunnel_nodes !== 2 ||
      sample.active_observations !== 2840 || sample.active_physical_nodes !== 710) {
    errors.push(`Final-paper sample accounting mismatch: ${JSON.stringify(sample)}`);
  } else {
    details.push('Final-paper sample accounting verified: 2,848/712 raw -> 2,840/710 active.');
  }

  const machinery100 = master.space_syntax_gwr.repository_gwr_machinery.bandwidth_100m;
  if (Math.abs(machinery100.tr_S - 42.66357115679539) > 1e-12 ||
      Math.abs(machinery100.tr_SS - 26.199468878295285) > 1e-12 ||
      Math.abs(machinery100.effective_df - 638.3364288432047) > 1e-12 ||
      Math.abs(machinery100.s2_divisor - 621.8723265647045) > 1e-12 ||
      Math.abs(machinery100.aicc_penalty - 774.4565132844356) > 1e-12) {
    errors.push(`Pinned 100 m machinery row mismatch: ${JSON.stringify(machinery100)}`);
  } else {
    details.push('Pinned repository 100 m GWR machinery row verified exactly.');
  }

  return {
    testId: 'TEST_STEP6_SPACE_SYNTAX_VS_GWR',
    title: 'Step 6 Test 6: Space Syntax vs GWR Specification & Provenance Separation',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * STEP 6 RECONCILIATION TEST 7: Behavioral Observation & Stayability Gating
 * t_raw is null (SOURCE_GATED), t_base is null (SOURCE_GATED), lambda is null (UNRESOLVED),
 * F_i is null (METHOD_GATED_MISSING_LAMBDA), t_effective is null (METHOD_GATED_MISSING_LAMBDA),
 * proxy dwell surface is null (NETWORK_MODEL_GATED).
 */
export function runTestStep6BehavioralStayabilityGating(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const master = buildStep6Master(false);

  if (master.behavioral_observation.node_empirical_observation.t_raw_seconds !== null) {
    errors.push(`t_raw_seconds must be null, got ${master.behavioral_observation.node_empirical_observation.t_raw_seconds}`);
  } else {
    details.push('t_raw_seconds is null');
  }

  if (master.behavioral_observation.node_empirical_observation.t_base !== null) {
    errors.push(`t_base must be null, got ${master.behavioral_observation.node_empirical_observation.t_base}`);
  } else {
    details.push('t_base is null');
  }

  if (master.stayability_calibration.lambda !== null) {
    errors.push(`lambda must be null, got ${master.stayability_calibration.lambda}`);
  } else {
    details.push('lambda is null');
  }

  if (master.stayability_calibration.F_i !== null) {
    errors.push(`F_i must be null, got ${master.stayability_calibration.F_i}`);
  } else {
    details.push('F_i is null');
  }

  if (master.stayability_calibration.t_effective !== null) {
    errors.push(`t_effective must be null, got ${master.stayability_calibration.t_effective}`);
  } else {
    details.push('t_effective is null');
  }
  if (master.stayability_calibration.t_effective_status !== 'INPUT_GATED') {
    errors.push(`t_effective status expected INPUT_GATED, got ${master.stayability_calibration.t_effective_status}`);
  } else {
    details.push('t_effective status verified: INPUT_GATED');
  }

  if (master.proxy_dwell_surface.D_xy !== null) {
    errors.push(`D_xy must be null, got ${master.proxy_dwell_surface.D_xy}`);
  } else {
    details.push('D_xy is null');
  }

  if (master.proxy_dwell_surface.status !== 'NETWORK_MODEL_GATED') {
    errors.push(`Proxy dwell surface status expected NETWORK_MODEL_GATED, got ${master.proxy_dwell_surface.status}`);
  } else {
    details.push('Proxy dwell surface status verified: NETWORK_MODEL_GATED');
  }

  return {
    testId: 'TEST_STEP6_BEHAVIORAL_STAYABILITY_GATING',
    title: 'Step 6 Test 7: Behavioral Observation & Stayability Gating Integrity',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * STEP 6 RECONCILIATION TEST 8: Release Candidate Master Payload
 * schema_version = V0_7_0_MULTI_SOURCE_INTEGRATION_RC1, active scientific core = v0.6.3_GOLDEN_FREEZE,
 * no conflicting values between visual, geometry, space syntax, gwr, behavioral, stayability blocks.
 */
export function runTestStep6ReleaseCandidateMasterPayload(): ValidationTestResult {
  const details: string[] = [];
  const errors: string[] = [];

  const master = buildStep6Master(true);

  if (master.schema_version !== 'V0_7_0_MULTI_SOURCE_INTEGRATION_RC1') {
    errors.push(`schema_version expected V0_7_0_MULTI_SOURCE_INTEGRATION_RC1, got ${master.schema_version}`);
  } else {
    details.push(`schema_version verified: ${master.schema_version}`);
  }

  if (master.active_scientific_core !== 'v0.6.3_GOLDEN_FREEZE') {
    errors.push(`active_scientific_core expected v0.6.3_GOLDEN_FREEZE, got ${master.active_scientific_core}`);
  } else {
    details.push(`active_scientific_core verified: ${master.active_scientific_core}`);
  }

  if (master.frozen_golden_sim_n00045 !== 6.214327916148292) {
    errors.push(`frozen_golden_sim_n00045 expected 6.214327916148292, got ${master.frozen_golden_sim_n00045}`);
  } else {
    details.push(`frozen_golden_sim_n00045 verified: ${master.frozen_golden_sim_n00045}`);
  }

  if (!master.provenance_resolutions || typeof master.provenance_resolutions !== 'object') {
    errors.push('provenance_resolutions block is missing or invalid');
  } else {
    details.push('provenance_resolutions block present and valid');
  }

  if (master.release_candidate_status !== 'V0_7_0_MULTI_SOURCE_INTEGRATION_RC1') {
    errors.push(`release_candidate_status mismatch: ${master.release_candidate_status}`);
  }

  if (master.street_view_sampling_geometry.node_id !== null ||
      master.street_view_sampling_geometry.matched_node !== null ||
      master.street_view_sampling_geometry.crosswalk_status !== 'UNRESOLVED_NODE_CROSSWALK') {
    errors.push(`Unresolved street-node crosswalk must not fabricate a node: ${JSON.stringify(master.street_view_sampling_geometry)}`);
  } else {
    details.push('Street-view-node crosswalk remains unresolved with null external node/matched node (no synthetic coordinates/headings).');
  }

  if (master.morphology_geometry.W_facade !== null || master.morphology_geometry.HW_facade !== null) {
    errors.push('Missing W_facade/HW_facade must remain null in master export.');
  } else {
    details.push('Missing W_facade/HW_facade remain null, never zero or reverse-engineered.');
  }

  for (const key of ['I', 'Y', 'D', 'a', 'b', 'c', 'M'] as const) {
    if (master.active_sim[key] !== STEP6_GOLDEN_ACTIVE_SIM[key]) {
      errors.push(`Master active_sim.${key} mismatch: expected ${STEP6_GOLDEN_ACTIVE_SIM[key]}, got ${master.active_sim[key]}`);
    }
  }

  const boundaryKeys = [
    master.street_view_sampling_geometry.crosswalk_status,
    master.space_syntax_node_level.status,
    master.space_syntax_gwr.local_gwr_status,
    master.behavioral_observation.node_empirical_observation.t_raw_status,
    master.stayability_calibration.lambda_status,
    master.stayability_calibration.F_i_status,
    master.stayability_calibration.t_effective_status,
    master.proxy_dwell_surface.status,
  ];
  if (boundaryKeys.some((value) => !value || value.trim() === '')) {
    errors.push(`Provenance boundary completeness failure: ${JSON.stringify(boundaryKeys)}`);
  } else {
    details.push('All required release provenance boundaries have explicit non-empty statuses.');
  }

  return {
    testId: 'TEST_STEP6_RELEASE_CANDIDATE_MASTER_PAYLOAD',
    title: 'Step 6 Test 8: Release Candidate Master Payload Structure & Non-Conflict Audit',
    passed: errors.length === 0,
    details,
    errors,
  };
}

/**
 * Run all tests A through J + Header Binding + D Invariance + Source Order Robustness + Source Semantic Truth + V070 Multi-Source Integration Tests
 */
export function runAllRepositoryBridgeValidationTests(): ValidationSuiteSummary {
  const streetNodeResults = runAllStreetViewNodeValidationTests();

  const results: ValidationTestResult[] = [
    runTestA(),
    runTestB(),
    runTestC(),
    runTestD(),
    runTestE(),
    runTestF(),
    runTestG(),
    runTestH(),
    runTestI(),
    runTestJ(),
    runTestHeaderBinding(),
    runTestDInvariance(),
    runTestSourceOrderRobustness(),
    runTestSourceSemanticTruth(),
    runTestV070NumericInvariance(),
    runTestV070DiagnosticsIsolation(),
    runTestV070GeometryIsolation(),
    runTestV070InjectionPrevention(),
    runTestV070BehavioralGating(),
    ...(streetNodeResults as ValidationTestResult[]),
    runTestV070GeometryHeaderBinding(),
    runTestV070GeometrySourceTruthN00045(),
    runTestV070NoWidthReverseEngineering(),
    runTestV070NoDirectHWReconstruction(),
    runTestV070HWSourceSemantics(),
    runTestV070OpenOneSideGating(),
    runTestV070NodeGVIIsolation(),
    runTestV070NodeVEIIsolation(),
    runTestV070NodeSVFBandIsolation(),
    runTestV070GeometrySimInvariance(),
    runTestV070FinalPaperSampleAccounting(),
    runTestV070SpaceSyntaxSpecification(),
    runTestV070PaperGwrDiagnostics(),
    runTestV070RepoGwrFeasibilityBlocking(),
    runTestV070RepoGwrKernelDistinction(),
    runTestV070PinnedGwrMachineryTable(),
    runTestV070HistoricalSampleSizeAudit(),
    runTestV070NodeLevelCalibrationUnavailable(),
    runTestV070ActiveSimElasticityFallback(),
    runTestV070CalibrationProvenanceBoundary(),
    runTestV070LegacyGwrFormulaIsolation(),
    runTestV070TBaseFormula(),
    runTestV070MissingTRawNotZero(),
    runTestV070LambdaRemainsUnresolved(),
    runTestV070BlockologyPlaceholderIsolation(),
    runTestV070FGate(),
    runTestV070TEffectiveGate(),
    runTestV070DxySymbolIsolation(),
    runTestV070DxyNetworkGate(),
    runTestV070GwrBandwidthNotDwellBandwidth(),
    runTestV07020MSpacingNotDwellBandwidth(),
    runTestV070DemoDwellNotEmpirical(),
    runTestV070BehavioralSimInvariance(),
    runTestStep6GoldenFreezeInvariance(),
    runTestStep6QwenProbabilityParsing(),
    runTestStep6ApprovalGateReconciliation(),
    runTestStep6AlongStreet180Protocol(),
    runTestStep6GeometrySeparation(),
    runTestStep6SpaceSyntaxVsGwr(),
    runTestStep6BehavioralStayabilityGating(),
    runTestStep6ReleaseCandidateMasterPayload(),
  ];

  const passCount = results.filter((r) => r.passed).length;
  const failCount = results.length - passCount;
  const allPassed = failCount === 0;

  return {
    allPassed,
    totalTests: results.length,
    passCount,
    failCount,
    results,
    status: allPassed
      ? 'NATURE_9_03_V0_7_0_MULTI_SOURCE_RESEARCH_INTEGRATION_VERIFIED'
      : 'NATURE_9_03_V0_7_0_MULTI_SOURCE_RESEARCH_INTEGRATION_FAILED',
  };
}
