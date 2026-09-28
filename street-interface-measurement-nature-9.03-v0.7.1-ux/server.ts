/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NATURE_903_PROTOCOL_VERSION } from './src/research/nature903Protocol';
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { evaluateStreetscapeV31 } from "./server/evaluator";
import { evaluateStreetscapeV33 } from "./server/v33Evaluator";
import { runV33PixelMeasurementEngine } from "./server/v33PixelMeasurementEngine";
import { evaluatePaperVlmV30 } from "./server/paperVlmEvaluator";
import { validateV33Taxonomy, V33ResearchNodeRecord, FROZEN_30_CLASS_TAXONOMY, VISION_BASELINE_VERSION, FROZEN_TAXONOMY_VERSION } from "./src/types";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload size limits for high-res base64 images
  app.use(express.json({ limit: "60mb" }));
  app.use(express.urlencoded({ extended: true, limit: "60mb" }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      appName: "Street Interface Measurement",
      subtitle: "Vision-Based Human-Scale Streetscape Research Platform",
      appVersion: "Nature 9.03 Final · No-Omega v0.5",
      visionBaseline: VISION_BASELINE_VERSION,
      frozenTaxonomy: FROZEN_TAXONOMY_VERSION,
      classesCount: FROZEN_30_CLASS_TAXONOMY.classes.length,
      vlmStatus: "Team Qwen paper-variable bridge active/gated; Teacher Gemma v3.0 comparator preserved",
      paperProtocol: NATURE_903_PROTOCOL_VERSION,
      hasApiKey: !!process.env.GEMINI_API_KEY
    });
  });

  // Active Vision Measurement Endpoint (Deterministic Exact-RGB Pixel Engine)
  app.post("/api/measure-vision", async (req, res) => {
    try {
      const {
        imageId,
        pixelClassificationBase64,
        pixelClassificationMimeType,
        originalBase64,
        originalMimeType,
        taxonomy
      } = req.body;

      if (!pixelClassificationBase64) {
        return res.status(400).json({
          error: "Missing required image: Lossless PNG PIXEL_CLASSIFICATION is mandatory for exact-RGB measurement."
        });
      }

      const derivedId = (imageId && imageId.trim()) || "IMG_CASE_01";
      const activeTaxonomy = taxonomy || FROZEN_30_CLASS_TAXONOMY;

      // Run deterministic pixel measurement engine
      const pixelMeasurements = await runV33PixelMeasurementEngine({
        pixelClassificationBase64,
        pixelClassificationMimeType: pixelClassificationMimeType || "image/png",
        taxonomy: activeTaxonomy
      });

      // Assemble Research Node Record
      const researchNode: V33ResearchNodeRecord = {
        record_id: `NODE_${derivedId}_${Date.now()}`,
        image_id: derivedId,
        created_at: new Date().toISOString(),
        schema_version: "vision_bridge_v1.2",
        taxonomy_status: "configured",
        pixel_measurements: pixelMeasurements,
        derived_indices: {
          natural_built_above_ground_ratio: pixelMeasurements.derived_metrics.natural_built_above_ground_ratio.value ?? undefined,
          sidewalk_paver_ratio: pixelMeasurements.derived_metrics.sidewalk_paver_ratio.value ?? undefined,
          signboard_detail_ratio: pixelMeasurements.derived_metrics.signboard_detail_ratio.value ?? undefined
        }
      };

      return res.json({
        success: true,
        data: pixelMeasurements,
        researchNode,
        visionBaseline: VISION_BASELINE_VERSION,
        taxonomyVersion: FROZEN_TAXONOMY_VERSION,
        classesCount: activeTaxonomy.classes.length
      });
    } catch (error: any) {
      console.error("[API Error] /api/measure-vision:", error);
      return res.status(500).json({
        error: error.message || "An unexpected error occurred during deterministic vision measurement."
      });
    }
  });

  // Legacy Teacher Gemma v3.0 comparator endpoint — preserved for diagnostics, not canonical paper-variable ownership
  app.post("/api/evaluate-paper-v30", async (req, res) => {
    try {
      const {
        imageId,
        imageQuadrant,
        originalBase64,
        originalMimeType
      } = req.body;

      if (!originalBase64) {
        return res.status(400).json({
          success: false,
          error: "Missing ORIGINAL perspective image for Teacher VLM v3.0 analysis."
        });
      }

      if (!["North", "East", "South", "West"].includes(imageQuadrant)) {
        return res.status(400).json({
          success: false,
          error: "imageQuadrant must be one of North, East, South, West."
        });
      }

      const result = await evaluatePaperVlmV30({
        imageId: (imageId && imageId.trim()) || "IMG_CASE_01",
        imageQuadrant,
        originalBase64,
        originalMimeType: originalMimeType || "image/jpeg"
      });

      return res.json({
        success: true,
        data: result.evaluation,
        rawResponse: result.rawText,
        modelUsed: result.modelUsed,
        protocolVersion: result.protocolVersion
      });
    } catch (error: any) {
      console.error("[API Error] /api/evaluate-paper-v30:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Teacher VLM v3.0 evaluation failed."
      });
    }
  });

  // Evaluate streetscape endpoint (FROZEN PRODUCTION v3.2-RC1)
  app.post("/api/evaluate", async (req, res) => {
    try {
      const {
        imageId,
        pixelClassificationBase64,
        pixelClassificationMimeType,
        originalBase64,
        originalMimeType
      } = req.body;

      if (!pixelClassificationBase64 || !originalBase64) {
        return res.status(400).json({
          error: "Missing required images: Both PIXEL_CLASSIFICATION and ORIGINAL image files are mandatory."
        });
      }

      const derivedId = (imageId && imageId.trim()) || "IMG_CASE_01";

      const result = await evaluateStreetscapeV31({
        imageId: derivedId,
        pixelClassificationBase64,
        pixelClassificationMimeType: pixelClassificationMimeType || "image/png",
        originalBase64,
        originalMimeType: originalMimeType || "image/jpeg"
      });

      return res.json({
        success: true,
        data: result.evaluation,
        rawResponse: result.rawText,
        modelUsed: result.modelUsed
      });
    } catch (error: any) {
      console.error("[API Error] /api/evaluate:", error);
      return res.status(500).json({
        error: error.message || "An unexpected error occurred during VLM streetscape evaluation."
      });
    }
  });

  // Candidate Evaluate endpoint (PARALLEL v3.3-RC1 CANDIDATE)
  app.post("/api/evaluate-v33", async (req, res) => {
    try {
      const {
        imageId,
        pixelClassificationBase64,
        pixelClassificationMimeType,
        originalBase64,
        originalMimeType,
        segmentationTaxonomy,
        taxonomyConfig
      } = req.body;

      if (!pixelClassificationBase64 || !originalBase64) {
        return res.status(400).json({
          error: "Missing required images: Both PIXEL_CLASSIFICATION and ORIGINAL image files are mandatory."
        });
      }

      const derivedId = (imageId && imageId.trim()) || "IMG_CASE_01";

      // Validate taxonomy if provided
      let validatedTaxonomy = null;
      let taxonomyStatus: "not_configured" | "configured" | "invalid" = "not_configured";

      if (segmentationTaxonomy !== undefined && segmentationTaxonomy !== null) {
        const validation = validateV33Taxonomy(segmentationTaxonomy);
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            error: "Invalid segmentation taxonomy provided.",
            taxonomyStatus: "invalid",
            taxonomyErrors: validation.errors,
            taxonomyWarnings: validation.warnings
          });
        }
        validatedTaxonomy = validation.taxonomy || null;
        taxonomyStatus = "configured";
      }

      // 1. Run VLM candidate inference
      const vlmResult = await evaluateStreetscapeV33({
        imageId: derivedId,
        pixelClassificationBase64,
        pixelClassificationMimeType: pixelClassificationMimeType || "image/png",
        originalBase64,
        originalMimeType: originalMimeType || "image/jpeg",
        segmentationTaxonomy: validatedTaxonomy,
        taxonomyConfig
      });

      // 2. Run deterministic pixel measurement engine
      const pixelMeasurements = await runV33PixelMeasurementEngine({
        pixelClassificationBase64,
        pixelClassificationMimeType: pixelClassificationMimeType || "image/png",
        taxonomy: validatedTaxonomy
      });

      // 3. Assemble V33ResearchNodeRecord
      const researchNode: V33ResearchNodeRecord = {
        record_id: `REC_${derivedId}_${Date.now()}`,
        image_id: derivedId,
        created_at: new Date().toISOString(),
        schema_version: "v3.3-RC1",
        taxonomy_status: taxonomyStatus,
        vlm_measurement: vlmResult.evaluation,
        pixel_measurements: pixelMeasurements
      };

      return res.json({
        success: true,
        data: vlmResult.evaluation,
        pixelMeasurements,
        taxonomyStatus,
        researchNode,
        rawResponse: vlmResult.rawText,
        modelUsed: vlmResult.modelUsed,
        appVersion: "v3.3-RC1",
        inferenceCore: "v3.3-RC1 CANDIDATE"
      });
    } catch (error: any) {
      console.error("[API Error] /api/evaluate-v33:", error);
      return res.status(500).json({
        error: error.message || "An unexpected error occurred during v3.3 candidate evaluation."
      });
    }
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Nature 9.03 Final · No-Omega v0.5 Server] Running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
