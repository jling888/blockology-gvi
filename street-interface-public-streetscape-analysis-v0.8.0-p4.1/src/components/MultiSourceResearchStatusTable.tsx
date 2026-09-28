/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Multi-Source Research Status Table & Provenance Resolution Card
 * Nature 9.03 Final · No-Omega v0.7.0-RC1
 * — Multi-Source Integration Verified
 */

import React from 'react';
import {
  ShieldCheck,
  Network,
  Eye,
  Sliders,
  Compass,
  Clock,
  Activity,
  Layers,
  Info,
} from 'lucide-react';
import {
  MULTI_SOURCE_PROVENANCE_RESOLUTION_RECORD,
  NATURE_903_FINAL_GWR_DIAGNOSTICS,
  V070_VERSION_METADATA,
} from '../research/multiSourceResearchRegistry';

interface StatusRow {
  domain: string;
  source: string;
  role: string;
  status: string;
  badgeColor: string;
  icon: React.ElementType;
}

function buildStatusRows(
  isApproved: boolean,
  streetNodeCrosswalkStatus: string,
): StatusRow[] {
  return [
    {
      domain: 'Visual-Semantic Source',
      source: 'mikellu12/murrayhill-v12 · Team Repository Qwen bridge',
      role: 'Median-led active VLM input · Qwen/Qwen2-VL-7B-Instruct · 180° along-street source',
      status: isApproved ? 'AUTHORIZED' : 'PREVIEW_ONLY_NOT_APPROVED',
      badgeColor: isApproved
        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
        : 'bg-amber-100 text-amber-800 border-amber-300',
      icon: Eye,
    },
    {
      domain: 'Sampling Geometry',
      source: 'ex032895-crypto/street-view-nodes',
      role: '20 m WGS84 street-network sampling specification · NOT_ACTIVE_SIM_EVIDENCE',
      status: streetNodeCrosswalkStatus,
      badgeColor: streetNodeCrosswalkStatus === 'RESOLVED'
        ? 'bg-blue-100 text-blue-800 border-blue-300'
        : 'bg-amber-100 text-amber-800 border-amber-300',
      icon: Network,
    },
    {
      domain: 'Morphology Geometry',
      source: 'mikellu12/murrayhill-v12',
      role: 'H_m / W_facade / H/W / node GVI-VEI-SVF-band context · NOT_ACTIVE_SIM_EVIDENCE',
      status: 'SOURCE_BACKED_CONTEXT',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      icon: Compass,
    },
    {
      domain: 'Space Syntax',
      source: 'Nature 9.03 Final manuscript',
      role: 'Choice / Integration paper specification at pedestrian radius R = 800 m; node values unavailable',
      status: 'PAPER_SPECIFICATION · NODE_UNAVAILABLE',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: Sliders,
    },
    {
      domain: 'GWR',
      source: 'Final paper diagnostics + pinned repository machinery',
      role: `Paper Model 2 R²=${NATURE_903_FINAL_GWR_DIAGNOSTICS.model2R2}; reported adaptive bi-square BW=${NATURE_903_FINAL_GWR_DIAGNOSTICS.reportedOptimizedBandwidthM} m; active fallback a=.40 b=.20 c=.40`,
      status: 'PAPER_REPORTED · GLOBAL_FALLBACK',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: Sliders,
    },
    {
      domain: 'Behavioral Observation',
      source: 'Nature 9.03 Final paper specification',
      role: 'Temporal t_raw required; no validated empirical duration exists for the current node',
      status: 'UNAVAILABLE_EMPIRICAL_BEHAVIORAL_OUTCOME',
      badgeColor: 'bg-stone-200 text-stone-700 border-stone-300',
      icon: Clock,
    },
    {
      domain: 'Stayability Calibration',
      source: 'Nature 9.03 Final stayability method',
      role: 'F_i = 1 + λM_i; λ remains unresolved; Blockology λ=1.0 is DEMO_ONLY',
      status: 'METHOD_GATED_MISSING_LAMBDA',
      badgeColor: 'bg-stone-200 text-stone-700 border-stone-300',
      icon: Activity,
    },
    {
      domain: 'Proxy Dwell Surface',
      source: 'Nature 9.03 Final spatial-kernel specification',
      role: 'D(x,y) / D_xy requires multi-node t_effective and a validated smoothing bandwidth R',
      status: 'NETWORK_MODEL_GATED',
      badgeColor: 'bg-stone-200 text-stone-700 border-stone-300',
      icon: Layers,
    },
  ];
}

