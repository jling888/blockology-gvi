/**
 * PAPER VLM QWEN BRIDGE — STEP 7.2 FIXED PURE TYPESCRIPT
 * IMPORTANT: This is a .ts research utility file with no React JSX.
 */

import type {
  PaperVlmInstrumentFieldId,
} from '../types';

import type {
  PaperExternalResearchInputs,
} from '../utils/paperResearchAssembler';

import {
  PAPER_VLM_FIELD_ORDER,
  getPaperVlmInstrumentFieldSpec,
} from './paperVlmInstrument';

import type {
  QwenCsvImportedRecord,
} from './paperVlmQwenCsvImporter';

export interface QwenPaperVariableCandidate {
  key:
    | 'vlmVNat'
    | 'vlmVBuilt'
    | 'gviEye'
    | 'gmi'
    | 'vSign'
    | 'sfv'
    | 'vPave'
    | 'gfapi'
    | 'ias'
    | 'canyonEnclosureRatio';

  paperLabel:
    | 'V_nat'
    | 'V_built'
    | 'GVI_eye'
    | 'GMI'
    | 'V_sign'
    | 'SFV'
    | 'V_pave'
    | 'GFAPI'
    | 'IAS'
    | '1-SVF proxy';

  sourceField: PaperVlmInstrumentFieldId;

  /**
   * Candidate value on [0,1].
   * This is a preview only until an explicit approval step writes it into
   * PaperExternalResearchInputs.
   */
  value: number;

  transform:
    | 'normalized_ev'
    | 'one_minus_normalized_ev'
    | 'normalized_continuous_readout'
    | 'one_minus_normalized_continuous_readout';

  researchStatus:
    | 'direct_instrument_bridge'
    | 'proxy_not_true_svf';

  notes: string;
}

export interface QwenPaperBridgePreview {
  sourceNodeId: string;
  sourceImageId: string;
  eligibleForBridgePreview: boolean;
  candidateValues: QwenPaperVariableCandidate[];
  warnings: string[];
}

const DIRECT_MAPPINGS: readonly {
  fieldId: PaperVlmInstrumentFieldId;
  key: QwenPaperVariableCandidate['key'];
  paperLabel: QwenPaperVariableCandidate['paperLabel'];
  notes: string;
}[] = [
  {
    fieldId: 'vertical_greenery',
    key: 'vlmVNat',
    paperLabel: 'V_nat',
    notes:
      'Qwen vertical_greenery active normalized source readout supplies the teacher-paper natural visual-semantic input.',
  },
  {
    fieldId: 'vertical_hardscape',
    key: 'vlmVBuilt',
    paperLabel: 'V_built',
    notes:
      'Qwen vertical_hardscape active normalized source readout supplies visible built vertical presence; it is not numerical H/W.',
  },
  {
    fieldId: 'green_eye_level',
    key: 'gviEye',
    paperLabel: 'GVI_eye',
    notes:
      'Qwen eye-level greenery instrument bridges to the standardized teacher GVI_eye input.',
  },
  {
    fieldId: 'green_softening',
    key: 'gmi',
    paperLabel: 'GMI',
    notes:
      'Qwen green_softening bridges to GMI; construct validation remains pending.',
  },
  {
    fieldId: 'signage_detail',
    key: 'vSign',
    paperLabel: 'V_sign',
    notes:
      'Qwen signage/detail visual-semantic score supplies V_sign.',
  },
  {
    fieldId: 'facade_variation',
    key: 'sfv',
    paperLabel: 'SFV',
    notes:
      'Qwen facade_variation supplies the SFV field missing from the teacher Appendix strict JSON.',
  },
  {
    fieldId: 'walkable_ground',
    key: 'vPave',
    paperLabel: 'V_pave',
    notes:
      'Qwen walkable_ground supplies V_pave; current validation strength is weak.',
  },
  {
    fieldId: 'ground_floor_activity',
    key: 'gfapi',
    paperLabel: 'GFAPI',
    notes:
      'Qwen ground-floor activity/permeability instrument supplies GFAPI.',
  },
  {
    fieldId: 'resting_affordance',
    key: 'ias',
    paperLabel: 'IAS',
    notes:
      'Qwen resting affordance instrument supplies IAS; current validation strength is weak.',
  },
] as const;

