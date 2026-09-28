/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AUTHORITATIVE SEGMENTATION TAXONOMY
 * Vision Model → Segmentation Taxonomy v1.5.7.1 SHARE-READY AUDITED
 *
 * Mapping remains deterministic exact_rgb.
 */

export type V33TaxonomyStatus =
  | 'not_configured'
  | 'configured'
  | 'invalid';

export type V33PixelMappingMode =
  | 'exact_rgb';

export type V33ResearchPixelGroup =
  | 'natural_above_ground'
  | 'built_above_ground'
  | 'vegetation'
  | 'sidewalk'
  | 'paver'
  | 'signboard'
  | 'architectural_detail'
  | 'outdoor_seating'
  | 'parasol'
  | 'planter'
  | 'street_furniture';

export const ALLOWED_RESEARCH_PIXEL_GROUPS: ReadonlySet<V33ResearchPixelGroup> =
  new Set([
    'natural_above_ground',
    'built_above_ground',
    'vegetation',
    'sidewalk',
    'paver',
    'signboard',
    'architectural_detail',
    'outdoor_seating',
    'parasol',
    'planter',
    'street_furniture',
  ]);

export interface V33TaxonomyClass {
  class_id: string;
  label: string;
  rgb: [number, number, number];
  research_groups: V33ResearchPixelGroup[];
  description?: string;
}

export interface V33SegmentationTaxonomy {
  taxonomy_id: string;
  taxonomy_version: string;
  source_description: string;
  mapping_mode: 'exact_rgb';
  classes: V33TaxonomyClass[];
}

export interface V33TaxonomyValidationResult {
  status: V33TaxonomyStatus;
  valid: boolean;
  errors: string[];
  warnings: string[];
  taxonomy?: V33SegmentationTaxonomy;
}

export function validateV33Taxonomy(input: unknown): V33TaxonomyValidationResult {
  if (input === null || input === undefined) {
    return {
      status: 'not_configured',
      valid: false,
      errors: ['No taxonomy provided.'],
      warnings: [],
    };
  }

  if (typeof input !== 'object' || Array.isArray(input)) {
    return {
      status: 'invalid',
      valid: false,
      errors: ['Taxonomy configuration must be a JSON object.'],
      warnings: [],
    };
  }

  const raw = input as Record<string, any>;
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof raw.taxonomy_id !== 'string' || raw.taxonomy_id.trim() === '') {
    errors.push('Missing or invalid taxonomy_id.');
  }

  if (typeof raw.taxonomy_version !== 'string' || raw.taxonomy_version.trim() === '') {
    errors.push('Missing or invalid taxonomy_version.');
  }

  if (raw.mapping_mode !== 'exact_rgb') {
    errors.push('Only exact_rgb mapping is supported.');
  }

  if (!Array.isArray(raw.classes) || raw.classes.length === 0) {
    errors.push('classes must be a non-empty array.');
  } else {
    const seenIds = new Set<string>();
    const seenRgb = new Map<string, string>();

    raw.classes.forEach((c: any, index: number) => {
      const prefix = `Class[${index}]`;

      if (!c || typeof c !== 'object') {
        errors.push(`${prefix}: invalid class object.`);
        return;
      }

      const id = String(c.class_id ?? '').trim();

      if (!id) {
        errors.push(`${prefix}: missing class_id.`);
      } else {
        const key = id.toLowerCase();
        if (seenIds.has(key)) {
          errors.push(`${prefix}: duplicate class_id "${id}".`);
        }
        seenIds.add(key);
      }

      if (typeof c.label !== 'string' || !c.label.trim()) {
        errors.push(`${prefix}: missing label.`);
      }

      if (!Array.isArray(c.rgb) || c.rgb.length !== 3) {
        errors.push(`${prefix}: rgb must be [R,G,B].`);
      } else {
        const [r, g, b] = c.rgb;
        const valid = [r, g, b].every(
          (value) => Number.isInteger(value) && value >= 0 && value <= 255
        );

        if (!valid) {
          errors.push(`${prefix}: invalid RGB.`);
        } else {
          const rgbKey = `${r},${g},${b}`;
          if (seenRgb.has(rgbKey)) {
            errors.push(
              `${prefix}: duplicate RGB [${rgbKey}], already used by "${seenRgb.get(rgbKey)}".`
            );
          }
          seenRgb.set(rgbKey, id);
        }
      }

      if (!Array.isArray(c.research_groups)) {
        errors.push(`${prefix}: research_groups must be an array.`);
      } else {
        let hasNatural = false;
        let hasBuilt = false;

        c.research_groups.forEach((g: string) => {
          if (!ALLOWED_RESEARCH_PIXEL_GROUPS.has(g as V33ResearchPixelGroup)) {
            errors.push(`${prefix}: unknown research group "${g}".`);
          }
          if (g === 'natural_above_ground') hasNatural = true;
          if (g === 'built_above_ground') hasBuilt = true;
        });

        if (hasNatural && hasBuilt) {
          errors.push(
            `${prefix}: one class cannot be both natural_above_ground and built_above_ground.`
          );
        }
      }
    });
  }

  if (errors.length > 0) {
    return {
      status: 'invalid',
      valid: false,
      errors,
      warnings,
    };
  }

  return {
    status: 'configured',
    valid: true,
    errors: [],
    warnings,
    taxonomy: {
      taxonomy_id: String(raw.taxonomy_id).trim(),
      taxonomy_version: String(raw.taxonomy_version).trim(),
      source_description: String(raw.source_description ?? '').trim(),
      mapping_mode: 'exact_rgb',
      classes: raw.classes.map((c: any) => ({
        class_id: String(c.class_id).trim(),
        label: String(c.label).trim(),
        rgb: [Number(c.rgb[0]), Number(c.rgb[1]), Number(c.rgb[2])],
        research_groups: [...c.research_groups],
        description: c.description ? String(c.description).trim() : undefined,
      })),
    },
  };
}

