/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ============================================================================
 * v3.3-RC1 CANDIDATE STRUCTURED OUTPUT SCHEMA (PARALLEL NON-ACTIVE)
 * ============================================================================
 *
 * EVIDENCE HIERARCHY DIRECTIVE:
 * PIXEL_CLASSIFICATION = Primary Analytical Evidence
 * ORIGINAL = Secondary Clarification Reference
 *
 * The future v3.3 model schema strictly maintains and does not weaken this
 * evidence hierarchy. Original-only semantic features must never become
 * classified v3.3 measurement fields.
 *
 * NOTE ON COMPUTATIONAL SCOPE & THREE PLACE DIMENSIONS:
 * 1. Place Imageability (Green / Habitat Dimension)
 *    - Future composite research dimension using variables: Natural Elements
 *      Above-Ground, Built Elements Above-Ground, Eye-Level GVI, GMI.
 * 2. Place Identity (Morphological Dimension)
 *    - Future composite research dimension using variables: Signboard +
 *      Architectural Detail Ratio, measured Street Canyon H/W, SVF.
 * 3. Place Dependence (Permeability Dimension)
 *    - Future composite research dimension using variables: Sidewalk + Paver
 *      Ratio, SFV, GFAPI.
 *
 * These dimensions, along with SIM_i and Proxy Dwell Effect D(x,y), are
 * downstream deterministic research syntheses computed from geometric and VLM
 * inputs. They are NOT free VLM score fields or direct model outputs.
 *
 * THIS SCHEMA IS A CANDIDATE DEFINITION AND IS NOT ACTIVE IN INFERENCE IN STEP 2.
 */

import { Type } from "@google/genai";

export const V33_MEASUREMENT_SCHEMA_ID = "v3.3-RC1-candidate";

