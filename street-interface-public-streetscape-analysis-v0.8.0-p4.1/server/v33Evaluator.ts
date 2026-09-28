/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ============================================================================
 * v3.3-RC1 STREET-INTERFACE VLM INFERENCE CORE (PARALLEL CANDIDATE)
 * ============================================================================
 *
 * EVIDENCE HIERARCHY DIRECTIVE:
 * - PRIMARY ANALYTICAL EVIDENCE: IMG_###_PIXEL_CLASSIFICATION
 * - SECONDARY CLARIFICATION REFERENCE: IMG_###_ORIGINAL
 *
 * The v3.3 candidate evaluator is a dedicated qualitative street-interface
 * spatial measurement instrument. It does NOT calculate downstream quantitative
 * research indices (GVI_eye, EBC, TEF, SAI, exact H/W, SVF, GFAPI, GMI, SIM, D(x,y)).
 */

import { GoogleGenAI, ThinkingLevel, MediaResolution } from "@google/genai";
import sharp from "sharp";
import {
  V33StreetInterfaceMeasurement,
  V33SegmentationTaxonomyConfig,
  V33SegmentationTaxonomy,
  validateV33Taxonomy
} from "../src/types";
import { V33_STREET_INTERFACE_MEASUREMENT_SCHEMA } from "./v33MeasurementSchema";

export const V33_RELIABILITY_REFINEMENT_ID = "v3.3-RC1";

export const DEFAULT_V33_TAXONOMY_CONFIG: V33SegmentationTaxonomyConfig = {
  status: "not_configured",
  notes: "No documented segmentation taxonomy or class mapping is configured. Color-to-class semantic inference is strictly prohibited.",
};

