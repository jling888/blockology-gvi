/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ============================================================================
 * PAPER-ALIGNED METHOD & DIAGNOSTICS PANEL
 * Street Interface Measurement — Nature 9.03 Final · No-Omega v0.5
 * ============================================================================
 *
 * ACTIVE:
 * - Research Architecture
 * - Measurement Ownership
 * - Frozen Segmentation Taxonomy
 * - Data Provenance
 * - Paper Synthesis Diagnostic Record
 * - Vision Node Record
 *
 * ISOLATED LEGACY:
 * - v3.3 VLM Candidate
 * - v3.2 Frozen Baseline
 *
 * The legacy tools remain available for regression comparison only and are
 * never presented as the active Paper-Aligned computation pipeline.
 */

import React, { useMemo, useState } from 'react';

import {
  Wrench,
  ChevronDown,
  ChevronUp,
  Layers,
  Binary,
  Database,
  FileCode2,
  Share2,
  History,
  BookOpen,
  Copy,
  Check,
  Download,
  Play,
  RefreshCw,
  AlertCircle,
  Calculator,
  Eye,
  Sparkles,
  MapPin,
  Activity,
  Info,
  ShieldAlert,
} from 'lucide-react';

import { StatusBadge } from './StatusBadge';
import { ResearchArchitecturePanel } from './ResearchArchitecturePanel';
import { MeasurementOwnershipPanel } from './MeasurementOwnershipPanel';
import { SegmentationTaxonomyPanel } from './SegmentationTaxonomyPanel';
import { RawOutputViewer } from './RawOutputViewer';

import {
  V33SegmentationTaxonomy,
  V33StreetInterfaceMeasurement,
  V33PixelMeasurementResult,
  V33ResearchNodeRecord,
  VlmStreetscapeEvaluationV31,
  MechanicalAuditResult,
  VISION_BASELINE_VERSION,
  FROZEN_TAXONOMY_VERSION,
} from '../types';

import {
  PaperResearchAssemblyResult,
} from '../utils/paperResearchAssembler';

import {
  PaperSynthesisResult,
} from '../utils/simComputationEngine';

interface MethodDiagnosticsPanelProps {
  // -------------------------------------------------------------------------
  // Active taxonomy
  // -------------------------------------------------------------------------

  taxonomy: V33SegmentationTaxonomy | null;

  onTaxonomyChange:
    (
      newTaxonomy:
        V33SegmentationTaxonomy | null
    ) => void;

  // -------------------------------------------------------------------------
  // Active deterministic Vision layer
  // -------------------------------------------------------------------------

  pixelMeasurements:
    V33PixelMeasurementResult | null;

  researchNode:
    V33ResearchNodeRecord | null;

  // -------------------------------------------------------------------------
  // Active Paper-Aligned computation
  //
  // Optional at the boundary for migration safety.
  // -------------------------------------------------------------------------

  paperAssembly?:
    PaperResearchAssemblyResult;

  paperSynthesis?:
    PaperSynthesisResult;

  // -------------------------------------------------------------------------
  // Preserved legacy v3.3 candidate
  // -------------------------------------------------------------------------

  candidateResult:
    V33StreetInterfaceMeasurement | null;

  rawCandidateJson:
    string | null;

  // -------------------------------------------------------------------------
  // Preserved legacy v3.2 baseline
  // -------------------------------------------------------------------------

  evaluation:
    VlmStreetscapeEvaluationV31;

  rawLegacyJson:
    string;

  mechanicalAudit:
    MechanicalAuditResult;

  onRunLegacyEvaluate:
    () => void;

  isLegacyLoading:
    boolean;

  legacyErrorMessage:
    string | null;

  // -------------------------------------------------------------------------
  // Active case context
  // -------------------------------------------------------------------------

  activeImageId:
    string;

  pixelClassificationUrl:
    string;

  originalUrl:
    string;

  pixelClassificationFilename:
    string;

  originalFilename:
    string;

  modelUsed:
    string;

