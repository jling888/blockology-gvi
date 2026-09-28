/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ============================================================================
 * LIVE PAPER-ALIGNED RESEARCH SYNTHESIS PANEL
 * Street Interface Measurement — Nature 9.03 Final · No-Omega v0.5
 * ============================================================================
 *
 * This panel reads the actual output of:
 *
 * paperResearchAssembler
 *          ↓
 * simComputationEngine
 *
 * It never fabricates missing numerical values.
 */

import React from 'react';

import {
  Compass,
  Fingerprint,
  Footprints,
  Building2,
  Network,
  Calculator,
  Activity,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  ArrowRight,
  LockKeyhole,
} from 'lucide-react';

import {
  PaperResearchAssemblyResult,
  PaperVariableRecord,
} from '../utils/paperResearchAssembler';

import {
  PaperMetric,
  PaperSynthesisResult,
  LocalElasticities,
} from '../utils/simComputationEngine';

interface ResearchSynthesisPanelProps {
  paperAssembly: PaperResearchAssemblyResult;
  paperSynthesis: PaperSynthesisResult;
  authorizationStatus?: 'AUTHORIZED' | 'PREVIEW_ONLY_NOT_APPROVED' | 'NOT_APPLICABLE';
}

/**
 * ============================================================================
 * FORMATTERS
 * ============================================================================
 */

function formatNumber(
  value: number | null | undefined,
  digits = 3
): string {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return '—';
  }

  return value.toFixed(digits);
}

function assemblyStatusStyle(
  status: PaperVariableRecord['status']
): string {
  switch (status) {
    case 'paper_ready':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';

    case 'candidate_mapping':
      return 'bg-sky-50 text-sky-800 border-sky-200';

    case 'taxonomy_gap':
      return 'bg-rose-50 text-rose-800 border-rose-200';

    case 'external_input':
      return 'bg-amber-50 text-amber-900 border-amber-200';

    case 'method_gated':
      return 'bg-purple-50 text-purple-900 border-purple-200';

    case 'unavailable':
      return 'bg-stone-100 text-stone-700 border-stone-300';

    case 'invalid':
      return 'bg-rose-100 text-rose-900 border-rose-300';

    default:
      return 'bg-stone-100 text-stone-700 border-stone-300';
  }
}

function metricStatusStyle(
  status: PaperMetric<any>['status']
): string {
  switch (status) {
    case 'computed':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';

    case 'input_gated':
      return 'bg-amber-50 text-amber-900 border-amber-200';

    case 'method_gated':
      return 'bg-purple-50 text-purple-900 border-purple-200';

    case 'invalid_input':
      return 'bg-rose-50 text-rose-800 border-rose-200';

    default:
      return 'bg-stone-100 text-stone-700 border-stone-300';
  }
}

function readableStatus(
  status: string
): string {
  return status
    .replace(/_/g, ' ')
    .toUpperCase();
}

/**
 * ============================================================================
 * INPUT VARIABLE CARD
 * ============================================================================
 */

const VariableInputCard: React.FC<{
  variable: PaperVariableRecord;
}> = ({
  variable,
}) => {
  const displayValue =
    variable.value ??
    variable.candidateValue ??
    null;

  const isCandidateOnly =
    variable.value === null &&
    variable.candidateValue !== null &&
    variable.candidateValue !== undefined;

  const isWorkingDatasetCandidate =
    variable.status === 'candidate_mapping' &&
    variable.usableForComputation &&
    variable.value !== null;

  return (
    <div className="bg-white border border-stone-200 rounded p-2.5 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-[10px] font-mono font-bold text-stone-900">
            {variable.symbol}
          </span>

          <p className="text-[9px] text-stone-500 mt-0.5">
            {variable.label}
          </p>
        </div>

        <span
          className={`px-1.5 py-0.5 rounded border text-[8px] font-mono font-bold ${assemblyStatusStyle(
            variable.status
          )}`}
        >
          {readableStatus(variable.status)}
        </span>
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-sm font-mono font-bold text-stone-900">
          {formatNumber(displayValue)}
        </span>

        {isCandidateOnly && (
          <span className="text-[8px] font-mono text-sky-700">
            VALIDATION CANDIDATE
          </span>
        )}
      </div>

      {isCandidateOnly && (
        <div className="bg-sky-50 border border-sky-200 rounded px-2 py-1.5">
          <span className="text-[8px] font-mono font-bold text-sky-800 block">
            VISION VALIDATION CANDIDATE — NOT CANONICAL PAPER INPUT
          </span>
          <span className="text-[8px] text-sky-700 leading-relaxed">
            Visible for audit only. This value does not enter the paper equation unless an explicit validated-substitute approval is recorded.
          </span>
        </div>
      )}

      {isWorkingDatasetCandidate && (
        <div className="bg-sky-50 border border-sky-200 rounded px-2 py-1.5">
          <span className="text-[8px] font-mono font-bold text-sky-800 block">
            WORKING DATASET INPUT — COMPUTATION ENABLED
          </span>
          <span className="text-[8px] text-sky-700 leading-relaxed">
            Used for interim current-formula synthesis, but not claimed as final teacher-orientation-approved canonical evidence.
          </span>
        </div>
      )}

      {!isCandidateOnly &&
        variable.status === 'paper_ready' &&
        variable.source === 'vlm' && (
          <div className="bg-violet-50 border border-violet-200 rounded px-2 py-1">
            <span className="text-[8px] font-mono font-bold text-violet-800">
              CANONICAL PAPER VLM INPUT
            </span>
          </div>
        )}

      <p className="text-[9px] text-stone-500 leading-relaxed">
        {variable.reason}
      </p>
    </div>
  );
};