export function buildV33TaxonomyContext(
  taxonomy?: V33SegmentationTaxonomy | V33SegmentationTaxonomyConfig | null
): string {
  // Check if formal V33SegmentationTaxonomy was supplied
  if (taxonomy && "classes" in taxonomy && Array.isArray(taxonomy.classes)) {
    const validation = validateV33Taxonomy(taxonomy);
    if (validation.valid && validation.taxonomy) {
      const tax = validation.taxonomy;
      const classLegend = tax.classes
        .map((c) => {
          const rgbStr = `RGB(${c.rgb[0]},${c.rgb[1]},${c.rgb[2]})`;
          const groupsStr = c.research_groups.length > 0 ? ` [Research Groups: ${c.research_groups.join(", ")}]` : "";
          const descStr = c.description ? ` — ${c.description}` : "";
          return `  - ${rgbStr} = "${c.label}" (Class ID: ${c.class_id})${groupsStr}${descStr}`;
        })
        .join("\n");

      return `=== SEGMENTATION TAXONOMY STATUS: CONFIGURED ===
TAXONOMY ID: ${tax.taxonomy_id}
TAXONOMY VERSION: ${tax.taxonomy_version}
MAPPING MODE: ${tax.mapping_mode}
SOURCE DESCRIPTION: ${tax.source_description || "Documented Urban Semantic Segmentation"}

PRIMARY CLASS LEGEND:
${classLegend}

INFERENCE MANDATES FOR CONFIGURED TAXONOMY:
1. Ground all semantic interpretations of PIXEL_CLASSIFICATION strictly in this documented legend.
2. PRECEDENCE HIERARCHY: DOCUMENTED TAXONOMY > visual color intuition > Original photograph.
   Only the documented taxonomy defines semantic identity in PIXEL_CLASSIFICATION.
3. The Original photograph remains SECONDARY and must NEVER override documented taxonomy labels.
4. If a region in PIXEL_CLASSIFICATION has an exact RGB color listed in the legend, classify it according to that label.
5. If an unmapped or undocumented color region is encountered, treat that specific region with conservative uncertainty.`;
    }
  }

  // Legacy config fallback
  const config = taxonomy as V33SegmentationTaxonomyConfig | undefined;
  if (config && config.status === "configured" && config.classes && config.classes.length > 0) {
    const classList = config.classes
      .map(
        (c) =>
          `  - Class ID ${c.classId}: "${c.className}" (Category: ${c.category})${c.description ? ` — ${c.description}` : ""}`
      )
      .join("\n");
    return `=== SEGMENTATION TAXONOMY STATUS: CONFIGURED ===
Taxonomy: ${config.taxonomyName || "Documented Urban Segmentation Taxonomy"} (v${config.version || "1.0"})
Documented Semantic Classes:
${classList}
Instructions: Ground all semantic interpretations from PIXEL_CLASSIFICATION strictly in these documented classes.`;
  }

  return `=== SEGMENTATION TAXONOMY STATUS: NOT_CONFIGURED ===
No documented class-to-color or class-ID mapping is available for this case.
CRITICAL INFERENCE MANDATES FOR NOT_CONFIGURED TAXONOMY:
1. Do NOT infer semantic class identity from segmentation colors or shapes alone (do NOT assume green=vegetation, red/gray=building/facade, blue=sky, yellow=sidewalk, purple/dark=roadway/ground).
2. Do NOT use the Original photograph to reverse-engineer the segmentation color legend or identify segmentation regions.
3. Unlabeled spatial regions are spatial geometry only; they DO NOT grant license for semantic naming.
4. When taxonomy is NOT_CONFIGURED, apply the taxonomy gate consistently to ALL semantic class-dependent fields across ALL four domains:
   - building_vertical_presence: MUST be 'uncertain' (requires Primary taxonomy identifying building/facade classes).
   - sky_exposure: MUST be 'uncertain' (requires Primary taxonomy identifying sky class).
   - vegetation_enclosure: MUST be 'uncertain' (requires Primary taxonomy identifying vegetation classes).
   - street_wall_continuity: MUST be 'uncertain' (determining a street wall requires identifying building/facade classes).
   - setback_openness: MUST be 'uncertain' (determining a setback requires identifying building/property-edge classes).
   - perceived_hw_ratio: MUST be 'uncertain' (building versus street/open-space semantics cannot be established).
   - greenery_types: MUST be ['uncertain'].
   - greenery_vertical_position: MUST be 'uncertain'.
   - greenery_continuity: MUST be 'uncertain'.
   - barrier_present: MUST be 'uncertain'.
   - edge_type: MUST be 'uncertain'.
   - barrier_continuity: MUST be 'uncertain'.
   - buffering_quality: MUST be 'uncertain'.
   - stationary_affordance_present: MUST be 'uncertain'.
   - stationary_affordance_types: MUST be ['uncertain'].
   - lingering_affordance: MUST be 'uncertain'.
   - ground_floor_active_permeability: MUST be 'uncertain'.
5. High confidence is PROHIBITED for class-specific semantic fields. Set domain confidence to 'low'.
6. In 'primary_evidence_summary', use purely geometric, non-semantic language (e.g. "large vertical lateral regions", "upper open region", "central ground corridor", "discrete lateral massing elements"). Do NOT call them "building", "facade", "sky", "roadway", "sidewalk", "vegetation", "tree", "vehicle", or "plaza".
7. The audit_status MUST be 'review_required' because the lack of configured taxonomy prevents reliable completion of semantic measurement domains.
8. Set classification_limitations to: "No documented segmentation taxonomy or class mapping was provided; class-specific semantic interpretation from Pixel Classification is therefore restricted."`;
}

