/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ============================================================================
 * TEAM REPOSITORY DATA BRIDGE — TYPES
 * Nature 9.03 Final · No-Omega v0.6
 * ============================================================================
 *
 * Strict provenance and research value classification rules:
 * - Every value is classified as exactly one of:
 *     REPO_MEASURED | REPO_METADATA | DERIVED_FROM_REPO | PAPER_REFERENCE |
 *     USER_SUPPLIED | UNAVAILABLE | DEPRECATED
 * - No silent zero, no silent 0.5, no invented constants.
 * - Missing fields remain explicitly UNAVAILABLE.
 */

import type { PaperResearchInputs, PaperSynthesisResult } from '../../utils/simComputationEngine';

export type RepoValueClassification =
  | 'REPO_MEASURED'
  | 'REPO_GEOMETRY_CONTEXT'
  | 'REPO_METADATA'
  | 'DERIVED_FROM_REPO'
  | 'DERIVED_FOR_PROVENANCE_ONLY'
  | 'PAPER_REFERENCE'
  | 'USER_SUPPLIED'
  | 'UNAVAILABLE'
  | 'DEPRECATED';

export type RepoReadoutMethod =
  | 'ORDINAL_INTERPOLATED_MEDIAN'
  | 'EXPLICIT_MEDIAN'
  | 'DISCRETE_PROBABILITY_MEDIAN'
  | 'EXPECTED_VALUE'
  | 'RAW_SCALAR'
  | 'UNAVAILABLE';

export type RepoScale =
  | 'ORDINAL_1_TO_7'
  | 'UNIT_0_TO_1'
  | 'METERS'
  | 'DEGREES'
  | 'RATIO'
  | 'PROBABILITY'
  | 'RAW';

export type RepoUsabilityStatus =
  | 'SOURCE_USABLE'
  | 'SOURCE_EXCLUDED';

export type RepoMatchStrategy =
  | 'EXPLICIT_NODE_ID'
  | 'EXACT_FILENAME'
  | 'NORMALIZED_FILENAME_PARSER'
  | 'MANUAL_SELECTION'
  | 'BASENAME_ONLY'
  | 'STREET_WALK_CARDINAL_FALLBACK';

export type RepoMatchStatus =
  | 'MATCH_OK'
  | 'AMBIGUOUS_SOURCE_MATCH'
  | 'NO_MATCH';

export interface RepoSevenRungProbabilities {
  p1: number;
  p2: number;
  p3: number;
  p4: number;
  p5: number;
  p6: number;
  p7: number;
}

/**
 * Standardized metadata wrapper for any paper or geometry variable.
 * Provides complete audit trail back to source file, field, row, and readout.
 */
export interface RepoProvenanceField<T = number | null> {
  value: T;
  classification: RepoValueClassification;
  sourceFile: string | null;
  sourceField: string | null;
  sourceColumn?: string | null;
  sourceValue?: any;
  sourceRow: number | null;
  sourceNodeId: string | null;
  sourceFilename: string | null;
  readoutMethod?: RepoReadoutMethod;
  continuousReadoutSource?: string | null;
  displayRung?: number | null;
  displayRungSource?: string | null;
  displayRungValue?: any;
  sourceScale?: RepoScale;
  targetScale?: RepoScale;
  normalizationFormula?: string | null;
  usableStatus?: RepoUsabilityStatus;
  probabilityDistribution?: RepoSevenRungProbabilities | null;
  notes?: string;
}

export interface RepoNodeIdentity {
  nodeId: string;
  nodeIdSource: 'EXPLICIT_NODE_ID' | 'FILENAME_PARSED';
  sourceFilename: string;
  street: string | null;
  walkDirection: string | null;
  side: string | null;
  sequence: number | null;
  cardinalDirection: string | null;
  headingDeg: number | null;
  yawDeg: number | null;
  lat: number | null;
  lng: number | null;
  sourceFile: string;
  sourceRow: number;
}

