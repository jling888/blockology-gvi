/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ResearchSectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export const ResearchSectionHeader: React.FC<ResearchSectionHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  action,
  badge,
  className = '',
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 mb-4 ${className}`}>
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-stone-600 shrink-0" />}
          <h2 className="text-sm font-bold text-stone-900 font-mono tracking-tight uppercase">
            {title}
          </h2>
          {badge}
        </div>
        {subtitle && (
          <p className="text-xs text-stone-500 font-sans leading-relaxed max-w-3xl">
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <div className="flex items-center gap-2 shrink-0">
          {action}
        </div>
      )}
    </div>
  );
};
