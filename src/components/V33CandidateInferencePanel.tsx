/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ============================================================================
 * v3.3-RC1 CANDIDATE INFERENCE VALIDATION PANEL
 * ============================================================================
 *
 * Research & development validation panel for testing the parallel v3.3-RC1
 * candidate inference core against paired streetscape cases.
 *
 * This panel is strictly placed OUTSIDE the legacy exported report (#streetscape-evaluation-report)
 * and maintains completely isolated state. It does NOT calculate downstream quantitative
 * research indices (GVI_eye, EBC, TEF, SAI, exact H/W, SVF, GFAPI, GMI, SIM, D(x,y)).
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  CheckCircle2,
  AlertTriangle,
  Code2,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ShieldCheck,
  Layers,
  Leaf,
  Fence,
  Building2,
  Armchair,
  Eye,
  Info,
  Clock,
  Check,
  FileCheck,
  Calculator,
  Download,
  Percent,
} from 'lucide-react';
import {
  V33StreetInterfaceMeasurement,
  V33TaxonomyStatus,
  V33SegmentationTaxonomy,
  V33PixelMeasurementResult,
  V33ResearchNodeRecord
} from '../types';
import { runV33MechanicalAudit } from '../utils/v33MechanicalAudit';
import { SegmentationTaxonomyPanel } from './SegmentationTaxonomyPanel';

interface V33CandidateInferencePanelProps {
  imageId: string;
  pixelClassificationBase64: string | null;
  pixelClassificationMimeType?: string;
  originalBase64: string | null;
  originalMimeType?: string;
}

