/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ============================================================================
 * TEAM REPOSITORY DATA BRIDGE — MAPPER & ASSEMBLER
 * Nature 9.03 Final · No-Omega v0.6
 * ============================================================================
 *
 * Deterministic pipeline:
 * TEAM REPOSITORY DATA
 * → SOURCE RECORD
 * → NODE MATCH
 * → PAPER VARIABLE MAPPING
 * → PAPER RESEARCH ASSEMBLY
 * → EXISTING FROZEN v0.5.2 ENGINE
 *
 * Rules:
 * 1. Node ID is the primary join key.
 * 2. Unusable nodes (usable=false) are marked SOURCE_EXCLUDED and BLOCKED
 *    from active paper synthesis.
 * 3. Exact field ownership:
 *    - vertical_greenery -> V_nat
 *    - vertical_hardscape -> V_built
 *    - green_eye_level -> GVI_eye
 *    - green_softening -> GMI
 *    - signage_detail -> V_sign
 *    - sky_openness -> STANDARDIZED_SKY_OPENNESS_PROXY
 *    - ground_floor_activity -> GFAPI -> Place Identity
 *    - walkable_ground -> V_pave -> Place Dependence
 *    - resting_affordance -> IAS -> Place Dependence
 *    - facade_variation -> SFV -> SUPPLEMENTARY VALIDATION ONLY
 * 4. H/W is GEOMETRY_CONTEXT_ONLY and never modifies active M.
 * 5. Legacy repo calculations (Omega, old M) are retained for COMPARATIVE_PROVENANCE_ONLY.
 * 6. Reference-mode calculation uses frozen v0.5.2 computePaperSynthesis.
 */

import {
  computePaperSynthesis,
  type PaperResearchInputs,
  type PaperSynthesisResult,
} from '../../utils/simComputationEngine';

import {
  parseFilenameIdentity,
  parseRepoComparativeFinals,
  parseRepoGeometryRecord,
  parseRepoNodeIdentity,
  parseRepoQwenRecord,
  parseRepoUsability,
  extractRepositoryMetadata,
  type RawCsvRow,
} from './teamRepositoryParser';

import type {
  CityWideCalibrationDatasetNode,
  CityWideCalibrationSummary,
  RepoComparativeFinals,
  RepoGeometryRecord,
  RepoMatchedRecord,
  RepoMatchStatus,
  RepoMatchStrategy,
  RepoNodeIdentity,
  RepoPaperAssemblyVariables,
  RepoPaperBridgeAssembly,
  RepoProvenanceField,
  RepoQwenRecord,
  RepoUsability,
  TeamRepositoryMetadata,
} from './teamRepositoryTypes';

export interface ResolveNodeMatchOptions {
  activeFilename?: string | null;
  activeImageId?: string | null;
  activeNodeId?: string | null;
  manualSelectionRowIndex?: number | null;
}

