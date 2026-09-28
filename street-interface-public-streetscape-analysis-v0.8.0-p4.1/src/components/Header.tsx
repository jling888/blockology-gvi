/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  BookOpen,
  Layers,
  ShieldCheck,
  Eye,
  Sparkles,
  Network,
} from 'lucide-react';

import {
  VISION_BASELINE_VERSION,
  FROZEN_TAXONOMY_VERSION,
} from '../types';

interface HeaderProps {
  onOpenProtocolInfo: () => void;
  modelName?: string;
  taxonomyStatus?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenProtocolInfo,
}) => {
  return (
    <header className="border-b border-stone-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-stone-900 text-stone-100 rounded-md shrink-0 shadow-xs">
            <Layers className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-stone-900 font-mono">
                Street Interface Measurement
              </h1>

              <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800 rounded border border-emerald-300">
                Nature 9.03 Final · No-Omega v0.7.1-UX1.3 — Final UI Cleanup Candidate
              </span>

              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-sky-100 text-sky-800 rounded border border-sky-300">
                UX1.3 · v0.6.3 SCIENTIFIC CORE UNCHANGED
              </span>
            </div>

            <p className="text-xs text-stone-500 font-sans mt-0.5">
              Human-Scale Streetscape Research Measurement &amp; Synthesis Platform · <span className="font-mono text-[11px] text-stone-700">v0.7.1-UX1.3 finalizes the simplified operator workflow on top of the frozen v0.6.3 scientific core. Active Nature 9.03 SIM mathematics are unchanged.</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 border border-stone-300 text-stone-800 rounded text-[11px]">
            <Eye className="w-3.5 h-3.5 text-stone-500" />
            <span className="text-stone-400 font-medium">VISION:</span>
            <span className="font-semibold text-stone-900">
              {VISION_BASELINE_VERSION} · DETERMINISTIC
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-emerald-700 font-medium">TAXONOMY:</span>
            <span className="font-bold text-emerald-900">
              {FROZEN_TAXONOMY_VERSION} · 30 CLASSES
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 border border-violet-200 text-violet-900 rounded text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span className="text-violet-700 font-medium">VLM:</span>
            <span className="font-bold text-violet-900">
              QWEN · 180° SOURCE · PAPER ALIGNMENT UNRESOLVED
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 border border-sky-200 text-sky-900 rounded text-[11px]">
            <Network className="w-3.5 h-3.5 text-sky-600" />
            <span className="text-sky-700 font-medium">METHOD:</span>
            <span className="font-bold text-sky-900">
              9.03 FINAL · NO-OMEGA + GWR
            </span>
          </div>

          <button
            onClick={onOpenProtocolInfo}
            className="flex items-center gap-1.5 px-3 py-1 bg-stone-900 hover:bg-stone-800 text-white font-sans text-xs font-medium rounded transition-colors ml-1 shadow-xs"
            title="Open Research Protocol & Provenance"
          >
            <BookOpen className="w-3.5 h-3.5 text-stone-300" />
            <span>METHOD &amp; PROVENANCE</span>
          </button>
        </div>
      </div>
    </header>
  );
};
