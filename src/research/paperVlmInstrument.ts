import type {
  PaperVlmInstrumentFieldId,
  PaperVlmPaperVariableId,
  PaperVlmRungProbabilities,
  PaperVlmValidationDescriptor,
} from '../types';

/**
 * Paper VLM Instrument v0.3
 * ---------------------------------------------------------------------------
 * Research purpose:
 * - Preserve the team's one-field-at-a-time Qwen measurement scaffold.
 * - Map each perceptual field to the current paper-variable system; legacy Teacher 8/31 lineage is retained only where instrument provenance requires it.
 * - Keep measurement separate from downstream deterministic I/Y/D/A_i/M_i/F_i.
 *
 * IMPORTANT:
 * - These rungs are concise TypeScript operationalizations of the team's
 *   current seven-step scales. They preserve the same monotone constructs
 *   without turning this file into a copy of the Python source.
 * - sky_openness is an image-based openness proxy, NOT true whole-sky SVF.
 * - H/W, Choice, Integration, GWR coefficients, lambda and t_base are NOT VLM
 *   outputs.
 */

export const PAPER_VLM_INSTRUMENT_VERSION = 'qwen_7_rung_v0.3' as const;

export interface PaperVlmInstrumentFieldSpec {
  fieldId: PaperVlmInstrumentFieldId;
  paperVariable: PaperVlmPaperVariableId;
  displayName: string;
  constructDefinition: string;
  rungs: readonly [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
  ];
  validation: PaperVlmValidationDescriptor;
  paperUseNote?: string;
}

