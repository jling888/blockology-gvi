/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ============================================================================
 * PAPER-ALIGNED RESEARCH ARCHITECTURE PANEL
 * Street Interface Measurement — Nature 9.02 Aligned v0.4
 * ============================================================================
 *
 * ACTIVE COMPUTATIONAL ARCHITECTURE
 *
 * Evidence
 *   ↓
 * Paper Research Variables
 *   ↓
 * I_i / Y_i / D_i / A_i
 *   ↓
 * Network GWR
 *   ↓
 * a_i / b_i / c_i
 *   ↓
 * M_i
 *   ↓
 * F_i / t_effective
 *   ↓
 * D(x,y)
 *
 * IMPORTANT:
 * The four legacy v3.3 VLM domains remain useful only as contextual
 * evidence descriptors. They are NOT final peer research indices.
 */

import React from 'react';

import {
  Layers,
  Eye,
  Sparkles,
  MapPin,
  Database,
  Calculator,
  Network,
  Activity,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

export const ResearchArchitecturePanel: React.FC = () => {
  const evidenceLayers = [
    {
      owner: 'VISION',
      title: 'Deterministic Semantic Pixel Evidence',
      icon: Eye,
      status: 'ACTIVE',
      description:
        'Exact-RGB accounting of the frozen 30-class semantic mask. This layer owns class counts, fractions, mapped/unmapped coverage and reproducible raster evidence; it does not automatically define the teacher VLM paper scores.',
      outputs: [
        '30-class pixel counts / fractions',
        'Natural / built candidate evidence',
        'Sign / detail candidate evidence',
        'Sidewalk / vegetation evidence',
      ],
    },
    {
      owner: 'TEAM QWEN 7-RUNG',
      title: 'Visual-Semantic Paper Inputs',
      icon: Sparkles,
      status: 'ACTIVE BRIDGE · SOURCE/ORIENTATION GATED',
      description:
        'The active paper-variable bridge uses approved Team Qwen 7-rung probability outputs. Nature 9.02 canonical sampling uses four street-relative 90° quadrants at 0°/90°/180°/270°, h_eye=1.5 m and pitch=0°. Existing team L/R half-views remain working legacy orientation evidence until reconciled.',
      outputs: [
        'V_nat · V_built · GVI_eye · GMI',
        'V_sign · V_pave',
        'GFAPI · IAS',
        'sky_openness proxy with explicit SVF provenance',
        'SFV via facade_variation',
      ],
    },
    {
      owner: 'GIS / GEOMETRY',
      title: 'Physical Geometry',
      icon: MapPin,
      status: 'EXTERNAL INPUT',
      description:
        'Georeferenced physical measurements that must not be numerically invented from a single perspective image.',
      outputs: [
        'Exact H/W',
        'Node coordinates',
        'Street segment / bearing',
        'Validated whole-sky SVF when used',
      ],
    },
    {
      owner: 'SPACE SYNTAX',
      title: 'Network Topological Controls',
      icon: Network,
      status: 'EXTERNAL NETWORK INPUT',
      description:
        'Segment-based network analysis at walking radius R=800 m controls structural movement potential before local perceptual coefficients are interpreted.',
      outputs: [
        'Choice_i / Segment Betweenness',
        'Integration_i / Segment Closeness',
      ],
    },
    {
      owner: 'BEHAVIOR',
      title: 'Observed Stay Duration & Baseline Normalization',
      icon: Activity,
      status: 'EXTERNAL INPUT',
      description:
        'A temporal pedestrian-observation / tracking / sensor layer supplies t_raw in seconds. The app deterministically clips t_raw to [0,300] and derives t_base=t_raw_clipped/300. A static street-view frame does not measure dwell duration.',
      outputs: [
        't_raw (seconds)',
        'derived t_base [0,1]',
      ],
    },
  ];

  const paperVariables = [
    {
      dimension: 'PLACE IMAGEABILITY',
      notation: 'I_i',
      inputs: [
        'V_nat / V_built',
        'GVI_eye',
        'GMI',
      ],
      formula:
        'I_raw = α1(V_nat / V_built) + α2GVI_eye + α3GMI',
      note:
        'I_raw is sigmoidally transformed and mapped to the paper working 1–7 scale.',
    },
    {
      dimension: 'PLACE IDENTITY',
      notation: 'Y_i',
      inputs: [
        'V_sign',
        '1 − SVF',
        'GFAPI',
      ],
      formula:
        'Y_i = 1 + 6 × [β1·V_sign + β2·(1−SVF) + β3·GFAPI] / (β1+β2+β3)',
      note:
        'Nature 9.03 Final integrates GFAPI into Identity. SFV is retained for supplementary validation provenance only.',
    },
    {
      dimension: 'PLACE DEPENDENCE',
      notation: 'D_i',
      inputs: [
        'V_pave',
        'IAS',
      ],
      formula:
        'D_raw = γ1·V_pave + γ2·IAS, D_norm = D_raw / (γ1+γ2)',
      note:
        'GFAPI moved to Identity; D_raw is normalized by (γ1+γ2) then sigmoidally mapped to 1–7.',
    },
    {
      dimension: 'ENVIRONMENTAL TFP (RETIRED FROM ACTIVE SIM)',
      notation: 'A_i (Legacy)',
      inputs: [
        'Exact H/W (Comparative)',
        'Ω_th',
        'ψ',
      ],
      formula:
        'A_i = exp[-ψ·max(0, H/W − Ω_th)] (RETIRED)',
      note:
        'RETIRED FROM ACTIVE CALCULATION · NATURE 9.02 COMPARATIVE CONTEXT ONLY. Does not enter active M_i.',
    },
  ];

  const downstream = [
    {
      step: 'NETWORK CALIBRATION',
      notation: 'β0 · β_I · β_Y · β_D · β_Choice · β_Int',
      title: 'Geographically Weighted Regression',
      icon: Network,
      status: 'NETWORK / FALLBACK READY',
      description:
        'Nature 9.03 Space Syntax-controlled GWR uses Choice (Betweenness) and Integration (Closeness) at R=800 m. Only β_I, β_Y, β_D are normalized into a_i, b_i, c_i. Global fallback reference profile (0.333, 0.333, 0.334) available if local GWR is absent.',
    },
    {
      step: 'LOCAL ELASTICITIES',
      notation: 'a_i, b_i, c_i',
      title: 'Normalized Local Weights',
      icon: Calculator,
      status: 'DERIVABLE FROM GWR',
      description:
        'Absolute local GWR coefficients are normalized so that a_i + b_i + c_i = 1.',
    },
    {
      step: 'SIM SYNTHESIS',
      notation: 'M_i',
      title: 'Street Interface Matrix',
      icon: Calculator,
      status: 'FORMULA DEFINED',
      description:
        'M_i = I_i^a_i × Y_i^b_i × D_i^c_i',
    },
    {
      step: 'STAYABILITY',
      notation: 'F_i',
      title: 'Stayability Amplification Factor',
      icon: Activity,
      status: 'INPUT GATED',
      description:
        'F_i = 1 + λM_i, followed by t_effective = F_i × t_base; t_base is deterministically normalized from observed t_raw when available.',
    },
    {
      step: 'SPATIAL MODEL',
      notation: 'D(x,y)',
      title: 'Proxy Dwell Effect Density',
      icon: MapPin,
      status: 'NETWORK OUTPUT',
      description:
        'Network-level spatial density surface generated from georeferenced nodes and effective stayability values.',
    },
  ];

  return (
    <section className="bg-white border border-stone-200 rounded-lg p-5 shadow-xs space-y-6">
      {/* =====================================================================
          HEADER
          ===================================================================== */}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 bg-stone-900 text-white font-mono text-[10px] font-bold rounded">
              NATURE 9.03 FINAL · NO-OMEGA v0.5.2 — SOURCE LOCKED
            </span>

            <h2 className="text-sm font-bold font-mono text-stone-900 uppercase tracking-tight">
              Street Interface Computational Research Architecture
            </h2>
          </div>

          <p className="text-xs text-stone-500 mt-1 max-w-4xl">
            Active architecture aligned to the Nature 9.03 Final (No-Omega) paper formulation:
            deterministic Vision evidence + approved Qwen paper variables + GIS geometry +
            Space Syntax controls → I/Y/D → local GWR elasticities →
            Street Interface Matrix (M_i = I^a · Y^b · D^c) → F_i stayability → network spatial model.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded font-bold">
            VISION ACTIVE
          </span>

          <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded font-bold">
            VLM EVIDENCE LAYER
          </span>

          <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded font-bold">
            SIM INPUT-GATED
          </span>
        </div>
      </div>

      {/* =====================================================================
          A. EVIDENCE OWNERSHIP
          ===================================================================== */}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-bold font-mono text-stone-900 uppercase flex items-center gap-1.5">
            <Database className="w-4 h-4 text-stone-700" />
            <span>A. Evidence & Measurement Ownership</span>
          </h3>

          <span className="text-[10px] font-mono text-stone-400">
            Different variables belong to different analytical owners
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {evidenceLayers.map((layer) => {
            const Icon = layer.icon;

            return (
              <div
                key={layer.owner}
                className="bg-stone-50 border border-stone-200 rounded-lg p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-4 h-4 text-stone-600" />
                    <span className="font-mono text-[10px] font-bold text-stone-500">
                      {layer.owner}
                    </span>
                  </div>

                  <span className="px-1.5 py-0.5 bg-white border border-stone-200 rounded text-[9px] font-mono font-bold text-stone-600">
                    {layer.status}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-stone-900">
                  {layer.title}
                </h4>

                <p className="text-[11px] text-stone-600 leading-relaxed">
                  {layer.description}
                </p>

                <div className="pt-2 border-t border-stone-200">
                  <span className="text-[9px] uppercase font-mono font-bold text-stone-400 block mb-1">
                    Outputs / Responsibilities
                  </span>

                  <div className="space-y-1">
                    {layer.outputs.map((output) => (
                      <div
                        key={output}
                        className="flex items-start gap-1 text-[10px] text-stone-700"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{output}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          FLOW ARROW
          ===================================================================== */}

      <div className="flex items-center justify-center gap-2 text-stone-400 font-mono text-[10px]">
        <span>Evidence</span>
        <ArrowRight className="w-4 h-4" />
        <span>Canonical Paper Variables</span>
        <ArrowRight className="w-4 h-4" />
        <span>Deterministic Research Synthesis</span>
      </div>

      {/* =====================================================================
          B. PAPER DIMENSIONS
          ===================================================================== */}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-bold font-mono text-stone-900 uppercase flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-stone-700" />
            <span>B. Paper-Defined Research Dimensions</span>
          </h3>

          <span className="text-[10px] font-mono text-stone-400">
            Newer Section 2.2 working formulation
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {paperVariables.map((item) => (
            <div
              key={item.notation}
              className="bg-white border border-stone-200 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[9px] font-mono font-bold text-stone-400 uppercase">
                    {item.dimension}
                  </span>

                  <div className="text-sm font-mono font-bold text-stone-900 mt-0.5">
                    {item.notation}
                  </div>
                </div>

                <span className="px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded text-[9px] font-mono font-bold">
                  DETERMINISTIC
                </span>
              </div>

              <div>
                <span className="text-[9px] font-mono uppercase font-bold text-stone-400 block mb-1">
                  Required Inputs
                </span>

                <div className="flex flex-wrap gap-1">
                  {item.inputs.map((input) => (
                    <span
                      key={input}
                      className="px-2 py-1 bg-stone-50 border border-stone-200 rounded text-[10px] font-mono text-stone-700"
                    >
                      {input}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-stone-900 text-stone-100 rounded p-2.5">
                <span className="text-[9px] font-mono uppercase text-stone-400 block mb-1">
                  Working Formula
                </span>

                <code className="text-[11px] font-mono leading-relaxed">
                  {item.formula}
                </code>
              </div>

              <p className="text-[11px] text-stone-600 leading-relaxed">
                {item.note}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* =====================================================================
          C. VLM ROLE
          ===================================================================== */}

      <div className="bg-indigo-50/60 border border-indigo-200 rounded-lg p-4">
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />

          <div className="space-y-2">
            <div>
              <h3 className="text-xs font-mono font-bold text-indigo-950 uppercase">
                C. VLM Role in the Paper-Aligned Architecture
              </h3>

              <p className="text-[11px] text-indigo-900 mt-1 leading-relaxed">
                The active Nature 9.02 bridge uses the Team Qwen 7-rung instrument as the working visual-semantic measurement source for specific normalized [0,1] paper inputs, subject to source/horizon/orientation gates. Legacy Teacher Gemma v3.0 is preserved as an experimental comparator only. Final I/Y/D/A_i/M_i/F_i synthesis remains deterministic code.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white border border-indigo-200 rounded p-3">
                <span className="text-[10px] font-mono font-bold text-emerald-800 block mb-1">
                  VLM MAY REASON ABOUT
                </span>

                <ul className="text-[11px] text-stone-700 space-y-1">
                  <li>• V_nat and V_built visual-semantic scores</li>
                  <li>• foveal GVI_eye and Green Mitigation Interaction</li>
                  <li>• V_sign cognitive-legibility landmarks</li>
                  <li>• V_pave obstacle-adjusted walkability</li>
                  <li>• GFAPI active frontage permeability</li>
                  <li>• IAS seating / resting affordance under strict checks</li>
                </ul>
              </div>

              <div className="bg-white border border-indigo-200 rounded p-3">
                <span className="text-[10px] font-mono font-bold text-rose-800 block mb-1">
                  VLM MUST NOT INVENT
                </span>

                <ul className="text-[11px] text-stone-700 space-y-1">
                  <li>• exact H/W</li>
                  <li>• true SVF</li>
                  <li>• final I_i / Y_i / D_i</li>
                  <li>• GWR coefficients or a_i / b_i / c_i</li>
                  <li>• final M_i or D(x,y)</li>
                  <li>• λ or observed t_raw duration</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          D. GWR + SIM + BEHAVIOR
          ===================================================================== */}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-bold font-mono text-stone-900 uppercase flex items-center gap-1.5">
            <Network className="w-4 h-4 text-stone-700" />
            <span>D. Network Calibration, SIM & Stayability</span>
          </h3>

          <span className="text-[10px] font-mono text-stone-400">
            Single node → network model
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          {downstream.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.notation}
                className="bg-stone-50 border border-stone-200 rounded-lg p-3.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <Icon className="w-4 h-4 text-stone-600" />

                    <span className="text-[8px] px-1.5 py-0.5 bg-white border border-stone-200 rounded font-mono font-bold text-stone-500">
                      {item.status}
                    </span>
                  </div>

                  <span className="text-[9px] font-mono uppercase text-stone-400 font-bold">
                    {item.step}
                  </span>

                  <div className="text-xs font-mono font-bold text-stone-900 mt-0.5">
                    {item.notation}
                  </div>

                  <h4 className="text-xs font-semibold text-stone-800 mt-1">
                    {item.title}
                  </h4>

                  <p className="text-[10px] text-stone-600 leading-relaxed mt-2">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          E. FULL CHAIN
          ===================================================================== */}

      <div className="bg-stone-900 text-white rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="w-4 h-4 text-stone-300" />

          <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
            Active Computational Chain
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
          <span className="px-2 py-1 bg-stone-800 rounded border border-stone-700">
            Vision / VLM / GIS
          </span>

          <ArrowRight className="w-3.5 h-3.5 text-stone-500" />

          <span className="px-2 py-1 bg-stone-800 rounded border border-stone-700">
            V_nat · V_built · GVI_eye · GMI
          </span>

          <span className="px-2 py-1 bg-stone-800 rounded border border-stone-700">
            V_sign · (1-SVF) · GFAPI
          </span>

          <span className="px-2 py-1 bg-stone-800 rounded border border-stone-700">
            V_pave · IAS
          </span>

          <span className="px-2 py-1 bg-stone-800 rounded border border-stone-700 text-stone-400">
            SFV (Supplementary) · H/W (Geometry)
          </span>

          <ArrowRight className="w-3.5 h-3.5 text-stone-500" />

          <span className="px-2 py-1 bg-indigo-950 rounded border border-indigo-800">
            I_i · Y_i · D_i (M_i)
          </span>

          <ArrowRight className="w-3.5 h-3.5 text-stone-500" />

          <span className="px-2 py-1 bg-sky-950 rounded border border-sky-800">
            GWR
          </span>

          <ArrowRight className="w-3.5 h-3.5 text-stone-500" />

          <span className="px-2 py-1 bg-sky-950 rounded border border-sky-800">
            a_i · b_i · c_i
          </span>

          <ArrowRight className="w-3.5 h-3.5 text-stone-500" />

          <span className="px-2 py-1 bg-emerald-950 rounded border border-emerald-800 font-bold">
            M_i
          </span>

          <ArrowRight className="w-3.5 h-3.5 text-stone-500" />

          <span className="px-2 py-1 bg-purple-950 rounded border border-purple-800">
            F_i · t_effective
          </span>

          <ArrowRight className="w-3.5 h-3.5 text-stone-500" />

          <span className="px-2 py-1 bg-stone-800 rounded border border-stone-700">
            D(x,y)
          </span>
        </div>
      </div>

      {/* =====================================================================
          MANUSCRIPT CONFLICT NOTICE
          ===================================================================== */}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />

        <div className="space-y-1">
          <span className="font-mono font-bold text-[10px] uppercase text-amber-950">
            Manuscript Version Control Notice
          </span>

          <p className="text-[11px] text-amber-900 leading-relaxed">
            This panel follows the newer Section 2.2 normalized formulation:
            H/W is separated from Place Identity and handled through Environmental TFP A_i.
            Older descriptive tables elsewhere in the manuscript still contain
            legacy variable assignments. Those conflicts are documented rather
            than silently merged into the active application model.
          </p>
        </div>
      </div>

      {/* =====================================================================
          SINGLE-NODE BOUNDARY
          ===================================================================== */}

      <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 flex items-start gap-2">
        <Info className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />

        <p className="text-[11px] text-stone-600 leading-relaxed">
          The current case interface is a single-node measurement environment.
          GWR calibration, local spatial elasticities and D(x,y) require a
          georeferenced multi-node dataset and therefore belong to the future
          Network Calibration Mode.
        </p>
      </div>
    </section>
  );
};