function activeNormalizedReadout(field: any): { value: number; transform: 'normalized_ev' | 'normalized_continuous_readout' } {
  if (
    field?.continuous_readout_method === 'ORDINAL_INTERPOLATED_MEDIAN' &&
    typeof field?.normalized_continuous_readout === 'number' &&
    Number.isFinite(field.normalized_continuous_readout)
  ) {
    return {
      value: field.normalized_continuous_readout,
      transform: 'normalized_continuous_readout',
    };
  }

  return { value: field.normalized_ev, transform: 'normalized_ev' };
}

export function buildQwenPaperBridgePreview(
  importedRecord: QwenCsvImportedRecord | null,
): QwenPaperBridgePreview | null {
  if (!importedRecord) {
    return null;
  }

  const { run } = importedRecord;
  const warnings = [...run.warnings];
  const candidateValues: QwenPaperVariableCandidate[] = [];

  for (const mapping of DIRECT_MAPPINGS) {
    const field = run.fields[mapping.fieldId];

    if (!field) {
      warnings.push(
        `Missing ${mapping.fieldId}; ${mapping.paperLabel} cannot be previewed.`,
      );
      continue;
    }

    const readout = activeNormalizedReadout(field);

    candidateValues.push({
      key: mapping.key,
      paperLabel: mapping.paperLabel,
      sourceField: mapping.fieldId,
      value: readout.value,
      transform: readout.transform,
      researchStatus: 'direct_instrument_bridge',
      notes: mapping.notes,
    });
  }

  const sky = run.fields.sky_openness;

  if (sky) {
    const skyReadout = activeNormalizedReadout(sky);
    candidateValues.push({
      key: 'canyonEnclosureRatio',
      paperLabel: '1-SVF proxy',
      sourceField: 'sky_openness',
      value: 1 - skyReadout.value,
      transform: skyReadout.transform === 'normalized_continuous_readout'
        ? 'one_minus_normalized_continuous_readout'
        : 'one_minus_normalized_ev',
      researchStatus: 'proxy_not_true_svf',
      notes:
        'Derived only as an image-based enclosure proxy: 1 - the active source-backed sky-openness readout. This must not be relabeled as true whole-sky SVF.',
    });
  } else {
    warnings.push(
      'Missing sky_openness; canyon enclosure proxy cannot be previewed.',
    );
  }

  if (!run.eligible_for_paper_assembly) {
    warnings.push(
      'Imported Qwen run is not mechanically eligible for Paper Assembly. Preview is diagnostic only.',
    );
  }

  return {
    sourceNodeId: importedRecord.sourceIdentity.node_id,
    sourceImageId: importedRecord.sourceIdentity.file,
    eligibleForBridgePreview: run.eligible_for_paper_assembly,
    candidateValues,
    warnings,
  };
}


// ============================================================================
// STEP 7 — Explicit approval gate
// ============================================================================

export type QwenControlledPaperInputKey =
  | 'vlmVNat'
  | 'vlmVBuilt'
  | 'gviEye'
  | 'gmi'
  | 'vSign'
  | 'sfv'
  | 'vPave'
  | 'gfapi'
  | 'ias'
  | 'canyonEnclosureRatio';

export const QWEN_CONTROLLED_PAPER_INPUT_KEYS:
  readonly QwenControlledPaperInputKey[] = [
    'vlmVNat',
    'vlmVBuilt',
    'gviEye',
    'gmi',
    'vSign',
    'sfv',
    'vPave',
    'gfapi',
    'ias',
    'canyonEnclosureRatio',
  ] as const;

export type QwenPaperInputPatch = Pick<
  PaperExternalResearchInputs,
  QwenControlledPaperInputKey
>;

export interface QwenPaperApprovalReadiness {
  ready: boolean;
  errors: string[];
  warnings: string[];
}

export interface QwenPaperApprovalRecord {
  source: 'qwen_7_rung_instrument' | 'team_repository_data_bridge';
  nodeId: string;

  /** Human-readable legacy provenance retained for compatibility. */
  repositorySource: string;
  sourceImageId: string;

  /** Exact source lock used by the current median-led repository bridge. */
  repositoryName: string | null;
  repositoryCommit: string | null;
  repositoryBlob: string | null;
  sourceFilename: string;

  modelId: string;
  instrumentVersion: 'qwen_7_rung_v0.3' | 'team_repository_bridge_v0.6' | 'team_repository_bridge_v0.6.1' | 'team_repository_bridge_v0.6.3';
  approvedAtIso: string;
  approvalActionProvenance: string;
}

function probabilityValues(field: {
  probabilities: {
    p1: number;
    p2: number;
    p3: number;
    p4: number;
    p5: number;
    p6: number;
    p7: number;
  };
}): number[] {
  return [
    field.probabilities.p1,
    field.probabilities.p2,
    field.probabilities.p3,
    field.probabilities.p4,
    field.probabilities.p5,
    field.probabilities.p6,
    field.probabilities.p7,
  ];
}

