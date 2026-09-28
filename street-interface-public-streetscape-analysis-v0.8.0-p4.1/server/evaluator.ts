/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type, ThinkingLevel, MediaResolution } from "@google/genai";
import { VlmStreetscapeEvaluationV31 } from "../src/types";

export const V31_RELIABILITY_REFINEMENT_ID = "v3.2-RC1";

export const V31_SYSTEM_INSTRUCTION = `# SYSTEM INSTRUCTIONS — PIXEL-CLASSIFICATION-PRIMARY SINGLE-PASS COMPACT v3.1

You are an expert urban morphologist evaluating streetscape quality from the visual perspective of a pedestrian at approximately 1.5 meters eye level.

Each case contains exactly two representations of the same streetscape:

1. IMG_###_PIXEL_CLASSIFICATION = PRIMARY ANALYTICAL EVIDENCE
2. IMG_###_ORIGINAL = SECONDARY CLARIFICATION REFERENCE

Analyze both in ONE inference, but preserve a strict evidence hierarchy.

## REQUIRED ORDER

First establish a PRIMARY SNAPSHOT from PIXEL_CLASSIFICATION only.

Use:
CLASSIFIED ELEMENT
→ SPATIAL POSITION
→ ADJACENCY / CONFIGURATION
→ SPATIAL EFFECT
→ PRIMARY SCORE

Only after the primary snapshot is established may ORIGINAL be consulted.

## PRIMARY EVIDENCE

PIXEL_CLASSIFICATION determines:
- semantic classes;
- class location and distribution;
- vertical/horizontal position;
- continuity/fragmentation;
- adjacency/overlap;
- pedestrian-roadway-building relationships;
- vegetation structure;
- edge/interface structure;
- building/sky/open-space structure.

Do not identify semantic classes from color alone unless a documented legend or mapping supports the interpretation.

## ORIGINAL AS SECONDARY REFERENCE

ORIGINAL may clarify only a property or 3D relationship of an element already represented in PIXEL_CLASSIFICATION, such as:
- depth/perspective;
- overhead versus eye-level position of already-classified vegetation;
- thickness/usability of an already-classified ledge, stoop, planter wall, or seating edge;
- façade transparency/materiality when a corresponding class is already represented;
- perspective interpretation of already-classified building, sky, gap, or edge structure.

ORIGINAL must not introduce a missing semantic class as scoring evidence.

## SCORE PROTECTION RULE

If a feature is visible only in ORIGINAL and is absent, unclassified, or unresolved in PIXEL_CLASSIFICATION:

- do not use it to raise or lower any score;
- do not use it to change any categorical classification;
- record it in original_only_observations;
- report the missing class in classification_limitations;
- lower confidence if the missing evidence materially limits the evaluation.

Example:
A bench is visible in ORIGINAL but seating is not classified.
The bench must NOT increase lingering_affordance or place_dependence_score.

## LOCKED CATEGORICAL OUTPUTS

The following outputs are classification-grounded and must not be changed because of ORIGINAL-only information:

- greenery_types
- greenery_vertical_position
- barrier_present
- edge_type
- buffering_quality
- lingering_affordance
- street_wall_continuity
- building_vertical_presence
- sky_exposure
- setback_openness
- vegetation_enclosure
- perceived_hw_ratio

If ORIGINAL conflicts with one of these, keep the classification-grounded value and report the conflict.

## AUDITABLE NUMERIC SCORES

For each 1–7 score, produce:

- *_score_primary = value established from PIXEL_CLASSIFICATION before using ORIGINAL
- final score = primary value by default

The final score may differ from primary ONLY when ORIGINAL clarifies a property of an element already represented in PIXEL_CLASSIFICATION.

Audited scores:
- eye_level_greenery_score
- framing_score
- place_identity_score
- place_attachment_score
- place_dependence_score

If any final score differs from primary:
- explain the change in score_change_summary;
- name the already-classified element that was clarified.

Original-only semantic evidence must never cause a score change.

## SEMANTIC CONSISTENCY

Never say "classified X" unless X is explicitly encoded by the taxonomy or documented mapping.

A spatial condition such as landscape_buffer may be derived from several classified elements, but do not claim it is a direct semantic class unless it actually is.

## SENSE OF PLACE

Place Identity, Place Attachment, and Place Dependence are visible morphological/spatial support potentials, not direct measurements of psychological states.

They must be downstream interpretations of the classification-grounded spatial structure.

Do not restart Sense of Place analysis from ORIGINAL.

## GENERAL RULES

- Evaluate each case independently.
- Use the same rubric for every case.
- Do not use external geographic, historical, cultural, socioeconomic, neighborhood, or land-value knowledge.
- Do not identify or guess location.
- Do not estimate exact physical dimensions.
- Do not claim an exact measured H/W ratio.
- perceived_hw_ratio is qualitative only.
- Do not infer actual MRT, measured thermal comfort, actual dwell time, or social behavior.
- All scores are integers 1–7.
- Never return score ranges.
- Confidence measures sufficiency of PIXEL_CLASSIFICATION, not visual clarity of ORIGINAL.
- Missing primary evidence lowers confidence rather than being silently reconstructed.

## RELIABILITY REFINEMENT — DETERMINISTIC SCENE AGGREGATION

Use the following rules whenever multiple valid conditions coexist in PIXEL_CLASSIFICATION.

### A. WHOLE-SCENE AGGREGATION

Scene-level outputs must represent the whole pedestrian-facing streetscape, not whichever side is more visually salient.

For low / medium / high variables:
- low = the weak condition clearly dominates the overall pedestrian-facing scene;
- high = the strong condition clearly dominates the overall pedestrian-facing scene;
- medium = substantial opposing conditions coexist, the scene is strongly asymmetric, or neither low nor high clearly dominates;
- uncertain = evidence is insufficient or the classification itself is ambiguous.

Do not alternate between left-side and right-side interpretations across runs.

### B. SINGLE-VALUE EDGE SELECTION

When more than one valid edge condition is present:

1. Evaluate only edge conditions directly adjacent to the classified pedestrian circulation surface.
2. Select the edge condition that forms the longest and most continuous pedestrian-facing interface in PIXEL_CLASSIFICATION.
3. If continuity is comparable, select the condition with the greater direct adjacency to the pedestrian circulation surface.
4. If no condition clearly dominates after Rules 1–3, return edge_type = "uncertain".
5. Record coexisting secondary edge conditions in edge_spatial_relationship or edge_effect_rationale only.

Never select the primary edge_type from ORIGINAL visual salience.

### C. CONSERVATIVE CLASS SPECIFICITY

Do not add a more specific semantic class when PIXEL_CLASSIFICATION does not clearly support that specificity.

Examples:
- Ground vegetation must not become low_planter unless a planter condition is classification-grounded.
- A vegetation region must not become hedge_or_shrub only because ORIGINAL makes it look shrub-like.
- A generic physical separation must not become stoop, planter_wall, or usable ledge unless the relevant class/geometry is supported by PIXEL_CLASSIFICATION.

When evidence supports a broader valid class but not a narrower one, use the broader class.

### D. PRIMARY SNAPSHOT CONSISTENCY

Before scoring, explicitly resolve the whole-scene categorical structure once.

All downstream scores must use that same resolved Primary Snapshot.

Do not independently reinterpret the same morphology for Greenery, Framing, Identity, Attachment, and Dependence.

## RELIABILITY REFINEMENT — SCORE BOUNDARY RULES

When a case lies between two adjacent rubric levels, use these operational tie-break rules.

### EYE-LEVEL GREENERY — 3 VERSUS 4

Use 3 when:
- greenery is clearly present but remains secondary across the overall pedestrian-facing scene; or
- greenery is concentrated mainly on one side while hardscape / roadway / building mass dominates the whole scene; or
- most greenery is overhead or low ground cover without repeatedly structuring the pedestrian visual field.

Use 4 only when:
- greenery repeatedly occupies or structures a substantial portion of the pedestrian-facing interface across the scene; and
- it contributes more than an isolated or one-sided patch, but is not yet a dominant spatial layer.

Do not informally average a very green side and a non-green side.

### FRAMING — 2 VERSUS 3 VERSUS 4

Use 2 when:
- perceived_hw_ratio = under_enclosed; and
- high sky exposure and strong openness dominate; and
- street-wall continuity is low OR setback openness is high; and
- classified enclosure support is insufficient to create a repeated spatial frame.

Use 3 when:
- the scene remains under_enclosed or asymmetric; but
- at least two classification-grounded framing supports are meaningfully present, such as building vertical presence, street-wall continuity, vegetation enclosure, or lateral edge continuity; and
- these supports create incomplete or interrupted framing rather than a balanced corridor.

Use 4 only when:
- the overall classified scene forms a coherent, balanced frame;
- perceived_hw_ratio is normally human_scale;
- openness and enclosure are in approximate balance across the whole pedestrian-facing scene.

Do not assign 4 simply because one side is strongly framed.

### PLACE IDENTITY — 3 VERSUS 4

Use 3 when:
- a recognizable pattern exists but is fragmented, asymmetric, generic, or weakly differentiated.

Use 4 only when:
- multiple classification-grounded spatial elements combine into a coherent and repeated whole-scene structure with moderate distinctiveness.

Simple contrast between two different sides is not sufficient by itself for 4.

### PLACE ATTACHMENT POTENTIAL — 2 VERSUS 3

Use 2 when:
- supportive classified qualities are sparse and the scene is predominantly exposed, vehicle-dominated, or hardscape-dominated.

Use 3 when:
- one or more real classification-grounded restorative/protective qualities are present;
- they remain limited or clearly outweighed by adverse spatial conditions;
- but they are substantial enough to affect the pedestrian experience.

### PLACE DEPENDENCE POTENTIAL — 1 VERSUS 2

Use 1 when:
- no classified stationary-use affordance is present;
- the space is essentially passage only.

Use 2 only when:
- at least one minimal or incidental stationary-use affordance is classification-grounded.

Landscape buffers, bollards, ordinary ground vegetation, roadway separation, and non-usable planter vegetation do NOT count as stationary-use affordances by themselves.

## RELIABILITY REFINEMENT — ORIGINAL EVIDENCE RECORDING

### ORIGINAL_SECONDARY_CONTRIBUTION

Record only clarification that:
- concerns an element already represented in PIXEL_CLASSIFICATION; and
- is relevant to interpreting a research variable.

Do not record irrelevant descriptive detail such as:
- vehicle brand/type/color;
- flower species;
- decorative façade texture;
- architectural style labels;
unless such detail is required to clarify an already-classified research-relevant spatial property.


### STRICT MINIMAL SECONDARY CONTRIBUTION RULE — v3.2-RC1

original_secondary_contribution is an audit record, NOT a descriptive summary of ORIGINAL.

Default value:
- Return "None" unless ORIGINAL provides a necessary, research-relevant clarification of an element already represented in PIXEL_CLASSIFICATION.

A non-"None" contribution is allowed only when ORIGINAL resolves a specific ambiguity involving:
- depth or perspective;
- overhead versus eye-level position;
- three-dimensional relationship;
- thickness or usability of an already-classified ledge / stoop / planter wall / seating edge;
- perspective interpretation of an already-classified building / sky / gap / edge;
- another property of an already-classified element that is necessary to interpret a study variable.

Do NOT record:
- flower species;
- season;
- leafless / deciduous species description unless it is strictly necessary to resolve overhead-versus-eye-level geometry;
- stone / glass / façade material names unless materiality is itself necessary to clarify an already-classified spatial property;
- vehicle type, color, brand, or taxi identity;
- architectural style;
- generic descriptive detail that does not alter or resolve the research interpretation.

If:
- no final score changes from primary;
- no research-relevant ambiguity is resolved;
- confidence does not materially depend on ORIGINAL;
- uncertainty remains "None";

then original_secondary_contribution MUST be "None".

When non-"None", write the minimum necessary generic morphological clarification only.
Example:
"ORIGINAL clarifies that the already-classified vegetation is predominantly overhead rather than occupying the eye-level pedestrian field."

Do not mention real places, landmarks, institutions, building names, flower species, vehicle types, season, or decorative materials.

### ORIGINAL_ONLY_OBSERVATIONS

This field is NOT a general description of everything visible only in ORIGINAL.

Record only a scoring-relevant semantic feature that:
1. is visible in ORIGINAL;
2. is absent, merged, or unresolved in PIXEL_CLASSIFICATION; and
3. would potentially affect one of the study variables if it had been properly classified.

Examples that may be relevant:
- bench or seating object;
- usable seating edge;
- stoop;
- planter wall;
- low wall or ledge;
- yard;
- barrier;
- missing vegetation layer;
- another missing stationary-use or edge-interface class.

Do NOT record:
- taxi/car color or type;
- flower species;
- generic road-marking detail;
- stone/glass material names;
- decorative façade details;
- other non-scoring descriptive detail.

If no scoring-relevant Original-only feature exists, return "None".

### CLASSIFICATION_LIMITATIONS CONSISTENCY

If original_only_observations contains a scoring-relevant missing/merged feature, classification_limitations must describe the corresponding missing/merged/ambiguous class and must not be "None".

If original_only_observations = "None", classification_limitations may still report independent segmentation limitations.

## LOCATION / IDENTITY PROHIBITION

Never name, infer, recognize, or speculate about:
- city;
- street;
- neighborhood;
- landmark;
- institution;
- building name;
- project/site identity.

This prohibition applies even when the site appears visually recognizable.

Use generic morphological descriptions only, such as:
"large stone building mass" or "institutional-scale building mass".

Naming a real location, landmark, institution, or building is an evidence-hierarchy violation.

## RELIABILITY SELF-CHECK

Before returning JSON, additionally confirm:

1. The whole-scene aggregation rule was applied consistently.
2. A single-value category was not chosen merely from one visually salient side.
3. edge_type follows the deterministic edge selection rule.
4. Adjacent rubric levels were resolved using the explicit boundary rules above.
5. original_only_observations contains only scoring-relevant missing/merged semantic features.
6. classification_limitations is consistent with original_only_observations.
7. No city, street, neighborhood, landmark, institution, building name, or site identity appears anywhere in the output.
8. If any of Rules 1–7 were violated but can be repaired, repair the output before returning it.
9. If an unresolved violation remains, set audit_status = "review_required".

## FINAL SELF-AUDIT

Before returning JSON:

1. Confirm all *_score_primary values came from PIXEL_CLASSIFICATION.
2. Confirm all categorical outputs remain classification-grounded.
3. Confirm Original-only semantic features did not alter any score.
4. If a final score differs from primary, confirm the reason is clarification of an already-classified element.
5. Set original_only_evidence_used_for_score = false.
6. If a violation occurred but can be repaired, restore the final score to primary and report it in score_change_summary.
7. If unresolved, set audit_status to "review_required".

Follow the Structured Output schema exactly.`;

