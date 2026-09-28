/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Trees,
  Shield,
  Building,
  Armchair,
  ChevronDown,
  ChevronUp,
  Layers
} from 'lucide-react';
import { ResearchSectionHeader } from './ResearchSectionHeader';
import { V33StreetInterfaceMeasurement } from '../types';

interface StreetInterfaceMeasurementsPanelProps {
  measurement: V33StreetInterfaceMeasurement | null;
  isLoading?: boolean;
}

export const StreetInterfaceMeasurementsPanel: React.FC<StreetInterfaceMeasurementsPanelProps> = ({
  measurement,
}) => {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    greenness: false,
    barrier: false,
    enclosure: false,
    affordance: false,
  });

  const toggleExpand = (cardKey: string) => {
    setExpandedCards((prev) => ({ ...prev, [cardKey]: !prev[cardKey] }));
  };

  const getConfidenceBadge = (confidence?: string) => {
    if (!confidence) return null;
    const c = confidence.toLowerCase();
    let style = 'bg-stone-100 text-stone-700 border-stone-300';
    if (c === 'high') style = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    if (c === 'medium') style = 'bg-amber-50 text-amber-800 border-amber-300';
    if (c === 'low' || c === 'uncertain') style = 'bg-stone-100 text-stone-600 border-stone-300';

    return (
      <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded border ${style}`}>
        Conf: {confidence}
      </span>
    );
  };

  const domains = measurement?.measurement_domains;
  const gvi = domains?.eye_level_greenness;
  const ebc = domains?.edge_barrier_density;
  const tef = domains?.transitional_structural_enclosure;
  const sai = domains?.micro_spatial_affordances;

  const renderPresenceOrString = (val?: boolean | string): string => {
    if (val == null) return '—';
    if (typeof val === 'boolean') return val ? 'Present' : 'Absent';
    if (typeof val === 'string') return val.replace(/_/g, ' ');
    return String(val);
  };

  return (
    <section className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
      <ResearchSectionHeader
        title="Street Interface Measurements"
        subtitle="VLM-based qualitative interpretation of classification-grounded spatial relationships."
        icon={Layers}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* =========================================================================
            CARD 1: Eye-Level Greenness
            ========================================================================= */}
        <div className="bg-stone-50/50 border border-stone-200 rounded-lg p-4 flex flex-col justify-between transition-colors">
          <div className="space-y-3">
            {/* Header & Notation */}
            <div className="flex items-start justify-between gap-2 pb-2 border-b border-stone-200">
              <div>
                <div className="flex items-center gap-2">
                  <Trees className="w-4 h-4 text-stone-600 shrink-0" />
                  <h3 className="text-sm font-bold text-stone-900 font-mono">
                    Eye-Level Greenness
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-stone-500 block mt-0.5">
                  GVI_eye — qualitative spatial layer
                </span>
              </div>
              {getConfidenceBadge(gvi?.confidence)}
            </div>

            {/* One-sentence Definition (Always Visible) */}
            <p className="text-xs text-stone-600 font-sans leading-relaxed">
              Describes the spatial configuration, vertical position, continuity, and pedestrian relationship of classification-grounded vegetation.
            </p>

            {/* Primary Values Compact Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              <div className="bg-white border border-stone-200 rounded p-2 text-xs">
                <span className="text-[10px] font-mono text-stone-400 block uppercase">Types</span>
                <span className="font-semibold text-stone-800 block truncate">
                  {gvi?.greenery_types?.length ? gvi.greenery_types.join(', ') : '—'}
                </span>
              </div>
              <div className="bg-white border border-stone-200 rounded p-2 text-xs">
                <span className="text-[10px] font-mono text-stone-400 block uppercase">Vertical Position</span>
                <span className="font-semibold text-stone-800 block capitalize">
                  {gvi?.greenery_vertical_position ? gvi.greenery_vertical_position.replace(/_/g, ' ') : '—'}
                </span>
              </div>
              <div className="bg-white border border-stone-200 rounded p-2 text-xs col-span-2 sm:col-span-1">
                <span className="text-[10px] font-mono text-stone-400 block uppercase">Continuity</span>
                <span className="font-semibold text-stone-800 block capitalize">
                  {gvi?.greenery_continuity ? gvi.greenery_continuity.replace(/_/g, ' ') : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Expandable Reasoning & Method */}
          <div className="mt-3 pt-2 border-t border-stone-200">
            <button
              onClick={() => toggleExpand('greenness')}
              className="w-full flex items-center justify-between text-[11px] font-mono font-medium text-stone-600 hover:text-stone-900 transition-colors py-1 cursor-pointer"
            >
              <span>{expandedCards.greenness ? 'Hide reasoning & method' : 'View reasoning & method'}</span>
              {expandedCards.greenness ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {expandedCards.greenness && (
              <div className="mt-2 space-y-2 text-xs text-stone-700 bg-white border border-stone-200 rounded p-3 font-sans">
                <div>
                  <span className="text-[10px] font-mono font-bold text-stone-500 uppercase block mb-0.5">
                    Pedestrian Relationship Rationale:
                  </span>
                  <p className="leading-relaxed text-stone-800">
                    {gvi?.greenery_pedestrian_relationship || 'Awaiting research inference run.'}
                  </p>
                </div>
                <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-500 font-mono">
                  <span>Source: Primary Pixel Classification grounding | Quantitative eye-level index calculation pending formal ROI specification.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            CARD 2: Edge Barrier Density
            ========================================================================= */}
        <div className="bg-stone-50/50 border border-stone-200 rounded-lg p-4 flex flex-col justify-between transition-colors">
          <div className="space-y-3">
            {/* Header & Notation */}
            <div className="flex items-start justify-between gap-2 pb-2 border-b border-stone-200">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-stone-600 shrink-0" />
                  <h3 className="text-sm font-bold text-stone-900 font-mono">
                    Edge Barrier Density
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-stone-500 block mt-0.5">
                  EBC — qualitative precursor
                </span>
              </div>
              {getConfidenceBadge(ebc?.confidence)}
            </div>

            {/* One-sentence Definition */}
            <p className="text-xs text-stone-600 font-sans leading-relaxed">
              Describes the continuity, type, buffering condition, and spatial relationship of pedestrian-facing street edges and barriers.
            </p>

            {/* Primary Values Compact Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="bg-white border border-stone-200 rounded p-2 text-xs">
                <span className="text-[10px] font-mono text-stone-400 block uppercase">Barrier</span>
                <span className="font-semibold text-stone-800 block capitalize">
                  {renderPresenceOrString(ebc?.barrier_present)}
                </span>
              </div>
              <div className="bg-white border border-stone-200 rounded p-2 text-xs">
                <span className="text-[10px] font-mono text-stone-400 block uppercase">Edge Type</span>
                <span className="font-semibold text-stone-800 block capitalize truncate">
                  {ebc?.edge_type ? ebc.edge_type.replace(/_/g, ' ') : '—'}
                </span>
              </div>
              <div className="bg-white border border-stone-200 rounded p-2 text-xs">
                <span className="text-[10px] font-mono text-stone-400 block uppercase">Continuity</span>
                <span className="font-semibold text-stone-800 block capitalize">
                  {ebc?.barrier_continuity ? ebc.barrier_continuity.replace(/_/g, ' ') : '—'}
                </span>
              </div>
              <div className="bg-white border border-stone-200 rounded p-2 text-xs">
                <span className="text-[10px] font-mono text-stone-400 block uppercase">Buffering</span>
                <span className="font-semibold text-stone-800 block capitalize">
                  {ebc?.buffering_quality ? ebc.buffering_quality.replace(/_/g, ' ') : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Expandable Reasoning & Method */}
          <div className="mt-3 pt-2 border-t border-stone-200">
            <button
              onClick={() => toggleExpand('barrier')}
              className="w-full flex items-center justify-between text-[11px] font-mono font-medium text-stone-600 hover:text-stone-900 transition-colors py-1 cursor-pointer"
            >
              <span>{expandedCards.barrier ? 'Hide reasoning & method' : 'View reasoning & method'}</span>
              {expandedCards.barrier ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {expandedCards.barrier && (
              <div className="mt-2 space-y-2 text-xs text-stone-700 bg-white border border-stone-200 rounded p-3 font-sans">
                <div>
                  <span className="text-[10px] font-mono font-bold text-stone-500 uppercase block mb-0.5">
                    Edge Spatial Relationship:
                  </span>
                  <p className="leading-relaxed text-stone-800">
                    {ebc?.edge_spatial_relationship || 'Awaiting research inference run.'}
                  </p>
                </div>
                <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-500 font-mono">
                  <span>Note: This is a classification-grounded qualitative precursor, not the final numerical EBC index.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            CARD 3: Transitional Structural Enclosure
            ========================================================================= */}
        <div className="bg-stone-50/50 border border-stone-200 rounded-lg p-4 flex flex-col justify-between transition-colors">
          <div className="space-y-3">
            {/* Header & Notation */}
            <div className="flex items-start justify-between gap-2 pb-2 border-b border-stone-200">
              <div>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-stone-600 shrink-0" />
                  <h3 className="text-sm font-bold text-stone-900 font-mono">
                    Transitional Structural Enclosure
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-stone-500 block mt-0.5">
                  TEF — qualitative precursor
                </span>
              </div>
              {getConfidenceBadge(tef?.confidence)}
            </div>

            {/* One-sentence Definition */}
            <p className="text-xs text-stone-600 font-sans leading-relaxed">
              Describes how lateral massing, street-wall continuity, openness, setback, and enclosure conditions shape the pedestrian-scale street section.
            </p>

            {/* Primary Values Compact Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              <div className="bg-white border border-stone-200 rounded p-2 text-xs">
                <span className="text-[10px] font-mono text-stone-400 block uppercase">Street-Wall</span>
                <span className="font-semibold text-stone-800 block capitalize">
                  {tef?.street_wall_continuity ? tef.street_wall_continuity.replace(/_/g, ' ') : '—'}
                </span>
              </div>
              <div className="bg-white border border-stone-200 rounded p-2 text-xs">
                <span className="text-[10px] font-mono text-stone-400 block uppercase">Vertical</span>
                <span className="font-semibold text-stone-800 block capitalize">
                  {tef?.building_vertical_presence ? tef.building_vertical_presence.replace(/_/g, ' ') : '—'}
                </span>
              </div>
              <div className="bg-white border border-stone-200 rounded p-2 text-xs">
                <span className="text-[10px] font-mono text-stone-400 block uppercase">Sky Exposure</span>
                <span className="font-semibold text-stone-800 block capitalize">
                  {tef?.sky_exposure ? tef.sky_exposure.replace(/_/g, ' ') : '—'}
                </span>
              </div>
              <div className="bg-white border border-stone-200 rounded p-2 text-xs">
                <span className="text-[10px] font-mono text-stone-400 block uppercase">Setback</span>
                <span className="font-semibold text-stone-800 block capitalize">
                  {tef?.setback_openness ? tef.setback_openness.replace(/_/g, ' ') : '—'}
                </span>
              </div>
              <div className="bg-white border border-stone-200 rounded p-2 text-xs">
                <span className="text-[10px] font-mono text-stone-400 block uppercase">Perceived H/W</span>
                <span className="font-semibold text-stone-800 block capitalize">
                  {tef?.perceived_hw_ratio || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Expandable Reasoning & Method */}
          <div className="mt-3 pt-2 border-t border-stone-200">
            <button
              onClick={() => toggleExpand('enclosure')}
              className="w-full flex items-center justify-between text-[11px] font-mono font-medium text-stone-600 hover:text-stone-900 transition-colors py-1 cursor-pointer"
            >
              <span>{expandedCards.enclosure ? 'Hide reasoning & method' : 'View reasoning & method'}</span>
              {expandedCards.enclosure ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {expandedCards.enclosure && (
              <div className="mt-2 space-y-2 text-xs text-stone-700 bg-white border border-stone-200 rounded p-3 font-sans">
                <div>
                  <span className="text-[10px] font-mono font-bold text-stone-500 uppercase block mb-0.5">
                    Enclosure Spatial Relationship:
                  </span>
                  <p className="leading-relaxed text-stone-800">
                    {tef?.enclosure_spatial_relationship || 'Awaiting research inference run.'}
                  </p>
                </div>
                {tef?.vegetation_enclosure && (
                  <div>
                    <span className="text-[10px] font-mono font-bold text-stone-500 uppercase block mb-0.5">
                      Vegetation Enclosure Presence:
                    </span>
                    <p className="leading-relaxed text-stone-700 capitalize">
                      {tef.vegetation_enclosure.replace(/_/g, ' ')}
                    </p>
                  </div>
                )}
                <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-500 font-mono">
                  <span>Methodological Note: Perceived H/W is a qualitative perspective estimate; exact H/W is owned by external GIS geometry.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            CARD 4: Micro-Spatial Affordances
            ========================================================================= */}
        <div className="bg-stone-50/50 border border-stone-200 rounded-lg p-4 flex flex-col justify-between transition-colors">
          <div className="space-y-3">
            {/* Header & Notation */}
            <div className="flex items-start justify-between gap-2 pb-2 border-b border-stone-200">
              <div>
                <div className="flex items-center gap-2">
                  <Armchair className="w-4 h-4 text-stone-600 shrink-0" />
                  <h3 className="text-sm font-bold text-stone-900 font-mono">
                    Micro-Spatial Affordances
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-stone-500 block mt-0.5">
                  SAI — qualitative precursor
                </span>
              </div>
              {getConfidenceBadge(sai?.confidence)}
            </div>

            {/* One-sentence Definition */}
            <p className="text-xs text-stone-600 font-sans leading-relaxed">
              Describes classification-grounded spatial conditions that may support stopping, sitting, waiting, edge occupation, or ground-floor interaction.
            </p>

            {/* Primary Values Compact Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="bg-white border border-stone-200 rounded p-2 text-xs">
                <span className="text-[10px] font-mono text-stone-400 block uppercase">Stationary</span>
                <span className="font-semibold text-stone-800 block capitalize">
                  {renderPresenceOrString(sai?.stationary_affordance_present)}
                </span>
              </div>
              <div className="bg-white border border-stone-200 rounded p-2 text-xs">
                <span className="text-[10px] font-mono text-stone-400 block uppercase">Types</span>
                <span className="font-semibold text-stone-800 block truncate">
                  {sai?.stationary_affordance_types?.length ? sai.stationary_affordance_types.join(', ') : '—'}
                </span>
              </div>
              <div className="bg-white border border-stone-200 rounded p-2 text-xs">
                <span className="text-[10px] font-mono text-stone-400 block uppercase">Lingering</span>
                <span className="font-semibold text-stone-800 block capitalize">
                  {sai?.lingering_affordance ? sai.lingering_affordance.replace(/_/g, ' ') : '—'}
                </span>
              </div>
              <div className="bg-white border border-stone-200 rounded p-2 text-xs">
                <span className="text-[10px] font-mono text-stone-400 block uppercase">Permeability</span>
                <span className="font-semibold text-stone-800 block capitalize">
                  {sai?.ground_floor_active_permeability ? sai.ground_floor_active_permeability.replace(/_/g, ' ') : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Expandable Reasoning & Method */}
          <div className="mt-3 pt-2 border-t border-stone-200">
            <button
              onClick={() => toggleExpand('affordance')}
              className="w-full flex items-center justify-between text-[11px] font-mono font-medium text-stone-600 hover:text-stone-900 transition-colors py-1 cursor-pointer"
            >
              <span>{expandedCards.affordance ? 'Hide reasoning & method' : 'View reasoning & method'}</span>
              {expandedCards.affordance ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {expandedCards.affordance && (
              <div className="mt-2 space-y-2 text-xs text-stone-700 bg-white border border-stone-200 rounded p-3 font-sans">
                <div>
                  <span className="text-[10px] font-mono font-bold text-stone-500 uppercase block mb-0.5">
                    Affordance Spatial Relationship:
                  </span>
                  <p className="leading-relaxed text-stone-800">
                    {sai?.affordance_spatial_relationship || 'Awaiting research inference run.'}
                  </p>
                </div>
                <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-500 font-mono">
                  <span>Distinction: Qualitative permeability is an observational precursor; quantitative GFAPI requires multi-class facade parsing.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
