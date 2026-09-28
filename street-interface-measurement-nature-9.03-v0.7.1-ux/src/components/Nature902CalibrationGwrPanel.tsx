import React from 'react';

import {
  SlidersHorizontal,
  Network,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

import {
  NATURE_902_CWMC_REFERENCE,
  NATURE_902_GWR,
  NATURE_902_MODEL_BENCHMARKS,
} from '../research/nature902Protocol';

export const Nature902CalibrationGwrPanel:
  React.FC = () => {
    return (
      <section className="rounded-lg border border-sky-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-sky-100 bg-sky-50/60">
          <div className="flex items-start gap-2.5">
            <SlidersHorizontal className="w-4 h-4 text-sky-700 mt-0.5" />

            <div>
              <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-sky-900">
                Nature 9.02 Calibration & Spatial Econometric Protocol
              </div>

              <div className="text-[10px] text-stone-600 mt-0.5">
                Manuscript reference calibration values and the required Space Syntax–controlled GWR specification. Benchmarks below are paper references, not the current single-node APP result.
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <div className="text-[9px] font-mono font-bold text-stone-900 mb-2">
              CITY-WIDE MEDIAN CALIBRATION (CWMC)
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <Metric
                label="τI"
                value={`${NATURE_902_CWMC_REFERENCE.tauI}`}
                note={NATURE_902_CWMC_REFERENCE.tauISource}
              />

              <Metric
                label="τD"
                value={`${NATURE_902_CWMC_REFERENCE.tauD}`}
                note={NATURE_902_CWMC_REFERENCE.tauDSource}
              />

              <Metric
                label="Ωth"
                value={`${NATURE_902_CWMC_REFERENCE.canyonThreshold}`}
                note={NATURE_902_CWMC_REFERENCE.canyonThresholdSource}
              />

              <Metric
                label="κI"
                value={`${NATURE_902_CWMC_REFERENCE.kappaI}`}
                note="Imageability sigmoid slope"
              />

              <Metric
                label="κD"
                value={`${NATURE_902_CWMC_REFERENCE.kappaD}`}
                note="Dependence sigmoid slope"
              />

              <Metric
                label="ψ"
                value={`${NATURE_902_CWMC_REFERENCE.canyonPsi}`}
                note="Environmental TFP enclosure decay"
              />
            </div>

            <div className="mt-2 rounded border border-amber-200 bg-amber-50 p-2.5 text-[8px] text-amber-900 leading-relaxed">
              <strong>Calibration provenance:</strong> 0.20 / 0.50 / 2.0 are manuscript reference values attributed to city-wide medians. They are not universal constants and must not be re-labeled as an empirically recomputed city-wide profile until the actual calibration dataset is supplied.
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-stone-900 mb-2">
              <Network className="w-3.5 h-3.5 text-sky-700" />
              STRICT PAPER GWR SPECIFICATION
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Metric
                label="Choice"
                value={`R=${NATURE_902_GWR.choiceRadiusMeters} m`}
                note="Segment Betweenness"
              />

              <Metric
                label="Integration"
                value={`R=${NATURE_902_GWR.integrationRadiusMeters} m`}
                note="Segment Closeness"
              />

              <Metric
                label="Kernel"
                value={NATURE_902_GWR.kernel}
                note={NATURE_902_GWR.distance}
              />

              <Metric
                label="Bandwidth"
                value={NATURE_902_GWR.bandwidthOptimization}
                note={NATURE_902_GWR.objective}
              />

              <Metric
                label="Multiple Testing"
                value="BH-FDR"
                note={NATURE_902_GWR.multipleTesting}
              />

              <Metric
                label="Local significance"
                value={`|t| ≥ ${NATURE_902_GWR.correctedLocalTThreshold}`}
                note={`α ≈ ${NATURE_902_GWR.correctedAlphaApprox}`}
              />

              <Metric
                label="β required"
                value="β0 / βI / βY / βD / βChoice / βInt"
                note="All six for strict full-model provenance"
              />

              <Metric
                label="Elasticity denominator"
                value="|βI| + |βY| + |βD|"
                note="β0 / βChoice / βInt excluded"
              />
            </div>

            <div className="mt-2 rounded border border-amber-200 bg-amber-50 p-2.5 text-[8px] text-amber-900 leading-relaxed">
              <strong>Bandwidth wording review:</strong> the manuscript also reports an optimized bandwidth of 100 m while describing an adaptive bi-square kernel. The APP records this as a manuscript benchmark requiring parameterization verification; it is not hard-coded as the active runtime bandwidth.
            </div>
          </div>

          <div className="rounded border border-violet-200 bg-violet-50 p-3">
            <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-violet-900">
              <ShieldCheck className="w-3.5 h-3.5" />
              PAPER BENCHMARK — NOT CURRENT RUN
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              <div className="rounded border border-violet-100 bg-white p-2.5 text-[8px] text-stone-700">
                <div className="font-mono font-bold text-stone-900">
                  Model 1 · {NATURE_902_MODEL_BENCHMARKS.model1.label}
                </div>
                <div className="mt-1">
                  R² {NATURE_902_MODEL_BENCHMARKS.model1.r2} · residual Moran I {NATURE_902_MODEL_BENCHMARKS.model1.residualMoranI}
                </div>
              </div>

              <div className="rounded border border-violet-100 bg-white p-2.5 text-[8px] text-stone-700">
                <div className="font-mono font-bold text-stone-900">
                  Model 2 · {NATURE_902_MODEL_BENCHMARKS.model2.label}
                </div>
                <div className="mt-1">
                  R² {NATURE_902_MODEL_BENCHMARKS.model2.r2} · ΔR² +{NATURE_902_MODEL_BENCHMARKS.model2.deltaR2} · residual Moran I {NATURE_902_MODEL_BENCHMARKS.model2.residualMoranI} (p={NATURE_902_MODEL_BENCHMARKS.model2.residualMoranP}) · VIFmax {NATURE_902_MODEL_BENCHMARKS.model2.vifMax}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded border border-rose-200 bg-rose-50 p-2.5 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-700 shrink-0 mt-0.5" />

            <p className="text-[8px] text-rose-900 leading-relaxed">
              These manuscript-level statistics do not substitute for the missing observation-level Choice, Integration, and local coefficient table. The strict APP chain must remain gated until those data are imported.
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
    note: string;
  }> = ({
    label,
    value,
    note,
  }) => (
    <div className="rounded border border-stone-200 bg-white px-2.5 py-2">
      <div className="text-[7px] font-mono uppercase text-stone-500">
        {label}
      </div>

      <div className="text-[9px] font-mono font-bold text-stone-900 mt-0.5 break-words">
        {value}
      </div>

      <div className="text-[7px] text-stone-500 mt-0.5">
        {note}
      </div>
    </div>
  );
