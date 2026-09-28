/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ============================================================================
 * REPOSITORY PAPER-ASSEMBLY AUTHORIZATION
 * Nature 9.03 Final · No-Omega v0.6 — Team Repository Data Bridge
 * ============================================================================
 *
 * Authorizes ONLY source-backed repository values to populate paper variables.
 * Never populates Choice, Integration, GWR betas, lambda, or t_base unless
 * present in an approved source file.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  LockKeyhole,
  Database,
  FileSpreadsheet,
} from 'lucide-react';

import type {
  QwenCsvImportedRecord,
} from '../research/paperVlmQwenCsvImporter';

import {
  getQwenPaperApprovalReadiness,
  type QwenPaperApprovalRecord,
} from '../research/paperVlmQwenBridge';

import type { RepoPaperBridgeAssembly } from '../data/teamRepository/teamRepositoryTypes';

interface QwenPaperApprovalPanelProps {
  importedRecord: QwenCsvImportedRecord | null;
  repoAssembly?: RepoPaperBridgeAssembly | null;
  approval: QwenPaperApprovalRecord | null;
  onApprove: () => void;
  onRevoke: () => void;
}

export const QwenPaperApprovalPanel: React.FC<
  QwenPaperApprovalPanelProps
> = ({
  importedRecord,
  repoAssembly,
  approval,
  onApprove,
  onRevoke,
}) => {
  const [acknowledged, setAcknowledged] = useState(false);

  const readiness = useMemo(
    () => getQwenPaperApprovalReadiness(importedRecord),
    [importedRecord],
  );

  const activeNodeId = repoAssembly?.nodeId || importedRecord?.sourceIdentity.node_id || 'none';
  const activeFilename = repoAssembly?.matchedRecord.identity.sourceFilename || importedRecord?.sourceIdentity.file || 'none';
  const sourceKey = `${activeNodeId}|${activeFilename}`;

  useEffect(() => {
    setAcknowledged(false);
  }, [sourceKey]);

  const approvedCurrentRecord =
    approval &&
    ((importedRecord &&
      approval.nodeId === importedRecord.sourceIdentity.node_id &&
      approval.sourceImageId === importedRecord.sourceIdentity.file) ||
     (repoAssembly &&
      approval.nodeId === repoAssembly.nodeId &&
      approval.sourceImageId === repoAssembly.matchedRecord.identity.sourceFilename));

  const isRepoMode = Boolean(repoAssembly);
  const isUsable = repoAssembly ? repoAssembly.usableForActiveSynthesis : true;

  useEffect(() => {
    if (
      isRepoMode &&
      repoAssembly &&
      isUsable &&
      !approvedCurrentRecord
    ) {
      onApprove();
    }
  }, [
    isRepoMode,
    repoAssembly,
    isUsable,
    approvedCurrentRecord,
    onApprove,
  ]);

  return (
    <section
      id="team-repository-approval-gate"
      className="bg-white border border-emerald-200 rounded-lg p-4 shadow-xs space-y-4"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-emerald-700 text-white text-[9px] font-mono font-bold">
              APPROVAL PROVENANCE
            </span>

            <ShieldCheck className="w-4 h-4 text-emerald-700" />

            <h2 className="text-base font-bold font-mono text-stone-900">
              REPOSITORY PAPER-ASSEMBLY AUTHORIZATION
            </h2>
          </div>

          <p className="text-xs text-stone-500 mt-1 max-w-4xl">
            Valid matched repository records from the primary VLM Observations workflow are authorized automatically. This panel records the approval provenance; uncalibrated downstream variables (Space Syntax, GWR betas, stayability λ, t_base) remain strictly unpopulated.
          </p>
        </div>

        {approvedCurrentRecord ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-800 text-[9px] font-mono font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            REPOSITORY ACTIVE FOR PAPER ASSEMBLY
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-stone-200 bg-stone-50 text-stone-600 text-[9px] font-mono font-bold">
            <LockKeyhole className="w-3.5 h-3.5" />
            NOT AUTHORIZED
          </div>
        )}
      </div>

      {!importedRecord && !repoAssembly ? (
        <div className="bg-stone-50 border border-stone-200 rounded p-3 text-[10px] text-stone-600">
          No matched Team Repository record is available for automatic paper-synthesis authorization.
        </div>
      ) : (
        <>
          {/* Repository & Node Identity Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-[10px] font-mono">
            <div className="p-2.5 bg-stone-50 border border-stone-200 rounded space-y-0.5">
              <span className="text-stone-500 text-[9px]">Repository Source:</span>
              <div className="font-bold text-stone-900 truncate flex items-center gap-1">
                <Database className="w-3 h-3 text-sky-700 shrink-0" />
                <span>
                  {repoAssembly
                    ? repoAssembly.matchedRecord.identity.sourceFile
                    : 'sim_vlm.csv (direct import)'}
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-stone-50 border border-stone-200 rounded space-y-0.5">
              <span className="text-stone-500 text-[9px]">Physical Node ID:</span>
              <div className="font-bold text-stone-900 truncate">
                {repoAssembly?.nodeId || importedRecord?.sourceIdentity.node_id || 'Unknown'}
              </div>
            </div>

            <div className="p-2.5 bg-stone-50 border border-stone-200 rounded space-y-0.5">
              <span className="text-stone-500 text-[9px]">Source Filename:</span>
              <div className="font-bold text-stone-900 truncate">
                {repoAssembly?.matchedRecord.identity.sourceFilename || importedRecord?.sourceIdentity.file || 'Unknown'}
              </div>
            </div>

            <div className={`p-2.5 border rounded space-y-0.5 ${
              isUsable
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <span className="text-[9px] opacity-75">Usability Status:</span>
              <div className="font-bold flex items-center gap-1">
                {isUsable ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                    <span>SOURCE_USABLE</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3 text-rose-700" />
                    <span>SOURCE_EXCLUDED</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Variable Breakdown (Required by Section 13) */}
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 space-y-2 text-[10px] font-mono">
            <div className="font-bold text-stone-800 border-b border-stone-200 pb-1 flex items-center justify-between">
              <span>VARIABLE AUTHORIZATION SCOPE</span>
              <span className="text-[9px] text-stone-500">
                Only source-backed variables are authorized
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <div className="text-emerald-800 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Paper Variables Available ({repoAssembly?.availablePaperVariableKeys.length ?? 9}/9):</span>
                </div>
                <div className="text-stone-700 pl-4 leading-relaxed">
                  {repoAssembly ? (
                    repoAssembly.availablePaperVariableKeys.join(', ')
                  ) : (
                    'V_nat, V_built, GVI_eye, GMI, V_sign, SVF_proxy, GFAPI, V_pave, IAS'
                  )}
                </div>

                <div className="pt-1">
                  <span className="text-stone-500">Matched Qwen Record: </span>
                  <span className="font-semibold text-stone-900">
                    {repoAssembly?.matchedRecord.qwenRecord ? '7-Rung Qualitative Ratings' : importedRecord ? 'sim_vlm row' : 'None'}
                  </span>
                </div>

                <div>
                  <span className="text-stone-500">Matched Geometry Record: </span>
                  <span className="font-semibold text-stone-900">
                    {repoAssembly?.matchedRecord.geometryRecord
                      ? repoAssembly.matchedRecord.geometryRecord.isOpenOneSide
                        ? 'open_one_side (non-finite)'
                        : `H/W = ${repoAssembly.matchedRecord.geometryRecord.hwEffective?.toFixed(2) ?? 'null'}`
                      : 'None (Context Only)'}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-amber-800 font-semibold flex items-center gap-1">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-amber-700" />
                  <span>Supplementary Validation Variables:</span>
                </div>
                <div className="text-stone-700 pl-4">
                  SFV (Facade Variation) — supplementary only; never enters active M.
                </div>

                <div className="text-stone-500 font-semibold pt-1 flex items-center gap-1">
                  <LockKeyhole className="w-3.5 h-3.5 text-stone-500" />
                  <span>Excluded Downstream Variables:</span>
                </div>
                <div className="text-stone-600 pl-4 leading-relaxed text-[9px]">
                  Choice, Integration, GWR beta coefficients, stayability λ, t_base (remain unpopulated).
                </div>
              </div>
            </div>
          </div>

          {/* Exclusion Warning if unusable */}
          {!isUsable && (
            <div className="bg-rose-50 border border-rose-200 rounded p-3 text-[10px] text-rose-950 leading-relaxed flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <div>
                <strong>RECORD IS EXCLUDED IN REPOSITORY:</strong>{' '}
                {repoAssembly?.excludeReason || 'Marked unusable in source metadata'}.
                Approval for active paper synthesis is blocked.
              </div>
            </div>
          )}

          {/* Confirmation Checkbox */}
          {!approvedCurrentRecord && isUsable && !isRepoMode && (
            <label className="flex items-start gap-2 cursor-pointer border border-stone-200 rounded p-3 bg-stone-50">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(event) =>
                  setAcknowledged(event.target.checked)
                }
                className="mt-0.5"
              />

              <span className="text-[10px] text-stone-700 leading-relaxed">
                I confirm that this repository record represents the validated physical
                evidence for this node and authorize its source-backed variables to enter
                deterministic Nature 9.03 paper assembly.
              </span>
            </label>
          )}

          {!approvedCurrentRecord && isRepoMode && isUsable && (
            <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-[10px] text-emerald-900 font-mono">
              AUTO-AUTHORIZATION ENABLED · matched repository evidence is being authorized automatically.
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {!approvedCurrentRecord && !isRepoMode && (
              <button
                type="button"
                disabled={!isUsable || !acknowledged}
                onClick={onApprove}
                className="inline-flex items-center gap-2 px-4 py-2 rounded bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 disabled:text-stone-500 text-white text-[10px] font-mono font-bold"
              >
                <ShieldCheck className="w-4 h-4" />
                AUTHORIZE REPOSITORY FOR PAPER ASSEMBLY
              </button>
            )}

            {approvedCurrentRecord && (
              <button
                type="button"
                onClick={onRevoke}
                className="inline-flex items-center gap-2 px-4 py-2 rounded border border-rose-300 bg-white hover:bg-rose-50 text-rose-800 text-[10px] font-mono font-bold"
              >
                <RotateCcw className="w-4 h-4" />
                REVOKE REPOSITORY APPROVAL
              </button>
            )}
          </div>

          {approval && (
            <div className="bg-stone-900 text-white rounded p-3 text-[9px] font-mono grid grid-cols-1 md:grid-cols-2 gap-1">
              <span>Source: {approval.source}</span>
              <span>Instrument: {approval.instrumentVersion}</span>
              <span>Node: {approval.nodeId}</span>
              <span>Approved: {approval.approvedAtIso}</span>
              {approval.repositoryCommit && (
                <span>Commit: {approval.repositoryCommit}</span>
              )}
              {approval.repositoryBlob && (
                <span>Blob: {approval.repositoryBlob}</span>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
};