export const V33_STREET_INTERFACE_MEASUREMENT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    schema_version: {
      type: Type.STRING,
    },
    image_id: {
      type: Type.STRING,
    },
    primary_evidence_summary: {
      type: Type.STRING,
    },
    measurement_domains: {
      type: Type.OBJECT,
      properties: {
        eye_level_greenness: {
          type: Type.OBJECT,
          properties: {
            greenery_types: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
                enum: [
                  "low_planter",
                  "hedge_or_shrub",
                  "low_tree",
                  "tree_canopy",
                  "vertical_green_wall",
                  "elevated_planter_vegetation",
                  "ground_vegetation",
                  "other",
                  "none",
                  "uncertain",
                ],
              },
            },
            greenery_vertical_position: {
              type: Type.STRING,
              enum: [
                "below_eye_level",
                "within_eye_level",
                "above_eye_level",
                "mixed",
                "uncertain",
              ],
            },
            greenery_continuity: {
              type: Type.STRING,
              enum: ["low", "medium", "high", "uncertain"],
            },
            greenery_pedestrian_relationship: {
              type: Type.STRING,
            },
            confidence: {
              type: Type.STRING,
              enum: ["low", "medium", "high"],
            },
          },
          required: [
            "greenery_types",
            "greenery_vertical_position",
            "greenery_continuity",
            "greenery_pedestrian_relationship",
            "confidence",
          ],
        },
        edge_barrier_density: {
          type: Type.OBJECT,
          properties: {
            barrier_present: {
              type: Type.STRING,
              enum: ["present", "absent", "uncertain"],
            },
            edge_type: {
              type: Type.STRING,
              enum: [
                "stoop",
                "yard",
                "planter_wall",
                "low_wall_or_ledge",
                "landscape_buffer",
                "bollard_or_physical_barrier",
                "direct_facade_sidewalk",
                "none",
                "uncertain",
              ],
            },
            barrier_continuity: {
              type: Type.STRING,
              enum: ["low", "medium", "high", "uncertain"],
            },
            buffering_quality: {
              type: Type.STRING,
              enum: ["low", "medium", "high", "uncertain"],
            },
            edge_spatial_relationship: {
              type: Type.STRING,
            },
            confidence: {
              type: Type.STRING,
              enum: ["low", "medium", "high"],
            },
          },
          required: [
            "barrier_present",
            "edge_type",
            "barrier_continuity",
            "buffering_quality",
            "edge_spatial_relationship",
            "confidence",
          ],
        },
        transitional_structural_enclosure: {
          type: Type.OBJECT,
          properties: {
            street_wall_continuity: {
              type: Type.STRING,
              enum: ["low", "medium", "high", "uncertain"],
            },
            building_vertical_presence: {
              type: Type.STRING,
              enum: ["low", "medium", "high", "uncertain"],
            },
            sky_exposure: {
              type: Type.STRING,
              enum: ["low", "medium", "high", "uncertain"],
            },
            setback_openness: {
              type: Type.STRING,
              enum: ["low", "medium", "high", "uncertain"],
            },
            vegetation_enclosure: {
              type: Type.STRING,
              enum: ["low", "medium", "high", "uncertain"],
            },
            perceived_hw_ratio: {
              type: Type.STRING,
              enum: [
                "under_enclosed",
                "human_scale",
                "deep_canyon",
                "uncertain",
              ],
            },
            enclosure_spatial_relationship: {
              type: Type.STRING,
            },
            confidence: {
              type: Type.STRING,
              enum: ["low", "medium", "high"],
            },
          },
          required: [
            "street_wall_continuity",
            "building_vertical_presence",
            "sky_exposure",
            "setback_openness",
            "vegetation_enclosure",
            "perceived_hw_ratio",
            "enclosure_spatial_relationship",
            "confidence",
          ],
        },
        micro_spatial_affordances: {
          type: Type.OBJECT,
          properties: {
            stationary_affordance_present: {
              type: Type.STRING,
              enum: ["present", "absent", "uncertain"],
            },
            stationary_affordance_types: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
                enum: [
                  "bench_or_seat",
                  "usable_ledge_or_low_wall",
                  "stoop",
                  "planter_edge",
                  "parasol_or_shade_structure",
                  "street_furniture",
                  "active_ground_floor_interface",
                  "other",
                  "none",
                  "uncertain",
                ],
              },
            },
            lingering_affordance: {
              type: Type.STRING,
              enum: ["low", "medium", "high", "uncertain"],
            },
            ground_floor_active_permeability: {
              type: Type.STRING,
              enum: ["low", "medium", "high", "uncertain"],
            },
            affordance_spatial_relationship: {
              type: Type.STRING,
            },
            confidence: {
              type: Type.STRING,
              enum: ["low", "medium", "high"],
            },
          },
          required: [
            "stationary_affordance_present",
            "stationary_affordance_types",
            "lingering_affordance",
            "ground_floor_active_permeability",
            "affordance_spatial_relationship",
            "confidence",
          ],
        },
      },
      required: [
        "eye_level_greenness",
        "edge_barrier_density",
        "transitional_structural_enclosure",
        "micro_spatial_affordances",
      ],
    },
    evidence_audit: {
      type: Type.OBJECT,
      properties: {
        original_secondary_contribution: {
          type: Type.STRING,
        },
        original_only_observations: {
          type: Type.STRING,
        },
        classification_limitations: {
          type: Type.STRING,
        },
        original_only_evidence_used_for_measurement: {
          type: Type.BOOLEAN,
        },
        audit_status: {
          type: Type.STRING,
          enum: ["pass", "review_required"],
        },
        uncertainty: {
          type: Type.STRING,
        },
      },
      required: [
        "original_secondary_contribution",
        "original_only_observations",
        "classification_limitations",
        "original_only_evidence_used_for_measurement",
        "audit_status",
        "uncertainty",
      ],
    },
  },
  required: [
    "schema_version",
    "image_id",
    "primary_evidence_summary",
    "measurement_domains",
    "evidence_audit",
  ],
};
