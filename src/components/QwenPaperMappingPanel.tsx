import React, { useMemo } from 'react';
import {
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
} from 'lucide-react';

import type {
  PaperVlmV30Measurement,
} from '../types';

import type {
  QwenCsvImportedRecord,
} from '../research/paperVlmQwenCsvImporter';

import {
  buildQwenPaperBridgePreview,
  type QwenPaperVariableCandidate,
} from '../research/paperVlmQwenBridge';

interface QwenPaperMappingPanelProps {
  importedRecord: QwenCsvImportedRecord | null;
  teacherMeasurement: PaperVlmV30Measurement | null;

  /**
   * Filename of the exact image currently analyzed by the APP / Teacher
   * one-shot comparator. Cross-model deltas are only valid when this matches
   * the imported Qwen source image basename.
   */
  appSourceFilename: string | null;
}

function format(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toFixed(3)
    : '—';
}


function basename(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }

  const normalized = path.replace(/\\/g, '/');
  const last = normalized.split('/').pop()?.trim();

  return last || null;
}

function normalizedFilename(name: string | null | undefined): string | null {
  const base = basename(name);

  return base ? base.toLowerCase() : null;
}

/**
 * Display-only filename signature used to detect a narrow naming discrepancy:
 * leading zero-padding on the first numeric token (e.g. 01_... vs 001_...).
 *
 * IMPORTANT: this signature NEVER upgrades the source-image match gate. Exact
 * basename equality remains the only condition that authorizes cross-model
 * comparison. The signature exists only to tell the researcher when a manual
 * canonical-filename reconciliation may be appropriate after source identity
 * is independently verified.
 */
function zeroPaddingInsensitiveFilename(
  name: string | null | undefined,
): string | null {
  const normalized = normalizedFilename(name);

  if (!normalized) {
    return null;
  }

  return normalized.replace(/^(\d+)(?=_)/, (digits) => {
    const parsed = Number.parseInt(digits, 10);
    return Number.isFinite(parsed) ? String(parsed) : digits;
  });
}

function teacherValue(
  candidate: QwenPaperVariableCandidate,
  teacher: PaperVlmV30Measurement | null,
): number | null {
  if (!teacher) {
    return null;
  }

  const n = teacher.natural_environs_imageability;
  const m = teacher.morphological_containment_identity;
  const p = teacher.physical_utility_dependence;

  switch (candidate.key) {
    case 'vlmVNat':
      return n.v_nat_score;
    case 'vlmVBuilt':
      return m.v_built_score;
    case 'gviEye':
      return n.gvi_eye_score;
    case 'gmi':
      return n.gmi_score;
    case 'vSign':
      return m.v_sign_score;
    case 'vPave':
      return p.v_pave_score;
    case 'gfapi':
      return p.gfapi_score;
    case 'ias':
      return p.ias_score;
    case 'canyonEnclosureRatio':
      return m.canyon_enclosure_ratio;
    case 'sfv':
      // Teacher Appendix strict JSON currently has no dedicated SFV field.
      return null;
    default:
      return null;
  }
}

function difference(
  qwen: number,
  teacher: number | null,
): number | null {
  if (teacher === null) {
    return null;
  }

  return qwen - teacher;
}

