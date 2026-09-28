/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ============================================================================
 * PAPER-ALIGNED PROTOCOL DOCUMENTATION
 * Street Interface Measurement — Nature 9.02 Aligned v0.4
 * ============================================================================
 *
 * This modal documents the ACTIVE application method.
 *
 * Legacy v3.2 / v3.3 VLM material is retained only as a diagnostic baseline
 * and must not be confused with the active Paper-Aligned computational chain.
 */

import React from 'react';

import {
  X,
  Layers,
  Eye,
  Sparkles,
  MapPin,
  Calculator,
  Network,
  Activity,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Database,
  FileCode2,
  Info,
} from 'lucide-react';

interface ProtocolDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProtocolDocumentationModal: React.FC<
  ProtocolDocumentationModalProps
> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-stone-300 rounded-lg shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* ===================================================================
            HEADER
            =================================================================== */}

        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Layers className="w-5 h-5 text-stone-800 shrink-0" />

            <div className="min-w-0">
              <h3 className="text-sm font-bold font-mono text-stone-900">
                STREET INTERFACE MEASUREMENT — PAPER-ALIGNED SPECIFICATION
              </h3>

              <p className="text-xs text-stone-500 font-mono mt-0.5">
                APP: Nature 9.02 Aligned v0.4 · Vision Bridge v1.2 · Frozen 30-Class Taxonomy
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition-colors shrink-0"
            aria-label="Close protocol documentation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ===================================================================
            BODY
            =================================================================== */}

        <div className="p-6 overflow-y-auto space-y-6 text-xs text-stone-700 leading-relaxed">
          {/* -----------------------------------------------------------------
              ACTIVE METHOD
              ----------------------------------------------------------------- */}

          <div className="border border-stone-900 bg-stone-900 text-stone-100 p-4 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />

              <h4 className="font-bold font-mono text-emerald-400 text-xs uppercase">
                Active Computational Architecture
              </h4>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
              <span className="px-2 py-1 bg-stone-800 border border-stone-700 rounded">
                Vision / Qwen / GIS / Behavior
              </span>

              <span>→</span>

              <span className="px-2 py-1 bg-stone-800 border border-stone-700 rounded">
                Paper Variables
              </span>

              <span>→</span>

              <span className="px-2 py-1 bg-indigo-950 border border-indigo-800 rounded">
                I_i · Y_i · D_i
              </span>

              <span>→</span>

              <span className="px-2 py-1 bg-sky-950 border border-sky-800 rounded">
                Space Syntax GWR β
              </span>

              <span>→</span>

              <span className="px-2 py-1 bg-sky-950 border border-sky-800 rounded">
                a_i · b_i · c_i
              </span>

              <span>→</span>

              <span className="px-2 py-1 bg-emerald-950 border border-emerald-800 rounded font-bold">
                M_i
              </span>

              <span>→</span>

              <span className="px-2 py-1 bg-purple-950 border border-purple-800 rounded">
                t_raw → t_base · F_i · t_effective
              </span>

              <span>→</span>

              <span className="px-2 py-1 bg-stone-800 border border-stone-700 rounded">
                D(x,y)
              </span>
            </div>

            <p className="text-[11px] text-stone-300">
              The active application no longer treats a VLM as the calculator
              of final research scores. Numerical paper indices are produced
              by deterministic code only when their required inputs are
              available and methodologically approved.
            </p>
          </div>

          {/* -----------------------------------------------------------------
              EVIDENCE OWNERSHIP
              ----------------------------------------------------------------- */}

          <div className="space-y-3">
            <h4 className="font-bold font-mono text-stone-900 text-xs uppercase flex items-center gap-2">
              <Database className="w-4 h-4" />
              1. Measurement Ownership
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="border border-emerald-200 bg-emerald-50/40 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-emerald-700" />

                  <strong className="font-mono text-emerald-950">
                    Vision / Exact-RGB
                  </strong>
                </div>

                <p className="text-[11px] text-emerald-900">
                  Owns deterministic semantic pixel counts, class fractions,
                  mapped/unmapped accounting, and candidate pixel-derived
                  variables from the frozen taxonomy.
                </p>
              </div>

              <div className="border border-indigo-200 bg-indigo-50/40 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-700" />

                  <strong className="font-mono text-indigo-950">
                    VLM Contextual Reasoning
                  </strong>
                </div>

                <p className="text-[11px] text-indigo-900">
                  The active paper-variable bridge uses approved Team Qwen 7-rung probability outputs for V_nat, V_built, GVI_eye, GMI, V_sign, V_pave, SFV, IAS and GFAPI. Source, horizon and orientation gates remain explicit. Legacy Teacher Gemma v3.0 remains an experimental comparator and does not own canonical paper variables.
                </p>
              </div>

              <div className="border border-sky-200 bg-sky-50/40 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-sky-700" />

                  <strong className="font-mono text-sky-950">
                    GIS / Physical Geometry
                  </strong>
                </div>

                <p className="text-[11px] text-sky-900">
                  Owns exact street-canyon H/W, true SVF, georeferenced node
                  coordinates and spatial-network geometry.
                </p>
              </div>

              <div className="border border-purple-200 bg-purple-50/40 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-purple-700" />

                  <strong className="font-mono text-purple-950">
                    Behavioral Observation
                  </strong>
                </div>

                <p className="text-[11px] text-purple-900">
                  Owns observed / sensor-derived t_raw stay duration in seconds. The app then deterministically clips t_raw to [0,300] and derives t_base = clipped(t_raw)/300. Static street-view imagery does not directly measure dwell duration.
                </p>
              </div>
            </div>
          </div>

          {/* -----------------------------------------------------------------
              VISION EVIDENCE RULE
              ----------------------------------------------------------------- */}

          <div className="border border-stone-200 p-4 rounded-lg space-y-2">
            <h4 className="font-bold font-mono text-stone-900 text-xs uppercase flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-stone-700" />
              2. Vision Evidence Rule
            </h4>

            <ul className="list-disc pl-5 space-y-1.5 text-[11px]">
              <li>
                Quantitative Vision measurements are derived from the semantic
                classification raster using exact RGB taxonomy matching.
              </li>

              <li>
                Missing taxonomy capability is represented as a gate, not as a
                measured zero.
              </li>

              <li>
                Whole-frame vegetation percentage is not automatically
                GVI_eye.
              </li>

              <li>
                Perspective sky fraction is not true SVF.
              </li>

              <li>
                Ground-floor glazing presence is not automatically active
                frontage or GFAPI.
              </li>

              <li>
                Stoops, ledges, furniture and planters are physical affordance
                evidence; their presence alone is not IAS.
              </li>
            </ul>
          </div>

          {/* -----------------------------------------------------------------
              PAPER VARIABLES
              ----------------------------------------------------------------- */}

          <div className="space-y-3">
            <h4 className="font-bold font-mono text-stone-900 text-xs uppercase flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              3. Active Paper Variables & Formulas
            </h4>

            <div className="space-y-3">
              <div className="border border-stone-200 rounded-lg p-4">
                <strong className="font-mono text-stone-900">
                  Place Imageability — I_i
                </strong>

                <code className="block bg-stone-900 text-stone-100 rounded p-2.5 mt-2 text-[10px]">
                  I_raw = α1(V_nat/V_built) + α2·GVI_eye + α3·GMI
                </code>

                <code className="block bg-stone-900 text-stone-100 rounded p-2.5 mt-1.5 text-[10px]">
                  I_i = 1 + 6/[1 + exp(-κ_I(I_raw - τ_I))]
                </code>

                <p className="text-[11px] text-stone-500 mt-2">
                  Nature 9.02 CWMC reference: τ_I = 0.20, κ_I = 12 with α1=α2=α3=1.0. GMI is supplied by the approved Qwen green_softening instrument under the active provenance gates.
                </p>
              </div>

              <div className="border border-stone-200 rounded-lg p-4">
                <strong className="font-mono text-stone-900">
                  Place Identity — Y_i (Nature 9.03 Final)
                </strong>

                <code className="block bg-stone-900 text-stone-100 rounded p-2.5 mt-2 text-[10px]">
                  Y_i = 1 + 6·[β1·V_sign + β2·(1-SVF) + β3·GFAPI] / (β1+β2+β3)
                </code>

                <p className="text-[11px] text-stone-500 mt-2">
                  Nature 9.03 Final incorporates GFAPI into Place Identity alongside V_sign and (1-SVF).
                  SFV is retained as supplementary validation provenance and does not enter active Y_i or SIM.
                </p>
              </div>

              <div className="border border-stone-200 rounded-lg p-4">
                <strong className="font-mono text-stone-900">
                  Place Dependence — D_i (Nature 9.03 Final)
                </strong>

                <code className="block bg-stone-900 text-stone-100 rounded p-2.5 mt-2 text-[10px]">
                  D_raw = γ1·V_pave + γ2·IAS,   D_norm = D_raw / (γ1+γ2)
                </code>

                <code className="block bg-stone-900 text-stone-100 rounded p-2.5 mt-1.5 text-[10px]">
                  D_i = 1 + 6/[1 + exp(-κ_D·(D_norm - τ_D))]
                </code>

                <p className="text-[11px] text-stone-500 mt-2">
                  Nature 9.03 CWMC reference: τ_D = 0.50, κ_D = 15 with γ1=γ2=1.0. GFAPI is transitioned to Identity, and D_raw is normalized by (γ1+γ2)=2.0.
                </p>
              </div>

              <div className="border border-stone-200 rounded-lg p-4 bg-stone-50/60">
                <strong className="font-mono text-stone-600">
                  Environmental TFP Canyon Factor — A_i (RETIRED FROM ACTIVE SIM)
                </strong>

                <code className="block bg-stone-700 text-stone-200 rounded p-2.5 mt-2 text-[10px]">
                  A_i = exp[-ψ·max(0, H/W − Ω_th)]   [RETIRED FROM ACTIVE CALCULATION]
                </code>

                <p className="text-[11px] text-stone-500 mt-2">
                  Nature 9.03 Final removes the canyon term A_i from active SIM calculation. Retained for historical comparative context only.
                </p>
              </div>
            </div>
          </div>

          {/* -----------------------------------------------------------------
              GWR + SIM
              ----------------------------------------------------------------- */}

          <div className="border border-sky-200 bg-sky-50/40 p-4 rounded-lg space-y-3">
            <h4 className="font-bold font-mono text-sky-950 text-xs uppercase flex items-center gap-2">
              <Network className="w-4 h-4 text-sky-700" />
              4. Space Syntax-Controlled GWR, Local Elasticities & SIM
            </h4>

            <code className="block bg-stone-900 text-white rounded p-2.5 text-[10px] font-mono">
              ln(M_obs/A_i) = β0 + β_I ln(I) + β_Y ln(Y) + β_D ln(D) + β_Choice ln(Choice) + β_Int ln(Integration) + ε
            </code>

            <code className="block bg-white border border-sky-200 rounded p-2.5 text-[10px] font-mono text-sky-950">
              a_i = |β_I(s_i)| / (|β_I| + |β_Y| + |β_D|)
            </code>

            <code className="block bg-white border border-sky-200 rounded p-2.5 text-[10px] font-mono text-sky-950">
              b_i = |β_Y(s_i)| / (|β_I| + |β_Y| + |β_D|)
            </code>

            <code className="block bg-white border border-sky-200 rounded p-2.5 text-[10px] font-mono text-sky-950">
              c_i = |β_D(s_i)| / (|β_I| + |β_Y| + |β_D|)
            </code>

            <code className="block bg-stone-900 text-white rounded p-3 text-[11px] font-mono font-bold">
              M_i = I_i^a_i × Y_i^b_i × D_i^c_i
            </code>

            <p className="text-[11px] text-sky-900">
              GWR is a network-level calibration step. Nature 9.02 uses Segment Choice (Betweenness) and Integration (Closeness) controls at walking radius R=800 m, with network distance, adaptive bi-square kernel, Golden Section Search / AICc bandwidth optimization and FDR-controlled local inference. The single-node APP accepts imported results but does not estimate GWR from one image.
            </p>
          </div>

          {/* -----------------------------------------------------------------
              BEHAVIOR
              ----------------------------------------------------------------- */}

          <div className="border border-purple-200 bg-purple-50/40 p-4 rounded-lg space-y-2">
            <h4 className="font-bold font-mono text-purple-950 text-xs uppercase flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-700" />
              5. Stayability & Proxy Dwell Effect
            </h4>

            <code className="block bg-white border border-purple-200 rounded p-2.5 text-[10px] font-mono">
              t_base = [min(300,max(0,t_raw)) - 0] / 300
            </code>

            <code className="block bg-white border border-purple-200 rounded p-2.5 text-[10px] font-mono">
              F_i = 1 + λM_i
            </code>

            <code className="block bg-white border border-purple-200 rounded p-2.5 text-[10px] font-mono">
              t_effective = F_i × t_base
            </code>

            <p className="text-[11px] text-purple-900">
              λ remains calibration-dependent. D(x,y) is a downstream
              network-level spatial surface and is not a valid single-image
              output.
            </p>
          </div>

          <div className="border border-teal-200 bg-teal-50/40 p-4 rounded-lg space-y-2">
            <h4 className="font-bold font-mono text-teal-950 text-xs uppercase flex items-center gap-2">
              <Eye className="w-4 h-4 text-teal-700" />
              Nature 9.03 Final Analytical Sampling & Dataset Scale
            </h4>
            <p className="text-[11px] text-teal-900">
              Canonical source processing uses a 360° cylindrical panorama represented as 360 undistorted 1° azimuth columns, aggregated into four street-relative 90° quadrants centered at 0° / 90° / 180° / 270°, with h_eye=1.5 m, pitch=0° and 20 m node spacing. Nature09.03 end reports 712 raw physical nodes / 2,848 analytical observations; after excluding 2 tunnel nodes / 8 tunnel observations, the final active paper sample is 710 nodes / 2,840 observations.
            </p>
            <p className="text-[11px] text-teal-900">
              The pinned Murray Hill team source uses two opposing along-street 180° directional renders per street direction. That source protocol is verified, but it does not by itself establish equivalence to the paper's orthogonal 90° analytical quadrants.
            </p>
          </div>

          {/* -----------------------------------------------------------------
              CURRENT METHOD GATES
              ----------------------------------------------------------------- */}

          <div className="border border-amber-200 bg-amber-50/40 p-4 rounded-lg space-y-2">
            <h4 className="font-bold font-mono text-amber-950 text-xs uppercase flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              6. Explicit Method Gates
            </h4>

            <ul className="list-disc pl-5 space-y-1.5 text-[11px] text-amber-950">
              <li>
                The frozen 30-class exact-RGB mask remains deterministic Vision
                evidence. Its pixel fractions are not automatically identical
                to the canonical Qwen paper variables used by the Nature 9.02-aligned bridge.
              </li>

              <li>
                The approved Team Qwen 7-rung bridge supplies V_nat, V_built, GVI_eye, GMI, V_sign, V_pave, SFV, GFAPI and IAS as normalized visual-semantic paper inputs, subject to source, horizon and Nature 9.02 orientation gates. Teacher Gemma v3.0 remains comparison-only.
              </li>

              <li>
                SFV is supplied by the active Qwen facade_variation instrument. The legacy Teacher Gemma v3.0 strict JSON still lacks a dedicated SFV field, which is one reason that legacy path remains comparison-only.
              </li>

              <li>
                Exact H/W remains a GIS / physical-geometry input. A VLM
                perceived enclosure estimate must not be substituted for an
                exact numerical H/W ratio.
              </li>

              <li>
                The Appendix canyon-enclosure / horizon-band measure must not
                be silently equated with a published whole-sky SVF without a
                validated conversion and explicit provenance.
              </li>

              <li>
                Choice_i and Integration_i require segment-based Space Syntax
                network analysis at walking radius R = 800 m. They cannot be
                derived from a single uploaded street-view image.
              </li>

              <li>
                GWR calibration requires the georeferenced multi-node dataset.
                The APP may consume imported β0, βI, βY, βD, βChoice and βInt,
                but it does not estimate them from one image.
              </li>

              <li>
                λ remains behaviorally calibration-dependent. Nature 9.02 requires observed t_raw from a validated temporal observation / tracking source; the app then derives t_base deterministically. A manual t_base is retained only for migration/audit when t_raw is unavailable.
              </li>

              <li>
                D(x,y) remains a downstream multi-node network surface and is
                not a valid single-image output.
              </li>
            </ul>
          </div>

          {/* -----------------------------------------------------------------
              VERSION CONTROL
              ----------------------------------------------------------------- */}

          <div className="border border-rose-200 bg-rose-50/40 p-4 rounded-lg space-y-2">
            <h4 className="font-bold font-mono text-rose-950 text-xs uppercase flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-700" />
              7. Manuscript Version-Control Safeguards
            </h4>

            <p className="text-[11px] text-rose-900">
              The active APP follows the newer normalized Section 2.2
              formulation. Older manuscript passages contain legacy or
              duplicated formulations. They are not silently merged into the
              computational engine.
            </p>

            <ul className="list-disc pl-5 space-y-1 text-[11px] text-rose-900">
              <li>
                Canonical VLM component variables are normalized in [0,1],
                while the synthesized perceptual dimensions I_i, Y_i and D_i
                are mapped to the paper's 1–7 scale. These two scale levels
                must not be conflated.
              </li>

              <li>
                H/W is separated from the perceptual sub-indices and enters
                the active SIM through Environmental TFP A_i.
              </li>

              <li>
                The active Nature 9.02 GWR specification includes Space Syntax
                Choice and Integration controls. These controls remain outside
                the Cobb–Douglas SIM and outside the a_i/b_i/c_i normalization
                denominator.
              </li>
            </ul>
          </div>

          {/* -----------------------------------------------------------------
              LEGACY STATUS
              ----------------------------------------------------------------- */}

          <div className="border border-stone-200 p-4 rounded-lg space-y-2">
            <h4 className="font-bold font-mono text-stone-900 text-xs uppercase flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-stone-700" />
              8. Legacy v3.2 / v3.3 Diagnostic Isolation
            </h4>

            <p className="text-[11px]">
              The application may retain legacy v3.2 scoring and v3.3 VLM
              candidate tools under Method &amp; Diagnostics for regression
              comparison. Those outputs are not the active Paper-Aligned
              numerical research pipeline.
            </p>
          </div>

          {/* -----------------------------------------------------------------
              VALIDATION BOUNDARY
              ----------------------------------------------------------------- */}

          <div className="border border-indigo-200 bg-indigo-50/40 p-4 rounded-lg flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />

            <p className="text-[11px] text-indigo-900">
              A Vision validation PASS confirms deterministic raster
              accounting and provenance only. It does not certify the
              readiness or validity of all Paper variables, GWR, SIM, or
              downstream behavioral modeling.
            </p>
          </div>
        </div>

        {/* ===================================================================
            FOOTER
            =================================================================== */}

        <div className="p-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between gap-3">
          <span className="text-[10px] font-mono text-stone-400">
            Active specification: Nature 9.02 Aligned v0.4
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-mono text-xs font-semibold rounded transition-colors"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
