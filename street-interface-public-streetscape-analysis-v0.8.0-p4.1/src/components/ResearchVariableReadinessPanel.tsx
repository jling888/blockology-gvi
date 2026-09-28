/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ============================================================================
 * PAPER-ALIGNED RESEARCH VARIABLE READINESS PANEL
 * Street Interface Measurement — Nature 9.02 Aligned v0.4
 * ============================================================================
 *
 * PURPOSE
 * -------
 * This panel does NOT calculate the research model.
 *
 * It reports:
 * 1. what is currently measurable,
 * 2. what is derivable,
 * 3. what requires VLM,
 * 4. what requires GIS / geometry,
 * 5. what requires behavioral observations,
 * 6. what remains methodologically gated.
 *
 * IMPORTANT:
 * - Missing capability ≠ measured zero.
 * - Whole-frame vegetation ≠ GVI_eye.
 * - Perspective sky percentage ≠ true SVF.
 * - Exact H/W is not estimated by VLM.
 * - I_i, Y_i, D_i, A_i and M_i are deterministic synthesis outputs.
 * - GWR elasticities require a network-level calibration dataset.
 */

import React, { useMemo, useState } from 'react';

import {
  RESEARCH_VARIABLE_REGISTRY,
  ResearchReadinessStatus,
} from '../research/researchVariableReadiness';

import {
  V33PixelMeasurementResult,
  FROZEN_30_CLASS_TAXONOMY,
} from '../types';
import { PaperResearchAssemblyResult } from '../utils/paperResearchAssembler';
import { PaperSynthesisResult } from '../utils/simComputationEngine';

import {
  CheckCircle2,
  HelpCircle,
  Clock,
  Layers,
  Search,
  Sliders,
  Sparkles,
  MapPin,
  Activity,
  AlertTriangle,
  Network,
  Calculator,
  Database,
  Eye,
} from 'lucide-react';

interface ResearchVariableReadinessPanelProps {
  pixelMeasurements: V33PixelMeasurementResult | null;
  paperAssembly?: PaperResearchAssemblyResult;
  paperSynthesis?: PaperSynthesisResult;
}

type FilterStatus = ResearchReadinessStatus | 'ALL';

export const ResearchVariableReadinessPanel: React.FC<
  ResearchVariableReadinessPanelProps
