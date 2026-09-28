import {
  PUBLIC_VLM_CAPTURE_PROTOCOL,
  PUBLIC_VLM_COMMENTARY_DECODING,
  PUBLIC_VLM_COMMENTARY_MAX_NEW_TOKENS,
  PUBLIC_VLM_COMMENTARY_PROMPT_ID,
  PUBLIC_VLM_COMMENTARY_QUESTION,
  PUBLIC_VLM_COMMENTARY_ROLE,
  PUBLIC_VLM_COMMENTARY_SCORE_DEPENDENCY,
  PUBLIC_VLM_COMMENTARY_SOURCE_BLOB,
  PUBLIC_VLM_COMMENTARY_SOURCE_COMMIT,
  PUBLIC_VLM_COMMENTARY_SOURCE_PATH,
  PUBLIC_VLM_COMMENTARY_SOURCE_REPOSITORY,
  PUBLIC_VLM_CONTRACT_VERSION,
  PUBLIC_VLM_FIELD_IDS,
  PUBLIC_VLM_MANUSCRIPT_TERMS,
  PUBLIC_VLM_MAST_POLICY,
  PUBLIC_VLM_MAX_PIXELS,
  PUBLIC_VLM_MODEL_ID,
  PUBLIC_VLM_MODEL_REVISION,
  PUBLIC_VLM_PROCESSOR_POLICY,
  PUBLIC_VLM_READOUT,
  PUBLIC_VLM_RUNTIME_LOCK_ID,
  PUBLIC_VLM_RUNTIME_VERSIONS,
  PUBLIC_VLM_SOURCE_BLOBS,
  PUBLIC_VLM_SOURCE_COMMIT,
  PUBLIC_VLM_SOURCE_REPOSITORY,
  type PublicVlmAnalyzeSuccess,
  type PublicVlmFieldId,
} from '../src/publicVlmContract';

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function validProbabilityArray(
  value: unknown,
): value is [number, number, number, number, number, number, number] {
  if (!Array.isArray(value) || value.length !== 7) return false;
  if (!value.every((p) => typeof p === 'number' && Number.isFinite(p) && p >= 0 && p <= 1)) {
    return false;
  }
  const sum = value.reduce((a, b) => a + b, 0);
  return Math.abs(sum - 1) <= 0.002;
}

