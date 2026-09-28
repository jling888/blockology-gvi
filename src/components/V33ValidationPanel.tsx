/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileCheck
} from 'lucide-react';
import { ResearchSectionHeader } from './ResearchSectionHeader';
import { StatusBadge } from './StatusBadge';
import { V33StreetInterfaceMeasurement, V33MechanicalAuditResult } from '../types';

interface V33ValidationPanelProps {
  candidateResult: V33StreetInterfaceMeasurement | null;
  mechanicalAudit: V33MechanicalAuditResult | null;
}

export const V33ValidationPanel: React.FC<V33ValidationPanelProps> = ({
  candidateResult,
  mechanicalAudit,
}) => {
  const [showMechanicalDetails, setShowMechanicalDetails] = useState<boolean>(false);

  const hasRun = candidateResult !== null;
  const modelAuditPassed = candidateResult?.evidence_audit?.audit_status === 'pass';
  const mechanicalAuditPassed = mechanicalAudit?.overallStatus === 'pass';
  const overallValidatedPass = hasRun && modelAuditPassed && mechanicalAuditPassed;

  const evidenceAudit = candidateResult?.evidence_audit;

  const passedCount =
    mechanicalAudit?.checks.filter((check) => check.status === 'pass').length ?? 0;
  const totalCount =
    mechanicalAudit?.checks.length ?? 0;

  const renderOriginalOnlyUsed = () => {
    if (!hasRun || !evidenceAudit) return '—';
    if (evidenceAudit.original_only_evidence_used_for_measurement === true) {
      return (
        <span className="text-rose-700 font-bold font-mono">
          TRUE — REVIEW REQUIRED
        </span>
      );
    }
    return (
      <span className="text-emerald-700 font-bold font-mono">
        FALSE — COMPLIANT
      </span>
    );
  };

  return (
    <section className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
      <ResearchSectionHeader
        title="Validation"
        subtitle="Dual-audit verification isolating VLM reasoning from deterministic rules."
        icon={ShieldCheck}
      />

      {/* Top 3 Compact Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {/* 1. Model Audit */}
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-stone-500 uppercase font-semibold">
            Model Audit
          </span>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-xs font-bold text-stone-900 font-sans">
              Internal VLM Audit
            </span>
            <StatusBadge
              status={!hasRun ? 'neutral' : modelAuditPassed ? 'pass' : 'review'}
              label={!hasRun ? 'NOT RUN' : modelAuditPassed ? 'PASS' : 'REVIEW REQUIRED'}
              size="sm"
            />
          </div>
        </div>

        {/* 2. Mechanical Audit */}
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-stone-500 uppercase font-semibold">
            Mechanical Audit
          </span>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-xs font-bold text-stone-900 font-sans">
              Deterministic Rules A–K
            </span>
            <StatusBadge
              status={!hasRun ? 'neutral' : mechanicalAuditPassed ? 'pass' : 'review'}
              label={!hasRun ? 'NOT RUN' : mechanicalAuditPassed ? 'PASS' : 'REVIEW REQUIRED'}
              size="sm"
            />
          </div>
        </div>

        {/* 3. Overall Dual-Audit */}
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-stone-500 uppercase font-semibold">
            Overall Status
          </span>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-xs font-bold text-stone-900 font-sans">
              Dual-Audit Result
            </span>
            <StatusBadge
              status={!hasRun ? 'neutral' : overallValidatedPass ? 'pass' : 'review'}
              label={!hasRun ? 'NOT RUN' : overallValidatedPass ? 'VALIDATED PASS' : 'REVIEW REQUIRED'}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Evidence Audit Summary (Compact Horizontal Box) */}
      <div className="bg-stone-50/60 border border-stone-200 rounded-lg p-3.5 mb-3 text-xs">
        <div className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider mb-2">
          Evidence Audit Summary
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-sans">
          {/* Secondary Contribution */}
          <div className="bg-white border border-stone-200 rounded p-2.5">
            <span className="text-[10px] font-mono text-stone-400 block uppercase">
              Secondary Contribution
            </span>
            <span
              className="font-semibold text-stone-800 block text-xs mt-0.5 truncate"
              title={evidenceAudit?.original_secondary_contribution || (hasRun ? 'None' : '—')}
            >
              {evidenceAudit?.original_secondary_contribution || (hasRun ? 'None' : '—')}
            </span>
          </div>

          {/* Original-Only Observations */}
          <div className="bg-white border border-stone-200 rounded p-2.5">
            <span className="text-[10px] font-mono text-stone-400 block uppercase">
              Original-Only Observations
            </span>
            <span
              className="font-semibold text-stone-800 block text-xs mt-0.5 truncate"
              title={evidenceAudit?.original_only_observations || (hasRun ? 'None' : '—')}
            >
              {evidenceAudit?.original_only_observations || (hasRun ? 'None' : '—')}
            </span>
          </div>

          {/* Classification Limitations */}
          <div className="bg-white border border-stone-200 rounded p-2.5">
            <span className="text-[10px] font-mono text-stone-400 block uppercase">
              Classification Limitations
            </span>
            <span
              className="font-semibold text-stone-800 block text-xs mt-0.5 truncate"
              title={evidenceAudit?.classification_limitations || (hasRun ? 'None reported' : '—')}
            >
              {evidenceAudit?.classification_limitations || (hasRun ? 'None reported' : '—')}
            </span>
          </div>

          {/* Uncertainty */}
          <div className="bg-white border border-stone-200 rounded p-2.5">
            <span className="text-[10px] font-mono text-stone-400 block uppercase">
              Uncertainty
            </span>
            <span
              className="font-semibold text-stone-800 block text-xs mt-0.5 truncate"
              title={evidenceAudit?.uncertainty || (hasRun ? 'None reported' : '—')}
            >
              {evidenceAudit?.uncertainty || (hasRun ? 'None reported' : '—')}
            </span>
          </div>

          {/* Original-Only Evidence Used */}
          <div className="bg-white border border-stone-200 rounded p-2.5">
            <span className="text-[10px] font-mono text-stone-400 block uppercase">
              Original-Only Evidence Used
            </span>
            <div className="mt-0.5">
              {renderOriginalOnlyUsed()}
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Mechanical Audit Details (Rules A-K) */}
      <div className="border-t border-stone-200 pt-2">
        <button
          onClick={() => setShowMechanicalDetails(!showMechanicalDetails)}
          className="w-full flex items-center justify-between text-xs font-mono font-medium text-stone-600 hover:text-stone-900 transition-colors py-1 cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-stone-500" />
            <span>
              {showMechanicalDetails ? 'Hide Mechanical Audit Details' : 'View Mechanical Audit Details (Rules A–K)'}
            </span>
            {hasRun && mechanicalAudit && (
              <span className="text-[10px] text-stone-400">
                ({passedCount}/{totalCount} Passed)
              </span>
            )}
          </div>
          {showMechanicalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showMechanicalDetails && mechanicalAudit && (
          <div className="mt-3 divide-y divide-stone-100 border border-stone-200 rounded-lg overflow-hidden bg-white">
            {mechanicalAudit.checks.map((chk) => (
              <div
                key={chk.id}
                className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-stone-50/80 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-stone-900">
                      Rule {chk.id} — {chk.ruleName}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 font-sans">{chk.detail}</p>
                </div>
                <div className="shrink-0">
                  <StatusBadge
                    status={chk.status === 'pass' ? 'pass' : 'review'}
                    label={chk.status === 'pass' ? 'PASS' : 'REVIEW REQUIRED'}
                    size="sm"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
