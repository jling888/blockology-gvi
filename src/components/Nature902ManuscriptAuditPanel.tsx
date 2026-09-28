import React from 'react';

import {
  AlertTriangle,
  CheckCircle2,
  FileWarning,
} from 'lucide-react';

import {
  NATURE_902_MODEL_BENCHMARKS,
} from '../research/nature902Protocol';

export const Nature902ManuscriptAuditPanel:
  React.FC = () => {
    return (
      <section className="rounded-lg border border-amber-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-amber-100 bg-amber-50/60 flex items-start gap-2.5">
          <FileWarning className="w-4 h-4 text-amber-700 mt-0.5" />

          <div>
            <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-900">
              Nature 9.02 Manuscript Consistency Audit
            </div>

            <div className="text-[10px] text-stone-600 mt-0.5">
              The APP preserves unresolved manuscript-version inconsistencies instead of silently choosing one interpretation.
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <Audit
            severity="pass"
            title="SFV and Y_i resolution (Nature 9.03 Final)"
            text="In Nature 9.03 Final, Place Identity incorporates GFAPI alongside V_sign and (1-SVF). SFV is retained for supplementary validation provenance only, resolving the earlier Appendix JSON schema omission."
          />

          <Audit
            severity="pass"
            title="Place Dependence final formula (Nature 9.03 Final)"
            text="Nature 9.03 Final sets D_raw_paper = γ1·V_pave + γ2·IAS, normalized by (γ1+γ2) into D_calibration_input. GFAPI transitioned into Place Identity (Y_i)."
          />

          <Audit
            severity="pass"
            title="Raw vs. active sample sizes"
            text="The APP distinguishes RAW 766 nodes / 3,064 observations from ACTIVE 764 nodes / 3,056 observations after excluding two subterranean tunnel nodes (eight views)."
          />

          <Audit
            severity="warning"
            title="Residual Moran's I version labeling"
            text={`The manuscript reports multiple residual diagnostics. The APP records Model 1 residual Moran I ${NATURE_902_MODEL_BENCHMARKS.model1.residualMoranI} and Model 2 ${NATURE_902_MODEL_BENCHMARKS.model2.residualMoranI} separately rather than exposing one ambiguous 'GWR Moran I' value.`}
          />

          <Audit
            severity="warning"
            title="Adaptive bandwidth vs. reported 100 m"
            text="The manuscript describes an adaptive bi-square kernel optimized by Golden Section Search/AICc, while later reporting a 100 m optimized bandwidth. The APP treats 100 m as a manuscript benchmark requiring parameterization verification, not an operational hard-coded setting."
          />

          <Audit
            severity="warning"
            title="Canonical 1–7 vs. result tables on 0–1"
            text="The active computation remains 1–7. The APP exposes a clearly labeled derived 0–1 comparison scale for K-Means/typology comparison only; no normalized value replaces the canonical score."
          />

          <div className="rounded border border-sky-200 bg-sky-50 p-3">
            <div className="text-[9px] font-mono font-bold text-sky-900">
              VLM VALIDATION COVERAGE — METHOD BOUNDARY
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-[8px]">
              <Validation
                label="Direct / physical validation candidates"
                value="V_nat · V_built · GVI_eye / vegetation evidence · enclosure evidence"
              />

              <Validation
                label="Semantic constructs needing manual/double-blind validation"
                value="GMI · V_sign · SFV · GFAPI · V_pave / contextual walkability · IAS"
              />
            </div>
          </div>

          <div className="rounded border border-rose-200 bg-rose-50 p-2.5 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-700 shrink-0 mt-0.5" />

            <p className="text-[8px] text-rose-900 leading-relaxed">
              Manuscript benchmark statistics, typology reference weights, and Appendix examples are never allowed to populate missing observation-level Space Syntax or GWR data automatically.
            </p>
          </div>
        </div>
      </section>
    );
  };

const Audit:
  React.FC<{
    severity:
      | 'warning'
      | 'pass';
    title: string;
    text: string;
  }> = ({
    severity,
    title,
    text,
  }) => (
    <div
      className={`rounded border p-2.5 ${
        severity ===
        'pass'
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-amber-200 bg-amber-50'
      }`}
    >
      <div className="flex items-start gap-2">
        {severity ===
        'pass'
          ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
          )
          : (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
          )}

        <div>
          <div
            className={`text-[9px] font-mono font-bold ${
              severity ===
              'pass'
                ? 'text-emerald-900'
                : 'text-amber-900'
            }`}
          >
            {title}
          </div>

          <div
            className={`text-[8px] mt-1 leading-relaxed ${
              severity ===
              'pass'
                ? 'text-emerald-800'
                : 'text-amber-800'
            }`}
          >
            {text}
          </div>
        </div>
      </div>
    </div>
  );

const Validation:
  React.FC<{
    label: string;
    value: string;
  }> = ({
    label,
    value,
  }) => (
    <div className="rounded border border-sky-100 bg-white p-2.5">
      <div className="font-mono font-bold text-sky-900">
        {label}
      </div>

      <div className="mt-1 text-stone-600 leading-relaxed">
        {value}
      </div>
    </div>
  );
