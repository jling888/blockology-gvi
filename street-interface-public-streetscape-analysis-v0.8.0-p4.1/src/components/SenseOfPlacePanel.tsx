/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { VlmStreetscapeEvaluationV31 } from '../types';
import { ScoreBarSevenSegment } from './ScoreBarSevenSegment';
import { Compass, Heart, Footprints, Info } from 'lucide-react';

interface SenseOfPlacePanelProps {
  evaluation: VlmStreetscapeEvaluationV31;
}

export const SenseOfPlacePanel: React.FC<SenseOfPlacePanelProps> = ({ evaluation }) => {
  const getConfidenceBadge = (confidence: string) => {
    const conf = (confidence || '').toLowerCase();
    if (conf === 'high') {
      return (
        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold rounded uppercase">
          CONFIDENCE: HIGH
        </span>
      );
    }
    if (conf === 'medium' || conf === 'moderate') {
      return (
        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-mono font-bold rounded uppercase">
          CONFIDENCE: MEDIUM
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-mono font-bold rounded uppercase">
        CONFIDENCE: LOW
      </span>
    );
  };

  const sections = [
    {
      id: 'identity',
      title: 'Place Identity',
      icon: Compass,
      primaryScore: evaluation.place_identity_score_primary,
      finalScore: evaluation.place_identity_score,
      rationale: evaluation.place_identity_rationale,
      confidence: evaluation.place_identity_confidence
    },
    {
      id: 'attachment',
      title: 'Place Attachment Potential',
      icon: Heart,
      primaryScore: evaluation.place_attachment_score_primary,
      finalScore: evaluation.place_attachment_score,
      rationale: evaluation.place_attachment_rationale,
      confidence: evaluation.place_attachment_confidence
    },
    {
      id: 'dependence',
      title: 'Place Dependence Potential',
      icon: Footprints,
      primaryScore: evaluation.place_dependence_score_primary,
      finalScore: evaluation.place_dependence_score,
      rationale: evaluation.place_dependence_rationale,
      confidence: evaluation.place_dependence_confidence
    }
  ];

  return (
    <section className="bg-white border border-stone-200 rounded-lg p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-stone-200">
        <div>
          <h3 className="text-sm font-bold font-mono text-stone-900 uppercase tracking-tight">
            SENSE OF PLACE — MORPHOLOGICAL SUPPORT POTENTIAL
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Spatial and morphological affordances supporting human perceptual experience and place bonding.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map((sec) => {
          const Icon = sec.icon;
          const hasChanged = sec.primaryScore !== sec.finalScore;

          return (
            <div
              key={sec.id}
              className="bg-stone-50/70 border border-stone-200 rounded-md p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 pb-2 mb-3 border-b border-stone-200">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900">
                    <Icon className="w-4 h-4 text-stone-700" />
                    <span>{sec.title}</span>
                  </div>
                  {getConfidenceBadge(sec.confidence)}
                </div>

                <div className="mb-3">
                  <ScoreBarSevenSegment
                    primaryScore={sec.primaryScore}
                    finalScore={sec.finalScore}
                    hasChanged={hasChanged}
                  />
                </div>

                <div className="text-xs text-stone-700 space-y-1">
                  <span className="text-[10px] font-mono font-semibold uppercase text-stone-400 block">
                    Morphological Rationale:
                  </span>
                  <p className="text-[11px] leading-relaxed text-stone-700 bg-white p-2.5 rounded border border-stone-200">
                    {sec.rationale || 'No rationale recorded.'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mandatory Methodological Note */}
      <div className="mt-4 pt-3 border-t border-stone-100 flex items-start gap-2 text-[11px] text-stone-500 bg-stone-50 p-2.5 rounded border border-stone-200">
        <Info className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
        <p className="font-sans italic">
          Methodological Note: &ldquo;These scores represent visible morphological and spatial support potentials, not direct measurements of psychological states.&rdquo;
        </p>
      </div>
    </section>
  );
};