export interface RepoUsability {
  usable: boolean;
  status: RepoUsabilityStatus;
  excludeReason: string | null;
}

export interface RepoQwenVariableEntry {
  fieldId: string;
  paperVariable: string;
  sourceField: string;
  sourceColumn: string;
  sourceValue: any;
  continuousReadoutSource: string;
  displayRung: number | null;
  displayRungSource: string;
  displayRungValue?: any;
  medianRoundValidationPassed?: boolean | null;
  raw_median_1_7: number | null;
  normalized_0_1: number | null;
  median_round: number | null;
  argmax: number | null;
  rawOrdinal: number | null;
  rawMedian: number | null;
  rawExpectedValue: number | null;
  rawArgmax: number | null;
  probabilities: RepoSevenRungProbabilities | null;
  readoutMethod: RepoReadoutMethod;
  normalizedValue: number | null;
  sourceScale: 'ORDINAL_1_TO_7';
  targetScale: 'UNIT_0_TO_1';
  normalizationFormula: string;
  classification: RepoValueClassification;
  notes: string;
}

export interface RepoQwenRecord {
  verticalGreenery: RepoQwenVariableEntry;      // -> V_nat
  verticalHardscape: RepoQwenVariableEntry;     // -> V_built
  greenEyeLevel: RepoQwenVariableEntry;         // -> GVI_eye
  greenSoftening: RepoQwenVariableEntry;        // -> GMI
  signageDetail: RepoQwenVariableEntry;         // -> V_sign
  skyOpenness: RepoQwenVariableEntry;           // -> standardized sky openness / SVF input
  groundFloorActivity: RepoQwenVariableEntry;   // -> GFAPI -> Place Identity
  walkableGround: RepoQwenVariableEntry;        // -> V_pave -> Place Dependence
  restingAffordance: RepoQwenVariableEntry;     // -> IAS -> Place Dependence
  facadeVariation: RepoQwenVariableEntry;       // -> SFV -> Supplementary validation only
}

export interface RepoDiagnosticProvenanceField<T = any> {
  sourceColumn: string;
  sourceValue: any;
  value: T;
  classification: RepoValueClassification;
  notes?: string;
}

export interface RepoGeometryRecord {
  hM: number | null;
  wFacade: number | null;
  hwFacade: number | null;
  hwEffective: number | null;
  hwSource: string | null;
  hwSourceCategory: 'measured' | 'radius_mean' | 'series' | 'open_one_side' | 'other' | null;
  isOpenOneSide: boolean;
  nodeGVI: number | null;
  nodeVEI: number | null;
  nodeSVFBand: number | null;
  nodeGVIProvenance?: RepoDiagnosticProvenanceField<number | null>;
  nodeVEIProvenance?: RepoDiagnosticProvenanceField<number | null>;
  nodeSVFBandProvenance?: RepoDiagnosticProvenanceField<number | null>;
  hwEffectiveProvenance?: RepoDiagnosticProvenanceField<number | null>;
  hwSourceProvenance?: RepoDiagnosticProvenanceField<string | null>;
  classification: RepoValueClassification;
  role: 'GEOMETRY_CONTEXT_ONLY';
  sourceFile: string;
  sourceRow: number;
}

/**
 * Historical/legacy calculations in repository tables (e.g. vlm_calculations_murrayhill.csv).
 * Retained STRICTLY for comparative provenance; NEVER used as active App results.
 */
export interface RepoComparativeFinals {
  legacyIRaw: number | null;
  legacyI: number | null;
  legacyY: number | null;
  legacyDRaw: number | null;
  legacyD: number | null;
  legacyOmega: number | null;
  legacyA: number | null;
  legacyB: number | null;
  legacyC: number | null;
  legacyM: number | null;
  legacyMLocal: number | null;
  legacyMNoA: number | null;
  role: 'COMPARATIVE_PROVENANCE_ONLY';
  sourceFile: string;
  sourceRow: number;
}

