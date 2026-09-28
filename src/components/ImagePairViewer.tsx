/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface ImagePairViewerProps {
  pixelClassificationUrl: string;
  originalUrl: string;
  imageId: string;
  pixelClassificationFilename?: string;
  originalFilename?: string;
}

export const ImagePairViewer: React.FC<ImagePairViewerProps> = ({
  pixelClassificationUrl,
  originalUrl,
  imageId,
  pixelClassificationFilename,
  originalFilename
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-stone-50 border border-stone-200 rounded-lg p-4">
      {/* LEFT: PRIMARY ANALYTICAL EVIDENCE (PIXEL CLASSIFICATION) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-800 text-white font-mono text-[11px] font-bold rounded">
              PRIMARY EVIDENCE (LEFT)
            </span>
            <span className="text-xs font-bold text-stone-900 tracking-tight">
              PIXEL CLASSIFICATION
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-800 font-semibold">
            {pixelClassificationFilename || `IMG_${imageId}_PIXEL_CLASSIFICATION`}
          </span>
        </div>

        <div className="relative aspect-3/2 bg-stone-900 rounded-md overflow-hidden border border-stone-300 flex items-center justify-center">
          <img
            src={pixelClassificationUrl}
            alt="Primary Analytical Evidence - Pixel Classification"
            className="w-full h-full object-contain"
          />
          <div className="absolute bottom-2 left-2 bg-stone-950/80 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur">
            Primary Segmentation Layer
          </div>
        </div>
      </div>

      {/* RIGHT: SECONDARY CLARIFICATION REFERENCE (ORIGINAL) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-sky-200">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-sky-800 text-white font-mono text-[11px] font-bold rounded">
              SECONDARY REFERENCE (RIGHT)
            </span>
            <span className="text-xs font-bold text-stone-900 tracking-tight">
              ORIGINAL PHOTOGRAPH
            </span>
          </div>
          <span className="text-[11px] font-mono text-sky-800 font-semibold">
            {originalFilename || `IMG_${imageId}_ORIGINAL`}
          </span>
        </div>

        <div className="relative aspect-3/2 bg-stone-900 rounded-md overflow-hidden border border-stone-300 flex items-center justify-center">
          <img
            src={originalUrl}
            alt="Secondary Clarification Reference - Original Photograph"
            className="w-full h-full object-contain"
          />
          <div className="absolute bottom-2 left-2 bg-stone-950/80 text-sky-300 text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur">
            Secondary Optical Reference
          </div>
        </div>
      </div>
    </div>
  );
};
