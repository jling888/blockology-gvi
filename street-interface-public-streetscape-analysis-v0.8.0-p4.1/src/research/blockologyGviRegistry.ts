/**
 * Blockology-GVI Node / Panorama Registry Bridge
 *
 * Source:
 *   jling888/blockology-gvi @ main
 *
 * APP role:
 *   - external node identity context
 *   - Street View panorama provenance
 *   - capture-cohort audit
 *   - GVI / VEI validation protocol registration
 *
 * This module DOES NOT:
 *   - overwrite the active n##### Qwen node_id
 *   - write GVI_eye, SVF, H/W, Choice, Integration or GWR inputs
 *   - claim a street+sequence match is a verified physical-node crosswalk
 */

import type {
  MurrayHillIntegratedMatch,
} from './murrayHillIntegratedDataset';

export interface BlockologyNodeContext {
  blockologyNodeId: string;
  nodeLat: number;
  nodeLon: number;
  osmName: string;
  typology: 'avenue' | 'mid_block' | string;

  status: string;
  panoId: string | null;
  panoDate: string | null;
  panoLat: number | null;
  panoLon: number | null;
  month: number | null;
  year: number | null;
  usable: boolean;

  panoSnapDistanceM: number | null;
  gridBearingDeg: number | null;
}

export interface BlockologyDatasetManifest {
  schema_version: string;
  source_repository: string;
  source_branch: string;
  source_commit: string;
  source_commit_date: string;
  node_count: number;
  metadata_ok_count: number;
  usable_capture_count: number;
  recommended_capture_cohort: string | null;

  typology_counts: Record<string, number>;

  protocol: {
    metadata_search_radius_m: number;
    metadata_source: string;
    imagery_headings_per_node: number;
    imagery_offsets_deg: number[];
    field_of_view_deg: number;
    pitch_deg: number;
    image_size: string;
    grid_bearing_deg: Record<string, number>;
    gvi_formula: string;
    vei_formula: string;
    metrics_complete_node_rule: string;
    scaffolding_sensitivity_rule: string;
  };

  limitations: string[];
}

export type BlockologyMatchKind =
  | 'exact_blockology_node_id'
  | 'candidate_street_sequence'
  | 'none';

export interface BlockologyNodeMatch {
  kind: BlockologyMatchKind;
  context: BlockologyNodeContext | null;
  reason: string;

  /**
   * True only for a source whose own filename / identity explicitly carries
   * the Blockology node ID. Candidate street+sequence matches remain false.
   */
  verifiedPhysicalCrosswalk: boolean;
}

let cachedRegistry:
  BlockologyNodeContext[] | null =
  null;

let cachedManifest:
  BlockologyDatasetManifest | null =
  null;

function parseCsvLine(
  line: string
): string[] {
  const out: string[] =
    [];

  let current =
    '';

  let quoted =
    false;

  for (
    let i = 0;
    i < line.length;
    i++
  ) {
    const c =
      line[i];

    if (
      c === '"'
    ) {
      if (
        quoted &&
        line[i + 1] === '"'
      ) {
        current += '"';
        i++;
      } else {
        quoted =
          !quoted;
      }

      continue;
    }

    if (
      c === ',' &&
      !quoted
    ) {
      out.push(
        current
      );

      current =
        '';

      continue;
    }

    current +=
      c;
  }

  out.push(
    current
  );

  return out;
}

