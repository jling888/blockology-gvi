/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Binary,
  BrainCircuit,
  Compass,
  Calculator,
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Layers,
  Database
} from 'lucide-react';
import {
  V33_MEASUREMENT_OWNERSHIP,
  V33MeasurementOwner,
  V33DefinitionStatus,
  V33AppImplementationStatus,
  TAXONOMY_REQUIREMENT_WARNING
} from '../research/v33MeasurementOwnership';

export const MeasurementOwnershipPanel: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const getOwnerBadge = (owner: V33MeasurementOwner) => {
    switch (owner) {
      case 'pixel_classification_code':
        return {
          label: 'PIXEL / CLASSIFICATION CODE',
          className: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          icon: Binary,
        };
      case 'vlm_spatial_reasoning':
        return {
          label: 'VLM SPATIAL REASONING',
          className: 'bg-sky-100 text-sky-900 border-sky-300',
          icon: BrainCircuit,
        };
      case 'geometry_gis':
        return {
          label: 'GEOMETRY / GIS',
          className: 'bg-indigo-100 text-indigo-900 border-indigo-300',
          icon: Compass,
        };
      case 'deterministic_synthesis':
        return {
          label: 'DETERMINISTIC SYNTHESIS',
          className: 'bg-purple-100 text-purple-900 border-purple-300',
          icon: Calculator,
        };
      case 'behavioral_observation':
        return {
          label: 'BEHAVIORAL OBSERVATION',
          className: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: Activity,
        };
      case 'spatial_model':
        return {
          label: 'SPATIAL NETWORK MODEL',
          className: 'bg-stone-200 text-stone-900 border-stone-400',
          icon: Database,
        };
      case 'pending_definition':
      default:
        return {
          label: 'PENDING DEFINITION',
          className: 'bg-rose-100 text-rose-900 border-rose-300',
          icon: AlertTriangle,
        };
    }
  };

  const getStatusBadge = (status: V33DefinitionStatus) => {
    switch (status) {
      case 'defined':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'conditionally_defined':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'pending_formal_specification':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'downstream':
        return 'bg-stone-100 text-stone-700 border-stone-300';
      default:
        return 'bg-stone-50 text-stone-600 border-stone-200';
    }
  };

  const getImplementationBadge = (status: V33AppImplementationStatus) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'candidate_available':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'legacy_available':
        return 'bg-stone-100 text-stone-700 border-stone-300';
      case 'not_implemented':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'outside_current_scope':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-stone-50 text-stone-600 border-stone-200';
    }
  };

  const filteredEntries = V33_MEASUREMENT_OWNERSHIP.filter((entry) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'network_gwr') {
      return entry.primaryOwner === 'spatial_model';
    }
    return entry.primaryOwner === activeFilter;
  });

  const categories = [
    { id: 'all', label: 'All Research Variables', count: V33_MEASUREMENT_OWNERSHIP.length },
    { id: 'pixel_classification_code', label: 'Pixel Evidence', count: V33_MEASUREMENT_OWNERSHIP.filter(e => e.primaryOwner === 'pixel_classification_code').length },
    { id: 'vlm_spatial_reasoning', label: 'Paper VLM / Spatial Reasoning', count: V33_MEASUREMENT_OWNERSHIP.filter(e => e.primaryOwner === 'vlm_spatial_reasoning').length },
    { id: 'geometry_gis', label: 'Geometry / GIS', count: V33_MEASUREMENT_OWNERSHIP.filter(e => e.primaryOwner === 'geometry_gis').length },
    { id: 'network_gwr', label: 'Space Syntax / GWR', count: V33_MEASUREMENT_OWNERSHIP.filter(e => e.primaryOwner === 'spatial_model').length },
    { id: 'deterministic_synthesis', label: 'Deterministic Synthesis', count: V33_MEASUREMENT_OWNERSHIP.filter(e => e.primaryOwner === 'deterministic_synthesis').length },
    { id: 'behavioral_observation', label: 'Behavioral Observation', count: V33_MEASUREMENT_OWNERSHIP.filter(e => e.primaryOwner === 'behavioral_observation').length },
  ];

  return (
    <section className="bg-white border border-stone-200 rounded-lg p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-stone-900 text-white font-mono text-xs font-bold rounded">
              NATURE 9.02 v0.4 PROVENANCE
            </span>
            <h2 className="text-sm font-bold font-mono text-stone-900 uppercase tracking-tight">
              MEASUREMENT OWNERSHIP & DATA PROVENANCE
            </h2>
          </div>
          <p className="text-xs text-stone-500 font-mono mt-1">
            Nature 9.02 ownership boundary: frozen-taxonomy pixel evidence, approved Qwen paper-variable evidence, GIS geometry, Space Syntax/GWR controls, deterministic SIM synthesis, and behavioral observation remain explicitly separated.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1 text-xs font-mono border border-stone-300 rounded hover:bg-stone-50 flex items-center gap-1 text-stone-700"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>COLLAPSE REGISTRY</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>EXPAND REGISTRY ({V33_MEASUREMENT_OWNERSHIP.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Critical Methodological Safeguard Banner */}
      <div className="p-3.5 bg-amber-50/70 border border-amber-300 rounded-md text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold font-mono text-amber-950 text-[11px] uppercase">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Taxonomy Dependency Safeguard (Production Requirement)</span>
        </div>
        <p className="text-amber-900 text-[11px] leading-relaxed">
          {TAXONOMY_REQUIREMENT_WARNING} The frozen 30-class taxonomy supports deterministic exact-RGB pixel evidence, but pixel evidence is not automatically equivalent to the approved Qwen paper-variable measurements.
          Paper-variable substitution remains explicitly gated unless the mapping is validated.
        </p>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {categories.map((cat) => {
              const isSelected = activeFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveFilter(cat.id)}
                  className={`px-2.5 py-1 text-[11px] font-mono rounded border transition-colors flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-stone-900 text-white border-stone-900 font-bold'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`px-1 py-0.2 rounded text-[10px] ${
                      isSelected ? 'bg-stone-800 text-stone-200' : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Registry Table / Grid */}
          <div className="overflow-x-auto border border-stone-200 rounded-lg">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-stone-100 text-stone-700 border-b border-stone-200 text-[11px]">
                  <th className="p-2.5 font-bold">VARIABLE & KEY</th>
                  <th className="p-2.5 font-bold">RESEARCH LAYER</th>
                  <th className="p-2.5 font-bold">PRIMARY OWNER</th>
                  <th className="p-2.5 font-bold">DEFINITION STATUS</th>
                  <th className="p-2.5 font-bold">APP STATUS</th>
                  <th className="p-2.5 font-bold">DEPENDENCIES & METHODOLOGICAL NOTES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 font-sans">
                {filteredEntries.map((item) => {
                  const owner = getOwnerBadge(item.primaryOwner);
                  const OwnerIcon = owner.icon;
                  const statusClass = getStatusBadge(item.definitionStatus);
                  const implementationClass = getImplementationBadge(item.currentAppStatus);

                  return (
                    <tr key={item.key} className="hover:bg-stone-50/70 transition-colors">
                      {/* Variable */}
                      <td className="p-2.5 align-top min-w-[200px]">
                        <div className="font-bold text-stone-900 text-xs">{item.label}</div>
                        <code className="text-[10px] font-mono text-stone-500 bg-stone-100 px-1 py-0.5 rounded mt-0.5 inline-block">
                          {item.key}
                        </code>
                      </td>

                      {/* Research Layer */}
                      <td className="p-2.5 align-top text-[11px] text-stone-700 min-w-[150px] font-mono">
                        {item.researchLayer}
                      </td>

                      {/* Primary Owner */}
                      <td className="p-2.5 align-top min-w-[170px]">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold rounded border uppercase ${owner.className}`}
                        >
                          <OwnerIcon className="w-3 h-3 shrink-0" />
                          <span>{owner.label}</span>
                        </span>
                      </td>

                      {/* Definition Status */}
                      <td className="p-2.5 align-top min-w-[150px]">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-mono font-bold rounded border uppercase ${statusClass}`}
                        >
                          {item.definitionStatus.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* App Status */}
                      <td className="p-2.5 align-top min-w-[140px]">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-mono font-bold rounded border uppercase ${implementationClass}`}
                        >
                          {item.currentAppStatus.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Notes & Dependencies */}
                      <td className="p-2.5 align-top text-[11px] text-stone-600 space-y-1">
                        <p className="leading-snug">{item.notes}</p>
                        {item.dependencies.length > 0 && (
                          <div className="pt-1 text-[10px] font-mono text-stone-500">
                            <span className="font-semibold text-stone-700">Dependencies: </span>
                            {item.dependencies.join(' • ')}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-stone-500 font-mono">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-stone-400" />
              <span>Nature 9.02 Registry: {V33_MEASUREMENT_OWNERSHIP.length} Research Variable / Evidence Classifications</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-emerald-700 font-semibold">● Pixel: deterministic evidence</span>
              <span className="text-sky-700 font-semibold">● Qwen: gated normalized visual-semantic inputs</span>
              <span className="text-stone-700 font-semibold">● Space Syntax: network controls</span>
              <span className="text-purple-700 font-semibold">● SIM: deterministic synthesis</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
