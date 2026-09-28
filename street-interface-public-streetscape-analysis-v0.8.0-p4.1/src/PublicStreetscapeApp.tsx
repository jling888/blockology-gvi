import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  CircleDot,
  Image as ImageIcon,
  Info,
  Layers3,
  LoaderCircle,
  MapPinned,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react';

import {
  PUBLIC_APP_LABEL,
  PUBLIC_APP_VERSION,
  PUBLIC_PIPELINE_P4,
  PUBLIC_SCIENTIFIC_INVARIANTS,
  type PublicPipelineStageState,
} from './publicAnalysisContract';
import {
  PUBLIC_VM_CONTRACT_VERSION,
  PUBLIC_VM_ROUTE,
  PUBLIC_VM_STATUS_ROUTE,
  type PublicVmAnalyzeResponse,
  type PublicVmAnalyzeSuccess,
  type PublicVmStatusResponse,
} from './publicVmContract';
import {
  PUBLIC_VLM_CONTRACT_VERSION,
  PUBLIC_VLM_ROUTE,
  PUBLIC_VLM_STATUS_ROUTE,
  type PublicVlmAnalyzeResponse,
  type PublicVlmAnalyzeSuccess,
  type PublicVlmFieldResult,
  type PublicVlmStatusResponse,
} from './publicVlmContract';
import {
  PUBLIC_SIM_CONTRACT_VERSION,
  PUBLIC_SIM_ROUTE,
  type PublicSimAnalyzeResponse,
  type PublicSimAnalyzeSuccess,
} from './publicSimContract';

type PhotoRecord = {
  file: File;
  previewUrl: string;
  width: number | null;
  height: number | null;
};

type VmRunState =
  | { state: 'idle' }
  | { state: 'running'; requestId: string }
  | { state: 'complete'; data: PublicVmAnalyzeSuccess }
  | { state: 'error'; message: string; code?: string };

type VlmRunState =
  | { state: 'idle' }
  | { state: 'running'; requestId: string }
  | { state: 'complete'; data: PublicVlmAnalyzeSuccess }
  | { state: 'error'; message: string; code?: string };

type SimRunState =
  | { state: 'idle' }
  | { state: 'running'; requestId: string }
  | { state: 'complete'; data: PublicSimAnalyzeSuccess }
  | { state: 'error'; message: string; code?: string };

const MAX_PHOTO_BYTES = 15 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Public-display quantization only.
 *
 * IMPORTANT: the scientific/backend values remain continuous and are still
 * used unchanged by the frozen Nature 9.03 I/Y/D/M synthesis. This helper is
 * intentionally presentation-only for the citizen-facing 1–7 labels.
 */
function formatPublicOrdinal(value: number) {
  const rounded = Math.round(value);
  return String(Math.max(1, Math.min(7, rounded)));
}

function stageBadge(state: PublicPipelineStageState) {
  switch (state) {
    case 'complete':
      return { label: 'COMPLETE', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    case 'ready':
      return { label: 'READY', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    case 'running':
      return { label: 'RUNNING', className: 'bg-sky-100 text-sky-800 border-sky-200' };
    case 'next':
      return { label: 'NEXT', className: 'bg-sky-100 text-sky-800 border-sky-200' };
    case 'blocked':
      return { label: 'BLOCKED', className: 'bg-rose-100 text-rose-800 border-rose-200' };
    default:
      return { label: 'WAITING', className: 'bg-stone-100 text-stone-600 border-stone-200' };
  }
}

async function fileToBase64(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const comma = result.indexOf(',');
      if (comma < 0) reject(new Error('Could not encode the image.'));
      else resolve(result.slice(comma + 1));
    };
    reader.onerror = () => reject(reader.error || new Error('Could not read the image.'));
    reader.readAsDataURL(file);
  });
}

