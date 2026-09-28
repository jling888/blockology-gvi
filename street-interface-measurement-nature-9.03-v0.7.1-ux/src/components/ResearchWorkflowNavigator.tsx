/**
 * Street Interface Measurement — Nature 9.02 Aligned v0.4
 * Five-stage research workflow navigator.
 *
 * Presentation only. No research state or computation is owned here.
 */

import React from 'react';
import {
  Eye,
  Sparkles,
  SlidersHorizontal,
  Sigma,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export type ResearchStageId =
  | 'stage-01-evidence'
  | 'stage-02-vlm'
  | 'stage-03-inputs'
  | 'stage-04-synthesis'
  | 'stage-05-validation';

interface StageDefinition {
  id: ResearchStageId;
  number: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  tone: string;
  iconTone: string;
}

export const RESEARCH_STAGES: StageDefinition[] = [
  {
    id: 'stage-01-evidence',
    number: '01',
    title: 'Case & Vision Evidence',
    shortTitle: 'Evidence',
    description:
      'Sampling node, source pair, frozen-taxonomy semantic measurement and physical evidence.',
    icon: Eye,
    tone:
      'border-stone-300 bg-stone-50',
    iconTone:
      'text-stone-700',
  },
  {
    id: 'stage-02-vlm',
    number: '02',
    title: 'VLM Measurement',
    shortTitle: 'VLM',
    description:
      'Qwen observations, paper-variable mapping, automatic repository authorization and optional Gemma comparison.',
    icon: Sparkles,
    tone:
      'border-violet-200 bg-violet-50',
    iconTone:
      'text-violet-700',
  },
  {
    id: 'stage-03-inputs',
    number: '03',
    title: 'Spatial & Behavioral Inputs',
    shortTitle: 'Inputs',
    description:
      'GIS geometry, true SVF override, Space Syntax, local GWR coefficients and behavior.',
    icon: SlidersHorizontal,
    tone:
      'border-sky-200 bg-sky-50',
    iconTone:
      'text-sky-700',
  },
  {
    id: 'stage-04-synthesis',
    number: '04',
    title: 'Paper Synthesis',
    shortTitle: 'Synthesis',
    description:
      'Variable readiness, I/Y/D assembly, local elasticities, M_i and stayability (F_i).',
    icon: Sigma,
    tone:
      'border-emerald-200 bg-emerald-50',
    iconTone:
      'text-emerald-700',
  },
  {
    id: 'stage-05-validation',
    number: '05',
    title: 'Validation & Export',
    shortTitle: 'Validation',
    description:
      'Orientation reconciliation, paired sensitivity, Vision QA, provenance and export.',
    icon: ShieldCheck,
    tone:
      'border-amber-200 bg-amber-50',
    iconTone:
      'text-amber-700',
  },
];

function scrollToStage(
  id: ResearchStageId
) {
  const target =
    document.getElementById(
      id
    );

  target?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

export const ResearchWorkflowNavigator: React.FC = () => {
  return (
    <section className="bg-white border border-stone-200 rounded-lg shadow-xs overflow-hidden">
      <div className="px-4 py-3 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-500">
            Active Research Architecture
          </div>

          <div className="text-sm font-mono font-bold text-stone-900 mt-0.5">
            Five-Stage Paper Workflow
          </div>
        </div>

        <div className="text-[9px] font-mono text-stone-500">
          v0.4 · Nature 9.02 · 4×90° Orthogonal Target · CWMC · Space Syntax GWR
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5">
        {RESEARCH_STAGES.map(
          (stage, index) => {
            const Icon =
              stage.icon;

            return (
              <React.Fragment
                key={stage.id}
              >
                <button
                  type="button"
                  onClick={() =>
                    scrollToStage(
                      stage.id
                    )
                  }
                  className={`group text-left p-3 border-b sm:border-b-0 sm:border-r last:border-r-0 border-stone-200 hover:bg-stone-50 transition-colors ${stage.tone}`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded border border-current/20 flex items-center justify-center ${stage.iconTone}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    <div>
                      <div className="text-[8px] font-mono font-bold text-stone-500">
                        STAGE {stage.number}
                      </div>

                      <div className="text-[10px] font-mono font-bold text-stone-900">
                        {stage.shortTitle}
                      </div>
                    </div>
                  </div>
                </button>

                {index <
                  RESEARCH_STAGES.length -
                    1 && (
                  <ArrowRight className="hidden" />
                )}
              </React.Fragment>
            );
          }
        )}
      </div>
    </section>
  );
};

interface ResearchStageHeaderProps {
  stageId: ResearchStageId;
}

export const ResearchStageHeader: React.FC<
  ResearchStageHeaderProps
> = ({
  stageId,
}) => {
  const stage =
    RESEARCH_STAGES.find(
      (item) =>
        item.id === stageId
    );

  if (!stage) {
    return null;
  }

  const Icon =
    stage.icon;

  return (
    <div
      id={stage.id}
      className={`scroll-mt-24 rounded-lg border px-4 py-3 ${stage.tone}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-md border border-current/20 flex items-center justify-center shrink-0 ${stage.iconTone}`}>
          <Icon className="w-4 h-4" />
        </div>

        <div>
          <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-500">
            Research Stage {stage.number}
          </div>

          <h2 className="text-sm font-mono font-bold text-stone-900 mt-0.5">
            {stage.title}
          </h2>

          <p className="text-[10px] text-stone-600 mt-1 leading-relaxed max-w-4xl">
            {stage.description}
          </p>
        </div>
      </div>
    </div>
  );
};
