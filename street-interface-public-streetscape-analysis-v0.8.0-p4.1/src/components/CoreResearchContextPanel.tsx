/**
 * Compact source-backed spatial / calibration context for the production UI.
 * Detailed audits remain in source code and exports; the main interface shows
 * only information that changes interpretation of the active SIM result.
 */

import React from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Network,
} from 'lucide-react';

import type { RepoPaperBridgeAssembly } from '../data/teamRepository/teamRepositoryTypes';
import type { PaperExternalResearchInputs } from '../utils/paperResearchAssembler';
import {
  NATURE_903_BEHAVIOR,
  NATURE_903_GWR,
  NATURE_903_GWR_PAPER_BENCHMARKS,
} from '../research/nature903Protocol';

interface Props {
  assembly: RepoPaperBridgeAssembly | null;
  externalInputs: PaperExternalResearchInputs;
}

function fmt(value: number | null | undefined, digits = 3): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toFixed(digits)
    : '—';
}

const Metric: React.FC<{
  label: string;
  value: string;
  note?: string;
}> = ({ label, value, note }) => (
  <div className="rounded-lg border border-stone-200 bg-white px-3 py-2.5">
    <div className="text-[8px] font-mono uppercase tracking-wide text-stone-500">
      {label}
    </div>
    <div className="mt-0.5 text-sm font-mono font-bold text-stone-900 break-words">
      {value}
    </div>
    {note && (
      <div className="mt-0.5 text-[8px] leading-relaxed text-stone-500">
        {note}
      </div>
    )}
  </div>
);

const Availability: React.FC<{
  label: string;
  available: boolean;
  value?: string;
}> = ({ label, available, value }) => (
  <div className="flex items-center justify-between gap-3 rounded border border-stone-200 bg-white px-3 py-2">
    <span className="text-[9px] font-mono text-stone-700">{label}</span>
    <span
      className={`inline-flex items-center gap-1 text-[8px] font-mono font-bold ${
        available ? 'text-emerald-800' : 'text-amber-800'
      }`}
    >
      {available ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <AlertTriangle className="h-3 w-3" />
      )}
      {available ? value ?? 'AVAILABLE' : 'SOURCE GAP'}
    </span>
  </div>
);

export const CoreResearchContextPanel: React.FC<Props> = ({
  assembly,
  externalInputs,
}) => {
  const geometry = assembly?.matchedRecord.geometryRecord ?? null;
  const betas = externalInputs.gwrLocalBetas;
  const benchmark = NATURE_903_GWR_PAPER_BENCHMARKS.model2;

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-2xs space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-sky-700" />
          <h2 className="text-sm font-mono font-bold text-stone-900">
            Spatial & Calibration Context
          </h2>
        </div>
        <p className="mt-1 text-[10px] leading-relaxed text-stone-500">
          Only source-backed geometry and paper-level calibration facts are shown here. H/W is context only in Nature 9.03 Final; the active SIM has no external canyon multiplier.
        </p>
      </div>

      <div>
        <div className="mb-2 text-[9px] font-mono font-bold uppercase tracking-wide text-stone-700">
          Geometry · repository source
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Metric label="Building height H" value={fmt(geometry?.hM)} note="m" />
          <Metric
            label="Facade width W"
            value={fmt(geometry?.wFacade)}
            note={geometry?.wFacade == null ? 'Not directly measured for this row' : 'm'}
          />
          <Metric label="H/W effective" value={fmt(geometry?.hwEffective)} note="Context only" />
          <Metric label="H/W source" value={geometry?.hwSource ?? '—'} note="Measured / radius_mean / series / open_one_side" />
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2">
          <Metric label="Node GVI" value={fmt(geometry?.nodeGVI)} note="Validation context" />
          <Metric label="Node VEI" value={fmt(geometry?.nodeVEI)} note="Validation context" />
          <Metric label="SVF band" value={fmt(geometry?.nodeSVFBand)} note="Band sky share; not hemispherical SVF" />
        </div>
      </div>

      <div className="border-t border-stone-200 pt-4">
        <div className="mb-2 flex items-center gap-2">
          <Network className="h-4 w-4 text-sky-800" />
          <div>
            <div className="text-[9px] font-mono font-bold uppercase tracking-wide text-stone-700">
              Space Syntax + GWR
            </div>
            <div className="text-[9px] text-stone-500">
              Paper specification and reported model diagnostics are available; node-level network/GWR outputs are not in the current source tables.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Metric label="Choice" value={`R=${NATURE_903_GWR.choiceRadiusMeters} m`} note="Paper specification" />
          <Metric label="Integration" value={`R=${NATURE_903_GWR.integrationRadiusMeters} m`} note="Paper specification" />
          <Metric label="Kernel" value={NATURE_903_GWR.kernel} note="Network distance" />
          <Metric label="Bandwidth" value="100 m" note="Paper-reported benchmark; runtime calibration not reproduced" />
          <Metric label="Model 2 R²" value={String(benchmark.r2)} note="Paper-reported" />
          <Metric label="Residual Moran I" value={String(benchmark.residualMoranI)} note={`p=${benchmark.residualMoranP}`} />
          <Metric label="VIF max" value={String(benchmark.vifMax)} note="Paper-reported" />
          <Metric label="Optimization" value="Golden Section / AICc" note="Paper specification" />
        </div>

        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
          <Availability
            label="Node Choice_i"
            available={externalInputs.spaceSyntaxChoice !== null}
            value={fmt(externalInputs.spaceSyntaxChoice, 4)}
          />
          <Availability
            label="Node Integration_i"
            available={externalInputs.spaceSyntaxIntegration !== null}
            value={fmt(externalInputs.spaceSyntaxIntegration, 4)}
          />
          <Availability
            label="Node local GWR β vector"
            available={Boolean(betas)}
            value="LOCAL_GWR_CALIBRATED"
          />
        </div>
      </div>

      <div className="border-t border-stone-200 pt-4">
        <div className="mb-2 flex items-center gap-2">
          <Activity className="h-4 w-4 text-purple-700" />
          <div className="text-[9px] font-mono font-bold uppercase tracking-wide text-stone-700">
            Behavioral calibration
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Availability
            label="Observed t_raw / t_base"
            available={externalInputs.tRawSeconds !== null || externalInputs.tBase !== null}
            value={externalInputs.tRawSeconds !== null ? `${fmt(externalInputs.tRawSeconds, 0)} s` : fmt(externalInputs.tBase, 4)}
          />
          <Availability
            label="Validated λ"
            available={NATURE_903_BEHAVIOR.lambda !== null}
            value={NATURE_903_BEHAVIOR.lambda === null ? undefined : String(NATURE_903_BEHAVIOR.lambda)}
          />
        </div>

        <div className="mt-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[9px] leading-relaxed text-amber-900">
          Repository GWR audit is blocked on a real behavioral outcome, and the manuscript defines λ symbolically without a validated value. These gaps do not block the reference SIM M_i; they gate only behavioral amplification outputs.
        </div>
      </div>
    </section>
  );
};
