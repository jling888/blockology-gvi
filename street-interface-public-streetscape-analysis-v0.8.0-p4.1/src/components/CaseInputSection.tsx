/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Case Input Section (Step 1: Primary Vision Evidence Switcher)
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  Upload,
  AlertTriangle,
  Play,
  Sparkles,
  RefreshCw,
  Info,
  Layers,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { SAMPLE_CASES, SampleCase } from '../data/sampleCases';
import {
  VISION_BASELINE_VERSION,
  FROZEN_TAXONOMY_VERSION,
  FROZEN_30_CLASS_TAXONOMY,
} from '../types';

interface CaseInputSectionProps {
  onSelectSampleCase: (sample: SampleCase) => void;
  onRunVisionMeasurement: (payload: {
    imageId: string;
    pixelClassificationBase64: string;
    pixelClassificationMimeType: string;
    originalBase64: string;
    originalMimeType: string;
    pixelClassificationFilename: string;
    originalFilename: string;
    presentationRecoveryMode: boolean;
  }) => void;
  isLoading: boolean;
  activeImageId: string;
  pixelClassificationUrl: string | null;
  originalUrl: string | null;
  pixelClassificationFilename: string;
  originalFilename: string;
}

export const CaseInputSection: React.FC<CaseInputSectionProps> = ({
  onSelectSampleCase,
  onRunVisionMeasurement,
  isLoading,
  activeImageId,
  pixelClassificationUrl,
  originalUrl,
  pixelClassificationFilename,
  originalFilename,
}) => {
  const [pixelFile, setPixelFile] = useState<{ name: string; url: string; mimeType: string } | null>(null);
  const [origFile, setOrigFile] = useState<{ name: string; url: string; mimeType: string } | null>(null);
  const [derivedId, setDerivedId] = useState<string>(activeImageId || 'IMG_001');
  const [overrideMismatch, setOverrideMismatch] = useState<boolean>(false);

  const [primaryFormatError, setPrimaryFormatError] =
    useState<string | null>(null);

  // UX v0.7.1-UX1.1: Presentation Screenshot Recovery is a system default.
  // It is permanently enabled for uploaded semantic masks and has no operator
  // control in the simplified workflow.
  const presentationRecoveryMode = true as const;

  const pixelInputRef = useRef<HTMLInputElement>(null);
  const origInputRef = useRef<HTMLInputElement>(null);

  // Derive Image ID automatically from filenames
  const extractIdFromFilename = (filename: string): string => {
    const cleaned = filename.replace(/\.[^/.]+$/, '');
    const match = cleaned.match(/^([A-Za-z0-9_-]+?)(?:_PIXEL_CLASSIFICATION|_ORIGINAL|_SEG|_RGB)?$/i);
    if (match && match[1]) {
      return match[1].replace(/_PIXEL_CLASSIFICATION|_ORIGINAL|_SEG|_RGB/i, '');
    }
    return cleaned;
  };

  const pixelId = pixelFile ? extractIdFromFilename(pixelFile.name) : extractIdFromFilename(pixelClassificationFilename || '');
  const origId = origFile ? extractIdFromFilename(origFile.name) : extractIdFromFilename(originalFilename || '');
  const hasMismatch = (pixelFile || origFile) && pixelId.toLowerCase() !== origId.toLowerCase() && pixelId !== '' && origId !== '';

  useEffect(() => {
    if (activeImageId) {
      setDerivedId(activeImageId);
    }
  }, [activeImageId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isPrimary: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isPrimary) {
      const extension =
        file.name
          .toLowerCase()
          .split('.')
          .pop();

      const isDeclaredPng =
        file.type === 'image/png' &&
        extension === 'png';

      if (!isDeclaredPng) {
        setPrimaryFormatError(
          `Rejected analytical mask "${file.name}". Research exact-RGB measurement accepts source PNG only; JPEG/JPG, WebP, SVG and other formats are not permitted.`
        );

        // Permit selecting the same file again after correction.
        e.target.value = '';
        return;
      }

      setPrimaryFormatError(null);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (isPrimary) {
        setPixelFile({ name: file.name, url: dataUrl, mimeType: file.type || 'image/png' });
        const autoId = extractIdFromFilename(file.name);
        if (autoId) setDerivedId(autoId);
      } else {
        setOrigFile({ name: file.name, url: dataUrl, mimeType: file.type || 'image/jpeg' });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: SampleCase) => {
    setPrimaryFormatError(null);

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

  const effectivePrimaryUrl = pixelFile?.url || pixelClassificationUrl;
  const effectiveSecondaryUrl = origFile?.url || originalUrl;
  const effectivePrimaryName = pixelFile?.name || pixelClassificationFilename || 'IMG_001_PIXEL_CLASSIFICATION.png';
  const effectiveSecondaryName = origFile?.name || originalFilename || 'IMG_001_ORIGINAL.jpg';

  const isReady =
    !!effectivePrimaryUrl &&
    !!effectiveSecondaryUrl &&
    !primaryFormatError &&
    (!hasMismatch || overrideMismatch);

  const handleRunClick = () => {
    if (!isReady || !effectivePrimaryUrl || !effectiveSecondaryUrl) return;

    onRunVisionMeasurement({
      imageId: derivedId || 'IMG_CASE',
      pixelClassificationBase64: effectivePrimaryUrl,
      pixelClassificationMimeType: pixelFile?.mimeType || 'image/png',
      originalBase64: effectiveSecondaryUrl,
      originalMimeType: origFile?.mimeType || 'image/jpeg',
      pixelClassificationFilename: effectivePrimaryName,
      originalFilename: effectiveSecondaryName,
      presentationRecoveryMode,
    });
  };

  return (
    <section id="case-input" className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-stone-900 text-stone-100 rounded">
              CASE INPUT
            </span>
            <h2 className="text-base font-bold text-stone-900 font-mono tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-stone-700" />
              <span>Case Input &amp; Sampling Node Switcher</span>
            </h2>
          </div>
          <p className="text-xs text-stone-500 font-sans mt-0.5">
            Upload the semantic mask and original street-view image. Screenshot recovery is applied automatically by the system; no operator setting is required. Recovered masks remain DEMO ONLY and do not replace formal RGB_CLEAN research evidence.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          <span className="text-xs font-mono text-stone-500 uppercase flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-stone-400" /> Sampling Nodes:
          </span>
          <div className="flex gap-1">
            {SAMPLE_CASES.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleSelectSample(sample)}
                className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors cursor-pointer ${
                  derivedId === sample.id
                    ? 'bg-stone-900 text-white border-stone-900 font-bold'
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

      {/* Dual Upload / Image Slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PRIMARY: PIXEL CLASSIFICATION (LEFT) */}
        <div className="flex flex-col gap-2 p-3.5 rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-700 text-white text-[10px] font-mono font-bold rounded">
                PRIMARY EVIDENCE
              </span>
              <span className="text-xs font-bold text-stone-900 font-sans">
                Lossless PNG Semantic Mask
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-800 truncate max-w-[180px]">
              {effectivePrimaryName}
            </span>
          </div>

          <div
            onClick={() => pixelInputRef.current?.click()}
            className="mt-1 flex flex-col items-center justify-center p-3 border border-emerald-200 bg-white rounded-md cursor-pointer hover:bg-emerald-50/40 transition-colors min-h-[140px]"
          >
            {effectivePrimaryUrl ? (
              <div className="flex flex-col items-center gap-1.5 text-center w-full">
                <img
                  src={effectivePrimaryUrl}
                  alt="Pixel Classification Preview"
                  className="max-h-28 w-auto object-contain rounded border border-stone-200"
                />
                <span className="text-[11px] font-mono text-emerald-950 font-medium truncate max-w-full">
                  {effectivePrimaryName}
                </span>
                <span className="text-[10px] text-stone-400">Click to replace lossless mask</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-center text-stone-500">
                <Upload className="w-5 h-5 text-emerald-600 mb-1" />
                <span className="text-xs font-medium text-stone-800">Upload Semantic Classification Mask</span>
                <span className="text-[11px] text-stone-400">Lossless PNG RGB raster format required</span>
              </div>
            )}
            <input
              ref={pixelInputRef}
              type="file"
              accept="image/png,.png"
              className="hidden"
              onChange={(e) => handleFileChange(e, true)}
            />
          </div>

          {primaryFormatError && (
            <div className="flex items-start gap-2 rounded border border-rose-300 bg-rose-50 px-2.5 py-2 text-[10px] text-rose-900">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-700" />
              <span>{primaryFormatError}</span>
            </div>
          )}
        </div>

        {/* SECONDARY: ORIGINAL PHOTOGRAPH (RIGHT) */}
        <div className="flex flex-col gap-2 p-3.5 rounded-lg border-2 border-dashed border-sky-300 bg-sky-50/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-sky-700 text-white text-[10px] font-mono font-bold rounded">
                SECONDARY REFERENCE
              </span>
              <span className="text-xs font-bold text-stone-900 font-sans">
                Original Street View Photo
              </span>
            </div>
            <span className="text-[10px] font-mono text-sky-800 truncate max-w-[180px]">
              {effectiveSecondaryName}
            </span>
          </div>

          <div
            onClick={() => origInputRef.current?.click()}
            className="mt-1 flex flex-col items-center justify-center p-3 border border-sky-200 bg-white rounded-md cursor-pointer hover:bg-sky-50/40 transition-colors min-h-[140px]"
          >
            {effectiveSecondaryUrl ? (
              <div className="flex flex-col items-center gap-1.5 text-center w-full">
                <img
                  src={effectiveSecondaryUrl}
                  alt="Original Reference Preview"
                  className="max-h-28 w-auto object-contain rounded border border-stone-200"
                />
                <span className="text-[11px] font-mono text-sky-950 font-medium truncate max-w-full">
                  {effectiveSecondaryName}
                </span>
                <span className="text-[10px] text-stone-400">Click to replace photo</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-center text-stone-500">
                <Upload className="w-5 h-5 text-sky-600 mb-1" />
                <span className="text-xs font-medium text-stone-800">Upload Original Street View Photo</span>
                <span className="text-[11px] text-stone-400">Photographic view for visual verification</span>
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


      {/* Bottom Controls Strip: Case ID, Taxonomy, Run Action */}
      <div className="pt-2 border-t border-stone-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: Case ID & Built-In Read-Only Frozen Taxonomy */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500">SAMPLING NODE:</span>
            <input
              type="text"
              value={derivedId}
              onChange={(e) => setDerivedId(e.target.value)}
              className="px-2 py-1 bg-stone-100 border border-stone-300 rounded font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-500 w-28"
            />
          </div>

          <div className="h-4 w-px bg-stone-200 hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-stone-500">BUILT-IN TAXONOMY:</span>
            <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 rounded border border-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{FROZEN_TAXONOMY_VERSION} (30 Classes)</span>
            </span>
          </div>
        </div>

        {/* Right: Primary Run Button & Helper Note */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
          {hasMismatch && (
            <div className="flex items-center gap-1.5 text-xs bg-amber-50 border border-amber-300 text-amber-900 px-2.5 py-1 rounded">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>ID Mismatch ({pixelId} ≠ {origId})</span>
              <label className="flex items-center gap-1 cursor-pointer font-medium text-amber-900 ml-1">
                <input
                  type="checkbox"
                  checked={overrideMismatch}
                  onChange={(e) => setOverrideMismatch(e.target.checked)}
                  className="rounded text-amber-600"
                />
                <span>Override</span>
              </label>
            </div>
          )}

          <div className="flex flex-col items-end gap-1 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <button
                onClick={handleRunClick}
                disabled={!isReady || isLoading}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-xs ${
                  isReady && !isLoading
                    ? 'bg-stone-900 hover:bg-stone-800 text-white cursor-pointer active:scale-[0.99]'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>MEASURING RASTER PIXELS...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                    <span>RUN VISION MEASUREMENT</span>
                  </>
                )}
              </button>

              <span className="px-2 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-mono font-bold rounded">
                DETERMINISTIC
              </span>
            </div>

            <p className="text-[10px] text-stone-400 font-sans text-right max-w-sm">
              Uploaded analytical masks must pass PNG filename, MIME and binary-signature checks before exact-RGB counting. Built-in SVG samples remain demonstration-only.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