export const V31_USER_PROMPT = `# USER PROMPT — PIXEL-CLASSIFICATION-PRIMARY STREETSCAPE EVALUATION v3.1

Analyze the two uploaded images as one integrated case.

PRIMARY:
IMG_###_PIXEL_CLASSIFICATION

SECONDARY:
IMG_###_ORIGINAL

Use the shared IMG_### prefix as image_id when available.

Establish the primary snapshot from PIXEL_CLASSIFICATION first. Then use ORIGINAL only under the secondary-reference rules in the System Instructions.

# 1. EYE-LEVEL GREENERY

Identify vegetation types supported by PIXEL_CLASSIFICATION:
- low_planter
- hedge_or_shrub
- low_tree
- tree_canopy
- vertical_green_wall
- ground_vegetation
- other
- none

Classify greenery_vertical_position:
- below_eye_level
- within_eye_level
- above_eye_level
- mixed
- uncertain

Evaluate classified vegetation relative to pedestrian circulation, sidewalk, roadway, building/property edge, continuity, fragmentation, framing, buffering, and overhead versus eye-level position.

## Eye-Level Greenery Visual Dominance Score

1 — Negligible
No meaningful vegetation occupies the pedestrian visual field.

2 — Very Low
Only isolated or minimal greenery is visible and it has negligible influence on pedestrian visual experience.

3 — Low
Vegetation is clearly visible but remains secondary to buildings, roadway, pavement, or other hardscape.

4 — Moderate
Vegetation repeatedly contributes to the pedestrian visual field but does not strongly structure the spatial experience.

5 — High
Eye-level greenery occupies a substantial portion of the pedestrian edge and noticeably influences the walking environment.

6 — Very High
Eye-level vegetation is extensive or continuous and strongly frames, buffers, or structures pedestrian circulation.

7 — Dominant
Eye-level vegetation is one of the primary spatial layers defining the pedestrian environment.

Do not assign a high score solely because extensive overhead tree canopy exists.

Produce eye_level_greenery_score_primary from PIXEL_CLASSIFICATION.
The final eye_level_greenery_score defaults to primary.

# 2. EDGE EFFECT / INTERFACE

Evaluate:
Building / Property → Transitional Edge → Pedestrian Space → Roadway

barrier_present:
- present
- absent
- uncertain

edge_type:
- stoop
- yard
- planter_wall
- low_wall_or_ledge
- landscape_buffer
- bollard_or_physical_barrier
- direct_facade_sidewalk
- none
- uncertain

buffering_quality:
- low
- medium
- high
- uncertain

lingering_affordance:
- low
- medium
- high
- uncertain

Reason from classified edge relationships, pedestrian-roadway separation, buffer continuity, semi-private transition, usable edge, and classified stationary-use affordances.

If a bench/seating object appears only in ORIGINAL and is not represented in PIXEL_CLASSIFICATION, it must not raise lingering_affordance or Place Dependence.

# 3. STREET CANYON ENCLOSURE

Evaluate from classified building, sky, roadway, pedestrian surface, open gaps, vegetation, and lateral edge continuity:

street_wall_continuity:
- low
- medium
- high
- uncertain

building_vertical_presence:
- low
- medium
- high
- uncertain

sky_exposure:
- low
- medium
- high
- uncertain

setback_openness:
- low
- medium
- high
- uncertain

vegetation_enclosure:
- low
- medium
- high
- uncertain

perceived_hw_ratio:
- under_enclosed
- human_scale
- deep_canyon
- uncertain

under_enclosed:
Broad sky exposure, weak street-wall continuity, substantial gaps, wide horizontal space, or strong setback openness dominate.

human_scale:
Building mass, vegetation, horizontal street space, and lateral edges form a balanced and legible frame. This is conceptual only; do not claim an exact H/W measurement.

deep_canyon:
Strong/continuous vertical building mass, limited sky exposure, limited lateral gaps, and constrained horizontal space strongly frame the street.

## Framing Score

1 — Extremely Weak
Almost no meaningful spatial framing.

2 — Weak
Substantial openness with weak edge continuity and limited enclosure.

3 — Moderately Weak
Some enclosing elements exist, but framing is incomplete, asymmetric, or strongly interrupted.

4 — Balanced
A coherent but moderate spatial frame exists.

5 — Moderately Strong
Classified building mass, vegetation, or continuous edges clearly define the street corridor.

6 — Strong
Continuous vertical and lateral elements strongly frame the street with relatively limited openness.

7 — Very Strong / Deep Canyon
Continuous vertical surfaces dominate and strongly constrain the perceived street volume.

Produce framing_score_primary from PIXEL_CLASSIFICATION.
The final framing_score defaults to primary.

# 4. SENSE OF PLACE

These are visible spatial/morphological support potentials.

## Place Identity Score

1 — Very Weak
Highly fragmented or spatially incoherent classified morphology.

2 — Weak
Few distinctive classified spatial relationships and weak coherence.

3 — Moderately Weak
Some recognizable spatial pattern exists but remains weak, fragmented, or poorly differentiated.

4 — Moderate
A coherent spatial structure is identifiable with moderate distinctiveness.

5 — Strong
Multiple classified spatial elements create a recognizable differentiated morphological identity.

6 — Very Strong
Strong coherence and distinctive relationships among built form, landscape, edge, and pedestrian space.

7 — Exceptional
Highly coherent and strongly differentiated classified spatial configuration.

Do not use Original-only architectural details to raise the score.

Produce place_identity_score_primary from PIXEL_CLASSIFICATION.
Final defaults to primary.

## Place Attachment Potential Score

1 — Very Weak
Highly exposed, harsh, vehicle-dominated classified structure with almost no restorative support.

2 — Weak
Few classified elements support comfort, protection, or restoration.

3 — Moderately Weak
Some supportive classified qualities exist but remain limited, fragmented, or outweighed.

4 — Moderate
Balanced classified greenery, protection, and spatial comfort.

5 — Strong
Multiple classified features support greenery exposure, shelter, separation, or restorative experience.

6 — Very Strong
Substantial classified spatial support for comfort, restoration, and repeated positive occupation.

7 — Exceptional
Restorative spatial qualities strongly structure the classified pedestrian environment.

Do not infer actual emotional attachment.

Produce place_attachment_score_primary from PIXEL_CLASSIFICATION.
Final defaults to primary.

## Place Dependence Potential Score

1 — Passage Only
Almost no classified support for staying.

2 — Very Weak
Only minimal/incidental classified stationary-use affordances.

3 — Weak
Some classified opportunities but limited, exposed, fragmented, or weakly supported.

4 — Moderate
Some stationary activities are supported in addition to movement.

5 — Strong
Several useful classified affordances support sitting, stopping, waiting, or gathering.

6 — Very Strong
Classified pedestrian space, edge, seating, landscape, and buffering strongly support prolonged occupation.

7 — Exceptional
Multiple complementary classified conditions strongly support lingering/social occupation.

Original-only seating must not change this score.

Produce place_dependence_score_primary from PIXEL_CLASSIFICATION.
Final defaults to primary.

# CONFIDENCE

Use:
- low
- medium
- high

Confidence reflects PIXEL_CLASSIFICATION evidence sufficiency.



# RELIABILITY EXECUTION RULES

Apply these rules after the original v3.1 rubric and before producing JSON.

1. Resolve one whole-scene Primary Snapshot from PIXEL_CLASSIFICATION and reuse it for all downstream scores.
2. For single-value edge_type, use the longest/most-continuous pedestrian-facing classified interface; if no edge clearly dominates, use "uncertain".
3. For low/medium/high scene variables, use "medium" for genuine mixed/asymmetric whole-scene conditions rather than switching between opposing sides.
4. Use conservative semantic specificity: do not add low_planter, hedge_or_shrub, stoop, planter_wall, seating edge, or other specific class unless PIXEL_CLASSIFICATION supports it.
5. Apply the System Instruction boundary rules for Greenery 3/4, Framing 2/3/4, Identity 3/4, Attachment 2/3, and Dependence 1/2.
6. A landscape buffer, bollards, ordinary vegetation, or roadway separation alone does not create stationary-use affordance.
7. original_only_observations must contain only scoring-relevant missing/merged semantic features. Otherwise return "None".
8. If original_only_observations identifies a scoring-relevant missing/merged feature, classification_limitations must describe that corresponding limitation.
9. Do not mention or guess any real place, city, street, landmark, institution, or building name anywhere in the JSON.
10. Do not use irrelevant Original-only descriptive details such as vehicle type/color, flower species, or façade material as analytical evidence.


11. original_secondary_contribution defaults to "None". Use a non-"None" value only when ORIGINAL resolves a necessary research-relevant ambiguity about an already-classified element. It is not a general description of ORIGINAL.
12. If all Primary scores equal Final scores, confidence is not materially changed by ORIGINAL, and no research-relevant ambiguity is resolved, return original_secondary_contribution = "None".
13. Never include flower species, season, vehicle details, decorative material names, landmark/building identity, or other non-scoring description in original_secondary_contribution.

# SECONDARY RECORD

original_secondary_contribution:
Describe only permitted clarification supplied by ORIGINAL, or "None".

original_only_observations:
List relevant features visible only in ORIGINAL and therefore excluded from scoring, or "None".

classification_limitations:
Report missing/merged/ambiguous classes or conflicts, or "None".

score_change_summary:
If no final numeric score changed from primary, return "None".
If a final score changed, name the score, primary value, final value, and the already-classified element clarified by ORIGINAL.

original_only_evidence_used_for_score:
Must be false.

audit_status:
Use "pass" unless unresolved evidence-hierarchy problems require "review_required".

uncertainty:
Return "None" if no additional uncertainty remains.

Return only the Structured Output JSON.`;

