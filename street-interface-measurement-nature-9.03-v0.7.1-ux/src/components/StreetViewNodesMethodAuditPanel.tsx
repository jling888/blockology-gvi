import React from 'react';

import {
  Network,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Compass,
} from 'lucide-react';

import type {
  StreetViewNodesAppStatus,
  StreetViewNodesRepoAudit,
} from '../research/streetViewNodesRegistry';

interface Props {
  audit: StreetViewNodesRepoAudit | null;
  error: string | null;
}

function badge(status: StreetViewNodesAppStatus): {label: string; cls: string} {
  switch (status) {
    case 'available':
      return { label: 'AVAILABLE', cls: 'border-emerald-200 bg-emerald-50 text-emerald-800' };
    case 'app_derived_only':
      return { label: 'APP-DERIVED', cls: 'border-cyan-200 bg-cyan-50 text-cyan-800' };
    case 'optional_upstream':
      return { label: 'OPTIONAL UPSTREAM', cls: 'border-sky-200 bg-sky-50 text-sky-800' };
    case 'not_resolved':
      return { label: 'NOT RESOLVED', cls: 'border-amber-200 bg-amber-50 text-amber-800' };
    case 'not_provided':
      return { label: 'NOT PROVIDED', cls: 'border-rose-200 bg-rose-50 text-rose-800' };
    default:
      return { label: 'NO OWNERSHIP', cls: 'border-stone-200 bg-stone-50 text-stone-700' };
  }
}

export const StreetViewNodesMethodAuditPanel: React.FC<Props> = ({ audit, error }) => {
  if (error) {
    return <div className="rounded border border-rose-200 bg-rose-50 p-3 text-[9px] text-rose-800">{error}</div>;
  }
  if (!audit) {
    return <div className="rounded border border-stone-200 bg-stone-50 p-3 text-[9px] text-stone-600">Loading street-view-nodes repository audit…</div>;
  }

  return (
    <section className="rounded-lg border border-cyan-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-cyan-100 bg-cyan-50/60 flex items-start gap-2.5">
        <Network className="w-4 h-4 text-cyan-700 mt-0.5" />
        <div>
          <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-cyan-900">
            Street-View Nodes Sampling / Acquisition Audit
          </div>
          <div className="text-[10px] text-stone-600 mt-0.5">
            Upstream OSM sampling geometry is separated from VLM, physical morphology, Space Syntax, GWR and behavior ownership.
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Metric label="Default spacing" value={`${audit.sampling_defaults.spacing_m} m`} />
          <Metric label="Min corridor" value={`${audit.sampling_defaults.min_corridor_m} m`} />
          <Metric label="Bearing smoothing" value={`${audit.sampling_defaults.bearing_smooth_window}`} />
          <Metric label="Node fields" value={`${audit.node_output_contract.length}`} />
        </div>

        <div className="rounded border border-cyan-200 bg-cyan-50/40 p-3">
          <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-cyan-900">
            <Compass className="w-3.5 h-3.5" />
            LOCAL STREET-AXIS SEMANTICS
          </div>
          <div className="text-[8px] text-cyan-900 mt-2 leading-relaxed">
            Forward heading follows the actual ordered street path from the current node toward the next node; reverse heading is forward + 180°. This is useful acquisition geometry because it does not assume one fixed Manhattan axis for every street.
          </div>
        </div>

        <div>
          <div className="text-[9px] font-mono font-bold text-stone-900 mb-2">APP RELEVANCE</div>
          <div className="space-y-2">
            {audit.app_relevance.map((item) => {
              const b = badge(item.status);
              return (
                <div key={item.key} className="rounded border border-stone-200 bg-white p-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[9px] font-mono font-bold text-stone-900">{item.key}</span>
                    <span className={`px-2 py-0.5 rounded border text-[7px] font-mono font-bold ${b.cls}`}>{b.label}</span>
                  </div>
                  <div className="text-[8px] text-stone-600 mt-1 leading-relaxed">{item.role}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded border border-amber-300 bg-amber-50 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <div className="text-[9px] font-mono font-bold text-amber-900">CURRENT MAIN CONTRACT DRIFT · REVIEW REQUIRED</div>
              <div className="text-[8px] text-amber-900 mt-1 leading-relaxed">{audit.current_main_consistency_audit.finding}</div>
              <div className="text-[8px] text-amber-800 mt-1 leading-relaxed"><strong>APP policy:</strong> {audit.current_main_consistency_audit.app_policy}</div>
            </div>
          </div>
        </div>

        <div className="rounded border border-sky-200 bg-sky-50 p-3">
          <div className="text-[9px] font-mono font-bold text-sky-900">STREET VIEW METADATA COVERAGE</div>
          <div className="text-[8px] text-sky-900 mt-1 leading-relaxed">
            The repo has an optional upstream metadata coverage check and can snap covered candidates to returned panorama coordinates. However, its node output contract does not persist pano_id or capture date. Therefore the APP labels node CSV coverage provenance as unproven unless a separate upstream manifest is supplied.
          </div>
        </div>

        <div className="rounded border border-rose-200 bg-rose-50 p-3">
          <div className="flex items-start gap-2">
            <XCircle className="w-3.5 h-3.5 text-rose-700 shrink-0 mt-0.5" />
            <div>
              <div className="text-[9px] font-mono font-bold text-rose-900">NO PAPER-CHAIN AUTO-UNLOCK</div>
              <div className="text-[8px] text-rose-800 mt-1 leading-relaxed">
                This repository supplies sampling/acquisition geometry only. It does not supply Qwen values, segmentation evidence, H/W, true SVF, Choice/Integration, GWR β, observed t_base or validated λ; I/Y/D/A/M/F/t_effective ownership remains unchanged.
              </div>
            </div>
          </div>
        </div>

        <div className="rounded border border-stone-200 bg-stone-50 p-2.5 text-[8px] font-mono text-stone-600">
          Source pin: {audit.source_repository} · {audit.source_branch} · {audit.source_commit.slice(0, 12)} · {audit.source_commit_date}
        </div>
      </div>
    </section>
  );
};

const Metric: React.FC<{label: string; value: string}> = ({label, value}) => (
  <div className="rounded border border-stone-200 bg-stone-50 px-2.5 py-2">
    <div className="text-[7px] font-mono uppercase text-stone-500">{label}</div>
    <div className="text-[9px] font-mono font-bold text-stone-900 mt-0.5">{value}</div>
  </div>
);
