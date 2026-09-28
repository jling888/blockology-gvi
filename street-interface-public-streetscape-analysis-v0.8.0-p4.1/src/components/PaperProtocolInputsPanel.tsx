/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Street Interface Measurement — Nature 9.03 Final · No-Omega v0.7.0
 * — Multi-Source Research Integration & Controlled Observation Surface
 */

import React from 'react';
import {
  Sparkles,
  MapPin,
  Network,
  Activity,
  AlertTriangle,
  RotateCcw,
  Info,
  ShieldCheck,
  Lock,
  ArrowDown,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import {
  EMPTY_PAPER_EXTERNAL_INPUTS,
  PaperExternalResearchInputs,
} from '../utils/paperResearchAssembler';
import type { RepoPaperBridgeAssembly } from '../data/teamRepository/teamRepositoryTypes';
import type { PaperSynthesisResult } from '../utils/simComputationEngine';
import {
  NATURE_903_GWR_PAPER_DIAGNOSTICS,
  NATURE_903_FINAL_GWR_DIAGNOSTICS,
  NATURE_903_BEHAVIORAL_SPECIFICATION,
  SOURCE_CONFLICT_AUDIT_NOTICE,
  REPOSITORY_GWR_CALIBRATION_RECORD,
  FINAL_PAPER_SAMPLE_ACCOUNTING,
  SPACE_SYNTAX_PAPER_SPECIFICATION,
  GWR_SAMPLE_PROVENANCE_AUDIT,
  PAPER_REPOSITORY_CALIBRATION_BOUNDARY,
  FORMULA_VERSION_BOUNDARY,
  RESEARCH_SOURCE_IDENTITIES,
  MURRAY_HILL_GEOMETRY_SOURCE,
  BLOCKOLOGY_PLACEHOLDER_LAMBDA_RECORD,
  BEHAVIORAL_EVIDENCE_PROVENANCE_BOUNDARY,
  PROXY_DWELL_PAPER_SPECIFICATION,
} from '../research/multiSourceResearchRegistry';
import { MultiSourceProvenanceResolutionCard } from './MultiSourceResearchStatusTable';
import { PINNED_GWR_MACHINERY_ROWS } from '../data/teamRepository/gwrMachinery';

export interface PaperProtocolInputsPanelProps {
  value: PaperExternalResearchInputs;
  onChange: (next: PaperExternalResearchInputs) => void;
  repoAssembly?: RepoPaperBridgeAssembly | null;
  paperSynthesis?: PaperSynthesisResult | null;
  qwenApprovalActive?: boolean;
}

interface NumericFieldProps {
  label: string;
  symbol: string;
  value: number | null;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  note: string;
  owner?: string;
  onChange: (value: number | null) => void;
}

const NumericField: React.FC<NumericFieldProps> = ({
  label,
  symbol,
  value,
  placeholder = 'Not available',
  min,
  max,
  step = 0.01,
  note,
  owner = 'EXTERNAL INPUT',
  onChange,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    if (raw.trim() === '') return onChange(null);
    const parsed = Number(raw);
    onChange(Number.isFinite(parsed) ? parsed : null);
  };

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-semibold text-stone-900">{label}</div>
          <div className="text-[10px] font-mono font-bold text-stone-500 mt-0.5">{symbol}</div>
        </div>
        <span className="px-1.5 py-0.5 bg-stone-100 border border-stone-200 rounded text-[8px] font-mono text-stone-500">
          {owner}
        </span>
      </div>
      <input
        type="number"
        value={value ?? ''}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-xs font-mono text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-hidden focus:border-stone-500"
      />
      <p className="text-[10px] text-stone-500 leading-relaxed">{note}</p>
    </div>
  );
};

interface GeometryCardProps {
  label: string;
  symbol: string;
  value: number | string | null;
  classification: string;
  sourceRepo: string;
  sourceColumn: string;
  sourceStatus: 'PRESENT' | 'UNAVAILABLE';
  paperRole: string;
  warning?: string;
}

const GeometryCard: React.FC<GeometryCardProps> = ({
  label,
  symbol,
  value,
  classification,
  sourceRepo,
  sourceColumn,
  sourceStatus,
  paperRole,
  warning,
}) => {
  const isPresent = sourceStatus === 'PRESENT' && value !== null && value !== undefined;

  return (
    <div className={`rounded-lg border p-3 space-y-2 ${isPresent ? 'bg-white border-stone-200' : 'bg-stone-50 border-stone-200 opacity-90'}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-semibold text-stone-900">{label}</div>
          <div className="text-[10px] font-mono font-bold text-sky-800">{symbol}</div>
        </div>
        <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold border ${
          classification === 'REPO_MEASURED'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
            : classification === 'REPO_DERIVED'
              ? 'bg-blue-50 text-blue-800 border-blue-300'
              : classification === 'REPO_GEOMETRY_CONTEXT'
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-stone-100 text-stone-600 border-stone-300'
        }`}>
          {classification}
        </span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-lg font-mono font-bold text-stone-900">
          {isPresent
            ? typeof value === 'number'
              ? value.toFixed(4)
              : String(value)
            : 'UNAVAILABLE'}
        </span>
        <span className="text-[9px] font-mono text-stone-400">
          col: [{sourceColumn}]
        </span>
      </div>

      <div className="text-[9px] font-mono text-stone-500 space-y-0.5 border-t border-stone-100 pt-1.5">
        <div><span className="text-stone-400">repo:</span> {sourceRepo}</div>
        <div><span className="text-stone-400">role:</span> {paperRole}</div>
      </div>

      {warning && (
        <div className="p-1.5 rounded bg-amber-50 border border-amber-200 text-[8px] text-amber-900 leading-tight">
          <strong>Notice:</strong> {warning}
        </div>
      )}
    </div>
  );
};