export function matchRepositoryRow(
  rows: RawCsvRow[],
  sourceFile: string,
  options: ResolveNodeMatchOptions,
): {
  matchedIndex: number | null;
  matchStatus: RepoMatchStatus;
  matchStrategy: RepoMatchStrategy;
  ambiguousCandidates: string[];
} {
  if (!rows || rows.length === 0) {
    return {
      matchedIndex: null,
      matchStatus: 'NO_MATCH',
      matchStrategy: 'EXPLICIT_NODE_ID',
      ambiguousCandidates: [],
    };
  }

  // 1. Manual user selection
  if (
    options.manualSelectionRowIndex !== undefined &&
    options.manualSelectionRowIndex !== null &&
    options.manualSelectionRowIndex >= 0 &&
    options.manualSelectionRowIndex < rows.length
  ) {
    return {
      matchedIndex: options.manualSelectionRowIndex,
      matchStatus: 'MATCH_OK',
      matchStrategy: 'MANUAL_SELECTION',
      ambiguousCandidates: [],
    };
  }

  const targetNodeId = options.activeNodeId?.trim().toLowerCase();
  const targetFilename = options.activeFilename?.trim().toLowerCase() || options.activeImageId?.trim().toLowerCase();
  const targetBasename = targetFilename ? targetFilename.split('/').pop()?.split('\\').pop() : null;
  const targetParsedIdentity = targetFilename ? parseFilenameIdentity(targetFilename) : null;

  // 2. Exact source filename / basename match (when uniquely resolved)
  if (targetFilename || targetBasename) {
    const matchingIndices: number[] = [];
    rows.forEach((row, idx) => {
      const rowFile = (row.file || row.filename || '').trim().toLowerCase();
      const rowBase = rowFile.split('/').pop()?.split('\\').pop();
      if (rowFile === targetFilename || (targetBasename && rowBase === targetBasename)) {
        matchingIndices.push(idx);
      }
    });

    if (matchingIndices.length === 1) {
      const isBasenameOnly = targetBasename && rows[matchingIndices[0]].file?.trim().toLowerCase() !== targetFilename;
      return {
        matchedIndex: matchingIndices[0],
        matchStatus: 'MATCH_OK',
        matchStrategy: isBasenameOnly ? 'BASENAME_ONLY' : 'EXACT_FILENAME',
        ambiguousCandidates: [],
      };
    }

    if (matchingIndices.length > 1) {
      return {
        matchedIndex: null,
        matchStatus: 'AMBIGUOUS_SOURCE_MATCH',
        matchStrategy: 'EXACT_FILENAME',
        ambiguousCandidates: matchingIndices.map((i) => `Row ${i + 2}: ${rows[i].file || rows[i].node_id}`),
      };
    }
  }

  // 3. Explicit node_id match
  if (targetNodeId) {
    const matchingIndices: number[] = [];
    rows.forEach((row, idx) => {
      const rowNode = (row.node_id || row.nodeId || row.node || '').trim().toLowerCase();
      if (rowNode === targetNodeId) {
        matchingIndices.push(idx);
      }
    });

    if (matchingIndices.length === 1) {
      return {
        matchedIndex: matchingIndices[0],
        matchStatus: 'MATCH_OK',
        matchStrategy: 'EXPLICIT_NODE_ID',
        ambiguousCandidates: [],
      };
    }

    if (matchingIndices.length > 1) {
      // If multiple views for same node (e.g. 4 half-views), try refining by cardinal/side if provided in target
      if (targetParsedIdentity) {
        const refined = matchingIndices.filter((idx) => {
          const r = rows[idx];
          const card = (r.cardinal || '').trim().toUpperCase();
          const side = (r.side || '').trim().toUpperCase();
          const cardMatches = !targetParsedIdentity.cardinal || card === targetParsedIdentity.cardinal;
          const sideMatches = !targetParsedIdentity.side || side === targetParsedIdentity.side;
          return cardMatches && sideMatches;
        });

        if (refined.length === 1) {
          return {
            matchedIndex: refined[0],
            matchStatus: 'MATCH_OK',
            matchStrategy: 'EXPLICIT_NODE_ID',
            ambiguousCandidates: [],
          };
        }
      }

      return {
        matchedIndex: null,
        matchStatus: 'AMBIGUOUS_SOURCE_MATCH',
        matchStrategy: 'EXPLICIT_NODE_ID',
        ambiguousCandidates: matchingIndices.map((i) => `Row ${i + 2}: ${rows[i].file || rows[i].node_id}`),
      };
    }
  }

  // 4. Validated normalized filename parser
  if (targetParsedIdentity) {
    const matchingIndices: number[] = [];
    rows.forEach((row, idx) => {
      const parsedRow = parseFilenameIdentity(row.file || row.filename || '');
      const rowNode = (row.node_id || '').trim().toLowerCase() || parsedRow?.nodeId;
      const rowCardinal = (row.cardinal || '').trim().toUpperCase() || parsedRow?.cardinal;
      const rowSide = (row.side || '').trim().toUpperCase() || parsedRow?.side;

      if (
        rowNode === targetParsedIdentity.nodeId &&
        rowCardinal === targetParsedIdentity.cardinal &&
        rowSide === targetParsedIdentity.side
      ) {
        matchingIndices.push(idx);
      }
    });

    if (matchingIndices.length === 1) {
      return {
        matchedIndex: matchingIndices[0],
        matchStatus: 'MATCH_OK',
        matchStrategy: 'NORMALIZED_FILENAME_PARSER',
        ambiguousCandidates: [],
      };
    }

    if (matchingIndices.length > 1) {
      return {
        matchedIndex: null,
        matchStatus: 'AMBIGUOUS_SOURCE_MATCH',
        matchStrategy: 'NORMALIZED_FILENAME_PARSER',
        ambiguousCandidates: matchingIndices.map((i) => `Row ${i + 2}: ${rows[i].file || rows[i].node_id}`),
      };
    }
  }

  return {
    matchedIndex: null,
    matchStatus: 'NO_MATCH',
    matchStrategy: 'EXPLICIT_NODE_ID',
    ambiguousCandidates: [],
  };
}

