import React from 'react';

import {
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
  Ruler,
} from 'lucide-react';

import type {
  MurrayHillMainRepoAudit,
  MainRepoAvailabilityStatus,
} from '../research/murrayHillMainRepoAudit';

interface Props {
  audit:
    MurrayHillMainRepoAudit | null;

  error:
    string | null;
}

function f(
  value:
    number | null | undefined,
  digits = 3
): string {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return '—';
  }

  return value.toFixed(
    digits
  );
}

function statusStyle(
  status:
    MainRepoAvailabilityStatus
): {
  label: string;
  cls: string;
} {
  switch (status) {
    case 'available':
      return {
        label: 'AVAILABLE',
        cls: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      };

    case 'machinery_only':
    case 'validation_covariate_only':
      return {
        label:
          status === 'machinery_only'
            ? 'MACHINERY ONLY'
            : 'VALIDATION ONLY',
        cls: 'border-amber-200 bg-amber-50 text-amber-800',
      };

    case 'uncalibrated':
      return {
        label: 'UNCALIBRATED',
        cls: 'border-violet-200 bg-violet-50 text-violet-800',
      };

    default:
      return {
        label:
          status === 'not_found_as_node_output'
            ? 'NODE OUTPUT NOT FOUND'
            : 'MISSING',
        cls: 'border-rose-200 bg-rose-50 text-rose-800',
      };
  }
}