/**
 * ============================================================================
 * OUTPUT METRIC
 * ============================================================================
 */

const MetricOutputCard: React.FC<{
  symbol: string;
  label: string;
  metric: PaperMetric;
  decimals?: number;
  previewOnly?: boolean;
}> = ({
  symbol,
  label,
  metric,
  decimals = 3,
  previewOnly = false,
}) => {
  return (
    <div className="bg-stone-900 text-white rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-[9px] font-mono uppercase text-stone-400 block">
            Research Output
          </span>

          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-sm font-mono font-bold">
              {symbol}
            </span>

            <span className="text-[10px] text-stone-400">
              {label}
            </span>
          </div>
        </div>

        <span
          className={`px-1.5 py-0.5 rounded border text-[8px] font-mono font-bold ${
            previewOnly && metric.status === 'computed'
              ? 'bg-amber-50 text-amber-900 border-amber-300'
              : metricStatusStyle(metric.status)
          }`}
        >
          {previewOnly && metric.status === 'computed'
            ? 'PREVIEW ONLY · NOT APPROVED'
            : readableStatus(metric.status)}
        </span>
      </div>

      <div className="text-2xl font-mono font-bold">
        {formatNumber(
          metric.value,
          decimals
        )}
      </div>

      <p className="text-[10px] text-stone-300 leading-relaxed">
        {metric.reason}
      </p>

      {metric.formula && (
        <div className="pt-2 border-t border-stone-700">
          <code className="text-[9px] font-mono text-stone-400">
            {metric.formula}
          </code>
        </div>
      )}
    </div>
  );
};

/**
 * ============================================================================
 * MAIN PANEL
 * ============================================================================
 */

export const ResearchSynthesisPanel: React.FC<
  ResearchSynthesisPanelProps