export const QwenPaperMappingPanel: React.FC<QwenPaperMappingPanelProps> = ({
  importedRecord,
  teacherMeasurement,
  appSourceFilename,
}) => {
  const preview = useMemo(
    () => buildQwenPaperBridgePreview(importedRecord),
    [importedRecord],
  );


  const qwenSourceFilename = importedRecord?.sourceIdentity.file ?? null;

  const sourceMatch =
    normalizedFilename(appSourceFilename) !== null &&
    normalizedFilename(appSourceFilename) ===
      normalizedFilename(qwenSourceFilename);

  const zeroPaddingOnlyCandidate =
    !sourceMatch &&
    zeroPaddingInsensitiveFilename(appSourceFilename) !== null &&
    zeroPaddingInsensitiveFilename(appSourceFilename) ===
      zeroPaddingInsensitiveFilename(qwenSourceFilename);

  const comparisonEligible =
    Boolean(teacherMeasurement) &&
    Boolean(importedRecord) &&
    sourceMatch;

  if (!preview) {
    return (
      <section className="bg-white border border-stone-200 rounded-lg p-4 shadow-xs">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-stone-500" />
          <h2 className="text-sm font-bold font-mono text-stone-800">
            Qwen → Paper Mapping Preview
          </h2>
        </div>

        <p className="text-[10px] text-stone-500 mt-2">
          Import one valid Qwen instrument row above to preview its teacher-paper
          variable mapping. Nothing in this panel writes into SIM.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white border border-indigo-200 rounded-lg p-4 shadow-xs space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-indigo-700 text-white text-[9px] font-mono font-bold">
              PAPER MAPPING
            </span>

            <ArrowRightLeft className="w-4 h-4 text-indigo-700" />

            <h2 className="text-base font-bold font-mono text-stone-900">
              Qwen → Canonical Paper Variable Mapping
            </h2>
          </div>

          <p className="text-xs text-stone-500 mt-1 max-w-4xl">
            Preview of normalized Qwen expected values mapped into the Nature 9.02
            paper-variable contract. Teacher Gemma one-shot values and deltas
            are shown only when the APP and Qwen records resolve to the exact
            same source-image filename.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[9px] font-mono">
          {preview.eligibleForBridgePreview ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="px-2 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-800 font-bold">
                QWEN BRIDGE ELIGIBLE
              </span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="px-2 py-1 rounded border border-amber-200 bg-amber-50 text-amber-900 font-bold">
                QWEN BRIDGE GATED
              </span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-[10px]">
        <div className="bg-indigo-50 border border-indigo-200 rounded p-3">
          <div className="font-mono font-bold text-indigo-900 uppercase">
            Qwen source
          </div>
          <div className="mt-1 text-indigo-950">
            Node: <span className="font-mono">{preview.sourceNodeId}</span>
          </div>
          <div className="mt-0.5 text-indigo-950 break-all">
            Image: <span className="font-mono">{preview.sourceImageId}</span>
          </div>
        </div>

        <div
          className={`border rounded p-3 ${
            sourceMatch
              ? 'bg-emerald-50 border-emerald-200'
              : zeroPaddingOnlyCandidate
                ? 'bg-amber-50 border-amber-200'
                : 'bg-rose-50 border-rose-200'
          }`}
        >
          <div
            className={`flex items-center gap-1.5 font-mono font-bold uppercase ${
              sourceMatch
                ? 'text-emerald-900'
                : zeroPaddingOnlyCandidate
                  ? 'text-amber-900'
                  : 'text-rose-900'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Source image match gate
          </div>

          <div className="mt-2 grid grid-cols-1 gap-1 text-[9px] font-mono">
            <div>
              APP source:{' '}
              <strong>{basename(appSourceFilename) || 'UNRESOLVED'}</strong>
            </div>
            <div>
              Qwen source:{' '}
              <strong>{basename(qwenSourceFilename) || 'UNRESOLVED'}</strong>
            </div>
          </div>

          <p
            className={`mt-2 leading-relaxed ${
              sourceMatch
                ? 'text-emerald-950'
                : zeroPaddingOnlyCandidate
                  ? 'text-amber-950'
                  : 'text-rose-950'
            }`}
          >
            {sourceMatch
              ? 'Exact source filename match confirmed. Gemma ↔ Qwen comparison values may be displayed.'
              : zeroPaddingOnlyCandidate
                ? 'Exact source filename match is still NOT confirmed. The two basenames differ only in leading numeric zero-padding (for example 01_... versus 001_...). Treat this as a canonical-filename normalization candidate only: comparison remains blocked until source identity is independently verified and both records use the exact same canonical filename.'
                : 'Source images do not match exactly. Gemma values and Qwen−Gemma deltas are suppressed because cross-image comparison is not methodologically valid.'}
          </p>

          {zeroPaddingOnlyCandidate && (
            <div className="mt-2 inline-flex px-2 py-0.5 rounded border border-amber-300 bg-amber-100 text-amber-950 text-[8px] font-mono font-bold uppercase">
              ZERO-PADDING NAME CANDIDATE — GATE REMAINS BLOCKED
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto border border-stone-200 rounded">
        <table className="w-full min-w-[1050px] text-left">
          <thead className="bg-stone-100 border-b border-stone-200">
            <tr className="text-[9px] font-mono uppercase text-stone-500">
              <th className="px-3 py-2">Paper Variable</th>
              <th className="px-3 py-2">Qwen Field</th>
              <th className="px-3 py-2">Transform</th>
              <th className="px-3 py-2 text-right">Qwen Candidate</th>
              <th className="px-3 py-2 text-right">Teacher Gemma · matched source only</th>
              <th className="px-3 py-2 text-right">Δ Qwen−Gemma · matched only</th>
              <th className="px-3 py-2">Research Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-100">
            {preview.candidateValues.map((candidate) => {
              const teacher = comparisonEligible
                ? teacherValue(
                    candidate,
                    teacherMeasurement,
                  )
                : null;

              const delta = comparisonEligible
                ? difference(candidate.value, teacher)
                : null;

              return (
                <tr key={candidate.key} className="text-[10px] align-top">
                  <td className="px-3 py-2">
                    <div className="font-mono font-bold text-stone-900">
                      {candidate.paperLabel}
                    </div>
                  </td>

                  <td className="px-3 py-2 font-mono text-stone-700">
                    {candidate.sourceField}
                  </td>

                  <td className="px-3 py-2 font-mono text-stone-600">
                    {candidate.transform === 'normalized_ev'
                      ? '(EV−1)/6'
                      : '1−[(EV−1)/6]'}
                  </td>

                  <td className="px-3 py-2 text-right font-mono font-bold text-indigo-800">
                    {format(candidate.value)}
                  </td>

                  <td className="px-3 py-2 text-right font-mono">
                    {format(teacher)}
                  </td>

                  <td
                    className={`px-3 py-2 text-right font-mono ${
                      delta === null
                        ? 'text-stone-400'
                        : Math.abs(delta) >= 0.2
                          ? 'text-rose-700 font-bold'
                          : Math.abs(delta) >= 0.1
                            ? 'text-amber-700 font-bold'
                            : 'text-stone-700'
                    }`}
                  >
                    {delta === null
                      ? '—'
                      : `${delta >= 0 ? '+' : ''}${delta.toFixed(3)}`}
                  </td>

                  <td className="px-3 py-2">
                    <div
                      className={`inline-flex px-2 py-0.5 rounded border text-[8px] font-mono font-bold uppercase ${
                        candidate.researchStatus ===
                        'proxy_not_true_svf'
                          ? 'bg-amber-50 text-amber-900 border-amber-200'
                          : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                      }`}
                    >
                      {candidate.researchStatus.replace(/_/g, ' ')}
                    </div>

                    <div className="mt-1 text-[9px] text-stone-500 leading-relaxed max-w-md">
                      {candidate.notes}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {preview.warnings.length > 0 && (
        <div className="bg-stone-50 border border-stone-200 rounded p-3">
          <div className="text-[9px] font-mono font-bold uppercase text-stone-600 mb-1">
            Bridge warnings
          </div>

          <ul className="list-disc pl-5 space-y-1 text-[10px] text-stone-600">
            {preview.warnings.map((warning, index) => (
              <li key={`${index}-${warning}`}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-stone-900 text-white rounded p-3 text-[10px] leading-relaxed">
        <strong className="font-mono">SOURCE-MATCH SAFETY:</strong>{' '}
        this table never compares different images. If APP source filename and
        imported Qwen source filename do not match exactly, Teacher Gemma and
        Δ columns remain blank. A zero-padding-only naming difference may be
        flagged as a manual canonical-filename reconciliation candidate, but it
        never auto-passes the gate. The panel still does not mutate
        <span className="font-mono"> paperExternalInputs</span> or recalculate
        SIM from Qwen.
      </div>
    </section>
  );
};