export const PAPER_VLM_INSTRUMENT_FIELDS: readonly PaperVlmInstrumentFieldSpec[] = [
  {
    fieldId: 'vertical_greenery',
    paperVariable: 'V_nat',
    displayName: 'Vertical Greenery',
    constructDefinition:
      'Amount of above-ground vegetation occupying the visible frontage, including canopy, green facade and hedge-wall elements.',
    rungs: [
      'No visible vertical greenery.',
      'Only isolated sparse greenery.',
      'Scattered greenery on part of the frontage.',
      'Greenery occupies about half the frontage.',
      'Greenery is nearly continuous along the frontage.',
      'Dense canopy plus substantial vertical greenery.',
      'Greenery dominates almost the entire visible frontage.',
    ],
    validation: {
      strength: 'strong',
      measured_twin: 'vegetation share over the visible arc',
      notes:
        'Use segmentation only as a validation arm; do not substitute the pixel fraction for the VLM instrument score.',
    },
  },

  {
    fieldId: 'vertical_hardscape',
    paperVariable: 'V_built',
    displayName: 'Vertical Hardscape',
    constructDefinition:
      'Visible built vertical surface on the single frontage contained in the 90° view.',
    rungs: [
      'Almost no built vertical surface.',
      'Mostly open view with only a small built element.',
      'Built frontage occupies a limited portion.',
      'Built frontage occupies about half the view.',
      'Tall frontage occupies most of the view.',
      'Nearly continuous tall built surface.',
      'Built surface dominates essentially the whole view.',
    ],
    validation: {
      strength: 'moderate',
      measured_twin: 'building share over the visible arc',
    },
    paperUseNote:
      'Do not reinterpret this field as numerical H/W; exact H/W remains GIS / geometry.',
  },

  {
    fieldId: 'green_eye_level',
    paperVariable: 'GVI_eye',
    displayName: 'Eye-Level Greenery',
    constructDefinition:
      'Extent of greenery around or below standing eye level along the visible frontage.',
    rungs: [
      'No eye-level greenery.',
      'Only a barely noticeable trace.',
      'Small intermittent patches.',
      'Present along about half the frontage.',
      'Present along most of the frontage.',
      'Present along nearly all the frontage.',
      'Continuous layered eye-level greenery.',
    ],
    validation: {
      strength: 'strong',
      measured_twin: 'vegetation below the horizon / eye-level band',
    },
    paperUseNote:
      'Treat as the standardized VLM eye-level/foveal instrument, not as an exact geometric pixel percentage.',
  },

  {
    fieldId: 'sky_openness',
    paperVariable: 'sky_openness_proxy',
    displayName: 'Sky Openness Proxy',
    constructDefinition:
      'Amount of visible sky in the standardized perspective frame.',
    rungs: [
      'Almost no sky is visible.',
      'Only a very narrow sky strip.',
      'A small amount of sky.',
      'Moderate visible sky.',
      'A large amount of visible sky.',
      'Sky occupies most of the upper view.',
      'The view is broadly open to sky.',
    ],
    validation: {
      strength: 'moderate',
      measured_twin: 'visible sky-band share',
      notes:
        'A perspective-frame sky measure is not equivalent to a true hemispherical Sky View Factor.',
    },
    paperUseNote:
      'If used for enclosure, apply an explicitly documented proxy transformation; do not label it true SVF.',
  },

  {
    fieldId: 'walkable_ground',
    paperVariable: 'V_pave',
    displayName: 'Walkable Ground',
    constructDefinition:
      'Longitudinal extent of clear, usable sidewalk on the visible side; obstructions reduce usable extent.',
    rungs: [
      'No usable clear sidewalk.',
      'Only a trace remains unobstructed.',
      'Clear sidewalk exists along a small portion.',
      'Clear sidewalk spans about half the frontage.',
      'Clear sidewalk spans most of the frontage.',
      'Clear sidewalk spans nearly all of it.',
      'Clear sidewalk is continuous along the whole frontage.',
    ],
    validation: {
      strength: 'weak',
      measured_twin: 'sidewalk / curb-edge evidence over the visible arc',
      notes:
        'Street-view framing and occlusion can weaken this measurement; keep validation status visible.',
    },
  },

  {
    fieldId: 'green_softening',
    paperVariable: 'GMI',
    displayName: 'Green Mitigation Interaction',
    constructDefinition:
      'Observable extent of greenery positioned in front of and visually covering lower building surfaces.',
    rungs: [
      'Building surface is essentially bare.',
      'Only a trace of greenery overlaps the facade.',
      'Greenery overlaps a small facade portion.',
      'Greenery overlaps about half the facade.',
      'Greenery overlaps most of the facade.',
      'Greenery overlaps nearly all visible facade.',
      'Greenery almost completely masks the building surface.',
    ],
    validation: {
      strength: 'construct_validation_pending',
      notes:
        'The revised scaffold is more observable, but no direct segmentation twin establishes the interaction construct itself.',
    },
  },

  {
    fieldId: 'signage_detail',
    paperVariable: 'V_sign',
    displayName: 'Signage & Architectural Detail',
    constructDefinition:
      'Visual abundance of signage, lettering, cornices, mouldings and related facade articulation.',
    rungs: [
      'Blank frontage with no meaningful signage or detail.',
      'One minor sign or simple entrance cue.',
      'Occasional signage or detail.',
      'Signage/detail appears along about half the frontage.',
      'Frequent signage or facade articulation.',
      'Dense signage and architectural detail.',
      'Signage, lettering and detail are pervasive.',
    ],
    validation: {
      strength: 'vlm_only_no_pixel_twin',
      notes:
        'Requires visual-semantic or manual validation; no canonical deterministic pixel twin is assumed here.',
    },
  },

  {
    fieldId: 'facade_variation',
    paperVariable: 'SFV',
    displayName: 'Street-Facade Variation',
    constructDefinition:
      'Variation among visible building faces, materials, fenestration rhythms and entrances along the frontage.',
    rungs: [
      'Single uniform facade and repeated pattern.',
      'Uniform facade with a minor material shift.',
      'Two similar building faces.',
      'Several clearly distinct facade faces.',
      'Frequent changes in material, windows or entrances.',
      'Many visibly distinct building faces.',
      'Highly varied faces, materials, windows and entrances.',
    ],
    validation: {
      strength: 'vlm_only_no_pixel_twin',
      notes:
        'This field supplies the SFV variable missing from the teacher Appendix strict JSON, but still needs separate validation.',
    },
  },

  {
    fieldId: 'ground_floor_activity',
    paperVariable: 'GFAPI',
    displayName: 'Ground-Floor Activity / Permeability',
    constructDefinition:
      'Degree of active, glazed, entrance-rich street-level frontage rather than blank sealed wall.',
    rungs: [
      'Continuous blank street-level wall.',
      'Mostly blank with one doorway.',
      'Mostly blank with occasional openings.',
      'Roughly half active/glazed and half blank.',
      'Mostly active glazed frontage.',
      'Nearly continuous active shopfronts and entrances.',
      'Continuous active glazed frontage.',
    ],
    validation: {
      strength: 'vlm_only_no_pixel_twin',
      notes:
        'Keep model confidence separate from construct-validation status.',
    },
  },

  {
    fieldId: 'resting_affordance',
    paperVariable: 'IAS',
    displayName: 'Informal Affordance for Staying',
    constructDefinition:
      'Extent of frontage offering usable places to sit, perch or lean; blocked or anti-sitting elements do not count.',
    rungs: [
      'No usable sitting or leaning affordance.',
      'Only one minimal perch or step.',
      'Resting opportunities along a small portion.',
      'Resting opportunities along about half the frontage.',
      'Resting opportunities along most of the frontage.',
      'Resting opportunities along nearly all of it.',
      'Continuous resting opportunities along the frontage.',
    ],
    validation: {
      strength: 'weak',
      measured_twin: 'stoop / stair / bench-seating evidence when available',
      notes:
        'This remains difficult to observe reliably in a single 90° street-view frame.',
    },
  },
] as const;

