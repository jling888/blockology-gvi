import React from 'react';

import {
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  Trees,
  Building2,
} from 'lucide-react';

import type {
  BlockologyDatasetManifest,
  BlockologyNodeMatch,
} from '../research/blockologyGviRegistry';

interface Props {
  manifest: BlockologyDatasetManifest | null;
  match: BlockologyNodeMatch | null;
}

export const BlockologyValidationProtocolPanel:
  React.FC<Props> = ({
    manifest,
    match,
  }) => {
    if (!manifest) {
      return (
        <div className="rounded border border-stone-200 bg-stone-50 p-3 text-[9px] text-stone-600">
          Blockology protocol manifest is not loaded.
        </div>
      );
    }

    const p =
      manifest.protocol;

    return (
      <section className="rounded-lg border border-teal-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-teal-100 bg-teal-50/60 flex items-start gap-2.5">
          <FlaskConical className="w-4 h-4 text-teal-700 mt-0.5" />

          <div>
            <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-teal-900">
              Blockology GVI / VEI Cross-Modal Validation Protocol
            </div>

            <div className="text-[10px] text-stone-600 mt-0.5">
              Independent six-heading CAT-Seg protocol registered for validation. It does not become a canonical paper-variable owner.
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <ProtocolMetric
              label="Headings"
              value={`${p.imagery_headings_per_node}`}
            />

            <ProtocolMetric
              label="FOV"
              value={`${p.field_of_view_deg}°`}
            />

            <ProtocolMetric
              label="Pitch"
              value={`${p.pitch_deg}°`}
            />

            <ProtocolMetric
              label="Coverage"
              value={p.imagery_offsets_deg.join(' / ') + '°'}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded border border-emerald-200 bg-emerald-50 p-3">
              <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-emerald-900">
                <Trees className="w-3.5 h-3.5" />
                NODE GVI
              </div>

              <div className="mt-2 rounded bg-white border border-emerald-100 px-2.5 py-2 text-[10px] font-mono text-stone-900">
                {p.gvi_formula}
              </div>

              <p className="text-[8px] text-emerald-900 mt-2 leading-relaxed">
                Six headings are aggregated by flat pixel count. This can validate greenery evidence, but it must not overwrite the APP's Qwen GVI_eye construct.
              </p>
            </div>

            <div className="rounded border border-violet-200 bg-violet-50 p-3">
              <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-violet-900">
                <Building2 className="w-3.5 h-3.5" />
                NODE VEI
              </div>

              <div className="mt-2 rounded bg-white border border-violet-100 px-2.5 py-2 text-[10px] font-mono text-stone-900">
                {p.vei_formula}
              </div>

              <p className="text-[8px] text-violet-900 mt-2 leading-relaxed">
                Building-vs-sky enclosure evidence only. VEI is image-derived and must not be relabeled as true hemispherical SVF.
              </p>
            </div>
          </div>

          <div className="rounded border border-sky-200 bg-sky-50 p-3 text-[8px] text-sky-900 leading-relaxed">
            <strong>Sampling protocol:</strong> Street View metadata search radius {p.metadata_search_radius_m} m, outdoor imagery only; six {p.field_of_view_deg}° rectilinear views at offsets {p.imagery_offsets_deg.join(', ')}°, pitch {p.pitch_deg}°. Grid bearing is {p.grid_bearing_deg.avenue}° for avenues and {p.grid_bearing_deg.mid_block}° for mid-block streets.
          </div>

          <div className="rounded border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />

              <div>
                <div className="text-[9px] font-mono font-bold text-amber-900">
                  METRIC VALUES NOT BUNDLED IN CURRENT REPO OUTPUT
                </div>

                <p className="text-[8px] text-amber-800 mt-1 leading-relaxed">
                  The inspected repository includes nodes and panorama metadata, plus the code that computes metrics.csv, but no committed output/metrics/metrics.csv. Therefore the APP registers the validation method now without inventing Blockology GVI/VEI values.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded border border-stone-200 bg-stone-50 p-3">
            <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-stone-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
              VALIDATION RULES PRESERVED
            </div>

            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-[8px] text-stone-700">
              <div className="rounded bg-white border border-stone-200 p-2">
                Complete-node rule: {p.metrics_complete_node_rule}.
              </div>

              <div className="rounded bg-white border border-stone-200 p-2">
                Scaffolding sensitivity: {p.scaffolding_sensitivity_rule}.
              </div>
            </div>
          </div>

          {match?.kind === 'candidate_street_sequence' && (
            <div className="rounded border border-amber-200 bg-amber-50 p-2.5 text-[8px] text-amber-900 leading-relaxed">
              Current Blockology record is only a candidate street+sequence crosswalk. It is shown for audit context and is not used to claim node-level validation equivalence.
            </div>
          )}
        </div>
      </section>
    );
  };

const ProtocolMetric:
  React.FC<{
    label: string;
    value: string;
  }> = ({
    label,
    value,
  }) => (
    <div className="rounded border border-stone-200 bg-stone-50 px-2.5 py-2">
      <div className="text-[8px] font-mono uppercase text-stone-500">
        {label}
      </div>

      <div className="text-[10px] font-mono font-bold text-stone-900 mt-0.5">
        {value}
      </div>
    </div>
  );