export function getQwenPaperApprovalReadiness(
  importedRecord: QwenCsvImportedRecord | null,
): QwenPaperApprovalReadiness {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!importedRecord) {
    return {
      ready: false,
      errors: ['No Qwen instrument record has been imported.'],
      warnings,
    };
  }

  const { run } = importedRecord;

  if (run.schema_version !== 'paper_vlm_instrument_v0.3') {
    errors.push(`Unsupported Qwen schema: ${String(run.schema_version)}.`);
  }

  if (run.model.family !== 'Qwen') {
    errors.push('Approval requires an explicitly Qwen-family source record.');
  }

  if (run.model.inference_mode !== 'one_field_per_call') {
    errors.push('Approval requires one_field_per_call inference.');
  }

  if (run.model.score_readout !== 'next_token_logits_1_to_7') {
    errors.push(
      'Approval requires real 1–7 next-token logits/probabilities; generated scalar scores are not accepted.',
    );
  }

  const isCurrentMedianLed180 =
    importedRecord.sourceProtocol.source_schema === 'MEDIAN_LED_REPOSITORY_TABLE' &&
    run.node_metadata.view_protocol === 'team_along_street_180' &&
    run.node_metadata.field_of_view_degrees === 180;

  const isTeacherCanonical90 =
    run.node_metadata.view_protocol === 'teacher_orthogonal_cardinal_90' &&
    run.node_metadata.orientation_alignment_status === 'teacher_aligned' &&
    run.node_metadata.field_of_view_degrees === 90 &&
    run.node_metadata.eye_height_m === 1.5 &&
    run.node_metadata.pitch_degrees === 0 &&
    run.node_metadata.horizon_alignment_verified;

  if (!isCurrentMedianLed180 && !isTeacherCanonical90) {
    errors.push(
      'Source view protocol is neither the verified current median-led 180° team source nor a teacher-aligned orthogonal 90° source.',
    );
  }

  if (isCurrentMedianLed180) {
    warnings.push(
      'SOURCE_PROTOCOL_VERIFIED_180: current team source uses along-street 180° directional imagery. Equivalence to the teacher orthogonal 90° analytical protocol remains unresolved and must not be implied by approval.',
    );
  }

  for (const fieldId of PAPER_VLM_FIELD_ORDER) {
    const field = run.fields[fieldId];

    if (!field) {
      errors.push(`Missing required Qwen field: ${fieldId}.`);
      continue;
    }

    const spec = getPaperVlmInstrumentFieldSpec(fieldId);

    if (field.paper_variable !== spec.paperVariable) {
      errors.push(
        `${fieldId} maps to ${field.paper_variable}; expected ${spec.paperVariable}.`,
      );
    }

    if (field.instrument_version !== 'qwen_7_rung_v0.3') {
      errors.push(
        `${fieldId} uses unsupported instrument version ${field.instrument_version}.`,
      );
    }

    if (!field.probabilities) {
      errors.push(`${fieldId} has no source-backed p1–p7 probability distribution.`);
      continue;
    }

    const probabilities = probabilityValues(field as any);

    if (
      probabilities.some(
        (value) =>
          !Number.isFinite(value) ||
          value < 0 ||
          value > 1,
      )
    ) {
      errors.push(`${fieldId} contains invalid p1–p7 values.`);
      continue;
    }

    const total = probabilities.reduce((sum, value) => sum + value, 0);

    if (Math.abs(total - 1) > 1e-3) {
      errors.push(
        `${fieldId} p1–p7 sum to ${total.toFixed(6)}, not approximately 1.`,
      );
      continue;
    }

    const reconstructedEv = probabilities.reduce(
      (sum, value, index) =>
        sum + (value / total) * (index + 1),
      0,
    );

    if (
      !Number.isFinite(field.expected_value) ||
      field.expected_value < 1 ||
      field.expected_value > 7
    ) {
      errors.push(`${fieldId} expected_value is outside [1,7].`);
    } else if (
      Math.abs(field.expected_value - reconstructedEv) > 3e-3
    ) {
      errors.push(
        `${fieldId} expected_value is inconsistent with stored p1–p7 beyond CSV rounding tolerance.`,
      );
    }

    const expectedNormalized =
      (Math.min(7, Math.max(1, field.expected_value)) - 1) / 6;

    if (
      !Number.isFinite(field.normalized_ev) ||
      Math.abs(field.normalized_ev - expectedNormalized) > 5e-4
    ) {
      errors.push(
        `${fieldId} normalized_ev is inconsistent with expected_value.`,
      );
    }

    if (
      isCurrentMedianLed180 &&
      field.continuous_readout_method === 'ORDINAL_INTERPOLATED_MEDIAN'
    ) {
      const continuous = field.continuous_readout_value;
      const normalizedContinuous = field.normalized_continuous_readout;

      if (
        typeof continuous !== 'number' ||
        !Number.isFinite(continuous) ||
        continuous < 1 ||
        continuous > 7
      ) {
        errors.push(`${fieldId} median-led continuous readout is outside [1,7].`);
      } else {
        const expectedMedianNormalized = (continuous - 1) / 6;
        if (
          typeof normalizedContinuous !== 'number' ||
          !Number.isFinite(normalizedContinuous) ||
          Math.abs(normalizedContinuous - expectedMedianNormalized) > 1e-9
        ) {
          errors.push(`${fieldId} normalized median readout is inconsistent with the source median.`);
        }

        if (field.rung !== Math.round(continuous)) {
          errors.push(`${fieldId} rung must equal round(source median) for the median-led table.`);
        }
      }
    } else if (field.rung !== Math.round(field.expected_value)) {
      errors.push(
        `${fieldId} rung must equal round(expected_value).`,
      );
    }
  }

  if (!run.complete) {
    errors.push('Qwen instrument record is not marked complete.');
  }

  if (!run.eligible_for_paper_assembly) {
    errors.push(
      'Imported record is mechanically gated from paper-variable assembly.',
    );
  }

  warnings.push(
    'Approval writes only Qwen-owned visual-semantic paper inputs. GIS H/W, geometric SVF, Space Syntax, GWR and behavioral inputs are preserved.',
  );

  warnings.push(
    'sky_openness is used only as the standardized image-based openness/enclosure proxy for the active Identity term; it is not a true whole-sky geometric SVF.',
  );

  return {
    ready: errors.length === 0,
    errors,
    warnings,
  };
}

