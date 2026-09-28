import React from 'react';

import {
  Compass,
  Eye,
  Grid3X3,
  AlertTriangle,
  CheckCircle2,
  Route,
} from 'lucide-react';

import type {
  MurrayHillIntegratedMatch,
} from '../research/murrayHillIntegratedDataset';

import {
  NATURE_902_CANONICAL_SAMPLING,
  NATURE_902_DATASET,
} from '../research/nature902Protocol';

interface Props {
  match:
    MurrayHillIntegratedMatch | null;
}

export const Nature902ProtocolAlignmentPanel:
  React.FC<Props> = ({
    match,
  }) => {
    const bundleCount =
      match?.nodeBundle
        .viewCount ??
      0;

    return (
      <section className="rounded-lg border border-emerald-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-emerald-100 bg-emerald-50/60">
          <div className="flex items-start gap-2.5">
            <Compass className="w-4 h-4 text-emerald-700 mt-0.5" />

            <div>
              <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-900">
                Nature 9.02 Canonical Sampling Protocol
              </div>

              <div className="text-[10px] text-stone-600 mt-0.5 leading-relaxed">
                Paper target: dual sidewalk-centerline nodes at 20 m spacing, 360° cylindrical source geometry, and four street-relative orthogonal 90° observation quadrants.
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Metric
              label="Raw Dataset"
              value={`${NATURE_902_DATASET.rawPhysicalNodes} nodes · ${NATURE_902_DATASET.rawObservations} obs.`}
            />

            <Metric
              label="Active Paper Dataset"
              value={`${NATURE_902_DATASET.activePhysicalNodes} nodes · ${NATURE_902_DATASET.activeObservations} obs.`}
            />

            <Metric
              label="Excluded"
              value={`${NATURE_902_DATASET.excludedTunnelNodes} tunnel nodes · ${NATURE_902_DATASET.excludedTunnelObservations} obs.`}
            />

            <Metric
              label="Spatial Interval"
              value={`${NATURE_902_DATASET.spacingMeters} m`}
            />
          </div>

          <div className="rounded border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-emerald-900">
              <Eye className="w-3.5 h-3.5" />
              CANONICAL 4 × 90° NODE BUNDLE
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
              {NATURE_902_CANONICAL_SAMPLING.relativeYawDegrees.map(
                (yaw) => (
                  <div
                    key={yaw}
                    className="rounded border border-emerald-100 bg-white px-2.5 py-2"
                  >
                    <div className="text-[8px] font-mono uppercase text-stone-500">
                      Relative yaw
                    </div>

                    <div className="text-[12px] font-mono font-bold text-stone-900 mt-0.5">
                      {yaw}°
                    </div>

                    <div className="text-[8px] text-stone-500 mt-0.5">
                      90° FOV · pitch 0°
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              <Metric
                label="Eye Height"
                value={`${NATURE_902_CANONICAL_SAMPLING.eyeHeightMeters} m`}
              />

              <Metric
                label="Source Panorama"
                value={`${NATURE_902_CANONICAL_SAMPLING.sourcePanoramaDegrees}° cylindrical`}
              />

              <Metric
                label="Azimuth Columns"
                value={`${NATURE_902_CANONICAL_SAMPLING.azimuthColumnsPerPanorama} × ${NATURE_902_CANONICAL_SAMPLING.azimuthColumnDegrees}°`}
              />

              <Metric
                label="Quadrant Aggregate"
                value={`${NATURE_902_CANONICAL_SAMPLING.columnsPerQuadrant} columns`}
              />
            </div>
          </div>

          <div className="rounded border border-sky-200 bg-sky-50 p-3">
            <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-sky-900">
              <Grid3X3 className="w-3.5 h-3.5" />
              CURRENT MURRAY HILL WORKING BUNDLE
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="px-2 py-1 rounded border border-sky-200 bg-white text-[9px] font-mono font-bold text-sky-900">
                {match
                  ? `${match.identity.nodeId} · ${bundleCount}/4 source rows`
                  : 'NO NODE MATCH LOADED'}
              </span>

              {match &&
                bundleCount ===
                  4 && (
                  <span className="inline-flex items-center gap-1 text-[8px] font-mono font-bold text-emerald-700">
                    <CheckCircle2 className="w-3 h-3" />
                    FOUR-VIEW SOURCE BUNDLE PRESENT
                  </span>
                )}
            </div>

            {match && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {match.nodeBundle.views.map(
                  (view) => (
                    <div
                      key={`${view.rowIndex}-${view.file}`}
                      className="rounded border border-sky-100 bg-white px-2.5 py-2"
                    >
                      <div className="text-[8px] font-mono font-bold text-stone-800">
                        {view.cardinal}_{view.side}
                      </div>

                      <div className="text-[8px] text-stone-500 mt-0.5 break-all">
                        {view.file}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            <div className="mt-2 text-[8px] text-sky-900 leading-relaxed">
              Four working source rows do not by themselves prove teacher-orthogonal 0°/90°/180°/270° alignment. Current team walk-relative L/R evidence remains computationally usable but non-canonical until the orientation protocol is resolved.
            </div>
          </div>

          <div className="rounded border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
            <Route className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />

            <div>
              <div className="text-[9px] font-mono font-bold text-amber-900">
                SIDEWALK-CENTERLINE READINESS GATE
              </div>

              <p className="text-[8px] text-amber-800 mt-1 leading-relaxed">
                The 9/02 manuscript defines the final sampling domain along dual sidewalk centerlines. The current street-view-nodes OSM corridor importer is therefore an upstream sampling-geometry candidate, not automatic proof of final paper sidewalk-centerline compliance.
              </p>
            </div>
          </div>

          <div className="rounded border border-rose-200 bg-rose-50 p-2.5 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-700 shrink-0 mt-0.5" />

            <p className="text-[8px] text-rose-900 leading-relaxed">
              <strong>Canonical target changed:</strong> final paper approval now targets the Nature 9.02 orthogonal 4×90° protocol. Existing team L/R Qwen results remain a working legacy-orientation dataset until a verified orthogonal run or paired reconciliation is available.
            </p>
          </div>
        </div>
      </section>
    );
  };

const Metric:
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

      <div className="text-[9px] font-mono font-bold text-stone-900 mt-0.5">
        {value}
      </div>
    </div>
  );
