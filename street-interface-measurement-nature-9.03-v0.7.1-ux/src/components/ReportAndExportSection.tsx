/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ============================================================================
 * PAPER-ALIGNED RESEARCH NODE REPORT & EXPORT
 * Street Interface Measurement — Nature 9.03 Final · No-Omega v0.7.0-RC1
 * ============================================================================
 *
 * Export layers:
 * 1. Deterministic Vision measurements
 * 2. Vision → Paper variable assembly / provenance
 * 3. Paper synthesis status and computed values
 * 4. Approved-Qwen VLM provenance and full 1–7 score distributions
 * 5. Teacher Gemma one-shot comparator provenance
 * 6. Space Syntax / GWR provenance including β0
 * 7. Method gates
 *
 * IMPORTANT:
 * Candidate mappings remain distinguishable from paper-ready variables.
 * Missing capability is exported as a gate, never silently as numerical zero.
 */

import React, { useMemo, useState } from 'react';

import {
  V33PixelMeasurementResult,
  V33ResearchNodeRecord,
  VISION_BASELINE_VERSION,
  FROZEN_TAXONOMY_VERSION,
  FROZEN_30_CLASS_TAXONOMY,
} from '../types';

import {
  PaperResearchAssemblyResult,
} from '../utils/paperResearchAssembler';

import {
  PaperSynthesisResult,
} from '../utils/simComputationEngine';

import type {
  PaperVlmV30Measurement,
} from '../types';

import type {
  QwenCsvImportedRecord,
} from '../research/paperVlmQwenCsvImporter';

import type {
  QwenPaperApprovalRecord,
} from '../research/paperVlmQwenBridge';

import type {
  RepoPaperBridgeAssembly,
} from '../data/teamRepository/teamRepositoryTypes';

import {
  NATURE_903_GWR_PAPER_DIAGNOSTICS,
  NATURE_903_FINAL_GWR_DIAGNOSTICS,
  FINAL_PAPER_SAMPLE_ACCOUNTING,
  SPACE_SYNTAX_PAPER_SPECIFICATION,
  REPOSITORY_GWR_CALIBRATION_RECORD,
  SOURCE_CONFLICT_AUDIT_NOTICE,
  buildMurrayHillGeometryContext,
  buildSpaceSyntaxGwrReconciliationExport,
  buildBehavioralStayabilityReconciliationExport,
  buildMultiSourceMasterPayload,
  V070_VERSION_METADATA,
} from '../research/multiSourceResearchRegistry';

import {
  MultiSourceResearchStatusTable,
} from './MultiSourceResearchStatusTable';

import {
  buildStreetViewSamplingGeometryExport,
} from '../data/streetViewNodes/streetViewNodeBridge';

import {
  PAPER_VLM_FIELD_ORDER,
} from '../research/paperVlmInstrument';

import {
  exportElementAsPng,
  exportElementAsPdf,
} from '../utils/exportUtils';

import {
  Download,
  FileSpreadsheet,
  FileText,
  FileJson,
  Image as ImageIcon,
  Copy,
  Check,
  Printer,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
} from 'lucide-react';

interface ReportAndExportSectionProps {
  pixelMeasurements: V33PixelMeasurementResult | null;
  researchNode: V33ResearchNodeRecord | null;

  /**
   * Optional at the component boundary so a temporarily stale App.tsx
   * cannot crash the entire preview during migration.
   *
   * The panel renders an explicit integration warning until both are supplied.
   */
  paperAssembly?: PaperResearchAssemblyResult;
  paperSynthesis?: PaperSynthesisResult;

  activeImageId: string;
  originalUrl: string;
  originalFilename?: string | null;
  pixelClassificationUrl: string;

  /**
   * Qwen instrument v0.3 provenance. Optional so export remains migration-safe.
   */
  qwenImportedRecord?: QwenCsvImportedRecord | null;
  qwenPaperApproval?: QwenPaperApprovalRecord | null;
  repoAssembly?: RepoPaperBridgeAssembly | null;

  teacherComparatorMeasurement?: PaperVlmV30Measurement | null;
  teacherComparatorMetadata?: {
    rawResponse: string;
    modelUsed: string;
    protocolVersion: string;
  } | null;
}

type ExportFeedback = {
  type: 'success' | 'error';
  text: string;
};

function formatMetric(
  value: number | null | undefined,
  digits = 6
): number | null {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return null;
  }

  return Number(
    value.toFixed(digits)
  );
}

function repoRawOrdinal(field: any): number | null {
  const direct = Number(field?.sourceValue);
  if (Number.isFinite(direct)) {
    return direct;
  }

  const normalized = field?.value;
  if (typeof normalized === 'number' && Number.isFinite(normalized)) {
    return normalized * 6 + 1;
  }

  return null;
}

function repoNormalized(field: any): number | null {
  return typeof field?.value === 'number' && Number.isFinite(field.value)
    ? field.value
    : null;
}

function repoDisplayRung(field: any): number | null {
  if (
    typeof field?.displayRung === 'number' &&
    Number.isFinite(field.displayRung)
  ) {
    return field.displayRung;
  }

  const raw = repoRawOrdinal(field);
  return raw === null ? null : Math.min(7, Math.max(1, Math.round(raw)));
}

function repoProbabilityValues(field: any): number[] | null {
  const p = field?.probabilityDistribution;
  if (!p) return null;

  const values = [p.p1, p.p2, p.p3, p.p4, p.p5, p.p6, p.p7].map(Number);
  if (values.some((value) => !Number.isFinite(value) || value < 0)) return null;

  const total = values.reduce((sum, value) => sum + value, 0);
  return total > 0 ? values : null;
}

function repoProbabilityExpectedValue(field: any): number | null {
  const values = repoProbabilityValues(field);
  if (!values) return null;

  const total = values.reduce((sum, value) => sum + value, 0);
  return values.reduce(
    (sum, value, index) => sum + ((index + 1) * value) / total,
    0,
  );
}

function repoProbabilityNormalizedEv(field: any): number | null {
  const ev = repoProbabilityExpectedValue(field);
  return ev === null ? null : (ev - 1) / 6;
}

function repoProbabilityArgmax(field: any): number | null {
  const values = repoProbabilityValues(field);
  if (!values) return null;

  let bestIndex = 0;
  for (let index = 1; index < values.length; index += 1) {
    if (values[index] > values[bestIndex]) bestIndex = index;
  }
  return bestIndex + 1;
}

function exportMetricWithAuthorization(
  metric: any,
  authorizationStatus: 'AUTHORIZED' | 'PREVIEW_ONLY_NOT_APPROVED' | 'NOT_APPLICABLE'
): any {
  if (
    authorizationStatus === 'PREVIEW_ONLY_NOT_APPROVED' &&
    metric?.status === 'computed'
  ) {
    return {
      ...metric,
      computation_status: 'computed',
      status: 'PREVIEW_ONLY_NOT_APPROVED',
      authorization_status: 'PREVIEW_ONLY_NOT_APPROVED',
    };
  }

  if (authorizationStatus === 'AUTHORIZED' && metric?.status === 'computed') {
    return {
      ...metric,
      computation_status: 'computed',
      authorization_status: 'AUTHORIZED',
    };
  }

  return metric;
}

function basename(
  path: string | null | undefined
): string | null {
  if (!path) {
    return null;
  }

  const normalized =
    path.replace(/\\/g, '/');

  const last =
    normalized
      .split('/')
      .pop()
      ?.trim();

  return last || null;
}

function normalizedFilename(
  path: string | null | undefined
): string | null {
  const base =
    basename(path);

  return base
    ? base.toLowerCase()
    : null;
}

function csvEscape(
  value: unknown
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return '';
  }

  const text =
    typeof value === 'string'
      ? value
      : JSON.stringify(value);

  if (
    text.includes(',') ||
    text.includes('"') ||
    text.includes('\n')
  ) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export const ReportAndExportSection: React.FC<
  ReportAndExportSectionProps