export interface MultiSourceResearchStatusTableProps {
  compact?: boolean;
  isApproved?: boolean;
  streetNodeCrosswalkStatus?: string;
}

export const MultiSourceResearchStatusTable: React.FC<MultiSourceResearchStatusTableProps> = ({
  compact = false,
  isApproved = false,
  streetNodeCrosswalkStatus = 'UNRESOLVED_NODE_CROSSWALK',
}) => {
  const rows = buildStatusRows(isApproved, streetNodeCrosswalkStatus);

  return (
    <div className="bg-white border border-stone-200 rounded-lg shadow-xs overflow-hidden">
      <div className="bg-stone-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider">
            MULTI-SOURCE RESEARCH STATUS
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
            {V070_VERSION_METADATA.appDisplayVersion}
          </span>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
            {V070_VERSION_METADATA.releaseCandidateVersion}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-sans">
          <thead>
            <tr className="bg-stone-100 border-b border-stone-200 text-stone-600 font-mono text-[10px] uppercase">
              <th className="py-2.5 px-3 font-semibold">Research Domain</th>
              <th className="py-2.5 px-3 font-semibold">Source</th>
              <th className="py-2.5 px-3 font-semibold">Role</th>
              <th className="py-2.5 px-3 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.map((row) => {
              const IconComponent = row.icon;
              return (
                <tr key={row.domain} className="hover:bg-stone-50/80 transition-colors">
                  <td className="py-2 px-3 font-medium text-stone-900 flex items-center gap-2 whitespace-nowrap">
                    <IconComponent className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>{row.domain}</span>
                  </td>
                  <td className="py-2 px-3 text-stone-600 font-mono text-[10px]">
                    {row.source}
                  </td>
                  <td className="py-2 px-3 text-stone-600 text-[11px]">
                    {row.role}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${row.badgeColor}`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!compact && (
        <div className="px-4 py-2 bg-stone-50 border-t border-stone-200 text-[11px] text-stone-500 font-sans flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <span>
            Frozen scientific core:{' '}
            <span className="font-mono text-stone-700 font-semibold">
              {V070_VERSION_METADATA.scientificCore}
            </span>
            . v0.7.0-RC1 remains the verified multi-source integration schema; v0.7.1-UX1.3 changes operator presentation only. Active Nature 9.03 I/Y/D/M mathematics remain unchanged.
          </span>
        </div>
      )}
    </div>
  );
};

export const MultiSourceProvenanceResolutionCard: React.FC = () => {
  const { title, rows, footerNotice } = MULTI_SOURCE_PROVENANCE_RESOLUTION_RECORD;

  return (
    <div className="bg-white border border-stone-200 rounded-lg shadow-xs overflow-hidden mt-6">
      <div className="bg-stone-800 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-400" />
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider">
            {title}
          </h4>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-700 text-stone-300">
          PROVENANCE AUDIT
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div className="divide-y divide-stone-100 border border-stone-200 rounded-md overflow-hidden">
          {rows.map((r, idx) => (
            <div
              key={idx}
              className="p-3 bg-stone-50/50 hover:bg-white transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="space-y-0.5">
                <div className="font-medium text-xs text-stone-900">
                  {r.sourceBoundary}
                </div>
                <div className="text-[11px] text-stone-500 max-w-xl">
                  {r.description}
                </div>
              </div>
              <div className="shrink-0 self-start sm:self-center">
                <span className="inline-block px-2.5 py-1 text-[10px] font-mono font-bold rounded border bg-stone-100 text-stone-800 border-stone-300">
                  {r.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-sky-50 border border-sky-200 rounded text-xs text-sky-900 font-medium flex items-center gap-2">
          <Info className="w-4 h-4 text-sky-600 shrink-0" />
          <span>{footerNotice}</span>
        </div>
      </div>
    </div>
  );
};