export function buildApprovedQwenPaperInputPatch(
  importedRecord: QwenCsvImportedRecord,
): QwenPaperInputPatch {
  const readiness = getQwenPaperApprovalReadiness(importedRecord);

  if (!readiness.ready) {
    throw new Error(
      `Qwen record is not approval-ready: ${readiness.errors.join(' ')}`,
    );
  }

  const preview = buildQwenPaperBridgePreview(importedRecord);

  if (!preview) {
    throw new Error('Unable to build Qwen paper-variable preview.');
  }

  const values = new Map(
    preview.candidateValues.map((candidate) => [
      candidate.key,
      candidate.value,
    ]),
  );

  const requiredKeys: readonly QwenControlledPaperInputKey[] =
    QWEN_CONTROLLED_PAPER_INPUT_KEYS;

  for (const key of requiredKeys) {
    const value = values.get(key);

    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > 1
    ) {
      throw new Error(
        `Missing or invalid approved Qwen value for ${key}.`,
      );
    }
  }

  return {
    vlmVNat: values.get('vlmVNat') as number,
    vlmVBuilt: values.get('vlmVBuilt') as number,
    gviEye: values.get('gviEye') as number,
    gmi: values.get('gmi') as number,
    vSign: values.get('vSign') as number,
    sfv: values.get('sfv') as number,
    vPave: values.get('vPave') as number,
    gfapi: values.get('gfapi') as number,
    ias: values.get('ias') as number,
    canyonEnclosureRatio:
      values.get('canyonEnclosureRatio') as number,
  };
}

export function captureQwenControlledPaperInputs(
  inputs: PaperExternalResearchInputs,
): QwenPaperInputPatch {
  return {
    vlmVNat: inputs.vlmVNat,
    vlmVBuilt: inputs.vlmVBuilt,
    gviEye: inputs.gviEye,
    gmi: inputs.gmi,
    vSign: inputs.vSign,
    sfv: inputs.sfv,
    vPave: inputs.vPave,
    gfapi: inputs.gfapi,
    ias: inputs.ias,
    canyonEnclosureRatio: inputs.canyonEnclosureRatio,
  };
}

export function qwenControlledInputsEqual(
  a: PaperExternalResearchInputs,
  b: PaperExternalResearchInputs,
): boolean {
  return QWEN_CONTROLLED_PAPER_INPUT_KEYS.every(
    (key) => a[key] === b[key],
  );
}