  // -------------------------------------------------------------------------
  // Protocol modal
  // -------------------------------------------------------------------------

  onOpenProtocolModal:
    () => void;
}

type DiagnosticTab =
  | 'architecture'
  | 'ownership'
  | 'taxonomy'
  | 'provenance'
  | 'paper_record'
  | 'vision_node'
  | 'legacy_v33'
  | 'legacy_v32'
  | 'protocol';

export const MethodDiagnosticsPanel: React.FC<
  MethodDiagnosticsPanelProps
> = ({
  taxonomy,
  onTaxonomyChange,

  candidateResult,
  pixelMeasurements,
  researchNode,
  rawCandidateJson,

  paperAssembly,
  paperSynthesis,

  evaluation,
  rawLegacyJson,
  mechanicalAudit,
  onRunLegacyEvaluate,
  isLegacyLoading,
  legacyErrorMessage,

  activeImageId,
  pixelClassificationUrl,
  originalUrl,
  pixelClassificationFilename,
  originalFilename,
  modelUsed,

  onOpenProtocolModal,
}) => {
  const [isOpen, setIsOpen] =
    useState<boolean>(
      false
    );

  const [activeTab, setActiveTab] =
    useState<DiagnosticTab>(
      'architecture'
    );

  const [
    copiedPaperRecord,
    setCopiedPaperRecord,
  ] =
    useState<boolean>(
      false
    );

  const [
    copiedVisionNode,
    setCopiedVisionNode,
  ] =
    useState<boolean>(
      false
    );

  const [
    copiedLegacyV33,
    setCopiedLegacyV33,
  ] =
    useState<boolean>(
      false
    );

  // ===========================================================================
  // ACTIVE PAPER DIAGNOSTIC RECORD
  // ===========================================================================

  const paperDiagnosticRecord =
    useMemo(
      () => {
        if (
          !paperAssembly ||
          !paperSynthesis
        ) {
          return {
            schema_version:
              'street_interface_paper_aligned_v0.5.2_nature_9_03_no_omega',

            image_id:
              activeImageId,

            integration_status:
              'paper_props_missing',

            message:
              'MethodDiagnosticsPanel has not received paperAssembly and paperSynthesis from App.tsx.',
          };
        }

        return {
          schema_version:
            'street_interface_paper_aligned_v0.5.2_nature_9_03_no_omega',

          image_id:
            activeImageId,

          active_pipeline:
            'Vision / Approved Qwen / GIS / Space Syntax-GWR / t_raw Behavior → Paper Variable Assembly → Deterministic Paper Synthesis',

          vision: {
            baseline:
              VISION_BASELINE_VERSION,

            taxonomy:
              FROZEN_TAXONOMY_VERSION,

            measurement_status:
              pixelMeasurements?.status ??
              'not_run',

            provenance:
              pixelMeasurements?.provenance ??
              null,

            coverage:
              pixelMeasurements?.coverage ??
              null,
          },

          paper_variable_assembly: {
            strict_paper_mode:
              paperAssembly.strictPaperMode,

            variables:
              paperAssembly.variables,

            taxonomy_capabilities:
              paperAssembly.taxonomyCapabilities,

            paper_inputs:
              paperAssembly.paperInputs,

            gates:
              paperAssembly.gates,
          },

          paper_synthesis: {
            engine_version:
              paperSynthesis.engineVersion,

            imageability_raw:
              paperSynthesis.imageabilityRaw,

            place_imageability:
              paperSynthesis.placeImageability,

            place_identity:
              paperSynthesis.placeIdentity,

            dependence_raw:
              paperSynthesis.dependenceRaw,

            place_dependence:
              paperSynthesis.placeDependence,

            environmental_tfp_A_i:
              paperSynthesis.environmentalTfp,

            space_syntax_controls:
              paperSynthesis.spaceSyntaxControls,

            local_elasticities:
              paperSynthesis.localElasticities,

            sim:
              paperSynthesis.sim,

            stayability_factor_F_i:
              paperSynthesis.stayabilityFactor,

            t_effective:
              paperSynthesis.tEffective,

            gates:
              paperSynthesis.gates,
          },

          single_node_boundary: {
            gwr_calibrated_here:
              false,

            space_syntax_computed_here:
              false,

            choice_integration_are_external_network_inputs:
              true,

            d_xy_computed_here:
              false,

            missing_values_become_zero:
              false,
          },
        };
      },
      [
        activeImageId,
        paperAssembly,
        paperSynthesis,
        pixelMeasurements,
      ]
    );

  const paperDiagnosticJson =
    useMemo(
      () =>
        JSON.stringify(
          paperDiagnosticRecord,
          null,
          2
        ),
      [
        paperDiagnosticRecord,
      ]
    );

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  const copyText =
    async (
      text: string,
      setCopied:
        React.Dispatch<
          React.SetStateAction<boolean>
        >
    ) => {
      await navigator.clipboard.writeText(
        text
      );

      setCopied(
        true
      );

      window.setTimeout(
        () =>
          setCopied(
            false
          ),
        2000
      );
    };

  const downloadJson =
    (
      jsonString: string,
      filename: string
    ) => {
      const blob =
        new Blob(
          [
            jsonString,
          ],
          {
            type:
              'application/json;charset=utf-8',
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          'a'
        );

      link.href =
        url;

      link.download =
        filename;

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

      URL.revokeObjectURL(
        url
      );
    };

  const visionNodeJson =
    researchNode
      ? JSON.stringify(
          researchNode,
          null,
          2
        )
      : null;

  // ===========================================================================
  // TABS
  // ===========================================================================

  const tabs:
    {
      id: DiagnosticTab;
      label: string;
      icon: React.ElementType;
      legacy?: boolean;
    }[] = [
      {
        id:
          'architecture',
        label:
          'Research Architecture',
        icon:
          Layers,
      },

      {
        id:
          'ownership',
        label:
          'Measurement Ownership',
        icon:
          Binary,
      },

      {
        id:
          'taxonomy',
        label:
          'Segmentation Taxonomy',
        icon:
          Database,
      },

      {
        id:
          'provenance',
        label:
          'Data Provenance',
        icon:
          Share2,
      },

      {
        id:
          'paper_record',
        label:
          'Paper Synthesis JSON',
        icon:
          Calculator,
      },

      {
        id:
          'vision_node',
        label:
          'Vision Node JSON',
        icon:
          FileCode2,
      },

      {
        id:
          'legacy_v33',
        label:
          'Legacy v3.3 Candidate',
        icon:
          History,
        legacy:
          true,
      },

      {
        id:
          'legacy_v32',
        label:
          'Legacy v3.2 Baseline',
        icon:
          History,
        legacy:
          true,
      },

      {
        id:
          'protocol',
        label:
          'Protocol Specification',
        icon:
          BookOpen,
      },
    ];

  // ===========================================================================
  // UI
  // ===========================================================================

  return (
    <section className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
      {/* =====================================================================
          COLLAPSIBLE HEADER
          ===================================================================== */}

      <button
        type="button"
        onClick={() =>
          setIsOpen(
            !isOpen
          )
        }
        className="w-full p-5 flex items-center justify-between text-left hover:bg-stone-50 transition-colors cursor-pointer"
      >
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <Wrench className="w-4 h-4 text-stone-600 shrink-0" />

            <h2 className="text-sm font-bold text-stone-900 font-mono tracking-tight uppercase">
              Method &amp; Diagnostics
            </h2>

            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[9px] font-mono font-bold rounded">
              NATURE 9.03 FINAL · NO-OMEGA v0.5.2 — SOURCE LOCKED
            </span>

            <span className="text-[11px] font-mono text-stone-400">
              (
              {isOpen
                ? 'Expanded'
                : 'Collapsed'}
              )
            </span>
          </div>

          <p className="text-xs text-stone-500 font-sans">
            Active Paper method, ownership, provenance and computation records;
            historical v3.2/v3.3 tools are isolated as legacy diagnostics.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono text-stone-500 hidden sm:inline">
            {isOpen
              ? 'Click to collapse'
              : 'Click to expand'}
          </span>

          <div className="p-1.5 bg-stone-100 rounded-md text-stone-600">
            {isOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>
      </button>

      {/* =====================================================================
          EXPANDED CONTENT
          ===================================================================== */}

      {isOpen && (
        <div className="p-5 border-t border-stone-200 bg-stone-50/30 space-y-5">
          {/* -----------------------------------------------------------------
              ACTIVE / LEGACY NOTICE
              ----------------------------------------------------------------- */}

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />

            <p className="text-[10px] text-indigo-900 leading-relaxed">
              <strong>
                Active method:
              </strong>
              {' '}
              deterministic Vision measurements → Paper variable assembly →
              deterministic I/Y/D/A_i + Space Syntax-controlled GWR + SIM synthesis.
              Tabs explicitly marked
              {' '}
              <strong>LEGACY</strong>
              {' '}
              are retained only for regression comparison.
            </p>
          </div>

          {/* -----------------------------------------------------------------
              TAB NAVIGATION
              ----------------------------------------------------------------- */}

          <div className="flex flex-wrap gap-1.5 border-b border-stone-200 pb-3">
            {tabs.map(
              (
                tab
              ) => {
                const Icon =
                  tab.icon;

                const isActive =
                  activeTab ===
                  tab.id;

                return (
                  <button
                    key={
                      tab.id
                    }
                    type="button"
                    onClick={() =>
                      setActiveTab(
                        tab.id
                      )
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md border transition-colors cursor-pointer ${
                      isActive
                        ? tab.legacy
                          ? 'bg-amber-900 text-white border-amber-900 font-semibold'
                          : 'bg-stone-900 text-white border-stone-900 font-semibold'
                        : tab.legacy
                        ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />

                    <span>
                      {tab.label}
                    </span>

                    {tab.legacy && (
                      <span className="text-[8px] px-1 py-0.5 rounded border border-current opacity-75">
                        LEGACY
                      </span>
                    )}
                  </button>
                );
              }
            )}
          </div>

          {/* =================================================================
              TAB 1 — RESEARCH ARCHITECTURE
              ================================================================= */}

          {activeTab ===
            'architecture' && (
            <div className="bg-white border border-stone-200 rounded-lg p-4">
              <ResearchArchitecturePanel />
            </div>
          )}

          {/* =================================================================
              TAB 2 — MEASUREMENT OWNERSHIP
              ================================================================= */}

          {activeTab ===
            'ownership' && (
            <div className="bg-white border border-stone-200 rounded-lg p-4">
              <MeasurementOwnershipPanel />
            </div>
          )}

          {/* =================================================================
              TAB 3 — TAXONOMY
              ================================================================= */}

          {activeTab ===
            'taxonomy' && (
            <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-4">
              <SegmentationTaxonomyPanel
                currentTaxonomy={
                  taxonomy
                }
                onTaxonomyChange={
                  onTaxonomyChange
                }
              />
            </div>
          )}

          {/* =================================================================
              TAB 4 — DATA PROVENANCE
              ================================================================= */}

          {activeTab ===
            'provenance' && (
            <div className="bg-white border border-stone-200 rounded-lg p-5 space-y-4 font-sans text-xs text-stone-700">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-200 font-mono">
                <div>
                  <span className="font-bold text-sm text-stone-900 block">
                    Data Provenance &amp; Analytical Responsibility Matrix
                  </span>

                  <span className="text-[10px] text-stone-400">
                    Active Paper-Aligned ownership model
                  </span>
                </div>

                <StatusBadge
                  status="pass"
                  label="OWNERSHIP ISOLATED"
                  size="sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vision */}

                <div className="bg-emerald-50/40 border border-emerald-200 rounded-lg p-4 space-y-2">
                  <div className="font-bold font-mono text-xs text-emerald-950 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-emerald-700" />

                    <span>
                      1. Deterministic Vision Measurement
                    </span>
                  </div>

                  <p className="text-emerald-900 leading-relaxed">
                    Exact-RGB semantic mask accounting may execute in the
                    client engine with server fallback. It owns pixel counts,
                    class fractions, mapped/unmapped coverage and candidate
                    taxonomy-derived measurements. It is isolated from VLM
                    textual output.
                  </p>

                  <div className="text-[10px] font-mono text-emerald-800">
                    Active engine:{' '}
                    {modelUsed}
                  </div>

                  <div className="text-[10px] font-mono text-emerald-800">
                    Measurement status:{' '}
                    {pixelMeasurements?.status ??
                      'not_run'}
                  </div>
                </div>

                {/* VLM */}

                <div className="bg-indigo-50/40 border border-indigo-200 rounded-lg p-4 space-y-2">
                  <div className="font-bold font-mono text-xs text-indigo-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-700" />

                    <span>
                      2. Approved Team Qwen 7-Rung Paper-Variable Measurement
                    </span>
                  </div>

                  <p className="text-indigo-900 leading-relaxed">
                    The active bridge uses approved Team Qwen 7-rung probability outputs for V_nat, V_built, GVI_eye, GMI, V_sign, V_pave, SFV, GFAPI and IAS. These remain separate from deterministic final synthesis and are gated by source identity, horizon verification and Nature 9.02 orientation status. The VLM must not invent exact H/W, true whole-sky SVF, Space Syntax metrics, GWR coefficients, λ, observed t_raw, final I/Y/D, A_i, M_i or F_i. Legacy Teacher Gemma v3.0 remains an experimental comparator.
                  </p>

                  <div className="text-[10px] font-mono text-indigo-800">
                    Active paper-variable bridge: Team Qwen 7-rung · approval/orientation gated
                  </div>
                </div>

                {/* GIS */}

                <div className="bg-sky-50/40 border border-sky-200 rounded-lg p-4 space-y-2">
                  <div className="font-bold font-mono text-xs text-sky-950 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-sky-700" />

                    <span>
                      3. GIS / Physical Geometry
                    </span>
                  </div>

                  <p className="text-sky-900 leading-relaxed">
                    Owns exact street-canyon H/W, node coordinates and
                    georeferenced physical geometry. If a true whole-sky SVF
                    is used, it must retain separate calibrated provenance.
                    The Appendix VLM canyon-enclosure estimate / horizon-band
                    proxy must not be silently equated with published whole-sky
                    SVF. H/W enters the Paper workflow through Environmental
                    TFP A_i.
                  </p>
                </div>

                {/* Deterministic synthesis */}

                <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 space-y-2">
                  <div className="font-bold font-mono text-stone-900 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-stone-700" />

                    <span>
                      4. Deterministic Paper Synthesis
                    </span>
                  </div>

                  <p className="text-stone-600 leading-relaxed">
                    The code layer owns I_i, Y_i, D_i, normalized local
                    elasticities and M_i once all required approved inputs are
                    present (M_i = I_i^a_i · Y_i^b_i · D_i^c_i). Environmental TFP A_i is retired from active SIM calculation.
                  </p>

                  <div className="text-[10px] font-mono text-stone-600">
                    SIM status:{' '}
                    {paperSynthesis?.sim.status ??
                      'paper integration unavailable'}
                  </div>
                </div>

                {/* GWR */}

                <div className="bg-blue-50/40 border border-blue-200 rounded-lg p-4 space-y-2">
                  <div className="font-bold font-mono text-blue-950 flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-blue-700" />

                    <span>
                      5. Network GWR Calibration
                    </span>
                  </div>

                  <p className="text-blue-900 leading-relaxed">
                    Nature 9.02 network calibration uses β0(s_i), β_I(s_i),
                    β_Y(s_i), β_D(s_i), β_Choice(s_i) and β_Int(s_i), together
                    with Segment Choice and Segment Integration controls at
                    walking radius R=800 m. The single-node APP may accept
                    imported network metrics and local coefficients but does
                    not calibrate GWR from one street-view image. Only
                    β_I/β_Y/β_D are normalized into a_i/b_i/c_i.
                  </p>
                </div>

                {/* Behavior */}

                <div className="bg-purple-50/40 border border-purple-200 rounded-lg p-4 space-y-2">
                  <div className="font-bold font-mono text-xs text-purple-950 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-purple-700" />

                    <span>
                      6. Behavioral Observation
                    </span>
                  </div>

                  <p className="text-purple-900 leading-relaxed">
                    Observed t_raw in seconds belongs to a temporal pedestrian observation / tracking / sensor source. Static images do not directly measure dwell duration. The app clips t_raw to [0,300] and derives t_base=t_raw_clipped/300; t_raw takes precedence over the manual migration/audit t_base override. F_i and t_effective remain downstream of valid SIM and behavioral calibration.
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />

                <p className="text-[10px] text-amber-900 leading-relaxed">
                  Vision candidate values and Paper-ready variables remain
                  distinct. A candidate mapping is never promoted to final
                  computation merely because a number exists.
                </p>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 5 — PAPER SYNTHESIS JSON
              ================================================================= */}

          {activeTab ===
            'paper_record' && (
            <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold font-mono text-stone-900 block">
                    Active Paper-Aligned Synthesis Diagnostic Record
                  </span>

                  <span className="text-[10px] text-stone-500">
                    Live assembly, computation values, statuses and gates
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        paperDiagnosticJson,
                        setCopiedPaperRecord
                      )
                    }
                    className="flex items-center gap-1 px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-mono rounded border border-stone-300 transition-colors"
                  >
                    {copiedPaperRecord ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}

                    <span>
                      {copiedPaperRecord
                        ? 'Copied'
                        : 'Copy JSON'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      downloadJson(
                        paperDiagnosticJson,
                        `${activeImageId}_paper_aligned_diagnostics.json`
                      )
                    }
                    className="flex items-center gap-1 px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white text-xs font-mono rounded transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />

                    <span>
                      Download
                    </span>
                  </button>
                </div>
              </div>

              {!paperAssembly ||
              !paperSynthesis ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />

                  <p className="text-[10px] text-amber-900">
                    The panel is loaded but App.tsx has not supplied the active
                    paperAssembly / paperSynthesis props.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-mono">
                  <div className="bg-stone-50 border border-stone-200 rounded p-2">
                    <span className="text-stone-400 block">
                      Assembly Gates
                    </span>

                    <strong>
                      {paperAssembly.gates.length}
                    </strong>
                  </div>

                  <div className="bg-stone-50 border border-stone-200 rounded p-2">
                    <span className="text-stone-400 block">
                      Engine Gates
                    </span>

                    <strong>
                      {paperSynthesis.gates.length}
                    </strong>
                  </div>

                  <div className="bg-stone-50 border border-stone-200 rounded p-2">
                    <span className="text-stone-400 block">
                      SIM Status
                    </span>

                    <strong>
                      {paperSynthesis.sim.status}
                    </strong>
                  </div>

                  <div className="bg-stone-50 border border-stone-200 rounded p-2">
                    <span className="text-stone-400 block">
                      Strict Paper Mode
                    </span>

                    <strong>
                      {paperAssembly.strictPaperMode
                        ? 'TRUE'
                        : 'FALSE'}
                    </strong>
                  </div>
                </div>
              )}

              <pre className="p-4 bg-stone-900 text-stone-100 rounded-lg font-mono text-xs overflow-x-auto max-h-[34rem] leading-relaxed">
                {paperDiagnosticJson}
              </pre>
            </div>
          )}

          {/* =================================================================
              TAB 6 — VISION NODE JSON
              ================================================================= */}

          {activeTab ===
            'vision_node' && (
            <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold font-mono text-stone-900 block">
                    Deterministic Vision Bridge Node Record
                  </span>

                  <span className="text-[10px] text-stone-500">
                    Backward-compatible Vision-layer record; not the complete
                    Paper-Aligned export record.
                  </span>
                </div>

                {visionNodeJson && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          visionNodeJson,
                          setCopiedVisionNode
                        )
                      }
                      className="flex items-center gap-1 px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-mono rounded border border-stone-300 transition-colors"
                    >
                      {copiedVisionNode ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}

                      <span>
                        {copiedVisionNode
                          ? 'Copied'
                          : 'Copy'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        downloadJson(
                          visionNodeJson,
                          `${activeImageId}_vision_bridge_node.json`
                        )
                      }
                      className="flex items-center gap-1 px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white text-xs font-mono rounded transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />

                      <span>
                        Download
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {visionNodeJson ? (
                <pre className="p-4 bg-stone-900 text-stone-100 rounded-lg font-mono text-xs overflow-x-auto max-h-96 leading-relaxed">
                  {visionNodeJson}
                </pre>
              ) : (
                <div className="p-8 text-center text-stone-400 font-mono text-xs border border-dashed border-stone-200 rounded-lg">
                  Awaiting deterministic Vision measurement.
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              TAB 7 — LEGACY v3.3
              ================================================================= */}

          {activeTab ===
            'legacy_v33' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-900 text-white text-[10px] font-mono font-bold rounded">
                    LEGACY / ISOLATED
                  </span>

                  <span className="font-bold text-xs font-mono text-amber-950">
                    v3.3 Candidate VLM Output
                  </span>
                </div>

                <p className="text-xs text-amber-900 mt-1">
                  Preserved for historical comparison only. The four-domain
                  v3.3 candidate is not the active numerical Paper synthesis.
                </p>
              </div>

              <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold font-mono text-stone-900 block">
                      Raw v3.3 Candidate JSON
                    </span>

                    <span className="text-[10px] text-stone-500">
                      Candidate result present:{' '}
                      {candidateResult
                        ? 'yes'
                        : 'no'}
                    </span>
                  </div>

                  {rawCandidateJson && (
                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          rawCandidateJson,
                          setCopiedLegacyV33
                        )
                      }
                      className="flex items-center gap-1 px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-mono rounded border border-stone-300 transition-colors"
                    >
                      {copiedLegacyV33 ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}

                      <span>
                        {copiedLegacyV33
                          ? 'Copied'
                          : 'Copy JSON'}
                      </span>
                    </button>
                  )}
                </div>

                {rawCandidateJson ? (
                  <pre className="p-4 bg-stone-900 text-stone-100 rounded-lg font-mono text-xs overflow-x-auto max-h-96 leading-relaxed">
                    {rawCandidateJson}
                  </pre>
                ) : (
                  <div className="p-8 text-center text-stone-400 font-mono text-xs border border-dashed border-stone-200 rounded-lg">
                    No preserved v3.3 candidate payload is available for the
                    current session.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 8 — LEGACY v3.2
              ================================================================= */}

          {activeTab ===
            'legacy_v32' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-900 text-white text-[10px] font-mono font-bold rounded">
                      LEGACY / ISOLATED
                    </span>

                    <span className="font-bold text-xs font-mono text-amber-950">
                      Pixel-Classification-Primary v3.2-RC1 FROZEN
                    </span>
                  </div>

                  <p className="text-xs text-amber-900 font-sans">
                    Retained for regression comparison and rollback validation.
                    Its direct legacy scoring outputs are not inputs to the
                    active Paper-Aligned SIM engine.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    onRunLegacyEvaluate
                  }
                  disabled={
                    isLegacyLoading
                  }
                  className={`flex items-center gap-2 px-4 py-2 rounded font-mono text-xs font-bold transition-all ${
                    isLegacyLoading
                      ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                      : 'bg-stone-900 hover:bg-stone-800 text-white cursor-pointer'
                  }`}
                >
                  {isLegacyLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />

                      <span>
                        Running v3.2 Baseline...
                      </span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />

                      <span>
                        Execute v3.2 Baseline
                      </span>
                    </>
                  )}
                </button>
              </div>

              {legacyErrorMessage && (
                <div className="bg-rose-50 border border-rose-300 text-rose-900 p-3 rounded-lg flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />

                  <p>
                    {legacyErrorMessage}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div className="text-xs font-mono text-stone-500 font-bold uppercase tracking-wider">
                  Raw v3.2 Baseline Payload
                </div>

                <RawOutputViewer
                  evaluation={
                    evaluation
                  }
                  rawResponseText={
                    rawLegacyJson
                  }
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px]">
                  <div className="bg-stone-50 border border-stone-200 rounded p-3">
                    <strong className="font-mono text-stone-700 block">
                      Legacy Mechanical Audit
                    </strong>

                    <span className="text-stone-500">
                      Audit object retained in application state:{' '}
                      {mechanicalAudit
                        ? 'yes'
                        : 'no'}
                    </span>
                  </div>

                  <div className="bg-stone-50 border border-stone-200 rounded p-3">
                    <strong className="font-mono text-stone-700 block">
                      Evidence Pair
                    </strong>

                    <span className="text-stone-500 break-all">
                      {pixelClassificationFilename}
                      {' + '}
                      {originalFilename}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 9 — PROTOCOL
              ================================================================= */}

          {activeTab ===
            'protocol' && (
            <div className="bg-white border border-stone-200 rounded-lg p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
                <div>
                  <h3 className="font-bold text-sm text-stone-900 font-mono">
                    Active Protocol &amp; Documentation
                  </h3>

                  <p className="text-xs text-stone-500 font-sans">
                    Nature 9.03 Final (No-Omega) v0.5.2 — SOURCE LOCKED is the active computational specification, including canonical 4×90° sampling, Qwen paper-variable ownership, Space Syntax-controlled GWR and t_raw normalization. v3.2/v3.3 remain isolated diagnostic
                    references only.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    onOpenProtocolModal
                  }
                  className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-mono text-xs rounded transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />

                  <span>
                    Open Nature 9.03 Protocol
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
                  <span className="font-bold font-mono text-emerald-950 block">
                    ACTIVE — Nature 9.03 Final · No-Omega v0.5.2 — SOURCE LOCKED · Qwen + Space Syntax/GWR
                  </span>

                  <p className="text-emerald-900 leading-relaxed">
                    Evidence ownership → canonical Paper variables →
                    deterministic I/Y/D → Space Syntax-controlled GWR local elasticities →
                    Cobb–Douglas M_i (I^a · Y^b · D^c) → F_i stayability / network gates.
                  </p>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                  <span className="font-bold font-mono text-amber-950 block">
                    LEGACY — v3.3 Candidate
                  </span>

                  <p className="text-amber-900 leading-relaxed">
                    Four-domain qualitative VLM candidate retained for
                    historical comparison. It is not the active final
                    research-index architecture.
                  </p>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                  <span className="font-bold font-mono text-amber-950 block">
                    LEGACY — v3.2 Baseline
                  </span>

                  <p className="text-amber-900 leading-relaxed">
                    Frozen direct-scoring protocol retained for regression and
                    rollback comparison only.
                  </p>
                </div>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-[10px] text-stone-600">
                Current case:{' '}
                <span className="font-mono font-bold text-stone-900">
                  {activeImageId}
                </span>
                {' · '}
                Pixel evidence available:{' '}
                <span className="font-mono font-bold">
                  {pixelClassificationUrl
                    ? 'YES'
                    : 'NO'}
                </span>
                {' · '}
                Original evidence available:{' '}
                <span className="font-mono font-bold">
                  {originalUrl
                    ? 'YES'
                    : 'NO'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
