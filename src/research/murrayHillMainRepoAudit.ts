/**
 * Murray Hill main-repository evidence/availability audit.
 *
 * Source is pinned to the inspected public GitHub main branch. This is a
 * METHOD + QA registry. It does not synthesize missing research data.
 */

export type MainRepoAvailabilityStatus =
  | 'available'
  | 'not_found_as_node_output'
  | 'machinery_only'
  | 'missing'
  | 'uncalibrated'
  | 'validation_covariate_only';

export interface MainRepoValidationTwin {
  field: string;
  n: number;
  rho_against_measured_twin: number | null;
  rho_expected_value: number | null;
  pass_direction: boolean | null;
  note?: string;
}

export interface MainRepoReliabilityRow {
  field: string;
  n: number;
  rho_same_frontage: number | null;
  moran_I: number | null;
  top_p: number | null;
  note?: string;
}

export interface MainRepoPartialCorrelation {
  scope: string;
  x: string;
  y: string;
  control: string;
  n: number | null;
  r_partial: number;
}

export interface MurrayHillMainRepoAudit {
  schema_version: string;
  source_repository: string;
  source_branch: string;
  source_commit: string;
  source_commit_message: string;
  source_commit_date: string;

  dataset: {
    physical_nodes: number;
    vlm_views: number;
    views_per_node: number;
  };

  source_pipeline_config: {
    projected_epsg: number;
    node_spacing_m: number;
    headings_deg: number[];
    fov_deg: number;
    pitch_deg: number;
    image_size_px: number;
    max_pano_offset_m: number;
    solid_angle_weighting: boolean;
    target_capture: string;

    directional_grid_bearing_deg: number;
    directional_fov_deg: number;
    directional_n_bins: number;

    geometry: {
      corridor_m: number;
      facade_half_m: number;
      facade_cone_deg: number;
      open_test_deg: number;
      open_reach_m: number;
      hw_probe: string;
      hw_band_stat: string;
      hw_band_rays: number;
      hw_min_w_m: number;
      hw_max_w_m: number;
    };
  };

  hw_source_categories: string[];

  validation_twins:
    MainRepoValidationTwin[];

  rating_reliability:
    MainRepoReliabilityRow[];

  partial_correlations:
    MainRepoPartialCorrelation[];

  method_availability: Array<{
    key: string;
    label: string;
    status: MainRepoAvailabilityStatus;
    evidence: string;
  }>;

  method_boundaries: string[];
}

let cached:
  MurrayHillMainRepoAudit | null =
  null;

export async function loadMurrayHillMainRepoAudit():
  Promise<MurrayHillMainRepoAudit> {
  if (cached) {
    return cached;
  }

  const response =
    await fetch(
      '/data/murrayhill_main_repo_audit.json'
    );

  if (!response.ok) {
    throw new Error(
      'Murray Hill main-repo audit registry could not be loaded.'
    );
  }

  cached =
    await response.json() as
      MurrayHillMainRepoAudit;

  return cached;
}