export const PAPER_VLM_FIELD_ORDER: readonly PaperVlmInstrumentFieldId[] =
  PAPER_VLM_INSTRUMENT_FIELDS.map((field) => field.fieldId);

export function getPaperVlmInstrumentFieldSpec(
  fieldId: PaperVlmInstrumentFieldId,
): PaperVlmInstrumentFieldSpec {
  const field = PAPER_VLM_INSTRUMENT_FIELDS.find(
    (candidate) => candidate.fieldId === fieldId,
  );

  if (!field) {
    throw new Error(`Unknown Paper VLM instrument field: ${fieldId}`);
  }

  return field;
}

export function normalizePaperVlmExpectedValue(expectedValue: number): number {
  if (!Number.isFinite(expectedValue)) {
    throw new Error('Expected value must be finite.');
  }

  const clamped = Math.min(7, Math.max(1, expectedValue));
  return (clamped - 1) / 6;
}

export function computePaperVlmExpectedValue(
  probabilities: PaperVlmRungProbabilities,
): number {
  const values = [
    probabilities.p1,
    probabilities.p2,
    probabilities.p3,
    probabilities.p4,
    probabilities.p5,
    probabilities.p6,
    probabilities.p7,
  ];

  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error('All rung probabilities must be finite and non-negative.');
  }

  const total = values.reduce((sum, value) => sum + value, 0);

  if (total <= 0) {
    throw new Error('Rung probabilities must contain positive probability mass.');
  }

  return values.reduce(
    (sum, value, index) => sum + (value / total) * (index + 1),
    0,
  );
}

export function buildPaperVlmFieldPrompt(
  fieldId: PaperVlmInstrumentFieldId,
): string {
  const spec = getPaperVlmInstrumentFieldSpec(fieldId);

  const rungText = spec.rungs
    .map((description, index) => `${index + 1} = ${description}`)
    .join('\n');

  return [
    'You are an expert urban morphologist evaluating a standardized Manhattan street-view image at eye level (1.5 m).',
    '',
    `Evaluate ONLY this field: ${spec.displayName} (${spec.fieldId}).`,
    spec.constructDefinition,
    '',
    'Use the full 1–7 scale below. Do not score any other field.',
    rungText,
    '',
    `Return exactly one JSON object: {"${spec.fieldId}": <1-7>}`,
  ].join('\n');
}