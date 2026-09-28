import React from 'react';
import {
  Compass,
  AlertTriangle,
  Info,
  ShieldCheck,
  Split,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import {
  MURRAY_HILL_DATASET_SUMMARY,
  MURRAY_HILL_PROVENANCE_SUMMARY,
} from '../research/murrayHillIntegratedDataset';
import { FINAL_PAPER_SAMPLE_ACCOUNTING } from '../research/multiSourceResearchRegistry';

interface OrientationProtocolReconciliationPanelProps {
  activePerspective?: string;
  isBundled?: boolean;
}

export const OrientationProtocolReconciliationPanel: React.FC<
  OrientationProtocolReconciliationPanelProps
> = () => {
  return (
    <section className="bg-white border border-stone-200 rounded-lg p-5 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 bg-stone-900 text-white font-mono text-xs font-bold rounded">
              NATURE 9.03 FINAL · SOURCE-PROTOCOL AUDIT
            </span>
            <h2 className="text-sm font-bold font-mono text-stone-900 uppercase tracking-tight">
              ORIENTATION PROTOCOL RECONCILIATION
            </h2>
          </div>
          <p className="text-xs text-stone-500 font-mono mt-1 max-w-4xl">
            The final paper's orthogonal 90° analytical specification and the pinned team's along-street 180° source protocol are recorded separately. Source verification does not imply paper-protocol equivalence.
          </p>
        </div>

        <StatusBadge
          status="warning"
          label="PAPER ALIGNMENT UNRESOLVED"
          size="sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-md space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-bold font-mono text-emerald-950 text-xs">
              <Compass className="w-4 h-4 text-emerald-700" />
              <span>FINAL PAPER ANALYTICAL TARGET</span>
            </div>
            <span className="px-1.5 py-0.5 bg-emerald-200 text-emerald-900 rounded text-[10px] font-mono font-bold">
              ORTHOGONAL 4 × 90°
            </span>
          </div>

          <ul className="text-emerald-900 text-[11px] space-y-1.5 list-disc pl-4 leading-relaxed">
            <li>
              360° cylindrical panorama represented as four street-relative orthogonal analytical frames centered at 0° / 90° / 180° / 270°.
            </li>
            <li>
              Analytical acquisition specification: <code>h_eye = 1.5 m</code>, pitch <code>0°</code>, sampling interval <code>20 m</code>.
            </li>
            <li>
              Final-paper sample accounting: <strong>{FINAL_PAPER_SAMPLE_ACCOUNTING.rawPhysicalNodes}</strong> raw nodes / <strong>{FINAL_PAPER_SAMPLE_ACCOUNTING.rawDualDirectionalObservations}</strong> raw observations; after excluding {FINAL_PAPER_SAMPLE_ACCOUNTING.excludedTunnelNodes} tunnel nodes / {FINAL_PAPER_SAMPLE_ACCOUNTING.excludedTunnelObservations} tunnel observations, <strong>{FINAL_PAPER_SAMPLE_ACCOUNTING.activePhysicalNodes}</strong> active nodes / <strong>{FINAL_PAPER_SAMPLE_ACCOUNTING.activeObservations}</strong> active observations.
            </li>
          </ul>
        </div>

        <div className="p-4 bg-sky-50/70 border border-sky-300 rounded-md space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-bold font-mono text-sky-950 text-xs">
              <Split className="w-4 h-4 text-sky-700" />
              <span>PINNED TEAM SOURCE</span>
            </div>
            <span className="px-1.5 py-0.5 bg-sky-200 text-sky-900 rounded text-[10px] font-mono font-bold">
              ALONG-STREET 180°
            </span>
          </div>

          <ul className="text-sky-900 text-[11px] space-y-1.5 list-disc pl-4 leading-relaxed">
            <li>
              Median-led repository table: <code>{MURRAY_HILL_DATASET_SUMMARY.sourceTable}</code>.
            </li>
            <li>
              Source table cardinality: <strong>{MURRAY_HILL_DATASET_SUMMARY.sourceRows}</strong> rows / <strong>{MURRAY_HILL_DATASET_SUMMARY.sourceUniqueNodes}</strong> unique source nodes; {MURRAY_HILL_DATASET_SUMMARY.sourceUsableRows} usable rows and {MURRAY_HILL_DATASET_SUMMARY.sourceExcludedRows} excluded rows.
            </li>
            <li>
              Source protocol: two opposing directional 180° renders aligned to the street axis.
            </li>
            <li>
              Commit: <code>{MURRAY_HILL_PROVENANCE_SUMMARY.currentRepositoryCommit}</code>.
            </li>
          </ul>
        </div>
      </div>

      <div className="border border-stone-200 rounded-lg p-4 bg-stone-50 space-y-3">
        <div className="flex items-center gap-2 font-mono font-bold text-xs text-stone-900 uppercase">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Current Provenance Decision</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[10px] font-mono">
          <div className="bg-white p-3 border border-emerald-200 rounded">
            <div className="flex items-center gap-1 text-emerald-800 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              SOURCE PROTOCOL VERIFIED
            </div>
            <div className="text-stone-600 mt-1">
              Team source = along-street 180° directional imagery.
            </div>
          </div>

          <div className="bg-white p-3 border border-amber-200 rounded">
            <div className="flex items-center gap-1 text-amber-800 font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              PAPER EQUIVALENCE UNRESOLVED
            </div>
            <div className="text-stone-600 mt-1">
              No claim that the 180° team source is identical to the orthogonal 90° analytical protocol.
            </div>
          </div>

          <div className="bg-white p-3 border border-sky-200 rounded">
            <div className="flex items-center gap-1 text-sky-800 font-bold">
              <Database className="w-3.5 h-3.5" />
              SOURCE / PAPER SAMPLES SEPARATED
            </div>
            <div className="text-stone-600 mt-1">
              Repository source-table cardinality and final-paper analytical sample accounting remain separate provenance records.
            </div>
          </div>
        </div>
      </div>

      <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-md text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold font-mono text-amber-950 text-[11px] uppercase">
          <Info className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Methodological Boundary</span>
        </div>
        <p className="text-amber-900 text-[11px] leading-relaxed">
          Current repository values may be reproduced and audited under their verified 180° source protocol. Equivalence to the paper's orthogonal 90° analytical sampling remains unresolved and must not be inferred from source coverage alone.
        </p>
      </div>
    </section>
  );
};
