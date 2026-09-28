/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { Upload, AlertTriangle, Play, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';
import { SAMPLE_CASES, SampleCase } from '../data/sampleCases';

interface ImageUploadZoneProps {
  onAnalyze: (payload: {
    imageId: string;
    pixelClassificationBase64: string;
    pixelClassificationMimeType: string;
    originalBase64: string;
    originalMimeType: string;
    pixelClassificationFilename: string;
    originalFilename: string;
  }) => void;
  isLoading: boolean;
  onSelectSampleCase: (sample: SampleCase) => void;
  activeImageId: string;
  activePixelClassificationUrl: string | null;
  activeOriginalUrl: string | null;
}

export const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
  onAnalyze,
  isLoading,
  onSelectSampleCase,
  activeImageId,
  activePixelClassificationUrl,
  activeOriginalUrl
}) => {
  const [pixelFile, setPixelFile] = useState<{ name: string; url: string; mimeType: string } | null>(null);
  const [origFile, setOrigFile] = useState<{ name: string; url: string; mimeType: string } | null>(null);
  const [derivedId, setDerivedId] = useState<string>(activeImageId || 'IMG_001');
  const [overrideMismatch, setOverrideMismatch] = useState<boolean>(false);

  const pixelInputRef = useRef<HTMLInputElement>(null);
  const origInputRef = useRef<HTMLInputElement>(null);

  // Derive Image ID automatically from filenames
  const extractIdFromFilename = (filename: string): string => {
    // Look for patterns like IMG_001_PIXEL_CLASSIFICATION, CASE_04_ORIGINAL, or just prefix
    const cleaned = filename.replace(/\.[^/.]+$/, ''); // remove extension
    const match = cleaned.match(/^([A-Za-z0-9_-]+?)(?:_PIXEL_CLASSIFICATION|_ORIGINAL|_SEG|_RGB)?$/i);
    if (match && match[1]) {
      return match[1].replace(/_PIXEL_CLASSIFICATION|_ORIGINAL|_SEG|_RGB/i, '');
    }
    return cleaned;
  };

  const pixelId = pixelFile ? extractIdFromFilename(pixelFile.name) : '';
  const origId = origFile ? extractIdFromFilename(origFile.name) : '';
  const hasMismatch = pixelFile && origFile && pixelId.toLowerCase() !== origId.toLowerCase() && pixelId !== '' && origId !== '';

  useEffect(() => {
    if (pixelFile && origFile) {
      if (!hasMismatch) {
        setDerivedId(pixelId || origId || 'IMG_CASE');
      } else {
        setDerivedId(`${pixelId}_VS_${origId}`);
      }
    } else if (pixelFile) {
      setDerivedId(pixelId);
    } else if (origFile) {
      setDerivedId(origId);
    }
  }, [pixelFile, origFile, hasMismatch, pixelId, origId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isPrimary: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (isPrimary) {
        setPixelFile({ name: file.name, url: dataUrl, mimeType: file.type || 'image/png' });
      } else {
        setOrigFile({ name: file.name, url: dataUrl, mimeType: file.type || 'image/jpeg' });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLoadSample = (sample: SampleCase) => {
    setPixelFile({
      name: sample.pixelClassificationFilename,
      url: sample.pixelClassificationDataUrl,
      mimeType: 'image/svg+xml'
    });
    setOrigFile({
      name: sample.originalFilename,
      url: sample.originalDataUrl,
      mimeType: 'image/svg+xml'
    });
    setDerivedId(sample.id);
    onSelectSampleCase(sample);
  };

  const handleAnalyzeClick = () => {
    const primaryUrl = pixelFile?.url || activePixelClassificationUrl;
    const secondaryUrl = origFile?.url || activeOriginalUrl;

    if (!primaryUrl || !secondaryUrl) return;

    onAnalyze({
      imageId: derivedId || 'IMG_CASE',
      pixelClassificationBase64: primaryUrl,
      pixelClassificationMimeType: pixelFile?.mimeType || 'image/png',
      originalBase64: secondaryUrl,
      originalMimeType: origFile?.mimeType || 'image/jpeg',
      pixelClassificationFilename: pixelFile?.name || 'IMG_PIXEL_CLASSIFICATION.jpg',
      originalFilename: origFile?.name || 'IMG_ORIGINAL.jpg'
    });
  };

  const isReadyToAnalyze = (pixelFile?.url || activePixelClassificationUrl) &&
    (origFile?.url || activeOriginalUrl) &&
    (!hasMismatch || overrideMismatch);

  return (
    <section className="bg-white border border-stone-200 rounded-lg p-5 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 mb-4 border-b border-stone-200">
        <div>
          <h2 className="text-base font-bold text-stone-900 font-mono tracking-tight flex items-center gap-2">
            <span>INPUT: DUAL-IMAGE ALIGNED PAIR</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            The frozen Pixel-Classification-Primary inference core requires paired Primary (Pixel Classification) and Secondary (Original) streetscape views.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-stone-500 uppercase flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-stone-400" /> Presets:
          </span>
          <div className="flex gap-1.5">
            {SAMPLE_CASES.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleLoadSample(sample)}
                className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
                  derivedId === sample.id
                    ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
                title={sample.name}
              >
                {sample.id}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dual Upload Slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PRIMARY: PIXEL CLASSIFICATION (LEFT) */}
        <div className="flex flex-col gap-2 p-3.5 rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-700 text-white text-[11px] font-mono font-bold rounded">
                PRIMARY
              </span>
              <span className="text-xs font-bold text-stone-900">
                ANALYTICAL EVIDENCE
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-800">
              IMG_###_PIXEL_CLASSIFICATION
            </span>
          </div>

          <div
            onClick={() => pixelInputRef.current?.click()}
            className="mt-1 flex flex-col items-center justify-center p-4 border border-emerald-200 bg-white rounded-md cursor-pointer hover:bg-emerald-50/50 transition-colors min-h-[140px]"
          >
            {pixelFile?.url || activePixelClassificationUrl ? (
              <div className="flex flex-col items-center gap-2 text-center w-full">
                <img
                  src={pixelFile?.url || activePixelClassificationUrl!}
                  alt="Pixel Classification Preview"
                  className="max-h-24 w-auto object-contain rounded border border-stone-200"
                />
                <span className="text-xs font-mono text-emerald-900 font-medium truncate max-w-full">
                  {pixelFile?.name || 'IMG_001_PIXEL_CLASSIFICATION.jpg'}
                </span>
                <span className="text-[11px] text-stone-400">Click to replace</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-center text-stone-500">
                <Upload className="w-6 h-6 text-emerald-600" />
                <span className="text-xs font-medium text-stone-700">Upload PIXEL_CLASSIFICATION Image</span>
                <span className="text-[11px] text-stone-400">Semantic segmented map (PNG, JPG, SVG)</span>
              </div>
            )}
            <input
              ref={pixelInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, true)}
            />
          </div>
        </div>

        {/* SECONDARY: ORIGINAL (RIGHT) */}
        <div className="flex flex-col gap-2 p-3.5 rounded-lg border-2 border-dashed border-sky-300 bg-sky-50/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-sky-700 text-white text-[11px] font-mono font-bold rounded">
                SECONDARY
              </span>
              <span className="text-xs font-bold text-stone-900">
                CLARIFICATION REFERENCE
              </span>
            </div>
            <span className="text-[11px] font-mono text-sky-800">
              IMG_###_ORIGINAL
            </span>
          </div>

          <div
            onClick={() => origInputRef.current?.click()}
            className="mt-1 flex flex-col items-center justify-center p-4 border border-sky-200 bg-white rounded-md cursor-pointer hover:bg-sky-50/50 transition-colors min-h-[140px]"
          >
            {origFile?.url || activeOriginalUrl ? (
              <div className="flex flex-col items-center gap-2 text-center w-full">
                <img
                  src={origFile?.url || activeOriginalUrl!}
                  alt="Original Reference Preview"
                  className="max-h-24 w-auto object-contain rounded border border-stone-200"
                />
                <span className="text-xs font-mono text-sky-900 font-medium truncate max-w-full">
                  {origFile?.name || 'IMG_001_ORIGINAL.jpg'}
                </span>
                <span className="text-[11px] text-stone-400">Click to replace</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-center text-stone-500">
                <Upload className="w-6 h-6 text-sky-600" />
                <span className="text-xs font-medium text-stone-700">Upload ORIGINAL Streetscape Photo</span>
                <span className="text-[11px] text-stone-400">Photographic reference (PNG, JPG, SVG)</span>
              </div>
            )}
            <input
              ref={origInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, false)}
            />
          </div>
        </div>
      </div>

      {/* ID Verification & Mismatch Warning */}
      <div className="mt-4 pt-3 border-t border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-stone-500">DERIVED CASE ID:</span>
          <input
            type="text"
            value={derivedId}
            onChange={(e) => setDerivedId(e.target.value)}
            className="px-2 py-1 bg-stone-100 border border-stone-300 rounded font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-500 w-32"
          />
        </div>

        {hasMismatch && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs bg-amber-50 border border-amber-300 text-amber-900 p-2 rounded">
            <div className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Image ID Mismatch Warning:</span>
            </div>
            <span className="text-amber-800">
              Primary ({pixelId}) does not match Secondary ({origId}).
            </span>
            <label className="flex items-center gap-1 cursor-pointer font-medium text-amber-900 ml-2">
              <input
                type="checkbox"
                checked={overrideMismatch}
                onChange={(e) => setOverrideMismatch(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Override and proceed</span>
            </label>
          </div>
        )}

        <button
          onClick={handleAnalyzeClick}
          disabled={!isReadyToAnalyze || isLoading}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-md font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-xs ${
            isReadyToAnalyze && !isLoading
              ? 'bg-stone-900 hover:bg-stone-800 text-white cursor-pointer'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-stone-400" />
              <span>EXECUTING FROZEN v3.2-RC1 INFERENCE...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              <span>ANALYZE STREETSCAPE</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
};