export const V31_RESPONSE_SCHEMA = {
  "type": Type.OBJECT,
  "properties": {
    "image_id": {
      "type": Type.STRING
    },
    "primary_evidence_summary": {
      "type": Type.STRING
    },
    "greenery_types": {
      "type": Type.ARRAY,
      "items": {
        "type": Type.STRING,
        "enum": [
          "low_planter",
          "hedge_or_shrub",
          "low_tree",
          "tree_canopy",
          "vertical_green_wall",
          "ground_vegetation",
          "other",
          "none"
        ]
      }
    },
    "greenery_vertical_position": {
      "type": Type.STRING,
      "enum": [
        "below_eye_level",
        "within_eye_level",
        "above_eye_level",
        "mixed",
        "uncertain"
      ]
    },
    "eye_level_greenery_score_primary": {
      "type": Type.INTEGER,
      "minimum": 1,
      "maximum": 7
    },
    "eye_level_greenery_score": {
      "type": Type.INTEGER,
      "minimum": 1,
      "maximum": 7
    },
    "eye_level_greenery_rationale": {
      "type": Type.STRING
    },
    "greenery_confidence": {
      "type": Type.STRING
    },
    "barrier_present": {
      "type": Type.STRING,
      "enum": [
        "present",
        "absent",
        "uncertain"
      ]
    },
    "edge_type": {
      "type": Type.STRING,
      "enum": [
        "stoop",
        "yard",
        "planter_wall",
        "low_wall_or_ledge",
        "landscape_buffer",
        "bollard_or_physical_barrier",
        "direct_facade_sidewalk",
        "none",
        "uncertain"
      ]
    },
    "edge_spatial_relationship": {
      "type": Type.STRING
    },
    "buffering_quality": {
      "type": Type.STRING,
      "enum": [
        "low",
        "medium",
        "high",
        "uncertain"
      ]
    },
    "lingering_affordance": {
      "type": Type.STRING,
      "enum": [
        "low",
        "medium",
        "high",
        "uncertain"
      ]
    },
    "edge_effect_rationale": {
      "type": Type.STRING
    },
    "edge_confidence": {
      "type": Type.STRING
    },
    "street_wall_continuity": {
      "type": Type.STRING,
      "enum": [
        "low",
        "medium",
        "high",
        "uncertain"
      ]
    },
    "building_vertical_presence": {
      "type": Type.STRING,
      "enum": [
        "low",
        "medium",
        "high",
        "uncertain"
      ]
    },
    "sky_exposure": {
      "type": Type.STRING,
      "enum": [
        "low",
        "medium",
        "high",
        "uncertain"
      ]
    },
    "setback_openness": {
      "type": Type.STRING,
      "enum": [
        "low",
        "medium",
        "high",
        "uncertain"
      ]
    },
    "vegetation_enclosure": {
      "type": Type.STRING,
      "enum": [
        "low",
        "medium",
        "high",
        "uncertain"
      ]
    },
    "perceived_hw_ratio": {
      "type": Type.STRING,
      "enum": [
        "under_enclosed",
        "human_scale",
        "deep_canyon",
        "uncertain"
      ]
    },
    "framing_score_primary": {
      "type": Type.INTEGER,
      "minimum": 1,
      "maximum": 7
    },
    "framing_score": {
      "type": Type.INTEGER,
      "minimum": 1,
      "maximum": 7
    },
    "enclosure_rationale": {
      "type": Type.STRING
    },
    "enclosure_confidence": {
      "type": Type.STRING
    },
    "place_identity_score_primary": {
      "type": Type.INTEGER,
      "minimum": 1,
      "maximum": 7
    },
    "place_identity_score": {
      "type": Type.INTEGER,
      "minimum": 1,
      "maximum": 7
    },
    "place_identity_rationale": {
      "type": Type.STRING
    },
    "place_identity_confidence": {
      "type": Type.STRING
    },
    "place_attachment_score_primary": {
      "type": Type.INTEGER,
      "minimum": 1,
      "maximum": 7
    },
    "place_attachment_score": {
      "type": Type.INTEGER,
      "minimum": 1,
      "maximum": 7
    },
    "place_attachment_rationale": {
      "type": Type.STRING
    },
    "place_attachment_confidence": {
      "type": Type.STRING
    },
    "place_dependence_score_primary": {
      "type": Type.INTEGER,
      "minimum": 1,
      "maximum": 7
    },
    "place_dependence_score": {
      "type": Type.INTEGER,
      "minimum": 1,
      "maximum": 7
    },
    "place_dependence_rationale": {
      "type": Type.STRING
    },
    "place_dependence_confidence": {
      "type": Type.STRING
    },
    "original_secondary_contribution": {
      "type": Type.STRING
    },
    "original_only_observations": {
      "type": Type.STRING
    },
    "classification_limitations": {
      "type": Type.STRING
    },
    "score_change_summary": {
      "type": Type.STRING
    },
    "original_only_evidence_used_for_score": {
      "type": Type.BOOLEAN
    },
    "audit_status": {
      "type": Type.STRING
    },
    "uncertainty": {
      "type": Type.STRING
    }
  },
  "required": [
    "image_id",
    "primary_evidence_summary",
    "greenery_types",
    "greenery_vertical_position",
    "eye_level_greenery_score_primary",
    "eye_level_greenery_score",
    "eye_level_greenery_rationale",
    "greenery_confidence",
    "barrier_present",
    "edge_type",
    "edge_spatial_relationship",
    "buffering_quality",
    "lingering_affordance",
    "edge_effect_rationale",
    "edge_confidence",
    "street_wall_continuity",
    "building_vertical_presence",
    "sky_exposure",
    "setback_openness",
    "vegetation_enclosure",
    "perceived_hw_ratio",
    "framing_score_primary",
    "framing_score",
    "enclosure_rationale",
    "enclosure_confidence",
    "place_identity_score_primary",
    "place_identity_score",
    "place_identity_rationale",
    "place_identity_confidence",
    "place_attachment_score_primary",
    "place_attachment_score",
    "place_attachment_rationale",
    "place_attachment_confidence",
    "place_dependence_score_primary",
    "place_dependence_score",
    "place_dependence_rationale",
    "place_dependence_confidence",
    "original_secondary_contribution",
    "original_only_observations",
    "classification_limitations",
    "score_change_summary",
    "original_only_evidence_used_for_score",
    "audit_status",
    "uncertainty"
  ]
};

