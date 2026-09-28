/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Vision Evidence Pair Viewer (Step 2)
 */

import React from 'react';
import { Eye, Layers, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

interface VisionEvidenceSectionProps {
  pixelClassificationUrl: string;
  originalUrl: string;
  imageId: string;
  pixelClassificationFilename?: string;
  originalFilename?: string;
}

export const VisionEvidenceSection: React.FC<VisionEvidenceSectionProps> = ({
  pixelClassificationUrl,
  originalUrl,
  imageId,
  pixelClassificationFilename,
  originalFilename,
}) => {
  return (
    <section id="vision-evidence" className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-stone-900 text-stone-100 rounded">
              VISION EVIDENCE
            </span>
            <h2 className="text-base font-bold text-stone-900 font-mono tracking-tight flex items-center gap-2">
              <Eye className="w-4 h-4 text-stone-700" />
              <span>Vision Evidence Pair</span>
            </h2>
          </div>
          <p className="text-xs text-stone-500 font-sans mt-0.5">
            Exact-RGB semantic classification evidence supports deterministic quantitative measurement; source-file integrity is audited separately, while the original street view provides optical context.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-stone-500">
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
            Exact-RGB Mask (Primary)
          </span>
          <span>+</span>
          <span className="px-2 py-0.5 bg-sky-50 text-sky-800 rounded border border-sky-200">
            Street View (Secondary)
          </span>
        </div>
      </div>

      {/* Dual Side-by-Side Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LEFT: PRIMARY MASK */}
        <div className="flex flex-col gap-2 p-3 bg-stone-50 rounded-lg border border-stone-200">
          <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-800 text-white font-mono text-[10px] font-bold rounded">
                PRIMARY QUANTITATIVE EVIDENCE
              </span>
              <span className="text-xs font-bold text-stone-900 font-sans">
                SEMANTIC CLASSIFICATION MASK
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-800 truncate max-w-[180px]">
              {pixelClassificationFilename || `${imageId}_PIXEL_CLASSIFICATION.png`}
            </span>
          </div>

          <div className="relative aspect-4/3 sm:aspect-3/2 bg-stone-950 rounded-md overflow-hidden border border-stone-300 flex items-center justify-center shadow-inner">
            <img
              src={pixelClassificationUrl}
              alt="Primary Semantic Classification Mask"
              className="w-full h-full object-contain"
            />
            <div className="absolute bottom-2 left-2 bg-stone-900/85 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur border border-stone-700/50">
              Exact RGB Semantic Layer &bull; 30 Frozen Classes
            </div>
          </div>
        </div>

        {/* RIGHT: SECONDARY PHOTOGRAPH */}
        <div className="flex flex-col gap-2 p-3 bg-stone-50 rounded-lg border border-stone-200">
          <div className="flex items-center justify-between pb-1.5 border-b border-sky-200">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-sky-800 text-white font-mono text-[10px] font-bold rounded">
                SECONDARY OPTICAL REFERENCE
              </span>
              <span className="text-xs font-bold text-stone-900 font-sans">
                ORIGINAL STREET VIEW PHOTO
              </span>
            </div>
            <span className="text-[10px] font-mono text-sky-800 truncate max-w-[180px]">
              {originalFilename || `${imageId}_ORIGINAL.jpg`}
            </span>
          </div>

          <div className="relative aspect-4/3 sm:aspect-3/2 bg-stone-950 rounded-md overflow-hidden border border-stone-300 flex items-center justify-center shadow-inner">
            <img
              src={originalUrl}
              alt="Secondary Street View Photographic Reference"
              className="w-full h-full object-contain"
            />
            <div className="absolute bottom-2 left-2 bg-stone-900/85 text-sky-300 text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur border border-stone-700/50">
              Photographic View &bull; Human-Scale Streetscape
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