function numberOrNull(
  value: string | undefined
): number | null {
  if (
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const n =
    Number(value);

  return Number.isFinite(n)
    ? n
    : null;
}

function boolValue(
  value: string | undefined
): boolean {
  return String(value)
    .trim()
    .toLowerCase() ===
    'true';
}

function parseRegistryCsv(
  text: string
): BlockologyNodeContext[] {
  const lines =
    text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .filter(
        (line) =>
          line.trim()
      );

  if (
    lines.length < 2
  ) {
    return [];
  }

  const headers =
    parseCsvLine(
      lines[0]
    );

  return lines
    .slice(1)
    .map(
      (line) => {
        const values =
          parseCsvLine(
            line
          );

        const row =
          Object.fromEntries(
            headers.map(
              (
                header,
                index
              ) => [
                header,
                values[index] ??
                  '',
              ]
            )
          );

        return {
          blockologyNodeId:
            row.blockology_node_id,

          nodeLat:
            Number(
              row.node_lat
            ),

          nodeLon:
            Number(
              row.node_lon
            ),

          osmName:
            row.osm_name,

          typology:
            row.typology,

          status:
            row.status,

          panoId:
            row.pano_id ||
            null,

          panoDate:
            row.pano_date ||
            null,

          panoLat:
            numberOrNull(
              row.pano_lat
            ),

          panoLon:
            numberOrNull(
              row.pano_lon
            ),

          month:
            numberOrNull(
              row.month
            ),

          year:
            numberOrNull(
              row.year
            ),

          usable:
            boolValue(
              row.usable
            ),

          panoSnapDistanceM:
            numberOrNull(
              row.pano_snap_distance_m
            ),

          gridBearingDeg:
            numberOrNull(
              row.grid_bearing_deg
            ),
        };
      }
    );
}

function normalizeStreet(
  value:
    string | null | undefined
): string {
  return String(
    value ||
    ''
  )
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function suffixSequence(
  nodeId: string
): number | null {
  const match =
    nodeId.match(
      /_(\d+)$/
    );

  if (!match) {
    return null;
  }

  const n =
    Number(
      match[1]
    );

  return Number.isFinite(n)
    ? n
    : null;
}

export async function loadBlockologyRegistry(): Promise<{
  registry: BlockologyNodeContext[];
  manifest: BlockologyDatasetManifest;
}> {
  if (
    cachedRegistry &&
    cachedManifest
  ) {
    return {
      registry:
        cachedRegistry,

      manifest:
        cachedManifest,
    };
  }

  const [
    registryResponse,
    manifestResponse,
  ] =
    await Promise.all([
      fetch(
        '/data/blockology_node_context.csv'
      ),

      fetch(
        '/data/blockology_dataset_manifest.json'
      ),
    ]);

  if (
    !registryResponse.ok
  ) {
    throw new Error(
      'Blockology node registry could not be loaded.'
    );
  }

  if (
    !manifestResponse.ok
  ) {
    throw new Error(
      'Blockology dataset manifest could not be loaded.'
    );
  }

  const [
    csvText,
    manifest,
  ] =
    await Promise.all([
      registryResponse.text(),

      manifestResponse.json() as Promise<BlockologyDatasetManifest>,
    ]);

  cachedRegistry =
    parseRegistryCsv(
      csvText
    );

  cachedManifest =
    manifest;

  return {
    registry:
      cachedRegistry,

    manifest:
      cachedManifest,
  };
}

export function matchBlockologyNode(
  registry: BlockologyNodeContext[],
  originalFilename: string,
  murrayHillMatch:
    MurrayHillIntegratedMatch | null
): BlockologyNodeMatch {
  const lowerFilename =
    originalFilename.toLowerCase();

  /**
   * Strongest available match:
   * source filename itself contains an exact Blockology node ID.
   */
  const exact =
    registry.find(
      (row) =>
        lowerFilename.includes(
          row.blockologyNodeId.toLowerCase()
        )
    );

  if (exact) {
    return {
      kind:
        'exact_blockology_node_id',

      context:
        exact,

      verifiedPhysicalCrosswalk:
        true,

      reason:
        `The active source filename explicitly contains Blockology node ID ${exact.blockologyNodeId}.`,
    };
  }

  /**
   * Current Qwen research data uses a separate n##### ID namespace.
   *
   * street + seq can locate a plausible Blockology sampling row, but the
   * two repositories do not provide an explicit physical-node crosswalk.
   * Therefore this is intentionally CANDIDATE provenance only.
   */
  if (
    murrayHillMatch
  ) {
    const street =
      normalizeStreet(
        murrayHillMatch
          .identity
          .street
      );

    const seq =
      murrayHillMatch
        .identity
        .seq;

    const candidates =
      registry.filter(
        (row) =>
          normalizeStreet(
            row.osmName
          ) ===
            street &&
          suffixSequence(
            row.blockologyNodeId
          ) ===
            seq
      );

    if (
      candidates.length ===
      1
    ) {
      return {
        kind:
          'candidate_street_sequence',

        context:
          candidates[0],

        verifiedPhysicalCrosswalk:
          false,

        reason:
          `Candidate crosswalk from Murray Hill view street=${murrayHillMatch.identity.street}, seq=${seq} to Blockology ${candidates[0].blockologyNodeId}. ` +
          'This is useful for external provenance inspection but is not a verified physical-node ID equivalence.',
      };
    }
  }

  return {
    kind:
      'none',

    context:
      null,

    verifiedPhysicalCrosswalk:
      false,

    reason:
      'No exact Blockology node identity or unique candidate street+sequence match is available for the active source.',
  };
}