export const MurrayHillMainRepoValidationPanel:
  React.FC<Props> = ({
    audit,
    error,
  }) => {
    if (error) {
      return (
        <div className="rounded border border-rose-200 bg-rose-50 p-3 text-[9px] text-rose-800">
          {error}
        </div>
      );
    }

    if (!audit) {
      return (
        <div className="rounded border border-stone-200 bg-stone-50 p-3 text-[9px] text-stone-600">
          Loading Murray Hill main-repo audit…
        </div>
      );
    }

    return (
      <section className="rounded-lg border border-indigo-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-indigo-100 bg-indigo-50/60 flex items-start gap-2.5">
          <FlaskConical className="w-4 h-4 text-indigo-700 mt-0.5" />

          <div>
            <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-900">
              Murray Hill Main-Repo QA & Method Availability
            </div>

            <div className="text-[10px] text-stone-600 mt-0.5">
              Committed validation outputs are separated from machinery/demo code so missing Space Syntax, GWR and behavior are never fabricated.
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Small
              label="Nodes"
              value={`${audit.dataset.physical_nodes}`}
            />

            <Small
              label="VLM views"
              value={`${audit.dataset.vlm_views}`}
            />

            <Small
              label="Source FOV / Pitch"
              value={`${audit.source_pipeline_config.fov_deg}° / ${audit.source_pipeline_config.pitch_deg}°`}
            />

            <Small
              label="Target capture"
              value={audit.source_pipeline_config.target_capture}
            />
          </div>

          <div className="rounded border border-sky-200 bg-sky-50 p-3">
            <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-sky-900">
              <Ruler className="w-3.5 h-3.5" />
              SOURCE GEOMETRY CONFIG
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-[8px]">
              <Small
                label="EPSG"
                value={`${audit.source_pipeline_config.projected_epsg}`}
              />
              <Small
                label="Node spacing"
                value={`${audit.source_pipeline_config.node_spacing_m} m`}
              />
              <Small
                label="H/W probe"
                value={`${audit.source_pipeline_config.geometry.hw_probe} · ${audit.source_pipeline_config.geometry.hw_band_rays} rays`}
              />
              <Small
                label="H/W bounds"
                value={`${audit.source_pipeline_config.geometry.hw_min_w_m}–${audit.source_pipeline_config.geometry.hw_max_w_m} m`}
              />
            </div>

            <div className="mt-2 text-[8px] text-sky-900 leading-relaxed">
              HW_source categories recorded by the repo: {audit.hw_source_categories.join(' / ')}.
            </div>
          </div>

          <div>
            <div className="text-[9px] font-mono font-bold text-stone-900 mb-2">
              QWEN ↔ MEASURED-TWIN VALIDATION
            </div>

            <div className="overflow-x-auto rounded border border-stone-200">
              <table className="w-full text-left text-[8px]">
                <thead className="bg-stone-50 font-mono uppercase text-stone-500">
                  <tr>
                    <th className="px-2 py-1.5">Field</th>
                    <th className="px-2 py-1.5">n</th>
                    <th className="px-2 py-1.5">ρ twin</th>
                    <th className="px-2 py-1.5">ρ EV</th>
                    <th className="px-2 py-1.5">Direction</th>
                  </tr>
                </thead>

                <tbody>
                  {audit.validation_twins.map((row) => (
                    <tr
                      key={row.field}
                      className="border-t border-stone-100"
                    >
                      <td className="px-2 py-1.5 font-mono text-stone-800">
                        {row.field}
                      </td>

                      <td className="px-2 py-1.5">
                        {row.n || '—'}
                      </td>

                      <td className="px-2 py-1.5 font-mono">
                        {f(row.rho_against_measured_twin)}
                      </td>

                      <td className="px-2 py-1.5 font-mono">
                        {f(row.rho_expected_value)}
                      </td>

                      <td className="px-2 py-1.5">
                        {row.pass_direction === true && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            PASS
                          </span>
                        )}

                        {row.pass_direction === false && (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-bold">
                            <XCircle className="w-3 h-3" />
                            FAIL / NO TWIN
                          </span>
                        )}

                        {row.pass_direction === null && (
                          <span className="text-amber-700 font-bold">
                            NOT IN TABLE
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-2 rounded border border-amber-200 bg-amber-50 p-2 text-[8px] text-amber-900 leading-relaxed">
              `ground_floor_activity` has a negative measured-twin correlation in the committed table and fails the expected direction. `facade_variation` has no measured twin in that table. `resting_affordance` is not present in the inspected validation output. The APP preserves these gaps rather than reporting all ten fields as validated.
            </div>
          </div>

          <div>
            <div className="text-[9px] font-mono font-bold text-stone-900 mb-2">
              RATING RELIABILITY / SPATIAL COHERENCE
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {audit.rating_reliability.map((row) => (
                <div
                  key={row.field}
                  className="rounded border border-stone-200 bg-stone-50 px-2.5 py-2"
                >
                  <div className="text-[8px] font-mono font-bold text-stone-800">
                    {row.field}
                  </div>

                  <div className="text-[8px] text-stone-600 mt-1">
                    same-frontage ρ {f(row.rho_same_frontage)} · Moran I {f(row.moran_I)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[9px] font-mono font-bold text-stone-900 mb-2">
              METHOD AVAILABILITY AUDIT
            </div>

            <div className="space-y-2">
              {audit.method_availability.map((item) => {
                const style =
                  statusStyle(
                    item.status
                  );

                return (
                  <div
                    key={item.key}
                    className="rounded border border-stone-200 bg-white p-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[9px] font-mono font-bold text-stone-900">
                        {item.label}
                      </span>

                      <span className={`px-2 py-0.5 rounded border text-[7px] font-mono font-bold ${style.cls}`}>
                        {style.label}
                      </span>
                    </div>

                    <div className="text-[8px] text-stone-600 mt-1 leading-relaxed">
                      {item.evidence}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded border border-rose-200 bg-rose-50 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-700 shrink-0 mt-0.5" />

              <div>
                <div className="text-[9px] font-mono font-bold text-rose-900">
                  DO NOT AUTO-UNLOCK THE PAPER CHAIN
                </div>

                <div className="text-[8px] text-rose-800 mt-1 leading-relaxed">
                  Main-repo GWR/dwell machinery is not an empirical replacement for missing Choice/Integration, local β, observed t_base or validated λ. Current APP gates remain correct.
                </div>
              </div>
            </div>
          </div>

          <div className="rounded border border-stone-200 bg-stone-50 p-2.5 text-[8px] font-mono text-stone-600">
            Source: {audit.source_repository} · {audit.source_branch} · {audit.source_commit.slice(0, 12)} · {audit.source_commit_date}
          </div>
        </div>
      </section>
    );
  };

const Small:
  React.FC<{
    label: string;
    value: string;
  }> = ({
    label,
    value,
  }) => (
    <div className="rounded border border-stone-200 bg-white px-2.5 py-2">
      <div className="text-[7px] font-mono uppercase text-stone-500">
        {label}
      </div>

      <div className="text-[9px] font-mono font-bold text-stone-900 mt-0.5">
        {value}
      </div>
    </div>
  );