function requestId(prefix: 'vm' | 'vlm' | 'sim') {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `public_${prefix}_${crypto.randomUUID()}`;
  }
  return `public_${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function probabilityPeak(field: PublicVlmFieldResult) {
  let index = 0;
  for (let i = 1; i < field.probabilities.length; i += 1) {
    if (field.probabilities[i] > field.probabilities[index]) index = i;
  }
  return { rung: index + 1, probability: field.probabilities[index] };
}

function StreetScoreFace({ score }: { score: number }) {
  const t = Math.max(0, Math.min(1, (score - 1) / 6));
  const controlY = 36 + t * 24;
  return (
    <svg viewBox="0 0 80 80" role="img" aria-label={`Street Interface score ${formatPublicOrdinal(score)} out of 7`} className="w-20 h-20 shrink-0">
      <circle cx="40" cy="40" r="35" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-300" />
      <circle cx="28" cy="31" r="3" fill="currentColor" className="text-stone-100" />
      <circle cx="52" cy="31" r="3" fill="currentColor" className="text-stone-100" />
      <path d={`M 20 49 Q 40 ${controlY.toFixed(2)} 60 49`} fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" className="text-stone-100" />
    </svg>
  );
}

export default function PublicStreetscapeApp() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastVmRunKeyRef = useRef<string | null>(null);
  const lastVlmRunKeyRef = useRef<string | null>(null);
  const [photo, setPhoto] = useState<PhotoRecord | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [vmRun, setVmRun] = useState<VmRunState>({ state: 'idle' });
  const [vlmRun, setVlmRun] = useState<VlmRunState>({ state: 'idle' });
  const [simRun, setSimRun] = useState<SimRunState>({ state: 'idle' });
  const [vmGateway, setVmGateway] = useState<
    | { state: 'checking' }
    | { state: 'ready'; data: PublicVmStatusResponse }
    | { state: 'error'; message: string }
  >({ state: 'checking' });
  const [vlmGateway, setVlmGateway] = useState<
    | { state: 'checking' }
    | { state: 'ready'; data: PublicVlmStatusResponse }
    | { state: 'error'; message: string }
  >({ state: 'checking' });

  const refreshVmStatus = useCallback(() => {
    setVmGateway({ state: 'checking' });
    fetch(PUBLIC_VM_STATUS_ROUTE, { headers: { Accept: 'application/json' } })
      .then(async (response) => {
        if (!response.ok) throw new Error(`VM status HTTP ${response.status}`);
        return (await response.json()) as PublicVmStatusResponse;
      })
      .then((data) => setVmGateway({ state: 'ready', data }))
      .catch((error) => setVmGateway({ state: 'error', message: error instanceof Error ? error.message : 'VM gateway status unavailable' }));
  }, []);

  const refreshVlmStatus = useCallback(() => {
    setVlmGateway({ state: 'checking' });
    fetch(PUBLIC_VLM_STATUS_ROUTE, { headers: { Accept: 'application/json' } })
      .then(async (response) => {
        if (!response.ok) throw new Error(`VLM status HTTP ${response.status}`);
        return (await response.json()) as PublicVlmStatusResponse;
      })
      .then((data) => setVlmGateway({ state: 'ready', data }))
      .catch((error) => setVlmGateway({ state: 'error', message: error instanceof Error ? error.message : 'VLM gateway status unavailable' }));
  }, []);

  useEffect(() => {
    refreshVmStatus();
    refreshVlmStatus();
  }, [refreshVmStatus, refreshVlmStatus]);

  useEffect(() => {
    return () => {
      if (photo?.previewUrl) URL.revokeObjectURL(photo.previewUrl);
    };
  }, [photo?.previewUrl]);

  const orientationNote = useMemo(() => {
    if (!photo?.width || !photo.height) return null;
    if (photo.height > photo.width) {
      return 'Portrait photos are accepted for development testing, but a horizontal eye-level streetscape photo is preferred for protocol alignment.';
    }
    return null;
  }, [photo]);

  const acceptPhoto = (file: File) => {
    setPhotoError(null);
    setVmRun({ state: 'idle' });
    setVlmRun({ state: 'idle' });
    setSimRun({ state: 'idle' });
    lastVmRunKeyRef.current = null;
    lastVlmRunKeyRef.current = null;

    if (!ACCEPTED_MIME_TYPES.has(file.type)) {
      setPhotoError('Please upload a JPEG, PNG, or WebP photograph.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError('The photo is larger than 15 MB. Please use a smaller image.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setPhoto((current) => {
        if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
        return { file, previewUrl, width: img.naturalWidth, height: img.naturalHeight };
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      setPhotoError('The selected file could not be read as an image.');
    };
    img.src = previewUrl;
  };

  // P2B: automatic source-backed VM inference.
  useEffect(() => {
    if (!photo || vmGateway.state !== 'ready' || !vmGateway.data.inferenceConnected) return;
    const key = `${photo.file.name}:${photo.file.size}:${photo.file.lastModified}`;
    if (lastVmRunKeyRef.current === key) return;
    lastVmRunKeyRef.current = key;

    let cancelled = false;
    const id = requestId('vm');
    setVmRun({ state: 'running', requestId: id });
    setVlmRun({ state: 'idle' });
    setSimRun({ state: 'idle' });

    void (async () => {
      try {
        const imageBase64 = await fileToBase64(photo.file);
        const response = await fetch(PUBLIC_VM_ROUTE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ requestId: id, imageBase64, imageMimeType: photo.file.type, imageFilename: photo.file.name }),
        });
        const body = (await response.json()) as PublicVmAnalyzeResponse;
        if (cancelled) return;
        if (body.success) {
          if (response.ok) setVmRun({ state: 'complete', data: body });
          else setVmRun({ state: 'error', message: `Vision segmentation returned a success payload with HTTP ${response.status}.` });
        } else if ('code' in body) {
          // TypeScript does not reliably narrow the false side of a boolean
          // discriminant when strictNullChecks is disabled in this project.
          // The failure contract always owns `code` + `message`, so the `in`
          // guard is the stable discriminant for the error branch.
          setVmRun({ state: 'error', code: body.code, message: body.message || `Vision segmentation failed with HTTP ${response.status}.` });
        } else {
          setVmRun({ state: 'error', message: `Vision segmentation returned an invalid response contract (HTTP ${response.status}).` });
        }
      } catch (error) {
        if (!cancelled) setVmRun({ state: 'error', message: error instanceof Error ? error.message : 'Vision segmentation failed.' });
      }
    })();

    return () => { cancelled = true; };
  }, [photo, vmGateway]);

  // P3: after P2B completes, run the source-backed Qwen instrument on the
  // original photo. VM segmentation is not substituted for the Qwen image.
  useEffect(() => {
    if (!photo || vmRun.state !== 'complete' || vlmGateway.state !== 'ready' || !vlmGateway.data.inferenceConnected) return;
    const key = `${photo.file.name}:${photo.file.size}:${photo.file.lastModified}`;
    if (lastVlmRunKeyRef.current === key) return;
    lastVlmRunKeyRef.current = key;

    let cancelled = false;
    const id = requestId('vlm');
    setVlmRun({ state: 'running', requestId: id });

    void (async () => {
      try {
        const imageBase64 = await fileToBase64(photo.file);
        const response = await fetch(PUBLIC_VLM_ROUTE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ requestId: id, imageBase64, imageMimeType: photo.file.type, imageFilename: photo.file.name }),
        });
        const body = (await response.json()) as PublicVlmAnalyzeResponse;
        if (cancelled) return;
        if (body.success) {
          if (response.ok) setVlmRun({ state: 'complete', data: body });
          else setVlmRun({ state: 'error', message: `Qwen VLM returned a success payload with HTTP ${response.status}.` });
        } else if ('code' in body) {
          setVlmRun({ state: 'error', code: body.code, message: body.message || `Qwen VLM inference failed with HTTP ${response.status}.` });
        } else {
          setVlmRun({ state: 'error', message: `Qwen VLM returned an invalid response contract (HTTP ${response.status}).` });
        }
      } catch (error) {
        if (!cancelled) setVlmRun({ state: 'error', message: error instanceof Error ? error.message : 'Qwen VLM inference failed.' });
      }
    })();

    return () => { cancelled = true; };
  }, [photo, vmRun, vlmGateway]);

  // P4: deterministic server-side Nature 9.03 Final · No-Omega synthesis.
  // The active scientific engine remains byte-identical to v0.6.3 GOLDEN FREEZE.
  useEffect(() => {
    if (vmRun.state !== 'complete' || vlmRun.state !== 'complete') return;

    let cancelled = false;
    const id = requestId('sim');
    setSimRun({ state: 'running', requestId: id });

    void (async () => {
      try {
        const response = await fetch(PUBLIC_SIM_ROUTE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            requestId: id,
            vmReceipt: {
              requestId: vmRun.data.requestId,
              stage: vmRun.data.stage,
              contractVersion: vmRun.data.provenance.contractVersion,
              taxonomyVersion: vmRun.data.segmentation.taxonomyVersion,
              repository: vmRun.data.provenance.repository,
              commit: vmRun.data.provenance.commit,
            },
            vlmResult: vlmRun.data,
          }),
        });
        const body = (await response.json()) as PublicSimAnalyzeResponse;
        if (cancelled) return;
        if (body.success) {
          if (response.ok) setSimRun({ state: 'complete', data: body });
          else setSimRun({ state: 'error', message: `P4.1 synthesis returned a success payload with HTTP ${response.status}.` });
        } else if ('code' in body) {
          setSimRun({ state: 'error', code: body.code, message: body.message || `P4.1 synthesis failed with HTTP ${response.status}.` });
        } else {
          setSimRun({ state: 'error', message: `P4.1 synthesis returned an invalid response contract (HTTP ${response.status}).` });
        }
      } catch (error) {
        if (!cancelled) setSimRun({ state: 'error', message: error instanceof Error ? error.message : 'P4.1 synthesis failed.' });
      }
    })();

    return () => { cancelled = true; };
  }, [vmRun, vlmRun]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) acceptPhoto(file);
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) acceptPhoto(file);
  };

  const vmRuntimeReady = vmGateway.state === 'ready' && vmGateway.data.inferenceConnected;
  const vlmRuntimeReady = vlmGateway.state === 'ready' && vlmGateway.data.inferenceConnected;
  const vmTopClasses = useMemo(() => {
    if (vmRun.state !== 'complete') return [];
    return vmRun.data.segmentation.classShares
      .filter((row) => row.classId !== 3 && row.pixels > 0)
      .sort((a, b) => b.shareOfValidPixels - a.shareOfValidPixels)
      .slice(0, 6);
  }, [vmRun]);

  const stageState = (id: 'photo' | 'vm' | 'vlm' | 'sim'): PublicPipelineStageState => {
    if (id === 'photo') return photo ? 'complete' : 'ready';
    if (id === 'vm') {
      if (vmRun.state === 'complete') return 'complete';
      if (vmRun.state === 'running') return 'running';
      if (vmRun.state === 'error' || vmGateway.state === 'error') return 'blocked';
      if (vmGateway.state === 'ready' && !vmGateway.data.inferenceConnected) return 'blocked';
      return photo ? 'next' : 'waiting';
    }
    if (id === 'vlm') {
      if (vlmRun.state === 'complete') return 'complete';
      if (vlmRun.state === 'running') return 'running';
      if (vlmRun.state === 'error' || vlmGateway.state === 'error') return vmRun.state === 'complete' ? 'blocked' : 'waiting';
      if (vmRun.state !== 'complete') return 'waiting';
      if (vlmGateway.state === 'ready' && !vlmGateway.data.inferenceConnected) return 'blocked';
      return 'next';
    }
    if (simRun.state === 'complete') return 'complete';
    if (simRun.state === 'running') return 'running';
    if (simRun.state === 'error') return 'blocked';
    if (vlmRun.state === 'complete') return 'next';
    return 'waiting';
  };

  return (
    <div className="min-h-screen bg-[#f6f7f5] text-stone-900 antialiased">
      <header className="border-b border-stone-200 bg-white/95 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center shrink-0"><Layers3 className="w-5 h-5" /></div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-semibold tracking-tight text-lg sm:text-xl">Street Interface</h1>
                <span className="px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold">{PUBLIC_APP_VERSION}</span>
              </div>
              <p className="text-xs sm:text-sm text-stone-500 truncate">{PUBLIC_APP_LABEL}</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-stone-500"><ShieldCheck className="w-4 h-4 text-emerald-700" /><span>Nature 9.03 scientific core preserved</span></div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        <section className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 items-start">
          <div className="space-y-5 pt-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-600 shadow-sm"><Sparkles className="w-3.5 h-3.5 text-emerald-700" />One photo → VM + Qwen + Nature 9.03 score</div>
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.035em] leading-[1.04] text-stone-950">See how a street feels at human scale.</h2>
              <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-2xl">
                P4.1 runs source-backed vision segmentation, the reproducibility-locked Qwen2-VL 10-field instrument, and the frozen Nature 9.03 Final · No-Omega synthesis automatically from one street photo, with protocol-aware validation labels.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {[
                ['1', 'Upload', 'One streetscape photo'],
                ['2', 'Segment', '30-class source-backed VM'],
                ['3', 'Perceive', 'Qwen 10 fields + p1–p7'],
              ].map(([n, title, detail]) => (
                <div key={n} className="rounded-xl border border-stone-200 bg-white p-3.5 shadow-sm">
                  <div className="text-[10px] font-mono font-bold text-emerald-700">STEP {n}</div>
                  <div className="mt-1 font-semibold text-sm">{title}</div>
                  <div className="mt-0.5 text-xs text-stone-500 leading-relaxed">{detail}</div>
                </div>
              ))}
            </div>
          </div>

          <section className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-stone-200">
              <div className="flex items-start justify-between gap-3">
                <div><div className="text-[10px] font-mono font-bold tracking-wide text-emerald-700 uppercase">Your street photo</div><h3 className="mt-1 text-xl font-semibold tracking-tight">Upload one image</h3><p className="text-sm text-stone-500 mt-1">JPEG, PNG, or WebP · up to 15 MB</p></div>
                <Camera className="w-5 h-5 text-stone-400 shrink-0" />
              </div>
            </div>
            <div className="p-5 sm:p-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative rounded-xl border-2 border-dashed min-h-[300px] flex items-center justify-center cursor-pointer transition-colors overflow-hidden ${isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-stone-300 bg-stone-50 hover:border-stone-400'}`}
              >
                {photo ? (
                  <div className="absolute inset-0">
                    <img src={photo.previewUrl} alt="Uploaded streetscape" className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-4 pb-4 pt-16 text-white">
                      <div className="text-sm font-medium truncate">{photo.file.name}</div>
                      <div className="text-[11px] text-white/75 mt-0.5">{photo.width} × {photo.height} · {formatFileSize(photo.file.size)} · click to replace</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center px-6 py-10"><div className="mx-auto w-12 h-12 rounded-full bg-white border border-stone-200 flex items-center justify-center shadow-sm"><Upload className="w-5 h-5 text-stone-600" /></div><div className="mt-4 font-semibold">Drop a street photo here</div><div className="text-sm text-stone-500 mt-1">or click to choose a file</div></div>
                )}
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleInputChange} />
              </div>

              {photoError && <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{photoError}</div>}
              {orientationNote && <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 flex items-start gap-2 text-xs text-amber-900 leading-relaxed"><Info className="w-4 h-4 mt-0.5 shrink-0" /><span>{orientationNote}</span></div>}

              {photo && (
                <div className="mt-4 space-y-2">
                  <div className={`rounded-xl border p-4 ${vmRun.state === 'error' ? 'border-rose-200 bg-rose-50' : vmRun.state === 'complete' ? 'border-emerald-200 bg-emerald-50' : 'border-sky-200 bg-sky-50'}`}>
                    <div className="flex items-start gap-3">
                      {vmRun.state === 'running' ? <LoaderCircle className="w-5 h-5 text-sky-700 animate-spin shrink-0 mt-0.5" /> : vmRun.state === 'complete' ? <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" /> : <Info className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />}
                      <div className="min-w-0">
                        <div className="font-semibold text-sm">{vmRun.state === 'running' ? 'Running source-backed vision segmentation…' : vmRun.state === 'complete' ? 'Vision segmentation complete' : vmRun.state === 'error' ? 'Vision segmentation could not run' : vmRuntimeReady ? 'Photo is queued for automatic VM inference' : 'Photo input is ready'}</div>
                        <p className="text-xs mt-1 leading-relaxed opacity-80">{vmRun.state === 'error' ? vmRun.message : vmRun.state === 'complete' ? 'The scientific LABEL_MAP_STABLE output passed the P2B taxonomy/source contract.' : vmGateway.state === 'checking' ? 'Checking the GPU worker…' : vmGateway.state === 'error' ? `Public VM gateway unavailable: ${vmGateway.message}` : vmGateway.data.inferenceConnected ? 'The real CUDA worker is connected. No demo segmentation is used.' : `GPU inference is not currently connected: ${vmGateway.data.runtime.detail}`}</p>
                      </div>
                    </div>
                  </div>

                  {vmRun.state === 'complete' && (
                    <div className={`rounded-xl border p-4 ${vlmRun.state === 'error' ? 'border-rose-200 bg-rose-50' : vlmRun.state === 'complete' ? 'border-emerald-200 bg-emerald-50' : 'border-violet-200 bg-violet-50'}`}>
                      <div className="flex items-start gap-3">
                        {vlmRun.state === 'running' ? <LoaderCircle className="w-5 h-5 text-violet-700 animate-spin shrink-0 mt-0.5" /> : vlmRun.state === 'complete' ? <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" /> : <Sparkles className="w-5 h-5 text-violet-700 shrink-0 mt-0.5" />}
                        <div className="min-w-0">
                          <div className="font-semibold text-sm">{vlmRun.state === 'running' ? 'Running Qwen 10-field perception…' : vlmRun.state === 'complete' ? 'Qwen VLM perception complete' : vlmRun.state === 'error' ? 'Qwen VLM perception could not run' : vlmRuntimeReady ? 'Qwen perception is next' : 'Qwen worker is not connected'}</div>
                          <p className="text-xs mt-1 leading-relaxed opacity-80">{vlmRun.state === 'error' ? vlmRun.message : vlmRun.state === 'complete' ? 'All ten fields returned p1–p7 distributions and the source-backed ordinal median readout.' : vlmGateway.state === 'checking' ? 'Checking the Qwen GPU worker…' : vlmGateway.state === 'error' ? `Public VLM gateway unavailable: ${vlmGateway.message}` : vlmGateway.data.inferenceConnected ? 'P3 uses the original RGB photo and the pinned Murray Hill Qwen instrument.' : vlmGateway.data.runtime.detail}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {vlmRun.state === 'complete' && (
                    <div className={`rounded-xl border p-4 ${simRun.state === 'error' ? 'border-rose-200 bg-rose-50' : simRun.state === 'complete' ? 'border-emerald-200 bg-emerald-50' : 'border-emerald-200 bg-emerald-50/60'}`}>
                      <div className="flex items-start gap-3">
                        {simRun.state === 'running' ? <LoaderCircle className="w-5 h-5 text-emerald-700 animate-spin shrink-0 mt-0.5" /> : simRun.state === 'complete' ? <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" /> : <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />}
                        <div className="min-w-0">
                          <div className="font-semibold text-sm">{simRun.state === 'running' ? 'Computing Nature 9.03 Street Interface score…' : simRun.state === 'complete' ? `Street Interface score complete · ${formatPublicOrdinal(simRun.data.result.score)} / 7` : simRun.state === 'error' ? 'Street Interface score could not be computed' : 'Frozen synthesis is next'}</div>
                          <p className="text-xs mt-1 leading-relaxed opacity-80">{simRun.state === 'error' ? simRun.message : simRun.state === 'complete' ? 'I / Y / D / M were computed by the frozen v0.6.3 No-Omega engine with paper global reference elasticities.' : 'P4.1 runs only after the source-backed VM and P3.1 Qwen contracts pass. Public-photo output is classified as live single-photo validation, not historical golden parity.'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-stone-200 flex items-center justify-between gap-4">
            <div><div className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wide">Automatic analysis pipeline</div><h3 className="font-semibold mt-0.5">Public workflow build status</h3></div>
            <span className="text-[10px] font-mono px-2 py-1 rounded border border-violet-200 bg-violet-50 text-violet-800">P4.1 · PROTOCOL-AWARE NATURE 9.03 SYNTHESIS</span>
          </div>
          <div className="grid md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-stone-200">
            {PUBLIC_PIPELINE_P4.map((stage, index) => {
              const current = stageState(stage.id);
              const badge = stageBadge(current);
              return (
                <div key={stage.id} className="p-5 sm:p-6 min-h-[155px]">
                  <div className="flex items-center justify-between gap-2"><div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-[11px] font-mono font-bold text-stone-600">{index + 1}</div><span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${badge.className}`}>{badge.label}</span></div>
                  <div className="mt-4 font-semibold text-sm">{stage.title}</div><div className="mt-1 text-xs text-stone-500 leading-relaxed">{stage.shortDescription}</div>
                </div>
              );
            })}
          </div>
        </section>

        {vmRun.state === 'complete' && (
          <section className="rounded-2xl border border-emerald-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-stone-200 flex items-center justify-between gap-3"><div><div className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-wide">P2B scientific VM output</div><h3 className="font-semibold mt-0.5">30-class segmentation evidence</h3></div><span className="text-[10px] font-mono text-stone-500">LABEL_MAP_STABLE</span></div>
            <div className="grid lg:grid-cols-2 gap-0">
              <div className="p-5 sm:p-6 border-b lg:border-b-0 lg:border-r border-stone-200"><div className="text-xs font-medium text-stone-500 mb-2">Scientific label map</div><div className="rounded-xl overflow-hidden border border-stone-200 bg-stone-100"><img src={`data:image/png;base64,${vmRun.data.segmentation.rgbCleanBase64 || vmRun.data.segmentation.labelMapStableBase64}`} alt="Vision segmentation" className="w-full h-auto block" /></div><p className="text-[11px] text-stone-500 mt-2 leading-relaxed">Display uses RGB_CLEAN when available. The scientific artifact retained by the API is the one-channel LABEL_MAP_STABLE with IGNORE=255.</p></div>
              <div className="p-5 sm:p-6"><div className="grid grid-cols-3 gap-2"><div className="rounded-lg bg-stone-50 border border-stone-200 p-3"><div className="text-[10px] text-stone-500 uppercase">Valid pixels</div><div className="font-semibold mt-1">{vmRun.data.segmentation.qa.validPixels.toLocaleString()}</div></div><div className="rounded-lg bg-stone-50 border border-stone-200 p-3"><div className="text-[10px] text-stone-500 uppercase">Ignored</div><div className="font-semibold mt-1">{(vmRun.data.segmentation.qa.ignoreShare * 100).toFixed(2)}%</div></div><div className="rounded-lg bg-stone-50 border border-stone-200 p-3"><div className="text-[10px] text-stone-500 uppercase">Unknown</div><div className="font-semibold mt-1">{(vmRun.data.segmentation.qa.otherUnknownShareOfValidPixels * 100).toFixed(2)}%</div></div></div><div className="mt-5 text-xs font-medium text-stone-500">Largest visible classes</div><div className="mt-2 space-y-2">{vmTopClasses.map((row) => <div key={row.classId} className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 px-3 py-2"><span className="text-sm truncate">{row.className.replaceAll('_', ' ')}</span><span className="text-xs font-mono text-stone-600">{(row.shareOfValidPixels * 100).toFixed(2)}%</span></div>)}</div><div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-900 leading-relaxed">Source: {vmRun.data.provenance.repository} @ {vmRun.data.provenance.commit.slice(0, 12)} · taxonomy {vmRun.data.segmentation.taxonomyVersion}</div></div>
            </div>
          </section>
        )}

        {vlmRun.state === 'complete' && (
          <section className="rounded-2xl border border-violet-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-stone-200 flex items-center justify-between gap-3">
              <div><div className="text-[10px] font-mono font-bold text-violet-700 uppercase tracking-wide">P3.1 source-backed VLM output</div><h3 className="font-semibold mt-0.5">Qwen 10-field perceptual evidence</h3></div>
              <span className="text-[10px] font-mono text-stone-500">p1–p7 → ordinal median</span>
            </div>
            <div className="p-5 sm:p-6">
              <div className="grid sm:grid-cols-2 gap-3">
                {vlmRun.data.fields.map((field) => {
                  const peak = probabilityPeak(field);
                  return (
                    <div key={field.fieldId} className="rounded-xl border border-stone-200 p-4 bg-stone-50/60">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0"><div className="font-medium text-sm truncate">{field.fieldId.replaceAll('_', ' ')}</div><div className="text-[10px] font-mono text-stone-500 mt-0.5">{field.manuscriptTerm}</div></div>
                        <div className="text-right"><div className="text-xl font-semibold">{formatPublicOrdinal(field.readoutMedian)}</div><div className="text-[10px] text-stone-500">/ 7 readout</div></div>
                      </div>
                      <div className="mt-3 grid grid-cols-7 gap-1 h-10 items-end">
                        {field.probabilities.map((p, index) => <div key={index} className="flex flex-col justify-end h-full"><div className="w-full bg-violet-300 rounded-sm" style={{ height: `${Math.max(2, p * 100)}%` }} /><div className="text-[8px] text-center text-stone-400 mt-1">{index + 1}</div></div>)}
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[10px] text-stone-500"><span>norm {(field.normalized01).toFixed(3)}</span><span>peak {peak.rung} · {(peak.probability * 100).toFixed(1)}%</span><span>EV {field.expectedValue.toFixed(2)}</span></div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 grid lg:grid-cols-2 gap-3">
                <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-[11px] text-violet-900 leading-relaxed">Source: {vlmRun.data.provenance.repository} @ {vlmRun.data.provenance.commit.slice(0, 12)} · model {vlmRun.data.instrument.modelId} · {vlmRun.data.instrument.fieldCount} fields × {vlmRun.data.instrument.anchorsPerField} rungs.</div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900 leading-relaxed">Public-photo protocol: mast erasure is disabled and this single uploaded photo is not claimed to reproduce the paper's directional Street View sampling geometry.</div>
              </div>
            </div>
          </section>
        )}

        <section className="grid lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-sm"><div className="flex items-center gap-2"><ImageIcon className="w-4 h-4 text-emerald-700" /><h3 className="font-semibold">For a better street photo</h3></div><div className="grid sm:grid-cols-2 gap-3 mt-4">{[['Horizontal', 'Use a landscape photo when possible.'], ['Eye level', 'Hold the camera near normal standing eye height.'], ['Along the street', 'Face generally along the street rather than directly at one object.'], ['Include context', 'Keep visible ground, frontage, greenery, and sky in the frame.']].map(([title, text]) => <div key={title} className="rounded-xl bg-stone-50 border border-stone-200 p-3.5"><div className="text-sm font-medium">{title}</div><div className="text-xs text-stone-500 mt-1 leading-relaxed">{text}</div></div>)}</div></div>

          <div className="rounded-2xl border border-stone-200 bg-stone-900 text-stone-100 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2"><MapPinned className="w-4 h-4 text-emerald-300" /><h3 className="font-semibold">Street Interface score</h3></div>
            {simRun.state === 'complete' ? (
              <>
                <div className="mt-5 flex items-center justify-between gap-4">
                  <div className="flex items-end gap-3"><div className="text-5xl font-semibold tracking-tight text-white">{formatPublicOrdinal(simRun.data.result.score)}</div><div className="pb-1 text-sm text-stone-400">/ 7</div></div>
                  <StreetScoreFace score={simRun.data.result.score} />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-5">
                  {[
                    ['Imageability', simRun.data.result.imageability],
                    ['Identity', simRun.data.result.identity],
                    ['Dependence', simRun.data.result.dependence],
                  ].map(([label, value]) => <div key={String(label)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-3"><div className="text-[10px] uppercase tracking-wide text-stone-400">{label}</div><div className="text-lg font-semibold mt-1">{Number(value).toFixed(2)}</div></div>)}
                </div>
                <p className="text-xs text-stone-400 leading-relaxed mt-4">Frozen Nature 9.03 Final · No-Omega synthesis. M = I<sup>0.40</sup> × Y<sup>0.20</sup> × D<sup>0.40</sup>. The face is only a visual restatement of the same M score.</p>
                <div className="mt-3 text-[10px] font-mono text-stone-500">PAPER_GLOBAL_REFERENCE · REFERENCE_NOT_LOCAL_GWR</div>

                <div className="mt-4 rounded-lg border border-violet-300/20 bg-violet-300/10 px-3.5 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-violet-200" />
                      <div className="text-[10px] font-mono uppercase tracking-wide text-violet-200">VLM visual commentary</div>
                    </div>
                    <div className="text-[9px] font-mono text-stone-500">NOT SCORE VALIDATION</div>
                  </div>
                  <div className="mt-2.5 text-sm leading-relaxed text-stone-100">
                    {vlmRun.state === 'complete' && vlmRun.data.commentary?.status === 'ready' && vlmRun.data.commentary.scene ? (
                      <p>{vlmRun.data.commentary.scene}</p>
                    ) : vlmRun.state === 'complete' && vlmRun.data.commentary?.status === 'unavailable' ? (
                      <p className="text-stone-300">Open-text commentary was unavailable for this run. The quantitative Qwen fields and Street Interface score above are unaffected.</p>
                    ) : vlmRun.state === 'complete' ? (
                      <p className="text-stone-300">The deployed Qwen worker did not return the new commentary field. Rebuild and redeploy <span className="font-mono">vlm_service</span> to enable it.</p>
                    ) : (
                      <p className="text-stone-400">Waiting for Qwen image description…</p>
                    )}
                  </div>
                  <div className="mt-2.5 text-[10px] leading-relaxed text-stone-400">Independent open-text reading of the uploaded RGB image. It is generated without the SIM score, I/Y/D values, smiley, or a feature menu, and it does not feed back into the quantitative result.</div>
                </div>

                <div className="mt-4 rounded-lg border border-sky-300/20 bg-sky-300/10 px-3 py-3">
                  <div className="text-[10px] font-mono uppercase tracking-wide text-sky-200">{simRun.data.validation.validationClass}</div>
                  <div className="text-xs text-stone-300 mt-1 leading-relaxed">
                    Repeat-run stability is the correct parity test for this user-supplied single photo. Historical n00045 exact parity applies only to the canonical research 90° half-view golden fixture.
                  </div>
                  <div className="mt-2 text-[10px] font-mono text-stone-500">{simRun.data.validation.comparisonMode} · HISTORICAL_GOLDEN_COMPARABLE={String(simRun.data.validation.historicalGoldenComparable).toUpperCase()}</div>
                </div>
                <details className="mt-4 border-t border-white/10 pt-3">
                  <summary className="cursor-pointer text-xs text-stone-300">How this score was calculated</summary>
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] font-mono text-stone-400">
                    <span>I_raw</span><span className="text-right">{simRun.data.result.imageabilityRaw.toFixed(4)}</span>
                    <span>D_raw</span><span className="text-right">{simRun.data.result.dependenceRaw.toFixed(4)}</span>
                    <span>V_nat / V_built</span><span className="text-right">{simRun.data.normalizedInputs.naturalBuiltRatio.toFixed(4)}</span>
                    <span>Elasticities</span><span className="text-right">0.40 / 0.20 / 0.40</span>
                    <span>Omega</span><span className="text-right">NOT ACTIVE</span>
                    <span>External A_i</span><span className="text-right">NOT ACTIVE</span>
                  </div>
                </details>
              </>
            ) : simRun.state === 'running' ? (
              <div className="mt-5 flex items-center gap-3 text-sm text-stone-300"><LoaderCircle className="w-5 h-5 animate-spin text-emerald-300" /><span>Computing frozen Nature 9.03 I / Y / D / M…</span></div>
            ) : simRun.state === 'error' ? (
              <div className="mt-5 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-3 text-sm text-rose-100"><div className="font-medium">Score could not be computed</div><div className="text-xs mt-1 text-rose-100/75">{simRun.message}</div></div>
            ) : (
              <><div className="mt-5 flex items-end gap-3"><div className="text-5xl font-semibold tracking-tight text-white">—</div><div className="pb-1 text-sm text-stone-400">/ 7</div></div><div className="grid grid-cols-3 gap-2 mt-5">{['Imageability', 'Identity', 'Dependence'].map((label) => <div key={label} className="rounded-lg border border-white/10 bg-white/5 px-3 py-3"><div className="text-[10px] uppercase tracking-wide text-stone-400">{label}</div><div className="text-lg font-semibold mt-1">—</div></div>)}</div><p className="text-xs text-stone-400 leading-relaxed mt-4">The score appears only after both source-backed VM and P3.1 Qwen evidence pass their contracts.</p></>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-xs text-stone-500 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2"><LoaderCircle className={`w-4 h-4 shrink-0 ${vmGateway.state === 'checking' ? 'animate-spin text-sky-600' : vmRuntimeReady ? 'text-emerald-700' : 'text-amber-700'}`} /><span>VM contract: <span className="font-mono text-stone-700">{PUBLIC_VM_CONTRACT_VERSION}</span></span></div>
            <div className="flex items-center gap-2"><span className="font-mono text-[10px]">{vmGateway.state === 'checking' ? 'CHECKING GPU WORKER' : vmGateway.state === 'error' ? 'GATEWAY UNREACHABLE' : vmGateway.data.inferenceConnected ? 'GPU WORKER READY' : 'GPU WORKER NOT CONNECTED'}</span><button type="button" onClick={refreshVmStatus} className="inline-flex items-center gap-1 rounded border border-stone-200 px-2 py-1 hover:bg-stone-50"><RefreshCw className="w-3 h-3" /> Retry</button></div>
          </div>
          <div className="border-t border-stone-100 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2"><LoaderCircle className={`w-4 h-4 shrink-0 ${vlmGateway.state === 'checking' ? 'animate-spin text-violet-600' : vlmRuntimeReady ? 'text-emerald-700' : 'text-amber-700'}`} /><span>VLM contract: <span className="font-mono text-stone-700">{PUBLIC_VLM_CONTRACT_VERSION}</span></span></div>
            <div className="flex items-center gap-2"><span className="font-mono text-[10px]">{vlmGateway.state === 'checking' ? 'CHECKING QWEN WORKER' : vlmGateway.state === 'error' ? 'GATEWAY UNREACHABLE' : vlmGateway.data.inferenceConnected ? 'QWEN WORKER READY' : 'QWEN WORKER NOT CONNECTED'}</span><button type="button" onClick={refreshVlmStatus} className="inline-flex items-center gap-1 rounded border border-stone-200 px-2 py-1 hover:bg-stone-50"><RefreshCw className="w-3 h-3" /> Retry</button></div>
          </div>
          <div className="border-t border-stone-100 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" /><span>SIM contract: <span className="font-mono text-stone-700">{PUBLIC_SIM_CONTRACT_VERSION}</span></span></div>
            <span className="font-mono text-[10px]">FROZEN CORE READY</span>
          </div>
        </section>

        <section className="rounded-xl border border-stone-200 bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-500"><div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" /><span>Scientific core: <span className="font-mono text-stone-700">{PUBLIC_SCIENTIFIC_INVARIANTS.scientificCore}</span> · No Omega · No external Aᵢ</span></div><div className="flex items-center gap-2 font-mono text-[10px] text-stone-400"><CircleDot className="w-3.5 h-3.5" /><span>P4.1 PUBLIC LIVE · SOURCE-BACKED VM + VLM + FROZEN SIM</span></div></section>
      </main>

      <footer className="border-t border-stone-200 bg-white mt-10"><div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row gap-2 sm:items-center justify-between text-xs text-stone-400"><span>Street Interface · Public Streetscape Analysis</span><span className="font-mono">{PUBLIC_APP_VERSION} · P4.1</span></div></footer>
    </div>
  );
}
