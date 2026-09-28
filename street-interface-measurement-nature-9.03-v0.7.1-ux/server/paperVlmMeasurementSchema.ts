/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Teacher 8/31 Appendix — VLM Visual Grounding Protocol v3.0
 * Strict structured output schema for the paper-aligned quantitative VLM pass.
 */

import { Type } from '@google/genai';

export const PAPER_VLM_V30_SCHEMA_ID = 'paper_vlm_v3.0_8.31';

const score = { type: Type.NUMBER };
const reasoning = { type: Type.STRING };

export const PAPER_VLM_V30_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    node_metadata: {
      type: Type.OBJECT,
      properties: {
        image_quadrant: {
          type: Type.STRING,
          enum: ['North', 'East', 'South', 'West'],
        },
        horizon_alignment_verified: {
          type: Type.BOOLEAN,
        },
      },
      required: ['image_quadrant', 'horizon_alignment_verified'],
    },

    natural_environs_imageability: {
      type: Type.OBJECT,
      properties: {
        v_nat_reasoning: reasoning,
        v_nat_score: score,
        gvi_eye_reasoning: reasoning,
        gvi_eye_score: score,
        gmi_reasoning: reasoning,
        gmi_score: score,
      },
      required: [
        'v_nat_reasoning',
        'v_nat_score',
        'gvi_eye_reasoning',
        'gvi_eye_score',
        'gmi_reasoning',
        'gmi_score',
      ],
    },

    morphological_containment_identity: {
      type: Type.OBJECT,
      properties: {
        v_built_reasoning: reasoning,
        v_built_score: score,
        canyon_enclosure_ratio: score,
        v_sign_reasoning: reasoning,
        v_sign_score: score,
      },
      required: [
        'v_built_reasoning',
        'v_built_score',
        'canyon_enclosure_ratio',
        'v_sign_reasoning',
        'v_sign_score',
      ],
    },

    physical_utility_dependence: {
      type: Type.OBJECT,
      properties: {
        v_pave_reasoning: reasoning,
        v_pave_score: score,
        gfapi_reasoning: reasoning,
        gfapi_score: score,
        ias_reasoning: reasoning,
        ias_score: score,
      },
      required: [
        'v_pave_reasoning',
        'v_pave_score',
        'gfapi_reasoning',
        'gfapi_score',
        'ias_reasoning',
        'ias_score',
      ],
    },

    analytical_summary: {
      type: Type.OBJECT,
      properties: {
        dominant_behavioral_driver: {
          type: Type.STRING,
          enum: ['Transit', 'Restoration', 'Pause'],
        },
        perceptual_coherence_index: score,
        vlm_confidence_score: score,
      },
      required: [
        'dominant_behavioral_driver',
        'perceptual_coherence_index',
        'vlm_confidence_score',
      ],
    },
  },
  required: [
    'node_metadata',
    'natural_environs_imageability',
    'morphological_containment_identity',
    'physical_utility_dependence',
    'analytical_summary',
  ],
};