export interface TeamRepositoryMetadata {
  repositoryName: string;
  repositoryCommit: string | null;
  repositoryDataVersion: string;
  activeSourceTable: string;
  comparativeSourceTable: string;
  importTimestamp: string;
}

export interface RepoMatchedRecord {
  matchStatus: RepoMatchStatus;
  matchStrategy: RepoMatchStrategy;
  ambiguousCandidates?: string[];
  identity: RepoNodeIdentity;
  usability: RepoUsability;
  qwenRecord: RepoQwenRecord | null;
  geometryRecord: RepoGeometryRecord | null;
  comparativeFinals: RepoComparativeFinals | null;
  sourceMetadata: TeamRepositoryMetadata;
  rawSourceRow: Record<string, string>;
}

export interface RepoPaperAssemblyVariables {
  vNat: RepoProvenanceField<number | null>;
  vBuilt: RepoProvenanceField<number | null>;
  naturalBuiltRatio: RepoProvenanceField<number | null>;
  gviEye: RepoProvenanceField<number | null>;
  gmi: RepoProvenanceField<number | null>;
  vSign: RepoProvenanceField<number | null>;
  svf: RepoProvenanceField<number | null>;
  gfapi: RepoProvenanceField<number | null>;
  vPave: RepoProvenanceField<number | null>;
  ias: RepoProvenanceField<number | null>;
  sfv: RepoProvenanceField<number | null>;
  hwRatio: RepoProvenanceField<number | null>;
  nodeGVI?: RepoProvenanceField<number | null>;
  nodeVEI?: RepoProvenanceField<number | null>;
  nodeSVFBand?: RepoProvenanceField<number | null>;
  hwEffectiveField?: RepoProvenanceField<number | null>;
  hwSourceField?: RepoProvenanceField<string | null>;
  spaceSyntaxChoice: RepoProvenanceField<number | null>;
  spaceSyntaxIntegration: RepoProvenanceField<number | null>;
  gwrLocalBetas: RepoProvenanceField<any | null>;
  lambda: RepoProvenanceField<number | null>;
  tBase: RepoProvenanceField<number | null>;
  tRawSeconds: RepoProvenanceField<number | null>;
}

export interface RepoPaperBridgeAssembly {
  nodeId: string;
  bridgeStatus: string;
  calibrationMode: string;
  usableForActiveSynthesis: boolean;
  usabilityStatus: RepoUsabilityStatus;
  excludeReason: string | null;
  matchedRecord: RepoMatchedRecord;
  mappedVariables: RepoPaperAssemblyVariables;
  availableVisualSemanticCount: number;
  missingVisualSemanticCount: number;
  availablePaperVariableKeys: string[];
  missingPaperVariableKeys: string[];
  supplementaryVariableKeys: string[];
  excludedDownstreamVariableKeys: string[];
  paperInputs: PaperResearchInputs;
  /**
   * Deterministic synthesis result from the frozen v0.5.2 engine.
   * Null if usableForActiveSynthesis is false (e.g. SOURCE_EXCLUDED).
   */
  synthesis: PaperSynthesisResult | null;
  provenanceTrail: string[];
  warnings: string[];
}

export interface CityWideCalibrationDatasetNode {
  nodeId: string;
  usable: boolean;
  iRaw: number | null;
  dNorm: number | null;
  sourceFile: string;
}

export interface CityWideCalibrationSummary {
  mode: 'PAPER_MURRAY_HILL_REFERENCE' | 'DATASET_CWMC_MEDIAN';
  iRawMedianUsed: number;
  dNormMedianUsed: number;
  datasetNodeCount: number;
  datasetUsableCount: number;
  datasetCalculatedMedianIRaw: number | null;
  datasetCalculatedMedianDNorm: number | null;
  provenance: string;
}

export interface RepoPinnedRowExport {
  repository_name: string;
  repository_commit: string;
  repository_path: string;
  repository_blob_sha: string;
  exact_csv_file: string;
  node_id: string;
  street: string;
  walk: string;
  side: string;
  seq: string;
  usable: string;
  exclude_reason: string;
}