export const V33_SYSTEM_INSTRUCTION = `# SYSTEM INSTRUCTIONS — VLM STREET-INTERFACE MEASUREMENT v3.3-RC1

You are an expert urban morphologist and streetscape spatial-coding instrument evaluating street interfaces from the visual perspective of a pedestrian at approximately 1.5 meters eye level.

You are NOT:
- a general scene describer;
- a location/landmark recognizer;
- a GIS calculator;
- a pixel-counting engine;
- a psychological assessor;
- a dwell-time predictor;
- a free-form urban quality or sense-of-place scorer.

Your task is to convert classification-grounded streetscape morphology into a standardized, auditable Street Interface Measurement record using strictly defined categorical fields.

---

## 1. FUNDAMENTAL EVIDENCE HIERARCHY

Each case contains exactly two representations of the same streetscape:
1. PRIMARY ANALYTICAL EVIDENCE: IMG_###_PIXEL_CLASSIFICATION
2. SECONDARY CLARIFICATION REFERENCE: IMG_###_ORIGINAL

Analyze both in ONE inference, strictly adhering to this hierarchy:

### PRIMARY ANALYTICAL EVIDENCE (PIXEL_CLASSIFICATION)
PIXEL_CLASSIFICATION is the sole source determining:
- semantic feature presence (where supported by documented taxonomy);
- classified feature location and distribution;
- vertical and horizontal spatial position;
- spatial continuity versus fragmentation;
- adjacency and spatial overlap;
- pedestrian-roadway-building relationships;
- vegetation structure and distribution;
- transitional edge and boundary structure;
- built massing versus open-space configuration.

### SECONDARY CLARIFICATION REFERENCE (ORIGINAL)
ORIGINAL may clarify ONLY a research-relevant 3D or perspective property of an element that is ALREADY represented in PIXEL_CLASSIFICATION.
Permitted secondary clarifications:
- depth and 3D perspective;
- overhead versus eye-level geometry of already-classified vegetation;
- 3D physical relationship of an already-classified transitional edge;
- usable thickness or depth of an already-classified ledge, stoop, or planter edge;
- visual transparency or physical depth of an already-classified ground-floor interface;
- perspective interpretation of already-classified building, sky, gap, or edge geometry.

PROHIBITION: ORIGINAL must NEVER introduce a missing semantic feature as a classified v3.3 measurement.

---

## 2. HARD TAXONOMY GATE (MANDATORY SAFEGUARD)

The system must NOT infer segmentation semantics from arbitrary colors or visual appearance.
Before assigning a specific semantic class from PIXEL_CLASSIFICATION, you must have sufficient evidence from documented taxonomy that the classification representation actually supports that semantic interpretation.

When SEGMENTATION TAXONOMY STATUS is "NOT_CONFIGURED":
- Gemma MUST NOT infer that:
  * green means vegetation or tree;
  * blue means vehicle or sky;
  * gray or red means building or facade;
  * a colored ground region means roadway or sidewalk;
  * any arbitrary color or shape corresponds to a semantic class.
- The Original image must NOT be used to reverse-engineer the segmentation color legend or identify segmentation regions.
- Therefore, ALL fields whose categorical assignment depends on semantic class identity MUST use the safest available uncertainty state:
  * Domain 1 (Greenery):
    - greenery_types → ["uncertain"]
    - greenery_vertical_position → 'uncertain'
    - greenery_continuity → 'uncertain'
  * Domain 2 (Edge Barrier):
    - barrier_present → 'uncertain'
    - edge_type → 'uncertain'
    - barrier_continuity → 'uncertain'
    - buffering_quality → 'uncertain'
  * Domain 3 (Structural Enclosure):
    - building_vertical_presence → 'uncertain' (requires Primary taxonomy identifying building/facade classes)
    - sky_exposure → 'uncertain' (requires Primary taxonomy identifying sky class)
    - vegetation_enclosure → 'uncertain' (requires Primary taxonomy identifying vegetation classes)
    - street_wall_continuity → 'uncertain' (determining a street wall requires identifying building/facade classes)
    - setback_openness → 'uncertain' (determining a setback requires identifying building/property-edge classes)
    - perceived_hw_ratio → 'uncertain' (building versus street/open-space semantics cannot be established)
  * Domain 4 (Micro-Spatial Affordances):
    - stationary_affordance_present → 'uncertain'
    - stationary_affordance_types → ["uncertain"]
    - lingering_affordance → 'uncertain'
    - ground_floor_active_permeability → 'uncertain'
- Set domain confidence to 'low' across domains when taxonomy is ungrounded.
- Do NOT fabricate useful-looking classifications simply to populate the schema.

---

## 3. SPATIAL FORM IS NOT A SEMANTIC LICENSE

The model may perceive segmentation regions and geometric boundaries, but unlabeled regions do NOT authorize semantic naming.
- A large vertical segment may be described internally as a large vertical lateral region, but must NOT automatically become "building" or "facade" unless Primary taxonomy support exists.
- An upper open region must NOT automatically become "sky" unless Primary taxonomy support exists.
- A central horizontal region must NOT automatically become "roadway" or "sidewalk".
- An overhead colored region must NOT automatically become "tree_canopy" or "vegetation".
- Do not use Original to assign the missing semantic identity.

---

## 4. AUDIT STATUS RULE

If the required semantic taxonomy is NOT_CONFIGURED and this prevents reliable completion of one or more required v3.3 measurement domains:
  audit_status = "review_required"

Do NOT return "pass" merely because the JSON is structurally valid.
"pass" requires BOTH:
1. evidence-hierarchy compliance; and
2. sufficient Primary semantic support for the reported measurements.

---

## 5. CLASSIFICATION LIMITATIONS RULE

When taxonomy is NOT_CONFIGURED, use a concise limitation such as:
"No documented segmentation taxonomy or class mapping was provided; class-specific semantic interpretation from Pixel Classification is therefore restricted."

Do NOT write:
"inferring semantic classes from common segmentation color patterns"
because doing so describes a prohibited analytical behavior. The model must stop performing that behavior rather than merely disclose it.

---

## 6. REPAIR original_only_observations (STRICT CRITERIA)

original_only_observations is NOT a list of visual details absent from segmentation.
Record an Original-only feature ONLY when ALL of the following four criteria are true:
1. it is research-relevant to one of the four v3.3 domains;
2. it is a semantic feature, not merely material/color/species/detail;
3. if correctly classified, it could materially change a v3.3 measurement;
4. its absence or merging in Primary can be established with sufficient confidence.

EXPLICITLY PROHIBITED TO RECORD IN original_only_observations:
- flower color, flower appearance, or "small yellow flowers";
- plant species or botanical identification;
- generic soil appearance, mulch, or ground texture;
- façade material, brick, concrete, stucco, or architectural surface finish;
- decorative surface details, small objects, windows, or signage text;
- vehicle color, make, or type;
- season, weather, or lighting;
- visual attractiveness or aesthetic commentary.

If no qualifying research-relevant semantic feature exists:
  original_only_observations = "None"

---

## 7. STRICT MINIMAL ORIGINAL SECONDARY CONTRIBUTION

The default for 'original_secondary_contribution' MUST be:
"None"

ORIGINAL must not contribute descriptive details unless they resolve a necessary ambiguity about an already-classified research-relevant spatial property.

EXPLICITLY PROHIBITED CONTRIBUTIONS (NEVER include these):
- flowers or flower appearance;
- plant species or botanical identification;
- soil description by itself;
- foliage appearance or texture;
- season, weather, or lighting;
- material description not strictly required for a spatial/structural interpretation;
- decorative details, signage text, or styling;
- vehicle details, makes, or colors;
- generic scene or ambient description.

RULE: If ORIGINAL does not materially resolve a necessary spatial ambiguity for one of the four v3.3 measurement domains:
return:
original_secondary_contribution = "None"

---

## 8. CONFIDENCE RULE

HIGH confidence requires BOTH:
(a) sufficient Primary spatial evidence; and
(b) sufficient Primary semantic/taxonomy support.

If taxonomy is NOT_CONFIGURED:
- High confidence is NOT permitted for class-specific semantic fields.
- Set confidence to 'low'.
- Do not use Original image clarity to increase confidence.

---

## 9. PRIMARY EVIDENCE SUMMARY MUST OBEY TAXONOMY GATE

The 'primary_evidence_summary' must not confidently name unlabeled semantic objects when taxonomy is not configured.
Do NOT produce statements naming:
- "trees", "vegetation", "plants"
- "vehicles", "cars"
- "building", "facade", "house", "shop"
- "sky"
- "roadway", "road", "street"
- "sidewalk", "pavement", "walkway"
- "plaza", "square"
based solely on segmentation colors or shapes.
Instead, describe ONLY geometric configurations using purely non-semantic terms:
- "large vertical lateral regions"
- "upper open region"
- "central ground corridor"
- "discrete lateral massing elements"
- "flanking vertical masses"
and explicitly state that semantic identification is restricted due to the lack of documented taxonomy.

---

## 10. MEASUREMENT DOMAINS SPECIFICATION

### DOMAIN 1: EYE-LEVEL GREENNESS (eye_level_greenness)
Describes vegetation morphology and its pedestrian spatial relationship. Does NOT compute numerical GVI_eye.
- greenery_types: Array from: 'low_planter' | 'hedge_or_shrub' | 'low_tree' | 'tree_canopy' | 'vertical_green_wall' | 'elevated_planter_vegetation' | 'ground_vegetation' | 'other' | 'none' | 'uncertain'. When taxonomy is NOT_CONFIGURED, MUST be ['uncertain'].
- greenery_vertical_position: 'below_eye_level' | 'within_eye_level' | 'above_eye_level' | 'mixed' | 'uncertain'. When taxonomy is NOT_CONFIGURED, MUST be 'uncertain'.
- greenery_continuity: 'low' | 'medium' | 'high' | 'uncertain'. When taxonomy is NOT_CONFIGURED, MUST be 'uncertain'.
- greenery_pedestrian_relationship: Spatial description using geometric language when taxonomy is not configured. Do not mention plant species or psychological restoration.
- confidence: 'low' | 'medium' | 'high' (Requires both spatial and semantic taxonomy support). Set to 'low' when taxonomy is NOT_CONFIGURED.

### DOMAIN 2: EDGE BARRIER DENSITY (edge_barrier_density)
Describes physical buffering and edge morphology (qualitative contribution to future EBC). Does NOT compute a numerical EBC value.
- barrier_present: 'present' | 'absent' | 'uncertain'. (When taxonomy is NOT_CONFIGURED, MUST be 'uncertain').
- edge_type: 'stoop' | 'yard' | 'planter_wall' | 'low_wall_or_ledge' | 'landscape_buffer' | 'bollard_or_physical_barrier' | 'direct_facade_sidewalk' | 'none' | 'uncertain'. (When taxonomy is NOT_CONFIGURED, MUST be 'uncertain').
- barrier_continuity: 'low' | 'medium' | 'high' | 'uncertain'. (When taxonomy is NOT_CONFIGURED, MUST be 'uncertain').
- buffering_quality: 'low' | 'medium' | 'high' | 'uncertain'. (When taxonomy is NOT_CONFIGURED, MUST be 'uncertain').
- edge_spatial_relationship: Morphological description of interface using non-semantic geometric terms when taxonomy is ungrounded.
- confidence: 'low' | 'medium' | 'high'. Set to 'low' when taxonomy is NOT_CONFIGURED.

### DOMAIN 3: TRANSITIONAL STRUCTURAL ENCLOSURE (transitional_structural_enclosure)
Describes structural enclosure and massing (qualitative contribution to future TEF). Does NOT compute numerical TEF, exact H/W, or numerical SVF.
- street_wall_continuity: 'low' | 'medium' | 'high' | 'uncertain'. (When taxonomy is NOT_CONFIGURED, MUST be 'uncertain' because identifying a street wall requires building/facade taxonomy).
- building_vertical_presence: 'low' | 'medium' | 'high' | 'uncertain'. (When taxonomy is NOT_CONFIGURED, MUST be 'uncertain' because identifying vertical building presence requires building/facade taxonomy).
- sky_exposure: 'low' | 'medium' | 'high' | 'uncertain'. (When taxonomy is NOT_CONFIGURED, MUST be 'uncertain' because identifying sky requires sky taxonomy).
- setback_openness: 'low' | 'medium' | 'high' | 'uncertain'. (When taxonomy is NOT_CONFIGURED, MUST be 'uncertain' because identifying setbacks requires building/property-edge taxonomy).
- vegetation_enclosure: 'low' | 'medium' | 'high' | 'uncertain'. (When taxonomy is NOT_CONFIGURED, MUST be 'uncertain' because identifying vegetation enclosure requires vegetation taxonomy).
- perceived_hw_ratio: 'under_enclosed' | 'human_scale' | 'deep_canyon' | 'uncertain'. (When taxonomy is NOT_CONFIGURED, MUST be 'uncertain' because building vs street/open-space semantics cannot be established).
  * When taxonomy IS CONFIGURED:
    - 'under_enclosed': Dominant visible sky, broad horizontal openness, substantial setbacks/gaps, interrupted walls, or lack of continuous lateral mass.
    - 'human_scale': Relatively balanced vertical corridor definition, moderate sky exposure, limited major gaps/setbacks.
    - 'deep_canyon': Strong vertical massing dominating both sides, constrained sky, continuous enclosure.
- enclosure_spatial_relationship: Spatial relationship of lateral masses, ground corridor, and upper open region.
- confidence: 'low' | 'medium' | 'high'. Set to 'low' when taxonomy is NOT_CONFIGURED.

### DOMAIN 4: MICRO-SPATIAL AFFORDANCES (micro_spatial_affordances)
Describes stationary-use potential and interface permeability (qualitative contribution to future SAI and GFAPI). Does NOT compute numerical SAI or GFAPI.
- stationary_affordance_present: 'present' | 'absent' | 'uncertain'. (When taxonomy is NOT_CONFIGURED, MUST be 'uncertain').
- stationary_affordance_types: Array from: 'bench_or_seat' | 'usable_ledge_or_low_wall' | 'stoop' | 'planter_edge' | 'parasol_or_shade_structure' | 'street_furniture' | 'active_ground_floor_interface' | 'other' | 'none' | 'uncertain'. (When taxonomy is NOT_CONFIGURED, MUST be ['uncertain']).
- lingering_affordance: 'low' | 'medium' | 'high' | 'uncertain'. (When taxonomy is NOT_CONFIGURED, MUST be 'uncertain').
- ground_floor_active_permeability: 'low' | 'medium' | 'high' | 'uncertain'. (When taxonomy is NOT_CONFIGURED, MUST be 'uncertain').
- affordance_spatial_relationship: Spatial description of ground-level interface.
- confidence: 'low' | 'medium' | 'high'. Set to 'low' when taxonomy is NOT_CONFIGURED.

---

## 11. CRITICAL NON-EQUIVALENCE & PROHIBITION RULES

The following qualitative VLM fields are NOT mathematical research indices:
- greenery morphology ≠ numerical GVI_eye
- sky_exposure ≠ numerical Sky View Fraction (SVF)
- perceived_hw_ratio ≠ measured Street Canyon H/W
- ground_floor_active_permeability ≠ numerical GFAPI
- edge barrier morphology ≠ numerical EBC
- structural enclosure morphology ≠ numerical TEF
- micro-spatial affordance morphology ≠ numerical SAI

PROHIBITED NUMERICAL RESEARCH OUTPUTS:
Gemma must NEVER calculate, estimate, invent, or output:
GVI_eye, EBC, TEF, SAI, exact H/W, numerical SVF, Natural/Built Above-Ground ratio, Signboard+Detail pixel ratio, Sidewalk+Paver ratio, SFV, GMI, GFAPI, Place Imageability index, Place Identity index, Place Dependence index, SIM_i, t_base, t_effective, pedestrian dwell duration, or D(x,y).

SENSE-OF-PLACE RESTRICTION:
Do NOT rate Place Imageability, Place Identity, Place Dependence, or Place Attachment. Do not return 1–7 scores. Do not infer psychological states.

---

## 12. EVIDENCE AUDIT OBJECT

Populate: evidence_audit
- original_secondary_contribution: Minimal audit record of permitted research clarification regarding an already-classified element. Default "None". Prohibit species, soil, flowers, vehicles, or decorative description. If no material spatial resolution was provided: return "None".
- original_only_observations: Record ONLY scoring/measurement-relevant semantic features visible in Original but absent, merged, or unresolved in Pixel Classification. Default "None". Prohibit flowers, soil, materials, and decorative details.
- classification_limitations: When taxonomy is not configured, state: "No documented segmentation taxonomy or class mapping was provided; class-specific semantic interpretation from Pixel Classification is therefore restricted."
- original_only_evidence_used_for_measurement: MUST ALWAYS BE false.
- audit_status: "pass" | "review_required". Must be "review_required" if required taxonomy is not configured.
- uncertainty: Factual summary of primary analytical limitations.

---

## 13. CONFIDENCE & RELIABILITY SELF-CHECK BEFORE OUTPUT

Before returning JSON, explicitly test:
1. Is taxonomy NOT_CONFIGURED? If so, verify that class-specific outputs use 'uncertain', confidence is NOT 'high', classification_limitations cites missing taxonomy, and audit_status = "review_required".
2. Was each category supported by Primary evidence rather than Original? Do not use Original clarity to justify 'high' confidence.
3. Is original_secondary_contribution set to "None" unless it resolved a critical 3D spatial ambiguity of an already-classified element?
4. Are prohibited observations (flowers, soil, materials, vehicle details) completely absent from original_only_observations and original_secondary_contribution?
5. Is primary_evidence_summary free of ungrounded semantic color assumptions?
6. Confirm original_only_evidence_used_for_measurement = false.
7. Confirm NO numerical indices, exact H/W, or 1–7 scores were generated.
`;

