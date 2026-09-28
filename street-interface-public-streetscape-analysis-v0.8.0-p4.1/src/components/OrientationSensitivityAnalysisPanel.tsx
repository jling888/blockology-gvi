import React, { useState } from 'react';
import {
  Upload,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  LockKeyhole,
} from 'lucide-react';

import {
  analyzeOrientationSensitivity,
  type OrientationSensitivityAnalysisResult,
} from '../research/orientationSensitivityAnalyzer';

function format(value: number | null, digits = 3): string {
  if (value === null || !Number.isFinite(value)) {
    return '—';
  }

  return value.toFixed(digits);
}

interface LoadedCsv {
  filename: string;
  text: string;
}

export const OrientationSensitivityAnalysisPanel: React.FC = () => {
  const [teacherCsv, setTeacherCsv] =
    useState<LoadedCsv | null>(null);
  const [teamCsv, setTeamCsv] =
    useState<LoadedCsv | null>(null);
  const [result, setResult] =
    useState<OrientationSensitivityAnalysisResult | null>(null);
  const [error, setError] =
    useState<string | null>(null);

  const loadFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<LoadedCsv | null>>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError(null);
    setResult(null);

    try {
      setter({
        filename: file.name,
        text: await file.text(),
      });
    } catch (err: any) {
      setError(
        err?.message || 'Unable to read selected CSV.',
      );
    }
  };

  const runAnalysis = () => {
    if (!teacherCsv || !teamCsv) {
      setError('Both orientation-arm CSV files are required.');
      return;
    }

    try {
      setResult(
        analyzeOrientationSensitivity(
          teacherCsv.text,
          teacherCsv.filename,
          teamCsv.text,
          teamCsv.filename,
        ),
      );
      setError(null);
    } catch (err: any) {
      setError(
        err?.message ||
          'Unable to complete paired orientation analysis.',
      );
      setResult(null);
    }
  };

  return (
    <section className="bg-white border border-cyan-300 rounded-lg p-4 shadow-xs space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-cyan-700 text-white text-[9px] font-mono font-bold">
              PAIRED ANALYZER
            </span>

            <BarChart3 className="w-4 h-4 text-cyan-700" />

            <h2 className="text-base font-bold font-mono text-stone-900">
              Orientation Sensitivity — Paired CSV Analyzer
            </h2>
          </div>

          <p className="text-xs text-stone-500 mt-1 max-w-4xl">
            Compares the same node IDs across teacher-orthogonal and
            team-walk-relative Qwen outputs. Each node is aggregated from its
            four 90° views with equal angular weight before paired field
            statistics are computed.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-stone-300 bg-stone-50 text-stone-700 text-[9px] font-mono font-bold">
          <LockKeyhole className="w-3.5 h-3.5" />
          ANALYSIS ONLY · NO GATE UNLOCK
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <label className="border border-dashed border-stone-300 rounded p-3 bg-stone-50 cursor-pointer hover:bg-stone-100">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-stone-600" />
            <span className="text-[10px] font-mono font-bold uppercase text-stone-700">
              Arm A · Teacher Orthogonal Qwen CSV
            </span>
          </div>

          <div className="mt-1 text-[10px] text-stone-500 truncate">
            {teacherCsv?.filename ||
              'Future rerun required — no file loaded'}
          </div>

          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) =>
              loadFile(event, setTeacherCsv)
            }
          />
        </label>

        <label className="border border-dashed border-stone-300 rounded p-3 bg-stone-50 cursor-pointer hover:bg-stone-100">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-stone-600" />
            <span className="text-[10px] font-mono font-bold uppercase text-stone-700">
              Arm B · Team Walk-Relative Qwen CSV
            </span>
          </div>

          <div className="mt-1 text-[10px] text-stone-500 truncate">
            {teamCsv?.filename ||
              'Load current sim_vlm_v3.csv'}
          </div>

          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) =>
              loadFile(event, setTeamCsv)
            }
          />
        </label>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded p-3 text-[10px] text-amber-950 leading-relaxed">
        <strong>Aggregation note:</strong> individual 90° frames are not
        paired across protocols because their sector boundaries differ by
        45°. Instead, four equal-width views are averaged into one node-level
        field score for each arm before paired node statistics are computed.
        This is explicitly a sensitivity-study analytical choice.
      </div>

      <button
        type="button"
        disabled={!teacherCsv || !teamCsv}
        onClick={runAnalysis}
        className="inline-flex items-center gap-2 px-4 py-2 rounded bg-cyan-700 hover:bg-cyan-800 disabled:bg-stone-300 disabled:text-stone-500 text-white text-[10px] font-mono font-bold"
      >
        <BarChart3 className="w-4 h-4" />
        RUN PAIRED ORIENTATION ANALYSIS
      </button>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded p-3 flex items-start gap-2 text-[10px] text-rose-900">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {!result && (
        <div className="bg-stone-50 border border-stone-200 rounded p-3 text-[10px] text-stone-600">
          The current team CSV can be loaded now. The analysis remains
          intentionally incomplete until a Qwen rerun using the teacher
          orthogonal frame protocol is available.
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="bg-emerald-50 border border-emerald-200 rounded p-2">
              <div className="text-[8px] font-mono uppercase text-emerald-700">
                Paired nodes
              </div>
              <div className="font-mono font-bold text-emerald-950 mt-0.5">
                {result.pairedNodeCount}
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded p-2">
              <div className="text-[8px] font-mono uppercase text-stone-500">
                Teacher complete nodes
              </div>
              <div className="font-mono font-bold text-stone-900 mt-0.5">
                {result.teacherArm.completeFourViewNodes}
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded p-2">
              <div className="text-[8px] font-mono uppercase text-stone-500">
                Team complete nodes
              </div>
              <div className="font-mono font-bold text-stone-900 mt-0.5">
                {result.teamArm.completeFourViewNodes}
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded p-2">
              <div className="text-[8px] font-mono uppercase text-stone-500">
                Equivalence decision
              </div>
              <div className="font-mono font-bold text-stone-900 mt-0.5">
                NOT AUTOMATED
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-stone-200 rounded">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-stone-100 border-b border-stone-200">
                <tr className="text-[9px] font-mono uppercase text-stone-500">
                  <th className="px-3 py-2">Field</th>
                  <th className="px-3 py-2 text-right">N paired</th>
                  <th className="px-3 py-2 text-right">Mean signed Δ A−B</th>
                  <th className="px-3 py-2 text-right">Mean |Δ|</th>
                  <th className="px-3 py-2 text-right">Median |Δ|</th>
                  <th className="px-3 py-2 text-right">Max |Δ|</th>
                  <th className="px-3 py-2 text-right">Spearman ρ</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100">
                {result.fields.map((field) => (
                  <tr key={field.fieldId} className="text-[10px]">
                    <td className="px-3 py-2 font-mono font-bold text-stone-900">
                      {field.fieldId}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {field.pairedNodeCount}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {format(field.meanSignedDifference)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {format(field.meanAbsoluteDifference)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {format(field.medianAbsoluteDifference)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {format(field.maxAbsoluteDifference)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {format(field.spearmanRho)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded p-3 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p className="text-[10px] text-emerald-950 leading-relaxed">
              Statistics computed successfully. These values describe
              orientation sensitivity only; they do not automatically declare
              the protocols equivalent and do not unlock Qwen Paper Assembly.
            </p>
          </div>

          {result.warnings.length > 0 && (
            <div className="bg-stone-50 border border-stone-200 rounded p-3">
              <div className="text-[9px] font-mono font-bold uppercase text-stone-600 mb-1">
                Analysis warnings
              </div>

              <ul className="list-disc pl-5 space-y-1 text-[9px] text-stone-600">
                {result.warnings.slice(0, 20).map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
