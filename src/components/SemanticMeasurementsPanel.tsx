/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Semantic Measurements Panel (Authoritative 30-Class Deterministic Evidence)
 */

import React, { useState } from 'react';
import {
  V33PixelMeasurementResult,
  FROZEN_30_CLASS_TAXONOMY,
  VISION_BASELINE_VERSION,
  FROZEN_TAXONOMY_VERSION,
} from '../types';
import {
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  SlidersHorizontal,
  Eye,
  Hash,
  Percent,
} from 'lucide-react';

interface SemanticMeasurementsPanelProps {
  pixelMeasurements: V33PixelMeasurementResult | null;
  isLoading?: boolean;
}

type GroupFilter =
  | 'all'
  | 'greenery'
  | 'facade'
  | 'ground'
  | 'roadway'
  | 'edge_barrier'
  | 'micro_spatial'
  | 'dynamic';

export const SemanticMeasurementsPanel: React.FC<SemanticMeasurementsPanelProps> = ({
  pixelMeasurements,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<GroupFilter>('all');
  const [hideZeroCount, setHideZeroCount] = useState(false);
  const [showDetailedTaxonomy, setShowDetailedTaxonomy] = useState(false);

  // Use measurements if available, else fallback to the frozen 30-class taxonomy template with 0 counts
  const measurements = pixelMeasurements?.class_measurements || [];
  const coverage = pixelMeasurements?.coverage;

  const validPixelCount = coverage?.valid_pixel_count || 0;
  const mappedPixelCount = coverage?.mapped_pixel_count || 0;
  const unmappedPixelCount = coverage?.unmapped_pixel_count || 0;
  const mappedFraction = coverage?.mapped_fraction || 0;

  const presentationRecoveryActive =
    pixelMeasurements?.status_reason?.includes(
      'PRESENTATION SCREENSHOT RECOVERY'
    ) ?? false;

  // Filter classes
  const filteredClasses = FROZEN_30_CLASS_TAXONOMY.classes.filter((c) => {
    // Search filter
    const matchesSearch =
      c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.class_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Group filter
    if (selectedGroupFilter !== 'all') {
      if (selectedGroupFilter === 'greenery') {
        const isGreen =
          c.class_id.includes('tree') ||
          c.class_id.includes('shrub') ||
          c.class_id.includes('vegetation') ||
          c.class_id.includes('vertical_green');
        if (!isGreen) return false;
      } else if (selectedGroupFilter === 'facade') {
        const isFacade =
          c.class_id.includes('facade') ||
          c.class_id.includes('glazing') ||
          c.class_id.includes('door') ||
          c.class_id.includes('arcade') ||
          c.class_id === 'sky';
        if (!isFacade) return false;
      } else if (selectedGroupFilter === 'ground') {
        const isGround =
          c.class_id.includes('sidewalk') ||
          c.class_id.includes('curb') ||
          c.class_id.includes('stoop');
        if (!isGround) return false;
      } else if (selectedGroupFilter === 'roadway') {
        const isRoad =
          c.class_id.includes('roadway') ||
          c.class_id.includes('bike_lane');
        if (!isRoad) return false;
      } else if (selectedGroupFilter === 'edge_barrier') {
        const isEdge =
          c.class_id.includes('fence') ||
          c.class_id.includes('wall_ledge') ||
          c.class_id.includes('shed_scaffold');
        if (!isEdge) return false;
      } else if (selectedGroupFilter === 'micro_spatial') {
        const isMicro =
          c.class_id.includes('bench') ||
          c.class_id.includes('chair') ||
          c.class_id.includes('table') ||
          c.class_id.includes('parasol') ||
          c.class_id.includes('planter') ||
          c.class_id.includes('signboard') ||
          c.class_id.includes('awning') ||
          c.class_id.includes('pole') ||
          c.class_id.includes('traffic');
        if (!isMicro) return false;
      } else if (selectedGroupFilter === 'dynamic') {
        const isDyn = c.class_id.includes('person') || c.class_id.includes('vehicle');
        if (!isDyn) return false;
      }
    }

    // Hide zero count filter
    if (hideZeroCount) {
      const match = measurements.find((m) => m.class_id === c.class_id);
      if (!match || match.pixel_count === 0) return false;
    }

    return true;
  });

  // Top detected classes for horizontal distribution bar
  const detectedClassesWithPixels = measurements
    .filter((m) => m.pixel_count > 0)
    .sort((a, b) => b.pixel_count - a.pixel_count);

  return (
    <section id="semantic-measurements" className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-stone-900 text-stone-100 rounded">
              VISION DETAIL
            </span>
            <h2 className="text-base font-bold text-stone-900 font-mono tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-stone-700" />
              <span>Semantic Measurements (Primary Measurable Evidence)</span>
            </h2>
          </div>
          <p className="text-xs text-stone-500 font-sans mt-0.5">
            Exact-RGB raster scan across all 30 frozen semantic classes — no color tolerance, 100% deterministic accounting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-stone-500 bg-stone-100 px-2 py-1 rounded border border-stone-200">
            {detectedClassesWithPixels.length} of 30 Classes Detected
          </span>
          <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
            {(mappedFraction * 100).toFixed(1)}% Mapped
          </span>
        </div>
      </div>

      {presentationRecoveryActive && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5">
          <div className="text-[9px] font-mono font-bold text-amber-900">
            PRESENTATION SCREENSHOT RECOVERY — DEMO ONLY
          </div>

          <p className="text-[9px] text-amber-800 mt-0.5 leading-relaxed">
            This uploaded mask was screenshot-derived and nearest-palette recovered
            before deterministic counting. These values are suitable for UI demonstration
            only. Vision provenance must remain REVIEW REQUIRED until the original RGB_CLEAN PNG is used.
          </p>
        </div>
      )}

      {/* Coverage & Accounting Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-stone-200 rounded-lg p-3 shadow-2xs">
          <div className="text-[10px] font-mono uppercase text-stone-400 font-medium">Valid Pixels</div>
          <div className="text-lg font-mono font-bold text-stone-900 mt-1">
            {validPixelCount > 0 ? validPixelCount.toLocaleString() : '—'}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">Full raster frame (alpha &gt; 0)</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-lg p-3 shadow-2xs">
          <div className="text-[10px] font-mono uppercase text-emerald-600 font-medium">Exact Mapped</div>
          <div className="text-lg font-mono font-bold text-emerald-800 mt-1">
            {mappedPixelCount > 0 ? mappedPixelCount.toLocaleString() : '—'}
          </div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5">
            {validPixelCount > 0 ? `${(mappedFraction * 100).toFixed(2)}% of valid` : '100% exact RGB'}
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-lg p-3 shadow-2xs">
          <div className="text-[10px] font-mono uppercase text-stone-400 font-medium">Unmapped Pixels</div>
          <div className="text-lg font-mono font-bold text-stone-800 mt-1">
            {unmappedPixelCount.toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">
            {validPixelCount > 0 ? `${((unmappedPixelCount / validPixelCount) * 100).toFixed(2)}% unmapped` : 'Zero unmapped'}
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-lg p-3 shadow-2xs">
          <div className="text-[10px] font-mono uppercase text-stone-400 font-medium">Taxonomy State</div>
          <div className="text-sm font-mono font-bold text-stone-900 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>FROZEN 30-CLASS</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5 truncate">{FROZEN_TAXONOMY_VERSION}</div>
        </div>
      </div>

      {/* Visual Color Composition Distribution Bar */}
      {detectedClassesWithPixels.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono font-semibold text-stone-800 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-stone-500" />
              <span>Semantic Pixel Distribution Composition</span>
            </span>
            <span className="text-[11px] font-mono text-stone-400">Exact RGB Class Footprint</span>
          </div>

          <div className="w-full h-5 bg-stone-100 rounded overflow-hidden flex shadow-inner border border-stone-200">
            {detectedClassesWithPixels.map((cm) => {
              const pct = cm.fraction_of_valid_pixels * 100;
              if (pct < 0.2) return null;
              return (
                <div
                  key={cm.class_id}
                  style={{
                    width: `${pct}%`,
                    backgroundColor: `rgb(${cm.rgb.join(',')})`,
                  }}
                  title={`${cm.label}: ${cm.pixel_count.toLocaleString()} px (${pct.toFixed(2)}%)`}
                  className="h-full relative group transition-all cursor-pointer hover:opacity-90"
                />
              );
            })}
          </div>

          {/* Micro Legend */}
          <div className="flex flex-wrap gap-2 pt-1">
            {detectedClassesWithPixels.slice(0, 8).map((cm) => (
              <div
                key={cm.class_id}
                className="flex items-center gap-1.5 px-2 py-0.5 bg-stone-50 border border-stone-200 rounded text-[10px] font-mono text-stone-700"
              >
                <div
                  className="w-2.5 h-2.5 rounded-xs border border-black/20"
                  style={{ backgroundColor: `rgb(${cm.rgb.join(',')})` }}
                />
                <span className="truncate max-w-[140px]">{cm.label}</span>
                <span className="font-bold text-stone-900">
                  {(cm.fraction_of_valid_pixels * 100).toFixed(1)}%
                </span>
              </div>
            ))}
            {detectedClassesWithPixels.length > 8 && (
              <span className="text-[10px] text-stone-400 font-mono self-center">
                +{detectedClassesWithPixels.length - 8} more classes
              </span>
            )}
          </div>
        </div>
      )}

      <div className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="text-[9px] font-mono font-bold uppercase text-stone-600">
            Full Taxonomy Measurement Table
          </div>
          <div className="text-[9px] text-stone-500 mt-0.5">
            Search, group filters and all 30 exact-RGB class rows are secondary audit detail.
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowDetailedTaxonomy((current) => !current)}
          className="px-3 py-1.5 rounded border border-stone-300 bg-white hover:bg-stone-100 text-[9px] font-mono font-bold text-stone-700"
        >
          {showDetailedTaxonomy ? 'HIDE 30-CLASS DETAIL' : 'VIEW FULL 30-CLASS DETAIL'}
        </button>
      </div>

      {showDetailedTaxonomy && (
        <div
          data-export-expand="semantic-taxonomy-detail"
          className="space-y-3"
        >
      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-200 rounded-lg p-3 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search class by name, ID, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded focus:bg-white focus:outline-hidden focus:border-stone-400 font-sans"
          />
        </div>

        {/* Group Filter Chips */}
        <div className="flex flex-wrap items-center gap-1 text-[11px] font-mono">
          {(
            [
              { id: 'all', label: 'All 30' },
              { id: 'greenery', label: 'Greenery' },
              { id: 'facade', label: 'Facade/Sky' },
              { id: 'ground', label: 'Ground' },
              { id: 'edge_barrier', label: 'Edge/Barrier' },
              { id: 'micro_spatial', label: 'Micro-Spatial' },
              { id: 'roadway', label: 'Roadway' },
              { id: 'dynamic', label: 'Dynamic' },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedGroupFilter(filter.id)}
              className={`px-2 py-1 rounded transition-colors ${
                selectedGroupFilter === filter.id
                  ? 'bg-stone-900 text-white font-bold'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {filter.label}
            </button>
          ))}

          <button
            onClick={() => setHideZeroCount(!hideZeroCount)}
            className={`px-2 py-1 rounded border transition-colors flex items-center gap-1 ml-1 ${
              hideZeroCount
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100'
            }`}
            title="Toggle showing only classes with detected pixels"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>{hideZeroCount ? 'Detected Only' : 'Show All'}</span>
          </button>
        </div>
      </div>

      {/* 30-Class Exact Measurements Table */}
      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead className="bg-stone-100 border-b border-stone-200 sticky top-0 z-10 font-mono text-[11px] text-stone-700">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3 w-28">Exact RGB</th>
                <th className="py-2.5 px-3">Semantic Class & Label</th>
                <th className="py-2.5 px-3">Research Groups</th>
                <th className="py-2.5 px-3 text-right">Pixel Count</th>
                <th className="py-2.5 px-3 text-right">% Valid</th>
                <th className="py-2.5 px-3 text-center">Presence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-mono">
              {filteredClasses.map((cls, idx) => {
                const measurement = measurements.find((m) => m.class_id === cls.class_id);
                const count = measurement?.pixel_count ?? 0;
                const fraction = measurement?.fraction_of_valid_pixels ?? 0;
                const pct = (fraction * 100).toFixed(2);
                const isDetected = count > 0;

                return (
                  <tr
                    key={cls.class_id}
                    className={`hover:bg-stone-50/80 transition-colors ${
                      isDetected ? 'bg-emerald-50/20' : 'text-stone-500'
                    }`}
                  >
                    {/* Index */}
                    <td className="py-2 px-3 text-center text-stone-400 text-[10px]">
                      {idx + 1}
                    </td>

                    {/* RGB Swatch */}
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-xs border border-black/20 shrink-0 shadow-2xs"
                          style={{ backgroundColor: `rgb(${cls.rgb.join(',')})` }}
                        />
                        <span className="text-[10px] text-stone-600 font-mono">
                          [{cls.rgb.join(', ')}]
                        </span>
                      </div>
                    </td>

                    {/* Class ID & Label */}
                    <td className="py-2 px-3">
                      <div>
                        <div className="font-semibold text-stone-900 text-xs font-sans">
                          {cls.label}
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono">{cls.class_id}</div>
                      </div>
                    </td>

                    {/* Research Groups */}
                    <td className="py-2 px-3">
                      <div className="flex flex-wrap gap-1">
                        {cls.research_groups.length > 0 ? (
                          cls.research_groups.map((g) => (
                            <span
                              key={g}
                              className="px-1.5 py-0.5 text-[9px] bg-stone-100 text-stone-600 rounded border border-stone-200 font-mono"
                            >
                              {g}
                            </span>
                          ))
                        ) : (
                          <span className="text-stone-300 text-[10px]">—</span>
                        )}
                      </div>
                    </td>

                    {/* Pixel Count */}
                    <td className="py-2 px-3 text-right">
                      <span className={`font-mono ${isDetected ? 'font-bold text-stone-900' : 'text-stone-400'}`}>
                        {count.toLocaleString()}
                      </span>
                    </td>

                    {/* % Valid */}
                    <td className="py-2 px-3 text-right">
                      <span
                        className={`font-mono ${
                          isDetected ? 'font-bold text-emerald-800' : 'text-stone-400'
                        }`}
                      >
                        {isDetected ? `${pct}%` : '0.00%'}
                      </span>
                    </td>

                    {/* Presence */}
                    <td className="py-2 px-3 text-center">
                      {isDetected ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded border border-emerald-300 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>DETECTED</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] text-stone-400 bg-stone-100 rounded inline-block">
                          0 px
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredClasses.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400 text-xs font-sans">
                    No semantic classes match your search and filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
        </div>
      )}
    </section>
  );
};