> = ({
  pixelMeasurements,
  researchNode,
  paperAssembly,
  paperSynthesis,
  activeImageId,
  originalUrl,
  originalFilename = null,
  pixelClassificationUrl,
  qwenImportedRecord = null,
  qwenPaperApproval = null,
  repoAssembly = null,
  teacherComparatorMeasurement = null,
  teacherComparatorMetadata = null,
}) => {
  const [copied, setCopied] =
    useState(false);

  const [showPrintView, setShowPrintView] =
    useState(false);

  const [isExportingPng, setIsExportingPng] =
    useState(false);

  const [isExportingPdf, setIsExportingPdf] =
    useState(false);

  const [exportMessage, setExportMessage] =
    useState<ExportFeedback | null>(
      null
    );

  // ===========================================================================
  // PAPER-ALIGNED EXPORT RECORD
  // ===========================================================================

  const generatedRecord =
    useMemo(() => {
      /**
       * Migration safeguard:
       *
       * A stale App.tsx may temporarily render this new component without
       * paperAssembly / paperSynthesis. Do not crash the full application.
       */
      if (
        !paperAssembly ||
        !paperSynthesis
      ) {
        return {
          schema_version:
            'street_interface_paper_aligned_v0.7.0_nature_9_03_no_omega_rc1',

          image_id:
            activeImageId,

          exported_at:
            new Date().toISOString(),

          integration_status:
            'paper_props_missing',

          message:
            'ReportAndExportSection requires paperAssembly and paperSynthesis from App.tsx.',
        };
      }

      const visionNode =
        researchNode || {
          record_id:
            `NODE_${activeImageId}_UNSAVED`,

          image_id:
            activeImageId,

          created_at:
            null,

          schema_version:
            'vision_bridge_v1.2',

          taxonomy_status:
            pixelMeasurements
              ? 'configured'
              : 'not_measured',

          pixel_measurements:
            pixelMeasurements,

          derived_indices: {
            natural_built_above_ground_ratio:
              pixelMeasurements
                ?.derived_metrics
                .natural_built_above_ground_ratio
                .value ?? null,

            sidewalk_paver_ratio:
              pixelMeasurements
                ?.derived_metrics
                .sidewalk_paver_ratio
                .value ?? null,

            signboard_detail_ratio:
              pixelMeasurements
                ?.derived_metrics
                .signboard_detail_ratio
                .value ?? null,
          },
        };

      const qwenSourceFilename =
        qwenImportedRecord
          ?.sourceIdentity
          .file ??
        repoAssembly?.matchedRecord.identity.sourceFilename ??
        null;

      const sourceImageMatch =
        normalizedFilename(
          originalFilename
        ) !== null &&
        normalizedFilename(
          originalFilename
        ) ===
          normalizedFilename(
            qwenSourceFilename
          );

      const qwenApprovalActive = Boolean(qwenPaperApproval);
      const synthesisAuthorizationStatus = repoAssembly
        ? qwenApprovalActive
          ? 'AUTHORIZED'
          : 'PREVIEW_ONLY_NOT_APPROVED'
        : 'NOT_APPLICABLE';

      const activeSynthesis = repoAssembly?.synthesis ?? paperSynthesis;
      const activeElasticities = activeSynthesis.localElasticities.value;

      const multiSourceMaster = buildMultiSourceMasterPayload({
        nodeId: repoAssembly?.nodeId ?? 'UNRESOLVED_NODE',
        isApproved: qwenApprovalActive,
        sourceImageId: qwenSourceFilename,
        geometry: repoAssembly?.matchedRecord.geometryRecord ?? null,
        streetSampling: null,
        activeSim: {
          I: activeSynthesis.placeImageability.value,
          Y: activeSynthesis.placeIdentity.value,
          D: activeSynthesis.placeDependence.value,
          a: activeElasticities?.a ?? null,
          b: activeElasticities?.b ?? null,
          c: activeElasticities?.c ?? null,
          M: activeSynthesis.sim.value,
        },
      });

      return {
        schema_version:
          'street_interface_paper_aligned_v0.7.0_multi_source_master_rc1',

        image_id:
          activeImageId,

        exported_at:
          new Date().toISOString(),

        multi_source_master: multiSourceMaster,

        source_images: {
          original_available:
            Boolean(originalUrl),

          original_filename:
            originalFilename,

          pixel_classification_available:
            Boolean(pixelClassificationUrl),

          qwen_source_image:
            qwenSourceFilename,

          qwen_source_image_basename:
            basename(qwenSourceFilename),

          app_qwen_source_image_match:
            sourceImageMatch,
        },

        protocol: {
          vision_baseline:
            VISION_BASELINE_VERSION,

          taxonomy_version:
            FROZEN_TAXONOMY_VERSION,

          strict_paper_mode:
            paperAssembly.strictPaperMode,

          computation_engine:
            paperSynthesis.engineVersion,

          calibration_profile:
            paperSynthesis.calibration,

          paper_method:
            'Nature 9.03 Final · No-Omega v0.7.0 — Multi-Source Research Integration',

          scientific_core_version:
            'v0.6.3_GOLDEN_FREEZE',

          active_vlm_owner:
            repoAssembly
              ? qwenApprovalActive
                ? 'approved_team_repository_data_bridge'
                : 'team_repository_data_bridge_preview_only'
              : qwenImportedRecord
                ? qwenApprovalActive
                  ? 'approved_team_qwen_7_rung_instrument'
                  : 'team_qwen_7_rung_preview_only'
                : 'none',

          teacher_gemma_role:
            'experimental_comparator_only',
        },

        vision_layer: {
          node_record:
            visionNode,

          measurement_status:
            pixelMeasurements?.status ??
            'not_run',

          recovery_warning:
            pixelMeasurements?.status_reason?.includes(
              'PRESENTATION SCREENSHOT RECOVERY — DEMO ONLY'
            )
              ? 'PRESENTATION SCREENSHOT RECOVERY — DEMO ONLY'
              : null,

          coverage:
            pixelMeasurements?.coverage ??
            null,
        },

        qwen_vlm_instrument: {
          imported:
            Boolean(qwenImportedRecord) || Boolean(repoAssembly),

          approval_active:
            qwenApprovalActive,

          approval_record:
            qwenApprovalActive ? qwenPaperApproval : null,

          source_image_match:
            sourceImageMatch,

          source_identity:
            qwenImportedRecord
              ?.sourceIdentity ?? (repoAssembly ? {
                file: repoAssembly.matchedRecord.identity.sourceFilename,
                street: repoAssembly.matchedRecord.identity.street || '',
                walk: repoAssembly.matchedRecord.identity.walkDirection || '',
                seq: repoAssembly.matchedRecord.identity.sequence ?? 1,
                node_id: repoAssembly.matchedRecord.identity.nodeId,
                cardinal: repoAssembly.matchedRecord.identity.cardinalDirection || '',
                side: repoAssembly.matchedRecord.identity.side || '',
              } : null),

          source_view_protocol:
            (qwenImportedRecord?.sourceProtocol.view_protocol === 'team_along_street_180' || repoAssembly)
              ? 'TEAM_ALONG_STREET_180'
              : null,

          source_field_of_view_degrees:
            (qwenImportedRecord?.sourceProtocol.view_protocol === 'team_along_street_180' || repoAssembly)
              ? 180
              : qwenImportedRecord?.sourceProtocol.field_of_view_degrees ?? null,

          source_directionality:
            (qwenImportedRecord?.sourceProtocol.view_protocol === 'team_along_street_180' || repoAssembly)
              ? 'BIDIRECTIONAL_FORWARD_BACKWARD'
              : null,

          source_axis_alignment:
            (qwenImportedRecord?.sourceProtocol.view_protocol === 'team_along_street_180' || repoAssembly)
              ? 'STREET_AXIS'
              : null,

          paper_protocol_alignment_status:
            (qwenImportedRecord?.sourceProtocol.view_protocol === 'team_along_street_180' || repoAssembly)
              ? 'UNRESOLVED_PAPER_PROTOCOL_ALIGNMENT'
              : qwenImportedRecord?.sourceProtocol.orientation_alignment_status ?? null,

          source_protocol:
            qwenImportedRecord
              ? {
                  ...qwenImportedRecord.sourceProtocol,
                  ...(qwenImportedRecord.sourceProtocol.view_protocol === 'team_along_street_180'
                    ? {
                        recognized_team_90_view: false,
                        source_filename: 'vlm_observations_murrayhill.csv',
                        source_schema: 'MEDIAN_LED_REPOSITORY_TABLE' as const,
                        view_protocol: 'team_along_street_180' as const,
                        orientation_alignment_status: 'UNRESOLVED_PAPER_PROTOCOL_ALIGNMENT' as const,
                        view_center_offset_from_walk_degrees: 0 as const,
                        field_of_view_degrees: 180 as const,
                      }
                    : {}),
                }
              : (repoAssembly ? {
                  recognized_team_90_view: false,
                  source_csv_format: 'vlm_observations_murrayhill' as const,
                  source_filename: 'vlm_observations_murrayhill.csv',
                  source_schema: 'MEDIAN_LED_REPOSITORY_TABLE' as const,
                  probability_storage_decimals: 4 as const,
                  view_protocol: 'team_along_street_180' as const,
                  orientation_alignment_status: 'UNRESOLVED_PAPER_PROTOCOL_ALIGNMENT' as const,
                  view_center_offset_from_walk_degrees: 0 as const,
                  field_of_view_degrees: 180 as const,
                } : null),

          run:
            qwenImportedRecord
              ? {
                  ...qwenImportedRecord.run,
                  node_metadata:
                    qwenImportedRecord.sourceProtocol.view_protocol === 'team_along_street_180'
                      ? {
                          ...qwenImportedRecord.run.node_metadata,
                          view_protocol: 'team_along_street_180' as const,
                          orientation_alignment_status: 'UNRESOLVED_PAPER_PROTOCOL_ALIGNMENT' as const,
                          view_center_offset_from_walk_degrees: 0 as const,
                          horizon_alignment_verified: false,
                          field_of_view_degrees: 180 as const,
                        }
                      : qwenImportedRecord.run.node_metadata,
                }
              : (repoAssembly ? {
                schema_version: 'paper_vlm_instrument_v0.3',
                node_metadata: {
                  image_quadrant: null,
                  view_protocol: 'team_along_street_180',
                  orientation_alignment_status: 'UNRESOLVED_PAPER_PROTOCOL_ALIGNMENT',
                  walk_cardinal: (repoAssembly.matchedRecord.identity.cardinalDirection || 'S') as any,
                  walk_side: (repoAssembly.matchedRecord.identity.side || 'W') as any,
                  view_center_offset_from_walk_degrees: 0 as const,
                  horizon_alignment_verified: false,
                  field_of_view_degrees: 180,
                  eye_height_m: null,
                  pitch_degrees: null,
                  node_id: repoAssembly.nodeId,
                  source_image_id: repoAssembly.matchedRecord.identity.sourceFilename,
                },
                model: {
                  family: 'Qwen',
                  model_id: 'Qwen/Qwen2-VL-7B-Instruct',
                  inference_mode: 'one_field_per_call',
                  score_readout: 'next_token_logits_1_to_7',
                },
                complete: true,
                eligible_for_paper_assembly: true,
                warnings: [],
                fields: {
                  vertical_greenery: {
                    field_id: 'vertical_greenery',
                    paper_variable: 'V_nat',
                    rung: repoDisplayRung(repoAssembly.mappedVariables.vNat),
                    expected_value: repoProbabilityExpectedValue(repoAssembly.mappedVariables.vNat),
                    argmax: repoProbabilityArgmax(repoAssembly.mappedVariables.vNat),
                    probabilities: repoAssembly.mappedVariables.vNat.probabilityDistribution ?? null,
                    normalized_ev: repoProbabilityNormalizedEv(repoAssembly.mappedVariables.vNat),
                    continuous_readout_method: 'ORDINAL_INTERPOLATED_MEDIAN',
                    continuous_readout_value: repoRawOrdinal(repoAssembly.mappedVariables.vNat),
                    normalized_continuous_readout: repoNormalized(repoAssembly.mappedVariables.vNat),
                    instrument_version: 'qwen_7_rung_v0.3',
                    validation: { strength: 'strong' },
                  },
                  vertical_hardscape: {
                    field_id: 'vertical_hardscape',
                    paper_variable: 'V_built',
                    rung: repoDisplayRung(repoAssembly.mappedVariables.vBuilt),
                    expected_value: repoProbabilityExpectedValue(repoAssembly.mappedVariables.vBuilt),
                    argmax: repoProbabilityArgmax(repoAssembly.mappedVariables.vBuilt),
                    probabilities: repoAssembly.mappedVariables.vBuilt.probabilityDistribution ?? null,
                    normalized_ev: repoProbabilityNormalizedEv(repoAssembly.mappedVariables.vBuilt),
                    continuous_readout_method: 'ORDINAL_INTERPOLATED_MEDIAN',
                    continuous_readout_value: repoRawOrdinal(repoAssembly.mappedVariables.vBuilt),
                    normalized_continuous_readout: repoNormalized(repoAssembly.mappedVariables.vBuilt),
                    instrument_version: 'qwen_7_rung_v0.3',
                    validation: { strength: 'strong' },
                  },
                  green_eye_level: {
                    field_id: 'green_eye_level',
                    paper_variable: 'GVI_eye',
                    rung: repoDisplayRung(repoAssembly.mappedVariables.gviEye),
                    expected_value: repoProbabilityExpectedValue(repoAssembly.mappedVariables.gviEye),
                    argmax: repoProbabilityArgmax(repoAssembly.mappedVariables.gviEye),
                    probabilities: repoAssembly.mappedVariables.gviEye.probabilityDistribution ?? null,
                    normalized_ev: repoProbabilityNormalizedEv(repoAssembly.mappedVariables.gviEye),
                    continuous_readout_method: 'ORDINAL_INTERPOLATED_MEDIAN',
                    continuous_readout_value: repoRawOrdinal(repoAssembly.mappedVariables.gviEye),
                    normalized_continuous_readout: repoNormalized(repoAssembly.mappedVariables.gviEye),
                    instrument_version: 'qwen_7_rung_v0.3',
                    validation: { strength: 'strong' },
                  },
                  green_softening: {
                    field_id: 'green_softening',
                    paper_variable: 'GMI',
                    rung: repoDisplayRung(repoAssembly.mappedVariables.gmi),
                    expected_value: repoProbabilityExpectedValue(repoAssembly.mappedVariables.gmi),
                    argmax: repoProbabilityArgmax(repoAssembly.mappedVariables.gmi),
                    probabilities: repoAssembly.mappedVariables.gmi.probabilityDistribution ?? null,
                    normalized_ev: repoProbabilityNormalizedEv(repoAssembly.mappedVariables.gmi),
                    continuous_readout_method: 'ORDINAL_INTERPOLATED_MEDIAN',
                    continuous_readout_value: repoRawOrdinal(repoAssembly.mappedVariables.gmi),
                    normalized_continuous_readout: repoNormalized(repoAssembly.mappedVariables.gmi),
                    instrument_version: 'qwen_7_rung_v0.3',
                    validation: { strength: 'strong' },
                  },
                  signage_detail: {
                    field_id: 'signage_detail',
                    paper_variable: 'V_sign',
                    rung: repoDisplayRung(repoAssembly.mappedVariables.vSign),
                    expected_value: repoProbabilityExpectedValue(repoAssembly.mappedVariables.vSign),
                    argmax: repoProbabilityArgmax(repoAssembly.mappedVariables.vSign),
                    probabilities: repoAssembly.mappedVariables.vSign.probabilityDistribution ?? null,
                    normalized_ev: repoProbabilityNormalizedEv(repoAssembly.mappedVariables.vSign),
                    continuous_readout_method: 'ORDINAL_INTERPOLATED_MEDIAN',
                    continuous_readout_value: repoRawOrdinal(repoAssembly.mappedVariables.vSign),
                    normalized_continuous_readout: repoNormalized(repoAssembly.mappedVariables.vSign),
                    instrument_version: 'qwen_7_rung_v0.3',
                    validation: { strength: 'strong' },
                  },
                  sky_openness: {
                    field_id: 'sky_openness',
                    paper_variable: 'sky_openness_proxy',
                    rung: repoDisplayRung(repoAssembly.mappedVariables.svf),
                    expected_value: repoProbabilityExpectedValue(repoAssembly.mappedVariables.svf),
                    argmax: repoProbabilityArgmax(repoAssembly.mappedVariables.svf),
                    probabilities: repoAssembly.mappedVariables.svf.probabilityDistribution ?? null,
                    normalized_ev: repoProbabilityNormalizedEv(repoAssembly.mappedVariables.svf),
                    continuous_readout_method: 'ORDINAL_INTERPOLATED_MEDIAN',
                    continuous_readout_value: repoRawOrdinal(repoAssembly.mappedVariables.svf),
                    normalized_continuous_readout: repoNormalized(repoAssembly.mappedVariables.svf),
                    instrument_version: 'qwen_7_rung_v0.3',
                    validation: { strength: 'strong' },
                  },
                  ground_floor_activity: {
                    field_id: 'ground_floor_activity',
                    paper_variable: 'GFAPI',
                    rung: repoDisplayRung(repoAssembly.mappedVariables.gfapi),
                    expected_value: repoProbabilityExpectedValue(repoAssembly.mappedVariables.gfapi),
                    argmax: repoProbabilityArgmax(repoAssembly.mappedVariables.gfapi),
                    probabilities: repoAssembly.mappedVariables.gfapi.probabilityDistribution ?? null,
                    normalized_ev: repoProbabilityNormalizedEv(repoAssembly.mappedVariables.gfapi),
                    continuous_readout_method: 'ORDINAL_INTERPOLATED_MEDIAN',
                    continuous_readout_value: repoRawOrdinal(repoAssembly.mappedVariables.gfapi),
                    normalized_continuous_readout: repoNormalized(repoAssembly.mappedVariables.gfapi),
                    instrument_version: 'qwen_7_rung_v0.3',
                    validation: { strength: 'strong' },
                  },
                  walkable_ground: {
                    field_id: 'walkable_ground',
                    paper_variable: 'V_pave',
                    rung: repoDisplayRung(repoAssembly.mappedVariables.vPave),
                    expected_value: repoProbabilityExpectedValue(repoAssembly.mappedVariables.vPave),
                    argmax: repoProbabilityArgmax(repoAssembly.mappedVariables.vPave),
                    probabilities: repoAssembly.mappedVariables.vPave.probabilityDistribution ?? null,
                    normalized_ev: repoProbabilityNormalizedEv(repoAssembly.mappedVariables.vPave),
                    continuous_readout_method: 'ORDINAL_INTERPOLATED_MEDIAN',
                    continuous_readout_value: repoRawOrdinal(repoAssembly.mappedVariables.vPave),
                    normalized_continuous_readout: repoNormalized(repoAssembly.mappedVariables.vPave),
                    instrument_version: 'qwen_7_rung_v0.3',
                    validation: { strength: 'strong' },
                  },
                  resting_affordance: {
                    field_id: 'resting_affordance',
                    paper_variable: 'IAS',
                    rung: repoDisplayRung(repoAssembly.mappedVariables.ias),
                    expected_value: repoProbabilityExpectedValue(repoAssembly.mappedVariables.ias),
                    argmax: repoProbabilityArgmax(repoAssembly.mappedVariables.ias),
                    probabilities: repoAssembly.mappedVariables.ias.probabilityDistribution ?? null,
                    normalized_ev: repoProbabilityNormalizedEv(repoAssembly.mappedVariables.ias),
                    continuous_readout_method: 'ORDINAL_INTERPOLATED_MEDIAN',
                    continuous_readout_value: repoRawOrdinal(repoAssembly.mappedVariables.ias),
                    normalized_continuous_readout: repoNormalized(repoAssembly.mappedVariables.ias),
                    instrument_version: 'qwen_7_rung_v0.3',
                    validation: { strength: 'strong' },
                  },
                  facade_variation: {
                    field_id: 'facade_variation',
                    paper_variable: 'SFV',
                    rung: repoDisplayRung(repoAssembly.mappedVariables.sfv),
                    expected_value: repoProbabilityExpectedValue(repoAssembly.mappedVariables.sfv),
                    argmax: repoProbabilityArgmax(repoAssembly.mappedVariables.sfv),
                    probabilities: repoAssembly.mappedVariables.sfv.probabilityDistribution ?? null,
                    normalized_ev: repoProbabilityNormalizedEv(repoAssembly.mappedVariables.sfv),
                    continuous_readout_method: 'ORDINAL_INTERPOLATED_MEDIAN',
                    continuous_readout_value: repoRawOrdinal(repoAssembly.mappedVariables.sfv),
                    normalized_continuous_readout: repoNormalized(repoAssembly.mappedVariables.sfv),
                    instrument_version: 'qwen_7_rung_v0.3',
                    validation: { strength: 'strong' },
                  },
                },
              } : null),

          note:
            'The full Qwen run preserves rung, expected value, argmax, p1–p7, normalized_ev, validation status, model provenance and orientation provenance. Approval remains separately recorded.',
        },

        team_repository_bridge: repoAssembly ? {
          repository_name: repoAssembly.matchedRecord.sourceMetadata.repositoryName,
          repository_commit: repoAssembly.matchedRecord.sourceMetadata.repositoryCommit,
          repository_data_version: repoAssembly.matchedRecord.sourceMetadata.repositoryDataVersion,
          import_timestamp: repoAssembly.matchedRecord.sourceMetadata.importTimestamp,
          bridge_status: repoAssembly.bridgeStatus,
          node_id: repoAssembly.nodeId,
          source_filename: repoAssembly.matchedRecord.identity.sourceFilename,
          match_strategy: repoAssembly.matchedRecord.matchStrategy,
          usable_status: repoAssembly.usabilityStatus,
          usable_for_active_synthesis: repoAssembly.usableForActiveSynthesis,
          exclude_reason: repoAssembly.excludeReason,
          paper_variables_available: repoAssembly.availablePaperVariableKeys,
          paper_variables_missing: repoAssembly.missingPaperVariableKeys,
          supplementary_variables: repoAssembly.supplementaryVariableKeys,
          excluded_downstream_variables: repoAssembly.excludedDownstreamVariableKeys,
          calibration_mode: repoAssembly.calibrationMode,
          mapped_paper_variables: repoAssembly.mappedVariables,
          trace_provenance: {
            synthesis_formula: 'M_i = I_i^a_i × Y_i^b_i × D_i^c_i',
            trace_path: 'M -> I/Y/D -> paper input -> Qwen/geometry field -> repository source row',
            provenance_trail: repoAssembly.provenanceTrail,
          },
          comparative_legacy_finals: repoAssembly.matchedRecord.comparativeFinals ?? null,
        } : null,

        teacher_gemma_comparator: {
          role:
            'experimental_comparator_only',

          measurement:
            teacherComparatorMeasurement,

          metadata:
            teacherComparatorMetadata
              ? {
                  model_used:
                    teacherComparatorMetadata.modelUsed,

                  protocol_version:
                    teacherComparatorMetadata.protocolVersion,

                  raw_response_stored:
                    Boolean(
                      teacherComparatorMetadata.rawResponse
                    ),
                }
              : null,

          raw_response_excluded_from_export:
            true,

          comparison_allowed_only_on_source_match:
            true,
        },

        paper_variable_assembly: {
          variables:
            paperAssembly.variables,

          taxonomy_capabilities:
            paperAssembly.taxonomyCapabilities,

          computation_inputs:
            paperAssembly.paperInputs,

          assembly_gates:
            paperAssembly.gates,
        },

        paper_synthesis: {
          authorization_status:
            synthesisAuthorizationStatus,

          authorization_note:
            synthesisAuthorizationStatus === 'PREVIEW_ONLY_NOT_APPROVED'
              ? 'Deterministic values are preview-only until repository authorization is established.'
              : synthesisAuthorizationStatus === 'AUTHORIZED'
                ? repoAssembly
                  ? 'Repository record automatically authorized by the default VLM Observations workflow.'
                  : 'Explicit approval completed for this legacy/direct-import synthesis source.'
                : 'No repository authorization applies to this synthesis source.',

          imageability_raw:
            exportMetricWithAuthorization(
              repoAssembly?.synthesis?.imageabilityRaw ?? paperSynthesis.imageabilityRaw,
              synthesisAuthorizationStatus
            ),

          place_imageability:
            exportMetricWithAuthorization(
              repoAssembly?.synthesis?.placeImageability ?? paperSynthesis.placeImageability,
              synthesisAuthorizationStatus
            ),

          place_identity:
            exportMetricWithAuthorization(
              repoAssembly?.synthesis?.placeIdentity ?? paperSynthesis.placeIdentity,
              synthesisAuthorizationStatus
            ),

          dependence_raw:
            exportMetricWithAuthorization(
              repoAssembly?.synthesis?.dependenceRaw ?? paperSynthesis.dependenceRaw,
              synthesisAuthorizationStatus
            ),

          place_dependence:
            exportMetricWithAuthorization(
              repoAssembly?.synthesis?.placeDependence ?? paperSynthesis.placeDependence,
              synthesisAuthorizationStatus
            ),

          space_syntax_controls:
            repoAssembly?.synthesis?.spaceSyntaxControls ?? paperSynthesis.spaceSyntaxControls,

          local_elasticities:
            exportMetricWithAuthorization(
              repoAssembly?.synthesis?.localElasticities ?? paperSynthesis.localElasticities,
              synthesisAuthorizationStatus
            ),

          sim:
            exportMetricWithAuthorization(
              repoAssembly?.synthesis?.sim ?? paperSynthesis.sim,
              synthesisAuthorizationStatus
            ),

          stayability_factor_F_i:
            repoAssembly?.synthesis?.stayabilityFactor ?? paperSynthesis.stayabilityFactor,

          t_effective:
            repoAssembly?.synthesis?.tEffective ?? paperSynthesis.tEffective,

          synthesis_gates:
            repoAssembly?.synthesis?.gates ?? paperSynthesis.gates,

          active_formula:
            'M_i = I_i^a_i × Y_i^b_i × D_i^c_i',
        },

        multi_source_research_integration: {
          version: 'v0.7.0',
          release_candidate_status: V070_VERSION_METADATA.releaseCandidateStatus,
          frozen_scientific_core: 'v0.6.3_GOLDEN_FREEZE',
          multi_source_master: multiSourceMaster,
          active_sim: multiSourceMaster.active_sim,
          geometry_context: {
            h_m: repoAssembly?.matchedRecord.geometryRecord.hM ?? null,
            w_facade: repoAssembly?.matchedRecord.geometryRecord.wFacade ?? null,
            hw_facade: repoAssembly?.matchedRecord.geometryRecord.hwFacade ?? null,
            hw_effective: repoAssembly?.matchedRecord.geometryRecord.hwEffective ?? null,
            hw_source: repoAssembly?.matchedRecord.geometryRecord.hwSource ?? null,
            node_gvi: repoAssembly?.matchedRecord.geometryRecord.nodeGVI ?? null,
            node_vei: repoAssembly?.matchedRecord.geometryRecord.nodeVEI ?? null,
            node_svf_band: repoAssembly?.matchedRecord.geometryRecord.nodeSVFBand ?? null,
            status: repoAssembly?.matchedRecord.geometryRecord ? 'REPO_MEASURED_OR_DERIVED' : 'UNAVAILABLE',
            node_svf_band_warning:
              'Finite elevation-band sky fraction. Not a true whole-sky SVF and prohibited from overwriting the active Qwen sky-openness proxy.',
            node_gvi_warning:
              'Contextual visual metric; strictly distinct from eye-level green_eye_level_median / GVI_eye.',
          },
          murray_hill_geometry_context: buildMurrayHillGeometryContext(
            repoAssembly?.nodeId ?? 'n00045',
            repoAssembly?.matchedRecord.geometryRecord
          ),
          street_view_sampling_geometry: buildStreetViewSamplingGeometryExport(
            repoAssembly?.nodeId ?? 'n00045'
          ),
          paper_reported_gwr_diagnostics: NATURE_903_GWR_PAPER_DIAGNOSTICS,
          space_syntax_gwr_reconciliation: buildSpaceSyntaxGwrReconciliationExport(),
          behavioral_stayability_reconciliation: buildBehavioralStayabilityReconciliationExport(
            repoAssembly?.nodeId ?? 'UNRESOLVED_NODE',
            activeSynthesis.sim.value
          ),
          node_level_space_syntax: {
            choice: null,
            integration: null,
            status: 'UNAVAILABLE_NODE_LEVEL_SOURCE',
          },
          node_level_gwr: {
            local_betas: null,
            status: 'UNAVAILABLE_NODE_LEVEL_CALIBRATION',
            active_fallback: {
              source: 'PAPER_GLOBAL_REFERENCE',
              a: 0.40,
              b: 0.20,
              c: 0.40,
              reason:
                'Node-specific local GWR coefficients are unavailable. Paper global reference elasticities remain the active fallback.',
            },
          },
          behavioral_observation: {
            t_raw_seconds: null,
            t_base: null,
            lambda: null,
            status: 'SOURCE_GATED',
          },
          provenance_boundary: SOURCE_CONFLICT_AUDIT_NOTICE.resolution,
        },

        deprecated_legacy_method: {
          environmental_tfp_A_i:
            paperSynthesis.environmentalTfp,
          used_in_active_sim: false,
          omega_threshold: null,
          note:
            'Nature 9.03 Final (No-Omega) retires canyon factor A_i from active SIM calculation. Retained for historical comparative context only.',
        },

        methodological_boundary: {
          single_node_mode:
            true,

          gwr_calibrated_in_app:
            false,

          d_xy_computed_in_app:
            false,

          missing_values_are_zero:
            false,

          candidate_mapping_is_paper_ready:
            false,

          space_syntax_controls_required_for_latest_gwr:
            true,

          space_syntax_radius_m:
            800,

          gwr_intercept_beta0_status:
            paperAssembly
              .paperInputs
              .gwrLocalBetas
              ?.betaIntercept === null ||
            paperAssembly
              .paperInputs
              .gwrLocalBetas
              ?.betaIntercept === undefined
              ? 'not_supplied'
              : 'stored_provenance_only',

          beta0_enters_elasticity_normalization:
            false,

          beta_choice_enters_elasticity_normalization:
            false,

          beta_integration_enters_elasticity_normalization:
            false,

          qwen_orientation_protocol:
            (qwenImportedRecord?.sourceProtocol.view_protocol === 'team_along_street_180' || repoAssembly)
              ? 'TEAM_ALONG_STREET_180'
              : qwenImportedRecord?.run.node_metadata.view_protocol ?? null,

          qwen_orientation_alignment_status:
            (qwenImportedRecord?.sourceProtocol.view_protocol === 'team_along_street_180' || repoAssembly)
              ? 'UNRESOLVED_PAPER_PROTOCOL_ALIGNMENT'
              : qwenImportedRecord?.run.node_metadata.orientation_alignment_status ?? null,

          qwen_approval_active:
            qwenApprovalActive,

          app_qwen_source_match:
            sourceImageMatch,
        },
      };
    }, [
      activeImageId,
      originalUrl,
      pixelClassificationUrl,
      pixelMeasurements,
      researchNode,
      paperAssembly,
      paperSynthesis,
      originalFilename,
      qwenImportedRecord,
      qwenPaperApproval,
      repoAssembly,
      teacherComparatorMeasurement,
      teacherComparatorMetadata,
    ]);

  const jsonString =
    useMemo(
      () =>
        JSON.stringify(
          generatedRecord,
          null,
          2
        ),
      [
        generatedRecord,
      ]
    );

  // ===========================================================================
  // APP ↔ REPORT INTEGRATION GUARD
  // ===========================================================================
  //
  // All hooks have already been declared above. It is now safe to render a
  // migration warning without violating React hook ordering.
  // ===========================================================================

  if (
    !paperAssembly ||
    !paperSynthesis
  ) {
    return (
      <section
        id="report-and-export"
        className="bg-amber-50 border border-amber-300 rounded-lg p-5"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />

          <div className="space-y-2">
            <div>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-stone-900 text-white rounded">
                EXPORT
              </span>

              <h3 className="text-sm font-bold font-mono text-amber-950 mt-2">
                Research Export Integration Required
              </h3>
            </div>

            <p className="text-xs text-amber-900 leading-relaxed">
              The new ReportAndExportSection is loaded, but the active App.tsx
              has not supplied both paperAssembly and paperSynthesis.
              The rest of the application remains available; replace App.tsx
              with the synchronized Paper-Aligned version.
            </p>

            <code className="block bg-white border border-amber-200 rounded p-3 text-[10px] font-mono text-stone-800 whitespace-pre-wrap">
{`<ReportAndExportSection
  pixelMeasurements={pixelMeasurements}
  researchNode={researchNode}
  paperAssembly={paperAssembly}
  paperSynthesis={paperSynthesis}
  activeImageId={activeImageId}
  originalUrl={originalUrl}
  originalFilename={originalFilename}
  pixelClassificationUrl={pixelClassificationUrl}
  qwenImportedRecord={qwenImportedRecord}
  qwenPaperApproval={qwenPaperApproval}
  teacherComparatorMeasurement={paperVlmMeasurement}
  teacherComparatorMetadata={paperVlmMetadata}
/>`}
            </code>
          </div>
        </div>
      </section>
    );
  }

  // ===========================================================================
  // FEEDBACK
  // ===========================================================================

  const showFeedback = (
    type: 'success' | 'error',
    text: string
  ) => {
    setExportMessage({
      type,
      text,
    });

    window.setTimeout(
      () => {
        setExportMessage(
          null
        );
      },
      4000
    );
  };

  // ===========================================================================
  // COPY JSON
  // ===========================================================================

  const handleCopyJson =
    async () => {
      try {
        await navigator.clipboard.writeText(
          jsonString
        );

        setCopied(
          true
        );

        window.setTimeout(
          () =>
            setCopied(
              false
            ),
          2000
        );
      } catch (err: any) {
        showFeedback(
          'error',
          `Failed to copy JSON: ${err?.message || err}`
        );
      }
    };

  // ===========================================================================
  // EXPORT JSON
  // ===========================================================================

  const handleExportJson =
    () => {
      try {
        const blob =
          new Blob(
            [
              jsonString,
            ],
            {
              type:
                'application/json;charset=utf-8',
            }
          );

        const url =
          URL.createObjectURL(
            blob
          );

        const a =
          document.createElement(
            'a'
          );

        a.href =
          url;

        a.download =
          `street_interface_${activeImageId}_paper_aligned_record.json`;

        document.body.appendChild(
          a
        );

        a.click();

        document.body.removeChild(
          a
        );

        URL.revokeObjectURL(
          url
        );

        showFeedback(
          'success',
          `Exported ${a.download}`
        );
      } catch (err: any) {
        showFeedback(
          'error',
          `Failed to export JSON: ${err?.message || err}`
        );
      }
    };

  // ===========================================================================
  // EXPORT CSV
  // ===========================================================================

  const handleExportCsv =
    () => {
      if (
        !pixelMeasurements
      ) {
        showFeedback(
          'error',
          'Cannot export CSV: Vision pixel measurements are not ready.'
        );

        return;
      }

      try {
        const measurements =
          pixelMeasurements.class_measurements;

        const coverage =
          pixelMeasurements.coverage;

        const groups =
          pixelMeasurements.group_measurements;

        const derived =
          pixelMeasurements.derived_metrics;

        const vars =
          paperAssembly.variables;

        const elast =
          paperSynthesis
            .localElasticities
            .value;

        const headers = [
          // Identity / protocol
          'image_id',
          'timestamp',
          'vision_baseline',
          'taxonomy_version',
          'paper_schema',
          'strict_paper_mode',

          // Active VLM / source provenance
          'active_vlm_owner',
          'qwen_imported',
          'qwen_approval_active',
          'qwen_model_id',
          'qwen_node_id',
          'qwen_source_image',
          'qwen_view_protocol',
          'qwen_orientation_alignment_status',
          'qwen_horizon_alignment_verified',
          'app_source_filename',
          'app_qwen_source_match',

          'teacher_gemma_role',
          'teacher_gemma_model',
          'teacher_gemma_protocol_version',

          // Vision coverage
          'valid_pixels',
          'transparent_pixels',
          'mapped_pixels',
          'unmapped_pixels',
          'mapped_fraction',

          // Frozen 30-class counts
          ...FROZEN_30_CLASS_TAXONOMY
            .classes
            .map(
              (c) =>
                `px_${c.class_id}`
            ),

          // Frozen 30-class fractions
          ...FROZEN_30_CLASS_TAXONOMY
            .classes
            .map(
              (c) =>
                `pct_${c.class_id}`
            ),

          // Vision research groups
          'P_natural_above_ground',
          'P_built_above_ground',
          'P_vegetation',
          'P_sidewalk',
          'P_paver',
          'P_signboard',
          'P_architectural_detail',
          'P_street_furniture',

          // Vision candidate derived measurements
          'vision_ratio_natural_built',
          'vision_ratio_sidewalk_paver',
          'vision_ratio_signboard_detail',

          // Full Qwen instrument provenance
          ...PAPER_VLM_FIELD_ORDER.flatMap(
            (fieldId) => [
              `qwen_${fieldId}_rung`,
              `qwen_${fieldId}_ev`,
              `qwen_${fieldId}_normalized_ev`,
              `qwen_${fieldId}_argmax`,
              `qwen_${fieldId}_p1`,
              `qwen_${fieldId}_p2`,
              `qwen_${fieldId}_p3`,
              `qwen_${fieldId}_p4`,
              `qwen_${fieldId}_p5`,
              `qwen_${fieldId}_p6`,
              `qwen_${fieldId}_p7`,
              `qwen_${fieldId}_validation_strength`,
            ]
          ),

          // Paper variables + status
          'Vnat_Vbuilt_value',
          'Vnat_Vbuilt_candidate',
          'Vnat_Vbuilt_status',

          'V_sign_value',
          'V_sign_candidate',
          'V_sign_status',

          'V_pave_value',
          'V_pave_candidate',
          'V_pave_status',

          'GVI_eye',
          'GVI_eye_status',

          'GMI',
          'GMI_status',

          'SFV',
          'SFV_status',

          'IAS',
          'IAS_status',

          'GFAPI',
          'GFAPI_status',

          'HW_ratio',
          'HW_status',

          'SVF',
          'SVF_status',

          't_base',
          't_base_status',

          // Paper synthesis
          'I_raw_paper',
          'I_calibration_input',
          'I_normalization_provenance',
          'I_i',
          'I_i_status',

          'Y_i',
          'Y_i_status',

          'D_raw_paper',
          'D_calibration_input',
          'D_normalization_provenance',
          'D_i',
          'D_i_status',

          'A_i_environmental_TFP',
          'A_i_status',

          'Choice_i_R800m',
          'Integration_i_R800m',
          'beta_0',
          'beta_I',
          'beta_Y',
          'beta_D',
          'beta_Choice',
          'beta_Int',

          'a_i',
          'b_i',
          'c_i',
          'elasticity_status',
          'elasticity_source',
          'calibration_status',

          'M_i',
          'M_i_status',
          'active_sim_formula',

          'lambda',
          'lambda_status',
          'lambda_source',

          'F_i',
          'F_i_status',

          't_effective',
          't_effective_status',

          // Gate audit
          'assembly_gate_count',
          'synthesis_gate_count',

          // Multi-Source Research Integration explicit columns (v0.7.0 RC1)
          'multi_source_version',
          'release_candidate_status',
          'node_id',
          'visual_semantic_status',
          'qwen_approval_status',
          'qwen_source_version',
          'street_node_crosswalk_status',
          'sampling_geometry_spacing_m',
          'H_m',
          'H_m_status',
          'W_facade',
          'W_facade_status',
          'HW_facade',
          'HW_facade_status',
          'HW_effective',
          'HW_effective_status',
          'HW_source',
          'node_GVI',
          'node_GVI_role',
          'node_VEI',
          'node_VEI_role',
          'node_SVF_band',
          'node_SVF_band_role',
          'paper_choice_radius_m',
          'paper_integration_radius_m',
          'paper_gwr_model2_r2',
          'paper_gwr_model2_morans_i',
          'paper_gwr_bandwidth_m',
          'node_choice',
          'node_choice_status',
          'node_integration',
          'node_integration_status',
          'local_gwr_status',
          'gwr_active_elasticity_source',
          'gwr_active_a',
          'gwr_active_b',
          'gwr_active_c',
          't_raw_seconds',
          't_raw_status',
          't_base_observed',
          't_base_observed_status',
          'lambda_behavioral',
          'lambda_behavioral_status',
          'F_i_behavioral',
          'F_i_behavioral_status',
          't_effective_behavioral',
          't_effective_behavioral_status',
          'D_xy',
          'D_xy_status',
        ];

        const row = [
          activeImageId,
          new Date().toISOString(),
          VISION_BASELINE_VERSION,
          FROZEN_TAXONOMY_VERSION,
          'street_interface_paper_aligned_v0.7.0_multi_source_master_rc1',
          paperAssembly.strictPaperMode,

          repoAssembly
            ? 'approved_team_repository_data_bridge'
            : 'approved_team_qwen_7_rung_instrument',
          Boolean(qwenImportedRecord),

          Boolean(
            qwenPaperApproval &&
            qwenImportedRecord &&
            qwenPaperApproval.nodeId ===
              qwenImportedRecord.sourceIdentity.node_id &&
            qwenPaperApproval.sourceImageId ===
              qwenImportedRecord.sourceIdentity.file
          ),

          qwenImportedRecord?.run.model.model_id ?? '',
          qwenImportedRecord?.sourceIdentity.node_id ?? '',
          qwenImportedRecord?.sourceIdentity.file ?? '',
          qwenImportedRecord?.run.node_metadata.view_protocol ?? '',
          qwenImportedRecord?.run.node_metadata.orientation_alignment_status ?? '',
          qwenImportedRecord?.run.node_metadata.horizon_alignment_verified ?? '',
          originalFilename ?? '',

          normalizedFilename(originalFilename) !== null &&
          normalizedFilename(originalFilename) ===
            normalizedFilename(
              qwenImportedRecord?.sourceIdentity.file
            ),

          'experimental_comparator_only',
          teacherComparatorMetadata?.modelUsed ?? '',
          teacherComparatorMetadata?.protocolVersion ?? '',

          coverage.valid_pixel_count,
          coverage.transparent_pixel_count,
          coverage.mapped_pixel_count,
          coverage.unmapped_pixel_count,
          coverage.mapped_fraction,

          ...FROZEN_30_CLASS_TAXONOMY
            .classes
            .map(
              (c) => {
                const m =
                  measurements.find(
                    (x) =>
                      x.class_id ===
                      c.class_id
                  );

                return m
                  ? m.pixel_count
                  : 0;
              }
            ),

          ...FROZEN_30_CLASS_TAXONOMY
            .classes
            .map(
              (c) => {
                const m =
                  measurements.find(
                    (x) =>
                      x.class_id ===
                      c.class_id
                  );

                return m
                  ? m.fraction_of_valid_pixels
                  : 0;
              }
            ),

          groups.P_natural_above_ground ?? 0,
          groups.P_built_above_ground ?? 0,
          groups.P_vegetation ?? 0,
          groups.P_sidewalk ?? 0,

          // P_paver may be 0 in Vision output, but its paper validity is
          // separately represented by V_pave_status below.
          groups.P_paver ?? 0,

          groups.P_signboard ?? 0,
          groups.P_architectural_detail ?? 0,
          groups.P_street_furniture ?? 0,

          derived
            .natural_built_above_ground_ratio
            .value ?? '',

          derived
            .sidewalk_paver_ratio
            .value ?? '',

          derived
            .signboard_detail_ratio
            .value ?? '',

          ...PAPER_VLM_FIELD_ORDER.flatMap(
            (fieldId) => {
              const field =
                qwenImportedRecord
                  ?.run
                  .fields[fieldId];

              return [
                field?.rung ?? '',
                field?.expected_value ?? '',
                field?.normalized_ev ?? '',
                field?.argmax ?? '',
                field?.probabilities.p1 ?? '',
                field?.probabilities.p2 ?? '',
                field?.probabilities.p3 ?? '',
                field?.probabilities.p4 ?? '',
                field?.probabilities.p5 ?? '',
                field?.probabilities.p6 ?? '',
                field?.probabilities.p7 ?? '',
                field?.validation.strength ?? '',
              ];
            }
          ),

          vars
            .naturalBuiltRatio
            .value ?? '',

          vars
            .naturalBuiltRatio
            .candidateValue ?? '',

          vars
            .naturalBuiltRatio
            .status,

          vars
            .vSign
            .value ?? '',

          vars
            .vSign
            .candidateValue ?? '',

          vars
            .vSign
            .status,

          vars
            .vPave
            .value ?? '',

          vars
            .vPave
            .candidateValue ?? '',

          vars
            .vPave
            .status,

          vars.gviEye.value ?? '',
          vars.gviEye.status,

          vars.gmi.value ?? '',
          vars.gmi.status,

          vars.sfv.value ?? '',
          vars.sfv.status,

          vars.ias.value ?? '',
          vars.ias.status,

          vars.gfapi.value ?? '',
          vars.gfapi.status,

          vars.hwRatio.value ?? '',
          vars.hwRatio.status,

          vars.svf.value ?? '',
          vars.svf.status,

          vars.tBase.value ?? '',
          vars.tBase.status,

          paperSynthesis.iRawPaper ?? '',
          paperSynthesis.iCalibrationInput ?? '',
          paperSynthesis.iNormalizationProvenance ?? 'PAPER_EXPLICIT',
          paperSynthesis
            .placeImageability
            .value ?? '',

          paperSynthesis
            .placeImageability
            .status,

          paperSynthesis
            .placeIdentity
            .value ?? '',

          paperSynthesis
            .placeIdentity
            .status,

          paperSynthesis.dRawPaper ?? '',
          paperSynthesis.dCalibrationInput ?? '',
          paperSynthesis.dNormalizationProvenance ?? 'REPO_IMPLEMENTATION_CONVENTION',
          paperSynthesis
            .placeDependence
            .value ?? '',

          paperSynthesis
            .placeDependence
            .status,

          paperSynthesis
            .environmentalTfp
            .value ?? '',

          paperSynthesis
            .environmentalTfp
            .status,

          paperAssembly.paperInputs.spaceSyntaxChoice ?? '',
          paperAssembly.paperInputs.spaceSyntaxIntegration ?? '',
          paperAssembly.paperInputs.gwrLocalBetas?.betaIntercept ?? '',
          paperAssembly.paperInputs.gwrLocalBetas?.betaImageability ?? '',
          paperAssembly.paperInputs.gwrLocalBetas?.betaIdentity ?? '',
          paperAssembly.paperInputs.gwrLocalBetas?.betaDependence ?? '',
          paperAssembly.paperInputs.gwrLocalBetas?.betaChoice ?? '',
          paperAssembly.paperInputs.gwrLocalBetas?.betaIntegration ?? '',

          elast?.a ?? '',
          elast?.b ?? '',
          elast?.c ?? '',

          paperSynthesis
            .localElasticities
            .status,

          paperSynthesis.elasticitySource,
          paperSynthesis.calibrationStatus,

          paperSynthesis
            .sim
            .value ?? '',

          paperSynthesis
            .sim
            .status,

          'M_i = I_i^a_i × Y_i^b_i × D_i^c_i',

          paperSynthesis.calibration.lambda ?? '',
          paperSynthesis.calibration.lambdaStatus,
          paperSynthesis.calibration.lambdaSource,

          paperSynthesis
            .stayabilityFactor
            .value ?? '',

          paperSynthesis
            .stayabilityFactor
            .status,

          paperSynthesis
            .tEffective
            .value ?? '',

          paperSynthesis
            .tEffective
            .status,

          paperAssembly.gates.length,
          paperSynthesis.gates.length,

          // Multi-Source Research Integration explicit columns (v0.7.0 RC1)
          'v0.7.0',
          V070_VERSION_METADATA.releaseCandidateStatus,
          repoAssembly?.nodeId ?? '',
          qwenPaperApproval ? 'AUTHORIZED' : (repoAssembly ? 'PREVIEW_ONLY_NOT_APPROVED' : 'UNAVAILABLE'),
          qwenPaperApproval ? 'APPROVED' : (repoAssembly ? 'PENDING' : 'UNAVAILABLE'),
          'Qwen/Qwen2-VL-7B-Instruct',
          'UNRESOLVED_NODE_CROSSWALK',
          20,
          repoAssembly?.matchedRecord.geometryRecord.hM ?? '',
          repoAssembly?.matchedRecord.geometryRecord.hM != null ? 'SOURCE_BACKED_CONTEXT' : 'UNAVAILABLE_IN_SOURCE_ROW',
          repoAssembly?.matchedRecord.geometryRecord.wFacade ?? '',
          repoAssembly?.matchedRecord.geometryRecord.wFacade != null ? 'SOURCE_BACKED_CONTEXT' : 'UNAVAILABLE_IN_SOURCE_ROW',
          repoAssembly?.matchedRecord.geometryRecord.hwFacade ?? '',
          repoAssembly?.matchedRecord.geometryRecord.hwFacade != null ? 'SOURCE_BACKED_CONTEXT' : 'UNAVAILABLE_IN_SOURCE_ROW',
          repoAssembly?.matchedRecord.geometryRecord.hwEffective ?? '',
          repoAssembly?.matchedRecord.geometryRecord.hwEffective != null ? 'SOURCE_BACKED_CONTEXT' : 'UNAVAILABLE_IN_SOURCE_ROW',
          repoAssembly?.matchedRecord.geometryRecord.hwSource ?? '',
          repoAssembly?.matchedRecord.geometryRecord.nodeGVI ?? '',
          'REPO_GEOMETRY_CONTEXT_NOT_GVI_EYE',
          repoAssembly?.matchedRecord.geometryRecord.nodeVEI ?? '',
          'REPO_GEOMETRY_CONTEXT_ONLY',
          repoAssembly?.matchedRecord.geometryRecord.nodeSVFBand ?? '',
          'REPO_GEOMETRY_CONTEXT_NOT_TRUE_SVF',
          SPACE_SYNTAX_PAPER_SPECIFICATION.walkingRadiusM,
          SPACE_SYNTAX_PAPER_SPECIFICATION.walkingRadiusM,
          NATURE_903_FINAL_GWR_DIAGNOSTICS.model2R2,
          NATURE_903_FINAL_GWR_DIAGNOSTICS.model2ResidualMoransI,
          NATURE_903_FINAL_GWR_DIAGNOSTICS.reportedOptimizedBandwidthM,
          '',
          'UNAVAILABLE_NODE_LEVEL_SOURCE',
          '',
          'UNAVAILABLE_NODE_LEVEL_SOURCE',
          'UNAVAILABLE_NODE_LEVEL_CALIBRATION',
          'PAPER_GLOBAL_REFERENCE',
          0.4,
          0.2,
          0.4,
          '',
          'UNAVAILABLE_EMPIRICAL_BEHAVIORAL_OUTCOME',
          '',
          'INPUT_GATED_MISSING_T_RAW',
          '',
          'UNRESOLVED_BEHAVIORAL_CALIBRATION',
          '',
          'METHOD_GATED_MISSING_LAMBDA',
          '',
          'INPUT_GATED',
          '',
          'NETWORK_MODEL_GATED',
        ];

        const csvContent =
          [
            headers
              .map(
                csvEscape
              )
              .join(','),

            row
              .map(
                csvEscape
              )
              .join(','),
          ]
            .join('\n');

        const blob =
          new Blob(
            [
              csvContent,
            ],
            {
              type:
                'text/csv;charset=utf-8;',
            }
          );

        const url =
          URL.createObjectURL(
            blob
          );

        const a =
          document.createElement(
            'a'
          );

        a.href =
          url;

        a.download =
          `street_interface_${activeImageId}_paper_aligned.csv`;

        document.body.appendChild(
          a
        );

        a.click();

        document.body.removeChild(
          a
        );

        URL.revokeObjectURL(
          url
        );

        showFeedback(
          'success',
          `Exported ${a.download}`
        );
      } catch (err: any) {
        showFeedback(
          'error',
          `Failed to export CSV: ${err?.message || err}`
        );
      }
    };

  // ===========================================================================
  // PNG / PDF
  // ===========================================================================

  const handleExportPng =
    async () => {
      setIsExportingPng(
        true
      );

      setExportMessage(
        null
      );

      try {
        const filename =
          `street_interface_${activeImageId}_paper_aligned_report.png`;

        await exportElementAsPng(
          'vision-research-report',
          filename
        );

        showFeedback(
          'success',
          `Exported ${filename}`
        );
      } catch (err: any) {
        console.error(
          'PNG Export failed:',
          err
        );

        showFeedback(
          'error',
          `PNG export failed: ${err?.message || 'Unknown capture error'}`
        );
      } finally {
        setIsExportingPng(
          false
        );
      }
    };

  const handleExportPdf =
    async () => {
      setIsExportingPdf(
        true
      );

      setExportMessage(
        null
      );

      try {
        const filename =
          `street_interface_${activeImageId}_paper_aligned_report.pdf`;

        await exportElementAsPdf(
          'vision-research-report',
          filename
        );

        showFeedback(
          'success',
          `Exported ${filename}`
        );
      } catch (err: any) {
        console.error(
          'PDF Export failed:',
          err
        );

        showFeedback(
          'error',
          `PDF export failed: ${err?.message || 'Unknown PDF compilation error'}`
        );
      } finally {
        setIsExportingPdf(
          false
        );
      }
    };

  // ===========================================================================
  // SUMMARY VALUES
  // ===========================================================================

  const mappedFraction =
    pixelMeasurements
      ? pixelMeasurements.coverage.mapped_fraction
      : null;

  const naturalBuiltCandidate =
    paperAssembly
      .variables
      .naturalBuiltRatio
      .candidateValue ??
    paperAssembly
      .variables
      .naturalBuiltRatio
      .value ??
    null;

  const simComputed =
    paperSynthesis
      .sim
      .status ===
    'computed';

  return (
    <section
      id="report-and-export"
      className="space-y-4"
    >
      {/* =====================================================================
          HEADER / EXPORT CONTROLS
          ===================================================================== */}

      <div className="bg-stone-900 text-stone-100 border border-stone-800 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-900 text-emerald-200 rounded border border-emerald-700">
                EXPORT
              </span>

              <h3 className="text-sm font-bold font-mono text-white uppercase tracking-tight flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-400" />

                <span>
                  Nature 9.03-Aligned Research Node Record &amp; Export
                </span>
              </h3>

              <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-indigo-950 text-indigo-200 border border-indigo-800 rounded">
                NATURE 9.03 FINAL · NO-OMEGA v0.7.1-UX1.3 · SIMPLIFIED WORKFLOW
              </span>
            </div>

            <p className="text-xs text-stone-400 mt-1 font-sans max-w-3xl">
              Exports deterministic Vision measurements together with
              Paper-variable provenance, live synthesis status, and explicit
              methodological gates. Candidate values remain distinguishable
              from paper-ready values.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-export-csv"
              type="button"
              onClick={
                handleExportCsv
              }
              disabled={
                !pixelMeasurements
              }
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-mono text-xs font-semibold rounded transition-colors shadow-xs disabled:opacity-50"
              title="Export Vision measurements plus paper-variable and SIM statuses as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />

              <span>
                Export CSV
              </span>
            </button>

            <button
              id="btn-export-json"
              type="button"
              onClick={
                handleExportJson
              }
              className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-mono text-xs font-semibold rounded border border-stone-700 transition-colors shadow-xs"
              title="Download complete paper-aligned research record JSON"
            >
              <FileJson className="w-3.5 h-3.5 text-sky-400" />

              <span>
                Export JSON
              </span>
            </button>

            <button
              id="btn-export-report-png"
              type="button"
              onClick={
                handleExportPng
              }
              disabled={
                isExportingPng
              }
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-900/80 hover:bg-purple-800 text-purple-100 font-mono text-xs font-semibold rounded border border-purple-700/60 transition-colors shadow-xs disabled:opacity-60"
            >
              {isExportingPng ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-purple-300 animate-spin" />

                  <span>
                    Capturing PNG...
                  </span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-3.5 h-3.5 text-purple-300" />

                  <span>
                    Export Report as PNG
                  </span>
                </>
              )}
            </button>

            <button
              id="btn-export-report-pdf"
              type="button"
              onClick={
                handleExportPdf
              }
              disabled={
                isExportingPdf
              }
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-900/80 hover:bg-amber-800 text-amber-100 font-mono text-xs font-semibold rounded border border-amber-700/60 transition-colors shadow-xs disabled:opacity-60"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-amber-300 animate-spin" />

                  <span>
                    Compiling PDF...
                  </span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 text-amber-300" />

                  <span>
                    Export Report as PDF
                  </span>
                </>
              )}
            </button>

            <button
              id="btn-copy-json"
              type="button"
              onClick={
                handleCopyJson
              }
              className="flex items-center gap-1.5 px-2.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-mono text-xs rounded border border-stone-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />

                  <span>
                    Copied
                  </span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-stone-400" />

                  <span>
                    Copy JSON
                  </span>
                </>
              )}
            </button>

            <button
              id="btn-toggle-summary"
              type="button"
              onClick={() =>
                setShowPrintView(
                  !showPrintView
                )
              }
              className="flex items-center gap-1.5 px-2.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-mono text-xs rounded border border-stone-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-stone-400" />

              <span>
                {showPrintView
                  ? 'Hide Summary'
                  : 'View Summary'}
              </span>
            </button>
          </div>
        </div>

        {exportMessage && (
          <div
            className={`mt-4 p-3 rounded text-xs font-mono flex items-center gap-2 ${
              exportMessage.type ===
              'success'
                ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-200'
                : 'bg-rose-950/80 border border-rose-700 text-rose-200'
            }`}
          >
            {exportMessage.type ===
            'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}

            <span>
              {exportMessage.text}
            </span>
          </div>
        )}
      </div>

      {/* =====================================================================
          EXPORT STATUS SUMMARY
          ===================================================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-stone-200 rounded-lg p-3">
          <span className="text-[9px] font-mono text-stone-400 uppercase block">
            Vision Status
          </span>

          <span className="text-sm font-mono font-bold text-stone-900">
            {pixelMeasurements?.status ??
              'NOT RUN'}
          </span>
        </div>

        <div className="bg-white border border-stone-200 rounded-lg p-3">
          <span className="text-[9px] font-mono text-stone-400 uppercase block">
            Mapped Coverage
          </span>

          <span className="text-sm font-mono font-bold text-stone-900">
            {mappedFraction !== null
              ? `${(
                  mappedFraction *
                  100
                ).toFixed(2)}%`
              : '—'}
          </span>
        </div>

        <div className="bg-white border border-stone-200 rounded-lg p-3">
          <span className="text-[9px] font-mono text-stone-400 uppercase block">
            V_nat / V_built
          </span>

          <span className="text-sm font-mono font-bold text-stone-900">
            {naturalBuiltCandidate !==
            null
              ? naturalBuiltCandidate.toFixed(
                  3
                )
              : '—'}
          </span>

          <span className="block text-[8px] font-mono text-stone-500 mt-0.5">
            {paperAssembly
              .variables
              .naturalBuiltRatio
              .status
              .replace(
                /_/g,
                ' '
              )
              .toUpperCase()}
          </span>
        </div>

        <div className="bg-white border border-stone-200 rounded-lg p-3">
          <span className="text-[9px] font-mono text-stone-400 uppercase block">
            SIM
          </span>

          <span
            className={`text-sm font-mono font-bold ${
              simComputed
                ? 'text-emerald-800'
                : 'text-amber-800'
            }`}
          >
            {paperSynthesis
              .sim
              .value !== null
              ? paperSynthesis.sim.value.toFixed(
                  3
                )
              : '—'}
          </span>

          <span className="block text-[8px] font-mono text-stone-500 mt-0.5">
            {paperSynthesis
              .sim
              .status
              .replace(
                /_/g,
                ' '
              )
              .toUpperCase()}
          </span>
        </div>

        <div className="bg-white border border-stone-200 rounded-lg p-3">
          <span className="text-[9px] font-mono text-stone-400 uppercase block">
            Method Gates
          </span>

          <span className="text-sm font-mono font-bold text-amber-800">
            {paperSynthesis.gates.length}
          </span>

          <span className="block text-[8px] font-mono text-stone-500 mt-0.5">
            synthesis
          </span>
        </div>
      </div>

      {/* =====================================================================
          METHODOLOGICAL EXPORT NOTICE
          ===================================================================== */}

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex items-start gap-2">
        <Info className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />

        <p className="text-[10px] text-indigo-900 leading-relaxed">
          Exported JSON and CSV preserve the distinction between
          <strong> candidate measurements</strong>,
          <strong> paper-ready variables</strong>, and
          <strong> gated variables</strong>. A taxonomy gap or missing method
          therefore remains machine-readable instead of being collapsed into
          zero.
        </p>
      </div>

      {/* =====================================================================
          PRINTABLE SUMMARY
          ===================================================================== */}

      {showPrintView && (
        <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-2xs space-y-6 print:border-none print:shadow-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-300 gap-2">
            <div>
              <div className="text-[10px] font-mono text-stone-400 uppercase">
                Paper-Aligned Academic Research Node
              </div>

              <h2 className="text-lg font-bold font-mono text-stone-900">
                Sampling Node:{' '}
                {activeImageId}
              </h2>

              <p className="text-xs text-stone-500">
                Vision evidence + Paper-variable provenance + deterministic
                synthesis gate record
              </p>
            </div>

            <div className="text-right font-mono text-xs space-y-0.5">
              <div>
                Baseline:{' '}
                <span className="font-bold text-stone-800">
                  {VISION_BASELINE_VERSION}
                </span>
              </div>

              <div>
                Taxonomy:{' '}
                <span className="font-bold text-emerald-800">
                  {FROZEN_TAXONOMY_VERSION}
                </span>
              </div>

              <div>
                Engine:{' '}
                <span className="font-bold text-indigo-800">
                  {paperSynthesis.engineVersion}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 bg-stone-50 border border-stone-200 rounded">
              <span className="text-stone-400 block text-[10px] uppercase">
                Valid Pixels
              </span>

              <span className="text-sm font-bold text-stone-900">
                {pixelMeasurements
                  ? pixelMeasurements.coverage.valid_pixel_count.toLocaleString()
                  : '—'}
              </span>
            </div>

            <div className="p-3 bg-stone-50 border border-stone-200 rounded">
              <span className="text-stone-400 block text-[10px] uppercase">
                Assembly Gates
              </span>

              <span className="text-sm font-bold text-amber-800">
                {paperAssembly.gates.length}
              </span>
            </div>

            <div className="p-3 bg-stone-50 border border-stone-200 rounded">
              <span className="text-stone-400 block text-[10px] uppercase">
                Synthesis Gates
              </span>

              <span className="text-sm font-bold text-amber-800">
                {paperSynthesis.gates.length}
              </span>
            </div>

            <div className="p-3 bg-stone-50 border border-stone-200 rounded">
              <span className="text-stone-400 block text-[10px] uppercase">
                SIM Status
              </span>

              <span
                className={`text-sm font-bold ${
                  simComputed
                    ? 'text-emerald-800'
                    : 'text-amber-800'
                }`}
              >
                {paperSynthesis
                  .sim
                  .status
                  .replace(
                    /_/g,
                    ' '
                  )
                  .toUpperCase()}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <MultiSourceResearchStatusTable isApproved={Boolean(qwenPaperApproval)} />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-stone-700 uppercase">
              Paper-Aligned Node JSON
            </span>

            <pre className="p-4 bg-stone-900 text-stone-100 rounded-lg text-[11px] font-mono overflow-x-auto max-h-96 border border-stone-800">
              {jsonString}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
};