> = ({
  paperAssembly,
  paperSynthesis,
  authorizationStatus = 'NOT_APPLICABLE',
}) => {
  const previewOnly = authorizationStatus === 'PREVIEW_ONLY_NOT_APPROVED';
  const {
    variables,
    paperInputs,
  } = paperAssembly;

  const elasticities:
    LocalElasticities | null =
      paperSynthesis.localElasticities
        .status === 'computed'
        ? paperSynthesis.localElasticities.value
        : null;

  const betas =
    paperInputs.gwrLocalBetas;

  return (
    <section
      id="research-synthesis"
      className="space-y-5"
    >
      {/* =====================================================================
          STEP 6
          LIVE I / Y / D (NO-OMEGA)
          ===================================================================== */}

      <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pb-3 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-stone-900 text-white rounded">
                STEP 6
              </span>

              <h2 className="text-base font-bold text-stone-900 font-mono tracking-tight">
                Live Paper Research Synthesis
              </h2>
            </div>

            <p className="text-xs text-stone-500 mt-1 max-w-4xl">
              Canonical paper variables are assembled from approved Qwen,
              GIS/geometry, Space Syntax/GWR and behavioral owners before
              deterministic calculation of I_i, Y_i, D_i and A_i. Vision
              exact-RGB candidates remain visible for validation but do not
              silently enter the equations.
            </p>
          </div>

          <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-stone-100 text-stone-700 border border-stone-300 rounded">
            STRICT PAPER MODE
          </span>
        </div>

        {/* -------------------------------------------------------------------
            IMAGEABILITY
            ------------------------------------------------------------------- */}

        <div className="border border-stone-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-700" />

            <div>
              <span className="text-[9px] font-mono uppercase font-bold text-stone-400 block">
                Place Imageability
              </span>

              <h3 className="text-sm font-bold text-stone-900">
                I_i
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <VariableInputCard
              variable={
                variables.naturalBuiltRatio
              }
            />

            <VariableInputCard
              variable={
                variables.gviEye
              }
            />

            <VariableInputCard
              variable={
                variables.gmi
              }
            />
          </div>

          <MetricOutputCard
            symbol="I_i"
            label="Place Imageability"
            metric={
              paperSynthesis.placeImageability
            }
            previewOnly={previewOnly}
          />
        </div>

        {/* -------------------------------------------------------------------
            IDENTITY
            ------------------------------------------------------------------- */}

        <div className="border border-stone-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-indigo-700" />

            <div>
              <span className="text-[9px] font-mono uppercase font-bold text-stone-400 block">
                Place Identity
              </span>

              <h3 className="text-sm font-bold text-stone-900">
                Y_i
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <VariableInputCard
              variable={
                variables.vSign
              }
            />

            <VariableInputCard
              variable={
                variables.svf
              }
            />

            <VariableInputCard
              variable={
                variables.gfapi
              }
            />
          </div>

          <MetricOutputCard
            symbol="Y_i"
            label="Place Identity (Nature 9.03: V_sign, 1-SVF, GFAPI)"
            metric={
              paperSynthesis.placeIdentity
            }
            previewOnly={previewOnly}
          />

          <div className="bg-indigo-50 border border-indigo-200 rounded p-2.5 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-indigo-700 shrink-0 mt-0.5" />

            <p className="text-[10px] text-indigo-900 leading-relaxed">
              Nature 9.03 Final incorporates GFAPI into Place Identity alongside V_sign and (1-SVF).
              SFV is retained as supplementary validation provenance and does not enter active Y_i or SIM.
            </p>
          </div>
        </div>

        {/* -------------------------------------------------------------------
            DEPENDENCE
            ------------------------------------------------------------------- */}

        <div className="border border-stone-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Footprints className="w-4 h-4 text-purple-700" />

            <div>
              <span className="text-[9px] font-mono uppercase font-bold text-stone-400 block">
                Place Dependence
              </span>

              <h3 className="text-sm font-bold text-stone-900">
                D_i
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <VariableInputCard
              variable={
                variables.vPave
              }
            />

            <VariableInputCard
              variable={
                variables.ias
              }
            />
          </div>

          <MetricOutputCard
            symbol="D_i"
            label="Place Dependence (Nature 9.03: V_pave, IAS)"
            metric={
              paperSynthesis.placeDependence
            }
            previewOnly={previewOnly}
          />
        </div>

        {/* -------------------------------------------------------------------
            ENVIRONMENTAL TFP (RETIRED)
            ------------------------------------------------------------------- */}

        <div className="border border-stone-200 rounded-lg p-4 space-y-3 bg-stone-50/50">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-stone-500" />

            <div>
              <span className="text-[9px] font-mono uppercase font-bold text-amber-700 block">
                RETIRED FROM ACTIVE CALCULATION · NATURE 9.02 COMPARATIVE CONTEXT ONLY
              </span>

              <h3 className="text-sm font-bold text-stone-600">
                A_i (Legacy Environmental TFP)
              </h3>
            </div>
          </div>

          <div className="max-w-md">
            <VariableInputCard
              variable={
                variables.hwRatio
              }
            />
          </div>

          <MetricOutputCard
            symbol="A_i"
            label="Environmental TFP (Comparative Only — Excluded from Active M_i)"
            metric={
              paperSynthesis.environmentalTfp
            }
          />
        </div>
      </div>

      {/* =====================================================================
          STEP 7
          GWR → ELASTICITIES → SIM
          ===================================================================== */}

      <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pb-3 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-stone-900 text-white rounded">
                STEP 7
              </span>

              <h2 className="text-base font-bold text-stone-900 font-mono tracking-tight">
                GWR Elasticities & Street Interface Matrix
              </h2>
            </div>

            <p className="text-xs text-stone-500 mt-1">
              Space Syntax-controlled GWR coefficients are imported from the network model. Only |β_I|, |β_Y| and |β_D| are normalized into local Cobb–Douglas elasticities; β_Choice and β_Int remain movement controls.
            </p>
          </div>

          <span
            className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded border ${
              previewOnly && paperSynthesis.sim.status === 'computed'
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : metricStatusStyle(paperSynthesis.sim.status)
            }`}
          >
            SIM {previewOnly && paperSynthesis.sim.status === 'computed'
              ? 'PREVIEW ONLY · NOT APPROVED'
              : readableStatus(paperSynthesis.sim.status)}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* GWR BETAS */}

          <div className="bg-sky-50/60 border border-sky-200 rounded-lg p-3.5">
            <div className="flex items-center gap-2 mb-3">
              <Network className="w-4 h-4 text-sky-800" />

              <div>
                <span className="text-[9px] font-mono uppercase font-bold text-sky-700 block">
                  Network Input
                </span>

                <h3 className="text-xs font-bold text-sky-950">
                  Space Syntax-Controlled Local Space Syntax GWR
                </h3>
              </div>
            </div>

            <div className="space-y-2 font-mono text-[10px]">
              <div className="bg-white border border-sky-300 rounded p-2 flex justify-between">
                <span>β₀(s_i)</span>
                <strong>{formatNumber(betas?.betaIntercept)}</strong>
              </div>

              <div className="bg-sky-50 border border-sky-200 rounded px-2 py-1.5 text-[8px] text-sky-900 leading-relaxed">
                FULL GWR PROVENANCE ONLY — β₀ is retained to reproduce the
                local regression equation. It does not enter the
                a_i / b_i / c_i normalization denominator.
              </div>

              <div className="bg-white border border-sky-200 rounded p-2 flex justify-between">
                <span>β_I(s_i)</span>

                <strong>
                  {formatNumber(
                    betas?.betaImageability
                  )}
                </strong>
              </div>

              <div className="bg-white border border-sky-200 rounded p-2 flex justify-between">
                <span>β_Y(s_i)</span>

                <strong>
                  {formatNumber(
                    betas?.betaIdentity
                  )}
                </strong>
              </div>

              <div className="bg-white border border-sky-200 rounded p-2 flex justify-between">
                <span>β_D(s_i)</span>

                <strong>
                  {formatNumber(
                    betas?.betaDependence
                  )}
                </strong>
              </div>

              <div className="bg-white border border-sky-200 rounded p-2 flex justify-between">
                <span>β_Choice(s_i)</span>
                <strong>{formatNumber(betas?.betaChoice)}</strong>
              </div>

              <div className="bg-white border border-sky-200 rounded p-2 flex justify-between">
                <span>β_Int(s_i)</span>
                <strong>{formatNumber(betas?.betaIntegration)}</strong>
              </div>

              <div className="bg-sky-100/60 border border-sky-200 rounded p-2 space-y-1">
                <div className="flex justify-between"><span>Choice_i (R=800m)</span><strong>{formatNumber(paperInputs.spaceSyntaxChoice)}</strong></div>
                <div className="flex justify-between"><span>Integration_i</span><strong>{formatNumber(paperInputs.spaceSyntaxIntegration)}</strong></div>
              </div>
            </div>

            {!betas && (
              <div className="mt-2 flex items-start gap-1.5">
                <LockKeyhole className="w-3 h-3 text-sky-700 shrink-0 mt-0.5" />

                <p className="text-[9px] text-sky-900">
                  <span className="font-bold">LOCAL_GWR_NOT_AVAILABLE:</span> Observation-level GWR coefficients (β_I, β_Y, β_D) not supplied. Falling back to Nature 9.03 global reference elasticities (a=0.40, b=0.20, c=0.40).
                </p>
              </div>
            )}
          </div>

          {/* ELASTICITIES */}

          <div className="bg-stone-50 border border-stone-200 rounded-lg p-3.5">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4 text-stone-700" />

              <div>
                <span className="text-[9px] font-mono uppercase font-bold text-stone-500 block">
                  Deterministic Output
                </span>

                <h3 className="text-xs font-bold text-stone-900">
                  Local Elasticities
                </h3>
              </div>
            </div>

            <div className="space-y-2 font-mono text-[10px]">
              <div className="bg-white border border-stone-200 rounded p-2 flex justify-between">
                <span>a_i</span>

                <strong>
                  {formatNumber(
                    elasticities?.a
                  )}
                </strong>
              </div>

              <div className="bg-white border border-stone-200 rounded p-2 flex justify-between">
                <span>b_i</span>

                <strong>
                  {formatNumber(
                    elasticities?.b
                  )}
                </strong>
              </div>

              <div className="bg-white border border-stone-200 rounded p-2 flex justify-between">
                <span>c_i</span>

                <strong>
                  {formatNumber(
                    elasticities?.c
                  )}
                </strong>
              </div>

              <div className="pt-1 text-emerald-800 font-bold">
                Σ =
                {' '}
                {formatNumber(
                  elasticities?.sum
                )}
              </div>
            </div>

            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`px-2 py-0.5 rounded border text-[8px] font-mono font-bold ${metricStatusStyle(
                    paperSynthesis
                      .localElasticities
                      .status
                  )}`}
                >
                  {paperSynthesis.elasticitySource}
                </span>
                <span className="text-[8px] font-mono text-stone-500">
                  {paperSynthesis.calibrationStatus}
                </span>
              </div>
              <p className="text-[8px] text-stone-500 leading-tight">
                {paperSynthesis.localElasticities.reason}
              </p>
            </div>
          </div>

          {/* SIM */}

          <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3.5">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4 text-emerald-800" />

              <div>
                <span className="text-[9px] font-mono uppercase font-bold text-emerald-700 block">
                  Composite Output
                </span>

                <h3 className="text-xs font-bold text-emerald-950">
                  Street Interface Matrix
                </h3>
              </div>
            </div>

            <div className="bg-stone-900 text-white rounded p-3">
              <span className="text-[9px] font-mono uppercase text-stone-400 block">
                M_i
              </span>

              <div className="text-3xl font-mono font-bold mt-1">
                {formatNumber(
                  paperSynthesis.sim.value
                )}
              </div>

              <code className="text-[9px] text-stone-400 block mt-2 font-mono">
                M_i = I_i^a_i × Y_i^b_i × D_i^c_i
              </code>
            </div>

            <div className="mt-2">
              <span
                className={`px-2 py-0.5 rounded border text-[8px] font-mono font-bold ${metricStatusStyle(
                  paperSynthesis.sim.status
                )}`}
              >
                {previewOnly && paperSynthesis.sim.status === 'computed'
                  ? 'PREVIEW ONLY · NOT APPROVED'
                  : readableStatus(paperSynthesis.sim.status)}
              </span>
            </div>

            <p className="text-[9px] text-emerald-900 leading-relaxed mt-2">
              {paperSynthesis.sim.reason}
            </p>
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />

          <p className="text-[10px] text-rose-900 leading-relaxed">
            The former additive
            {' '}
            <code className="font-mono">
              w_img·I + w_id·Y + w_dep·D
            </code>
            {' '}
            formulation is not used by this active computation engine.
          </p>
        </div>
      </div>

      {/* =====================================================================
          STEP 8
          LIVE STAYABILITY
          ===================================================================== */}

      <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pb-3 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-stone-900 text-white rounded">
                STEP 8
              </span>

              <h2 className="text-base font-bold text-stone-900 font-mono tracking-tight">
                Stayability & Proxy Dwell Effect
              </h2>
            </div>

            <p className="text-xs text-stone-500 mt-1">
              Behavioral amplification is calculated only after a valid
              M_i and calibrated behavioral parameters are available.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* F_i */}

          <div className="bg-purple-50/60 border border-purple-200 rounded-lg p-3.5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-800" />

              <div>
                <span className="text-[9px] font-mono uppercase font-bold text-purple-700 block">
                  Stayability Amplification Factor
                </span>

                <h3 className="text-xs font-bold text-purple-950">
                  F_i
                </h3>
              </div>
            </div>

            <div className="text-2xl font-mono font-bold text-purple-950 mt-3">
              {formatNumber(
                paperSynthesis
                  .stayabilityFactor
                  .value
              )}
            </div>

            <span
              className={`inline-block mt-2 px-2 py-0.5 rounded border text-[8px] font-mono font-bold ${metricStatusStyle(
                paperSynthesis
                  .stayabilityFactor
                  .status
              )}`}
            >
              {readableStatus(
                paperSynthesis
                  .stayabilityFactor
                  .status
              )}
            </span>

            <p className="text-[9px] text-purple-900 mt-2">
              {
                paperSynthesis
                  .stayabilityFactor
                  .reason
              }
            </p>
          </div>

          {/* T EFFECTIVE */}

          <div className="bg-stone-50 border border-stone-200 rounded-lg p-3.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-stone-700" />

              <div>
                <span className="text-[9px] font-mono uppercase font-bold text-stone-500 block">
                  Effective Stayability
                </span>

                <h3 className="text-xs font-bold text-stone-900">
                  t_effective
                </h3>
              </div>
            </div>

            <div className="mt-3">
              <VariableInputCard
                variable={
                  variables.tBase
                }
              />
            </div>

            <div className="text-2xl font-mono font-bold text-stone-900 mt-3">
              {formatNumber(
                paperSynthesis
                  .tEffective
                  .value
              )}
            </div>

            <span
              className={`inline-block mt-2 px-2 py-0.5 rounded border text-[8px] font-mono font-bold ${metricStatusStyle(
                paperSynthesis
                  .tEffective
                  .status
              )}`}
            >
              {readableStatus(
                paperSynthesis
                  .tEffective
                  .status
              )}
            </span>
          </div>

          {/* DXY */}

          <div className="bg-sky-50/60 border border-sky-200 rounded-lg p-3.5">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-800" />

              <div>
                <span className="text-[9px] font-mono uppercase font-bold text-sky-700 block">
                  Network Spatial Output
                </span>

                <h3 className="text-xs font-bold text-sky-950">
                  D(x,y)
                </h3>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <LockKeyhole className="w-4 h-4 text-sky-700" />

              <span className="text-xs font-mono font-bold text-sky-900">
                NETWORK REQUIRED
              </span>
            </div>

            <p className="text-[10px] text-sky-900 mt-2 leading-relaxed">
              D(x,y) requires many georeferenced nodes and therefore
              remains outside single-node computation.
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================================
          GATE AUDIT
          ===================================================================== */}

      <div className="bg-stone-900 text-white rounded-lg p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />

            <span className="text-[10px] font-mono uppercase font-bold tracking-wider">
              Live Method Gate Audit
            </span>
          </div>

          <span className="text-[10px] font-mono text-stone-400">
            {paperSynthesis.gates.length}
            {' '}
            unresolved synthesis gates
          </span>
        </div>

        {paperSynthesis.gates.length === 0 ? (
          <div className="bg-emerald-950 border border-emerald-800 rounded p-3 text-[10px] text-emerald-200">
            All deterministic synthesis requirements are currently satisfied.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {paperSynthesis.gates.map(
              (
                gate,
                index
              ) => (
                <div
                  key={`${gate}-${index}`}
                  className="flex items-start gap-2 bg-stone-800 border border-stone-700 rounded p-2"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />

                  <span className="text-[9px] font-mono text-stone-300 leading-relaxed">
                    {gate}
                  </span>
                </div>
              )
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono mt-4 pt-3 border-t border-stone-700">
          <span>
            Research Variables
          </span>

          <ArrowRight className="w-3 h-3 text-stone-500" />

          <span>
            I / Y / D / A_i
          </span>

          <ArrowRight className="w-3 h-3 text-stone-500" />

          <span>
            Space Syntax GWR
          </span>

          <ArrowRight className="w-3 h-3 text-stone-500" />

          <span>
            a / b / c
          </span>

          <ArrowRight className="w-3 h-3 text-stone-500" />

          <span className="text-emerald-300 font-bold">
            M_i
          </span>

          <ArrowRight className="w-3 h-3 text-stone-500" />

          <span>
            F_i
          </span>

          <ArrowRight className="w-3 h-3 text-stone-500" />

          <span>
            t_effective
          </span>

          <ArrowRight className="w-3 h-3 text-stone-500" />

          <span>
            D(x,y)
          </span>
        </div>
      </div>

      <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 flex items-start gap-2">
        <Info className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />

        <p className="text-[10px] text-stone-600 leading-relaxed">
          Candidate Vision measurements remain visible for audit, but only
          paper-approved variables are permitted to enter deterministic
          synthesis. Missing capability is represented as a gate rather than
          a numerical zero.
        </p>
      </div>
    </section>
  );
};
