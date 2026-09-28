/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VlmStreetscapeEvaluationV31 } from '../types';

export interface SampleCase {
  id: string;
  name: string;
  description: string;
  pixelClassificationFilename: string;
  originalFilename: string;
  pixelClassificationDataUrl: string;
  originalDataUrl: string;
  referenceEvaluation: VlmStreetscapeEvaluationV31;
}

// Generate stylized canvas SVG data URLs for streetscape views using authoritative 30-class frozen taxonomy RGB colors
function createUrbanStreetscapeSvg(isPixelClassification: boolean, type: 'commercial' | 'avenue' | 'canyon' | 'img010'): string {
  if (type === 'img010') {
    if (isPixelClassification) {
      return `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">
  <!-- Authoritative Frozen Baseline: hybrid_v0.10_frozen_baseline-r1 -->
  <!-- 1. Roadway [128, 64, 128]: ~33.7981% -->
  <rect x="0" y="662" width="1000" height="338" fill="#804080" />
  
  <!-- 2. Sidewalk Shed / Scaffold [0, 200, 200]: ~21.8096% -->
  <rect x="0" y="444" width="1000" height="218" fill="#00C8C8" />
  
  <!-- 3. Upper Building Facade [70, 70, 70]: ~15.7957% -->
  <rect x="0" y="286" width="1000" height="158" fill="#464646" />
  
  <!-- 4. Motor Vehicle [0, 0, 142]: ~10.4966% -->
  <rect x="250" y="750" width="500" height="210" fill="#00008E" />
  
  <!-- 5. Tree Canopy [50, 130, 20]: ~8.9031% -->
  <rect x="0" y="197" width="1000" height="89" fill="#328214" />
  
  <!-- 6. Upper Building Glazing [0, 170, 220]: ~4.0181% -->
  <rect x="100" y="320" width="800" height="50" fill="#00AADC" />
  
  <!-- 7. Sky [70, 130, 180]: ~2.4917% -->
  <rect x="0" y="0" width="1000" height="25" fill="#4682B4" />
  
  <!-- 8. Ground Floor Solid Facade [110, 80, 70]: ~0.7970% -->
  <rect x="0" y="189" width="1000" height="8" fill="#6E5046" />
  
  <!-- 9. Sidewalk [244, 35, 232] & Curb Edge [255, 180, 180] & Door [255, 140, 0] & Signboard [255, 220, 0] to complete 100% -->
  <rect x="0" y="25" width="500" height="10" fill="#F423E8" />
  <rect x="500" y="25" width="500" height="10" fill="#FFB4B4" />
  <rect x="0" y="35" width="500" height="8" fill="#FF8C00" />
  <rect x="500" y="35" width="500" height="8" fill="#FFDC00" />
  <rect x="0" y="43" width="1000" height="146" fill="#804080" />

  <!-- Label Overlay -->
  <rect x="20" y="20" width="340" height="36" rx="6" fill="#000000" opacity="0.85"/>
  <text x="32" y="44" font-family="monospace" font-size="16" fill="#00FF66">IMG_010_PIXEL_CLASSIFICATION</text>
</svg>
      `)}`;
    } else {
      return `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">
  <defs>
    <linearGradient id="skyGrad10" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#7DD3FC"/>
      <stop offset="100%" stop-color="#E0F2FE"/>
    </linearGradient>
    <linearGradient id="roadGrad10" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#475569"/>
      <stop offset="100%" stop-color="#1E293B"/>
    </linearGradient>
  </defs>
  <!-- Realistic Sky -->
  <rect x="0" y="0" width="1000" height="200" fill="url(#skyGrad10)" />
  <!-- Upper Masonry Facade -->
  <rect x="0" y="200" width="1000" height="250" fill="#78716C" stroke="#57534E" stroke-width="2"/>
  <!-- Windows -->
  <rect x="80" y="240" width="100" height="120" fill="#CBD5E1" stroke="#334155" stroke-width="2"/>
  <rect x="260" y="240" width="100" height="120" fill="#CBD5E1" stroke="#334155" stroke-width="2"/>
  <rect x="440" y="240" width="100" height="120" fill="#CBD5E1" stroke="#334155" stroke-width="2"/>
  <rect x="620" y="240" width="100" height="120" fill="#CBD5E1" stroke="#334155" stroke-width="2"/>
  <rect x="800" y="240" width="100" height="120" fill="#CBD5E1" stroke="#334155" stroke-width="2"/>
  <!-- Sidewalk Shed Scaffolding Structure -->
  <rect x="0" y="450" width="1000" height="200" fill="#0284C7" opacity="0.35" stroke="#0369A1" stroke-width="3"/>
  <line x1="150" y1="450" x2="150" y2="650" stroke="#0F172A" stroke-width="8"/>
  <line x1="450" y1="450" x2="450" y2="650" stroke="#0F172A" stroke-width="8"/>
  <line x1="750" y1="450" x2="750" y2="650" stroke="#0F172A" stroke-width="8"/>
  <!-- Street Asphalt & Vehicles -->
  <rect x="0" y="650" width="1000" height="350" fill="url(#roadGrad10)" />
  <rect x="250" y="730" width="480" height="180" rx="20" fill="#1E3A8A" stroke="#172554" stroke-width="3"/>
  <!-- Street Foliage / Tree Canopy -->
  <ellipse cx="850" cy="220" rx="140" ry="80" fill="#15803D" opacity="0.9"/>
  <!-- Label Overlay -->
  <rect x="20" y="20" width="220" height="36" rx="6" fill="#000000" opacity="0.85"/>
  <text x="32" y="44" font-family="monospace" font-size="16" fill="#FFFFFF">IMG_010_ORIGINAL</text>
</svg>
      `)}`;
    }
  }

  if (type === 'commercial') {
    if (isPixelClassification) {
      return `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <!-- Sky: [70, 130, 180] (#4682B4) -->
  <rect x="0" y="0" width="600" height="180" fill="#4682B4" />
  <!-- Upper Building Facade Left: [70, 70, 70] (#464646) -->
  <polygon points="0,60 180,120 180,310 0,330" fill="#464646" />
  <!-- Upper Building Facade Right -->
  <polygon points="420,110 600,40 600,340 420,310" fill="#464646" />
  <!-- Roadway: [128, 64, 128] (#804080) -->
  <polygon points="210,260 390,260 520,400 80,400" fill="#804080" />
  <!-- Sidewalk Left: [244, 35, 232] (#F423E8) -->
  <polygon points="180,260 210,260 80,400 0,400 0,330 180,310" fill="#F423E8" />
  <!-- Sidewalk Right: [244, 35, 232] -->
  <polygon points="390,260 420,260 600,340 600,400 520,400" fill="#F423E8" />
  <!-- Tree Canopy: [50, 130, 20] (#328214) -->
  <circle cx="150" cy="190" r="45" fill="#328214" />
  <circle cx="170" cy="220" r="35" fill="#328214" />
  <circle cx="440" cy="180" r="50" fill="#328214" />
  <circle cx="430" cy="230" r="35" fill="#328214" />
  <!-- Tree Trunk: [100, 70, 30] (#64461E) -->
  <rect x="145" y="230" width="10" height="60" fill="#64461E" />
  <rect x="435" y="225" width="10" height="65" fill="#64461E" />
  <!-- Label Overlay -->
  <rect x="10" y="10" width="220" height="24" rx="4" fill="#000000" opacity="0.8"/>
  <text x="18" y="26" font-family="monospace" font-size="11" fill="#00FF66">IMG_001_PIXEL_CLASSIFICATION</text>
</svg>
      `)}`;
    } else {
      return `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#93C5FD"/>
      <stop offset="100%" stop-color="#E0F2FE"/>
    </linearGradient>
    <linearGradient id="roadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#64748B"/>
      <stop offset="100%" stop-color="#334155"/>
    </linearGradient>
  </defs>
  <!-- Realistic Sky -->
  <rect x="0" y="0" width="600" height="200" fill="url(#skyGrad)" />
  <!-- Left Historic Brick Facade -->
  <polygon points="0,60 180,120 180,310 0,330" fill="#9A3412" stroke="#7C2D12" stroke-width="2"/>
  <!-- Windows & Storefront Left -->
  <rect x="20" y="90" width="30" height="40" fill="#CBD5E1" stroke="#475569" stroke-width="1.5"/>
  <rect x="70" y="105" width="30" height="40" fill="#CBD5E1" stroke="#475569" stroke-width="1.5"/>
  <rect x="120" y="120" width="30" height="40" fill="#CBD5E1" stroke="#475569" stroke-width="1.5"/>
  <!-- Ground Floor Storefront Glass -->
  <polygon points="10,260 170,250 170,305 10,320" fill="#0284C7" opacity="0.3" stroke="#0369A1" stroke-width="1"/>
  <!-- Right Commercial Facade -->
  <polygon points="420,110 600,40 600,340 420,310" fill="#78716C" stroke="#57534E" stroke-width="2"/>
  <rect x="440" y="130" width="35" height="45" fill="#E2E8F0" stroke="#475569" stroke-width="1.5"/>
  <rect x="500" y="100" width="35" height="45" fill="#E2E8F0" stroke="#475569" stroke-width="1.5"/>
  <!-- Street Asphalt & Markings -->
  <polygon points="210,260 390,260 520,400 80,400" fill="url(#roadGrad)" />
  <line x1="300" y1="265" x2="300" y2="395" stroke="#FBBF24" stroke-dasharray="15,12" stroke-width="3"/>
  <!-- Sidewalk Left -->
  <polygon points="180,260 210,260 80,400 0,400 0,330 180,310" fill="#CBD5E1" stroke="#94A3B8" stroke-width="1.5"/>
  <!-- Sidewalk Right -->
  <polygon points="390,260 420,260 600,340 600,400 520,400" fill="#CBD5E1" stroke="#94A3B8" stroke-width="1.5"/>
  <!-- Realistic Foliage / Trees -->
  <path d="M 120 180 Q 150 140 180 180 Q 190 220 160 230 Q 130 230 120 180 Z" fill="#15803D" opacity="0.95"/>
  <path d="M 410 170 Q 450 130 480 175 Q 480 225 440 235 Q 410 225 410 170 Z" fill="#166534" opacity="0.95"/>
  <!-- Bench on Sidewalk (Original-Only Element to test Rule A/B) -->
  <rect x="40" y="340" width="35" height="12" rx="2" fill="#78350F" stroke="#451A03" stroke-width="1"/>
  <!-- Label Overlay -->
  <rect x="10" y="10" width="160" height="24" rx="4" fill="#000000" opacity="0.8"/>
  <text x="18" y="26" font-family="monospace" font-size="11" fill="#FFFFFF">IMG_001_ORIGINAL</text>
