/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VlmStreetscapeEvaluationV31 } from '../types';
import { ScoreBarSevenSegment } from './ScoreBarSevenSegment';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface AuditedScoresPanelProps {
  evaluation: VlmStreetscapeEvaluationV31;
}

export const AuditedScoresPanel: React.FC<AuditedScoresPanelProps> = ({ evaluation }) => {
  const scoreMetrics = [
    {
      id: 'greenery',
      title: '1. Eye-Level Greenery',
      category: 'VEGETATIVE PRESENCE',
      primary: evaluation.eye_level_greenery_score_primary,
      final: evaluation.eye_level_greenery_score,
      description: 'Density, volume, and visual dominance of vegetative canopy and understory at pedestrian eye level.'
    },
    {
      id: 'framing',
      title: '2. Street Framing / Enclosure',
      category: 'SPATIAL CANYON RATIO',
      primary: evaluation.framing_score_primary,
      final: evaluation.framing_score,
      description: 'Continuous vertical building massing, street wall definition, and vertical sky exposure ratio.'
    },
    {
      id: 'identity',
      title: '3. Place Identity',
      category: 'MORPHOLOGICAL SUPPORT',
      primary: evaluation.place_identity_score_primary,
      final: evaluation.place_identity_score,
      description: 'Architectural distinctiveness, spatial legibility, and character differentiation.'
    },
    {
      id: 'attachment',
      title: '4. Place Attachment Potential',
      category: 'SENSE OF PLACE AFFORDANCE',
      primary: evaluation.place_attachment_score_primary,
      final: evaluation.place_attachment_score,
      description: 'Pedestrian microclimate comfort, shelter quality, human scale, and lingering magnetism.'
    },
    {
      id: 'dependence',
      title: '5. Place Dependence Potential',
      category: 'FUNCTIONAL CONNECTIVITY',
      primary: evaluation.place_dependence_score_primary,
      final: evaluation.place_dependence_score,
      description: 'Sidewalk continuity, multi-modal interface safety, and right-of-way connectivity affordance.'
    }
  ];

  const anyScoreChanged = scoreMetrics.some(m => m.primary !== m.final);

  return (
    <section className="bg-white border border-stone-200 rounded-lg p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold font-mono text-stone-900 uppercase tracking-tight">
              FIVE AUDITED SCORES (PRIMARY → FINAL)
            </h3>
            <span className="px-1.5 py-0.2 bg-stone-100 text-stone-600 border border-stone-300 rounded font-mono text-[9px] font-semibold">
              LEGACY v3.2-RC1 OUTPUT — retained during v3.3 migration
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Strict 1–7 scale evaluated first on Pixel Classification (Primary), then permitted clarification via Original (Final).
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="px-2 py-0.5 bg-stone-100 text-stone-700 rounded border border-stone-200">
            Scale: 1 (Min) – 7 (Max)
          </span>
          {anyScoreChanged ? (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 rounded font-semibold">
              <AlertCircle className="w-3 h-3 text-amber-600" /> Score Clarification Active
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded font-semibold">
              <CheckCircle className="w-3 h-3 text-emerald-600" /> Primary = Final
            </span>
          )}
        </div>
      </div>

      {/* Grid of 5 Score Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {scoreMetrics.map((metric) => {
          const hasChanged = metric.primary !== metric.final;

          return (
            <div
              key={metric.id}
              className={`p-3.5 rounded-md border flex flex-col justify-between transition-colors ${
                hasChanged
                  ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-200'
                  : 'bg-stone-50/50 border-stone-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-stone-400">
                    {metric.category}
                  </span>
                  {hasChanged && (
                    <span className="px-1.5 py-0.2 bg-amber-200/80 text-amber-900 text-[10px] font-mono font-bold rounded">
                      ADJUSTED
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-bold text-stone-900 mb-1">
                  {metric.title}
                </h4>
                <p className="text-[11px] text-stone-500 leading-tight mb-3">
                  {metric.description}
                </p>
              </div>

              <div>
                <ScoreBarSevenSegment
                  primaryScore={metric.primary}
                  finalScore={metric.final}
                  hasChanged={hasChanged}
                />

                {/* Score change justification underneath if changed */}
                {hasChanged && (
                  <div className="mt-2.5 pt-2 border-t border-amber-200/70 text-[11px] text-amber-900 font-sans">
                    <span className="font-semibold font-mono text-[10px] uppercase text-amber-800 block mb-0.5">
                      Clarification Justification:
                    </span>
                    {evaluation.score_change_summary}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