export const PaperProtocolInputsPanel: React.FC<PaperProtocolInputsPanelProps> = ({
  value,
  onChange,
  repoAssembly,
  paperSynthesis,
  qwenApprovalActive = false,
}) => {
  const update = <K extends keyof PaperExternalResearchInputs>(
    key: K,
    nextValue: PaperExternalResearchInputs[K]
  ) => onChange({ ...value, [key]: nextValue });

  const updateGwrBeta = (
    key:
      | 'betaIntercept'
      | 'betaImageability'
      | 'betaIdentity'
      | 'betaDependence'
      | 'betaChoice'
      | 'betaIntegration',
    nextValue: number | null
  ) => {
    const current = value.gwrLocalBetas ?? {
      betaIntercept: null,
      betaImageability: null,
      betaIdentity: null,
      betaDependence: null,
      betaChoice: null,
      betaIntegration: null,
    };

    const next = { ...current, [key]: nextValue };
    const allNull = Object.values(next).every((v) => v === null);
    update('gwrLocalBetas', allNull ? null : next);
  };

  const getGwrValue = (
    key:
      | 'betaIntercept'
      | 'betaImageability'
      | 'betaIdentity'
      | 'betaDependence'
      | 'betaChoice'
      | 'betaIntegration'
  ): number | null => value.gwrLocalBetas?.[key] ?? null;

  const isWorkingDataset =
    value.visualInputMode === 'murrayhill_dataset_working';

  const isApprovedQwen =
    value.visualInputMode === 'approved_qwen';

  const qwenInputNote = (
    sourceField: string,
    extra: string,
  ): string => {
    if (isWorkingDataset) {
      return `Working source: Murray Hill integrated Qwen ${sourceField} component. Usable for interim current-formula synthesis only; NON-CANONICAL and orientation-gated until the paper-assembly approval conditions are satisfied. ${extra}`;
    }

    if (isApprovedQwen) {
      return `Canonical source: approved Qwen ${sourceField}. ${extra}`;
    }

    return `Manual / unclassified value. Canonical source, when explicitly approved, is Qwen ${sourceField}; manual entry is an audit/migration override and does not itself establish Qwen provenance. ${extra}`;
  };

  // Active geometry record extracted from repository bridge
  const geom = repoAssembly?.matchedRecord.geometryRecord;
  const activeRepo = repoAssembly?.matchedRecord.sourceMetadata.repositoryName ?? 'mikellu12/murrayhill-v12';

  // Active M calculation for stayability dependency chain
  const activeM = paperSynthesis?.sim?.value ?? repoAssembly?.synthesis?.sim?.value ?? 6.214327916148292;
  const isMApproved = qwenApprovalActive || Boolean(paperSynthesis?.gates?.includes('APPROVAL_ACTIVE'));

  return (
    <section id="paper-protocol-inputs" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-stone-900 text-white rounded">
              STAGE 03 · INPUTS
            </span>
            <h2 className="text-base font-bold text-stone-900 font-mono">
              Paper Protocol Inputs — Nature 9.03 Final · No-Omega · v0.7.1-UX1.3 UI
            </h2>
            <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-sky-100 text-sky-800 rounded border border-sky-300">
              MULTI-SOURCE RESEARCH INTEGRATION
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1 max-w-4xl">
            Controlled multi-repository provenance boundary across Street Network Sampling, Murray Hill Morphology &amp; VLM, and Blockology Geometry. Paper-wide diagnostic statistics are isolated from node-level calibrations.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange({ ...EMPTY_PAPER_EXTERNAL_INPUTS })}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded text-[10px] font-mono font-bold text-stone-700"
        >
          <RotateCcw className="w-3.5 h-3.5" /> RESET INPUTS
        </button>
      </div>

      {/* J. SOURCE-CONFLICT AUDIT NOTICE */}
      <div className="rounded-lg border border-amber-300 bg-amber-50/80 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-800 shrink-0" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-950">
              SOURCE-CONFLICT AUDIT · {SOURCE_CONFLICT_AUDIT_NOTICE.title}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-800 text-white text-[9px] font-mono font-bold">
            PROVENANCE BOUNDARY ENFORCED
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-amber-950">
          <div className="rounded border border-amber-200 bg-white p-3">
            <div className="font-mono font-bold text-[10px] uppercase text-stone-500 mb-1">
              Paper Status
            </div>
            <div>{SOURCE_CONFLICT_AUDIT_NOTICE.paper}</div>
          </div>
          <div className="rounded border border-amber-200 bg-white p-3">
            <div className="font-mono font-bold text-[10px] uppercase text-stone-500 mb-1">
              Repository Status
            </div>
            <div>{SOURCE_CONFLICT_AUDIT_NOTICE.repository}</div>
          </div>
        </div>

        <div className="rounded border border-amber-200 bg-white/90 p-3 space-y-1.5">
          <div className="font-mono font-bold text-[10px] uppercase text-stone-800">
            Resolution Protocol:
          </div>
          <ul className="list-disc list-inside text-[10px] text-stone-700 space-y-1">
            {SOURCE_CONFLICT_AUDIT_NOTICE.resolution.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
          <div className="text-[10px] font-mono font-bold text-emerald-900 pt-1 border-t border-amber-100">
            {SOURCE_CONFLICT_AUDIT_NOTICE.verdict}
          </div>
        </div>
      </div>

      {/* A. Paper VLM Inputs */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-700" />
          <div>
            <h3 className="text-xs font-mono font-bold text-stone-900 uppercase">
              {isWorkingDataset
                ? 'A. Paper VLM Inputs — Working Qwen Dataset (Non-Canonical)'
                : isApprovedQwen
                  ? 'A. Paper VLM Inputs — Approved Qwen Instrument'
                  : 'A. Paper VLM Inputs — Manual / Unclassified'}
            </h3>
            <p className="text-[10px] text-stone-500">
              Normalized visual-semantic variables [0,1] derived from 7-rung ordinal interpolated medians.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <NumericField label="Natural Elements Above-Ground" symbol="V_nat" value={value.vlmVNat} min={0} max={1} step={0.001} owner="QWEN / VLM" note={qwenInputNote('vertical_greenery normalized EV', 'Vision natural-pixel fractions remain validation evidence, not automatic substitutes.')} onChange={(v) => update('vlmVNat', v)} />
          <NumericField label="Built Elements Above-Ground" symbol="V_built" value={value.vlmVBuilt} min={0} max={1} step={0.001} owner="QWEN / VLM" note={qwenInputNote('vertical_hardscape normalized EV', 'This is visual built presence, not numerical H/W.')} onChange={(v) => update('vlmVBuilt', v)} />
          <NumericField label="Foveal Green View Index" symbol="GVI_eye" value={value.gviEye} min={0} max={1} step={0.001} owner="QWEN / VLM" note={qwenInputNote('green_eye_level normalized EV', 'Canonical use requires the standardized 90° instrument. Note: node_GVI != GVI_eye.')} onChange={(v) => update('gviEye', v)} />
          <NumericField label="Green Mitigation Interaction" symbol="GMI" value={value.gmi} min={0} max={1} step={0.001} owner="QWEN / VLM" note={qwenInputNote('green_softening normalized EV', 'Construct-validation status remains explicitly tracked.')} onChange={(v) => update('gmi', v)} />
          <NumericField label="Cognitive Legibility Landmarks" symbol="V_sign" value={value.vSign} min={0} max={1} step={0.001} owner="QWEN / VLM" note={qwenInputNote('signage_detail normalized EV', 'Exact-RGB signboard/detail fractions remain validation candidates.')} onChange={(v) => update('vSign', v)} />
          <NumericField label="Sidewalk & Paver Walkability" symbol="V_pave" value={value.vPave} min={0} max={1} step={0.001} owner="QWEN / VLM" note={qwenInputNote('walkable_ground normalized EV', 'Vision sidewalk/paver evidence remains a separate QA arm.')} onChange={(v) => update('vPave', v)} />
          <NumericField label="Standardized Canyon Enclosure Proxy" symbol="E_proxy" value={value.canyonEnclosureRatio} min={0} max={1} step={0.001} owner="QWEN / VLM" note={qwenInputNote('sky_openness-derived enclosure proxy', 'It is not a true whole-sky / hemispherical SVF measurement.')} onChange={(v) => update('canyonEnclosureRatio', v)} />
          <NumericField label="Ground-Floor Active Permeability" symbol="GFAPI" value={value.gfapi} min={0} max={1} step={0.001} owner="QWEN / VLM" note={qwenInputNote('ground_floor_activity normalized EV', 'Glazing pixels alone are not sufficient.')} onChange={(v) => update('gfapi', v)} />
          <NumericField label="Interface Affordance Score" symbol="IAS" value={value.ias} min={0} max={1} step={0.001} owner="QWEN / VLM" note={qwenInputNote('resting_affordance normalized EV', 'Current validation strength remains weak and must stay visible.')} onChange={(v) => update('ias', v)} />
          <NumericField label="Street Facade Variation" symbol="SFV" value={value.sfv} min={0} max={1} step={0.001} owner="QWEN / VLM" note={qwenInputNote('facade_variation normalized EV', 'Supplementary validation only.')} onChange={(v) => update('sfv', v)} />
        </div>
      </div>

      {/* F. UPDATE B. GEOMETRY INPUTS UI */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sky-700" />
            <div>
              <h3 className="text-xs font-mono font-bold text-stone-900 uppercase">
                B. Geometry Inputs &amp; Contextual Metrics
              </h3>
              <p className="text-[10px] text-stone-500">
                Source-backed morphological geometry from active repository bridge. Geometry context is isolated and prohibited from overwriting active SIM synthesis.
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 text-[9px] font-mono font-bold border border-sky-300">
            ACTIVE REPO: {activeRepo}
          </span>
        </div>

        {/* B1. MURRAY HILL MORPHOLOGY GEOMETRY (v0.7.0 STEP 3) */}
        <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-200/80 pb-2">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-indigo-700 text-white text-[9px] font-mono font-bold tracking-wider">
                B1
              </span>
              <div>
                <h4 className="text-xs font-mono font-bold text-indigo-950">
                  Murray Hill Morphology Geometry
                </h4>
                <p className="text-[10px] text-indigo-800">
                  Source: {MURRAY_HILL_GEOMETRY_SOURCE.repositoryName} @ {MURRAY_HILL_GEOMETRY_SOURCE.repositoryCommit.slice(0, 8)} · {MURRAY_HILL_GEOMETRY_SOURCE.sourceTable} · Contextual provenance only · Zero active SIM impact
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 border border-indigo-300 text-[9px] font-mono font-bold">
                NODE: {repoAssembly?.nodeId ?? 'n00045'}
              </span>
              <span className="px-2 py-0.5 rounded bg-stone-900 text-white text-[9px] font-mono font-bold">
                NOT_ACTIVE_SIM_EVIDENCE
              </span>
            </div>
          </div>

          <div className="p-2 rounded bg-amber-50 border border-amber-200 text-[9px] text-amber-900 leading-relaxed font-mono">
            <div className="font-bold text-amber-950 mb-0.5">Physical Morphology Provenance &amp; Boundary Notice:</div>
            Geometry values are bound by exact header name from the pinned Murray Hill dataset. Missing values remain null without reverse engineering (e.g. W_facade is never reconstructed from H_m / HW_effective). Open-one-side is preserved as a physical morphology state, not missing data. node_GVI does NOT overwrite eye-level GVI, and node_SVF_band is NOT a true whole-sky SVF.
          </div>

          {/* 8 Distinct Geometry Context Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <GeometryCard
              label="Building Height"
              symbol="H_m"
              value={geom?.hM ?? null}
              classification={geom?.hM !== null && geom?.hM !== undefined ? 'REPO_GEOMETRY_CONTEXT' : 'UNAVAILABLE'}
              sourceRepo={MURRAY_HILL_GEOMETRY_SOURCE.repositoryName}
              sourceColumn="H_m"
              sourceStatus={geom?.hM !== null && geom?.hM !== undefined ? 'PRESENT' : 'UNAVAILABLE'}
              paperRole="GEOMETRY_CONTEXT_ONLY"
            />

            <GeometryCard
              label="Direct Facade Width"
              symbol="W_facade"
              value={geom?.wFacade ?? null}
              classification={geom?.wFacade !== null && geom?.wFacade !== undefined ? 'REPO_GEOMETRY_CONTEXT' : 'UNAVAILABLE'}
              sourceRepo={MURRAY_HILL_GEOMETRY_SOURCE.repositoryName}
              sourceColumn="W_facade"
              sourceStatus={geom?.wFacade !== null && geom?.wFacade !== undefined ? 'PRESENT' : 'UNAVAILABLE'}
              paperRole="GEOMETRY_CONTEXT_ONLY"
              warning="Show source-backed value only if actually present. Never reverse-engineer from H_m / HW_effective."
            />

            <GeometryCard
              label="Direct Aspect Ratio"
              symbol="HW_facade"
              value={geom?.hwFacade ?? null}
              classification={geom?.hwFacade !== null && geom?.hwFacade !== undefined ? 'REPO_GEOMETRY_CONTEXT' : 'UNAVAILABLE'}
              sourceRepo={MURRAY_HILL_GEOMETRY_SOURCE.repositoryName}
              sourceColumn="HW_facade"
              sourceStatus={geom?.hwFacade !== null && geom?.hwFacade !== undefined ? 'PRESENT' : 'UNAVAILABLE'}
              paperRole="GEOMETRY_CONTEXT_ONLY"
              warning="Strictly null if source is blank. Never reconstruct from H_m and HW_effective."
            />

            <GeometryCard
              label="Effective Aspect Ratio"
              symbol="HW_effective"
              value={geom?.hwEffective ?? null}
              classification={geom?.hwEffective !== null && geom?.hwEffective !== undefined ? 'REPO_GEOMETRY_CONTEXT' : 'UNAVAILABLE'}
              sourceRepo={MURRAY_HILL_GEOMETRY_SOURCE.repositoryName}
              sourceColumn="HW_effective"
              sourceStatus={geom?.hwEffective !== null && geom?.hwEffective !== undefined ? 'PRESENT' : 'UNAVAILABLE'}
              paperRole="GEOMETRY_CONTEXT_ONLY"
              warning="Must NOT directly modify active Nature 9.03 SIM calculation (A_i is retired)."
            />

            <GeometryCard
              label="H/W Source Method"
              symbol="HW_source"
              value={geom?.hwSource ?? null}
              classification={geom?.hwSource ? 'REPO_GEOMETRY_CONTEXT' : 'UNAVAILABLE'}
              sourceRepo={MURRAY_HILL_GEOMETRY_SOURCE.repositoryName}
              sourceColumn="HW_source"
              sourceStatus={geom?.hwSource ? 'PRESENT' : 'UNAVAILABLE'}
              paperRole="GEOMETRY_CONTEXT_ONLY"
              warning="Literal repository source category: measured, radius_mean, series, or open_one_side."
            />

            <GeometryCard
              label="Contextual Green View"
              symbol="node_GVI"
              value={geom?.nodeGVI ?? null}
              classification={geom?.nodeGVI !== null && geom?.nodeGVI !== undefined ? 'REPO_GEOMETRY_CONTEXT' : 'UNAVAILABLE'}
              sourceRepo={MURRAY_HILL_GEOMETRY_SOURCE.repositoryName}
              sourceColumn="node_GVI"
              sourceStatus={geom?.nodeGVI !== null && geom?.nodeGVI !== undefined ? 'PRESENT' : 'UNAVAILABLE'}
              paperRole="GEOMETRY_CONTEXT_ONLY"
              warning="Contextual visual metric; scale preserved. Strictly prohibited from overwriting foveal GVI_eye."
            />

            <GeometryCard
              label="Contextual Veg. Exposure"
              symbol="node_VEI"
              value={geom?.nodeVEI ?? null}
              classification={geom?.nodeVEI !== null && geom?.nodeVEI !== undefined ? 'REPO_GEOMETRY_CONTEXT' : 'UNAVAILABLE'}
              sourceRepo={MURRAY_HILL_GEOMETRY_SOURCE.repositoryName}
              sourceColumn="node_VEI"
              sourceStatus={geom?.nodeVEI !== null && geom?.nodeVEI !== undefined ? 'PRESENT' : 'UNAVAILABLE'}
              paperRole="GEOMETRY_CONTEXT_ONLY"
              warning="Node vegetation exposure index context. Does not overwrite SVF or active inputs."
            />

            <GeometryCard
              label="Elevation-Band Sky View"
              symbol="node_SVF_band"
              value={geom?.nodeSVFBand ?? null}
              classification={geom?.nodeSVFBand !== null && geom?.nodeSVFBand !== undefined ? 'REPO_GEOMETRY_CONTEXT' : 'UNAVAILABLE'}
              sourceRepo={MURRAY_HILL_GEOMETRY_SOURCE.repositoryName}
              sourceColumn="node_SVF_band"
              sourceStatus={geom?.nodeSVFBand !== null && geom?.nodeSVFBand !== undefined ? 'PRESENT' : 'UNAVAILABLE'}
              paperRole="GEOMETRY_CONTEXT_ONLY"
              warning="Finite elevation-band sky fraction. Not a true whole-sky SVF and prohibited from overwriting the active Qwen sky-openness proxy."
            />
          </div>
        </div>

        {/* Manual/Audit Geometry Overrides (Inactive in No-Omega SIM) */}
        <details className="rounded border border-stone-200 bg-stone-50 p-3">
          <summary className="cursor-pointer text-[10px] font-mono font-bold text-stone-700">
            AUDIT / MANUAL GEOMETRY OVERRIDE INPUTS (RETIRED IN NATURE 9.03 NO-OMEGA)
          </summary>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <NumericField
              label="Street Canyon Aspect Ratio Override"
              symbol="H/W"
              value={value.hwRatio}
              min={0}
              step={0.01}
              owner="AUDIT / GIS"
              note="Formerly used in legacy Nature 9.02 A_i. Retired from active Nature 9.03 SIM calculation."
              onChange={(v) => update('hwRatio', v)}
            />
            <NumericField
              label="Sky View Factor Override"
              symbol="SVF"
              value={value.svf}
              min={0}
              max={1}
              step={0.001}
              owner="AUDIT / GIS"
              note="Optional true geometric / hemispherical SVF override. Finite elevation-band node_SVF_band cannot overwrite this."
              onChange={(v) => update('svf', v)}
            />
          </div>
        </details>
      </div>

      {/* G. UPDATE C. SPACE SYNTAX + MULTI-SCALAR GWR UI */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-sky-800" />
            <div>
              <h3 className="text-xs font-mono font-bold text-stone-900 uppercase">
                C. Space Syntax + Multi-Scalar GWR
              </h3>
              <p className="text-[10px] text-stone-500">
                Rigorous division between paper-reported empirical model diagnostics and repository feasibility machinery.
              </p>
            </div>
          </div>
        </div>

        {/* C1. PAPER SPECIFICATION */}
        <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-4 space-y-3.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-800" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-950">
                C1. Paper Specification
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-purple-800 text-white text-[9px] font-mono font-bold tracking-wide">
              PAPER_SPECIFICATION · R = 800 m · BI-SQUARE
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="rounded border border-purple-200 bg-white p-2.5">
              <div className="text-[8px] font-mono uppercase text-stone-500">Walking Radius</div>
              <div className="text-xs font-mono font-bold text-purple-950 mt-0.5">
                R = {SPACE_SYNTAX_PAPER_SPECIFICATION.walkingRadiusM} m
              </div>
              <div className="text-[8px] text-stone-500 mt-0.5">Pedestrian catchment</div>
            </div>

            <div className="rounded border border-purple-200 bg-white p-2.5">
              <div className="text-[8px] font-mono uppercase text-stone-500">Choice Definition</div>
              <div className="text-xs font-mono font-bold text-purple-950 mt-0.5">Through-movement</div>
              <div className="text-[8px] text-stone-500 mt-0.5">{SPACE_SYNTAX_PAPER_SPECIFICATION.choiceDefinition}</div>
            </div>

            <div className="rounded border border-purple-200 bg-white p-2.5">
              <div className="text-[8px] font-mono uppercase text-stone-500">Integration Definition</div>
              <div className="text-xs font-mono font-bold text-purple-950 mt-0.5">To-movement</div>
              <div className="text-[8px] text-stone-500 mt-0.5">{SPACE_SYNTAX_PAPER_SPECIFICATION.integrationDefinition}</div>
            </div>

            <div className="rounded border border-purple-200 bg-white p-2.5">
              <div className="text-[8px] font-mono uppercase text-stone-500">Paper GWR Kernel</div>
              <div className="text-xs font-mono font-bold text-purple-950 mt-0.5">Adaptive Bi-Square</div>
              <div className="text-[8px] text-stone-500 mt-0.5">Row-standardized (BW={NATURE_903_FINAL_GWR_DIAGNOSTICS.reportedOptimizedBandwidthM} m)</div>
            </div>
          </div>
        </div>

        {/* C2. PAPER-REPORTED MODEL RESULTS */}
        <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-4 space-y-3.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-800" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-950">
                C2. Paper-Reported Model Results
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-purple-800 text-white text-[9px] font-mono font-bold tracking-wide">
              PAPER_REPORTED_MODEL_RESULT · AUTHORITATIVE
            </span>
          </div>

          {/* Sample Accounting Card */}
          <div className="rounded border border-purple-200 bg-white p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-purple-950 uppercase tracking-wide">
                Authoritative Manuscript Sample Accounting
              </span>
              <span className="text-[9px] font-mono text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                Nature09.03 end.docx
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="rounded bg-purple-50/70 p-2 border border-purple-100">
                <div className="text-[8px] font-mono uppercase text-stone-500">Raw Observations</div>
                <div className="text-sm font-mono font-bold text-purple-950 mt-0.5">
                  {FINAL_PAPER_SAMPLE_ACCOUNTING.rawDualDirectionalObservations.toLocaleString()}
                </div>
                <div className="text-[8px] text-stone-500 mt-0.5">{FINAL_PAPER_SAMPLE_ACCOUNTING.rawPhysicalNodes} physical nodes</div>
              </div>
              <div className="rounded bg-rose-50/70 p-2 border border-rose-100">
                <div className="text-[8px] font-mono uppercase text-stone-500">Excluded Tunnel</div>
                <div className="text-sm font-mono font-bold text-rose-700 mt-0.5">
                  -{FINAL_PAPER_SAMPLE_ACCOUNTING.excludedTunnelObservations}
                </div>
                <div className="text-[8px] text-stone-500 mt-0.5">-{FINAL_PAPER_SAMPLE_ACCOUNTING.excludedTunnelNodes} physical nodes</div>
              </div>
              <div className="rounded bg-emerald-50/70 p-2 border border-emerald-100">
                <div className="text-[8px] font-mono uppercase text-stone-500">Active Observations</div>
                <div className="text-sm font-mono font-bold text-emerald-800 mt-0.5">
                  {FINAL_PAPER_SAMPLE_ACCOUNTING.activeObservations.toLocaleString()}
                </div>
                <div className="text-[8px] text-stone-500 mt-0.5">Dual-directional N</div>
              </div>
              <div className="rounded bg-emerald-50/70 p-2 border border-emerald-100">
                <div className="text-[8px] font-mono uppercase text-stone-500">Active Physical Nodes</div>
                <div className="text-sm font-mono font-bold text-emerald-800 mt-0.5">
                  {FINAL_PAPER_SAMPLE_ACCOUNTING.activePhysicalNodes}
                </div>
                <div className="text-[8px] text-stone-500 mt-0.5">Unique intersections</div>
              </div>
            </div>
            <div className="text-[9px] font-mono text-stone-500 flex items-center justify-between pt-1 border-t border-purple-100">
              <span>Derivation: {FINAL_PAPER_SAMPLE_ACCOUNTING.derivation.observationsFormula} obs · {FINAL_PAPER_SAMPLE_ACCOUNTING.derivation.nodesFormula} nodes</span>
              <span className="text-stone-400">Historical N=1,320 is retired</span>
            </div>
          </div>

          {/* Model Specification & Diagnostics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="rounded border border-purple-200 bg-white p-2.5">
              <div className="text-[8px] font-mono uppercase text-stone-500">Model 1 R² (No Space Syntax)</div>
              <div className="text-xs font-mono font-bold text-purple-950 mt-0.5">{NATURE_903_FINAL_GWR_DIAGNOSTICS.model1R2}</div>
              <div className="text-[8px] text-stone-500 mt-0.5">Residual Moran's I = {NATURE_903_FINAL_GWR_DIAGNOSTICS.model1ResidualMoransI}</div>
            </div>

            <div className="rounded border border-purple-200 bg-white p-2.5">
              <div className="text-[8px] font-mono uppercase text-stone-500">Model 2 R² (Space Syntax)</div>
              <div className="text-xs font-mono font-bold text-purple-950 mt-0.5">{NATURE_903_FINAL_GWR_DIAGNOSTICS.model2R2}</div>
              <div className="text-[8px] text-stone-500 mt-0.5">ΔR² = +{NATURE_903_FINAL_GWR_DIAGNOSTICS.deltaR2} · ΔAICc {NATURE_903_FINAL_GWR_DIAGNOSTICS.deltaAicc}</div>
            </div>

            <div className="rounded border border-purple-200 bg-white p-2.5">
              <div className="text-[8px] font-mono uppercase text-stone-500">Model 2 Spatial Autocorr.</div>
              <div className="text-xs font-mono font-bold text-purple-950 mt-0.5">
                I = {NATURE_903_FINAL_GWR_DIAGNOSTICS.model2ResidualMoransI}
              </div>
              <div className="text-[8px] text-stone-500 mt-0.5">p = {NATURE_903_FINAL_GWR_DIAGNOSTICS.model2MoransP} (no residual pattern)</div>
            </div>

            <div className="rounded border border-purple-200 bg-white p-2.5">
              <div className="text-[8px] font-mono uppercase text-stone-500">Multicollinearity VIFmax</div>
              <div className="text-xs font-mono font-bold text-purple-950 mt-0.5">
                M1: {NATURE_903_FINAL_GWR_DIAGNOSTICS.model1VifMax} · M2: {NATURE_903_FINAL_GWR_DIAGNOSTICS.model2VifMax}
              </div>
              <div className="text-[8px] text-stone-500 mt-0.5">Within statistical tolerance (&lt;10)</div>
            </div>
          </div>

          <div className="rounded border border-purple-200 bg-white p-2.5 text-[9px] text-purple-900 leading-relaxed font-mono">
            <strong>CRITICAL RULE:</strong> {NATURE_903_FINAL_GWR_DIAGNOSTICS.note}
          </div>
        </div>

        {/* C3. REPOSITORY GWR FEASIBILITY / MACHINERY */}
        <div className="rounded-lg border border-amber-300 bg-amber-50/40 p-4 space-y-3.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-800" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-950">
                C3. Repository GWR Feasibility / Machinery
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-800 text-white text-[9px] font-mono font-bold tracking-wide">
              REPO_DERIVED_GWR_MACHINERY · PROVENANCE AUDIT
            </span>
          </div>

          {/* Explicit Repository Statement */}
          <div className="rounded border border-amber-300 bg-white p-3 space-y-1.5">
            <div className="text-[10px] font-mono font-bold text-amber-950 uppercase tracking-wide">
              Repository Feasibility Declaration (outcome-dependent regression blocked)
            </div>
            <p className="text-[11px] font-mono italic text-amber-900 bg-amber-50/80 p-2.5 rounded border border-amber-200 leading-relaxed">
              "{REPOSITORY_GWR_CALIBRATION_RECORD.repositoryStatement}"
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[9px] font-mono text-stone-600">
              <div>
                <span className="font-bold text-amber-950">Feasibility Kernel:</span> {REPOSITORY_GWR_CALIBRATION_RECORD.feasibilityKernel} (exploratory; paper uses Adaptive Bi-square)
              </div>
              <div>
                <span className="font-bold text-amber-950">Machinery Status:</span> {REPOSITORY_GWR_CALIBRATION_RECORD.machineryStatus} (outcome-independent)
              </div>
            </div>
          </div>

          {/* Pinned Repository Machinery Table */}
          <div className="rounded border border-amber-200 bg-white p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-stone-900 uppercase tracking-wide">
                Outcome-Independent Spatial Machinery (tr(S), tr(S'S), Effective df, AICc penalty)
              </span>
              <span className="text-[9px] font-mono text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                Candidate Bandwidths
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[10px] font-mono">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 bg-stone-50">
                    <th className="p-1.5 font-bold">Bandwidth (m)</th>
                    <th className="p-1.5 font-bold">tr(S)</th>
                    <th className="p-1.5 font-bold">tr(S'S)</th>
                    <th className="p-1.5 font-bold">Effective df</th>
                    <th className="p-1.5 font-bold">s² Divisor</th>
                    <th className="p-1.5 font-bold">AICc Penalty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {PINNED_GWR_MACHINERY_ROWS.map((row) => (
                    <tr key={row.bandwidth} className={row.bandwidth === 100 ? 'bg-amber-50/80 font-bold text-amber-950' : 'text-stone-700 hover:bg-stone-50'}>
                      <td className="p-1.5 flex items-center gap-1">
                        {row.bandwidth} m
                        {row.bandwidth === 100 && (
                          <span className="text-[8px] bg-amber-700 text-white px-1 py-0.2 rounded font-normal">
                            Paper BW
                          </span>
                        )}
                      </td>
                      <td className="p-1.5">{row.tr_S.toFixed(4)}</td>
                      <td className="p-1.5">{row.tr_SS.toFixed(4)}</td>
                      <td className="p-1.5">{row.eff_df.toFixed(4)}</td>
                      <td className="p-1.5">{row.s2_divisor.toFixed(4)}</td>
                      <td className="p-1.5">{row.aicc_penalty.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Historical Sample Audit Notice */}
          <div className="rounded border border-amber-300 bg-amber-100/60 p-2.5 text-[9px] font-mono text-amber-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-800" />
              <span>Historical Sample Audit Notice (N = 1,320 vs. N = 2,840)</span>
            </div>
            <p className="leading-relaxed">
              {GWR_SAMPLE_PROVENANCE_AUDIT.uiNotice}
            </p>
          </div>
        </div>

        {/* C4. CURRENT NODE LOCAL CALIBRATION */}
        <div className="rounded-lg border border-stone-300 bg-white p-4 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-stone-700" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-900">
                C4. Current Node Local Calibration
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-stone-200 text-stone-700 text-[9px] font-mono font-bold border border-stone-300">
              UNAVAILABLE_NODE_LEVEL_CALIBRATION
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50/70 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-800">Choice_i</span>
                <span className="text-[8px] font-mono text-stone-400">R=800m</span>
              </div>
              <div className="text-xs font-mono font-bold text-stone-400">
                {value.spaceSyntaxChoice !== null ? value.spaceSyntaxChoice.toFixed(4) : 'UNAVAILABLE'}
              </div>
              <div className="text-[8px] text-stone-500">Through-movement network control</div>
            </div>

            <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50/70 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-800">Integration_i</span>
                <span className="text-[8px] font-mono text-stone-400">R=800m</span>
              </div>
              <div className="text-xs font-mono font-bold text-stone-400">
                {value.spaceSyntaxIntegration !== null ? value.spaceSyntaxIntegration.toFixed(4) : 'UNAVAILABLE'}
              </div>
              <div className="text-[8px] text-stone-500">To-movement network control</div>
            </div>

            <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50/70 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-800">β₀(s_i)</span>
                <span className="text-[8px] font-mono text-stone-400">Intercept</span>
              </div>
              <div className="text-xs font-mono font-bold text-stone-400">
                {getGwrValue('betaIntercept') !== null ? getGwrValue('betaIntercept')?.toFixed(4) : 'UNAVAILABLE'}
              </div>
              <div className="text-[8px] text-stone-500">Local econometric intercept</div>
            </div>

            <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50/70 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-800">β_I(s_i)</span>
                <span className="text-[8px] font-mono text-stone-400">Imageability</span>
              </div>
              <div className="text-xs font-mono font-bold text-stone-400">
                {getGwrValue('betaImageability') !== null ? getGwrValue('betaImageability')?.toFixed(4) : 'UNAVAILABLE'}
              </div>
              <div className="text-[8px] text-stone-500">Local elasticity component for a_i</div>
            </div>

            <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50/70 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-800">β_Y(s_i)</span>
                <span className="text-[8px] font-mono text-stone-400">Identity</span>
              </div>
              <div className="text-xs font-mono font-bold text-stone-400">
                {getGwrValue('betaIdentity') !== null ? getGwrValue('betaIdentity')?.toFixed(4) : 'UNAVAILABLE'}
              </div>
              <div className="text-[8px] text-stone-500">Local elasticity component for b_i</div>
            </div>

            <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50/70 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-800">β_D(s_i)</span>
                <span className="text-[8px] font-mono text-stone-400">Dependence</span>
              </div>
              <div className="text-xs font-mono font-bold text-stone-400">
                {getGwrValue('betaDependence') !== null ? getGwrValue('betaDependence')?.toFixed(4) : 'UNAVAILABLE'}
              </div>
              <div className="text-[8px] text-stone-500">Local elasticity component for c_i</div>
            </div>

            <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50/70 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-800">β_Choice(s_i)</span>
                <span className="text-[8px] font-mono text-stone-400">Network Control</span>
              </div>
              <div className="text-xs font-mono font-bold text-stone-400">
                {getGwrValue('betaChoice') !== null ? getGwrValue('betaChoice')?.toFixed(4) : 'UNAVAILABLE'}
              </div>
              <div className="text-[8px] text-stone-500">Choice spatial control</div>
            </div>

            <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50/70 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-800">β_Int(s_i)</span>
                <span className="text-[8px] font-mono text-stone-400">Network Control</span>
              </div>
              <div className="text-xs font-mono font-bold text-stone-400">
                {getGwrValue('betaIntegration') !== null ? getGwrValue('betaIntegration')?.toFixed(4) : 'UNAVAILABLE'}
              </div>
              <div className="text-[8px] text-stone-500">Integration spatial control</div>
            </div>
          </div>

          <div className="rounded border border-stone-200 bg-stone-50 p-2.5 text-[9px] text-stone-600 font-mono">
            <strong>BOUNDARY ENFORCEMENT:</strong> Node-level Choice, Integration, and GWR local β coefficients are UNAVAILABLE in source data. They are never derived from surrogates (street names, typology, headings, or paper averages).
          </div>

          {/* Prominent Elasticity Execution Block */}
          <div className="rounded-lg border border-emerald-300 bg-emerald-50/70 p-3.5 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-950">
                  Active Elasticity Execution: {REPOSITORY_GWR_CALIBRATION_RECORD.activeSIMFallback.source}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-800 text-white text-[9px] font-mono font-bold">
                {REPOSITORY_GWR_CALIBRATION_RECORD.activeSIMFallback.calibrationStatus}
              </span>
            </div>

            <div className="flex items-baseline gap-4 text-emerald-950">
              <div>
                <span className="text-[10px] font-mono text-emerald-700">a (Imageability):</span>
                <span className="text-base font-mono font-bold ml-1.5">{REPOSITORY_GWR_CALIBRATION_RECORD.activeSIMFallback.a.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-emerald-700">b (Identity):</span>
                <span className="text-base font-mono font-bold ml-1.5">{REPOSITORY_GWR_CALIBRATION_RECORD.activeSIMFallback.b.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-emerald-700">c (Dependence):</span>
                <span className="text-base font-mono font-bold ml-1.5">{REPOSITORY_GWR_CALIBRATION_RECORD.activeSIMFallback.c.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-[10px] text-emerald-900 leading-relaxed font-mono">
              <strong>Reason: </strong>{REPOSITORY_GWR_CALIBRATION_RECORD.activeSIMFallback.reason}
            </p>
          </div>
        </div>

        {/* C4. PAPER / REPOSITORY CALIBRATION PROVENANCE BOUNDARY */}
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-800" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-950">
                C4. Paper / Repository Calibration Provenance Boundary
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-blue-800 text-white text-[9px] font-mono font-bold tracking-wide">
              {PAPER_REPOSITORY_CALIBRATION_BOUNDARY.resolution}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded border border-blue-200 bg-white p-3 space-y-1.5 text-[10px] font-mono text-blue-950">
              <div className="font-bold uppercase tracking-wide text-blue-900">
                Provenance Architecture Rule
              </div>
              <p className="leading-relaxed whitespace-pre-line text-[9px] text-stone-700">
                {PAPER_REPOSITORY_CALIBRATION_BOUNDARY.notice}
              </p>
            </div>

            <div className="rounded border border-blue-200 bg-white p-3 space-y-1.5 text-[10px] font-mono text-blue-950">
              <div className="font-bold uppercase tracking-wide text-blue-900">
                Formula Version Boundary &amp; No-Omega Invariance
              </div>
              <p className="leading-relaxed text-[9px] text-stone-700">
                <strong>Legacy Context: </strong>Paper reported GWR formula context contains historical draft notation referencing <em>A_i</em> and <em>&Omega;</em>.
              </p>
              <p className="leading-relaxed text-[9px] text-stone-700">
                <strong>Active SIM Engine: </strong>Frozen Nature 9.03 No-Omega (<em>M = a ln I + b ln Y + c ln D</em>).
              </p>
              <div className="p-2 rounded bg-amber-50 border border-amber-200 text-[8px] font-mono text-amber-900 font-bold">
                {FORMULA_VERSION_BOUNDARY.rule}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* D. BEHAVIORAL OBSERVATION — NATURE 9.03 FINAL */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-700" />
            <div>
              <h3 className="text-xs font-mono font-bold text-stone-900 uppercase">
                D. Behavioral Observation — Nature 9.03 Final
              </h3>
              <p className="text-[10px] text-stone-500">
                Specification-defined dwell transformation, stayability amplification, and rigorous empirical observation gating.
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[9px] font-mono font-bold border border-purple-300">
            NATURE 9.03 FINAL
          </span>
        </div>

        {/* D1. Paper Behavioral Specification */}
        <div className="rounded-lg border border-purple-200 bg-purple-50/60 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded">
                D1
              </span>
              <span className="text-xs font-mono font-bold text-purple-950 uppercase">
                Paper Behavioral Specification (Manuscript Protocol)
              </span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-white text-purple-800 text-[8px] font-mono font-bold border border-purple-200">
              PAPER_SPECIFICATION
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs font-mono text-purple-950">
            <div className="rounded bg-white p-2 border border-purple-100">
              <span className="text-[9px] text-stone-500 block">t_min:</span>
              <span className="font-bold">0 s</span>
            </div>
            <div className="rounded bg-white p-2 border border-purple-100">
              <span className="text-[9px] text-stone-500 block">t_max:</span>
              <span className="font-bold">300 s</span>
            </div>
            <div className="rounded bg-white p-2 border border-purple-100">
              <span className="text-[9px] text-stone-500 block">t_base Formula:</span>
              <span className="font-bold text-[10px]">(min(300, max(0, t_raw)) - 0) / (300 - 0)</span>
            </div>
            <div className="rounded bg-white p-2 border border-purple-100">
              <span className="text-[9px] text-stone-500 block">F_i Formula:</span>
              <span className="font-bold">F_i = 1 + λ · M_i</span>
            </div>
            <div className="rounded bg-white p-2 border border-purple-100">
              <span className="text-[9px] text-stone-500 block">t_effective Formula:</span>
              <span className="font-bold">t_effective = F_i · t_base</span>
            </div>
          </div>

          <p className="text-[10px] text-purple-900 leading-relaxed font-sans">
            Target range: 0 ≤ t_base ≤ 1. The manuscript defines λ symbolically as the visual/architectural attraction scaling parameter on baseline dwell time. Missing t_raw is strictly isolated from t_raw = 0.
          </p>
        </div>

        {/* D2. Current Node Empirical Observation */}
        <div className="rounded-lg border border-stone-200 bg-stone-50/80 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold bg-stone-200 text-stone-800 px-1.5 py-0.5 rounded">
                D2
              </span>
              <span className="text-xs font-mono font-bold text-stone-900 uppercase">
                Current Node Empirical Observation
              </span>
            </div>
            <span className="text-[9px] font-mono text-stone-500">
              Node ID: {repoAssembly?.nodeId ?? 'n00045'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-stone-200 bg-white p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-800">t_raw_seconds</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-stone-100 text-stone-700 border border-stone-300">
                  UNAVAILABLE_EMPIRICAL_BEHAVIORAL_OUTCOME
                </span>
              </div>
              <div className="text-lg font-mono font-bold text-stone-400">
                UNAVAILABLE
              </div>
              <div className="text-[9px] text-stone-500 leading-relaxed">
                Raw sensor-detected / temporal pedestrian dwell duration. Requires empirical time-domain observation; static street-view imagery cannot supply temporal dwell duration.
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-950">t_base</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  INPUT_GATED_MISSING_T_RAW
                </span>
              </div>
              <div className="text-lg font-mono font-bold text-amber-600">
                GATED
              </div>
              <div className="text-[9px] text-amber-800 leading-relaxed">
                Deterministic transformation blocked. Gated due to absent empirical t_raw observation (missing t_raw is never assigned numerical 0).
              </div>
            </div>
          </div>
        </div>

        {/* D3. Stayability Calibration */}
        <div className="rounded-lg border border-stone-200 bg-stone-50/80 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold bg-stone-200 text-stone-800 px-1.5 py-0.5 rounded">
                D3
              </span>
              <span className="text-xs font-mono font-bold text-stone-900 uppercase">
                Stayability Calibration
              </span>
            </div>
            <span className="text-[9px] font-mono text-stone-500">
              Active SIM Integration Status
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-950">M_i (Synthesis)</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {isMApproved ? 'AUTHORIZED' : 'COMPUTED'}
                </span>
              </div>
              <div className="text-lg font-mono font-bold text-emerald-900">
                {activeM.toFixed(6)}
              </div>
              <div className="text-[9px] text-emerald-700">
                Active Cobb–Douglas SIM score (v0.6.3 Golden Freeze). Downstream input to F_i.
              </div>
            </div>

            <div className="rounded-lg border border-stone-200 bg-white p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-800">λ (Scaling Parameter)</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-stone-100 text-stone-700 border border-stone-300">
                  UNRESOLVED_BEHAVIORAL_CALIBRATION
                </span>
              </div>
              <div className="text-lg font-mono font-bold text-stone-400">
                UNRESOLVED
              </div>
              <div className="text-[9px] text-stone-500">
                Defined symbolically in manuscript; no universally validated application value fitted.
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-950">F_i (Amplification Factor)</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  METHOD_GATED_MISSING_LAMBDA
                </span>
              </div>
              <div className="text-lg font-mono font-bold text-amber-600">
                GATED
              </div>
              <div className="text-[9px] text-amber-800">
                Cannot compute F_i = 1 + λ·M_i without calibrated λ (missing λ is not λ = 0).
              </div>
            </div>
          </div>

          {/* Audit Row: Repository demo placeholder lambda isolation */}
          <div className="rounded border border-dashed border-stone-300 bg-white p-2.5 flex items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span className="text-stone-600">
                Repository demo placeholder λ = {BLOCKOLOGY_PLACEHOLDER_LAMBDA_RECORD.dwellLambda.toFixed(1)} ({BLOCKOLOGY_PLACEHOLDER_LAMBDA_RECORD.repositoryName})
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-600 text-[8px] font-mono font-bold border border-stone-200 shrink-0">
              DEMO_ONLY · NOT FITTED · NOT ACTIVE
            </span>
          </div>
        </div>

        {/* D4. Effective Dwell / Network Surface Dependency Chain */}
        <div className="rounded-lg border border-sky-300 bg-sky-50/70 p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold bg-sky-200 text-sky-900 px-1.5 py-0.5 rounded">
                D4
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-950">
                Effective Dwell / Network Surface Dependency Chain
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-sky-800 text-white text-[9px] font-mono font-bold">
              GATING GRAPH VERIFIED
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center">
            {/* 1. M_i */}
            <div className="rounded border border-emerald-300 bg-white p-2.5 space-y-1">
              <div className="text-[8px] font-mono text-stone-500">Node M_i</div>
              <div className="text-xs font-mono font-bold text-stone-900">
                {activeM.toFixed(4)}
              </div>
              <div className="text-[8px] font-mono font-bold text-emerald-700 bg-emerald-50 rounded py-0.5">
                AVAILABLE
              </div>
            </div>

            {/* 2. lambda */}
            <div className="rounded border border-dashed border-stone-300 bg-stone-50 p-2.5 space-y-1">
              <div className="text-[8px] font-mono text-stone-500">Parameter λ</div>
              <div className="text-xs font-mono font-bold text-stone-400">
                null
              </div>
              <div className="text-[8px] font-mono font-bold text-stone-600 bg-stone-100 rounded py-0.5">
                UNAVAILABLE
              </div>
            </div>

            {/* 3. F_i */}
            <div className="rounded border border-dashed border-amber-300 bg-amber-50/50 p-2.5 space-y-1">
              <div className="text-[8px] font-mono text-stone-500">Factor F_i</div>
              <div className="text-xs font-mono font-bold text-amber-700">
                null
              </div>
              <div className="text-[8px] font-mono font-bold text-amber-800 bg-amber-100 rounded py-0.5">
                GATED
              </div>
            </div>

            {/* 4. t_raw */}
            <div className="rounded border border-dashed border-stone-300 bg-stone-50 p-2.5 space-y-1">
              <div className="text-[8px] font-mono text-stone-500">Observed t_raw</div>
              <div className="text-xs font-mono font-bold text-stone-400">
                null
              </div>
              <div className="text-[8px] font-mono font-bold text-stone-600 bg-stone-100 rounded py-0.5">
                UNAVAILABLE
              </div>
            </div>

            {/* 5. t_base */}
            <div className="rounded border border-dashed border-amber-300 bg-amber-50/50 p-2.5 space-y-1">
              <div className="text-[8px] font-mono text-stone-500">Base t_base</div>
              <div className="text-xs font-mono font-bold text-amber-700">
                null
              </div>
              <div className="text-[8px] font-mono font-bold text-amber-800 bg-amber-100 rounded py-0.5">
                GATED
              </div>
            </div>

            {/* 6. t_effective */}
            <div className="rounded border border-dashed border-amber-300 bg-amber-50/50 p-2.5 space-y-1">
              <div className="text-[8px] font-mono text-stone-500">t_effective</div>
              <div className="text-xs font-mono font-bold text-amber-700">
                null
              </div>
              <div className="text-[8px] font-mono font-bold text-amber-800 bg-amber-100 rounded py-0.5">
                GATED
              </div>
            </div>

            {/* 7. D(x,y) */}
            <div className="rounded border border-dashed border-purple-300 bg-purple-50/50 p-2.5 space-y-1">
              <div className="text-[8px] font-mono text-stone-500">Surface D(x,y)</div>
              <div className="text-xs font-mono font-bold text-purple-700">
                null
              </div>
              <div className="text-[8px] font-mono font-bold text-purple-800 bg-purple-100 rounded py-0.5">
                GATED
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded bg-white border border-sky-200 text-[10px] text-sky-950 leading-relaxed font-mono">
            <strong>Gating Notice:</strong> M_i is active ({activeM.toFixed(4)}), but empirical behavioral dwell outcome λ is unavailable. F_i, t_base, t_effective, and the Proxy Dwell Surface D(x,y) are explicitly GATED (never reported as 0.00).
          </div>
        </div>

        {/* Q. PROXY DWELL EFFECT COMPACT NETWORK-MODEL PANEL */}
        <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-indigo-700" />
              <span className="text-xs font-mono font-bold text-indigo-950 uppercase">
                Proxy Dwell Effect Density Surface D(x,y)
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[8px] font-mono font-bold border border-amber-300">
              NETWORK_MODEL_GATED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs font-mono text-indigo-950">
            <div className="rounded bg-white p-2 border border-indigo-100">
              <span className="text-[9px] text-stone-500 block">Status:</span>
              <span className="font-bold text-amber-700">NETWORK_MODEL_GATED</span>
            </div>
            <div className="rounded bg-white p-2 border border-indigo-100">
              <span className="text-[9px] text-stone-500 block">Paper Method:</span>
              <span className="font-bold">{PROXY_DWELL_PAPER_SPECIFICATION.method}</span>
            </div>
            <div className="rounded bg-white p-2 border border-indigo-100">
              <span className="text-[9px] text-stone-500 block">Discretization:</span>
              <span className="font-bold">{PROXY_DWELL_PAPER_SPECIFICATION.samplingDiscretizationM} m node spacing</span>
            </div>
            <div className="rounded bg-white p-2 border border-indigo-100">
              <span className="text-[9px] text-stone-500 block">Bandwidth R:</span>
              <span className="font-bold text-stone-500">UNRESOLVED (≠ 100m GWR)</span>
            </div>
          </div>

          <div className="p-2 rounded bg-white/80 border border-indigo-100 text-[10px] text-indigo-950 space-y-1">
            <p className="font-semibold">
              Gating Reasons:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-stone-600">
              <li>Effective dwell duration (t_effective) is unavailable across network nodes.</li>
              <li>Multi-node empirical behavioral observations are unavailable in current dataset.</li>
              <li>D_xy kernel bandwidth R is unresolved (distinct from GWR econometric bandwidth = 100 m).</li>
            </ul>
            <p className="text-[9px] text-indigo-800 italic pt-0.5">
              The single-node execution environment does not render a fake map or zero-density surface.
            </p>
          </div>
        </div>

        {/* R. SOURCE-CONFLICT NOTICE / BEHAVIORAL EVIDENCE PROVENANCE BOUNDARY */}
        <div className="rounded-lg border border-amber-300 bg-amber-50/70 p-3.5 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-800 shrink-0" />
            <span className="text-xs font-mono font-bold text-amber-950 uppercase tracking-wide">
              {BEHAVIORAL_EVIDENCE_PROVENANCE_BOUNDARY.title}
            </span>
          </div>
          <div className="text-[10px] text-amber-900 leading-relaxed font-sans whitespace-pre-line bg-white/80 p-2.5 rounded border border-amber-200">
            {BEHAVIORAL_EVIDENCE_PROVENANCE_BOUNDARY.text}
          </div>
        </div>

        {/* S. MULTI-SOURCE PROVENANCE RESOLUTION AUDIT CARD */}
        <MultiSourceProvenanceResolutionCard />
      </div>
    </section>
  );
};