export function buildMatchedRecordFromRow(
  row: RawCsvRow,
  sourceFile: string,
  rowIndex: number,
  matchStrategy: RepoMatchStrategy,
  provenanceHint?: Partial<TeamRepositoryMetadata>,
): RepoMatchedRecord {
  const identity = parseRepoNodeIdentity(row, sourceFile, rowIndex);
  const usability = parseRepoUsability(row);
  const qwenRecord = parseRepoQwenRecord(row);
  const geometryRecord = parseRepoGeometryRecord(row, sourceFile, rowIndex);
  const comparativeFinals = parseRepoComparativeFinals(row, sourceFile, rowIndex);
  const sourceMetadata = extractRepositoryMetadata(provenanceHint);

  return {
    matchStatus: 'MATCH_OK',
    matchStrategy,
    identity,
    usability,
    qwenRecord,
    geometryRecord,
    comparativeFinals,
    sourceMetadata,
    rawSourceRow: row,
  };
}

export function mapRepoToPaperAssemblyVariables(
  matched: RepoMatchedRecord,
): RepoPaperAssemblyVariables {
  const q = matched.qwenRecord;
  const geom = matched.geometryRecord;
  const nodeId = matched.identity.nodeId;
  const sourceFile = matched.identity.sourceFile;
  const sourceRow = matched.identity.sourceRow;
  const sourceFilename = matched.identity.sourceFilename;
  const usableStatus = matched.usability.status;

  // Helper to construct RepoProvenanceField for Qwen variables
  const makeQwenField = (
    entry: typeof q extends null ? null : typeof q.verticalGreenery,
    paperLabel: string,
  ): RepoProvenanceField<number | null> => {
    if (!entry || entry.normalizedValue === null) {
      return {
        value: null,
        classification: 'UNAVAILABLE',
        sourceFile,
        sourceField: entry?.fieldId ?? null,
        sourceColumn: entry?.sourceColumn ?? entry?.fieldId ?? null,
        sourceValue: entry?.sourceValue ?? null,
        sourceRow,
        sourceNodeId: nodeId,
        sourceFilename,
        readoutMethod: 'UNAVAILABLE',
        usableStatus,
        notes: `Field ${paperLabel} is unavailable in matched repository record.`,
      };
    }

    return {
      value: entry.normalizedValue,
      classification: entry.classification,
      sourceFile,
      sourceField: entry.sourceField || entry.fieldId,
      sourceColumn: entry.sourceColumn || entry.continuousReadoutSource,
      sourceValue: entry.sourceValue,
      sourceRow,
      sourceNodeId: nodeId,
      sourceFilename,
      readoutMethod: entry.readoutMethod,
      continuousReadoutSource: entry.continuousReadoutSource,
      displayRung: entry.displayRung,
      displayRungSource: entry.displayRungSource,
      displayRungValue: entry.displayRungValue,
      sourceScale: entry.sourceScale,
      targetScale: entry.targetScale,
      normalizationFormula: entry.normalizationFormula,
      usableStatus,
      probabilityDistribution: entry.probabilities,
      notes: entry.notes,
    };
  };

  const vNat = makeQwenField(q?.verticalGreenery ?? null, 'V_nat');
  const vBuilt = makeQwenField(q?.verticalHardscape ?? null, 'V_built');

  // Diagnostic ratio computed outside engine for provenance inspection only.
  // Authoritative ratio execution occurs inside the frozen SIM engine via vNat and vBuilt inputs.
  let naturalBuiltRatioValue: number | null = null;
  let ratioClassification: RepoProvenanceField<number | null>['classification'] = 'UNAVAILABLE';
  let ratioNotes = 'Natural-Built Ratio unavailable: requires both V_nat and V_built > 0.';

  if (vNat.value !== null && vBuilt.value !== null) {
    if (vBuilt.value > 0) {
      naturalBuiltRatioValue = vNat.value / vBuilt.value;
      ratioClassification = 'DERIVED_FOR_PROVENANCE_ONLY';
      ratioNotes = `DERIVED_FOR_PROVENANCE_ONLY: Diagnostic ratio V_nat (${vNat.value.toFixed(4)}) / V_built (${vBuilt.value.toFixed(4)}) = ${naturalBuiltRatioValue.toFixed(4)}. Authoritative ratio is computed inside frozen SIM engine.`;
    } else {
      ratioClassification = 'UNAVAILABLE';
      ratioNotes = `V_built is 0; ratio is not computed to avoid division by zero.`;
    }
  }

  const naturalBuiltRatio: RepoProvenanceField<number | null> = {
    value: naturalBuiltRatioValue,
    classification: ratioClassification,
    sourceFile,
    sourceField: 'vertical_greenery_median / vertical_hardscape_median',
    sourceColumn: 'vertical_greenery_median / vertical_hardscape_median',
    sourceValue: naturalBuiltRatioValue,
    sourceRow,
    sourceNodeId: nodeId,
    sourceFilename,
    readoutMethod: vNat.readoutMethod,
    sourceScale: 'RATIO',
    targetScale: 'RATIO',
    normalizationFormula: 'V_nat / V_built',
    usableStatus,
    notes: ratioNotes,
  };

  const rawGviEye = makeQwenField(q?.greenEyeLevel ?? null, 'GVI_eye');
  const gviEye: RepoProvenanceField<number | null> = {
    ...rawGviEye,
    sourceField: rawGviEye.sourceField || 'green_eye_level_median',
    sourceColumn: rawGviEye.sourceColumn || 'green_eye_level_median',
    sourceValue: rawGviEye.sourceValue,
    notes: 'ACTIVE_IMAGEABILITY_INPUT: Eye-level greenness from green_eye_level_median. Kept distinct from node_GVI (node-level geometric context).',
  };

  const gmi = makeQwenField(q?.greenSoftening ?? null, 'GMI');
  const vSign = makeQwenField(q?.signageDetail ?? null, 'V_sign');

  // Sky openness as standardized proxy
  const rawSky = makeQwenField(q?.skyOpenness ?? null, 'SVF_STANDARDIZED_INPUT');
  const svf: RepoProvenanceField<number | null> = {
    ...rawSky,
    sourceField: rawSky.sourceField || 'sky_openness_median',
    sourceColumn: rawSky.sourceColumn || 'sky_openness_median',
    sourceValue: rawSky.sourceValue,
    notes: 'TEAM_QWEN_STANDARDIZED_SKY_OPENNESS: Standardized sky openness from Team Qwen sky_openness_median. Enters Identity Y_i as 1 - SVF. Kept distinct from node_SVF_band (LIMITED_ELEVATION_SKY_BAND).',
  };

  const gfapi = makeQwenField(q?.groundFloorActivity ?? null, 'GFAPI');
  const vPave = makeQwenField(q?.walkableGround ?? null, 'V_pave');
  const ias = makeQwenField(q?.restingAffordance ?? null, 'IAS');
  const sfv = makeQwenField(q?.facadeVariation ?? null, 'SFV');

  // H/W geometry
  const hwRatio: RepoProvenanceField<number | null> = {
    value: geom?.hwEffective ?? null,
    classification: geom?.hwEffective !== null ? 'REPO_GEOMETRY_CONTEXT' : 'UNAVAILABLE',
    sourceFile,
    sourceField: 'HW_effective',
    sourceColumn: 'HW_effective',
    sourceValue: geom?.hwEffectiveProvenance?.sourceValue ?? null,
    sourceRow,
    sourceNodeId: nodeId,
    sourceFilename,
    sourceScale: 'RATIO',
    targetScale: 'RATIO',
    usableStatus,
    notes: geom?.isOpenOneSide
      ? 'open_one_side detected: preserved without fabricating a finite H/W number.'
      : 'GEOMETRY_CONTEXT_ONLY: Does not directly modify active M.',
  };

  // Node context fields (distinguished from active paper inputs)
  const nodeGVI: RepoProvenanceField<number | null> = {
    value: geom?.nodeGVI ?? null,
    classification: geom?.nodeGVI !== null ? 'REPO_MEASURED' : 'UNAVAILABLE',
    sourceFile,
    sourceField: 'node_GVI',
    sourceColumn: 'node_GVI',
    sourceValue: geom?.nodeGVIProvenance?.sourceValue ?? null,
    sourceRow,
    sourceNodeId: nodeId,
    sourceFilename,
    usableStatus,
    notes: 'Node-level GVI geometric context; strictly distinct from green_eye_level_median.',
  };

  const nodeVEI: RepoProvenanceField<number | null> = {
    value: geom?.nodeVEI ?? null,
    classification: geom?.nodeVEI !== null ? 'REPO_MEASURED' : 'UNAVAILABLE',
    sourceFile,
    sourceField: 'node_VEI',
    sourceColumn: 'node_VEI',
    sourceValue: geom?.nodeVEIProvenance?.sourceValue ?? null,
    sourceRow,
    sourceNodeId: nodeId,
    sourceFilename,
    usableStatus,
    notes: 'Node-level VEI context; strictly not shifted to node_SVF_band.',
  };

  const nodeSVFBand: RepoProvenanceField<number | null> = {
    value: geom?.nodeSVFBand ?? null,
    classification: geom?.nodeSVFBand !== null ? 'REPO_MEASURED' : 'UNAVAILABLE',
    sourceFile,
    sourceField: 'node_SVF_band',
    sourceColumn: 'node_SVF_band',
    sourceValue: geom?.nodeSVFBandProvenance?.sourceValue ?? null,
    sourceRow,
    sourceNodeId: nodeId,
    sourceFilename,
    usableStatus,
    notes: 'Limited-elevation sky band context; strictly distinct from sky_openness_median and node_GVI.',
  };

  const hwEffectiveField: RepoProvenanceField<number | null> = {
    value: geom?.hwEffective ?? null,
    classification: geom?.hwEffective !== null ? 'REPO_GEOMETRY_CONTEXT' : 'UNAVAILABLE',
    sourceFile,
    sourceField: 'HW_effective',
    sourceColumn: 'HW_effective',
    sourceValue: geom?.hwEffectiveProvenance?.sourceValue ?? null,
    sourceRow,
    sourceNodeId: nodeId,
    sourceFilename,
    usableStatus,
    notes: 'Effective street aspect ratio (H/W); geometry context only.',
  };

  const hwSourceField: RepoProvenanceField<string | null> = {
    value: geom?.hwSource ?? null,
    classification: geom?.hwSource !== null ? 'REPO_GEOMETRY_CONTEXT' : 'UNAVAILABLE',
    sourceFile,
    sourceField: 'HW_source',
    sourceColumn: 'HW_source',
    sourceValue: geom?.hwSourceProvenance?.sourceValue ?? null,
    sourceRow,
    sourceNodeId: nodeId,
    sourceFilename,
    usableStatus,
    notes: 'Source attribution category for canyon geometry.',
  };

  // Fields genuinely unavailable unless separately supplied
  const makeUnavailable = (field: string, reason: string): RepoProvenanceField<number | null> => ({
    value: null,
    classification: 'UNAVAILABLE',
    sourceFile: null,
    sourceField: null,
    sourceColumn: null,
    sourceValue: null,
    sourceRow: null,
    sourceNodeId: nodeId,
    sourceFilename: null,
    usableStatus,
    notes: `${field} is ${reason}. Missing in repository node tables.`,
  });

  return {
    vNat,
    vBuilt,
    naturalBuiltRatio,
    gviEye,
    gmi,
    vSign,
    svf,
    gfapi,
    vPave,
    ias,
    sfv,
    hwRatio,
    nodeGVI,
    nodeVEI,
    nodeSVFBand,
    hwEffectiveField,
    hwSourceField,
    spaceSyntaxChoice: makeUnavailable('Choice R800', 'Space Syntax network metric not supplied in node tables'),
    spaceSyntaxIntegration: makeUnavailable('Integration R800', 'Space Syntax network metric not supplied in node tables'),
    gwrLocalBetas: makeUnavailable('GWR Local Betas', 'Empirical GWR regression parameters not calibrated for this node'),
    lambda: makeUnavailable('Stayability Lambda', 'Behavioral dwell amplification parameter uncalibrated'),
    tBase: makeUnavailable('Stayability t_base', 'Baseline dwell seconds uncalibrated'),
    tRawSeconds: makeUnavailable('Observed t_raw', 'Raw pedestrian stay duration not recorded'),
  };
}

