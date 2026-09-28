/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Layers } from 'lucide-react';

interface PrimarySnapshotProps {
  summary: string;
  imageId: string;
}

export const PrimarySnapshot: React.FC<PrimarySnapshotProps> = ({ summary, imageId }) => {
  return (
    <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-lg p-4">
      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-emerald-200">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-800" />
          <h3 className="text-xs font-bold font-mono tracking-wider text-emerald-950 uppercase">
            PRIMARY SNAPSHOT
          </h3>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 bg-emerald-100/80 text-emerald-800 font-semibold rounded border border-emerald-200">
          Source: Pixel Classification Primary Evidence ({imageId})
        </span>
      </div>

      <p className="text-xs leading-relaxed text-stone-800 font-sans">
        {summary || 'No primary evidence summary generated.'}
      </p>
    </div>
  );
};
