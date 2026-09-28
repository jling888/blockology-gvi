/**
 * Street Interface Measurement — Nature 9.02 Aligned v0.4
 * Compact disclosure wrapper for secondary / diagnostic research content.
 * Keeps secondary material neatly tucked under a discrete control so the main
 * case view stays focused on primary evidence, Paper variables, and SIM synthesis.
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';

interface ResearchDisclosureProps {
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  variant?: 'neutral' | 'amber' | 'emerald';
  tone?: string;
  icon?: string;
  expandOnExport?: boolean;
}

export const ResearchDisclosure: React.FC<ResearchDisclosureProps> = ({
  title,
  subtitle,
  description,
  badge,
  defaultOpen = false,
  children,
  variant = 'neutral',
  tone,
  icon,
  expandOnExport,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const effectiveSubtitle = subtitle || description;
  const effectiveVariant =
    variant !== 'neutral'
      ? variant
      : tone === 'amber'
      ? 'amber'
      : tone === 'emerald'
      ? 'emerald'
      : 'neutral';

  const borderClass =
    effectiveVariant === 'amber'
      ? 'border-amber-200'
      : effectiveVariant === 'emerald'
      ? 'border-emerald-200'
      : 'border-stone-200';

  const headerBgClass =
    effectiveVariant === 'amber'
      ? 'hover:bg-amber-50/50'
      : effectiveVariant === 'emerald'
      ? 'hover:bg-emerald-50/50'
      : 'hover:bg-stone-50/60';

  return (
    <div className={`bg-white border ${borderClass} rounded-lg overflow-hidden shadow-2xs transition-colors`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-3.5 text-left transition-colors cursor-pointer ${headerBgClass}`}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-stone-400 shrink-0">
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-stone-900">{title}</span>
              {badge && (
                <span className="px-1.5 py-0.5 text-[9px] font-mono font-semibold bg-stone-100 text-stone-600 rounded border border-stone-200">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[11px] text-stone-500 font-sans mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        <span className="text-[10px] font-mono text-stone-400 shrink-0 ml-2">
          {isOpen ? 'Collapse' : 'Expand'}
        </span>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-stone-100 bg-stone-50/30">
          {children}
        </div>
      )}
    </div>
  );
};