export function assembleRepoPaperBridge(
  matched: RepoMatchedRecord,
  calibrationMode: string = 'PAPER_MURRAY_HILL_REFERENCE',
): RepoPaperBridgeAssembly {
  const nodeId = matched.identity.nodeId;
  const isUsable = matched.usability.usable;
  const mapped = mapRepoToPaperAssemblyVariables(matched);

  // Check which visual-semantic variables are available
  const visualSemanticKeys = [
    'vNat',
    'vBuilt',
    'gviEye',
    'gmi',
    'vSign',
    'svf',
    'gfapi',
    'vPave',
    'ias',
  ] as const;

  const availableVisualSemantic: string[] = [];
  const missingVisualSemantic: string[] = [];

  for (const k of visualSemanticKeys) {
    if (mapped[k].value !== null) {
      availableVisualSemantic.push(k);
    } else {
      missingVisualSemantic.push(k);
    }
  }

  const supplementaryKeys = ['sfv'];
  const excludedDownstreamKeys = [
    'spaceSyntaxChoice',
    'spaceSyntaxIntegration',
    'gwrLocalBetas',
    'lambda',
    'tBase',
    'tRawSeconds',
  ];

  const warnings: string[] = [];
  const nodeIdProvenance =
    matched.identity.nodeIdSource === 'EXPLICIT_NODE_ID'
      ? 'EXPLICIT_NODE_ID_COLUMN'
      : 'FILENAME_PARSED';

  const provenanceTrail: string[] = [
    `Repository: ${matched.sourceMetadata.repositoryName} @ ${matched.sourceMetadata.repositoryCommit || 'UNKNOWN_COMMIT'}`,
    `Source Table: ${matched.identity.sourceFile} (row ${matched.identity.sourceRow})`,
    `Physical Node: ${nodeId}`,
    `Node ID Provenance: ${nodeIdProvenance}`,
    `Match Strategy: ${matched.matchStrategy}`,
    `Usability: ${matched.usability.status}${matched.usability.excludeReason ? ` (${matched.usability.excludeReason})` : ''}`,
  ];

  if (!isUsable) {
    warnings.push(`NODE EXCLUDED: ${matched.usability.excludeReason || 'Marked unusable in repository metadata'}. Paper synthesis blocked for active results.`);
  }

  if (missingVisualSemantic.length > 0) {
    warnings.push(`Missing visual-semantic variables: ${missingVisualSemantic.join(', ')}.`);
  }

  // Construct PaperResearchInputs
  // Authoritative inputs vNat and vBuilt are passed so the frozen engine owns and performs vNat / vBuilt.
  // mapped.naturalBuiltRatio is passed for provenance diagnostics.
  const paperInputs: PaperResearchInputs = {
    vNat: mapped.vNat.value,
    vBuilt: mapped.vBuilt.value,
    naturalBuiltRatio: mapped.naturalBuiltRatio.value,
    gviEye: mapped.gviEye.value,
    gmi: mapped.gmi.value,
    vSign: mapped.vSign.value,
    svf: mapped.svf.value,
    sfv: mapped.sfv.value,
    gfapi: mapped.gfapi.value,
    vPave: mapped.vPave.value,
    ias: mapped.ias.value,
    hwRatio: mapped.hwRatio.value,
    spaceSyntaxChoice: null,
    spaceSyntaxIntegration: null,
    gwrLocalBetas: null,
    sourceBackedTypology: null,
    tBase: null,
  };

  // Run synthesis if usable
  let synthesis: PaperSynthesisResult | null = null;
  if (isUsable) {
    synthesis = computePaperSynthesis(paperInputs);
    provenanceTrail.push(
      `Engine: v0.5.2 Source-Locked SIM Engine`,
      `Elasticity Mode: ${synthesis.elasticitySource}`,
      `Computed M_i: ${synthesis.sim.value !== null ? synthesis.sim.value.toFixed(6) : 'null'} (${synthesis.sim.status})`,
    );
  } else {
    provenanceTrail.push('Synthesis: BLOCKED (Record is SOURCE_EXCLUDED)');
  }

  return {
    nodeId,
    bridgeStatus: isUsable ? 'READY' : 'EXCLUDED',
    calibrationMode,
    usableForActiveSynthesis: isUsable,
    usabilityStatus: matched.usability.status,
    excludeReason: matched.usability.excludeReason,
    matchedRecord: matched,
    mappedVariables: mapped,
    availableVisualSemanticCount: availableVisualSemantic.length,
    missingVisualSemanticCount: missingVisualSemantic.length,
    availablePaperVariableKeys: availableVisualSemantic,
    missingPaperVariableKeys: missingVisualSemantic,
    supplementaryVariableKeys: supplementaryKeys,
    excludedDownstreamVariableKeys: excludedDownstreamKeys,
    paperInputs,
    synthesis,
    provenanceTrail,
    warnings,
  };
}

