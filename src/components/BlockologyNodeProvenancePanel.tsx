import React from 'react';

import {
  Database,
  MapPin,
  Camera,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  Link2,
} from 'lucide-react';

import type {
  BlockologyDatasetManifest,
  BlockologyNodeMatch,
} from '../research/blockologyGviRegistry';

interface Props {
  match: BlockologyNodeMatch | null;
  manifest: BlockologyDatasetManifest | null;
  loading: boolean;
  error: string | null;
}

function n(
  value: number | null,
  digits = 3
): string {
  return value === null
    ? '—'
    : value.toFixed(digits);
}

export const BlockologyNodeProvenancePanel:
  React.FC<Props> = ({
    match,
    manifest,
    loading,
    error,
  }) => {
    const context =
      match?.context ||
      null;

    const exact =
      match?.verifiedPhysicalCrosswalk ===
      true;

    return (
      <section className="rounded-lg border border-cyan-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-cyan-100 bg-cyan-50/60 flex items-start gap-2.5">
          <Database className="w-4 h-4 text-cyan-700 mt-0.5" />

          <div>
            <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-cyan-900">
              External Node & Street View Provenance
            </div>

            <div className="text-[10px] text-stone-600 mt-0.5">
              blockology-gvi node registry + panorama metadata. Context only — no paper formula is overwritten.
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {loading && (
            <div className="text-[9px] font-mono text-stone-500">
              Loading Blockology registry…
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded border border-rose-200 bg-rose-50 p-2.5 text-[9px] text-rose-800">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            match &&
            match.kind ===
              'none' && (
              <div className="rounded border border-stone-200 bg-stone-50 p-2.5 text-[9px] text-stone-700">
                No Blockology context matched this active source. The APP keeps the external registry separate rather than guessing a node identity.
              </div>
            )}

          {context && (
            <>
              <div
                className={`rounded border p-2.5 ${
                  exact
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-amber-200 bg-amber-50'
                }`}
              >
                <div className="flex items-start gap-2">
                  {exact
                    ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                    )
                    : (
                      <Link2 className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                    )}

                  <div>
                    <div className={`text-[9px] font-mono font-bold ${
                      exact
                        ? 'text-emerald-900'
                        : 'text-amber-900'
                    }`}>
                      {exact
                        ? 'EXACT BLOCKOLOGY SOURCE ID'
                        : 'CANDIDATE STREET + SEQUENCE CROSSWALK'}
                    </div>

                    <div className={`text-[8px] mt-1 leading-relaxed ${
                      exact
                        ? 'text-emerald-800'
                        : 'text-amber-800'
                    }`}>
                      {match.reason}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Metric
                  icon={<MapPin className="w-3 h-3" />}
                  label="Blockology Node"
                  value={context.blockologyNodeId}
                />

                <Metric
                  label="Street / Typology"
                  value={`${context.osmName} · ${context.typology}`}
                />

                <Metric
                  label="Node Coordinates"
                  value={`${context.nodeLat.toFixed(6)}, ${context.nodeLon.toFixed(6)}`}
                />

                <Metric
                  label="Grid Bearing"
                  value={
                    context.gridBearingDeg === null
                      ? '—'
                      : `${context.gridBearingDeg.toFixed(0)}°`
                  }
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Metric
                  icon={<Camera className="w-3 h-3" />}
                  label="Panorama ID"
                  value={context.panoId || '—'}
                />

                <Metric
                  icon={<CalendarDays className="w-3 h-3" />}
                  label="Capture Date"
                  value={context.panoDate || '—'}
                />

                <Metric
                  label="Pano Snap"
                  value={
                    context.panoSnapDistanceM === null
                      ? '—'
                      : `${n(context.panoSnapDistanceM, 2)} m`
                  }
                />

                <Metric
                  label="Temporal Cohort"
                  value={
                    context.usable
                      ? 'USABLE'
                      : 'OUTSIDE PRIMARY COHORT'
                  }
                />
              </div>
            </>
          )}

          {manifest && (
            <div className="rounded border border-stone-200 bg-stone-50 px-3 py-2 text-[8px] font-mono text-stone-600 leading-relaxed">
              Registry: {manifest.node_count} nodes · {manifest.usable_capture_count} usable in recommended capture cohort {manifest.recommended_capture_cohort || '—'} · source commit {manifest.source_commit.slice(0, 10)}
            </div>
          )}

          <div className="rounded border border-sky-200 bg-sky-50 p-2.5 text-[8px] text-sky-900 leading-relaxed">
            <strong>Ownership boundary:</strong> Blockology node/panorama metadata is provenance and validation context. It does not overwrite the APP's Qwen n##### node ID, H/W, GVI_eye, SVF, Space Syntax, GWR or behavioral inputs.
          </div>
        </div>
      </section>
    );
  };

const Metric:
  React.FC<{
    label: string;
    value: string;
    icon?: React.ReactNode;
  }> = ({
    label,
    value,
    icon,
  }) => (
    <div className="rounded border border-stone-200 bg-stone-50 px-2.5 py-2">
      <div className="flex items-center gap-1 text-[8px] font-mono uppercase text-stone-500">
        {icon}
        {label}
      </div>

      <div className="text-[9px] font-mono font-bold text-stone-900 mt-1 break-all">
        {value}
      </div>
    </div>
  );