</svg>
      `)}`;
    }
  }

  if (type === 'avenue') {
    if (isPixelClassification) {
      return `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <!-- Sky: [70, 130, 180] (#4682B4) -->
  <rect x="0" y="0" width="600" height="220" fill="#4682B4" />
  <!-- Upper Building Facade: [70, 70, 70] (#464646) -->
  <polygon points="0,140 120,160 120,300 0,320" fill="#464646" />
  <polygon points="480,160 600,140 600,320 480,300" fill="#464646" />
  <!-- Roadway: [128, 64, 128] (#804080) -->
  <polygon points="240,270 360,270 480,400 120,400" fill="#804080" />
  <!-- Sidewalk: [244, 35, 232] (#F423E8) -->
  <polygon points="120,300 240,270 120,400 0,400 0,320" fill="#F423E8" />
  <polygon points="360,270 480,300 600,320 600,400 480,400" fill="#F423E8" />
  <!-- Tree Canopy: [50, 130, 20] (#328214) -->
  <circle cx="80" cy="140" r="70" fill="#328214" />
  <circle cx="160" cy="130" r="60" fill="#328214" />
  <circle cx="260" cy="110" r="65" fill="#328214" />
  <circle cx="340" cy="110" r="65" fill="#328214" />
  <circle cx="440" cy="130" r="60" fill="#328214" />
  <circle cx="520" cy="140" r="70" fill="#328214" />
  <!-- Shrub / Hedge: [100, 180, 40] (#64B428) -->
  <circle cx="100" cy="280" r="25" fill="#64B428" />
  <circle cx="500" cy="280" r="25" fill="#64B428" />
  <rect x="10" y="10" width="220" height="24" rx="4" fill="#000000" opacity="0.8"/>
  <text x="18" y="26" font-family="monospace" font-size="11" fill="#00FF66">IMG_002_PIXEL_CLASSIFICATION</text>
</svg>
      `)}`;
    } else {
      return `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="skyGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#BAE6FD"/>
      <stop offset="100%" stop-color="#F0F9FF"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="600" height="240" fill="url(#skyGrad2)" />
  <!-- Historic Villas Setback -->
  <polygon points="0,140 120,160 120,300 0,320" fill="#D97706" stroke="#92400E" stroke-width="1.5"/>
  <polygon points="480,160 600,140 600,320 480,300" fill="#D97706" stroke="#92400E" stroke-width="1.5"/>
  <polygon points="240,270 360,270 480,400 120,400" fill="#475569" />
  <polygon points="120,300 240,270 120,400 0,400 0,320" fill="#E2E8F0" stroke="#CBD5E1"/>
  <polygon points="360,270 480,300 600,320 600,400 480,400" fill="#E2E8F0" stroke="#CBD5E1"/>
  <!-- Detailed Foliage Arches -->
  <ellipse cx="140" cy="130" rx="90" ry="70" fill="#15803D" opacity="0.9"/>
  <ellipse cx="460" cy="130" rx="90" ry="70" fill="#15803D" opacity="0.9"/>
  <ellipse cx="300" cy="100" rx="80" ry="50" fill="#166534" opacity="0.85"/>
  <!-- Cast Iron Street Lamps & Stoop Details (Original-Only reference) -->
  <line x1="160" y1="280" x2="160" y2="340" stroke="#1E293B" stroke-width="3"/>
  <circle cx="160" cy="275" r="5" fill="#FEF08A"/>
  <rect x="10" y="10" width="160" height="24" rx="4" fill="#000000" opacity="0.8"/>
  <text x="18" y="26" font-family="monospace" font-size="11" fill="#FFFFFF">IMG_002_ORIGINAL</text>