/**
 * v1.5.7.1 scientific taxonomy:
 * - tree is a unified class (crown + branches + trunk)
 * - traffic_cone_barrel is formal ID 29
 * - upper_building_glazing is ID 28
 */
export const FROZEN_30_CLASS_TAXONOMY: V33SegmentationTaxonomy = {
  taxonomy_id: 'street_interface_v1.5.7.1',
  taxonomy_version: '1.5.7.1',
  source_description:
    'Vision Model Segmentation Taxonomy v1.5.7.1 SHARE-READY AUDITED; authoritative single-image final classification state.',
  mapping_mode: 'exact_rgb',
  classes: [
    {
      class_id: 'other_unknown',
      label: 'Other / Unknown / Unclassified',
      rgb: [0, 0, 0],
      research_groups: [],
      description: 'Visible region not reliably assigned to another scientific class.',
    },
    {
      class_id: 'roadway',
      label: 'Roadway Asphalt / Vehicular Lane',
      rgb: [128, 64, 128],
      research_groups: [],
      description: 'Motor-vehicle travel lanes and visible roadway pavement.',
    },
    {
      class_id: 'sidewalk',
      label: 'Pedestrian Sidewalk / Footpath',
      rgb: [244, 35, 232],
      research_groups: ['sidewalk'],
      description: 'Pedestrian walking surface and public sidewalk paving.',
    },
    {
      class_id: 'bike_lane',
      label: 'Bike Lane / Compatibility Class',
      rgb: [255, 100, 100],
      research_groups: [],
      description: 'Internal compatibility class; v1.5.7.1 final outputs merge bicycle-lane pavement into roadway.',
    },
    {
      class_id: 'curb_edge',
      label: 'Curb Edge / Street Interface Margin',
      rgb: [255, 180, 180],
      research_groups: [],
      description: 'Visible curb face and raised transition between roadway and pedestrian surface.',
    },
    {
      class_id: 'upper_building_facade',
      label: 'Upper Building Facade / Solid Wall',
      rgb: [70, 70, 70],
      research_groups: ['built_above_ground'],
      description: 'Opaque building facade above the ground-floor interface zone.',
    },
    {
      class_id: 'ground_floor_solid_facade',
      label: 'Ground Floor Solid Facade',
      rgb: [110, 80, 70],
      research_groups: ['built_above_ground'],
      description: 'Opaque ground-floor wall or storefront facade.',
    },
    {
      class_id: 'ground_floor_glazing',
      label: 'Ground Floor Glazing / Storefront Window',
      rgb: [0, 220, 255],
      research_groups: ['built_above_ground', 'architectural_detail'],
      description: 'Ground-floor storefront glass, display windows and transparent frontage.',
    },
    {
      class_id: 'door_entrance',
      label: 'Door / Building Entrance Portal',
      rgb: [255, 140, 0],
      research_groups: ['built_above_ground', 'architectural_detail'],
      description: 'Building entrance door, store entrance or doorway opening.',
    },
    {
      class_id: 'signboard',
      label: 'Signboard / Commercial Fascia',
      rgb: [255, 220, 0],
      research_groups: ['signboard'],
      description: 'Storefront signage, fascia or projecting business sign.',
    },
    {
      class_id: 'awning_canopy',
      label: 'Awning / Entrance Canopy',
      rgb: [180, 100, 255],
      research_groups: ['built_above_ground', 'parasol'],
      description: 'Storefront awning, entrance canopy or weather-protection structure.',
    },
    {
      class_id: 'arcade_column',
      label: 'Arcade Column / Pillar Support',
      rgb: [120, 120, 160],
      research_groups: ['built_above_ground', 'architectural_detail'],
      description: 'Column supporting a building-integrated covered pedestrian arcade.',
    },
    {
      class_id: 'arcade_soffit',
      label: 'Arcade Soffit / Covered Walkway Ceiling',
      rgb: [170, 170, 210],
      research_groups: ['built_above_ground', 'architectural_detail'],
      description: 'Underside or ceiling of a building-integrated arcade.',
    },
    {
      class_id: 'sidewalk_shed_scaffold',
      label: 'Sidewalk Shed / Scaffold Structure',
      rgb: [0, 200, 200],
      research_groups: ['built_above_ground'],
      description: 'Temporary construction sidewalk shed or scaffolding structure.',
    },
    {
      class_id: 'stoop_stair',
      label: 'Stoop / Exterior Stair / Steps',
      rgb: [170, 90, 40],
      research_groups: ['built_above_ground', 'architectural_detail'],
      description: 'Exterior entrance steps and stoops.',
    },
    {
      class_id: 'wall_ledge',
      label: 'Wall Ledge / Low Retaining Wall',
      rgb: [150, 120, 80],
      research_groups: ['built_above_ground'],
      description: 'Low wall, raised ledge or masonry boundary wall.',
    },
    {
      class_id: 'fence_railing',
      label: 'Fence / Railing / Guard Barrier',
      rgb: [190, 153, 153],
      research_groups: ['built_above_ground'],
      description: 'Openwork fence, railing or protective barrier.',
    },
    {
      class_id: 'planter_container',
      label: 'Planter Container / Built Box',
      rgb: [180, 110, 40],
      research_groups: ['planter', 'street_furniture'],
      description: 'Built planter box, raised planter or plant container.',
    },
    {
      class_id: 'tree',
      label: 'Tree — Crown / Branches / Trunk',
      rgb: [50, 130, 20],
      research_groups: ['natural_above_ground', 'vegetation'],
      description: 'v1.5.7.1 unified tree class: leaves, crown, branches, bare branches and visible main trunk.',
    },
    {
      class_id: 'shrub_hedge',
      label: 'Shrub / Hedge',
      rgb: [100, 180, 40],
      research_groups: ['natural_above_ground', 'vegetation'],
      description: 'Shrub, hedge and dense eye-level woody vegetation.',
    },
    {
      class_id: 'ground_vegetation',
      label: 'Ground Vegetation / Grass / Low Flora',
      rgb: [150, 220, 80],
      research_groups: ['vegetation'],
      description: 'Grass and low groundcover vegetation.',
    },
    {
      class_id: 'vertical_green_wall',
      label: 'Vertical Green Wall / Climbing Flora',
      rgb: [0, 150, 80],
      research_groups: ['natural_above_ground', 'vegetation'],
      description: 'Vegetation covering a vertical facade or support.',
    },
    {
      class_id: 'bench_seating',
      label: 'Bench / Dedicated Seating Structure',
      rgb: [255, 80, 160],
      research_groups: ['outdoor_seating', 'street_furniture'],
      description: 'Bench or fixed public seating.',
    },
    {
      class_id: 'pole_fixture',
      label: 'Pole / Utility Fixture / Lamp Post',
      rgb: [153, 153, 153],
      research_groups: ['street_furniture'],
      description: 'Streetlight pole, utility pole or fixed vertical street fixture.',
    },
    {
      class_id: 'traffic_sign_signal',
      label: 'Traffic Sign / Signal Fixture',
      rgb: [255, 255, 0],
      research_groups: ['street_furniture'],
      description: 'Traffic sign or traffic signal.',
    },
    {
      class_id: 'person',
      label: 'Person / Pedestrian Presence',
      rgb: [220, 20, 60],
      research_groups: [],
      description: 'Pedestrian or visible person.',
    },
    {
      class_id: 'vehicle',
      label: 'Vehicle / Transit Carrier',
      rgb: [0, 0, 142],
      research_groups: [],
      description: 'Car, truck, bus, motorcycle or bicycle represented as a vehicle object.',
    },
    {
      class_id: 'sky',
      label: 'Open Sky / Celestial Hemisphere',
      rgb: [70, 130, 180],
      research_groups: [],
      description: 'Visible sky; sky reflection in glazing is excluded.',
    },
    {
      class_id: 'upper_building_glazing',
      label: 'Upper Building Glazing / Upper Windows',
      rgb: [0, 170, 220],
      research_groups: ['built_above_ground', 'architectural_detail'],
      description: 'Upper-floor windows, curtain-wall glazing and glazed building surfaces above ground floor.',
    },
    {
      class_id: 'traffic_cone_barrel',
      label: 'Traffic Cone / Construction Barrel',
      rgb: [255, 80, 0],
      research_groups: [],
      description: 'Traffic cone, construction cone, traffic barrel or construction drum.',
    }
  ],
};

