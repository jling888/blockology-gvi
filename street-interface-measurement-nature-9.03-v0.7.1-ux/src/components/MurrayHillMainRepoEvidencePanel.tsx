import React from 'react';

import {
  Database,
  CheckCircle2,
  Ruler,
  Trees,
  Building2,
  CircleGauge,
} from 'lucide-react';

import type {
  MurrayHillIntegratedMatch,
} from '../research/murrayHillIntegratedDataset';

import type {
  MurrayHillMainRepoAudit,
} from '../research/murrayHillMainRepoAudit';

interface Props {
  match:
    MurrayHillIntegratedMatch | null;

  audit:
    MurrayHillMainRepoAudit | null;
}

function n(
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

export const MurrayHillMainRepoEvidencePanel:
  React.FC<Props> = ({
    match,
    audit,
  }) => {
    if (!match) {
      return (
        <section className="rounded-lg border border-indigo-200 bg-white p-3">
          <div className="text-[9px] font-mono font-bold uppercase tracking-wide text-indigo-900">
            Murray Hill Main-Repo Evidence
          </div>

          <div className="text-[9px] text-stone-600 mt-1">
            Load the Murray Hill integrated observations table to resolve an exact n##### research node.
          </div>
        </section>
      );
    }

    const d =
      match.diagnostic;

    const exactNode =
      /^n\d{5}$/i.test(
        match.identity.nodeId
      );

    return (
      <section className="rounded-lg border border-indigo-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-indigo-100 bg-indigo-50/60 flex items-start gap-2.5">
          <Database className="w-4 h-4 text-indigo-700 mt-0.5" />

          <div>
            <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-900">
              Murray Hill Main-Repo Evidence
            </div>

            <div className="text-[10px] text-stone-600 mt-0.5">
              Exact n##### research identity plus geometry and node-level validation evidence from the main-repo observation schema.
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="rounded border border-emerald-200 bg-emerald-50 p-2.5 flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />

            <div>
              <div className="text-[9px] font-mono font-bold text-emerald-900">
                {exactNode
                  ? 'EXACT MAIN-REPO n##### NODE ID'
                  : 'MAIN-REPO RESEARCH ID'}
              </div>

              <div className="text-[8px] text-emerald-800 mt-1">
                {match.identity.nodeId} · {match.identity.street} · {match.identity.cardinal}_{match.identity.side}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Metric
              icon={<Ruler className="w-3 h-3" />}
              label="H_m"
              value={n(d.hM)}
            />

            <Metric
              label="W_facade"
              value={n(d.wFacade)}
            />

            <Metric
              label="HW_effective"
              value={n(match.hwEffective)}
            />

            <Metric
              label="HW_source"
              value={
                d.hwSourceCategory ||
                '—'
              }
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Metric
              icon={<Trees className="w-3 h-3" />}
              label="Node GVI"
              value={n(d.nodeGvi)}
            />

            <Metric
              icon={<Building2 className="w-3 h-3" />}
              label="Node VEI"
              value={n(d.nodeVei)}
            />

            <Metric
              icon={<CircleGauge className="w-3 h-3" />}
              label="SVF_band"
              value={n(d.nodeSvfBand)}
            />

            <Metric
              label="Face ID"
              value={
                d.faceId ||
                '—'
              }
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Metric
              label="Arc Vegetation"
              value={n(d.arcVegetation)}
            />

            <Metric
              label="Arc Sky"
              value={n(d.arcSky)}
            />

            <Metric
              label="Arc Building"
              value={n(d.arcBuilding)}
            />
          </div>

          <div className="rounded border border-amber-200 bg-amber-50 p-2.5 text-[8px] text-amber-900 leading-relaxed">
            <strong>Validation ownership:</strong> Node GVI / VEI / SVF_band and same-view arc fractions are independent physical-validation evidence. Node GVI does not replace Qwen GVI_eye; SVF_band does not become true hemispherical SVF.
          </div>

          {audit && (
            <div className="rounded border border-stone-200 bg-stone-50 px-2.5 py-2 text-[8px] font-mono text-stone-600">
              Source pin: {audit.source_repository}@{audit.source_commit.slice(0, 10)} · {audit.dataset.physical_nodes} nodes / {audit.dataset.vlm_views} VLM views
            </div>
          )}
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

      <div className="text-[10px] font-mono font-bold text-stone-900 mt-0.5 break-all">
        {value}
      </div>
    </div>
  );
