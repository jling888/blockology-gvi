/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VlmStreetscapeEvaluationV31 } from '../types';
import { Trees, SplitSquareVertical, Building2 } from 'lucide-react';

interface MorphologicalClassificationPanelProps {
  evaluation: VlmStreetscapeEvaluationV31;
}

export const MorphologicalClassificationPanel: React.FC<MorphologicalClassificationPanelProps> = ({
  evaluation
}) => {
  const formatValue = (val: any): string => {
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    if (Array.isArray(val)) return val.join(', ');
    if (val === undefined || val === null || val === '') return '—';
    return String(val).replace(/_/g, ' ');
  };

  const getConfidenceBadge = (confidence: string) => {
    const conf = (confidence || '').toLowerCase();
    if (conf === 'high') {
      return (
        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold rounded uppercase">
          HIGH
        </span>
      );
    }
    if (conf === 'medium' || conf === 'moderate') {
      return (
        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-mono font-bold rounded uppercase">
          MEDIUM
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-mono font-bold rounded uppercase">
        LOW
      </span>
    );
  };

  return (
    <section className="bg-white border border-stone-200 rounded-lg p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200">
        <div>
          <h3 className="text-sm font-bold font-mono text-stone-900 uppercase tracking-tight">
            MORPHOLOGICAL CLASSIFICATION
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Structured physical spatial typologies established from primary pixel classification segmentation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Eye-Level Greenery */}
        <div className="bg-stone-50/70 border border-stone-200 rounded-md p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-stone-200">
              <div className="flex items-center gap-1.5 font-bold text-xs text-stone-800">
                <Trees className="w-4 h-4 text-emerald-600" />
                <span>Eye-Level Greenery</span>
              </div>
              {getConfidenceBadge(evaluation.greenery_confidence)}
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[11px] font-mono text-stone-400 block uppercase">
                  greenery_types
                </span>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {Array.isArray(evaluation.greenery_types) && evaluation.greenery_types.length > 0 ? (
                    evaluation.greenery_types.map((gt, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-white border border-stone-200 font-mono text-[11px] text-stone-700 rounded"
                      >
                        {formatValue(gt)}
                      </span>
                    ))
                  ) : (
                    <span className="font-mono text-stone-600">none</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-mono text-stone-400 block uppercase">
                  greenery_vertical_position
                </span>
                <span className="font-mono font-medium text-stone-800 capitalize">
                  {formatValue(evaluation.greenery_vertical_position)}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-mono text-stone-400 block uppercase">
                  greenery_confidence
                </span>
                <span className="font-mono font-medium text-stone-800 capitalize">
                  {formatValue(evaluation.greenery_confidence)}
                </span>
              </div>

              {evaluation.eye_level_greenery_rationale && (
                <div className="pt-1.5 border-t border-stone-200/60">
                  <span className="text-[10px] font-mono uppercase text-stone-400 block mb-0.5">
                    eye_level_greenery_rationale
                  </span>
                  <p className="text-[11px] text-stone-700 leading-snug bg-white p-2 rounded border border-stone-200">
                    {evaluation.eye_level_greenery_rationale}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Edge / Interface */}
        <div className="bg-stone-50/70 border border-stone-200 rounded-md p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-stone-200">
              <div className="flex items-center gap-1.5 font-bold text-xs text-stone-800">
                <SplitSquareVertical className="w-4 h-4 text-sky-600" />
                <span>Edge / Interface</span>
              </div>
              {getConfidenceBadge(evaluation.edge_confidence)}
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center py-0.5 border-b border-stone-100">
                <span className="text-[11px] font-mono text-stone-400 uppercase">barrier_present</span>
                <span className={`font-mono text-[11px] font-bold px-1.5 rounded uppercase ${
                  evaluation.barrier_present === 'present' 
                    ? 'bg-amber-100 text-amber-800' 
                    : evaluation.barrier_present === 'uncertain'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-stone-200 text-stone-700'
                }`}>
                  {evaluation.barrier_present === 'present'
                    ? 'PRESENT'
                    : evaluation.barrier_present === 'absent'
                    ? 'ABSENT'
                    : evaluation.barrier_present === 'uncertain'
                    ? 'UNCERTAIN'
                    : String(evaluation.barrier_present || '—').toUpperCase()}
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-stone-100">
                <span className="text-[11px] font-mono text-stone-400 uppercase">edge_type</span>
                <span className="font-mono text-[11px] text-stone-800 capitalize font-medium truncate max-w-[140px]" title={String(evaluation.edge_type)}>
                  {formatValue(evaluation.edge_type)}
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-stone-100">
                <span className="text-[11px] font-mono text-stone-400 uppercase">edge_spatial_relationship</span>
                <span className="font-mono text-[11px] text-stone-800 capitalize font-medium truncate max-w-[140px]" title={String(evaluation.edge_spatial_relationship)}>
                  {formatValue(evaluation.edge_spatial_relationship)}
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-stone-100">
                <span className="text-[11px] font-mono text-stone-400 uppercase">buffering_quality</span>
                <span className="font-mono text-[11px] text-stone-800 capitalize font-medium">
                  {formatValue(evaluation.buffering_quality)}
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5">
                <span className="text-[11px] font-mono text-stone-400 uppercase">lingering_affordance</span>
                <span className="font-mono text-[11px] text-stone-800 capitalize font-medium">
                  {formatValue(evaluation.lingering_affordance)}
                </span>
              </div>

              {evaluation.edge_effect_rationale && (
                <div className="pt-1.5 border-t border-stone-200/60">
                  <span className="text-[10px] font-mono uppercase text-stone-400 block mb-0.5">
                    edge_effect_rationale
                  </span>
                  <p className="text-[11px] text-stone-700 leading-snug bg-white p-2 rounded border border-stone-200">
                    {evaluation.edge_effect_rationale}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Street Canyon / Enclosure */}
        <div className="bg-stone-50/70 border border-stone-200 rounded-md p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-stone-200">
              <div className="flex items-center gap-1.5 font-bold text-xs text-stone-800">
                <Building2 className="w-4 h-4 text-purple-600" />
                <span>Street Canyon / Enclosure</span>
              </div>
              {getConfidenceBadge(evaluation.enclosure_confidence)}
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center py-0.5 border-b border-stone-100">
                <span className="text-[11px] font-mono text-stone-400 uppercase">street_wall_continuity</span>
                <span className="font-mono text-[11px] text-stone-800 capitalize font-medium truncate max-w-[130px]" title={String(evaluation.street_wall_continuity)}>
                  {formatValue(evaluation.street_wall_continuity)}
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-stone-100">
                <span className="text-[11px] font-mono text-stone-400 uppercase">building_vertical_presence</span>
                <span className="font-mono text-[11px] text-stone-800 capitalize font-medium">
                  {formatValue(evaluation.building_vertical_presence)}
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-stone-100">
                <span className="text-[11px] font-mono text-stone-400 uppercase">sky_exposure</span>
                <span className="font-mono text-[11px] text-stone-800 capitalize font-medium">
                  {formatValue(evaluation.sky_exposure)}
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-stone-100">
                <span className="text-[11px] font-mono text-stone-400 uppercase">setback_openness</span>
                <span className="font-mono text-[11px] text-stone-800 capitalize font-medium">
                  {formatValue(evaluation.setback_openness)}
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-stone-100">
                <span className="text-[11px] font-mono text-stone-400 uppercase">vegetation_enclosure</span>
                <span className="font-mono text-[11px] text-stone-800 capitalize font-medium">
                  {formatValue(evaluation.vegetation_enclosure)}
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5">
                <span className="text-[11px] font-mono text-stone-400 uppercase">perceived_hw_ratio</span>
                <span className="font-mono text-[11px] text-stone-800 capitalize font-medium">
                  {formatValue(evaluation.perceived_hw_ratio)}
                </span>
              </div>

              {evaluation.enclosure_rationale && (
                <div className="pt-1.5 border-t border-stone-200/60">
                  <span className="text-[10px] font-mono uppercase text-stone-400 block mb-0.5">
                    enclosure_rationale
                  </span>
                  <p className="text-[11px] text-stone-700 leading-snug bg-white p-2 rounded border border-stone-200">
                    {evaluation.enclosure_rationale}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