export const AUTHORITATIVE_FROZEN_30_SPEC: ReadonlyArray<{
  class_id: string;
  rgb: readonly [number, number, number];
}> = FROZEN_30_CLASS_TAXONOMY.classes.map((c) => ({
  class_id: c.class_id,
  rgb: c.rgb,
}));

export function assertAuthoritativeFrozenTaxonomyIntegrity(
  taxonomy?: V33SegmentationTaxonomy | null
): {
  valid: boolean;
  errors: string[];
} {
  const target = taxonomy || FROZEN_30_CLASS_TAXONOMY;
  const errors: string[] = [];

  if (target.taxonomy_id !== 'street_interface_v1.5.7.1') {
    errors.push(
      `Taxonomy ID must be "street_interface_v1.5.7.1", got "${target.taxonomy_id}".`
    );
  }

  if (target.classes.length !== 30) {
    errors.push(
      `Authoritative v1.5.7.1 taxonomy must contain exactly 30 classes, got ${target.classes.length}.`
    );
  }

  const specMap = new Map<string, readonly [number, number, number]>();
  AUTHORITATIVE_FROZEN_30_SPEC.forEach((spec) => {
    specMap.set(spec.class_id, spec.rgb);
  });

  const seen = new Set<string>();

  target.classes.forEach((c, index) => {
    if (!specMap.has(c.class_id)) {
      errors.push(`Class[${index}]: illegal class ID "${c.class_id}".`);
      return;
    }

    if (seen.has(c.class_id)) {
      errors.push(`Duplicate class ID "${c.class_id}".`);
    }
    seen.add(c.class_id);

    const expected = specMap.get(c.class_id)!;
    if (
      c.rgb[0] !== expected[0] ||
      c.rgb[1] !== expected[1] ||
      c.rgb[2] !== expected[2]
    ) {
      errors.push(
        `Class "${c.class_id}" RGB mismatch. Expected [${expected.join(',')}], got [${c.rgb.join(',')}].`
      );
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

const startupValidation =
  assertAuthoritativeFrozenTaxonomyIntegrity(FROZEN_30_CLASS_TAXONOMY);

if (!startupValidation.valid) {
  throw new Error(
    `CRITICAL TAXONOMY INTEGRITY FAILURE:\n${startupValidation.errors.join('\n')}`
  );
}

export const VISION_BASELINE_VERSION =
  'v1.5.7.1-share-ready-audited';

export const FROZEN_TAXONOMY_VERSION =
  'street_interface_v1.5.7.1';
