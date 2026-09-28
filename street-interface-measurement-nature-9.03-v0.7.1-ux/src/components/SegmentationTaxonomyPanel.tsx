/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Segmentation Taxonomy Reference Panel (30-Class Frozen Baseline)
 */

import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  ShieldCheck,
  Palette,
  Search,
  ChevronDown,
  ChevronUp,
  FileCode2,
} from 'lucide-react';
import {
  FROZEN_30_CLASS_TAXONOMY,
  VISION_BASELINE_VERSION,
  FROZEN_TAXONOMY_VERSION,
  V33SegmentationTaxonomy,
} from '../types';

interface SegmentationTaxonomyPanelProps {
  currentTaxonomy?: V33SegmentationTaxonomy | null;
  onTaxonomyChange?: (taxonomy: V33SegmentationTaxonomy | null) => void;
  readOnly?: boolean;
}

export const SegmentationTaxonomyPanel: React.FC<SegmentationTaxonomyPanelProps> = ({
  currentTaxonomy = FROZEN_30_CLASS_TAXONOMY,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showJsonView, setShowJsonView] = useState(false);

  const activeTaxonomy = currentTaxonomy || FROZEN_30_CLASS_TAXONOMY;

  const filteredClasses = activeTaxonomy.classes.filter(
    (c) =>
      c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.class_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-stone-900 font-mono tracking-tight uppercase">
              Authoritative 30-Class Frozen Semantic Taxonomy
            </h3>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold rounded border border-emerald-300">
              FROZEN &bull; READ-ONLY
            </span>
          </div>
          <p className="text-xs text-stone-500 font-sans mt-0.5">
            Active Baseline: <span className="font-mono font-semibold text-stone-800">{VISION_BASELINE_VERSION}</span> &bull; Taxonomy: <span className="font-mono font-semibold text-emerald-800">{FROZEN_TAXONOMY_VERSION}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowJsonView(!showJsonView)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-mono text-xs rounded border border-stone-300 transition-colors"
          >
            <FileCode2 className="w-3.5 h-3.5 text-stone-500" />
            <span>{showJsonView ? 'Hide Taxonomy JSON' : 'View Taxonomy JSON'}</span>
          </button>
        </div>
      </div>

      {/* JSON Viewer if opened */}
      {showJsonView && (
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase text-stone-400 font-bold">
            Read-Only Taxonomy Specification JSON:
          </span>
          <pre className="p-4 bg-stone-900 text-emerald-300 rounded-lg text-xs font-mono overflow-x-auto max-h-64 border border-stone-800">
            {JSON.stringify(activeTaxonomy, null, 2)}
          </pre>
        </div>
      )}

      {/* Search Filter */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Filter 30 classes by label, class ID, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded focus:bg-white focus:outline-hidden focus:border-stone-400 font-sans"
        />
      </div>

      {/* 30 Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-96 overflow-y-auto pr-1">
        {filteredClasses.map((cls, idx) => (
          <div
            key={cls.class_id}
            className="p-3 bg-stone-50 border border-stone-200 rounded-lg space-y-1.5 hover:border-stone-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-xs border border-black/20 shrink-0 shadow-2xs"
                  style={{ backgroundColor: `rgb(${cls.rgb.join(',')})` }}
                  title={`RGB: [${cls.rgb.join(', ')}]`}
                />
                <div>
                  <div className="text-xs font-bold text-stone-900 font-sans leading-tight">
                    {cls.label}
                  </div>
                  <div className="text-[10px] text-stone-400 font-mono">{cls.class_id}</div>
                </div>
              </div>

              <span className="text-[9px] font-mono text-stone-400">#{idx + 1}</span>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-stone-200/60">
              <span className="text-stone-500">[{cls.rgb.join(', ')}]</span>
              <div className="flex flex-wrap gap-1 justify-end">
                {cls.research_groups.map((g) => (
                  <span
                    key={g}
                    className="px-1 py-0.2 bg-white border border-stone-200 text-stone-600 rounded text-[9px]"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>

            {cls.description && (
              <p className="text-[10px] text-stone-500 font-sans leading-tight pt-0.5">
                {cls.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
