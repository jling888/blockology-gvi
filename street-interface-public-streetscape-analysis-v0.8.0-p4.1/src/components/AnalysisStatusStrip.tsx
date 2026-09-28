/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StatusBadge } from './StatusBadge';
import { V33StreetInterfaceMeasurement, V33PixelMeasurementResult } from '../types';

interface AnalysisStatusStripProps {
  caseId: string;
  candidateResult: V33StreetInterfaceMeasurement | null;
  pixelMeasurements: V33PixelMeasurementResult | null;
  mechanicalAuditPassed: boolean | null;
  executionTimeMs?: number | null;
}

export const AnalysisStatusStrip: React.FC<AnalysisStatusStripProps> = ({
  caseId,
  candidateResult,
  pixelMeasurements,
  mechanicalAuditPassed,
  executionTimeMs,
}) => {
  if (!candidateResult) return null;

  const vlmStatus = 'COMPLETED';
  const pixelStatus = pixelMeasurements?.status === 'computed'
    ? 'EXECUTED'
    : pixelMeasurements?.status === 'unsupported_lossy_format'
    ? 'LOSSY FORMAT'
    : 'TAXONOMY REQUIRED';

  const modelAuditStatus = candidateResult.evidence_audit.audit_status === 'pass'
    ? 'PASS'
    : 'REVIEW REQUIRED';

  const mechStatus = mechanicalAuditPassed === true
    ? 'PASS'
    : 'REVIEW REQUIRED';

  const overallStatus = candidateResult.evidence_audit.audit_status === 'pass' && mechanicalAuditPassed === true
    ? 'VALIDATED PASS'
    : 'REVIEW REQUIRED';

  return (
    <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-stone-400">CASE:</span>
          <span className="font-bold text-stone-900">{caseId || candidateResult.image_id}</span>
        </div>

        <div className="h-3.5 w-px bg-stone-300 hidden sm:block" />

        <div className="flex items-center gap-1.5">
          <span className="text-stone-400">VLM:</span>
          <StatusBadge status={vlmStatus} label="COMPLETED" size="sm" />
        </div>

        <div className="h-3.5 w-px bg-stone-300 hidden sm:block" />

        <div className="flex items-center gap-1.5">
          <span className="text-stone-400">PIXEL METRICS:</span>
          <StatusBadge
            status={pixelStatus === 'EXECUTED' ? 'executed' : 'pending'}
            label={pixelStatus}
            size="sm"
          />
        </div>

        <div className="h-3.5 w-px bg-stone-300 hidden sm:block" />

        <div className="flex items-center gap-1.5">
          <span className="text-stone-400">MODEL AUDIT:</span>
          <StatusBadge
            status={modelAuditStatus === 'PASS' ? 'pass' : 'review'}
            label={modelAuditStatus}
            size="sm"
          />
        </div>

        <div className="h-3.5 w-px bg-stone-300 hidden sm:block" />

        <div className="flex items-center gap-1.5">
          <span className="text-stone-400">MECHANICAL AUDIT:</span>
          <StatusBadge
            status={mechStatus === 'PASS' ? 'pass' : 'review'}
            label={mechStatus}
            size="sm"
          />
        </div>

        <div className="h-3.5 w-px bg-stone-300 hidden sm:block" />

        <div className="flex items-center gap-1.5">
          <span className="text-stone-400">OVERALL:</span>
          <StatusBadge
            status={overallStatus === 'VALIDATED PASS' ? 'pass' : 'review'}
            label={overallStatus}
            size="sm"
          />
        </div>
      </div>

      {executionTimeMs != null && (
        <div className="text-[11px] text-stone-400 font-mono">
          {(executionTimeMs / 1000).toFixed(2)}s
        </div>
      )}
    </div>
  );
};
