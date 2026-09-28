import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Database,
  Link2,
  AlertTriangle,
  CheckCircle2,
  Calculator,
  Upload,
} from 'lucide-react';

import {
  resolveMurrayHillIntegratedMatch,
  type MurrayHillIntegratedMatch,
} from '../research/murrayHillIntegratedDataset';

interface Props {
  activeImageId: string;
  originalFilename: string;

  onApply:
    (
      match:
        MurrayHillIntegratedMatch
    ) => void;
}

function metric(
  value:
    number | null | undefined,
  digits = 3
): string {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return '—';
  }

  return value.toFixed(
    digits
  );
}

async function readTextFile(
  file: File
): Promise<string> {
  return file.text();
}

function textFingerprint(text: string): string {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${text.length}-${(hash >>> 0).toString(16)}`;
}

export const MurrayHillIntegratedDatasetPanel:
  React.FC<Props> = ({
    activeImageId,
    originalFilename,
    onApply,
  }) => {
    const [
      observationsText,
      setObservationsText,
    ] =
      useState('');

    const [
      observationsFilename,
      setObservationsFilename,
    ] =
      useState('');

    const lastAutoAppliedKeyRef = useRef('');

    const [
      horizonVerified,
      setHorizonVerified,
    ] =
      useState(false);

    const [
      candidate,
      setCandidate,
    ] =
      useState<
        MurrayHillIntegratedMatch | null
      >(null);

    const [
      error,
      setError,
    ] =
      useState<
        string | null
      >(null);

    useEffect(
      () => {
        if (!observationsText) {
          setCandidate(null);
          setError(null);
          return;
        }

        try {
          const next = resolveMurrayHillIntegratedMatch(
            observationsText,
            null,
            originalFilename,
            activeImageId,
            horizonVerified
          );

          setCandidate(next);
          setError(null);

          const autoApplyKey = [
            observationsFilename,
            textFingerprint(observationsText),
            next.identity.file,
            activeImageId,
            originalFilename,
            horizonVerified ? 'horizon-verified' : 'horizon-unverified',
          ].join('|');

          if (lastAutoAppliedKeyRef.current !== autoApplyKey) {
            lastAutoAppliedKeyRef.current = autoApplyKey;
            onApply(next);
          }
        } catch (err: any) {
          setCandidate(null);
          setError(
            err?.message ||
              'Could not match the current source image to the Murray Hill dataset.'
          );
        }
      },
      [
        observationsText,
        observationsFilename,
        originalFilename,
        activeImageId,
        horizonVerified,
        onApply,
      ]
    );

    const loadFile = async (file: File | null) => {
      if (!file) {
        return;
      }

      try {
        const text = await readTextFile(file);
        setObservationsFilename(file.name);
        setObservationsText(text);
      } catch (err: any) {
        setError(err?.message || 'CSV read failed.');
      }
    };


    const preview =
      candidate
        ?.workingSynthesis;


    return (
      <section className="bg-white border border-sky-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-sky-100 bg-sky-50/60">
          <div className="flex items-start gap-2.5">
            <Database className="w-4 h-4 text-sky-700 mt-0.5" />

            <div>
              <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-sky-800">
                Murray Hill Integrated Dataset Bridge
              </div>

              <div className="text-[10px] text-stone-600 mt-0.5 leading-relaxed">
                Upload the single required vlm_observations_murrayhill.csv table. The app automatically matches the active source image, initializes the Team Repository bridge, loads matched working data, and authorizes the valid repository record for paper assembly. Legacy I/Y/D/Omega/a/b/c/M fields remain comparison-only.
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <label className="rounded border border-violet-200 bg-violet-50/40 p-3 cursor-pointer">
              <div className="flex items-center gap-2">
                <Upload className="w-3.5 h-3.5 text-violet-700" />

                <span className="text-[9px] font-mono font-bold text-violet-900">
                  VLM OBSERVATIONS · REQUIRED
                </span>
              </div>

              <div className="text-[9px] text-stone-600 mt-1.5 leading-relaxed">
                One import does the full bridge: Qwen median-led observations + H/W / node diagnostics → automatic source match → Team Repository bridge → matched working data → paper-assembly authorization.
              </div>

              <input
                type="file"
                accept=".csv,text/csv"
                className="mt-2 block w-full text-[9px]"
                onChange={(event) =>
                  loadFile(event.target.files?.[0] || null)
                }
              />

              {observationsFilename && (
                <div className="mt-2 text-[8px] font-mono text-violet-800 break-all">
                  {observationsFilename}
                </div>
              )}
            </label>
          </div>

          <label className="flex items-start gap-2 rounded border border-stone-200 bg-stone-50 p-2.5">
            <input
              type="checkbox"
              checked={
                horizonVerified
              }
              onChange={(
                event
              ) =>
                setHorizonVerified(
                  event
                    .target
                    .checked
                )
              }
              className="mt-0.5"
            />

            <span className="text-[9px] text-stone-700 leading-relaxed">
              Horizon / standardized 90° source geometry has been independently verified. This records provenance only; it does not resolve the team walk-relative versus teacher-orthogonal orientation discrepancy.
            </span>
          </label>

          {error && (
            <div className="flex items-start gap-2 rounded border border-rose-200 bg-rose-50 p-2.5 text-[9px] text-rose-800">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {candidate && (
            <>
              <div className="rounded border border-emerald-200 bg-emerald-50 p-3">
                <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-emerald-900">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  MATCHED RESEARCH VIEW
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                  <SmallMetric
                    label="Node"
                    value={
                      candidate
                        .identity
                        .nodeId
                    }
                  />

                  <SmallMetric
                    label="View"
                    value={`${candidate.identity.cardinal}_${candidate.identity.side}`}
                  />

                  <SmallMetric
                    label="Match"
                    value={
                      candidate
                        .matchStrategy
                    }
                  />

                  <SmallMetric
                    label="H/W"
                    value={
                      metric(
                        candidate
                          .hwEffective
                      )
                    }
                  />
                </div>

                <div className="mt-2 text-[8px] font-mono text-emerald-800 break-all">
                  {candidate.identity.file}
                </div>
              </div>

              <div className="rounded border border-indigo-200 bg-indigo-50/40 p-3">
                <div className="text-[9px] font-mono font-bold text-indigo-900">
                  MAIN-REPO GEOMETRY / VALIDATION EVIDENCE
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                  <SmallMetric
                    label="H_m"
                    value={
                      metric(
                        candidate
                          .diagnostic
                          .hM
                      )
                    }
                  />

                  <SmallMetric
                    label="W_facade"
                    value={
                      metric(
                        candidate
                          .diagnostic
                          .wFacade
                      )
                    }
                  />

                  <SmallMetric
                    label="HW source"
                    value={
                      candidate
                        .diagnostic
                        .hwSourceCategory ||
                      '—'
                    }
                  />

                  <SmallMetric
                    label="Node GVI"
                    value={
                      metric(
                        candidate
                          .diagnostic
                          .nodeGvi
                      )
                    }
                  />

                  <SmallMetric
                    label="Node VEI"
                    value={
                      metric(
                        candidate
                          .diagnostic
                          .nodeVei
                      )
                    }
                  />

                  <SmallMetric
                    label="SVF_band"
                    value={
                      metric(
                        candidate
                          .diagnostic
                          .nodeSvfBand
                      )
                    }
                  />

                  <SmallMetric
                    label="Arc vegetation"
                    value={
                      metric(
                        candidate
                          .diagnostic
                          .arcVegetation
                      )
                    }
                  />

                  <SmallMetric
                    label="Arc building"
                    value={
                      metric(
                        candidate
                          .diagnostic
                          .arcBuilding
                      )
                    }
                  />
                </div>

                <div className="mt-2 text-[8px] text-indigo-800 leading-relaxed">
                  These are physical / geometry validation records from the Murray Hill main-repo observation schema. They do not replace Qwen paper variables; SVF_band is not true hemispherical SVF.
                </div>
              </div>

              <div className="rounded border border-emerald-200 bg-emerald-50/40 p-3">
                <div className="text-[9px] font-mono font-bold text-emerald-900">
                  PHYSICAL NODE BUNDLE
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="px-2 py-1 rounded border border-emerald-200 bg-white text-[9px] font-mono font-bold text-emerald-900">
                    {candidate.identity.nodeId}
                  </span>

                  <span className="px-2 py-1 rounded border border-emerald-200 bg-white text-[9px] font-mono font-bold text-emerald-900">
                    {candidate.nodeBundle.orientationStatus === 'source_verified_180_paper_alignment_unresolved'
                      ? `${candidate.nodeBundle.viewCount} × 180° DIRECTIONAL SOURCE VIEWS`
                      : `${candidate.nodeBundle.viewCount}/4 LEGACY SOURCE VIEWS`}
                  </span>

                  <span className="px-2 py-1 rounded border border-amber-200 bg-amber-50 text-[8px] font-mono font-bold text-amber-900">
                    {candidate.nodeBundle.orientationStatus === 'source_verified_180_paper_alignment_unresolved'
                      ? 'SOURCE 180° VERIFIED · PAPER ALIGNMENT UNRESOLVED'
                      : 'WORKING LEGACY ORIENTATION'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {candidate.nodeBundle.views.map(
                    (view) => (
                      <div
                        key={`${view.rowIndex}-${view.file}`}
                        className="rounded border border-emerald-100 bg-white px-2.5 py-2"
                      >
                        <div className="text-[8px] font-mono font-bold text-stone-800">
                          {view.cardinal}_{view.side} · {view.walk}
                        </div>

                        <div className="text-[8px] text-stone-500 mt-0.5 break-all">
                          {view.file}
                        </div>
                      </div>
                    )
                  )}
                </div>

                <div className="mt-2 text-[8px] text-amber-900 leading-relaxed">
                  Current pinned team imagery uses opposing along-street 180° directional renders. This verifies the source protocol only; it does not establish equivalence to the paper's orthogonal 90° analytical quadrants.
                </div>
              </div>

              <div className="rounded border border-stone-200 bg-stone-50 p-3">
                <div className="flex items-center gap-2">
                  <Calculator className="w-3.5 h-3.5 text-stone-700" />

                  <span className="text-[9px] font-mono font-bold text-stone-900">
                    CURRENT v0.4 / NATURE 9.02 PRE-GWR PREVIEW
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                  <SmallMetric
                    label="I_i"
                    value={
                      metric(
                        preview
                          ?.placeImageability
                          .value
                      )
                    }
                  />

                  <SmallMetric
                    label="Y_i"
                    value={
                      metric(
                        preview
                          ?.placeIdentity
                          .value
                      )
                    }
                  />

                  <SmallMetric
                    label="D_i"
                    value={
                      metric(
                        preview
                          ?.placeDependence
                          .value
                      )
                    }
                  />

                  <SmallMetric
                    label="A_i"
                    value={
                      metric(
                        preview
                          ?.environmentalTfp
                          .value
                      )
                    }
                  />
                </div>

                <div className="mt-3 rounded border border-amber-200 bg-amber-50 px-2.5 py-2 text-[8px] text-amber-900 leading-relaxed">
                  Recomputed from current v0.4 component formulas. The old CSV columns I, Y, D, Omega, a, b, c, M and M_local are NOT used here.
                </div>
              </div>

              <div className="rounded border border-emerald-200 bg-emerald-50 p-2.5 text-[9px] text-emerald-900 leading-relaxed flex items-start gap-2">
                <Link2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <div>
                  <strong>AUTO-LOADED WORKING DATA:</strong> the matched observation row is applied automatically after CSV import. If the source record is eligible, the Team Repository bridge is also automatically authorized for paper assembly. Protocol-alignment warnings remain unchanged.
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    );
  };

const SmallMetric:
  React.FC<{
    label: string;
    value: string;
  }> = ({
    label,
    value,
  }) => (
    <div className="rounded border border-stone-200 bg-white px-2.5 py-2">
      <div className="text-[8px] font-mono uppercase text-stone-500">
        {label}
      </div>

      <div className="text-[10px] font-mono font-bold text-stone-900 mt-0.5 break-all">
        {value}
      </div>
    </div>
  );
