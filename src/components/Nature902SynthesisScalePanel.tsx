import React from 'react';

import {
  Scale,
  AlertTriangle,
} from 'lucide-react';

import type {
  PaperSynthesisResult,
} from '../utils/simComputationEngine';

import {
  NATURE_902_KMEANS_REFERENCE,
  NATURE_902_REFERENCE_ELASTICITIES,
  paperSevenPointToUnitScale,
} from '../research/nature902Protocol';

interface Props {
  paperSynthesis:
    PaperSynthesisResult;
}

function f(
  value:
    number | null,
  digits = 3
): string {
  return value === null
    ? '—'
    : value.toFixed(
        digits
      );
}

export const Nature902SynthesisScalePanel:
  React.FC<Props> = ({
    paperSynthesis,
  }) => {
    const i =
      paperSevenPointToUnitScale(
        paperSynthesis
          .placeImageability
          .value
      );

    const y =
      paperSevenPointToUnitScale(
        paperSynthesis
          .placeIdentity
          .value
      );

    const d =
      paperSevenPointToUnitScale(
        paperSynthesis
          .placeDependence
          .value
      );

    return (
      <section className="rounded-lg border border-violet-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-violet-100 bg-violet-50/60 flex items-start gap-2.5">
          <Scale className="w-4 h-4 text-violet-700 mt-0.5" />

          <div>
            <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-violet-900">
              1–7 Canonical Scale / 0–1 Comparison Scale
            </div>

            <div className="text-[10px] text-stone-600 mt-0.5">
              The active computation remains on the 1–7 paper scale. A normalized comparison view is exposed only because the manuscript's K-Means and typology results are reported on a 0–1 scale.
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Metric
              label="Imageability"
              seven={paperSynthesis.placeImageability.value}
              unit={i}
            />

            <Metric
              label="Identity"
              seven={paperSynthesis.placeIdentity.value}
              unit={y}
            />

            <Metric
              label="Dependence"
              seven={paperSynthesis.placeDependence.value}
              unit={d}
            />
          </div>

          <div className="rounded border border-stone-200 overflow-hidden">
            <div className="px-3 py-2 bg-stone-50 border-b border-stone-200 text-[8px] font-mono font-bold text-stone-800">
              MANUSCRIPT K-MEANS REFERENCE CENTROIDS · k={NATURE_902_KMEANS_REFERENCE.k} · silhouette={NATURE_902_KMEANS_REFERENCE.silhouette}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3">
              {NATURE_902_KMEANS_REFERENCE.clusters.map(
                (cluster) => (
                  <div
                    key={cluster.key}
                    className="p-3 border-b md:border-b-0 md:border-r last:border-r-0 border-stone-200"
                  >
                    <div className="text-[9px] font-mono font-bold text-stone-900">
                      {cluster.label}
                    </div>

                    <div className="text-[8px] text-stone-500 mt-0.5">
                      {cluster.nodes} nodes · {cluster.observations} obs.
                    </div>

                    <div className="grid grid-cols-3 gap-1 mt-2">
                      <Small label="I" value={cluster.I} />
                      <Small label="Y" value={cluster.Y} />
                      <Small label="D" value={cluster.D} />
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="rounded border border-sky-200 bg-sky-50 p-3">
            <div className="text-[8px] font-mono font-bold text-sky-900">
              REFERENCE ELASTICITIES — SCENARIO CONTEXT ONLY
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-[8px]">
              <Reference
                label="Global"
                a={NATURE_902_REFERENCE_ELASTICITIES.global.a}
                b={NATURE_902_REFERENCE_ELASTICITIES.global.b}
                c={NATURE_902_REFERENCE_ELASTICITIES.global.c}
              />

              <Reference
                label="Avenue Canyon"
                a={NATURE_902_REFERENCE_ELASTICITIES.avenueCanyon.a}
                b={NATURE_902_REFERENCE_ELASTICITIES.avenueCanyon.b}
                c={NATURE_902_REFERENCE_ELASTICITIES.avenueCanyon.c}
              />

              <Reference
                label="Covenant Mid-Block"
                a={NATURE_902_REFERENCE_ELASTICITIES.covenantMidblock.a}
                b={NATURE_902_REFERENCE_ELASTICITIES.covenantMidblock.b}
                c={NATURE_902_REFERENCE_ELASTICITIES.covenantMidblock.c}
              />

              <Reference
                label="Porous POPS"
                a={NATURE_902_REFERENCE_ELASTICITIES.porousPops.a}
                b={NATURE_902_REFERENCE_ELASTICITIES.porousPops.b}
                c={NATURE_902_REFERENCE_ELASTICITIES.porousPops.c}
              />
            </div>
          </div>

          <div className="rounded border border-amber-200 bg-amber-50 p-2.5 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />

            <p className="text-[8px] text-amber-900 leading-relaxed">
              Reference centroids and typology elasticities do not unlock strict M_i. The active deterministic chain continues to require observation-level Space Syntax controls and empirical local GWR coefficients.
            </p>
          </div>
        </div>
      </section>
    );
  };

const Metric:
  React.FC<{
    label: string;
    seven:
      number | null;
    unit:
      number | null;
  }> = ({
    label,
    seven,
    unit,
  }) => (
    <div className="rounded border border-stone-200 bg-stone-50 p-3">
      <div className="text-[8px] font-mono uppercase text-stone-500">
        {label}
      </div>

      <div className="flex items-end gap-3 mt-1">
        <div>
          <div className="text-[7px] text-stone-400">
            CANONICAL
          </div>

          <div className="text-lg font-mono font-bold text-stone-900">
            {f(seven)}
          </div>

          <div className="text-[7px] font-mono text-stone-500">
            1–7
          </div>
        </div>

        <div>
          <div className="text-[7px] text-stone-400">
            COMPARISON
          </div>

          <div className="text-sm font-mono font-bold text-violet-800">
            {f(unit)}
          </div>

          <div className="text-[7px] font-mono text-stone-500">
            0–1
          </div>
        </div>
      </div>
    </div>
  );

const Small:
  React.FC<{
    label: string;
    value: number;
  }> = ({
    label,
    value,
  }) => (
    <div className="rounded bg-stone-50 border border-stone-200 p-1.5 text-center">
      <div className="text-[7px] font-mono text-stone-500">
        {label}
      </div>

      <div className="text-[9px] font-mono font-bold text-stone-900">
        {value.toFixed(3)}
      </div>
    </div>
  );

const Reference:
  React.FC<{
    label: string;
    a: number;
    b: number;
    c: number;
  }> = ({
    label,
    a,
    b,
    c,
  }) => (
    <div className="rounded border border-sky-100 bg-white p-2">
      <div className="font-mono font-bold text-sky-900">
        {label}
      </div>

      <div className="mt-1 font-mono text-stone-700">
        a {a.toFixed(2)} · b {b.toFixed(2)} · c {c.toFixed(2)}
      </div>
    </div>
  );
