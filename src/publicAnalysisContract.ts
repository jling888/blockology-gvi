export const PUBLIC_APP_VERSION = 'v0.8.0-P4.1';
export const PUBLIC_APP_LABEL = 'Public Streetscape Analysis';
export const SCIENTIFIC_CORE_VERSION = 'v0.6.3_GOLDEN_FREEZE';
export const SCIENTIFIC_ENGINE_SHA256 =
  '645ee93d6efe63e66e76ba1b4a4fb24bc7048d7b19c25ba49181cb4e2c280902';

export const PUBLIC_SCIENTIFIC_INVARIANTS = {
  activeFormula: 'M_i = I_i^a_i × Y_i^b_i × D_i^c_i',
  noActiveOmega: true,
  noActiveEnvironmentalAi: true,
  fallbackElasticities: { a: 0.4, b: 0.2, c: 0.4 },
  elasticitySource: 'PAPER_GLOBAL_REFERENCE',
  calibrationStatus: 'REFERENCE_NOT_LOCAL_GWR',
  scientificCore: SCIENTIFIC_CORE_VERSION,
  engineSha256: SCIENTIFIC_ENGINE_SHA256,
} as const;

export type PublicPipelineStageState =
  | 'ready'
  | 'running'
  | 'complete'
  | 'next'
  | 'waiting'
  | 'blocked';

export interface PublicPipelineStage {
  id: 'photo' | 'vm' | 'vlm' | 'sim';
  title: string;
  shortDescription: string;
  state: PublicPipelineStageState;
}

export const PUBLIC_PIPELINE_P4: PublicPipelineStage[] = [
  {
    id: 'photo',
    title: 'Photo input',
    shortDescription: 'Single user-supplied streetscape photograph.',
    state: 'ready',
  },
  {
    id: 'vm',
    title: 'Vision segmentation',
    shortDescription: 'Source-backed CUDA VM service produces the 30-class scientific label map.',
    state: 'next',
  },
  {
    id: 'vlm',
    title: 'VLM perception',
    shortDescription: 'Reproducibility-locked Qwen2-VL rates 10 fields and preserves p1–p7 probabilities.',
    state: 'waiting',
  },
  {
    id: 'sim',
    title: 'Street Interface score',
    shortDescription: 'Frozen Nature 9.03 Final · No-Omega I/Y/D/M synthesis.',
    state: 'waiting',
  },
];

export interface PublicAnalysisResult {
  imageability: number;
  identity: number;
  dependence: number;
  score: number;
  a: number;
  b: number;
  c: number;
  scientificCore: typeof SCIENTIFIC_CORE_VERSION;
}