export function accumulateCalibrationDataset(
  rows: RawCsvRow[],
  sourceFile: string,
): {
  nodes: CityWideCalibrationDatasetNode[];
  summary: CityWideCalibrationSummary;
} {
  const nodes: CityWideCalibrationDatasetNode[] = [];
  const usableIRaw: number[] = [];
  const usableDRaw: number[] = [];

  rows.forEach((row, idx) => {
    const identity = parseRepoNodeIdentity(row, sourceFile, idx);
    const usability = parseRepoUsability(row);
    const qwen = parseRepoQwenRecord(row);

    let iRaw: number | null = null;
    let dRaw: number | null = null;

    if (
      qwen.verticalGreenery.normalizedValue !== null &&
      qwen.verticalHardscape.normalizedValue !== null &&
      qwen.verticalHardscape.normalizedValue > 0 &&
      qwen.greenEyeLevel.normalizedValue !== null &&
      qwen.greenSoftening.normalizedValue !== null
    ) {
      const ratio = qwen.verticalGreenery.normalizedValue / qwen.verticalHardscape.normalizedValue;
      iRaw = ratio + qwen.greenEyeLevel.normalizedValue + qwen.greenSoftening.normalizedValue;
    }

    if (
      qwen.walkableGround.normalizedValue !== null &&
      qwen.restingAffordance.normalizedValue !== null
    ) {
      // Nature 9.03 Final: literal active D_raw is the direct linear
      // combination V_pave + IAS. No /2 normalization is paper-explicit.
      dRaw = qwen.walkableGround.normalizedValue + qwen.restingAffordance.normalizedValue;
    }

    nodes.push({
      nodeId: identity.nodeId,
      usable: usability.usable,
      iRaw,
      dNorm: dRaw,
      sourceFile,
    });

    if (usability.usable) {
      if (iRaw !== null) usableIRaw.push(iRaw);
      if (dRaw !== null) usableDRaw.push(dRaw);
    }
  });

  const medianOf = (arr: number[]): number | null => {
    if (arr.length === 0) return null;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  const datasetMedianI = medianOf(usableIRaw);
  const datasetMedianD = medianOf(usableDRaw);

  // If complete dataset is loaded (e.g. >= 50 usable nodes in city sample), can offer dataset median
  const isCompleteDataset = usableIRaw.length >= 50 && usableDRaw.length >= 50;

  const summary: CityWideCalibrationSummary = {
    mode: isCompleteDataset ? 'DATASET_CWMC_MEDIAN' : 'PAPER_MURRAY_HILL_REFERENCE',
    iRawMedianUsed: 0.20, // Murray Hill paper reference threshold
    dNormMedianUsed: 0.50, // Murray Hill paper reference threshold
    datasetNodeCount: rows.length,
    datasetUsableCount: usableIRaw.length,
    datasetCalculatedMedianIRaw: datasetMedianI,
    datasetCalculatedMedianDNorm: datasetMedianD,
    provenance: isCompleteDataset
      ? `Full dataset calibration available (${usableIRaw.length} usable nodes).`
      : `Using PAPER_MURRAY_HILL_REFERENCE medians (tau_I=0.20, tau_D=0.50). Single-node or partial datasets do not override city-wide calibration.`,
  };

  return { nodes, summary };
}

/**
 * Creates the default benchmark assembly for Murray Hill Node n00104.
 * Demonstrates complete 9 visual-semantic variables and full validation compliance.
 */
export function getDefaultMurrayHillBenchmarkAssembly(): RepoPaperBridgeAssembly {
  const row: RawCsvRow = {
    node_id: 'n00104',
    file: 'n00104_E_L.jpg',
    usable: 'true',
    exclude_reason: '',
    street: 'E 36th St',
    cardinal: 'E',
    side: 'L',
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
    H_m: '24.5',
    W_facade: '18.0',
    HW_facade: '1.36',
    HW_effective: '1.36',
    HW_source: 'measured',
  };

  const matched = buildMatchedRecordFromRow(row, 'vlm_observations_murrayhill.csv', 104, 'EXPLICIT_NODE_ID');
  return assembleRepoPaperBridge(matched);
}

/**
 * Adapts an existing MurrayHillIntegratedMatch into a RepoPaperBridgeAssembly.
 */
export function buildRepoAssemblyFromMurrayHillMatch(
  match: any
): RepoPaperBridgeAssembly {
  const qwenRec = match.qwenRecord;
  const rawRow = qwenRec?._rawRow || {};

  const row: RawCsvRow = {
    node_id: match.identity.nodeId || 'unknown',
    file: match.identity.file || '',
    usable: 'true',
    exclude_reason: '',
    street: match.identity.street || '',
    cardinal: match.identity.cardinal || '',
    side: match.identity.side || '',
    HW_effective: match.hwEffective !== null && match.hwEffective !== undefined ? String(match.hwEffective) : '',
    HW_source: match.hwSource || '',
    H_m: match.diagnostic?.hM ? String(match.diagnostic.hM) : '',
    W_facade: match.diagnostic?.wFacade ? String(match.diagnostic.wFacade) : '',
    HW_facade: match.diagnostic?.hwFacade ? String(match.diagnostic.hwFacade) : '',
    ...rawRow,
  };

  const matched = buildMatchedRecordFromRow(
    row,
    'vlm_observations_murrayhill.csv',
    0,
    match.matchStrategy === 'exact_file'
      ? 'EXACT_FILENAME'
      : match.matchStrategy === 'basename'
      ? 'BASENAME_ONLY'
      : 'STREET_WALK_CARDINAL_FALLBACK'
  );

  return assembleRepoPaperBridge(matched);
}
