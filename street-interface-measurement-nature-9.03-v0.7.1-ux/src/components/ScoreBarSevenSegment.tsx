/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface ScoreBarSevenSegmentProps {
  primaryScore: number;
  finalScore: number;
  label?: string;
  category?: string;
  hasChanged?: boolean;
}

export const ScoreBarSevenSegment: React.FC<ScoreBarSevenSegmentProps> = ({
  primaryScore,
  finalScore,
  label,
  category,
  hasChanged = false
}) => {
  const segments = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-stone-800">{label}</span>
          {category && <span className="text-stone-400 text-[11px] font-mono">{category}</span>}
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* 7-Segment Bar */}
        <div className="flex items-center gap-1">
          {segments.map((seg) => {
            const isFilledFinal = seg <= finalScore;
            const isFilledPrimary = seg <= primaryScore;
            const isAdjustedSeg = hasChanged && (
              (finalScore > primaryScore && seg > primaryScore && seg <= finalScore) ||
              (finalScore < primaryScore && seg > finalScore && seg <= primaryScore)
            );

            let segmentBg = 'bg-stone-200 border-stone-300';
            if (isFilledFinal) {
              segmentBg = hasChanged
                ? 'bg-amber-600 border-amber-700'
                : 'bg-stone-800 border-stone-900';
            }

            return (
              <div
                key={seg}
                title={`Level ${seg} (Primary: ${isFilledPrimary ? 'Active' : 'Inactive'}, Final: ${isFilledFinal ? 'Active' : 'Inactive'})`}
                className={`w-3.5 h-6 rounded-xs border transition-colors ${segmentBg} ${
                  isAdjustedSeg ? 'ring-1 ring-amber-400' : ''
                }`}
              />
            );
          })}
        </div>

        {/* Numeric Representation: Primary → Final / 7 */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className={`font-semibold ${hasChanged ? 'text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200' : 'text-stone-900'}`}>
            {primaryScore} → {finalScore}
          </span>
          <span className="text-stone-400">/ 7</span>
        </div>
      </div>
    </div>
  );
};
