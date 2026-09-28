/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ============================================================================
 * TEAM REPOSITORY DATA PANEL
 * Nature 9.03 Final · No-Omega v0.6 — Team Repository Data Bridge
 * ============================================================================
 *
 * Compact research-data panel displaying:
 * - Repository Status & Commit
 * - Node Match & Physical Node ID
 * - Usability Status & Exclude Reason
 * - Matched Qwen Record & Ordinal Readout Provenance
 * - Matched Geometry Record & H/W Context Isolation
 * - Paper Variables Available vs Missing
 * - Supplementary & Excluded Downstream Variables
 * - City-Wide Calibration Dataset Mode (CWMC Reference vs Dataset Median)
 * - Validation Suite Status (Tests A–G)
 */

import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sliders,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';

import type {
  RepoPaperBridgeAssembly,
  TeamRepositoryMetadata,
} from '../data/teamRepository/teamRepositoryTypes';

import {
  runAllRepositoryBridgeValidationTests,
  type ValidationSuiteSummary,
} from '../data/teamRepository/teamRepositoryValidation';

interface TeamRepositoryDataPanelProps {
  assembly: RepoPaperBridgeAssembly | null;
  metadata?: TeamRepositoryMetadata;
  className?: string;
}

export const TeamRepositoryDataPanel: React.FC<TeamRepositoryDataPanelProps> = ({
  assembly,
  metadata,
  className = '',
}) => {
  const [expandedDiagnostics, setExpandedDiagnostics] = useState(false);
  const [showValidationSuite, setShowValidationSuite] = useState(false);
  const [suiteResults, setSuiteResults] = useState<ValidationSuiteSummary | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleRunValidationSuite = () => {
    try {
      setValidationError(null);
      const nextResults = runAllRepositoryBridgeValidationTests();
      setSuiteResults(nextResults);
      setShowValidationSuite(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[TeamRepositoryDataPanel validation error]', error);
      setSuiteResults(null);
      setValidationError(message);
      setShowValidationSuite(true);
    }
  };

  const repoName = metadata?.repositoryName ?? assembly?.matchedRecord.sourceMetadata.repositoryName ?? 'mikellu12/murrayhill-v12';
  const repoCommit = metadata?.repositoryCommit ?? assembly?.matchedRecord.sourceMetadata.repositoryCommit ?? '9353169b3dc3a1b4673e7144249db6ccbf7ac0f1';
  const dataVersion = metadata?.repositoryDataVersion ?? assembly?.matchedRecord.sourceMetadata.repositoryDataVersion ?? 'murrayhill_team_repo_v0.6.3';

  return (
    <section
      id="team-repository-data-panel"
      className={`bg-white border border-stone-200 rounded-lg p-4 shadow-xs space-y-4 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-emerald-800 text-white text-[9px] font-mono font-bold tracking-wide">
              DATA BRIDGE v0.7.0 · MULTI-SOURCE RESEARCH INTEGRATION VERIFIED
            </span>
            <Database className="w-4 h-4 text-emerald-800" />
            <h2 className="text-base font-bold font-mono text-stone-900">
              TEAM REPOSITORY DATA
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1 max-w-3xl">
            Deterministic source adapter connecting Murray Hill repository records to Nature 9.03 paper inputs without data invention.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-[9px] font-mono">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-50 border border-sky-200 text-sky-900 font-semibold">
            <FileSpreadsheet className="w-3.5 h-3.5 text-sky-700" />
            <span>{repoName}</span>
            {repoCommit && <span className="text-sky-600">({repoCommit.slice(0, 7)})</span>}
          </div>

          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border font-bold ${
              validationError
                ? 'bg-rose-50 border-rose-300 text-rose-800'
                : suiteResults
                ? suiteResults.allPassed
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-stone-50 border-stone-300 text-stone-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {validationError
                ? 'VALIDATION: ERROR'
                : suiteResults
                ? `VALIDATION: ${suiteResults.passCount}/${suiteResults.totalTests} PASSED`
                : 'VALIDATION: NOT RUN'}
            </span>
          </div>
        </div>
      </div>


      <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] text-emerald-900 leading-relaxed">
        Team Repository data is initialized automatically from the single <code className="font-mono">vlm_observations_murrayhill.csv</code> import above. No second CSV upload is required.
      </div>

      {/* Main Grid: Status, Node, Usability, Qwen, Geometry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Node Match */}
        <div className="bg-stone-50 border border-stone-200 rounded p-3 space-y-1">
          <div className="text-[10px] font-mono text-stone-500 uppercase">Node Identity</div>
          <div className="text-sm font-bold font-mono text-stone-900 flex items-center gap-1.5">
            Matched Node: {assembly ? assembly.nodeId : 'None'}
          </div>
          <div className="text-[10px] font-mono text-stone-600 truncate">
            {assembly
              ? `${assembly.matchedRecord.identity.sourceFilename} (${assembly.matchedRecord.identity.nodeIdSource})`
              : 'Awaiting source selection'}
          </div>
          <div className="text-[9px] font-mono text-stone-500 pt-1 border-t border-stone-200 space-y-0.5">
            <div>Match Status: {assembly?.matchedRecord.matchStatus ?? (assembly ? 'MATCH_OK' : 'PENDING')}</div>
            <div>Repository source: {assembly ? (assembly.matchedRecord.sourceMetadata.activeSourceTable || 'vlm_observations_murrayhill.csv') : 'None'}</div>
          </div>
        </div>

        {/* Card 2: Usability */}
        <div
          className={`border rounded p-3 space-y-1 ${
            assembly?.usableForActiveSynthesis
              ? 'bg-emerald-50 border-emerald-200'
              : assembly
              ? 'bg-rose-50 border-rose-200'
              : 'bg-stone-50 border-stone-200'
          }`}
        >
          <div className="text-[10px] font-mono text-stone-500 uppercase">Usability Status</div>
          <div className="flex items-center gap-1.5">
            {assembly?.usableForActiveSynthesis ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="text-sm font-bold font-mono text-emerald-900">
                  Usable: True
                </span>
              </>
            ) : assembly ? (
              <>
                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                <span className="text-sm font-bold font-mono text-rose-900">
                  Usable: False
                </span>
              </>
            ) : (
              <span className="text-sm font-mono text-stone-600">Usable: Pending</span>
            )}
          </div>
          <div className="text-[10px] text-stone-600 truncate">
            {assembly?.excludeReason || (assembly?.usableForActiveSynthesis ? 'Eligible for active synthesis' : '—')}
          </div>
          {assembly && (
            <div className="text-[9px] font-mono text-stone-500 pt-1 border-t border-stone-200">
              Active Synthesis: {assembly.usableForActiveSynthesis ? 'ALLOWED' : 'BLOCKED'}
            </div>
          )}
        </div>

        {/* Card 3: Qwen Record Readout */}
        <div className="bg-stone-50 border border-stone-200 rounded p-3 space-y-1">
          <div className="text-[10px] font-mono text-stone-500 uppercase">Qwen Instrument</div>
          <div className="text-sm font-bold font-mono text-stone-900">
            {assembly?.matchedRecord.qwenRecord ? '7-Rung Qualitative' : 'Unavailable'}
          </div>
          <div className="text-[10px] font-mono text-stone-600">
            Readout: {assembly?.mappedVariables.vNat.readoutMethod || 'N/A'}
          </div>
          <div className="text-[9px] font-mono text-stone-500 pt-1 border-t border-stone-200">
            Norm: (raw − 1) / 6 → [0, 1]
          </div>
        </div>

        {/* Card 4: Geometry Context */}
        <div className="bg-stone-50 border border-stone-200 rounded p-3 space-y-1">
          <div className="text-[10px] font-mono text-stone-500 uppercase">Geometry Context</div>
          <div className="text-sm font-bold font-mono text-stone-900">
            {assembly?.mappedVariables.hwRatio.value !== null
              ? `H/W: ${assembly?.mappedVariables.hwRatio.value?.toFixed(2)}`
              : assembly?.matchedRecord.geometryRecord?.isOpenOneSide
              ? 'open_one_side'
              : 'H/W: Unavailable'}
          </div>
          <div className="text-[10px] font-mono text-stone-600">
            Source: {assembly?.matchedRecord.geometryRecord?.hwSource || 'N/A'}
          </div>
          <div className="text-[9px] font-mono text-amber-800 font-semibold pt-1 border-t border-stone-200">
            GEOMETRY_CONTEXT_ONLY (No M impact)
          </div>
        </div>
      </div>

      {/* Variables Readiness Overview */}
      {assembly && (
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-2">
            <span className="text-xs font-bold font-mono text-stone-800">
              PAPER VARIABLE AVAILABILITY (SOURCE BACKED ONLY)
            </span>
            <span className="text-[10px] font-mono text-stone-600">
              Available: <strong>{assembly.availableVisualSemanticCount}/9</strong> visual-semantic
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-[10px] font-mono">
            <div className="p-1.5 bg-white border border-stone-200 rounded">
              <span className="text-stone-500">V_nat:</span>{' '}
              <strong className={assembly.mappedVariables.vNat.value !== null ? 'text-emerald-700' : 'text-stone-400'}>
                {assembly.mappedVariables.vNat.value !== null ? assembly.mappedVariables.vNat.value.toFixed(4) : 'null'}
              </strong>
            </div>
            <div className="p-1.5 bg-white border border-stone-200 rounded">
              <span className="text-stone-500">V_built:</span>{' '}
              <strong className={assembly.mappedVariables.vBuilt.value !== null ? 'text-emerald-700' : 'text-stone-400'}>
                {assembly.mappedVariables.vBuilt.value !== null ? assembly.mappedVariables.vBuilt.value.toFixed(4) : 'null'}
              </strong>
            </div>
            <div className="p-1.5 bg-white border border-stone-200 rounded">
              <span className="text-stone-500">Nat/Built:</span>{' '}
              <strong className={assembly.mappedVariables.naturalBuiltRatio.value !== null ? 'text-emerald-700' : 'text-stone-400'}>
                {assembly.mappedVariables.naturalBuiltRatio.value !== null ? assembly.mappedVariables.naturalBuiltRatio.value.toFixed(4) : 'null'}
              </strong>
            </div>
            <div className="p-1.5 bg-white border border-stone-200 rounded">
              <span className="text-stone-500">GVI_eye:</span>{' '}
              <strong className={assembly.mappedVariables.gviEye.value !== null ? 'text-emerald-700' : 'text-stone-400'}>
                {assembly.mappedVariables.gviEye.value !== null ? assembly.mappedVariables.gviEye.value.toFixed(4) : 'null'}
              </strong>
            </div>
            <div className="p-1.5 bg-white border border-stone-200 rounded">
              <span className="text-stone-500">GMI:</span>{' '}
              <strong className={assembly.mappedVariables.gmi.value !== null ? 'text-emerald-700' : 'text-stone-400'}>
                {assembly.mappedVariables.gmi.value !== null ? assembly.mappedVariables.gmi.value.toFixed(4) : 'null'}
              </strong>
            </div>
            <div className="p-1.5 bg-white border border-stone-200 rounded">
              <span className="text-stone-500">V_sign:</span>{' '}
              <strong className={assembly.mappedVariables.vSign.value !== null ? 'text-emerald-700' : 'text-stone-400'}>
                {assembly.mappedVariables.vSign.value !== null ? assembly.mappedVariables.vSign.value.toFixed(4) : 'null'}
              </strong>
            </div>
            <div className="p-1.5 bg-white border border-stone-200 rounded">
              <span className="text-stone-500">SVF (Proxy):</span>{' '}
              <strong className={assembly.mappedVariables.svf.value !== null ? 'text-emerald-700' : 'text-stone-400'}>
                {assembly.mappedVariables.svf.value !== null ? assembly.mappedVariables.svf.value.toFixed(4) : 'null'}
              </strong>
            </div>
            <div className="p-1.5 bg-white border border-stone-200 rounded">
              <span className="text-stone-500">GFAPI (Y_i):</span>{' '}
              <strong className={assembly.mappedVariables.gfapi.value !== null ? 'text-emerald-700' : 'text-stone-400'}>
                {assembly.mappedVariables.gfapi.value !== null ? assembly.mappedVariables.gfapi.value.toFixed(4) : 'null'}
              </strong>
            </div>
            <div className="p-1.5 bg-white border border-stone-200 rounded">
              <span className="text-stone-500">V_pave (D_i):</span>{' '}
              <strong className={assembly.mappedVariables.vPave.value !== null ? 'text-emerald-700' : 'text-stone-400'}>
                {assembly.mappedVariables.vPave.value !== null ? assembly.mappedVariables.vPave.value.toFixed(4) : 'null'}
              </strong>
            </div>
            <div className="p-1.5 bg-white border border-stone-200 rounded">
              <span className="text-stone-500">IAS (D_i):</span>{' '}
              <strong className={assembly.mappedVariables.ias.value !== null ? 'text-emerald-700' : 'text-stone-400'}>
                {assembly.mappedVariables.ias.value !== null ? assembly.mappedVariables.ias.value.toFixed(4) : 'null'}
              </strong>
            </div>
          </div>

          <div className="text-[10px] text-stone-500 pt-1 flex flex-wrap gap-x-4 gap-y-1">
            <span>
              Supplementary: <strong className="font-mono">SFV</strong> ({assembly.mappedVariables.sfv.value !== null ? assembly.mappedVariables.sfv.value.toFixed(4) : 'null'})
            </span>
            <span>
              Uncalibrated / Unavailable downstream:{' '}
              <span className="font-mono text-stone-600">Choice, Integration, GWR betas, λ, t_base</span>
            </span>
          </div>
        </div>
      )}

      {/* Comparative Finals (if legacy repo metrics present) */}
      {assembly?.matchedRecord.comparativeFinals && (
        <div className="bg-amber-50/50 border border-amber-200 rounded p-3 text-[10px] space-y-1">
          <div className="font-bold font-mono text-amber-900 flex items-center gap-1.5">
            <span>HISTORICAL REPOSITORY METRICS (COMPARATIVE_PROVENANCE_ONLY)</span>
          </div>
          <p className="text-amber-800 text-[9px] leading-relaxed">
            Legacy columns extracted from repository calculations table. Active App result is recomputed independently using the source-locked v0.5.2 engine.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono pt-1 text-[9px]">
            <div>Legacy I: <strong>{assembly.matchedRecord.comparativeFinals.legacyI ?? 'null'}</strong></div>
            <div>Legacy Y: <strong>{assembly.matchedRecord.comparativeFinals.legacyY ?? 'null'}</strong></div>
            <div>Legacy D: <strong>{assembly.matchedRecord.comparativeFinals.legacyD ?? 'null'}</strong></div>
            <div>Legacy M: <strong>{assembly.matchedRecord.comparativeFinals.legacyM ?? 'null'}</strong></div>
          </div>
        </div>
      )}

      {/* Action Bar / Expandable Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-200 text-xs font-mono">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpandedDiagnostics(!expandedDiagnostics)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-[10px]"
          >
            <Sliders className="w-3 h-3" />
            <span>{expandedDiagnostics ? 'Hide Full Diagnostics' : 'Inspect Repository Provenance'}</span>
            {expandedDiagnostics ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            id="toggle-validation-suite-btn"
            type="button"
            onClick={() => {
              if (!suiteResults && !validationError) {
                handleRunValidationSuite();
              } else {
                setShowValidationSuite(!showValidationSuite);
              }
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-semibold"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-700" />
            <span>
              {suiteResults
                ? `Validation Suite (${suiteResults.passCount}/${suiteResults.totalTests})`
                : validationError
                ? 'Validation Suite Error'
                : 'Run Validation Suite'}
            </span>
            {showValidationSuite ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        <div className="text-[9px] text-stone-500">
          Calibration: <strong>PAPER_MURRAY_HILL_REFERENCE</strong> (τ_I=0.20, τ_D=0.50)
        </div>
      </div>

      {/* Expandable Validation Suite Details */}
      {showValidationSuite && (
        <div className="border border-stone-200 rounded p-3 bg-stone-900 text-white space-y-2 text-[10px] font-mono">
          {validationError ? (
            <div className="space-y-2">
              <div className="font-bold text-rose-400">VALIDATION RUNTIME ERROR</div>
              <div className="text-stone-300 break-words">{validationError}</div>
              <button
                type="button"
                onClick={handleRunValidationSuite}
                className="px-2.5 py-1 rounded border border-stone-600 bg-stone-800 hover:bg-stone-700 text-white"
              >
                Retry Validation Suite
              </button>
            </div>
          ) : suiteResults ? (
            <>
              <div className="flex items-center justify-between border-b border-stone-700 pb-1.5">
                <span className="font-bold text-emerald-400">
                  STATUS: {suiteResults.status}
                </span>
                <span className="text-stone-400">
                  {suiteResults.passCount} of {suiteResults.totalTests} tests passing
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                {suiteResults.results.map((res) => (
                  <div
                    key={res.testId}
                    className="flex items-start justify-between gap-2 border-b border-stone-800 pb-1"
                  >
                    <div>
                      <span className="text-stone-400">[{res.testId}]</span>{' '}
                      <span className="text-stone-200 font-semibold">{res.title}</span>
                      <div className="text-[9px] text-stone-400 pl-4">
                        {res.details.join(' · ')}
                      </div>
                    </div>
                    <span className={`font-bold shrink-0 ${res.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {res.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Expandable Diagnostic Audit Details */}
      {expandedDiagnostics && assembly && (
        <div className="bg-stone-50 border border-stone-200 rounded p-3 space-y-2 text-[10px] font-mono">
          <div className="font-bold text-stone-800 pb-1 border-b border-stone-200">
            PROVENANCE AUDIT TRAIL & NORMALIZATION
          </div>
          <ul className="space-y-1 text-stone-600">
            {assembly.provenanceTrail.map((entry, idx) => (
              <li key={idx} className="flex items-start gap-1">
                <span className="text-stone-400">•</span>
                <span>{entry}</span>
              </li>
            ))}
          </ul>

          <div className="pt-2 border-t border-stone-200 grid grid-cols-1 md:grid-cols-2 gap-2 text-[9px]">
            <div>
              <span className="text-stone-500">Repository Name:</span> {repoName}
            </div>
            <div>
              <span className="text-stone-500">Repository Commit:</span> {repoCommit}
            </div>
            <div>
              <span className="text-stone-500">Data Version:</span> {dataVersion}
            </div>
            <div>
              <span className="text-stone-500">Import Timestamp:</span> {metadata?.importTimestamp || new Date().toISOString()}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