export function explainPublicVlmAnalyzeMismatch(value: unknown): string[] {
  const issues: string[] = [];
  const v = asRecord(value);
  if (!v) {
    return ['PAYLOAD_NOT_OBJECT'];
  }

  if (v.success !== true) issues.push('SUCCESS_FLAG_NOT_TRUE');
  if (v.stage !== 'VLM_COMPLETE') issues.push(`STAGE_MISMATCH: expected VLM_COMPLETE, got ${String(v.stage)}`);
  if (typeof v.requestId !== 'string' || v.requestId.length === 0) issues.push('MISSING_OR_EMPTY_REQUEST_ID');

  if (!Array.isArray(v.fields)) {
    issues.push('FIELDS_NOT_ARRAY');
  } else if (v.fields.length !== PUBLIC_VLM_FIELD_IDS.length) {
    issues.push(`FIELDS_COUNT_MISMATCH: expected ${PUBLIC_VLM_FIELD_IDS.length}, got ${v.fields.length}`);
  } else {
    const byId = new Map<string, JsonRecord>();
    for (const rawField of v.fields) {
      const field = asRecord(rawField);
      if (field && typeof field.fieldId === 'string') {
        byId.set(field.fieldId, field);
      }
    }

    for (const fieldId of PUBLIC_VLM_FIELD_IDS) {
      const field = byId.get(fieldId);
      if (!field) {
        issues.push(`MISSING_FIELD: ${fieldId}`);
        continue;
      }
      if (field.manuscriptTerm !== PUBLIC_VLM_MANUSCRIPT_TERMS[fieldId]) {
        issues.push(`MANUSCRIPT_TERM_MISMATCH: ${fieldId} expected ${PUBLIC_VLM_MANUSCRIPT_TERMS[fieldId]}, got ${String(field.manuscriptTerm)}`);
      }
      if (!validProbabilityArray(field.probabilities)) {
        issues.push(`INVALID_PROBABILITIES: ${fieldId}`);
      }
      const numKeys = ['surveyRoundEv', 'expectedValue', 'argmax', 'readoutMedian', 'normalized01'] as const;
      for (const k of numKeys) {
        if (typeof field[k] !== 'number' || !Number.isFinite(field[k])) {
          issues.push(`NON_FINITE_NUMERIC: ${fieldId}.${k}`);
        }
      }
      const surveyRoundEv = field.surveyRoundEv as number;
      const argmax = field.argmax as number;
      const readoutMedian = field.readoutMedian as number;
      const normalized01 = field.normalized01 as number;

      if (surveyRoundEv < 1 || surveyRoundEv > 7) issues.push(`OUT_OF_RANGE_SURVEY_EV: ${fieldId}`);
      if (argmax < 1 || argmax > 7) issues.push(`OUT_OF_RANGE_ARGMAX: ${fieldId}`);
      if (readoutMedian < 0.5 || readoutMedian > 7.5) issues.push(`OUT_OF_RANGE_READOUT_MEDIAN: ${fieldId}`);
      if (normalized01 < 0 || normalized01 > 1) issues.push(`OUT_OF_RANGE_NORMALIZED01: ${fieldId}`);
    }
  }

  if (v.commentary !== undefined) {
    const commentary = asRecord(v.commentary);
    if (!commentary) {
      issues.push('COMMENTARY_NOT_OBJECT');
    } else {
      if (commentary.status !== 'ready' && commentary.status !== 'unavailable') issues.push('COMMENTARY_STATUS_INVALID');
      if (commentary.promptId !== PUBLIC_VLM_COMMENTARY_PROMPT_ID) issues.push('COMMENTARY_PROMPT_ID_MISMATCH');
      if (commentary.question !== PUBLIC_VLM_COMMENTARY_QUESTION) issues.push('COMMENTARY_QUESTION_MISMATCH');
      if (commentary.role !== PUBLIC_VLM_COMMENTARY_ROLE) issues.push('COMMENTARY_ROLE_MISMATCH');
      if (commentary.scoreDependency !== PUBLIC_VLM_COMMENTARY_SCORE_DEPENDENCY) issues.push('COMMENTARY_SCORE_DEPENDENCY_MISMATCH');
      if (commentary.decoding !== PUBLIC_VLM_COMMENTARY_DECODING) issues.push('COMMENTARY_DECODING_MISMATCH');
      if (commentary.maxNewTokens !== PUBLIC_VLM_COMMENTARY_MAX_NEW_TOKENS) issues.push('COMMENTARY_MAX_NEW_TOKENS_MISMATCH');
      if (commentary.status === 'ready' && (typeof commentary.scene !== 'string' || commentary.scene.trim().length === 0)) {
        issues.push('COMMENTARY_READY_WITHOUT_SCENE');
      }
      if (commentary.status === 'unavailable' && commentary.scene !== null) issues.push('COMMENTARY_UNAVAILABLE_WITH_SCENE');

      const source = asRecord(commentary.source);
      if (!source) {
        issues.push('COMMENTARY_SOURCE_MISSING');
      } else {
        if (source.repository !== PUBLIC_VLM_COMMENTARY_SOURCE_REPOSITORY) issues.push('COMMENTARY_SOURCE_REPOSITORY_MISMATCH');
        if (source.commit !== PUBLIC_VLM_COMMENTARY_SOURCE_COMMIT) issues.push('COMMENTARY_SOURCE_COMMIT_MISMATCH');
        if (source.path !== PUBLIC_VLM_COMMENTARY_SOURCE_PATH) issues.push('COMMENTARY_SOURCE_PATH_MISMATCH');
        if (source.blob !== PUBLIC_VLM_COMMENTARY_SOURCE_BLOB) issues.push('COMMENTARY_SOURCE_BLOB_MISMATCH');
      }
    }
  }

  const inst = asRecord(v.instrument);
  if (!inst) {
    issues.push('MISSING_INSTRUMENT');
  } else {
    if (inst.modelId !== PUBLIC_VLM_MODEL_ID) issues.push(`MODEL_ID_MISMATCH: ${String(inst.modelId)}`);
    if (inst.modelRevision !== PUBLIC_VLM_MODEL_REVISION) issues.push(`MODEL_REVISION_MISMATCH: ${String(inst.modelRevision)}`);
    if (inst.processorPolicy !== PUBLIC_VLM_PROCESSOR_POLICY) issues.push(`PROCESSOR_POLICY_MISMATCH: ${String(inst.processorPolicy)}`);
    if (typeof inst.processorClass !== 'string' || !inst.processorClass) issues.push('MISSING_PROCESSOR_CLASS');
    if (inst.runtimeLockId !== PUBLIC_VLM_RUNTIME_LOCK_ID) issues.push(`INSTRUMENT_RUNTIME_LOCK_MISMATCH: ${String(inst.runtimeLockId)}`);
    if (inst.fieldCount !== 10) issues.push(`FIELD_COUNT_MISMATCH: ${String(inst.fieldCount)}`);
    if (inst.anchorsPerField !== 7) issues.push(`ANCHORS_COUNT_MISMATCH: ${String(inst.anchorsPerField)}`);
    if (inst.readout !== PUBLIC_VLM_READOUT) issues.push(`READOUT_MISMATCH: ${String(inst.readout)}`);
    if (inst.maxPixels !== PUBLIC_VLM_MAX_PIXELS) issues.push(`MAX_PIXELS_MISMATCH: ${String(inst.maxPixels)}`);
    if (inst.captureProtocol !== PUBLIC_VLM_CAPTURE_PROTOCOL) issues.push(`CAPTURE_PROTOCOL_MISMATCH: ${String(inst.captureProtocol)}`);
    if (inst.mastPolicy !== PUBLIC_VLM_MAST_POLICY) issues.push(`MAST_POLICY_MISMATCH: ${String(inst.mastPolicy)}`);
  }

  const prov = asRecord(v.provenance);
  if (!prov) {
    issues.push('MISSING_PROVENANCE');
  } else {
    if (prov.repository !== PUBLIC_VLM_SOURCE_REPOSITORY) issues.push(`REPOSITORY_MISMATCH: ${String(prov.repository)}`);
    if (prov.commit !== PUBLIC_VLM_SOURCE_COMMIT) issues.push(`COMMIT_MISMATCH: ${String(prov.commit)}`);
    if (prov.contractVersion !== PUBLIC_VLM_CONTRACT_VERSION) issues.push(`PROVENANCE_CONTRACT_MISMATCH: ${String(prov.contractVersion)}`);
    if (prov.runtimeLockId !== PUBLIC_VLM_RUNTIME_LOCK_ID) issues.push(`PROVENANCE_RUNTIME_LOCK_MISMATCH: ${String(prov.runtimeLockId)}`);

    const sourceBlobs = asRecord(prov.sourceBlobs);
    if (!sourceBlobs) {
      issues.push('MISSING_SOURCE_BLOBS');
    } else {
      for (const [key, expected] of Object.entries(PUBLIC_VLM_SOURCE_BLOBS)) {
        if (sourceBlobs[key] !== expected) {
          issues.push(`SOURCE_BLOB_MISMATCH: ${key}`);
        }
      }
    }

    const runtimeVersions = asRecord(prov.runtimeVersions);
    if (!runtimeVersions) {
      issues.push('MISSING_RUNTIME_VERSIONS');
    } else {
      for (const [key, expected] of Object.entries(PUBLIC_VLM_RUNTIME_VERSIONS)) {
        if (runtimeVersions[key] !== expected) {
          issues.push(`RUNTIME_VERSION_MISMATCH: ${key}`);
        }
      }
    }
  }

  return issues;
}

export function isPublicVlmAnalyzeSuccess(value: unknown): value is PublicVlmAnalyzeSuccess {
  return explainPublicVlmAnalyzeMismatch(value).length === 0;
}
