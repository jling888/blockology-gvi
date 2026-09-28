/**
 * Compact production-facing Nature 9.03 synthesis.
 * Detailed variable-by-variable diagnostics remain in the codebase/export path.
 */

import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  LockKeyhole,
} from 'lucide-react';

import type { PaperSynthesisResult } from '../utils/simComputationEngine';

interface Props {
  paperSynthesis: PaperSynthesisResult;
  authorizationStatus?: 'AUTHORIZED' | 'PREVIEW_ONLY_NOT_APPROVED' | 'NOT_APPLICABLE';
}

function fmt(value: number | null | undefined, digits = 3): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toFixed(digits)
    : '—';
}

const OutputCard: React.FC<{
  symbol: string;
  label: string;
  value: number | null | undefined;
  dark?: boolean;
}> = ({ symbol, label, value, dark = false }) => (
  <div className={`rounded-lg border p-3 ${dark ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 bg-white text-stone-900'}`}>
    <div className={`text-[8px] font-mono uppercase tracking-wide ${dark ? 'text-stone-400' : 'text-stone-500'}`}>
      {label}
    </div>
    <div className="mt-1 flex items-baseline gap-2">
      <span className="text-[10px] font-mono font-bold">{symbol}</span>
      <span className="text-2xl font-mono font-bold">{fmt(value)}</span>
    </div>
  </div>
);

export const CorePaperSynthesisPanel: React.FC<Props> = ({
  paperSynthesis,
  authorizationStatus = 'NOT_APPLICABLE',
}) => {
  const previewOnly = authorizationStatus === 'PREVIEW_ONLY_NOT_APPROVED';
  const authorized = authorizationStatus === 'AUTHORIZED';
  const e = paperSynthesis.localElasticities.value;

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-mono font-bold text-stone-900">
            Nature 9.03 Final SIM
          </h2>
          <p className="mt-1 text-[10px] text-stone-500">
            M_i = I_i^a_i × Y_i^b_i × D_i^c_i · No Omega · No external A_i.
          </p>
        </div>

        <div
          className={`inline-flex items-center gap-1.5 self-start rounded border px-2.5 py-1 text-[9px] font-mono font-bold ${
            authorized
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : previewOnly
                ? 'border-amber-300 bg-amber-50 text-amber-900'
                : 'border-stone-200 bg-stone-50 text-stone-600'
          }`}
        >
          {authorized ? <CheckCircle2 className="h-3.5 w-3.5" /> : <LockKeyhole className="h-3.5 w-3.5" />}
          {authorized ? 'AUTHORIZED' : previewOnly ? 'PREVIEW ONLY' : 'SOURCE PENDING'}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <OutputCard symbol="I_i" label="Place Imageability" value={paperSynthesis.placeImageability.value} />
        <OutputCard symbol="Y_i" label="Place Identity" value={paperSynthesis.placeIdentity.value} />
        <OutputCard symbol="D_i" label="Place Dependence" value={paperSynthesis.placeDependence.value} />
        <OutputCard symbol="M_i" label="Street Interface Matrix" value={paperSynthesis.sim.value} dark />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="rounded border border-stone-200 bg-stone-50 p-3">
          <div className="text-[8px] font-mono uppercase text-stone-500">Elasticities</div>
          <div className="mt-1 text-[10px] font-mono text-stone-800">
            a={fmt(e?.a)} · b={fmt(e?.b)} · c={fmt(e?.c)}
          </div>
          <div className="mt-1 text-[8px] text-stone-500">
            {paperSynthesis.elasticitySource} · Σ={fmt(e?.sum)}
          </div>
        </div>

        <div className="rounded border border-stone-200 bg-stone-50 p-3">
          <div className="text-[8px] font-mono uppercase text-stone-500">Behavioral extension</div>
          <div className="mt-1 text-[10px] font-mono text-stone-800">
            F_i={fmt(paperSynthesis.stayabilityFactor.value)} · t_effective={fmt(paperSynthesis.tEffective.value)}
          </div>
          <div className="mt-1 text-[8px] text-stone-500">
            Remains gated until observed t_base and validated λ exist.
          </div>
        </div>
      </div>

      {paperSynthesis.gates.length > 0 && (
        <div className="flex items-start gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
          <div className="text-[9px] leading-relaxed text-amber-900">
            <strong>{paperSynthesis.gates.length} downstream gate{paperSynthesis.gates.length === 1 ? '' : 's'} remain.</strong>{' '}
            The active reference SIM can still be valid when the remaining gaps are limited to node-level GWR/Space Syntax or behavioral calibration.
          </div>
        </div>
      )}
    </section>
  );
};
