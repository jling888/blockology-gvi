/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Vision-Based Human-Scale Streetscape Research Platform
 * Street Interface Measurement — Nature 9.03 Final · No-Omega v0.5
 *
 * Active architecture:
 * Vision Validation + Approved Team Qwen Instrument + GIS + Space Syntax → Paper Variables → Deterministic Paper Synthesis
 *
 * Vision Bridge v1.2 / hybrid_v0.10_frozen_baseline-r1
 * Authoritative 30-Class Frozen Semantic Taxonomy
 */

import React, { useEffect, useMemo, useState } from 'react';

import { Header } from './components/Header';
import { CaseInputSection } from './components/CaseInputSection';
import { VisionEvidenceSection } from './components/VisionEvidenceSection';
import { SemanticMeasurementsPanel } from './components/SemanticMeasurementsPanel';
import { StreetInterfaceEvidencePanel } from './components/StreetInterfaceEvidencePanel';
import { ResearchVariableReadinessPanel } from './components/ResearchVariableReadinessPanel';
import { PaperProtocolInputsPanel } from './components/PaperProtocolInputsPanel';
import { PaperVlmProtocolPanel } from './components/PaperVlmProtocolPanel';
import { MurrayHillIntegratedDatasetPanel } from './components/MurrayHillIntegratedDatasetPanel';
import { BlockologyNodeProvenancePanel } from './components/BlockologyNodeProvenancePanel';
import { BlockologyValidationProtocolPanel } from './components/BlockologyValidationProtocolPanel';
import { MurrayHillMainRepoEvidencePanel } from './components/MurrayHillMainRepoEvidencePanel';
import { MurrayHillMainRepoValidationPanel } from './components/MurrayHillMainRepoValidationPanel';
import { Nature902ProtocolAlignmentPanel } from './components/Nature902ProtocolAlignmentPanel';
import { Nature902CalibrationGwrPanel } from './components/Nature902CalibrationGwrPanel';
import { Nature902SynthesisScalePanel } from './components/Nature902SynthesisScalePanel';
import { Nature902ManuscriptAuditPanel } from './components/Nature902ManuscriptAuditPanel';
import { QwenPaperMappingPanel } from './components/QwenPaperMappingPanel';
import { QwenPaperApprovalPanel } from './components/QwenPaperApprovalPanel';
import { TeamRepositoryDataPanel } from './components/TeamRepositoryDataPanel';
import {
  type RepoPaperBridgeAssembly,
  buildRepoAssemblyFromMurrayHillMatch,
  buildMatchedRecordFromRow,
  assembleRepoPaperBridge,
} from './data/teamRepository';
import { OrientationProtocolReconciliationPanel } from './components/OrientationProtocolReconciliationPanel';
import { OrientationSensitivityValidationPanel } from './components/OrientationSensitivityValidationPanel';
import { OrientationSensitivityAnalysisPanel } from './components/OrientationSensitivityAnalysisPanel';
import { ResearchSynthesisPanel } from './components/ResearchSynthesisPanel';
import { VisionValidationPanel } from './components/VisionValidationPanel';
import { ReportAndExportSection } from './components/ReportAndExportSection';
import { MultiSourceResearchStatusTable } from './components/MultiSourceResearchStatusTable';
import { MethodDiagnosticsPanel } from './components/MethodDiagnosticsPanel';
import { ProtocolDocumentationModal } from './components/ProtocolDocumentationModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  ResearchWorkflowNavigator,
  ResearchStageHeader,
} from './components/ResearchWorkflowNavigator';

import {
  ResearchDisclosure,
} from './components/ResearchDisclosure';

import {
  PaperSynthesisStatusStrip,
} from './components/PaperSynthesisStatusStrip';

import { SAMPLE_CASES, SampleCase } from './data/sampleCases';

import { measureVisionMaskClient } from './utils/clientPixelEngine';

import {
  recoverScreenshotMaskToFrozenPalette,
  type PresentationMaskRecoveryReport,
} from './utils/presentationMaskRecovery';

import {
  assemblePaperResearchInputs,
  EMPTY_PAPER_EXTERNAL_INPUTS,
  PaperExternalResearchInputs,
} from './utils/paperResearchAssembler';

import { computePaperSynthesis } from './utils/simComputationEngine';

import type {
  QwenCsvImportedRecord,
} from './research/paperVlmQwenCsvImporter';

import type {
  MurrayHillIntegratedMatch,
} from './research/murrayHillIntegratedDataset';

import {
  loadBlockologyRegistry,
  matchBlockologyNode,
  type BlockologyDatasetManifest,
  type BlockologyNodeContext,
  type BlockologyNodeMatch,
} from './research/blockologyGviRegistry';

import {
  loadMurrayHillMainRepoAudit,
  type MurrayHillMainRepoAudit,
} from './research/murrayHillMainRepoAudit';

import {
  loadStreetViewNodesRepoAudit,
  type StreetViewNodesRepoAudit,
} from './research/streetViewNodesRegistry';

import {
  buildApprovedQwenPaperInputPatch,
  captureQwenControlledPaperInputs,
  qwenControlledInputsEqual,
  type QwenPaperApprovalRecord,
  type QwenPaperInputPatch,
} from './research/paperVlmQwenBridge';

import { NATURE_903_METHOD_METADATA } from './research/nature903Protocol';

import {
  V33PixelMeasurementResult,
  V33ResearchNodeRecord,
  V33StreetInterfaceMeasurement,
  V33SegmentationTaxonomy,
  VlmStreetscapeEvaluationV31,
  MechanicalAuditResult,
  VISION_BASELINE_VERSION,
  FROZEN_TAXONOMY_VERSION,
  FROZEN_30_CLASS_TAXONOMY,
  PaperVlmV30Measurement,
} from './types';

import { runMechanicalAudit } from './utils/mechanicalAudit';

import {
  AlertCircle,
  Layers,
} from 'lucide-react';

