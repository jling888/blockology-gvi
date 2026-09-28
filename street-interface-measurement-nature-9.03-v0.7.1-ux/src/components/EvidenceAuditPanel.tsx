/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VlmStreetscapeEvaluationV31, MechanicalAuditResult } from '../types';
import { ShieldCheck, AlertOctagon, CheckCircle, AlertTriangle, FileCheck, Search } from 'lucide-react';

interface EvidenceAuditPanelProps {
  evaluation: VlmStreetscapeEvaluationV31;
  mechanicalAudit: MechanicalAuditResult;
}

export const EvidenceAuditPanel: React.FC<EvidenceAuditPanelProps> = ({
  evaluation,
  mechanicalAudit
}) => {
  const modelAuditPassed = evaluation.audit_status === 'pass';
  const mechanicalAuditPassed = mechanicalAudit.overallStatus === 'pass';

  return (
    <section className="bg-white border border-stone-200 rounded-lg p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-stone-200">
        <div>
          <h3 className="text-sm font-bold font-mono text-stone-900 uppercase tracking-tight flex items-center gap-2">
            <span>EVIDENCE AUDIT & DUAL VALIDATION</span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Strict verification of the frozen Pixel-Classification-Primary evidence hierarchy (Pixel Classification Primary vs Original Clarification).
          </p>
        </div>

        {/* Dual Status Badges */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          {/* MODEL AUDIT BADGE */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded border font-bold ${
              modelAuditPassed
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-200'
            }`}
          >
            {modelAuditPassed ? (
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
            )}
            <span>MODEL AUDIT:</span>
            <span>{modelAuditPassed ? 'PASS' : 'REVIEW REQUIRED'}</span>
          </div>

          {/* MECHANICAL AUDIT BADGE */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded border font-bold ${
              mechanicalAuditPassed
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-200'
            }`}
          >
            {mechanicalAuditPassed ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            )}
            <span>MECHANICAL AUDIT:</span>
            <span>{mechanicalAuditPassed ? 'PASS' : 'REVIEW REQUIRED'}</span>
          </div>
        </div>
      </div>

      {/* Audit Detail Content Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        {/* Left Column: Qualitative Evidence Trail */}
        <div className="space-y-3">
          <div className="bg-stone-50 p-3 rounded-md border border-stone-200">
            <span className="text-[10px] font-mono uppercase font-bold text-stone-500 block mb-1">
              original_secondary_contribution (Permitted Clarification)
            </span>
            <p className="text-xs text-stone-800 leading-relaxed">
              {evaluation.original_secondary_contribution || 'None'}
            </p>
          </div>

          <div className="bg-amber-50/40 p-3 rounded-md border border-amber-200">
            <span className="text-[10px] font-mono uppercase font-bold text-amber-800 block mb-1">
              original_only_observations (Strictly Excluded from Scoring)
            </span>
            <p className="text-xs text-stone-800 leading-relaxed">
              {evaluation.original_only_observations || 'No Original-only features noted.'}
            </p>
          </div>

          <div className="bg-stone-50 p-3 rounded-md border border-stone-200">
            <span className="text-[10px] font-mono uppercase font-bold text-stone-500 block mb-1">
              classification_limitations (Segmentation Artifacts / Gaps)
            </span>
            <p className="text-xs text-stone-800 leading-relaxed">
              {evaluation.classification_limitations || 'None reported.'}
            </p>
          </div>
        </div>

        {/* Right Column: Score Change & Isolation Verification */}
        <div className="space-y-3">
          <div className="bg-stone-50 p-3 rounded-md border border-stone-200">
            <span className="text-[10px] font-mono uppercase font-bold text-stone-500 block mb-1">
              score_change_summary
            </span>
            <p className="text-xs font-mono text-stone-800 leading-relaxed">
              {evaluation.score_change_summary || 'None'}
            </p>
          </div>

          <div className="bg-stone-50 p-3 rounded-md border border-stone-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-stone-500 block">
                original_only_evidence_used_for_score
              </span>
              <span className="text-xs text-stone-600">Protocol constraint violation check</span>
            </div>
            <span
              className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                evaluation.original_only_evidence_used_for_score === false
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {evaluation.original_only_evidence_used_for_score ? 'TRUE (VIOLATION)' : 'FALSE (COMPLIANT)'}
            </span>
          </div>

          <div className="bg-stone-50 p-3 rounded-md border border-stone-200">
            <span className="text-[10px] font-mono uppercase font-bold text-stone-500 block mb-1">
              uncertainty (Spatial & Perceptual Ambiguity Assessment)
            </span>
            <p className="text-xs text-stone-800 leading-relaxed">
              {evaluation.uncertainty || 'None recorded.'}
            </p>
          </div>
        </div>
      </div>

      {/* Mechanical Audit Rules Card (Section 11) */}
      <div className="border border-stone-300 rounded-md bg-stone-50/50 p-4">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-stone-700" />
            <h4 className="text-xs font-bold font-mono text-stone-900 uppercase">
              DETERMINISTIC APPLICATION-SIDE MECHANICAL AUDIT
            </h4>
          </div>
          <span className="text-[11px] font-mono text-stone-500">
            4 Rules Executed Deterministically in Code
          </span>
        </div>

        <div className="space-y-2">
          {mechanicalAudit.checks.map((check) => {
            const isPass = check.status === 'pass';

            return (
              <div
                key={check.id}
                className={`p-2.5 rounded border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  isPass
                    ? 'bg-white border-stone-200'
                    : 'bg-rose-50/80 border-rose-300 text-rose-900'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-mono font-semibold text-stone-800">
                    <span className={isPass ? 'text-emerald-700' : 'text-rose-700'}>
                      {check.ruleName}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 font-sans">
                    {check.detail}
                  </p>
                </div>

                <div className="shrink-0">
                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      isPass
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    {isPass ? 'PASS' : 'REVIEW REQUIRED'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