export const V33CandidateInferencePanel: React.FC<V33CandidateInferencePanelProps> = ({
  imageId,
  pixelClassificationBase64,
  pixelClassificationMimeType,
  originalBase64,
  originalMimeType,
}) => {
  const [taxonomy, setTaxonomy] = useState<V33SegmentationTaxonomy | null>(null);
  const [candidateResult, setCandidateResult] = useState<V33StreetInterfaceMeasurement | null>(null);
  const [pixelMeasurements, setPixelMeasurements] = useState<V33PixelMeasurementResult | null>(null);
  const [researchNode, setResearchNode] = useState<V33ResearchNodeRecord | null>(null);
  const [rawJson, setRawJson] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const [showPixelBreakdown, setShowPixelBreakdown] = useState<boolean>(false);
  const [showMechanicalAudit, setShowMechanicalAudit] = useState<boolean>(true);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);

  const canRun = !!pixelClassificationBase64 && !!originalBase64;
  const taxonomyStatus: V33TaxonomyStatus = taxonomy ? 'configured' : 'not_configured';

  const handleRunCandidate = async () => {
    if (!canRun) return;

    setIsLoading(true);
    setError(null);
    const startTime = Date.now();

    try {
      const response = await fetch('/api/evaluate-v33', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId: imageId || 'IMG_CASE_01',
          pixelClassificationBase64,
          pixelClassificationMimeType: pixelClassificationMimeType || 'image/png',
          originalBase64,
          originalMimeType: originalMimeType || 'image/jpeg',
          segmentationTaxonomy: taxonomy,
          taxonomyConfig: {
            status: taxonomyStatus,
          },
        }),
      });

      const resData = await response.json();
      const elapsed = Date.now() - startTime;
      setExecutionTimeMs(elapsed);

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to execute v3.3 candidate inference.');
      }

      setCandidateResult(resData.data);
      setPixelMeasurements(resData.pixelMeasurements || null);
      setResearchNode(resData.researchNode || null);
      setRawJson(resData.rawResponse || JSON.stringify(resData.data, null, 2));
      setModelUsed(resData.modelUsed || 'gemma-4-31b-it');
    } catch (err: any) {
      console.error('[v3.3 Candidate Error]', err);
      setError(err.message || 'Error occurred during v3.3 candidate inference.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadResearchNode = () => {
    if (!researchNode) return;
    const jsonStr = JSON.stringify(researchNode, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${researchNode.image_id}_v33_research_node_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const mechanicalAudit = candidateResult
    ? runV33MechanicalAudit(candidateResult, taxonomyStatus)
    : null;

  const modelAuditPassed = candidateResult?.evidence_audit.audit_status === 'pass';
  const mechanicalAuditPassed = mechanicalAudit?.overallStatus === 'pass';
  const overallValidatedPass = modelAuditPassed && mechanicalAuditPassed;

  const getTertiaryBadge = (val: string) => {
    switch (val) {
      case 'high':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'medium':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'low':
        return 'bg-stone-100 text-stone-800 border-stone-300';
      case 'uncertain':
        return 'bg-purple-100 text-purple-900 border-purple-300 font-semibold';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  return (
    <section
      id="v33-candidate-inference-panel"
      className="bg-white border-2 border-indigo-300 rounded-xl shadow-md p-6 space-y-6 text-stone-900"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-indigo-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="p-1.5 bg-indigo-600 text-white rounded-md shadow-sm">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold tracking-tight text-stone-900 font-mono">
              v3.3 STREET-INTERFACE INFERENCE CANDIDATE
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300">
              CANDIDATE — NOT PRODUCTION
            </span>
          </div>
          <p className="text-xs text-stone-600">
            Parallel testing environment executing Gemma 4 31B against the v3.3 Street Interface Measurement schema alongside the Step 6 Deterministic Pixel Measurement Engine.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            id="run-v33-candidate-btn"
            onClick={handleRunCandidate}
            disabled={!canRun || isLoading}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold font-mono tracking-wide transition-all shadow-sm ${
              !canRun || isLoading
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-300'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow focus:ring-2 focus:ring-indigo-400'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>EVALUATING v3.3...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>RUN v3.3 CANDIDATE</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 1. SEGMENTATION TAXONOMY INFRASTRUCTURE PANEL */}
      <SegmentationTaxonomyPanel
        currentTaxonomy={taxonomy}
        onTaxonomyChange={(newTaxonomy) => setTaxonomy(newTaxonomy)}
      />

      {/* Methodological Notice */}
      <div className="flex items-start gap-3 p-3.5 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-950">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-amber-900">Research & Methodological Boundary Notice</p>
          <p className="text-[11px] leading-relaxed text-amber-900">
            This candidate output contains VLM qualitative spatial measurements alongside separate deterministic pixel measurements.
            Downstream quantitative research indices (GVI_eye, EBC, TEF, SAI, exact H/W, SVF, GFAPI, GMI, SIM, D(x,y)) are NOT calculated by Gemma.
          </p>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 space-y-1">
          <div className="flex items-center gap-2 font-bold text-red-800">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>v3.3 Candidate Evaluation Error</span>
          </div>
          <p className="font-mono text-[11px] pl-6 text-red-800">{error}</p>
        </div>
      )}

      {/* Results View */}
      {candidateResult ? (
        <div className="space-y-6">
          {/* Metadata bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-indigo-50/60 border border-indigo-200 rounded-lg text-xs font-mono">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <span className="text-stone-500">Case ID:</span>{' '}
                <span className="font-bold text-indigo-950">{candidateResult.image_id}</span>
              </div>
              <div>
                <span className="text-stone-500">Schema:</span>{' '}
                <span className="font-bold text-indigo-950">{candidateResult.schema_version}</span>
              </div>
              <div>
                <span className="text-stone-500">Model:</span>{' '}
                <span className="font-bold text-indigo-950">{modelUsed || 'gemma-4-31b-it'}</span>
              </div>
              <div>
                <span className="text-stone-500">Taxonomy:</span>{' '}
                <span className="font-bold text-indigo-950 uppercase">{taxonomyStatus}</span>
              </div>
              {executionTimeMs && (
                <div className="flex items-center gap-1 text-stone-600">
                  <Clock className="w-3 h-3" />
                  <span>{(executionTimeMs / 1000).toFixed(2)}s</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {researchNode && (
                <button
                  type="button"
                  onClick={handleDownloadResearchNode}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-indigo-100/50 border border-indigo-300 rounded text-[11px] font-mono text-indigo-900 transition-colors shadow-2xs"
                  title="Download complete V33ResearchNodeRecord (VLM + Deterministic Pixel data)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Research Node JSON</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowRawJson(!showRawJson)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-indigo-100/50 border border-indigo-300 rounded text-[11px] font-mono text-indigo-900 transition-colors shadow-2xs"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>{showRawJson ? 'Hide Raw JSON' : 'View Raw v3.3 JSON'}</span>
                {showRawJson ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Raw JSON viewer */}
          {showRawJson && rawJson && (
            <div className="p-4 bg-stone-900 rounded-lg text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-96 border border-stone-800">
              <pre>{rawJson}</pre>
            </div>
          )}

          {/* 2. DETERMINISTIC PIXEL MEASUREMENTS (Step 6 Engine) */}
          {pixelMeasurements && (
            <div className="p-4 bg-white border-2 border-emerald-200 rounded-xl space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1 bg-emerald-100 text-emerald-800 rounded">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 font-mono uppercase">
                      Deterministic Pixel Measurement Engine (Step 6)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Decoded via sharp pixel raster scan • PNG exact RGB match • Isolated from Gemma
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs font-mono">
                  <span
                    className={`px-2.5 py-1 rounded-md font-bold uppercase tracking-wider ${
                      pixelMeasurements.status === 'computed'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : pixelMeasurements.status === 'taxonomy_required'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-red-100 text-red-900 border border-red-300'
                    }`}
                  >
                    Engine Status: {pixelMeasurements.status}
                  </span>
                </div>
              </div>

              {/* Status Banner / Explanation */}
              {pixelMeasurements.status === 'taxonomy_required' && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                  <div className="font-semibold flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Deterministic Analysis Gated — No Taxonomy Configured</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    Total valid pixels (<span className="font-mono font-bold">{(pixelMeasurements.coverage?.valid_pixel_count ?? 0).toLocaleString()} px</span>) were scanned, but semantic class aggregation is restricted because no documented class-to-color mapping is configured.
                  </p>
                </div>
              )}

              {pixelMeasurements.status === 'unsupported_lossy_format' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 space-y-1">
                  <div className="font-semibold flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    <span>Lossy Compression Format Detected</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-red-800">
                    {pixelMeasurements.status_reason || 'Exact RGB pixel matching requires lossless PNG classification maps.'}
                  </p>
                </div>
              )}

              {/* Core Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* P_total */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                    P_total (Valid Pixels)
                  </span>
                  <div className="text-sm font-bold font-mono text-slate-900">
                    {(pixelMeasurements.coverage?.valid_pixel_count ?? 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {pixelMeasurements.image?.width_px && pixelMeasurements.image?.height_px
                      ? `${pixelMeasurements.image.width_px}×${pixelMeasurements.image.height_px} px`
                      : 'Raster Scan'}
                  </div>
                </div>

                {/* Natural Above Ground */}
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-emerald-800 font-bold block">
                    P_natural_above_ground
                  </span>
                  <div className="text-sm font-bold font-mono text-emerald-950">
                    {pixelMeasurements.group_measurements?.P_natural_above_ground != null
                      ? pixelMeasurements.group_measurements.P_natural_above_ground.toLocaleString()
                      : '—'}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-mono">
                    {pixelMeasurements.coverage?.valid_pixel_count && pixelMeasurements.group_measurements?.P_natural_above_ground != null
                      ? `${((pixelMeasurements.group_measurements.P_natural_above_ground / pixelMeasurements.coverage.valid_pixel_count) * 100).toFixed(2)}%`
                      : 'Requires Taxonomy'}
                  </div>
                </div>

                {/* Built Above Ground */}
                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-blue-800 font-bold block">
                    P_built_above_ground
                  </span>
                  <div className="text-sm font-bold font-mono text-blue-950">
                    {pixelMeasurements.group_measurements?.P_built_above_ground != null
                      ? pixelMeasurements.group_measurements.P_built_above_ground.toLocaleString()
                      : '—'}
                  </div>
                  <div className="text-[10px] text-blue-700 font-mono">
                    {pixelMeasurements.coverage?.valid_pixel_count && pixelMeasurements.group_measurements?.P_built_above_ground != null
                      ? `${((pixelMeasurements.group_measurements.P_built_above_ground / pixelMeasurements.coverage.valid_pixel_count) * 100).toFixed(2)}%`
                      : 'Requires Taxonomy'}
                  </div>
                </div>

                {/* Natural / Built Ratio */}
                <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-lg space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-purple-800 font-bold block">
                    Natural / Built Ratio
                  </span>
                  <div className="text-sm font-bold font-mono text-purple-950">
                    {pixelMeasurements.derived_metrics?.natural_built_above_ground_ratio?.value != null
                      ? pixelMeasurements.derived_metrics.natural_built_above_ground_ratio.value.toFixed(4)
                      : '—'}
                  </div>
                  <div className="text-[10px] text-purple-700 font-mono">
                    {pixelMeasurements.derived_metrics?.natural_built_above_ground_ratio?.status || 'taxonomy_group_unavailable'}
                  </div>
                </div>
              </div>

              {/* Research Metrics Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* GVI_eye status */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 font-mono text-[11px]">GVI_eye</span>
                    <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                      PENDING ROI
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    Status: PENDING_EYE_LEVEL_ROI_DEFINITION. Quantitative GVI requires calibrated eye-level visual cone ROI; not estimated by VLM.
                  </p>
                </div>

                {/* Sidewalk + Paver Ratio */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 font-mono text-[11px]">Sidewalk + Paver Ratio</span>
                    <span className="text-[10px] font-mono font-bold text-slate-700">
                      {pixelMeasurements.derived_metrics?.sidewalk_paver_ratio?.value != null
                        ? `${(pixelMeasurements.derived_metrics.sidewalk_paver_ratio.value * 100).toFixed(2)}%`
                        : '—'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    Ground pedestrian surface coverage computed deterministically from mapped sidewalk and paver classes.
                  </p>
                </div>

                {/* Signboard Detail Ratio */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 font-mono text-[11px]">Signboard Detail Ratio</span>
                    <span className="text-[10px] font-mono font-bold text-slate-700">
                      {pixelMeasurements.derived_metrics?.signboard_detail_ratio?.value != null
                        ? `${(pixelMeasurements.derived_metrics.signboard_detail_ratio.value * 100).toFixed(2)}%`
                        : '—'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    Commercial & architectural detail pixel ratio computed deterministically when mapped.
                  </p>
                </div>
              </div>

              {/* Class Breakdown Expandable Section */}
              {pixelMeasurements.class_measurements && pixelMeasurements.class_measurements.length > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowPixelBreakdown(!showPixelBreakdown)}
                    className="flex items-center justify-between w-full py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <Percent className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Class-by-Class Pixel Breakdown ({pixelMeasurements.class_measurements.length} classes mapped)</span>
                    </div>
                    <span className="text-[11px] text-blue-600 flex items-center space-x-1">
                      <span>{showPixelBreakdown ? 'Hide Breakdown' : 'Show Breakdown'}</span>
                      {showPixelBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </span>
                  </button>

                  {showPixelBreakdown && (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-[10px] uppercase font-bold">
                            <th className="py-2 px-3">Class</th>
                            <th className="py-2 px-3">RGB</th>
                            <th className="py-2 px-3 text-right">Pixel Count</th>
                            <th className="py-2 px-3 text-right">% Valid</th>
                            <th className="py-2 px-3">Research Groups</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {pixelMeasurements.class_measurements.map((cls) => (
                            <tr key={cls.class_id} className="hover:bg-slate-50/60">
                              <td className="py-2 px-3">
                                <div className="flex items-center space-x-2">
                                  <span
                                    className="w-3 h-3 rounded-full border border-black/15 shrink-0"
                                    style={{
                                      backgroundColor: `rgb(${cls.rgb[0]}, ${cls.rgb[1]}, ${cls.rgb[2]})`,
                                    }}
                                  />
                                  <span className="font-bold text-slate-800">{cls.label}</span>
                                  <span className="text-[10px] text-slate-400 font-normal">({cls.class_id})</span>
                                </div>
                              </td>
                              <td className="py-2 px-3 text-slate-500 text-[11px]">
                                {cls.rgb.join(', ')}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-slate-900">
                                {cls.pixel_count.toLocaleString()}
                              </td>
                              <td className="py-2 px-3 text-right text-slate-700">
                                {(cls.fraction_of_valid_pixels * 100).toFixed(2)}%
                              </td>
                              <td className="py-2 px-3">
                                <div className="flex flex-wrap gap-1">
                                  {cls.research_groups.map((g, idx) => (
                                    <span
                                      key={idx}
                                      className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 border border-slate-200 text-slate-600"
                                    >
                                      {g}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {(pixelMeasurements.coverage?.unmapped_pixel_count ?? 0) > 0 && (
                        <div className="p-2.5 mt-2 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600 flex items-center justify-between">
                          <span>Unmapped Pixel Colors:</span>
                          <span className="font-bold text-slate-800">
                            {(pixelMeasurements.coverage?.unmapped_pixel_count ?? 0).toLocaleString()} px ({(((pixelMeasurements.coverage?.unmapped_pixel_count ?? 0) / Math.max(1, pixelMeasurements.coverage?.valid_pixel_count ?? 1)) * 100).toFixed(2)}%)
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Primary Evidence Summary */}
          <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-800 font-mono uppercase">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Primary Analytical Evidence Snapshot</span>
            </div>
            <p className="text-xs text-stone-700 leading-relaxed pl-6">
              {candidateResult.primary_evidence_summary}
            </p>
          </div>

          {/* Audit & Validation Summary Header Card */}
          {mechanicalAudit && (
            <div className="p-4 bg-slate-50 border border-indigo-200 rounded-xl space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-indigo-700" />
                  <h3 className="text-xs font-bold text-stone-900 font-mono uppercase tracking-wide">
                    v3.3-RC1 Candidate Dual Audit & Validation Status
                  </h3>
                </div>
                <div className="text-[11px] font-mono text-stone-500">
                  Taxonomy State: <strong className="uppercase text-stone-800">{taxonomyStatus}</strong>
                </div>
              </div>

              {/* 3 Status Badges */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Model Audit */}
                <div className="p-3 bg-white border border-stone-200 rounded-lg space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-stone-500 block">
                    1. Model Internal Audit
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold uppercase border ${
                        modelAuditPassed
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      {modelAuditPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      <span>{candidateResult.evidence_audit.audit_status}</span>
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 pt-0.5">
                    {modelAuditPassed
                      ? 'Gemma reports zero internal audit violations.'
                      : 'Model flagged review required (missing taxonomy / uncertainty).'}
                  </p>
                </div>

                {/* 2. Mechanical Audit */}
                <div className="p-3 bg-white border border-stone-200 rounded-lg space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-stone-500 block">
                    2. Mechanical Audit (Rules A–K)
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold uppercase border ${
                        mechanicalAuditPassed
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      {mechanicalAuditPassed ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      <span>{mechanicalAudit.overallStatus}</span>
                    </span>
                    <span className="text-[11px] font-mono text-stone-500">
                      ({mechanicalAudit.checks.filter((c) => c.status === 'pass').length}/{mechanicalAudit.checks.length} passed)
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 pt-0.5">
                    {mechanicalAuditPassed
                      ? 'All 11 deterministic structural & gate rules passed.'
                      : 'One or more deterministic audit rules flagged review required.'}
                  </p>
                </div>

                {/* 3. Overall Candidate Validation */}
                <div className="p-3 bg-white border border-stone-200 rounded-lg space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-stone-500 block">
                    Overall Candidate Validation
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-bold uppercase border ${
                        overallValidatedPass
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      {overallValidatedPass ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                      )}
                      <span>{overallValidatedPass ? 'VALIDATED PASS' : 'REVIEW REQUIRED'}</span>
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 pt-0.5">
                    {overallValidatedPass
                      ? 'Both Model Audit and Mechanical Audit are green.'
                      : 'Candidate cannot be marked validated pass without full taxonomy & audit pass.'}
                  </p>
                </div>
              </div>

              {/* Expandable Deterministic Mechanical Audit Details */}
              <div className="pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowMechanicalAudit(!showMechanicalAudit)}
                  className="flex items-center justify-between w-full py-1.5 text-left text-xs font-bold font-mono text-stone-800 hover:text-indigo-900 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>DETERMINISTIC v3.3 MECHANICAL AUDIT (RULES A–K)</span>
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-stone-200 text-stone-700 font-mono">
                      {mechanicalAudit.checks.filter((c) => c.status === 'pass').length}/{mechanicalAudit.checks.length} Pass
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] text-indigo-700 font-normal">
                    {showMechanicalAudit ? 'Collapse Rules' : 'Expand Rules'}
                    {showMechanicalAudit ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </span>
                </button>

                {showMechanicalAudit && (
                  <div className="mt-3 space-y-2">
                    {mechanicalAudit.checks.map((check) => (
                      <div
                        key={check.id}
                        className={`p-2.5 rounded-lg border text-xs space-y-1 transition-all ${
                          check.status === 'pass'
                            ? 'bg-white border-emerald-200'
                            : 'bg-amber-50/70 border-amber-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold font-mono text-stone-900 text-[11px]">
                            {check.ruleName}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                              check.status === 'pass'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-amber-100 text-amber-900 border-amber-300'
                            }`}
                          >
                            {check.status === 'pass' ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                            )}
                            <span>{check.status === 'pass' ? 'PASS' : 'REVIEW REQUIRED'}</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-700 leading-relaxed pl-1 font-mono">
                          {check.detail}
                        </p>
                      </div>
                    ))}

                    <div className="p-2.5 bg-stone-100 border border-stone-200 rounded text-[11px] text-stone-600 leading-snug">
                      <strong>Methodological Scope Note:</strong> Real-world location anonymity (prevention of specific street/building proper names) is safeguarded by the model-level inference prompt. Deterministic Mechanical Audit does not claim to replace comprehensive semantic NLP location detection.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4 Measurement Domains Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Domain 1: Eye-Level Greenness */}
            <div className="p-4 bg-white border border-emerald-200 rounded-lg space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                <div className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-emerald-950 font-mono uppercase">
                    1. Eye-Level Greenness
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Conf: {candidateResult.measurement_domains.eye_level_greenness.confidence}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase font-mono">Types:</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {candidateResult.measurement_domains.eye_level_greenness.greenery_types.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-800 text-[11px] font-mono"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-stone-500 text-[10px] uppercase font-mono block">Vertical Position:</span>
                    <span className="text-stone-900 font-medium text-[11px]">
                      {candidateResult.measurement_domains.eye_level_greenness.greenery_vertical_position}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 text-[10px] uppercase font-mono block">Continuity:</span>
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-mono uppercase rounded border ${getTertiaryBadge(
                        candidateResult.measurement_domains.eye_level_greenness.greenery_continuity
                      )}`}
                    >
                      {candidateResult.measurement_domains.eye_level_greenness.greenery_continuity}
                    </span>
                  </div>
                </div>

                <div className="pt-1">
                  <span className="text-stone-500 text-[10px] uppercase font-mono block">Pedestrian Relationship:</span>
                  <p className="text-stone-700 text-[11px] leading-snug">
                    {candidateResult.measurement_domains.eye_level_greenness.greenery_pedestrian_relationship}
                  </p>
                </div>
              </div>
            </div>

            {/* Domain 2: Edge Barrier Density */}
            <div className="p-4 bg-white border border-blue-200 rounded-lg space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <Fence className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-blue-950 font-mono uppercase">
                    2. Edge Barrier Density
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                  Conf: {candidateResult.measurement_domains.edge_barrier_density.confidence}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-stone-500 text-[10px] uppercase font-mono block">Barrier Present:</span>
                    <span className="text-stone-900 font-semibold text-[11px]">
                      {candidateResult.measurement_domains.edge_barrier_density.barrier_present}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 text-[10px] uppercase font-mono block">Primary Edge Type:</span>
                    <span className="text-stone-900 font-medium text-[11px] font-mono">
                      {candidateResult.measurement_domains.edge_barrier_density.edge_type}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-stone-500 text-[10px] uppercase font-mono block">Continuity:</span>
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-mono uppercase rounded border ${getTertiaryBadge(
                        candidateResult.measurement_domains.edge_barrier_density.barrier_continuity
                      )}`}
                    >
                      {candidateResult.measurement_domains.edge_barrier_density.barrier_continuity}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 text-[10px] uppercase font-mono block">Buffering Quality:</span>
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-mono uppercase rounded border ${getTertiaryBadge(
                        candidateResult.measurement_domains.edge_barrier_density.buffering_quality
                      )}`}
                    >
                      {candidateResult.measurement_domains.edge_barrier_density.buffering_quality}
                    </span>
                  </div>
                </div>

                <div className="pt-1">
                  <span className="text-stone-500 text-[10px] uppercase font-mono block">Edge Spatial Relationship:</span>
                  <p className="text-stone-700 text-[11px] leading-snug">
                    {candidateResult.measurement_domains.edge_barrier_density.edge_spatial_relationship}
                  </p>
                </div>
              </div>
            </div>

            {/* Domain 3: Transitional Structural Enclosure */}
            <div className="p-4 bg-white border border-purple-200 rounded-lg space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs font-bold text-purple-950 font-mono uppercase">
                    3. Structural Enclosure
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                  Conf: {candidateResult.measurement_domains.transitional_structural_enclosure.confidence}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-stone-500 text-[9px] uppercase font-mono block">Street Wall:</span>
                    <span
                      className={`inline-block px-1.5 py-0.5 text-[9px] font-mono uppercase rounded border ${getTertiaryBadge(
                        candidateResult.measurement_domains.transitional_structural_enclosure.street_wall_continuity
                      )}`}
                    >
                      {candidateResult.measurement_domains.transitional_structural_enclosure.street_wall_continuity}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 text-[9px] uppercase font-mono block">Sky Exposure:</span>
                    <span
                      className={`inline-block px-1.5 py-0.5 text-[9px] font-mono uppercase rounded border ${getTertiaryBadge(
                        candidateResult.measurement_domains.transitional_structural_enclosure.sky_exposure
                      )}`}
                    >
                      {candidateResult.measurement_domains.transitional_structural_enclosure.sky_exposure}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 text-[9px] uppercase font-mono block">Perceived H/W:</span>
                    <span className="text-stone-900 font-semibold text-[10px] font-mono">
                      {candidateResult.measurement_domains.transitional_structural_enclosure.perceived_hw_ratio}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-stone-500 text-[10px] uppercase font-mono block">Setback Openness:</span>
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-mono uppercase rounded border ${getTertiaryBadge(
                        candidateResult.measurement_domains.transitional_structural_enclosure.setback_openness
                      )}`}
                    >
                      {candidateResult.measurement_domains.transitional_structural_enclosure.setback_openness}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 text-[10px] uppercase font-mono block">Vegetation Enclosure:</span>
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-mono uppercase rounded border ${getTertiaryBadge(
                        candidateResult.measurement_domains.transitional_structural_enclosure.vegetation_enclosure
                      )}`}
                    >
                      {candidateResult.measurement_domains.transitional_structural_enclosure.vegetation_enclosure}
                    </span>
                  </div>
                </div>

                <div className="pt-1">
                  <span className="text-stone-500 text-[10px] uppercase font-mono block">Enclosure Spatial Relationship:</span>
                  <p className="text-stone-700 text-[11px] leading-snug">
                    {candidateResult.measurement_domains.transitional_structural_enclosure.enclosure_spatial_relationship}
                  </p>
                </div>
              </div>
            </div>

            {/* Domain 4: Micro-Spatial Affordances */}
            <div className="p-4 bg-white border border-amber-200 rounded-lg space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                <div className="flex items-center gap-2">
                  <Armchair className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-bold text-amber-950 font-mono uppercase">
                    4. Micro-Spatial Affordances
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  Conf: {candidateResult.measurement_domains.micro_spatial_affordances.confidence}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase font-mono">
                    Affordance Present: {candidateResult.measurement_domains.micro_spatial_affordances.stationary_affordance_present}
                  </span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {candidateResult.measurement_domains.micro_spatial_affordances.stationary_affordance_types.map((a, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-800 text-[11px] font-mono"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-stone-500 text-[10px] uppercase font-mono block">Lingering Affordance:</span>
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-mono uppercase rounded border ${getTertiaryBadge(
                        candidateResult.measurement_domains.micro_spatial_affordances.lingering_affordance
                      )}`}
                    >
                      {candidateResult.measurement_domains.micro_spatial_affordances.lingering_affordance}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 text-[10px] uppercase font-mono block">Permeability:</span>
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-mono uppercase rounded border ${getTertiaryBadge(
                        candidateResult.measurement_domains.micro_spatial_affordances.ground_floor_active_permeability
                      )}`}
                    >
                      {candidateResult.measurement_domains.micro_spatial_affordances.ground_floor_active_permeability}
                    </span>
                  </div>
                </div>

                <div className="pt-1">
                  <span className="text-stone-500 text-[10px] uppercase font-mono block">Affordance Relationship:</span>
                  <p className="text-stone-700 text-[11px] leading-snug">
                    {candidateResult.measurement_domains.micro_spatial_affordances.affordance_spatial_relationship}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Evidence Audit Object Card */}
          <div className="p-4 bg-stone-50 border border-stone-300 rounded-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-stone-700" />
                <h3 className="text-xs font-bold text-stone-900 font-mono uppercase">
                  Evidence Audit & Provenance Verification
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase ${
                    candidateResult.evidence_audit.audit_status === 'pass'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {candidateResult.evidence_audit.audit_status === 'pass' ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                  )}
                  <span>Status: {candidateResult.evidence_audit.audit_status}</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                    candidateResult.evidence_audit.original_only_evidence_used_for_measurement === false
                      ? 'bg-stone-200 text-stone-800'
                      : 'bg-red-200 text-red-900'
                  }`}
                >
                  Original-Only Used: {String(candidateResult.evidence_audit.original_only_evidence_used_for_measurement)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white border border-stone-200 rounded space-y-1">
                <span className="text-stone-500 font-mono text-[10px] uppercase font-bold block">
                  Original Secondary Contribution:
                </span>
                <p className="text-stone-800 text-[11px]">
                  {candidateResult.evidence_audit.original_secondary_contribution}
                </p>
              </div>

              <div className="p-3 bg-white border border-stone-200 rounded space-y-1">
                <span className="text-stone-500 font-mono text-[10px] uppercase font-bold block">
                  Original-Only Observations:
                </span>
                <p className="text-stone-800 text-[11px]">
                  {candidateResult.evidence_audit.original_only_observations}
                </p>
              </div>

              <div className="p-3 bg-white border border-stone-200 rounded space-y-1">
                <span className="text-stone-500 font-mono text-[10px] uppercase font-bold block">
                  Classification Limitations:
                </span>
                <p className="text-stone-800 text-[11px]">
                  {candidateResult.evidence_audit.classification_limitations}
                </p>
              </div>

              <div className="p-3 bg-white border border-stone-200 rounded space-y-1">
                <span className="text-stone-500 font-mono text-[10px] uppercase font-bold block">
                  Uncertainty / Boundary Summary:
                </span>
                <p className="text-stone-800 text-[11px]">
                  {candidateResult.evidence_audit.uncertainty}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 border border-dashed border-indigo-200 rounded-lg text-center space-y-2 bg-indigo-50/20">
          <Layers className="w-8 h-8 text-indigo-400 mx-auto" />
          <p className="text-xs font-medium text-stone-700">
            No v3.3 candidate inference executed yet for this case.
          </p>
          <p className="text-[11px] text-stone-500 max-w-md mx-auto">
            Click <strong>RUN v3.3 CANDIDATE</strong> above to evaluate the active paired images using Gemma 4 31B and the Step 6 Deterministic Pixel Measurement Engine.
          </p>
        </div>
      )}
    </section>
  );
};