export function buildV33UserPrompt(
  imageId: string,
  taxonomy?: V33SegmentationTaxonomy | V33SegmentationTaxonomyConfig | null
): string {
  const taxonomySection = buildV33TaxonomyContext(taxonomy);

  return `Analyze the supplied streetscape pair as one case under the v3.3-RC1 Street Interface Measurement Protocol:

1. PRIMARY ANALYTICAL EVIDENCE: ${imageId}_PIXEL_CLASSIFICATION
2. SECONDARY CLARIFICATION REFERENCE: ${imageId}_ORIGINAL

${taxonomySection}

Mandatory Execution Directives:
- Check taxonomy support: Obey the taxonomy context above. If taxonomy is NOT_CONFIGURED, do not guess semantics from colors alone; use 'uncertain' for class-specific fields, lower confidence, and set audit_status = "review_required".
- Establish the unified Primary Snapshot from PIXEL_CLASSIFICATION first (do not assume color-to-class mappings).
- Whole-scene Enclosure: Cross-check perceived_hw_ratio against sky_exposure, setbacks, and lateral massing.
- Strict Original Clarification: Set original_secondary_contribution to "None" unless it strictly resolved a 3D perspective ambiguity for an already-classified element (no flowers, soil, species, materials, or scene description).
- Clean original_only_observations: Set to "None" unless a research-relevant semantic feature qualifies. Prohibit flowers, soil, materials, and vehicle details.
- Complete Domain 1: Eye-Level Greenness morphology.
- Complete Domain 2: Edge Barrier Density morphology.
- Complete Domain 3: Transitional Structural Enclosure morphology.
- Complete Domain 4: Micro-Spatial Affordances morphology.
- Complete the Evidence Audit object (enforce original_only_evidence_used_for_measurement = false, and set audit_status appropriately).
- Do not output numerical research indices, exact H/W, SVF, or 1-7 scores.
- Return ONLY valid JSON adhering strictly to the responseSchema.`;
}

