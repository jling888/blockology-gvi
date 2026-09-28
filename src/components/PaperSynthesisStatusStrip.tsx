/**
 * Street Interface Measurement — Nature 9.02 Aligned v0.4
 * Compact Stage 04 status strip.
 *
 * Presentation only. It does not own or mutate research state.
 */

import React from 'react';
import {
  Database,
  ShieldCheck,
  Sigma,
} from 'lucide-react';

import type {
  PaperResearchAssemblyResult,
} from '../utils/paperResearchAssembler';

import type {
  PaperSynthesisResult,
} from '../utils/simComputationEngine';

interface PaperSynthesisStatusStripProps {
  paperAssembly: PaperResearchAssemblyResult;
  paperSynthesis: PaperSynthesisResult;
  authorizationStatus?: 'AUTHORIZED' | 'PREVIEW_ONLY_NOT_APPROVED' | 'NOT_APPLICABLE';
}

function simTone(
  status: PaperSynthesisResult['sim']['status']
): string {
  if (status === 'computed') {
    return 'border-emerald-300 bg-emerald-50 text-emerald-900';
  }

  if (status === 'invalid_input') {
    return 'border-rose-300 bg-rose-50 text-rose-900';
  }

  return 'border-amber-300 bg-amber-50 text-amber-900';
}

export const PaperSynthesisStatusStrip: React.FC<
  PaperSynthesisStatusStripProps
> = ({
  paperAssembly,
  paperSynthesis,
  authorizationStatus = 'NOT_APPLICABLE',
}) => {
  const assemblyGateCount =
    paperAssembly.gates.length;

  const engineGateCount =
    paperSynthesis.gates.length;

  const simStatus =
    paperSynthesis.sim.status;

  const simDisplayStatus =
    authorizationStatus === 'PREVIEW_ONLY_NOT_APPROVED' && simStatus === 'computed'
      ? 'PREVIEW ONLY · NOT APPROVED'
      : simStatus.replace(/_/g, ' ').toUpperCase();

  const simDisplayTone =
    authorizationStatus === 'PREVIEW_ONLY_NOT_APPROVED' && simStatus === 'computed'
      ? 'border-amber-300 bg-amber-50 text-amber-900'
      : simTone(simStatus);

  return (
    <div className="bg-white border border-stone-200 rounded-lg px-3 py-2.5 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Sigma className="w-4 h-4 text-stone-700 shrink-0 mt-0.5" />

          <div>
            <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-600">
              Deterministic Paper Synthesis
            </div>

            <p className="text-[9px] text-stone-500 mt-0.5 leading-relaxed">
              Paper-ready path: approved Qwen + GIS/Geometry + Space Syntax/GWR + Behavior → I/Y/D/Aᵢ → local elasticities → Mᵢ → Fᵢ. Current gates determine manuscript readiness.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 font-mono text-[9px]">
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-stone-200 bg-stone-50 text-stone-700">
            <Database className="w-3 h-3" />
            <span>
              Assembly Gates:
            </span>
            <strong>
              {assemblyGateCount}
            </strong>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-stone-200 bg-stone-50 text-stone-700">
            <ShieldCheck className="w-3 h-3" />
            <span>
              Engine Gates:
            </span>
            <strong>
              {engineGateCount}
            </strong>
          </div>

          <div
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border font-bold ${simDisplayTone}`}
          >
            <Sigma className="w-3 h-3" />

            <span>
              SIM:
            </span>

            <span>
              {simDisplayStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