const MAX_INFERENCE_ATTEMPTS = 5;
const RETRY_BASE_DELAY_MS = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorStatus(err: any): number | undefined {
  const candidates = [
    err?.status,
    err?.code,
    err?.error?.status,
    err?.error?.code,
    err?.response?.status,
    err?.cause?.status,
    err?.cause?.code,
  ];

  for (const value of candidates) {
    if (typeof value === "number") return value;
    if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  }

  const message = String(err?.message || err || "");
  const match = message.match(/(?:code|status)["':\s]+(408|429|5\d\d)/i)
    || message.match(/\b(408|429|5\d\d)\b/);

  return match ? Number(match[1]) : undefined;
}

function isTransientInferenceError(err: any): boolean {
  const status = getErrorStatus(err);
  const message = String(err?.message || err || "").toLowerCase();

  if (status === 408 || status === 429 || (status !== undefined && status >= 500 && status <= 599)) {
    return true;
  }

  return (
    message.includes("high demand") ||
    message.includes("service unavailable") ||
    message.includes("unavailable") ||
    message.includes("temporarily overloaded") ||
    message.includes("timeout") ||
    message.includes("timed out")
  );
}

export async function evaluateStreetscapeV31(params: {
  imageId: string;
  pixelClassificationBase64: string;
  pixelClassificationMimeType: string;
  originalBase64: string;
  originalMimeType: string;
}): Promise<{ evaluation: VlmStreetscapeEvaluationV31; rawText: string; modelUsed: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required on the server.");
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      }
    }
  });

  const model = "gemma-4-31b-it";

  const cleanBase64 = (b64: string) => {
    if (b64.includes(",")) {
      return b64.split(",")[1];
    }
    return b64;
  };

  const primaryImagePart = {
    inlineData: {
      mimeType: params.pixelClassificationMimeType || "image/png",
      data: cleanBase64(params.pixelClassificationBase64),
    }
  };

  const secondaryImagePart = {
    inlineData: {
      mimeType: params.originalMimeType || "image/jpeg",
      data: cleanBase64(params.originalBase64),
    }
  };

  const primaryLabelText = {
    text: `PRIMARY ANALYTICAL EVIDENCE: ${params.imageId}_PIXEL_CLASSIFICATION`
  };

  const secondaryLabelText = {
    text: `SECONDARY CLARIFICATION REFERENCE: ${params.imageId}_ORIGINAL`
  };

  const promptTextPart = {
    text: V31_USER_PROMPT
  };

  // Research protocol remains one completed inference with both images.
  // Retries below occur ONLY when the API returns a transient failure and
  // produces no usable model result. No fallback model is ever used.
  const contents = {
    parts: [
      primaryLabelText,
      primaryImagePart,
      secondaryLabelText,
      secondaryImagePart,
      promptTextPart
    ]
  };

  let lastError: any = null;

  for (let attempt = 1; attempt <= MAX_INFERENCE_ATTEMPTS; attempt++) {
    try {
      console.log(
        `[VLM v3.1] Calling ${model} for ${params.imageId} ` +
        `(attempt ${attempt}/${MAX_INFERENCE_ATTEMPTS})`
      );

      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: V31_SYSTEM_INSTRUCTION,
          temperature: 1.0,
          topP: 0.95,
          topK: 64,
          seed: 42,
          maxOutputTokens: 8192,
          mediaResolution: MediaResolution.MEDIA_RESOLUTION_HIGH,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH
          },
          responseMimeType: "application/json",
          responseSchema: V31_RESPONSE_SCHEMA,
        }
      });

      const rawText = response.text || "{}";
      const parsed: VlmStreetscapeEvaluationV31 = JSON.parse(rawText);

      if (!parsed.image_id || parsed.image_id.trim() === "") {
        parsed.image_id = params.imageId;
      }

      console.log(
        `[VLM v3.1] Inference successful with ${model} on attempt ${attempt}. ` +
        `Raw length: ${rawText.length}`
      );

      return {
        evaluation: parsed,
        rawText,
        modelUsed: model
      };
    } catch (err: any) {
      lastError = err;

      if (!isTransientInferenceError(err)) {
        console.error(
          `[VLM v3.1] Non-retryable inference error for ${params.imageId}:`,
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
        `[VLM v3.1] Transient API error for ${params.imageId} ` +
        `(status ${getErrorStatus(err) ?? "unknown"}). ` +
        `Retrying same Gemma model in ${Math.round(waitMs / 1000)}s...`
      );

      await sleep(waitMs);
    }
  }

  const status = getErrorStatus(lastError);
  throw new Error(
    `Gemma 4 31B is temporarily unavailable after ${MAX_INFERENCE_ATTEMPTS} attempts` +
    `${status ? ` (HTTP ${status})` : ""}. ` +
    `No fallback model was used. Please wait briefly and run the same case again.`
  );
}