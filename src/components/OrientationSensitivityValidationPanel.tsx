import React from 'react';
import {
  FlaskConical,
  LockKeyhole,
  EqualNot,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';

import {
  ORIENTATION_SENSITIVITY_FIELDS,
  ORIENTATION_SENSITIVITY_METRICS,
  ORIENTATION_SENSITIVITY_STUDY,
} from '../research/orientationSensitivityProtocol';

export const OrientationSensitivityValidationPanel: React.FC = () => {
  const complete =
    ORIENTATION_SENSITIVITY_STUDY.status ===
      'research_decision_recorded' &&
    ORIENTATION_SENSITIVITY_STUDY.thresholdsStatus ===
      'research_team_defined';

  return (
    <section className="bg-white border border-sky-300 rounded-lg p-4 shadow-xs space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-sky-700 text-white text-[9px] font-mono font-bold">
              SENSITIVITY DESIGN
            </span>

            <FlaskConical className="w-4 h-4 text-sky-700" />

            <h2 className="text-base font-bold font-mono text-stone-900">
              Paired Orientation Sensitivity Validation
            </h2>
          </div>

          <p className="text-xs text-stone-500 mt-1 max-w-4xl">
            Proposed paired study for deciding whether the implemented
            walk-relative Qwen dataset can be treated as sufficiently stable
            relative to the teacher orthogonal frame specification.
          </p>
        </div>

        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-[9px] font-mono font-bold ${
            complete
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-stone-50 border-stone-300 text-stone-700'
          }`}
        >
          {complete ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <LockKeyhole className="w-3.5 h-3.5" />
          )}

          {ORIENTATION_SENSITIVITY_STUDY.status
            .replace(/_/g, ' ')
            .toUpperCase()}
        </div>
      </div>

      <div className="bg-sky-50 border border-sky-200 rounded p-3 text-[10px] text-sky-950 leading-relaxed">
        <strong>Paired unit:</strong>{' '}
        {ORIENTATION_SENSITIVITY_STUDY.pairedUnit}
        <br />
        <strong>Source requirement:</strong>{' '}
        {ORIENTATION_SENSITIVITY_STUDY.requiredSourceMatch}
        <br />
        <strong>Model requirement:</strong>{' '}
        {ORIENTATION_SENSITIVITY_STUDY.requiredModelMatch}
        <br />
        <strong>Instrument requirement:</strong>{' '}
        {ORIENTATION_SENSITIVITY_STUDY.requiredInstrumentMatch}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="border border-stone-200 rounded p-3">
          <div className="text-[9px] font-mono font-bold uppercase text-stone-600">
            Arm A · Teacher orientation
          </div>
          <p className="mt-1 text-[10px] text-stone-700 leading-relaxed">
            {ORIENTATION_SENSITIVITY_STUDY.teacherArm}
          </p>
        </div>

        <div className="border border-stone-200 rounded p-3">
          <div className="text-[9px] font-mono font-bold uppercase text-stone-600">
            Arm B · Implemented team orientation
          </div>
          <p className="mt-1 text-[10px] text-stone-700 leading-relaxed">
            {ORIENTATION_SENSITIVITY_STUDY.teamArm}
          </p>
        </div>
      </div>

      <div className="border border-stone-200 rounded p-3">
        <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase text-stone-600">
          <BarChart3 className="w-3.5 h-3.5" />
          Metrics to compute
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 mt-2">
          {ORIENTATION_SENSITIVITY_METRICS.map((metric) => (
            <div
              key={metric.id}
              className="bg-stone-50 border border-stone-200 rounded p-2"
            >
              <div className="text-[9px] font-mono font-bold text-stone-800">
                {metric.label}
              </div>
              <div className="text-[9px] text-stone-500 mt-1 leading-relaxed">
                {metric.purpose}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-stone-200 rounded p-3">
        <div className="text-[9px] font-mono font-bold uppercase text-stone-600 mb-2">
          Fields tested independently
        </div>

        <div className="flex flex-wrap gap-1.5">
          {ORIENTATION_SENSITIVITY_FIELDS.map((field) => (
            <span
              key={field}
              className="px-2 py-1 rounded border border-sky-200 bg-sky-50 text-sky-900 text-[9px] font-mono font-bold"
            >
              {field}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded p-3">
        <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase text-amber-900">
          <EqualNot className="w-3.5 h-3.5" />
          No equivalence threshold invented
        </div>

        <p className="mt-1 text-[10px] text-amber-950 leading-relaxed">
          The APP currently does not define an arbitrary acceptable Δ,
          correlation cutoff or equivalence margin. Those thresholds must be
          explicitly agreed by the research team before this study can unlock
          the orientation gate.
        </p>
      </div>

      <div className="bg-stone-900 text-white rounded p-3">
        <div className="text-[9px] font-mono font-bold uppercase text-sky-300">
          Current decision rule
        </div>

        <p className="mt-1 text-[10px] leading-relaxed">
          {ORIENTATION_SENSITIVITY_STUDY.currentDecisionRule}
        </p>
      </div>

      <div className="border border-stone-200 rounded p-3">
        <div className="text-[9px] font-mono font-bold uppercase text-stone-600 mb-2">
          Required study outputs
        </div>

        <ol className="list-decimal pl-5 space-y-1 text-[10px] text-stone-700 leading-relaxed">
          {ORIENTATION_SENSITIVITY_STUDY.requiredOutputs.map((output) => (
            <li key={output}>{output}</li>
          ))}
        </ol>
      </div>
    </section>
  );
};