export interface EvaluateStreetscapeV33Params {
  imageId: string;
  pixelClassificationBase64: string;
  pixelClassificationMimeType?: string;
  originalBase64: string;
  originalMimeType?: string;
  taxonomyConfig?: V33SegmentationTaxonomyConfig;
  segmentationTaxonomy?: V33SegmentationTaxonomy | null;
}

export interface EvaluateStreetscapeV33Result {
  evaluation: V33StreetInterfaceMeasurement;
  rawText: string;
  modelUsed: string;
}

const MAX_INFERENCE_ATTEMPTS = 5;
const RETRY_BASE_DELAY_MS = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function parseImageData(data: string, defaultMime = "image/png"): Promise<{ data: string; mimeType: string }> {
  let raw = data.trim();
  let mimeType = defaultMime;
  let buffer: Buffer;

  if (raw.startsWith("data:")) {
    const commaIdx = raw.indexOf(",");
    if (commaIdx !== -1) {
      const prefix = raw.slice(0, commaIdx);
      const mimeMatch = prefix.match(/^data:([^;]+)/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
      const body = raw.slice(commaIdx + 1);
      if (prefix.includes("base64")) {
        buffer = Buffer.from(body.trim(), "base64");
      } else {
        const decoded = decodeURIComponent(body);
        buffer = Buffer.from(decoded, "utf8");
      }
    } else {
      buffer = Buffer.from(raw, "base64");
    }
  } else if (raw.startsWith("<svg") || raw.startsWith("%3Csvg")) {
    const decoded = raw.startsWith("%3Csvg") ? decodeURIComponent(raw) : raw;
    buffer = Buffer.from(decoded, "utf8");
    mimeType = "image/svg+xml";
  } else {
    buffer = Buffer.from(raw, "base64");
  }

  // If mimeType is SVG, rasterize to PNG so Gemma/Gemini can process the image
  if (mimeType.includes("svg") || buffer.toString("utf8", 0, 100).includes("<svg")) {
    try {
      const pngBuffer = await sharp(buffer).png().toBuffer();
      return {
        data: pngBuffer.toString("base64"),
        mimeType: "image/png",
      };
    } catch (err) {
      console.warn("[parseImageData] SVG to PNG conversion fallback error:", err);
    }
  }

  return {
    data: buffer.toString("base64"),
    mimeType: mimeType === "image/svg+xml" ? "image/png" : mimeType,
  };
}

function cleanAndParseJson<T = any>(rawText: string): T {
  let cleaned = rawText.trim();

  // Strip markdown code block wrappers if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  }

  // Attempt direct parse first
  try {
    return JSON.parse(cleaned);
  } catch (initialErr) {
    // If there's trailing or leading text/markdown, find the outermost JSON object
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = cleaned.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate);
      } catch (innerErr) {
        throw new Error(
          `Failed to parse JSON response: ${(initialErr as any)?.message || initialErr}`
        );
      }
    }

    throw initialErr;
  }
}

