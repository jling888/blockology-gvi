/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Teacher 8/31 Appendix — VLM Visual Grounding Protocol v3.0
 * Experimental one-shot visual-semantic comparison panel.
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Leaf,
  Building2,
  Footprints,
  Info,
} from 'lucide-react';
import {
  PaperVlmImageQuadrant,
  PaperVlmV30Measurement,
} from '../types';

interface PaperVlmProtocolPanelProps {
  imageId: string;
  originalUrl: string;
  originalFilename: string;
  measurement: PaperVlmV30Measurement | null;
  onMeasurementReady: (
    measurement: PaperVlmV30Measurement,
    metadata: { rawResponse: string; modelUsed: string; protocolVersion: string }
  ) => void;
}

const quadrants: PaperVlmImageQuadrant[] = [
  'North',
  'East',
  'South',
  'West',
];

function scoreCell(label: string, value: number | undefined) {
  return (
    <div className="bg-white border border-stone-200 rounded p-2.5">
      <div className="text-[9px] font-mono uppercase text-stone-400">{label}</div>
      <div className="text-lg font-mono font-bold text-stone-900 mt-0.5">
        {typeof value === 'number' ? value.toFixed(3) : '—'}
      </div>
    </div>
  );
}

export const PaperVlmProtocolPanel: React.FC<PaperVlmProtocolPanelProps> = ({
  imageId,
  originalUrl,
  originalFilename,
  measurement,
  onMeasurementReady,
}) => {
  const [quadrant, setQuadrant] = useState<PaperVlmImageQuadrant | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReasoning, setShowReasoning] = useState(false);

  const run = async () => {
    if (!quadrant) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/evaluate-paper-v30', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId,
          imageQuadrant: quadrant,
          originalBase64: originalUrl,
          originalMimeType: originalFilename.toLowerCase().endsWith('.png')
            ? 'image/png'
            : 'image/jpeg',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success || !data.data) {
        throw new Error(data.error || `Server error ${response.status}`);
      }

      onMeasurementReady(data.data, {
        rawResponse: data.rawResponse || JSON.stringify(data.data, null, 2),
        modelUsed: data.modelUsed || 'gemma-4-31b-it',
        protocolVersion: data.protocolVersion || 'teacher_vlm_v3.0_8.31',
      });
    } catch (err: any) {
      setError(err?.message || 'Teacher Gemma comparator inference failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const n = measurement?.natural_environs_imageability;
  const m = measurement?.morphological_containment_identity;
  const p = measurement?.physical_utility_dependence;

  return (
    <section id="paper-vlm-v30" className="bg-white border border-indigo-200 rounded-lg p-4 shadow-xs space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-indigo-700 text-white rounded">
              COMPARATOR
            </span>
            <Sparkles className="w-4 h-4 text-indigo-700" />
            <h2 className="text-base font-bold text-stone-900 font-mono">
              Teacher Appendix Gemma One-Shot — Experimental Comparator
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1 max-w-4xl">
            8/31-style standardized 90° FOV, h_eye=1.5 m, pitch=0° one-shot Gemma pass. Results are retained for comparison against the team Qwen instrument and do not automatically write into active Paper Inputs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={quadrant}
            onChange={(e) => setQuadrant(e.target.value as PaperVlmImageQuadrant | '')}
            className="px-3 py-2 text-xs font-mono bg-stone-50 border border-stone-300 rounded"
          >
            <option value="">Select quadrant</option>
            {quadrants.map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={run}
            disabled={!quadrant || isLoading || !originalUrl}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:bg-stone-300 disabled:text-stone-500 text-white rounded text-[10px] font-mono font-bold"
          >
            <Play className="w-3.5 h-3.5" />
            {isLoading ? 'RUNNING...' : 'RUN ONE-SHOT COMPARATOR'}
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="text-[10px] text-amber-900 leading-relaxed">
          This one-shot Gemma implementation is preserved as an experimental comparator. Even when horizon_alignment_verified is true, its scores remain comparison-only and do not automatically populate Paper External Inputs. The active research bridge uses the separately approved Qwen 7-rung instrument. The strict 8/31 JSON template still has no dedicated numerical SFV field.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded p-3 text-xs text-rose-900 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {measurement && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-900 text-white rounded p-3 text-[10px] font-mono">
            <div className="flex items-center gap-3 flex-wrap">
              <span>{imageId}</span>
              <span>Quadrant: {measurement.node_metadata.image_quadrant}</span>
              <span className={measurement.node_metadata.horizon_alignment_verified ? 'text-emerald-300' : 'text-amber-300'}>
                Horizon: {measurement.node_metadata.horizon_alignment_verified ? 'VERIFIED' : 'NOT VERIFIED'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {measurement.node_metadata.horizon_alignment_verified ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{measurement.analytical_summary.dominant_behavioral_driver}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="border border-emerald-200 bg-emerald-50/30 rounded p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                <Leaf className="w-4 h-4" /> Natural Environs
              </div>
              <div className="grid grid-cols-3 gap-2">
                {scoreCell('V_nat', n?.v_nat_score)}
                {scoreCell('GVI_eye', n?.gvi_eye_score)}
                {scoreCell('GMI', n?.gmi_score)}
              </div>
            </div>

            <div className="border border-sky-200 bg-sky-50/30 rounded p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900">
                <Building2 className="w-4 h-4" /> Morphological Identity
              </div>
              <div className="grid grid-cols-3 gap-2">
                {scoreCell('V_built', m?.v_built_score)}
                {scoreCell('E_proxy', m?.canyon_enclosure_ratio)}
                {scoreCell('V_sign', m?.v_sign_score)}
              </div>
            </div>

            <div className="border border-purple-200 bg-purple-50/30 rounded p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                <Footprints className="w-4 h-4" /> Physical Utility
              </div>
              <div className="grid grid-cols-3 gap-2">
                {scoreCell('V_pave', p?.v_pave_score)}
                {scoreCell('GFAPI', p?.gfapi_score)}
                {scoreCell('IAS', p?.ias_score)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white border border-stone-200 rounded p-3 flex items-center gap-2">
              <Compass className="w-4 h-4 text-stone-500" />
              <div>
                <div className="text-[9px] font-mono text-stone-400 uppercase">Perceptual Coherence</div>
                <div className="font-mono font-bold text-stone-900">{measurement.analytical_summary.perceptual_coherence_index.toFixed(3)}</div>
              </div>
            </div>
            <div className="bg-white border border-stone-200 rounded p-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-stone-500" />
              <div>
                <div className="text-[9px] font-mono text-stone-400 uppercase">VLM Confidence</div>
                <div className="font-mono font-bold text-stone-900">{measurement.analytical_summary.vlm_confidence_score.toFixed(3)}</div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowReasoning((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 bg-stone-50 border border-stone-200 rounded text-[10px] font-mono font-bold text-stone-700"
          >
            <span>{showReasoning ? 'HIDE VLM REASONING' : 'VIEW VLM REASONING'}</span>
            {showReasoning ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showReasoning && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-[10px] leading-relaxed text-stone-700">
              <div className="border border-stone-200 rounded p-3 space-y-2">
                <p><strong>V_nat:</strong> {n?.v_nat_reasoning}</p>
                <p><strong>GVI_eye:</strong> {n?.gvi_eye_reasoning}</p>
                <p><strong>GMI:</strong> {n?.gmi_reasoning}</p>
              </div>
              <div className="border border-stone-200 rounded p-3 space-y-2">
                <p><strong>V_built:</strong> {m?.v_built_reasoning}</p>
                <p><strong>V_sign:</strong> {m?.v_sign_reasoning}</p>
              </div>
              <div className="border border-stone-200 rounded p-3 space-y-2">
                <p><strong>V_pave:</strong> {p?.v_pave_reasoning}</p>
                <p><strong>GFAPI:</strong> {p?.gfapi_reasoning}</p>
                <p><strong>IAS:</strong> {p?.ias_reasoning}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