> = ({ pixelMeasurements, paperAssembly, paperSynthesis }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] =
    useState<FilterStatus>('ALL');

  const groups = pixelMeasurements?.group_measurements;
  const derived = pixelMeasurements?.derived_metrics;
  const coverage = pixelMeasurements?.coverage;

  /**
   * --------------------------------------------------------------------------
   * TAXONOMY CAPABILITY CHECKS
   * --------------------------------------------------------------------------
   *
   * These checks distinguish:
   *
   *   "0 pixels were measured"
   *
   * from:
   *
   *   "the current taxonomy has no capability to represent this variable."
   *
   * That distinction is methodologically essential.
   */

  const hasPaverCapability = useMemo(() => {
    return FROZEN_30_CLASS_TAXONOMY.classes.some((cls) =>
      cls.research_groups.includes('paver')
    );
  }, []);

  const hasSignboardCapability = useMemo(() => {
    return FROZEN_30_CLASS_TAXONOMY.classes.some((cls) =>
      cls.research_groups.includes('signboard')
    );
  }, []);

  const hasArchitecturalDetailCapability = useMemo(() => {
    return FROZEN_30_CLASS_TAXONOMY.classes.some((cls) =>
      cls.research_groups.includes('architectural_detail')
    );
  }, []);

  /**
   * --------------------------------------------------------------------------
   * LIVE VALUE FORMATTERS
   * --------------------------------------------------------------------------
   */

  const formatPixels = (value?: number): string => {
    if (value === undefined || value === null) return '—';
    return `${value.toLocaleString()} px`;
  };

  const formatRatio = (
    value: number | null | undefined,
    digits = 3
  ): string => {
    if (value === undefined || value === null) return '—';
    return value.toFixed(digits);
  };

  const formatPercent = (
    value: number | null | undefined,
    digits = 2
  ): string => {
    if (value === undefined || value === null) return '—';
    return `${(value * 100).toFixed(digits)}%`;
  };

  /**
   * --------------------------------------------------------------------------
   * CURRENT ACTIVE VALUE
   * --------------------------------------------------------------------------
   *
   * Only values genuinely available from the current running pipeline
   * are displayed numerically.
   *
   * Everything else receives an explicit gate/status description.
   */

  const getPaperAssemblyRecord = (id: string): any | null => {
    if (!paperAssembly) return null;

    const assemblyMap: Record<string, any> = {
      p_natural_above_ground: paperAssembly.variables.vNat,
      p_built_above_ground: paperAssembly.variables.vBuilt,
      ratio_natural_built: paperAssembly.variables.naturalBuiltRatio,
      gvi_eye: paperAssembly.variables.gviEye,
      gmi: paperAssembly.variables.gmi,
      ratio_sign_detail: paperAssembly.variables.vSign,
      true_svf: paperAssembly.variables.svf,
      sfv: paperAssembly.variables.sfv,
      ratio_pedestrian_ground: paperAssembly.variables.vPave,
      ias: paperAssembly.variables.ias,
      gfapi: paperAssembly.variables.gfapi,
      hw_ratio: paperAssembly.variables.hwRatio,
      space_syntax_choice: paperAssembly.variables.spaceSyntaxChoice,
      space_syntax_integration: paperAssembly.variables.spaceSyntaxIntegration,
      t_base: paperAssembly.variables.tBase,
    };

    return assemblyMap[id] ?? null;
  };

  const getEffectivePrimarySource = (
    id: string,
    fallback: string
  ): string => {
    const record = getPaperAssemblyRecord(id);

    const isWorkingDatasetCandidate =
      record?.status === 'candidate_mapping' &&
      record?.usableForComputation === true &&
      Array.isArray(record?.provenance) &&
      record.provenance.some((item: unknown) =>
        typeof item === 'string' &&
        (/WORKING DATASET/i.test(item) ||
          /Murray Hill integrated working dataset/i.test(item))
      );

    if (!isWorkingDatasetCandidate) return fallback;

    if (id === 'ratio_natural_built') {
      return 'Team Qwen working V_nat + V_built candidate mapping — non-canonical / approval gated';
    }

    if (id === 'true_svf') {
      return 'Team Qwen working sky_openness-derived standardized openness proxy — non-canonical / approval gated; not true geometric SVF';
    }

    return 'Team Qwen candidate mapping — Murray Hill working dataset; non-canonical / approval gated';
  };

  const getLiveValue = (id: string): string => {
    const record = getPaperAssemblyRecord(id);
    if (record) {
      const value = record.value ?? record.candidateValue;
      if (typeof value === 'number' && Number.isFinite(value)) {
        const suffix = record.value === null && record.candidateValue != null
          ? ' (candidate)'
          : '';
        return `${value.toFixed(3)}${suffix} · ${String(record.status).replace(/_/g, ' ')}`;
      }
      if (record.reason) return `${String(record.status).replace(/_/g, ' ')} — ${record.reason}`;
    }

    if (paperSynthesis) {
      const synthesisMap: Record<string, any> = {
        place_imageability: paperSynthesis.placeImageability,
        place_identity: paperSynthesis.placeIdentity,
        place_dependence: paperSynthesis.placeDependence,
        environmental_tfp: paperSynthesis.environmentalTfp,
        gwr_elasticity: paperSynthesis.localElasticities,
        sim_i: paperSynthesis.sim,
        stayability_factor: paperSynthesis.stayabilityFactor,
        t_effective: paperSynthesis.tEffective,
      };
      const metric = synthesisMap[id];
      if (metric) {
        if (metric.status === 'computed' && metric.value !== null) {
          if (typeof metric.value === 'number') return `${metric.value.toFixed(3)} · computed`;
          if (id === 'gwr_elasticity') {
            return `a=${metric.value.a.toFixed(3)}, b=${metric.value.b.toFixed(3)}, c=${metric.value.c.toFixed(3)}`;
          }
        }
        return `${String(metric.status).replace(/_/g, ' ')} — ${metric.reason}`;
      }
    }
    if (!pixelMeasurements) {
      switch (id) {
        case 'gmi':
          return 'Approved Qwen instrument input required';
        case 'hw_ratio':
          return 'GIS / geometry input required';
        case 'true_svf':
          return 'Hemispherical / 3D geometry required';
        case 'sfv':
          return 'Approved Qwen facade_variation / SFV required';
        case 'ias':
          return 'Approved Qwen resting_affordance / IAS required';
        case 'gfapi':
          return 'Approved Qwen ground_floor_activity / GFAPI required';
        case 'gwr_elasticity':
          return 'Network GWR calibration required';
        case 't_raw':
          return 'Observed / sensor-derived stay duration (seconds) required';
        case 't_base':
          return 'Derived from t_raw when available; manual override is migration/audit only';
        case 'd_xy':
          return 'Network-level output';
        default:
          return 'Awaiting case analysis';
      }
    }

    switch (id) {
      // ----------------------------------------------------------------------
      // Vision baseline
      // ----------------------------------------------------------------------

      case 'p_total':
        return coverage
          ? `${coverage.valid_pixel_count.toLocaleString()} px`
          : '—';

      case 'p_natural_above_ground':
        return formatPixels(groups?.P_natural_above_ground);

      case 'p_built_above_ground':
        return formatPixels(groups?.P_built_above_ground);

      case 'ratio_natural_built':
        if (
          derived?.natural_built_above_ground_ratio?.status ===
          'undefined_zero_denominator'
        ) {
          return 'Undefined — V_built = 0';
        }

        return formatRatio(
          derived?.natural_built_above_ground_ratio?.value
        );

      // ----------------------------------------------------------------------
      // Imageability
      // ----------------------------------------------------------------------

      case 'gvi_eye':
        return 'Approved Qwen green_eye_level score required';

      case 'gmi':
        return 'Approved Qwen green_softening / GMI score required';

      // ----------------------------------------------------------------------
      // Identity
      // ----------------------------------------------------------------------

      case 'ratio_sign_detail':
        if (!hasSignboardCapability || !hasArchitecturalDetailCapability) {
          return 'Taxonomy capability incomplete';
        }

        return derived?.signboard_detail_ratio?.value !== null &&
          derived?.signboard_detail_ratio?.value !== undefined
          ? `${formatPercent(derived.signboard_detail_ratio.value)} Vision QA candidate; canonical V_sign from approved Qwen signage_detail`
          : 'Approved Qwen signage_detail / V_sign required';

      case 'true_svf':
        return 'Approved Qwen enclosure proxy or true geometric SVF required';

      case 'sfv':
        return 'Approved Qwen facade_variation / SFV required';

      // ----------------------------------------------------------------------
      // Dependence
      // ----------------------------------------------------------------------

      case 'ratio_pedestrian_ground':
        if (!hasPaverCapability) {
          return 'Vision paver taxonomy gap; canonical V_pave requires approved Qwen walkable_ground';
        }

        return derived?.sidewalk_paver_ratio?.value !== null &&
          derived?.sidewalk_paver_ratio?.value !== undefined
          ? formatPercent(derived.sidewalk_paver_ratio.value)
          : '—';

      case 'ias':
        return 'Approved Qwen resting_affordance / IAS required';

      case 'gfapi':
        return 'Approved Qwen ground_floor_activity / GFAPI required';

      // ----------------------------------------------------------------------
      // Enclosure modulation
      // ----------------------------------------------------------------------

      case 'hw_ratio':
        return 'Exact H/W requires GIS / physical geometry';

      case 'environmental_tfp':
        return 'A_i gated — H/W required; Nature 9.02 manuscript Ω_th=2.0 reference';

      // ----------------------------------------------------------------------
      // Three place dimensions
      // ----------------------------------------------------------------------

      case 'place_imageability':
        return 'Input gated — approved canonical V_nat/V_built + GVI_eye + GMI required';

      case 'place_identity':
        return 'Input gated — approved V_sign + geometric SVF or labeled openness proxy + GFAPI required (SFV excluded as supplementary)';

      case 'place_dependence':
        return 'Input gated — approved V_pave + IAS required';

      // ----------------------------------------------------------------------
      // GWR
      // ----------------------------------------------------------------------

      case 'space_syntax_choice':
        return 'Space Syntax Choice R=800m required';

      case 'space_syntax_integration':
        return 'Space Syntax Integration R=800m required';

      case 'gwr_elasticity':
        return 'Space Syntax-controlled network GWR required';

      // ----------------------------------------------------------------------
      // SIM
      // ----------------------------------------------------------------------

      case 'sim_i':
        return 'Input gated — I_i + Y_i + D_i + a/b/c required (Nature 9.03 No-Omega)';

      // ----------------------------------------------------------------------
      // Behavioral layer
      // ----------------------------------------------------------------------

      case 't_raw':
        return 'Observed t_raw (seconds) is supplied through Paper Protocol Inputs';

      case 't_base':
        return 'Derived from t_raw by clip[0,300]/300; manual override only when t_raw is unavailable';

      case 'stayability_factor':
        return 'Input gated — F_i requires M_i + λ';

      case 't_effective':
        return 'Input gated — F_i + t_base required';

      // ----------------------------------------------------------------------
      // Network spatial model
      // ----------------------------------------------------------------------

      case 'd_xy':
        return 'Network-level spatial model only';

      default:
        return '—';
    }
  };

  /**
   * --------------------------------------------------------------------------
   * STATUS BADGES
   * --------------------------------------------------------------------------
   */

  const getStatusBadge = (status: ResearchReadinessStatus) => {
    switch (status) {
      case 'DIRECTLY_MEASURED':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-900 rounded border border-emerald-300 inline-flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            <span>DIRECTLY MEASURED</span>
          </span>
        );

      case 'DERIVABLE':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-teal-100 text-teal-900 rounded border border-teal-300 inline-flex items-center gap-1 font-mono">
            <Calculator className="w-3 h-3 text-teal-700" />
            <span>DERIVABLE</span>
          </span>
        );

      case 'PARTIAL':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 rounded border border-amber-300 inline-flex items-center gap-1 font-mono">
            <Clock className="w-3 h-3 text-amber-700" />
            <span>PARTIAL / GATED</span>
          </span>
        );

      case 'VLM_REQUIRED':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-900 rounded border border-indigo-300 inline-flex items-center gap-1 font-mono">
            <Sparkles className="w-3 h-3 text-indigo-700" />
            <span>VLM REQUIRED</span>
          </span>
        );

      case 'GEOMETRY_REQUIRED':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-sky-100 text-sky-900 rounded border border-sky-300 inline-flex items-center gap-1 font-mono">
            <MapPin className="w-3 h-3 text-sky-700" />
            <span>GIS / GEOMETRY</span>
          </span>
        );

      case 'BEHAVIOR_REQUIRED':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-900 rounded border border-purple-300 inline-flex items-center gap-1 font-mono">
            <Activity className="w-3 h-3 text-purple-700" />
            <span>BEHAVIOR REQUIRED</span>
          </span>
        );

      case 'NOT_OPERATIONALIZED':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-stone-100 text-stone-700 rounded border border-stone-300 inline-flex items-center gap-1 font-mono">
            <HelpCircle className="w-3 h-3 text-stone-500" />
            <span>METHOD GATED</span>
          </span>
        );
    }
  };

  /**
   * --------------------------------------------------------------------------
   * FILTERING
   * --------------------------------------------------------------------------
   */

  const filteredVariables = RESEARCH_VARIABLE_REGISTRY.filter((v) => {
    const q = searchQuery.toLowerCase().trim();

    const matchesSearch =
      q === '' ||
      v.name.toLowerCase().includes(q) ||
      v.symbol.toLowerCase().includes(q) ||
      v.domain.toLowerCase().includes(q) ||
      v.methodologicalNote.toLowerCase().includes(q) ||
      v.primaryEvidenceSource.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (
      selectedStatus !== 'ALL' &&
      v.readiness !== selectedStatus
    ) {
      return false;
    }

    return true;
  });

  /**
   * --------------------------------------------------------------------------
   * SUMMARY COUNTS
   * --------------------------------------------------------------------------
   */

  const summary = useMemo(() => {
    const result: Record<ResearchReadinessStatus, number> = {
      DIRECTLY_MEASURED: 0,
      DERIVABLE: 0,
      PARTIAL: 0,
      VLM_REQUIRED: 0,
      GEOMETRY_REQUIRED: 0,
      BEHAVIOR_REQUIRED: 0,
      NOT_OPERATIONALIZED: 0,
    };

    RESEARCH_VARIABLE_REGISTRY.forEach((item) => {
      result[item.readiness] += 1;
    });

    return result;
  }, []);

  return (
    <section id="research-variable-readiness" className="space-y-4">
      {/* =====================================================================
          HEADER
          ===================================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-stone-900 text-stone-100 rounded">
              VARIABLE READINESS
            </span>

            <h2 className="text-base font-bold text-stone-900 font-mono tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-stone-700" />
              <span>Research Variable Readiness</span>
            </h2>
          </div>

          <p className="text-xs text-stone-500 font-sans mt-0.5 max-w-4xl">
            Paper-aligned ownership and readiness matrix for the variables
            required to calculate Place Imageability, Place Identity,
            Place Dependence, Environmental TFP, Space Syntax-controlled GWR elasticities and
            the Street Interface Matrix.
          </p>
        </div>

        <div className="text-[11px] font-mono text-stone-500 bg-stone-100 px-2 py-1 rounded border border-stone-200 whitespace-nowrap">
          Showing {filteredVariables.length} of{' '}
          {RESEARCH_VARIABLE_REGISTRY.length} Variables
        </div>
      </div>

      {/* =====================================================================
          METHODOLOGICAL SAFEGUARD
          ===================================================================== */}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />

        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-amber-900">
            Measurement capability is explicitly separated from measured absence.
          </p>

          <p className="text-[11px] text-amber-800 leading-relaxed">
            A missing taxonomy class, missing camera geometry, missing GIS
            variable or missing VLM rubric must remain unavailable / gated.
            The application must not silently convert missing capability into
            a numerical zero.
          </p>
        </div>
      </div>

      {/* =====================================================================
          READINESS SUMMARY
          ===================================================================== */}

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        <div className="bg-white border border-emerald-200 rounded-lg p-2.5">
          <span className="text-[9px] font-mono text-emerald-700 uppercase font-bold block">
            Measured
          </span>
          <span className="text-lg font-mono font-bold text-emerald-900">
            {summary.DIRECTLY_MEASURED}
          </span>
        </div>

        <div className="bg-white border border-teal-200 rounded-lg p-2.5">
          <span className="text-[9px] font-mono text-teal-700 uppercase font-bold block">
            Derivable
          </span>
          <span className="text-lg font-mono font-bold text-teal-900">
            {summary.DERIVABLE}
          </span>
        </div>

        <div className="bg-white border border-amber-200 rounded-lg p-2.5">
          <span className="text-[9px] font-mono text-amber-700 uppercase font-bold block">
            Partial
          </span>
          <span className="text-lg font-mono font-bold text-amber-900">
            {summary.PARTIAL}
          </span>
        </div>

        <div className="bg-white border border-indigo-200 rounded-lg p-2.5">
          <span className="text-[9px] font-mono text-indigo-700 uppercase font-bold block">
            VLM
          </span>
          <span className="text-lg font-mono font-bold text-indigo-900">
            {summary.VLM_REQUIRED}
          </span>
        </div>

        <div className="bg-white border border-sky-200 rounded-lg p-2.5">
          <span className="text-[9px] font-mono text-sky-700 uppercase font-bold block">
            GIS
          </span>
          <span className="text-lg font-mono font-bold text-sky-900">
            {summary.GEOMETRY_REQUIRED}
          </span>
        </div>

        <div className="bg-white border border-purple-200 rounded-lg p-2.5">
          <span className="text-[9px] font-mono text-purple-700 uppercase font-bold block">
            Behavior
          </span>
          <span className="text-lg font-mono font-bold text-purple-900">
            {summary.BEHAVIOR_REQUIRED}
          </span>
        </div>

        <div className="bg-white border border-stone-300 rounded-lg p-2.5">
          <span className="text-[9px] font-mono text-stone-600 uppercase font-bold block">
            Method Gate
          </span>
          <span className="text-lg font-mono font-bold text-stone-800">
            {summary.NOT_OPERATIONALIZED}
          </span>
        </div>
      </div>

      {/* =====================================================================
          SEARCH + FILTERS
          ===================================================================== */}

      <div className="bg-white border border-stone-200 rounded-lg p-3 shadow-2xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />

          <input
            type="text"
            placeholder="Search variable, symbol, research domain, source or method..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded focus:bg-white focus:outline-hidden focus:border-stone-400 font-sans"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono">
          {(
            [
              'ALL',
              'DIRECTLY_MEASURED',
              'DERIVABLE',
              'PARTIAL',
              'VLM_REQUIRED',
              'GEOMETRY_REQUIRED',
              'BEHAVIOR_REQUIRED',
              'NOT_OPERATIONALIZED',
            ] as const
          ).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setSelectedStatus(status)}
              className={`px-2 py-1 rounded transition-colors ${
                selectedStatus === status
                  ? 'bg-stone-900 text-white font-bold'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {status === 'NOT_OPERATIONALIZED'
                ? 'METHOD GATED'
                : status.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* =====================================================================
          VARIABLES TABLE
          ===================================================================== */}

      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto max-h-[620px]">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead className="bg-stone-100 border-b border-stone-200 sticky top-0 z-10 font-mono text-[11px] text-stone-700">
              <tr>
                <th className="py-2.5 px-3 w-36">
                  Symbol
                </th>

                <th className="py-2.5 px-3 min-w-[240px]">
                  Research Variable
                </th>

                <th className="py-2.5 px-3 w-48">
                  Readiness
                </th>

                <th className="py-2.5 px-3 min-w-[260px]">
                  Current Active Value / Gate
                </th>

                <th className="py-2.5 px-3 min-w-[260px]">
                  Primary Source
                </th>

                <th className="py-2.5 px-3 min-w-[360px]">
                  Methodological Boundary
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100">
              {filteredVariables.map((variable) => {
                const liveValue = getLiveValue(variable.id);
                const primarySource = getEffectivePrimarySource(
                  variable.id,
                  variable.primaryEvidenceSource
                );

                return (
                  <tr
                    key={variable.id}
                    className="hover:bg-stone-50/80 transition-colors align-top"
                  >
                    {/* Symbol */}
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-bold text-stone-900 text-xs bg-stone-100 px-2 py-1 rounded border border-stone-200 inline-block whitespace-nowrap">
                        {variable.symbol}
                      </span>
                    </td>

                    {/* Variable */}
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-stone-900 text-xs">
                        {variable.name}
                      </div>

                      <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                        {variable.domain}
                      </div>

                      {variable.missingRequirements && (
                        <div className="mt-1.5 flex items-start gap-1 text-[10px] text-amber-700">
                          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                          <span>
                            {variable.missingRequirements}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3">
                      {getStatusBadge(variable.readiness)}
                    </td>

                    {/* Live Value */}
                    <td className="py-2.5 px-3">
                      <div className="font-mono text-[11px] font-semibold text-stone-800 bg-stone-50 border border-stone-200 rounded px-2 py-1.5 leading-snug">
                        {liveValue}
                      </div>
                    </td>

                    {/* Source */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-start gap-1.5">
                        <Database className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-stone-600 leading-snug">
                          {primarySource}
                        </p>
                      </div>
                    </td>

                    {/* Method */}
                    <td className="py-2.5 px-3">
                      <p className="text-[11px] text-stone-600 leading-relaxed">
                        {variable.methodologicalNote}
                      </p>
                    </td>
                  </tr>
                );
              })}

              {filteredVariables.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center text-stone-400 text-xs"
                  >
                    No research variables match the current search
                    and readiness filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================================
          PAPER PIPELINE SUMMARY
          ===================================================================== */}

      <div className="bg-stone-900 text-stone-100 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Network className="w-4 h-4 text-stone-300" />

          <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
            Active Paper-Aligned Computational Chain
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
          <span className="px-2 py-1 bg-stone-800 border border-stone-700 rounded">
            Vision / VLM / GIS Evidence
          </span>

          <span className="text-stone-500">→</span>

          <span className="px-2 py-1 bg-stone-800 border border-stone-700 rounded">
            V_nat · V_built · GVI_eye · GMI
          </span>

          <span className="px-2 py-1 bg-stone-800 border border-stone-700 rounded">
            V_sign · (1-SVF) · GFAPI
          </span>

          <span className="px-2 py-1 bg-stone-800 border border-stone-700 rounded">
            V_pave · IAS
          </span>

          <span className="px-2 py-1 bg-stone-800 border border-stone-700 rounded text-stone-400">
            SFV (Supplementary) · H/W (Geometry)
          </span>

          <span className="text-stone-500">→</span>

          <span className="px-2 py-1 bg-indigo-950 border border-indigo-800 rounded">
            I_i · Y_i · D_i (M_i)
          </span>

          <span className="text-stone-500">→</span>

          <span className="px-2 py-1 bg-sky-950 border border-sky-800 rounded">
            GWR → a_i · b_i · c_i
          </span>

          <span className="text-stone-500">→</span>

          <span className="px-2 py-1 bg-emerald-950 border border-emerald-800 rounded font-bold">
            M_i
          </span>

          <span className="text-stone-500">→</span>

          <span className="px-2 py-1 bg-purple-950 border border-purple-800 rounded">
            F_i · t_effective
          </span>

          <span className="text-stone-500">→</span>

          <span className="px-2 py-1 bg-stone-800 border border-stone-700 rounded">
            D(x,y)
          </span>
        </div>

        <div className="mt-3 flex items-start gap-2 text-[10px] text-stone-400 leading-relaxed">
          <Eye className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <p>
            This readiness view reports methodological availability only.
            It does not substitute missing VLM, GIS, GWR or behavioral
            evidence with inferred numerical values.
          </p>
        </div>
      </div>
    </section>
  );
};