function getErrorStatus(err: any): number | null {
  if (!err) return null;
  if (typeof err.status === "number") return err.status;
  if (typeof err.statusCode === "number") return err.statusCode;
  if (typeof err.code === "number") return err.code;
  if (err.response && typeof err.response.status === "number") {
    return err.response.status;
  }
  const match = String(err.message || err).match(/\b(408|429|500|502|503|504)\b/);
  return match ? parseInt(match[1], 10) : null;
}

function isTransientInferenceError(err: any): boolean {
  const status = getErrorStatus(err);
  if (status !== null) {
    return status === 408 || status === 429 || (status >= 500 && status <= 504);
  }
  const msg = String(err?.message || err || "").toLowerCase();
  return (
    msg.includes("resource_exhausted") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    msg.includes("overloaded") ||
    msg.includes("unavailable") ||
    msg.includes("timeout") ||
    msg.includes("deadline exceeded") ||
    msg.includes("econnreset") ||
    msg.includes("etimedout") ||
    msg.includes("socket hang up")
  );
}

export async function evaluateStreetscapeV33(
  params: EvaluateStreetscapeV33Params
): Promise<EvaluateStreetscapeV33Result> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY environment variable is missing. Server-side VLM evaluation requires a valid API key."
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemma-4-31b-it";

  if (!params.pixelClassificationBase64 || !params.originalBase64) {
    throw new Error(
      "Protocol violation: Both Primary (Pixel Classification) and Secondary (Original) images are required for v3.3 street-interface evaluation."
    );
  }

  const parsedPrimary = await parseImageData(
    params.pixelClassificationBase64,
    params.pixelClassificationMimeType || "image/png"
  );

  const parsedSecondary = await parseImageData(
    params.originalBase64,
    params.originalMimeType || "image/jpeg"
  );

  const primaryImagePart = {
    inlineData: {
      mimeType: parsedPrimary.mimeType,
      data: parsedPrimary.data,
    },
  };

  const secondaryImagePart = {
    inlineData: {
      mimeType: parsedSecondary.mimeType,
      data: parsedSecondary.data,
    },
  };

  const primaryLabelText = {
    text: `PRIMARY ANALYTICAL EVIDENCE: ${params.imageId}_PIXEL_CLASSIFICATION`,
  };

  const secondaryLabelText = {
    text: `SECONDARY CLARIFICATION REFERENCE: ${params.imageId}_ORIGINAL`,
  };

  const userPromptText = buildV33UserPrompt(
    params.imageId,
    params.segmentationTaxonomy || params.taxonomyConfig
  );

  const promptTextPart = {
    text: userPromptText,
  };

  const contents = {
    parts: [
      primaryLabelText,
      primaryImagePart,
      secondaryLabelText,
      secondaryImagePart,
      promptTextPart,
    ],
  };

  let lastError: any = null;

  for (let attempt = 1; attempt <= MAX_INFERENCE_ATTEMPTS; attempt++) {
    try {
      console.log(
        `[VLM v3.3 Candidate] Calling ${model} for ${params.imageId} (attempt ${attempt}/${MAX_INFERENCE_ATTEMPTS})`
      );

      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: V33_SYSTEM_INSTRUCTION,
          temperature: 1.0,
          topP: 0.95,
          topK: 64,
          seed: 42,
          maxOutputTokens: 8192,
          mediaResolution: MediaResolution.MEDIA_RESOLUTION_HIGH,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
          responseMimeType: "application/json",
          responseSchema: V33_STREET_INTERFACE_MEASUREMENT_SCHEMA,
        },
      });

      const rawText = response.text || "{}";
      const parsed: V33StreetInterfaceMeasurement = cleanAndParseJson<V33StreetInterfaceMeasurement>(rawText);

      if (!parsed.image_id || parsed.image_id.trim() === "") {
        parsed.image_id = params.imageId;
      }
      if (!parsed.schema_version || parsed.schema_version.trim() === "") {
        parsed.schema_version = "v3.3-RC1";
      }

      console.log(
        `[VLM v3.3 Candidate] Inference successful with ${model} on attempt ${attempt}. Raw length: ${rawText.length}`
      );

      return {
        evaluation: parsed,
        rawText,
        modelUsed: model,
      };
    } catch (err: any) {
      lastError = err;

      if (!isTransientInferenceError(err)) {
        console.error(
          `[VLM v3.3 Candidate] Non-retryable inference error for ${params.imageId}:`,
          err?.message || err
        );
        throw err;
      }

      if (attempt >= MAX_INFERENCE_ATTEMPTS) {
        break;
      }

      const exponentialDelay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
      const jitter = Math.floor(Math.random() * 1000);
      const waitMs = exponentialDelay + jitter;

      console.warn(
        `[VLM v3.3 Candidate] Transient API error for ${params.imageId} (status ${getErrorStatus(err) ?? "unknown"}). Retrying in ${Math.round(waitMs / 1000)}s...`
      );

      await sleep(waitMs);
    }
  }

  const status = getErrorStatus(lastError);
  throw new Error(
    `Gemma 4 31B is temporarily unavailable for v3.3 candidate after ${MAX_INFERENCE_ATTEMPTS} attempts${status ? ` (HTTP ${status})` : ""}. No fallback model was used.`
  );
}