</svg>
      `)}`;
    }
  }

  // Canyon
  if (isPixelClassification) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <!-- Sky: [70, 130, 180] (#4682B4) -->
  <polygon points="250,0 350,0 330,120 270,120" fill="#4682B4" />
  <!-- Upper Building Facade Left: [70, 70, 70] (#464646) -->
  <polygon points="0,0 250,0 270,120 240,290 0,330" fill="#464646" />
  <!-- Upper Building Facade Right -->
  <polygon points="350,0 600,0 600,330 360,290 330,120" fill="#464646" />
  <!-- Roadway: [128, 64, 128] (#804080) -->
  <polygon points="255,290 345,290 490,400 110,400" fill="#804080" />
  <!-- Sidewalks: [244, 35, 232] (#F423E8) -->
  <polygon points="240,290 255,290 110,400 0,400 0,330" fill="#F423E8" />
  <polygon points="345,290 360,290 600,330 600,400 490,400" fill="#F423E8" />
  <rect x="10" y="10" width="220" height="24" rx="4" fill="#000000" opacity="0.8"/>
  <text x="18" y="26" font-family="monospace" font-size="11" fill="#00FF66">IMG_003_PIXEL_CLASSIFICATION</text>
</svg>
    `)}`;
  } else {
    return `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <polygon points="250,0 350,0 330,120 270,120" fill="#7DD3FC" />
  <polygon points="0,0 250,0 270,120 240,290 0,330" fill="#334155" stroke="#1E293B" stroke-width="2"/>
  <polygon points="350,0 600,0 600,330 360,290 330,120" fill="#475569" stroke="#1E293B" stroke-width="2"/>
  <polygon points="255,290 345,290 490,400 110,400" fill="#1E293B" />
  <polygon points="240,290 255,290 110,400 0,400 0,330" fill="#94A3B8" />
  <polygon points="345,290 360,290 600,330 600,400 490,400" fill="#94A3B8" />
  <rect x="10" y="10" width="160" height="24" rx="4" fill="#000000" opacity="0.8"/>
  <text x="18" y="26" font-family="monospace" font-size="11" fill="#FFFFFF">IMG_003_ORIGINAL</text>
</svg>
    `)}`;
  }
}

export const SAMPLE_CASES: SampleCase[] = [
  {
    id: 'n00045',
    name: 'n00045 — 1st Avenue (Murray Hill Benchmark)',
    description: 'Murray Hill production benchmark node on 1st Avenue (vlm_observations_murrayhill.csv).',
    pixelClassificationFilename: '001_n00045_S_MASK.png',
    originalFilename: '001_n00045_S.jpg',
    pixelClassificationDataUrl: createUrbanStreetscapeSvg(true, 'avenue'),
    originalDataUrl: createUrbanStreetscapeSvg(false, 'avenue'),
    referenceEvaluation: {
      image_id: 'n00045',
      primary_evidence_summary: '1st Avenue corridor streetscape with commercial ground floor and vertical hardscape predominance.',
      greenery_types: ['tree_canopy'],
      greenery_vertical_position: 'below_eye_level',
      eye_level_greenery_score_primary: 2,
      eye_level_greenery_score: 2,
      eye_level_greenery_rationale: 'Occasional street trees and small planters along commercial corridor.',
      greenery_confidence: 'high',
      barrier_present: 'absent',
      edge_type: 'direct_facade_sidewalk',
      edge_spatial_relationship: 'Direct sidewalk to active commercial shopfront interface.',
      buffering_quality: 'medium',
      lingering_affordance: 'medium',
      edge_effect_rationale: 'Wide sidewalk adjacent to avenue roadway.',
      edge_confidence: 'high',
      street_wall_continuity: 'high',
      building_vertical_presence: 'high',
      sky_exposure: 'medium',
      setback_openness: 'medium',
      vegetation_enclosure: 'low',
      perceived_hw_ratio: 'human_scale',
      framing_score_primary: 5,
      framing_score: 5,
      enclosure_rationale: 'Avenue street walls with moderate sky openness.',
      enclosure_confidence: 'high',
      place_identity_score_primary: 4,
      place_identity_score: 4,
      place_identity_rationale: 'Active urban avenue with recognizable retail and pedestrian circulation.',
      place_identity_confidence: 'high',
      place_attachment_score_primary: 3,
      place_attachment_score: 3,
      place_attachment_rationale: 'Commercial avenue with pedestrian activity.',
      place_attachment_confidence: 'high',
      place_dependence_score_primary: 5,
      place_dependence_score: 5,
      place_dependence_rationale: 'High utilitarian connectivity and walkability.',
      place_dependence_confidence: 'high',
      original_secondary_contribution: 'Street facade details confirmed in original photograph.',
      original_only_observations: 'Street signs and storefront awnings.',
      classification_limitations: 'Presentation screenshot recovery demo mask.',
      score_change_summary: 'None',
      original_only_evidence_used_for_score: false,
      audit_status: 'pass',
      uncertainty: 'Presentation screenshot recovery demo mask.'
    }
  },
  {
    id: 'IMG_010',
    name: 'IMG_010 — Official Regression Fixture (Urban Corridor with Shed & Traffic)',
    description: 'Authoritative frozen baseline test case (hybrid_v0.10_frozen_baseline-r1). Contains roadway, sidewalk shed scaffolding, vehicle, upper facade, tree canopy, and sky.',
    pixelClassificationFilename: 'IMG_010_PIXEL_CLASSIFICATION.png',
    originalFilename: 'IMG_010_ORIGINAL.png',
    pixelClassificationDataUrl: createUrbanStreetscapeSvg(true, 'img010'),
    originalDataUrl: createUrbanStreetscapeSvg(false, 'img010'),
    referenceEvaluation: {
      image_id: 'IMG_010',
      primary_evidence_summary: 'Primary pixel classification displays an active multi-modal corridor with extensive construction sidewalk shed scaffold (cyan [0,200,200]), upper building facade (dark gray [70,70,70]), active vehicular presence (navy [0,0,142]), roadway (purple [128,64,128]), and lateral tree canopy (green [50,130,20]).',
      greenery_types: ['tree_canopy'],
      greenery_vertical_position: 'above_eye_level',
      eye_level_greenery_score_primary: 4,
      eye_level_greenery_score: 4,
      eye_level_greenery_rationale: 'Overhead tree canopy presence verified at 8.90% with moderate lateral density.',
      greenery_confidence: 'high',
      barrier_present: 'present',
      edge_type: 'direct_facade_sidewalk',
      edge_spatial_relationship: 'Sidewalk shed scaffold provides temporary overhead and lateral pedestrian shelter along 21.81% of street envelope.',
      buffering_quality: 'medium',
      lingering_affordance: 'medium',
      edge_effect_rationale: 'Covered sidewalk shed provides high pedestrian weather protection along active frontage.',
      edge_confidence: 'high',
      street_wall_continuity: 'high',
      building_vertical_presence: 'high',
      sky_exposure: 'low',
      setback_openness: 'low',
      vegetation_enclosure: 'low',
      perceived_hw_ratio: 'deep_canyon',
      framing_score_primary: 6,
      framing_score: 6,
      enclosure_rationale: 'Upper facade combined with extensive sidewalk shed scaffolding creates strong cross-sectional enclosure.',
      enclosure_confidence: 'high',
      place_identity_score_primary: 5,
      place_identity_score: 5,
      place_identity_rationale: 'Classic high-density metropolitan streetscape character with distinctive sidewalk shed and active vehicular corridor.',
      place_identity_confidence: 'high',
      place_attachment_score_primary: 4,
      place_attachment_score: 4,
      place_attachment_rationale: 'Urban walkability preserved through continuous covered scaffold corridor.',
      place_attachment_confidence: 'medium',
      place_dependence_score_primary: 5,
      place_dependence_score: 5,
      place_dependence_rationale: 'High multi-modal throughput with designated pedestrian sidewalk bridge and transit lanes.',
      place_dependence_confidence: 'high',
      original_secondary_contribution: 'Original confirmed steel and timber scaffold structure and glass fenestration on upper facade.',
      original_only_observations: 'Construction warning signage on timber scaffold posts visible in Original photograph; excluded from scoring per v3.1 protocol.',
      classification_limitations: 'Scaffold structural posts exhibit minor raster discretization along bottom curb boundary.',
      score_change_summary: 'None',
      original_only_evidence_used_for_score: false,
      audit_status: 'pass',
      uncertainty: 'Deterministic exact-RGB mapping verified at mapped_fraction = 1.0000 across all 30 authoritative classes.'
    }
  },
  {
    id: 'IMG_001',
    name: 'Mixed-Use Commercial High Street',
    description: 'Active urban retail street with defined street wall, moderate canopy vegetation, and active pedestrian interfaces.',
    pixelClassificationFilename: 'IMG_001_PIXEL_CLASSIFICATION.jpg',
    originalFilename: 'IMG_001_ORIGINAL.jpg',
    pixelClassificationDataUrl: createUrbanStreetscapeSvg(true, 'commercial'),
    originalDataUrl: createUrbanStreetscapeSvg(false, 'commercial'),
    referenceEvaluation: {
      image_id: 'IMG_001',
      primary_evidence_summary: 'Primary pixel classification displays a symmetrical urban street corridor with continuous multi-story building masses on both flanks (red segment), flanking sidewalks (yellow), a central two-lane roadway (purple), and distinct overhead/eye-level tree canopies (green) anchored on both pedestrian margins.',
      greenery_types: ['tree_canopy', 'hedge_or_shrub'],
      greenery_vertical_position: 'within_eye_level',
      eye_level_greenery_score_primary: 4,
      eye_level_greenery_score: 4,
      eye_level_greenery_rationale: 'Lateral street trees provide substantial eye-level visual presence along both pedestrian corridors with continuous green understory volume.',
      greenery_confidence: 'high',
      barrier_present: 'absent',
      edge_type: 'direct_facade_sidewalk',
      edge_spatial_relationship: 'Continuous storefront facade directly meeting the sidewalk with street tree planters along the curb.',
      buffering_quality: 'medium',
      lingering_affordance: 'medium',
      edge_effect_rationale: 'Active ground-floor frontage with street-tree planting strip provides intermittent pedestrian buffering from vehicular flow.',
      edge_confidence: 'high',
      street_wall_continuity: 'high',
      building_vertical_presence: 'medium',
      sky_exposure: 'medium',
      setback_openness: 'low',
      vegetation_enclosure: 'medium',
      perceived_hw_ratio: 'human_scale',
      framing_score_primary: 5,
      framing_score: 5,
      enclosure_rationale: 'Continuous 3-to-4 story building facades on both sides create a balanced 1:1 cross-sectional street canyon framing.',
      enclosure_confidence: 'high',
      place_identity_score_primary: 5,
      place_identity_score: 5,
      place_identity_rationale: 'Well-articulated vertical facades combined with rhythmic street-tree plantings establish clear urban enclosure, legibility, and architectural coherence.',
      place_identity_confidence: 'high',
      place_attachment_score_primary: 4,
      place_attachment_score: 4,
      place_attachment_rationale: 'Human-scale proportions and sidewalk width provide baseline comfort and spatial enclosure suitable for pedestrian lingering.',
      place_attachment_confidence: 'medium',
      place_dependence_score_primary: 5,
      place_dependence_score: 5,
      place_dependence_rationale: 'Continuous pedestrian corridors on both flanks offer direct connectivity and multi-modal walkability.',
      place_dependence_confidence: 'high',
      original_secondary_contribution: 'Clarified material texture of the classified brick facades and verified healthy foliage density of the classified street trees.',
      original_only_observations: 'A wooden bench and decorative cast-iron planter are visible on the left sidewalk in the Original photograph. In accordance with the v3.1 protocol, these unclassified features are excluded from all scores.',
      classification_limitations: 'Pixel classification omitted the ground-level bench and fine-grain storefront framing details.',
      score_change_summary: 'None',
      original_only_evidence_used_for_score: false,
      audit_status: 'pass',
      uncertainty: 'Low perceptual ambiguity. Spatial geometry and semantic boundaries are crisp and well-aligned between views.'
    }
  },
  {
    id: 'IMG_002',
    name: 'Historic Tree-Lined Residential Avenue',
    description: 'Generous boulevard with expansive overarching tree canopies, residential setbacks, and rich multi-tier greenery.',
    pixelClassificationFilename: 'IMG_002_PIXEL_CLASSIFICATION.jpg',
    originalFilename: 'IMG_002_ORIGINAL.jpg',
    pixelClassificationDataUrl: createUrbanStreetscapeSvg(true, 'avenue'),
    originalDataUrl: createUrbanStreetscapeSvg(false, 'avenue'),
    referenceEvaluation: {
      image_id: 'IMG_002',
      primary_evidence_summary: 'Pixel classification reveals an overarching continuous canopy envelope (green) covering over 60% of the upper street canyon, setback residential structures (red), wide pedestrian sidewalks (yellow), and landscaped planting strips.',
      greenery_types: ['tree_canopy', 'hedge_or_shrub', 'ground_vegetation'],
      greenery_vertical_position: 'above_eye_level',
      eye_level_greenery_score_primary: 6,
      eye_level_greenery_score: 6,
      eye_level_greenery_rationale: 'Dense mature canopy arches overhead while flanking understory plantings create high multi-tier vegetative volume.',
      greenery_confidence: 'high',
      barrier_present: 'absent',
      edge_type: 'landscape_buffer',
      edge_spatial_relationship: 'Stepped setback with generous landscaped verge between walkway and residential boundaries.',
      buffering_quality: 'high',
      lingering_affordance: 'high',
      edge_effect_rationale: 'Deep landscaped front yards and continuous planting verges provide a strong protective buffer for pedestrians.',
      edge_confidence: 'high',
      street_wall_continuity: 'medium',
      building_vertical_presence: 'low',
      sky_exposure: 'medium',
      setback_openness: 'high',
      vegetation_enclosure: 'high',
      perceived_hw_ratio: 'under_enclosed',
      framing_score_primary: 4,
      framing_score: 4,
      enclosure_rationale: 'Enclosure is defined primarily by overarching vegetative canopy rather than structural building facades.',
      enclosure_confidence: 'high',
      place_identity_score_primary: 6,
      place_identity_score: 6,
      place_identity_rationale: 'The overarching mature tree canopy creates a distinctive green vaulted ceiling with strong morphological character and historic residential character.',
      place_identity_confidence: 'high',
      place_attachment_score_primary: 6,
      place_attachment_score: 6,
      place_attachment_rationale: 'Generous microclimatic shading, soft natural edges, and calm pedestrian buffers offer high psychological refuge and lingering magnetism.',
      place_attachment_confidence: 'high',
      place_dependence_score_primary: 5,
      place_dependence_score: 5,
      place_dependence_rationale: 'Spacious pedestrian realm and segregated road traffic support safe, comfortable recreational and daily walking.',
      place_dependence_confidence: 'high',
      original_secondary_contribution: 'Original confirmed lush canopy continuity and dense green foliage across all classified canopy segments.',
      original_only_observations: 'Antique cast-iron decorative lamp posts and ornate residential stoops visible in Original are not segmented in Pixel Classification and were strictly excluded from scores.',
      classification_limitations: 'Tree canopy segmentation slightly overlaps upper facade cornices.',
      score_change_summary: 'None',
      original_only_evidence_used_for_score: false,
      audit_status: 'pass',
      uncertainty: 'Minimal ambiguity.'
    }
  },
  {
    id: 'IMG_003',
    name: 'High-Density Downtown Urban Canyon',
    description: 'Deep vertical street canyon with high building enclosure, narrow sky aperture, and minimal vegetative presence.',
    pixelClassificationFilename: 'IMG_003_PIXEL_CLASSIFICATION.jpg',
    originalFilename: 'IMG_003_ORIGINAL.jpg',
    pixelClassificationDataUrl: createUrbanStreetscapeSvg(true, 'canyon'),
    originalDataUrl: createUrbanStreetscapeSvg(false, 'canyon'),
    referenceEvaluation: {
      image_id: 'IMG_003',
      primary_evidence_summary: 'Primary pixel classification indicates high vertical building massing flanking both margins to the top boundary, restricting sky visibility to a narrow vertical slot. Zero vegetation segments are detected.',
      greenery_types: ['none'],
      greenery_vertical_position: 'uncertain',
      eye_level_greenery_score_primary: 1,
      eye_level_greenery_score: 1,
      eye_level_greenery_rationale: 'Complete absence of vegetation in the pixel classification map across both ground and upper vertical planes.',
      greenery_confidence: 'high',
      barrier_present: 'absent',
      edge_type: 'direct_facade_sidewalk',
      edge_spatial_relationship: 'Vertical glass and stone facade aligned directly with pedestrian walkway.',
      buffering_quality: 'low',
      lingering_affordance: 'low',
      edge_effect_rationale: 'Pedestrians are immediately adjacent to multi-lane roadway traffic separated only by standard curb with no buffer.',
      edge_confidence: 'high',
      street_wall_continuity: 'high',
      building_vertical_presence: 'high',
      sky_exposure: 'low',
      setback_openness: 'low',
      vegetation_enclosure: 'low',
      perceived_hw_ratio: 'deep_canyon',
      framing_score_primary: 7,
      framing_score: 7,
      enclosure_rationale: 'Dominant towering facades flank both sides with zero setback, creating an intense vertical urban canyon.',
      enclosure_confidence: 'high',
      place_identity_score_primary: 4,
      place_identity_score: 4,
      place_identity_rationale: 'High canyon enclosure produces pronounced urban density and scale, though lacking fine-grain biological differentiation.',
      place_identity_confidence: 'high',
      place_attachment_score_primary: 2,
      place_attachment_score: 2,
      place_attachment_rationale: 'Dominant hardscape and lack of buffering create an intense, transitional sensory atmosphere with low restorative potential.',
      place_attachment_confidence: 'high',
      place_dependence_score_primary: 4,
      place_dependence_score: 4,
      place_dependence_rationale: 'Linear sidewalks provide utilitarian throughput, though pedestrian comfort is constrained by traffic proximity and wind-canyon effects.',
      place_dependence_confidence: 'medium',
      original_secondary_contribution: 'Original confirmed glass and stone facade materiality of the classified towers.',
      original_only_observations: 'Traffic signals and bollards visible in Original photograph; excluded from scoring.',
      classification_limitations: 'Reflective glass surfaces caused minor classification noise at ground level.',
      score_change_summary: 'None',
      original_only_evidence_used_for_score: false,
      audit_status: 'pass',
      uncertainty: 'Low uncertainty.'
    }
  }
];