export default function App() {
  const defaultSample = SAMPLE_CASES[0];

  // ===========================================================================
  // ACTIVE SAMPLING NODE / CASE STATE
  // ===========================================================================

  const [activeImageId, setActiveImageId] = useState<string>(
    defaultSample.id
  );

  const [pixelClassificationUrl, setPixelClassificationUrl] =
    useState<string>(
      defaultSample.pixelClassificationDataUrl
    );

  const [originalUrl, setOriginalUrl] =
    useState<string>(
      defaultSample.originalDataUrl
    );

  const [pixelClassificationFilename, setPixelClassificationFilename] =
    useState<string>(
      defaultSample.pixelClassificationFilename
    );

  const [originalFilename, setOriginalFilename] =
    useState<string>(
      defaultSample.originalFilename
    );

  // ===========================================================================
  // ACTIVE VISION MEASUREMENT STATE
  // ===========================================================================

  const [pixelMeasurements, setPixelMeasurements] =
    useState<V33PixelMeasurementResult | null>(
      null
    );

  const [researchNode, setResearchNode] =
    useState<V33ResearchNodeRecord | null>(
      null
    );

  const [isVisionLoading, setIsVisionLoading] =
    useState<boolean>(
      false
    );

  const [visionError, setVisionError] =
    useState<string | null>(
      null
    );

  const [executionTimeMs, setExecutionTimeMs] =
    useState<number | null>(
      null
    );

  // ===========================================================================
  // PRESERVED DEVELOPER VLM / LEGACY STATE
  // ===========================================================================

  const [candidateResult, setCandidateResult] =
    useState<V33StreetInterfaceMeasurement | null>(
      null
    );

  const [rawCandidateJson, setRawCandidateJson] =
    useState<string | null>(
      null
    );

  const [evaluation, setEvaluation] =
    useState<VlmStreetscapeEvaluationV31>(
      defaultSample.referenceEvaluation
    );

  const [rawLegacyJson, setRawLegacyJson] =
    useState<string>(
      JSON.stringify(
        defaultSample.referenceEvaluation,
        null,
        2
      )
    );

  const [mechanicalAudit, setMechanicalAudit] =
    useState<MechanicalAuditResult>(
      runMechanicalAudit(
        defaultSample.referenceEvaluation
      )
    );

  const [isLegacyLoading, setIsLegacyLoading] =
    useState<boolean>(
      false
    );

  const [legacyErrorMessage, setLegacyErrorMessage] =
    useState<string | null>(
      null
    );

  // ===========================================================================
  // TAXONOMY STATE
  // ===========================================================================

  const [taxonomy, setTaxonomy] =
    useState<V33SegmentationTaxonomy | null>(
      FROZEN_30_CLASS_TAXONOMY
    );

  // ===========================================================================
  // NATURE 9.02 EXTERNAL RESEARCH INPUTS
  // ===========================================================================
  //
  // Owners:
  // - Approved Team Qwen 7-rung instrument: V_nat, V_built, GVI_eye, GMI,
  //   V_sign, SFV, V_pave, canyon-enclosure proxy, IAS, GFAPI
  // - Teacher Appendix Gemma one-shot: comparison-only diagnostic arm
  // - GIS / Geometry: exact H/W and optional geometric SVF override
  // - Space Syntax / GWR: Choice, Integration, beta_I, beta_Y, beta_D,
  //   beta_Choice, beta_Int
  // - Behavior: t_base
  //
  // Missing values remain null. They must never silently become zero.
  // ===========================================================================

  const [paperExternalInputs, setPaperExternalInputs] =
    useState<PaperExternalResearchInputs>({
      ...EMPTY_PAPER_EXTERNAL_INPUTS,
    });


  // Teacher Appendix Gemma comparator measurement is preserved separately
  // from active Qwen-owned paper-variable state so provenance remains explicit.
  const [paperVlmMeasurement, setPaperVlmMeasurement] =
    useState<PaperVlmV30Measurement | null>(null);

  const [paperVlmMetadata, setPaperVlmMetadata] =
    useState<{ rawResponse: string; modelUsed: string; protocolVersion: string } | null>(null);

  // Teacher Gemma metadata is preserved for comparison/export provenance.

  // ===========================================================================
  // TEAM QWEN VLM INSTRUMENT — IMPORT / INSPECTION ONLY (Qwen instrument v0.3; preserved importer)
  // ===========================================================================
  //
  // This state intentionally remains separate from paperExternalInputs.
  // Step 5 proves CSV/probability/provenance compatibility before any values
  // are allowed to write into the active deterministic paper synthesis.
  // ===========================================================================

  const [qwenImportedRecord, setQwenImportedRecord] =
    useState<QwenCsvImportedRecord | null>(null);

  const [qwenPaperApproval, setQwenPaperApproval] =
    useState<QwenPaperApprovalRecord | null>(null);

  // Murray Hill integrated observations / calculations matched to the
  // currently active source image. This is a WORKING-DATASET bridge:
  // current I/Y/D/A may compute, while orientation + GWR gates remain explicit.
  const [murrayHillDatasetMatch, setMurrayHillDatasetMatch] =
    useState<MurrayHillIntegratedMatch | null>(null);

  // Nature 9.03 Final v0.6 Team Repository Data Bridge Assembly
  const [repoBridgeAssembly, setRepoBridgeAssembly] =
    useState<RepoPaperBridgeAssembly | null>(null);

  // ===========================================================================
  // BLOCKOLOGY-GVI EXTERNAL NODE / PANORAMA PROVENANCE
  // ===========================================================================
  //
  // This registry is validation/provenance context only.
  // It must never overwrite the active n##### node identity or paper inputs.
  // ===========================================================================

  const [blockologyRegistry, setBlockologyRegistry] =
    useState<BlockologyNodeContext[]>([]);

  const [blockologyManifest, setBlockologyManifest] =
    useState<BlockologyDatasetManifest | null>(null);

  const [blockologyLoading, setBlockologyLoading] =
    useState<boolean>(true);

  const [blockologyError, setBlockologyError] =
    useState<string | null>(null);

  // Main-repository QA / method audit. This is evidence and provenance only;
  // it must never synthesize missing Space Syntax, GWR or behavior.
  const [mainRepoAudit, setMainRepoAudit] =
    useState<MurrayHillMainRepoAudit | null>(null);

  const [mainRepoAuditError, setMainRepoAuditError] =
    useState<string | null>(null);

  // BACKGROUND-ONLY upstream street-view camera-node sampling provenance.
  // UX1.2 intentionally exposes no operator control or visible panel for this source.
  // This evidence never owns paper variables or resolves the Qwen protocol gate.
  const [streetViewNodesAudit, setStreetViewNodesAudit] =
    useState<StreetViewNodesRepoAudit | null>(null);

  const [streetViewNodesAuditError, setStreetViewNodesAuditError] =
    useState<string | null>(null);

  // Snapshot of the VLM-owned inputs before the first Qwen approval.
  // Revocation restores this snapshot without touching GIS / Space Syntax /
  // GWR / behavioral inputs.
  const [preQwenPaperInputs, setPreQwenPaperInputs] =
    useState<QwenPaperInputPatch | null>(null);

  // ===========================================================================
  // DOCUMENTATION MODAL
  // ===========================================================================

  const [isProtocolModalOpen, setIsProtocolModalOpen] =
    useState<boolean>(
      false
    );

  useEffect(() => {
    let cancelled = false;

    setBlockologyLoading(true);
    setBlockologyError(null);

    loadBlockologyRegistry()
      .then(({ registry, manifest }) => {
        if (cancelled) {
          return;
        }

        setBlockologyRegistry(registry);
        setBlockologyManifest(manifest);
      })
      .catch((error: any) => {
        if (cancelled) {
          return;
        }

        setBlockologyError(
          error?.message ||
          'Blockology registry loading failed.'
        );
      })
      .finally(() => {
        if (!cancelled) {
          setBlockologyLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadMurrayHillMainRepoAudit()
      .then((audit) => {
        if (!cancelled) {
          setMainRepoAudit(
            audit
          );
        }
      })
      .catch((error: any) => {
        if (!cancelled) {
          setMainRepoAuditError(
            error?.message ||
            'Murray Hill main-repo audit loading failed.'
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadStreetViewNodesRepoAudit()
      .then((audit) => {
        if (!cancelled) {
          setStreetViewNodesAudit(audit);
        }
      })
      .catch((error: any) => {
        if (!cancelled) {
          setStreetViewNodesAuditError(
            error?.message ||
            'Street-view-nodes repository audit loading failed.'
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const blockologyMatch =
    useMemo<BlockologyNodeMatch | null>(() => {
      if (blockologyRegistry.length === 0) {
        return null;
      }

      return matchBlockologyNode(
        blockologyRegistry,
        originalFilename,
        murrayHillDatasetMatch
      );
    }, [
      blockologyRegistry,
      originalFilename,
      murrayHillDatasetMatch,
    ]);

  // ===========================================================================
  // PAPER RESEARCH VARIABLE ASSEMBLY
  // ===========================================================================

  const paperAssembly = useMemo(() => {
    return assemblePaperResearchInputs(
      pixelMeasurements,
      paperExternalInputs,
      taxonomy ?? FROZEN_30_CLASS_TAXONOMY
    );
  }, [
    pixelMeasurements,
    paperExternalInputs,
    taxonomy,
  ]);

  // ===========================================================================
  // DETERMINISTIC PAPER SYNTHESIS
  // ===========================================================================

  const paperSynthesis = useMemo(() => {
    return computePaperSynthesis(
      paperAssembly.paperInputs
    );
  }, [
    paperAssembly,
  ]);

  // ===========================================================================
  // RUN DETERMINISTIC VISION MEASUREMENT
  // ===========================================================================

  const runMeasurementOnImage = async (
    maskDataUrl: string,
    imgId: string,
    filename: string,
    mimeType?: string | null,
    sourceKind: 'uploaded' | 'built_in_sample' | 'unknown' = 'uploaded',
    presentationRecoveryReport?: PresentationMaskRecoveryReport | null
  ) => {
    setIsVisionLoading(true);
    setVisionError(null);

    const startTime = performance.now();

    try {
      // First attempt: deterministic client-side exact-RGB measurement
      const clientResult =
        await measureVisionMaskClient(
          maskDataUrl,
          imgId,
          filename,
          mimeType,
          sourceKind
        );

      if (presentationRecoveryReport) {
        clientResult.status_reason =
          `PRESENTATION SCREENSHOT RECOVERY — DEMO ONLY. ` +
          `Exact before=${(
            presentationRecoveryReport.exactFractionBefore * 100
          ).toFixed(2)}%; ` +
          `recovered/mappable=${(
            presentationRecoveryReport.recoveredFractionAfter * 100
          ).toFixed(2)}%; ` +
          `RGB maxDistance=${presentationRecoveryReport.maxDistance}. ` +
          `Use the original RGB_CLEAN PNG for research reporting.`;

        // Keep research provenance conservative:
        // recovered screenshots must never receive a source-PNG PASS.
        clientResult.image.source_kind = 'unknown';
        clientResult.image.source_integrity = 'unknown';
        clientResult.image.png_signature_verified = false;
      }

      const elapsed =
        Math.round(
          performance.now() -
          startTime
        );

      setPixelMeasurements(
        clientResult
      );

      setExecutionTimeMs(
        elapsed
      );

      // -----------------------------------------------------------------------
      // Existing Vision research-node record
      //
      // Paper synthesis will be migrated into the formal node/export schema
      // in a later dedicated step. This record stays backward-compatible now.
      // -----------------------------------------------------------------------

      const nodeRecord: V33ResearchNodeRecord = {
        record_id:
          `NODE_${imgId}_${Date.now()}`,

        image_id:
          imgId,

        created_at:
          new Date().toISOString(),

        schema_version:
          'vision_bridge_v1.2',

        taxonomy_status:
          'configured',

        pixel_measurements:
          clientResult,

        derived_indices: {
          natural_built_above_ground_ratio:
            clientResult
              .derived_metrics
              .natural_built_above_ground_ratio
              .value ?? undefined,

          sidewalk_paver_ratio:
            clientResult
              .derived_metrics
              .sidewalk_paver_ratio
              .value ?? undefined,

          signboard_detail_ratio:
            clientResult
              .derived_metrics
              .signboard_detail_ratio
              .value ?? undefined,
        },
      };

      setResearchNode(
        nodeRecord
      );
    } catch (err: any) {
      console.warn(
        'Client pixel measurement fallback to server:',
        err
      );

      try {
        // Server fallback
        const response =
          await fetch(
            '/api/measure-vision',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                imageId:
                  imgId,

                pixelClassificationBase64:
                  maskDataUrl,

                pixelClassificationFilename:
                  filename,

                pixelClassificationMimeType:
                  mimeType ||
                  'application/octet-stream',
              }),
            }
          );

        const data =
          await response.json();

        const elapsed =
          Math.round(
            performance.now() -
            startTime
          );

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
            'Failed to process pixel measurement on server.'
          );
        }

        setPixelMeasurements(
          data.data
        );

        setResearchNode(
          data.researchNode
        );

        setExecutionTimeMs(
          elapsed
        );
      } catch (serverErr: any) {
        console.error(
          'Vision Measurement Error:',
          serverErr
        );

        setVisionError(
          serverErr.message ||
          'Error executing exact-RGB pixel counting.'
        );
      }
    } finally {
      setIsVisionLoading(
        false
      );
    }
  };

  // ===========================================================================
  // INITIAL DEFAULT SAMPLE MEASUREMENT
  // ===========================================================================

  useEffect(() => {
    runMeasurementOnImage(
      defaultSample.pixelClassificationDataUrl,
      defaultSample.id,
      defaultSample.pixelClassificationFilename,
      'image/svg+xml',
      'built_in_sample'
    );

    // Intentionally run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===========================================================================
  // PRESET SAMPLE SELECTION
  // ===========================================================================

  const handleSelectSampleCase = (
    sample: SampleCase
  ) => {
    setActiveImageId(
      sample.id
    );

    setPixelClassificationUrl(
      sample.pixelClassificationDataUrl
    );

    setOriginalUrl(
      sample.originalDataUrl
    );

    setPixelClassificationFilename(
      sample.pixelClassificationFilename
    );

    setOriginalFilename(
      sample.originalFilename
    );

    // Sync preserved legacy reference
    setEvaluation(
      sample.referenceEvaluation
    );

    setRawLegacyJson(
      JSON.stringify(
        sample.referenceEvaluation,
        null,
        2
      )
    );

    setMechanicalAudit(
      runMechanicalAudit(
        sample.referenceEvaluation
      )
    );

    // Reset candidate states
    setCandidateResult(
      null
    );

    setRawCandidateJson(
      null
    );

    // Critical safeguard:
    // external VLM / GIS / GWR / behavioral values cannot leak across nodes.
    setPaperExternalInputs({
      ...EMPTY_PAPER_EXTERNAL_INPUTS,
    });
    setPaperVlmMeasurement(null);
    setPaperVlmMetadata(null);
    setQwenImportedRecord(null);
    setQwenPaperApproval(null);
    setPreQwenPaperInputs(null);
    setMurrayHillDatasetMatch(null);
    setRepoBridgeAssembly(null);

    runMeasurementOnImage(
      sample.pixelClassificationDataUrl,
      sample.id,
      sample.pixelClassificationFilename,
      'image/svg+xml',
      'built_in_sample'
    );
  };

  // ===========================================================================
  // CUSTOM CASE RUN HANDLER
  // ===========================================================================

  const handleRunVisionMeasurement =
    async (payload: {
      imageId: string;

      pixelClassificationBase64: string;
      pixelClassificationMimeType: string;

      originalBase64: string;
      originalMimeType: string;

      pixelClassificationFilename: string;
      originalFilename: string;
      presentationRecoveryMode: boolean;
    }) => {
      setActiveImageId(
        payload.imageId
      );

      let measurementMask =
        payload.pixelClassificationBase64;

      let measurementFilename =
        payload.pixelClassificationFilename;

      let recoveryReport:
        PresentationMaskRecoveryReport | null =
        null;

      // v0.7.1 UX1.1: Presentation Screenshot Recovery is a hidden,
      // system-enforced default for uploaded semantic masks. The legacy
      // payload flag is retained only for call-site compatibility and is
      // intentionally ignored here so a stale/older CaseInputSection cannot
      // accidentally disable recovery.
      recoveryReport =
        await recoverScreenshotMaskToFrozenPalette(
          payload.pixelClassificationBase64,
          taxonomy ?? FROZEN_30_CLASS_TAXONOMY,
          40
        );

      measurementMask =
        recoveryReport.dataUrl;

      measurementFilename =
        payload.pixelClassificationFilename.replace(
          /\.png$/i,
          ''
        ) + '_PRESENTATION_RECOVERED.png';

      setPixelClassificationUrl(
        measurementMask
      );

      setOriginalUrl(
        payload.originalBase64
      );

      setPixelClassificationFilename(
        measurementFilename
      );

      setOriginalFilename(
        payload.originalFilename
      );

      // New upload = new research node.
      setPaperExternalInputs({
        ...EMPTY_PAPER_EXTERNAL_INPUTS,
      });
      setPaperVlmMeasurement(null);
      setPaperVlmMetadata(null);
      setQwenImportedRecord(null);
      setQwenPaperApproval(null);
      setPreQwenPaperInputs(null);
      setMurrayHillDatasetMatch(null);
      setRepoBridgeAssembly(null);

      await runMeasurementOnImage(
        measurementMask,
        payload.imageId,
        measurementFilename,
        'image/png',
        'uploaded',
        recoveryReport
      );
    };

  // ===========================================================================
  // TEACHER APPENDIX ONE-SHOT — EXPERIMENTAL COMPARATOR ONLY
  // ===========================================================================

  const handlePaperVlmMeasurementReady = (
    measurement: PaperVlmV30Measurement,
    metadata: { rawResponse: string; modelUsed: string; protocolVersion: string }
  ) => {
    // Preserve the result for side-by-side diagnostics only.
    // Step 7 intentionally removes automatic writes into paperExternalInputs.
    setPaperVlmMeasurement(measurement);
    setPaperVlmMetadata(metadata);
  };

  // ===========================================================================
  // TEAM QWEN → PAPER INPUT APPROVAL GATE
  // ===========================================================================

  const handleApproveQwenForPaperAssembly = () => {
    if (!qwenImportedRecord && !repoBridgeAssembly) {
      return;
    }

    if (repoBridgeAssembly && !repoBridgeAssembly.usableForActiveSynthesis) {
      return;
    }

    // Repository bridge is authoritative whenever a matched repository row
    // exists. The compatibility Qwen run may expose EV/argmax/probabilities,
    // but active Nature 9.03 paper inputs remain the median-led repository
    // mappings. This prevents explicit approval from silently switching the
    // active readout from median to EV.
    const patch = repoBridgeAssembly
      ? {
          vlmVNat: repoBridgeAssembly?.mappedVariables.vNat.value ?? null,
          vlmVBuilt: repoBridgeAssembly?.mappedVariables.vBuilt.value ?? null,
          gviEye: repoBridgeAssembly?.mappedVariables.gviEye.value ?? null,
          gmi: repoBridgeAssembly?.mappedVariables.gmi.value ?? null,
          vSign: repoBridgeAssembly?.mappedVariables.vSign.value ?? null,
          sfv: repoBridgeAssembly?.mappedVariables.sfv.value ?? null,
          vPave: repoBridgeAssembly?.mappedVariables.vPave.value ?? null,
          gfapi: repoBridgeAssembly?.mappedVariables.gfapi.value ?? null,
          ias: repoBridgeAssembly?.mappedVariables.ias.value ?? null,
          canyonEnclosureRatio:
            repoBridgeAssembly?.mappedVariables.svf.value !== null &&
            repoBridgeAssembly?.mappedVariables.svf.value !== undefined
              ? 1 - repoBridgeAssembly.mappedVariables.svf.value
              : null,
        }
      : buildApprovedQwenPaperInputPatch(qwenImportedRecord!);

    // Capture the previous VLM-owned values only on the first approval.
    // Re-approving another valid Qwen record keeps the same rollback snapshot.
    if (!qwenPaperApproval) {
      setPreQwenPaperInputs(
        captureQwenControlledPaperInputs(
          paperExternalInputs
        )
      );
    }

    const sourceName = repoBridgeAssembly
      ? repoBridgeAssembly.matchedRecord.sourceMetadata.repositoryName
      : qwenImportedRecord?.run.model.model_id ?? 'team_repository';
    const sourceFile = repoBridgeAssembly
      ? repoBridgeAssembly.matchedRecord.identity.sourceFilename
      : qwenImportedRecord?.sourceIdentity.file ?? '';

    setPaperExternalInputs((current) => ({
      ...current,
      ...patch,
      visualInputMode: 'approved_qwen',
      visualInputProvenance: `${sourceName} · ${sourceFile}`,
    }));

    const repoSource = repoBridgeAssembly
      ? `${repoBridgeAssembly.matchedRecord.sourceMetadata.repositoryName} @ ${repoBridgeAssembly.matchedRecord.sourceMetadata.repositoryCommit} · ${repoBridgeAssembly.matchedRecord.sourceMetadata.activeSourceTable}`
      : 'Approved Team Qwen Instrument v0.3';
    const sourceImage = repoBridgeAssembly
      ? repoBridgeAssembly.matchedRecord.identity.sourceFilename
      : qwenImportedRecord?.sourceIdentity.file || 'unknown';

    setQwenPaperApproval({
      source: repoBridgeAssembly ? 'team_repository_data_bridge' : 'qwen_7_rung_instrument',
      nodeId: repoBridgeAssembly?.nodeId || qwenImportedRecord?.sourceIdentity.node_id || 'unknown',
      repositorySource: repoSource,
      sourceImageId: sourceImage,
      repositoryName: repoBridgeAssembly
        ? repoBridgeAssembly.matchedRecord.sourceMetadata.repositoryName
        : null,
      repositoryCommit: repoBridgeAssembly
        ? repoBridgeAssembly.matchedRecord.sourceMetadata.repositoryCommit
        : null,
      repositoryBlob: repoBridgeAssembly
        ? NATURE_903_METHOD_METADATA.pinnedBlobSha
        : null,
      sourceFilename: sourceImage,
      modelId: qwenImportedRecord?.run.model.model_id || 'Qwen/Qwen2-VL-7B-Instruct',
      instrumentVersion: 'team_repository_bridge_v0.6.3',
      approvedAtIso: new Date().toISOString(),
      approvalActionProvenance: repoBridgeAssembly
        ? 'SYSTEM_DEFAULT_AUTO_APPROVAL_ON_VLM_OBSERVATIONS_IMPORT: matched usable repository record automatically authorized for paper synthesis'
        : 'EXPLICIT_APPROVAL_GATE_USER_ACTION: Confirmed for paper synthesis',
    });
  };

  const handleRevokeQwenApproval = () => {
    if (preQwenPaperInputs) {
      setPaperExternalInputs((current) => ({
        ...current,
        ...preQwenPaperInputs,
      }));
    } else {
      setPaperExternalInputs((current) => ({
        ...current,
        vlmVNat: null,
        vlmVBuilt: null,
        gviEye: null,
        gmi: null,
        vSign: null,
        sfv: null,
        vPave: null,
        gfapi: null,
        ias: null,
        canyonEnclosureRatio: null,
      }));
    }

    setPaperExternalInputs((current) => ({
      ...current,
      visualInputMode: murrayHillDatasetMatch
        ? 'murrayhill_dataset_working'
        : 'manual_or_unclassified',
      visualInputProvenance: murrayHillDatasetMatch
        ? `vlm_observations_murrayhill.csv · ${murrayHillDatasetMatch.identity.file}`
        : null,
    }));

    setQwenPaperApproval(null);
    setPreQwenPaperInputs(null);
  };

  const handleQwenImported = (
    record: QwenCsvImportedRecord
  ) => {
    // A new imported row must never inherit approval from a previous row.
    if (qwenPaperApproval) {
      if (preQwenPaperInputs) {
        setPaperExternalInputs((current) => ({
          ...current,
          ...preQwenPaperInputs,
        }));
      }

      setQwenPaperApproval(null);
      setPreQwenPaperInputs(null);
    }

    setQwenImportedRecord(record);

    if ((record as any)._rawRow) {
      try {
        const matched = buildMatchedRecordFromRow(
          (record as any)._rawRow,
          'vlm_observations_murrayhill.csv',
          0,
          'EXACT_FILENAME'
        );
        const assembly = assembleRepoPaperBridge(matched);
        setRepoBridgeAssembly(assembly);
      } catch (err) {
        console.error('Failed to bridge imported Qwen row to repo bridge', err);
      }
    }
  };


  const handleApplyMurrayHillDataset = (
    match: MurrayHillIntegratedMatch
  ) => {
    const rollbackSnapshot =
      preQwenPaperInputs ??
      captureQwenControlledPaperInputs(paperExternalInputs);

    setPreQwenPaperInputs(rollbackSnapshot);
    setQwenImportedRecord(match.qwenRecord);
    setMurrayHillDatasetMatch(match);

    try {
      const assembly = buildRepoAssemblyFromMurrayHillMatch(match);
      setRepoBridgeAssembly(assembly);

      // UX v0.7.1: a valid matched vlm_observations_murrayhill.csv row is
      // automatically loaded and authorized. This removes the duplicate
      // Team Repository CSV upload and explicit approval click while keeping
      // the approval provenance explicit and auditable.
      if (assembly.usableForActiveSynthesis) {
        setPaperExternalInputs((current) => ({
          ...current,
          ...match.workingVisualPatch,
          vlmVNat: assembly.mappedVariables.vNat.value,
          vlmVBuilt: assembly.mappedVariables.vBuilt.value,
          gviEye: assembly.mappedVariables.gviEye.value,
          gmi: assembly.mappedVariables.gmi.value,
          vSign: assembly.mappedVariables.vSign.value,
          sfv: assembly.mappedVariables.sfv.value,
          vPave: assembly.mappedVariables.vPave.value,
          gfapi: assembly.mappedVariables.gfapi.value,
          ias: assembly.mappedVariables.ias.value,
          canyonEnclosureRatio:
            assembly.mappedVariables.svf.value !== null &&
            assembly.mappedVariables.svf.value !== undefined
              ? 1 - assembly.mappedVariables.svf.value
              : null,
          hwRatio: assembly.mappedVariables.hwRatio.value ?? match.hwEffective ?? current.hwRatio,
          // Keep geometric node_SVF_band separate. Active Y_i still uses the
          // Qwen sky-openness proxy carried by canyonEnclosureRatio.
          svf: current.svf,
          visualInputMode: 'approved_qwen',
          visualInputProvenance: `${assembly.matchedRecord.sourceMetadata.repositoryName} · ${assembly.matchedRecord.identity.sourceFilename}`,
        }));

        const sourceImage = assembly.matchedRecord.identity.sourceFilename;
        setQwenPaperApproval({
          source: 'team_repository_data_bridge',
          nodeId: assembly.nodeId,
          repositorySource: `${assembly.matchedRecord.sourceMetadata.repositoryName} @ ${assembly.matchedRecord.sourceMetadata.repositoryCommit} · ${assembly.matchedRecord.sourceMetadata.activeSourceTable}`,
          sourceImageId: sourceImage,
          repositoryName: assembly.matchedRecord.sourceMetadata.repositoryName,
          repositoryCommit: assembly.matchedRecord.sourceMetadata.repositoryCommit,
          repositoryBlob: NATURE_903_METHOD_METADATA.pinnedBlobSha,
          sourceFilename: sourceImage,
          modelId: match.qwenRecord?.run.model.model_id || 'Qwen/Qwen2-VL-7B-Instruct',
          instrumentVersion: 'team_repository_bridge_v0.6.3',
          approvedAtIso: new Date().toISOString(),
          approvalActionProvenance:
            'SYSTEM_DEFAULT_AUTO_APPROVAL_ON_VLM_OBSERVATIONS_IMPORT: matched usable repository record automatically authorized for paper synthesis',
        });
      } else {
        setQwenPaperApproval(null);
        setPaperExternalInputs((current) => ({
          ...current,
          ...match.workingVisualPatch,
          hwRatio: match.hwEffective ?? current.hwRatio,
          svf: current.svf,
          visualInputMode: 'murrayhill_dataset_working',
          visualInputProvenance: `vlm_observations_murrayhill.csv · ${match.identity.file}`,
        }));
      }
    } catch (error) {
      console.error('Failed to build/authorize Murray Hill repository bridge', error);
      setRepoBridgeAssembly(null);
      setQwenPaperApproval(null);
      setPaperExternalInputs((current) => ({
        ...current,
        ...match.workingVisualPatch,
        hwRatio: match.hwEffective ?? current.hwRatio,
        svf: current.svf,
        visualInputMode: 'murrayhill_dataset_working',
        visualInputProvenance: `vlm_observations_murrayhill.csv · ${match.identity.file}`,
      }));
    }
  };

  const handlePaperExternalInputsChange = (
    next: PaperExternalResearchInputs
  ) => {
    // Editing GIS / Space Syntax / behavior does not revoke Qwen provenance.
    // Editing any VLM-owned visual-semantic value does.
    const visualInputsChanged =
      !qwenControlledInputsEqual(
        paperExternalInputs,
        next
      );

    if (
      qwenPaperApproval &&
      visualInputsChanged
    ) {
      setQwenPaperApproval(null);
      setPreQwenPaperInputs(null);
    }

    if (visualInputsChanged) {
      setPaperExternalInputs({
        ...next,
        visualInputMode:
          'manual_or_unclassified',
        visualInputProvenance:
          null,
      });

      setMurrayHillDatasetMatch(
        null
      );

      return;
    }

    setPaperExternalInputs(next);
  };

  // ===========================================================================
  // PRESERVED LEGACY v3.2 INFERENCE
  // ===========================================================================

  const handleRunLegacyEvaluate =
    async () => {
      setIsLegacyLoading(
        true
      );

      setLegacyErrorMessage(
        null
      );

      try {
        const response =
          await fetch(
            '/api/evaluate',
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({
                  imageId:
                    activeImageId,

                  pixelClassificationBase64:
                    pixelClassificationUrl,

                  pixelClassificationMimeType:
                    pixelClassificationFilename
                      .toLowerCase()
                      .endsWith('.png')
                      ? 'image/png'
                      : 'image/jpeg',

                  originalBase64:
                    originalUrl,

                  originalMimeType:
                    originalFilename
                      .toLowerCase()
                      .endsWith('.png')
                      ? 'image/png'
                      : 'image/jpeg',
                }),
            }
          );

        if (!response.ok) {
          const errJson =
            await response
              .json()
              .catch(
                () => ({})
              );

          throw new Error(
            errJson.error ||
            `Server error: ${response.status}`
          );
        }

        const resData =
          await response.json();

        if (
          !resData.success ||
          !resData.data
        ) {
          throw new Error(
            resData.error ||
            'Invalid response from legacy evaluate.'
          );
        }

        const receivedEval:
          VlmStreetscapeEvaluationV31 =
            resData.data;

        setEvaluation(
          receivedEval
        );

        setRawLegacyJson(
          resData.rawResponse ||
          JSON.stringify(
            receivedEval,
            null,
            2
          )
        );

        setMechanicalAudit(
          runMechanicalAudit(
            receivedEval
          )
        );
      } catch (err: any) {
        console.error(
          'Legacy evaluate error:',
          err
        );

        setLegacyErrorMessage(
          err.message ||
          'Legacy evaluate failed.'
        );
      } finally {
        setIsLegacyLoading(
          false
        );
      }
    };

  // ===========================================================================
  // UI
  // ===========================================================================

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col font-sans antialiased selection:bg-stone-800 selection:text-white">
      {/* =====================================================================
          HEADER
          ===================================================================== */}

      <Header
        onOpenProtocolInfo={() =>
          setIsProtocolModalOpen(
            true
          )
        }
        modelName="Frozen Vision + Qwen Working Dataset + Nature 9.02 Orthogonal Target"
        taxonomyStatus="configured"
      />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6 flex-1">
        <ResearchWorkflowNavigator />

        {/* ===================================================================
            STAGE 01 · CASE & VISION EVIDENCE
            =================================================================== */}

        <section className="space-y-6">
          <ResearchStageHeader stageId="stage-01-evidence" />

          <CaseInputSection
            onSelectSampleCase={
              handleSelectSampleCase
            }
            onRunVisionMeasurement={
              handleRunVisionMeasurement
            }
            isLoading={
              isVisionLoading
            }
            activeImageId={
              activeImageId
            }
            pixelClassificationUrl={
              pixelClassificationUrl
            }
            originalUrl={
              originalUrl
            }
            pixelClassificationFilename={
              pixelClassificationFilename
            }
            originalFilename={
              originalFilename
            }
          />

          {visionError && (
            <div className="bg-rose-50 border border-rose-300 text-rose-900 p-4 rounded-lg flex items-start gap-3 text-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />

              <div className="space-y-1">
                <span className="font-mono font-bold uppercase block text-rose-800">
                  Vision Measurement Error
                </span>

                <p className="font-sans leading-relaxed">
                  {visionError}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ===================================================================
            ACTIVE PAPER-ALIGNED RESEARCH REPORT
            =================================================================== */}

        <ErrorBoundary fallbackTitle="Visualization error — raw measurements remain available.">
          <div
            id="vision-research-report"
            className="space-y-7"
          >
            {/* ===============================================================
                STAGE 01 · EVIDENCE RECORD
                =============================================================== */}

            <section
              data-pdf-page="1"
              className="space-y-6"
            >
              <VisionEvidenceSection
                pixelClassificationUrl={
                  pixelClassificationUrl
                }
                originalUrl={
                  originalUrl
                }
                imageId={
                  activeImageId
                }
                pixelClassificationFilename={
                  pixelClassificationFilename
                }
                originalFilename={
                  originalFilename
                }
              />

              <Nature902ProtocolAlignmentPanel
                match={murrayHillDatasetMatch}
              />

              <MurrayHillMainRepoEvidencePanel
                match={murrayHillDatasetMatch}
                audit={mainRepoAudit}
              />

              <BlockologyNodeProvenancePanel
                match={blockologyMatch}
                manifest={blockologyManifest}
                loading={blockologyLoading}
                error={blockologyError}
              />

              <SemanticMeasurementsPanel
                pixelMeasurements={
                  pixelMeasurements
                }
                isLoading={
                  isVisionLoading
                }
              />

              <StreetInterfaceEvidencePanel
                pixelMeasurements={
                  pixelMeasurements
                }
                isLoading={
                  isVisionLoading
                }
              />
            </section>

            {/* ===============================================================
                STAGE 02 · VLM MEASUREMENT
                =============================================================== */}

            <section
              data-pdf-page="2"
              className="space-y-6"
            >
              <ResearchStageHeader stageId="stage-02-vlm" />

              <MurrayHillIntegratedDatasetPanel
                activeImageId={activeImageId}
                originalFilename={originalFilename}
                onApply={handleApplyMurrayHillDataset}
              />

              <QwenPaperMappingPanel
                importedRecord={qwenImportedRecord}
                teacherMeasurement={paperVlmMeasurement}
                appSourceFilename={originalFilename}
              />

              <ResearchDisclosure
                title="Repository & Approval Provenance"
                description="Advanced audit view for the automatically matched Team Repository bridge and paper-assembly authorization. No operator action is required in the primary workflow."
                badge="Advanced Provenance"
                tone="emerald"
                icon="database"
              >
                <div className="space-y-4">
                  <TeamRepositoryDataPanel
                    assembly={repoBridgeAssembly}
                  />

                  <QwenPaperApprovalPanel
                    importedRecord={qwenImportedRecord}
                    repoAssembly={repoBridgeAssembly}
                    approval={qwenPaperApproval}
                    onApprove={handleApproveQwenForPaperAssembly}
                    onRevoke={handleRevokeQwenApproval}
                  />
                </div>
              </ResearchDisclosure>

              <ResearchDisclosure
                title="Appendix A VLM Protocol v3.0 Comparator"
                description="Comparison-only implementation of the manuscript Appendix A structured VLM protocol. It does not own canonical Qwen paper variables and cannot automatically write Paper Assembly."
                badge="Experimental Comparator"
                tone="violet"
                icon="experiment"
              >
                <PaperVlmProtocolPanel
                  imageId={activeImageId}
                  originalUrl={originalUrl}
                  originalFilename={originalFilename}
                  measurement={paperVlmMeasurement}
                  onMeasurementReady={handlePaperVlmMeasurementReady}
                />
              </ResearchDisclosure>
            </section>

            {/* ===============================================================
                STAGE 03 · SPATIAL & BEHAVIORAL INPUTS
                =============================================================== */}

            <section
              data-pdf-page="3"
              className="space-y-6"
            >
              <ResearchStageHeader stageId="stage-03-inputs" />

              <Nature902CalibrationGwrPanel />

              <PaperProtocolInputsPanel
                value={
                  paperExternalInputs
                }
                onChange={
                  handlePaperExternalInputsChange
                }
                repoAssembly={
                  repoBridgeAssembly
                }
                paperSynthesis={
                  paperSynthesis
                }
                qwenApprovalActive={
                  Boolean(qwenPaperApproval)
                }
              />
            </section>

            {/* ===============================================================
                STAGE 04 · PAPER SYNTHESIS
                =============================================================== */}

            <section
              data-pdf-page="4"
              className="space-y-6"
            >
              <ResearchStageHeader stageId="stage-04-synthesis" />

              {murrayHillDatasetMatch && (
                <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
                  <div className="text-[9px] font-mono font-bold uppercase tracking-wide text-sky-900">
                    Working Dataset Synthesis Active
                  </div>

                  <p className="text-[10px] text-sky-800 mt-1 leading-relaxed">
                    Current Nature 9.03-aligned I_i / Y_i / D_i are recomputed from Murray Hill Qwen components. Legacy CSV I/Y/D/Omega/a/b/c/M remain excluded. Current team source is verified as bidirectional along-street 180° imagery. Equivalence to the paper orthogonal 90° analytical protocol remains unresolved; active SIM uses M_i = I_i^a_i · Y_i^b_i · D_i^c_i.
                  </p>
                </div>
              )}

              {repoBridgeAssembly && !qwenPaperApproval && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
                  <div className="text-[9px] font-mono font-bold uppercase tracking-wide text-amber-900">
                    PREVIEW ONLY · REPOSITORY AUTO-AUTHORIZATION PENDING
                  </div>

                  <p className="text-[10px] text-amber-900 mt-1 leading-relaxed">
                    The deterministic engine may compute I/Y/D/M while the matched
                    source is being resolved, but these values are not an
                    authorized paper result until the repository match is validated
                    and automatic paper-assembly authorization completes.
                  </p>
                </div>
              )}

              {repoBridgeAssembly && qwenPaperApproval && (
                <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3">
                  <div className="text-[9px] font-mono font-bold uppercase tracking-wide text-emerald-900">
                    AUTHORIZED PAPER SYNTHESIS · AUTO-AUTHORIZED REPOSITORY RECORD
                  </div>
                </div>
              )}

              <ResearchVariableReadinessPanel
                pixelMeasurements={pixelMeasurements}
                paperAssembly={paperAssembly}
                paperSynthesis={paperSynthesis}
              />

              <PaperSynthesisStatusStrip
                paperAssembly={
                  paperAssembly
                }
                paperSynthesis={
                  paperSynthesis
                }
                authorizationStatus={
                  repoBridgeAssembly
                    ? qwenPaperApproval
                      ? 'AUTHORIZED'
                      : 'PREVIEW_ONLY_NOT_APPROVED'
                    : 'NOT_APPLICABLE'
                }
              />

              <Nature902SynthesisScalePanel
                paperSynthesis={paperSynthesis}
              />

              <ResearchSynthesisPanel
                paperAssembly={
                  paperAssembly
                }
                paperSynthesis={
                  paperSynthesis
                }
                authorizationStatus={
                  repoBridgeAssembly
                    ? qwenPaperApproval
                      ? 'AUTHORIZED'
                      : 'PREVIEW_ONLY_NOT_APPROVED'
                    : 'NOT_APPLICABLE'
                }
              />
            </section>

            {/* ===============================================================
                STAGE 05 · VALIDATION & PROTOCOL
                =============================================================== */}

            <section
              data-pdf-page="5"
              className="space-y-6"
            >
              <ResearchStageHeader stageId="stage-05-validation" />

              <MultiSourceResearchStatusTable isApproved={Boolean(qwenPaperApproval)} />

              <ResearchDisclosure
                title="Orientation Protocol Validation"
                description="Paper orthogonal 90° analytical protocol versus current team along-street 180° source reconciliation, with source protocol and paper-equivalence status kept separate."
                badge="Protocol Gate"
                tone="amber"
                icon="validation"
              >
                <div className="space-y-6">
                  <OrientationProtocolReconciliationPanel />

                  <OrientationSensitivityValidationPanel />

                  <OrientationSensitivityAnalysisPanel />
                </div>
              </ResearchDisclosure>

              <ResearchDisclosure
                title="Blockology GVI / VEI Validation"
                description="Independent node/panorama provenance plus six-heading CAT-Seg GVI/VEI validation protocol. This branch is validation-only and does not overwrite paper variables."
                badge="Cross-Modal Validation"
                tone="sky"
                icon="validation"
                expandOnExport
              >
                <BlockologyValidationProtocolPanel
                  manifest={blockologyManifest}
                  match={blockologyMatch}
                />
              </ResearchDisclosure>

              <ResearchDisclosure
                title="Murray Hill Main-Repo QA & Method Availability"
                description="Committed Qwen validation/reliability outputs, geometry provenance and explicit audit of what the main repo can and cannot supply to the paper chain."
                badge="Repository Audit"
                tone="violet"
                icon="validation"
              >
                <MurrayHillMainRepoValidationPanel
                  audit={mainRepoAudit}
                  error={mainRepoAuditError}
                />
              </ResearchDisclosure>

              <ResearchDisclosure
                title="Nature 9.02 Manuscript Consistency Audit"
                description="Explicit audit of schema, scale, sampling, GWR, and version inconsistencies that must remain visible until the manuscript owner resolves them."
                badge="Manuscript Audit"
                tone="amber"
                icon="validation"
              >
                <Nature902ManuscriptAuditPanel />
              </ResearchDisclosure>

              <ResearchDisclosure
                title="Vision Validation & Provenance Audit"
                description="Exact-RGB taxonomy audit, mapped coverage, verified source-PNG integrity and deterministic measurement provenance."
                badge="Detailed QA"
                tone="sky"
                icon="validation"
              >
                <VisionValidationPanel
                  pixelMeasurements={
                    pixelMeasurements
                  }
                />
              </ResearchDisclosure>
            </section>
          </div>

          <ReportAndExportSection
            pixelMeasurements={
              pixelMeasurements
            }
            researchNode={
              researchNode
            }
            paperAssembly={
              paperAssembly
            }
            paperSynthesis={
              paperSynthesis
            }
            activeImageId={
              activeImageId
            }
            originalUrl={
              originalUrl
            }
            originalFilename={
              originalFilename
            }
            pixelClassificationUrl={
              pixelClassificationUrl
            }
            qwenImportedRecord={
              qwenImportedRecord
            }
            qwenPaperApproval={
              qwenPaperApproval
            }
            repoAssembly={
              repoBridgeAssembly
            }
            teacherComparatorMeasurement={
              paperVlmMeasurement
            }
            teacherComparatorMetadata={
              paperVlmMetadata
            }
          />
        </ErrorBoundary>

        {/* ===================================================================
            DEVELOPER / METHOD DIAGNOSTICS
            Outside the five-stage canonical paper workflow.
            =================================================================== */}

        <MethodDiagnosticsPanel
          taxonomy={
            taxonomy
          }
          onTaxonomyChange={
            setTaxonomy
          }
          candidateResult={
            candidateResult
          }
          pixelMeasurements={
            pixelMeasurements
          }
          researchNode={
            researchNode
          }
          paperAssembly={
            paperAssembly
          }
          paperSynthesis={
            paperSynthesis
          }
          rawCandidateJson={
            rawCandidateJson
          }
          evaluation={
            evaluation
          }
          rawLegacyJson={
            rawLegacyJson
          }
          mechanicalAudit={
            mechanicalAudit
          }
          onRunLegacyEvaluate={
            handleRunLegacyEvaluate
          }
          isLegacyLoading={
            isLegacyLoading
          }
          legacyErrorMessage={
            legacyErrorMessage
          }
          activeImageId={
            activeImageId
          }
          pixelClassificationUrl={
            pixelClassificationUrl
          }
          originalUrl={
            originalUrl
          }
          pixelClassificationFilename={
            pixelClassificationFilename
          }
          originalFilename={
            originalFilename
          }
          modelUsed="Deterministic Pixel Engine"
          onOpenProtocolModal={() =>
            setIsProtocolModalOpen(
              true
            )
          }
        />
      </main>

      {/* =====================================================================
          FOOTER
          ===================================================================== */}

      <footer className="border-t border-stone-200 bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500 font-mono">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-stone-400" />

            <span>
              Street Interface Measurement — Nature 9.03 Final · No-Omega v0.5.2 — SOURCE LOCKED
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-stone-400">
            <span>
              Baseline:{' '}
              {VISION_BASELINE_VERSION}
            </span>

            <span>•</span>

            <span>
              Taxonomy:{' '}
              {FROZEN_TAXONOMY_VERSION}{' '}
              (30 Classes)
            </span>

            <span>•</span>

            <span>
              Deterministic Vision Accounting
            </span>

            <span>•</span>

            <span>
              Nature 9.03 Final SIM (No-Omega)
            </span>

            {executionTimeMs !== null && (
              <>
                <span>•</span>

                <span>
                  Vision Runtime:{' '}
                  {executionTimeMs}
                  ms
                </span>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* =====================================================================
          PROTOCOL DOCUMENTATION MODAL
          ===================================================================== */}

      <ProtocolDocumentationModal
        isOpen={
          isProtocolModalOpen
        }
        onClose={() =>
          setIsProtocolModalOpen(
            false
          )
        }
      />
    </div>
  );
}