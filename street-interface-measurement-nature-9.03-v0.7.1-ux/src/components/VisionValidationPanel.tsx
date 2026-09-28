/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ============================================================================
 * PAPER-ALIGNED VISION VALIDATION & PROVENANCE AUDIT
 * Street Interface Measurement — Nature 9.02 Aligned v0.4 · Source-Integrity Audit
 * ============================================================================
 *
 * PURPOSE
 * -------
 * Validates the deterministic Vision measurement layer only.
 *
 * IMPORTANT:
 * A PASS here means the exact-RGB pixel accounting pipeline passed its
 * mechanical/provenance checks. It does NOT mean that:
 *
 * - all paper variables are available,
 * - Vision ontology mappings are paper-approved,
 * - GVI_eye / SFV / IAS / GFAPI / H/W / SVF are available,
 * - GWR has been calibrated,
 * - SIM has been computed,
 * - the complete research protocol is validated.
 *
 * Those states are handled by the Paper Variable Readiness / Synthesis layers.
 */

import React from 'react';

import {
  V33PixelMeasurementResult,
  VISION_BASELINE_VERSION,
  FROZEN_TAXONOMY_VERSION,
  FROZEN_30_CLASS_TAXONOMY,
} from '../types';

import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Info,
  Clock3,
} from 'lucide-react';

interface VisionValidationPanelProps {
  pixelMeasurements: V33PixelMeasurementResult | null;
}

type ValidationStatus =
  | 'pass'
  | 'review_required'
  | 'not_run';

interface ValidationCheck {
  id: string;
  label: string;
  expected: string;
  status: ValidationStatus;
  detail: string;
}

export const VisionValidationPanel: React.FC<
  VisionValidationPanelProps
> = ({
  pixelMeasurements,
}) => {
  const hasMeasurement =
    pixelMeasurements !== null;

  const provenance =
    pixelMeasurements?.provenance;

  const taxonomyInfo =
    pixelMeasurements?.taxonomy;

  const imageInfo =
    pixelMeasurements?.image;

  const coverage =
    pixelMeasurements?.coverage;

  const validCount =
    coverage?.valid_pixel_count ?? 0;

  const transparentCount =
    coverage?.transparent_pixel_count ?? 0;

  const mappedCount =
    coverage?.mapped_pixel_count ?? 0;

  const unmappedCount =
    coverage?.unmapped_pixel_count ?? 0;

  const mappedPct =
    coverage
      ? (
          coverage.mapped_fraction *
          100
        ).toFixed(2)
      : '—';

  const unmappedPct =
    coverage
      ? (
          coverage.unmapped_fraction *
          100
        ).toFixed(2)
      : '—';

  const frozenTaxonomyHas30Classes =
    Array.isArray(
      FROZEN_30_CLASS_TAXONOMY.classes
    ) &&
    FROZEN_30_CLASS_TAXONOMY.classes.length === 30;

  const exactMethodVerified =
    provenance?.method ===
      'EXACT RGB TAXONOMY MATCH' &&
    taxonomyInfo?.mapping_mode ===
      'exact_rgb';

  const sourceVerified =
    provenance?.source ===
    'PIXEL_CLASSIFICATION';

  const pngSignatureVerified =
    imageInfo
      ?.png_signature_verified ===
    true;

  const sourceIntegrity =
    imageInfo
      ?.source_integrity ??
    'unknown';

  const sourceKind =
    imageInfo
      ?.source_kind ??
    'unknown';

  const syntheticDemo =
    sourceKind ===
      'built_in_sample' &&
    sourceIntegrity ===
      'synthetic_demo_rasterized_from_svg';

  const validationChecks:
    ValidationCheck[] = [
      {
        id:
          'measurement_status',

        label:
          'Vision Measurement Execution',

        expected:
          'status = computed',

        status:
          !hasMeasurement
            ? 'not_run'
            : pixelMeasurements.status ===
              'computed'
            ? 'pass'
            : 'review_required',

        detail:
          !hasMeasurement
            ? 'No Vision measurement result is currently available.'
            : pixelMeasurements.status ===
              'computed'
            ? 'Deterministic Vision measurement completed successfully.'
            : `Vision measurement returned status "${pixelMeasurements.status}"${
                pixelMeasurements.status_reason
                  ? `: ${pixelMeasurements.status_reason}`
                  : '.'
              }`,
      },

      {
        id:
          'baseline_version',

        label:
          'Vision Baseline Version',

        expected:
          VISION_BASELINE_VERSION,

        status:
          'pass',

        detail:
          `Application is configured against frozen Vision baseline ${VISION_BASELINE_VERSION}.`,
      },

      {
        id:
          'taxonomy_version',

        label:
          'Frozen Semantic Taxonomy',

        expected:
          `${FROZEN_TAXONOMY_VERSION} · 30 classes`,

        status:
          frozenTaxonomyHas30Classes
            ? 'pass'
            : 'review_required',

        detail:
          frozenTaxonomyHas30Classes
            ? `Built-in frozen taxonomy contains exactly ${FROZEN_30_CLASS_TAXONOMY.classes.length} semantic classes.`
            : `Expected 30 frozen classes but found ${FROZEN_30_CLASS_TAXONOMY.classes?.length ?? 0}.`,
      },

      {
        id:
          'primary_evidence',

        label:
          'Primary Analytical Evidence',

        expected:
          'PIXEL_CLASSIFICATION',

        status:
          !hasMeasurement
            ? 'not_run'
            : sourceVerified
            ? 'pass'
            : 'review_required',

        detail:
          !hasMeasurement
            ? 'Awaiting Vision measurement provenance.'
            : sourceVerified
            ? 'Deterministic numerical accounting is sourced from PIXEL_CLASSIFICATION.'
            : `Unexpected provenance source: ${provenance?.source ?? 'unknown'}.`,
      },

      {
        id:
          'mask_format',

        label:
          'Analytical Source Raster Format',

        expected:
          'Verified source PNG',

        status:
          !hasMeasurement
            ? 'not_run'
            : pngSignatureVerified &&
              imageInfo?.format === 'png'
            ? 'pass'
            : 'review_required',

        detail:
          !hasMeasurement
            ? 'Awaiting analytical source metadata.'
            : pngSignatureVerified &&
              imageInfo?.format === 'png'
            ? 'PNG binary signature was verified from the analytical source; the format was not inferred from Canvas rasterization.'
            : syntheticDemo
            ? 'Built-in sample is an SVG data source rasterized in-browser for demonstration. It is not a source PNG and therefore cannot pass publication-grade raster provenance.'
            : `Source format/integrity is "${imageInfo?.format ?? 'unknown'}" / "${sourceIntegrity}". Exact-RGB research measurement requires a verified source PNG.`,
      },

      {
        id:
          'source_integrity',

        label:
          'Source File Integrity',

        expected:
          'PNG signature + PNG provenance',

        status:
          !hasMeasurement
            ? 'not_run'
            : pngSignatureVerified &&
              sourceIntegrity ===
                'verified_png_signature'
            ? 'pass'
            : 'review_required',

        detail:
          !hasMeasurement
            ? 'Awaiting source-integrity metadata.'
            : pngSignatureVerified
            ? `Verified PNG source signature. Filename="${imageInfo?.source_filename ?? 'unknown'}"; MIME="${imageInfo?.source_mime_type ?? 'unknown'}".`
            : syntheticDemo
            ? 'Synthetic built-in SVG is permitted only for UI/demo continuity. Replace it with the original lossless PNG semantic mask for research use.'
            : `Source PNG signature was not verified. status="${pixelMeasurements.status}", integrity="${sourceIntegrity}".`,
      },

      {
        id:
          'exact_matching',

        label:
          'Exact-RGB Mapping Rule',

        expected:
          'Exact [R,G,B] strict lookup',

        status:
          !hasMeasurement
            ? 'not_run'
            : exactMethodVerified
            ? 'pass'
            : 'review_required',

        detail:
          !hasMeasurement
            ? 'Awaiting measurement provenance and taxonomy mapping metadata.'
            : exactMethodVerified
            ? 'Provenance confirms EXACT RGB TAXONOMY MATCH with exact_rgb mapping mode.'
            : `Expected exact-RGB provenance but received method="${provenance?.method ?? 'unknown'}", mapping_mode="${taxonomyInfo?.mapping_mode ?? 'unknown'}".`,
      },

      {
        id:
          'mapped_coverage',

        label:
          'Mapped Pixel Accounting',

        expected:
          '≥ 95% valid pixels mapped (App QA threshold)',

        status:
          !hasMeasurement ||
          !coverage
            ? 'not_run'
            : coverage.mapped_fraction >=
              0.95
            ? 'pass'
            : 'review_required',

        detail:
          !coverage
            ? 'Awaiting pixel coverage accounting.'
            : `${mappedCount.toLocaleString()} px mapped (${mappedPct}%); ${unmappedCount.toLocaleString()} px unmapped (${unmappedPct}%) out of ${validCount.toLocaleString()} valid analytical pixels.`,
      },

      {
        id:
          'transparent_handling',

        label:
          'Transparent Pixel Handling',

        expected:
          'alpha = 0 excluded',

        status:
          !hasMeasurement ||
          !coverage
            ? 'not_run'
            : 'pass',

        detail:
          !coverage
            ? 'Awaiting pixel coverage accounting.'
            : `${transparentCount.toLocaleString()} fully transparent pixels were excluded from the valid analytical denominator.`,
      },
    ];

  const passedCount =
    validationChecks.filter(
      (check) =>
        check.status === 'pass'
    ).length;

  const reviewCount =
    validationChecks.filter(
      (check) =>
        check.status ===
        'review_required'
    ).length;

  const notRunCount =
    validationChecks.filter(
      (check) =>
        check.status ===
        'not_run'
    ).length;

  const totalCount =
    validationChecks.length;

  const overallStatus:
    ValidationStatus =
      !hasMeasurement
        ? 'not_run'
        : reviewCount > 0
        ? 'review_required'
        : notRunCount > 0
        ? 'not_run'
        : 'pass';

  const overallBadgeClass =
    overallStatus === 'pass'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
      : overallStatus ===
        'review_required'
      ? 'bg-amber-100 text-amber-900 border-amber-300'
      : 'bg-stone-100 text-stone-600 border-stone-300';

  const overallLabel =
    overallStatus === 'pass'
      ? 'VISION AUDIT PASS'
      : overallStatus ===
        'review_required'
      ? 'REVIEW REQUIRED'
      : 'AUDIT NOT RUN';

  return (
    <section
      id="vision-validation"
      className="space-y-4"
    >
      {/* =====================================================================
          HEADER
          ===================================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-stone-900 text-stone-100 rounded">
              VISION QA
            </span>

            <h2 className="text-base font-bold text-stone-900 font-mono tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-stone-700" />

              <span>
                Vision Validation &amp; Provenance Audit
              </span>
            </h2>
          </div>

          <p className="text-xs text-stone-500 font-sans mt-0.5 max-w-4xl">
            Dynamic mechanical and source-integrity audit of the deterministic
            exact-RGB Vision layer. PNG validity is verified from the source
            record/signature rather than inferred from browser Canvas output.
          </p>
        </div>

        <span
          className={`px-2.5 py-1 text-xs font-mono font-bold rounded border inline-flex items-center gap-1.5 ${overallBadgeClass}`}
        >
          {overallStatus === 'pass' ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : overallStatus ===
            'review_required' ? (
            <AlertTriangle className="w-3.5 h-3.5" />
          ) : (
            <Clock3 className="w-3.5 h-3.5" />
          )}

          <span>
            {overallLabel}
          </span>
        </span>
      </div>

      {/* =====================================================================
          SCOPE SAFEGUARD
          ===================================================================== */}

      <div className="bg-indigo-50/60 border border-indigo-200 rounded-lg p-3 flex items-start gap-2">
        <Info className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />

        <p className="text-[10px] text-indigo-900 leading-relaxed">
          <strong>
            Scope boundary:
          </strong>
          {' '}
          a Vision Audit PASS validates raster provenance and deterministic
          accounting only. It does not certify paper-variable readiness,
          Vision→Paper ontology equivalence, VLM rubrics, GIS inputs, GWR
          calibration, or final SIM validity.
        </p>
      </div>

      {/* =====================================================================
          PROVENANCE METADATA
          ===================================================================== */}

      <div className="bg-stone-900 text-white rounded-lg p-4 font-mono text-xs shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-stone-400 text-[11px] pb-2 border-b border-stone-800">
          <div className="flex items-center gap-2 text-stone-200">
            <FileCheck className="w-4 h-4 text-emerald-400" />

            <span className="font-bold text-white uppercase tracking-wider">
              Provenance Record
            </span>
          </div>

          <div>
            Timestamp:{' '}
            <span className="text-stone-300">
              {provenance?.timestamp ??
                '—'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
          <div>
            <span className="text-stone-500 block text-[10px] uppercase">
              Measurement Status
            </span>

            <span className="text-stone-200 font-semibold">
              {pixelMeasurements?.status ??
                'NOT RUN'}
            </span>
          </div>

          <div>
            <span className="text-stone-500 block text-[10px] uppercase">
              Analysis Engine
            </span>

            <span className="text-stone-200 font-semibold">
              {provenance?.method ??
                '—'}
            </span>
          </div>

          <div>
            <span className="text-stone-500 block text-[10px] uppercase">
              Primary Evidence
            </span>

            <span className="text-stone-200 font-semibold">
              {provenance?.source ??
                '—'}
            </span>
          </div>

          <div>
            <span className="text-stone-500 block text-[10px] uppercase">
              Mapping Mode
            </span>

            <span className="text-stone-200 font-semibold">
              {taxonomyInfo?.mapping_mode ??
                '—'}
            </span>
          </div>

          <div>
            <span className="text-stone-500 block text-[10px] uppercase">
              Frame Dimensions
            </span>

            <span className="text-stone-200 font-semibold">
              {imageInfo
                ? `${imageInfo.width_px} × ${imageInfo.height_px} px`
                : '—'}
            </span>
          </div>

          <div>
            <span className="text-stone-500 block text-[10px] uppercase">
              Source Raster Format
            </span>

            <span className="text-stone-200 font-semibold">
              {imageInfo?.format ??
                '—'}
            </span>
          </div>

          <div>
            <span className="text-stone-500 block text-[10px] uppercase">
              Source Integrity
            </span>

            <span className={
              pngSignatureVerified
                ? 'text-emerald-400 font-semibold'
                : 'text-amber-300 font-semibold'
            }>
              {sourceIntegrity}
            </span>
          </div>

          <div>
            <span className="text-stone-500 block text-[10px] uppercase">
              Source Kind
            </span>

            <span className="text-stone-200 font-semibold">
              {sourceKind}
            </span>
          </div>

          <div>
            <span className="text-stone-500 block text-[10px] uppercase">
              Source MIME
            </span>

            <span className="text-stone-200 font-semibold">
              {imageInfo?.source_mime_type ??
                '—'}
            </span>
          </div>

          <div>
            <span className="text-stone-500 block text-[10px] uppercase">
              Source Filename
            </span>

            <span className="text-stone-200 font-semibold break-all">
              {imageInfo?.source_filename ??
                '—'}
            </span>
          </div>

          <div>
            <span className="text-stone-500 block text-[10px] uppercase">
              Taxonomy Version
            </span>

            <span className="text-emerald-400 font-semibold">
              {taxonomyInfo?.taxonomy_version ??
                FROZEN_TAXONOMY_VERSION}
            </span>
          </div>

          <div>
            <span className="text-stone-500 block text-[10px] uppercase">
              Analysis ROI
            </span>

            <span className="text-stone-200 font-semibold">
              {provenance?.analysis_roi ??
                '—'}
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          COVERAGE SUMMARY
          ===================================================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-stone-200 rounded-lg p-3">
          <span className="text-[9px] font-mono text-stone-400 uppercase block">
            Valid Pixels
          </span>

          <span className="text-sm font-mono font-bold text-stone-900">
            {hasMeasurement
              ? validCount.toLocaleString()
              : '—'}
          </span>
        </div>

        <div className="bg-white border border-stone-200 rounded-lg p-3">
          <span className="text-[9px] font-mono text-stone-400 uppercase block">
            Mapped
          </span>

          <span className="text-sm font-mono font-bold text-emerald-800">
            {hasMeasurement
              ? `${mappedPct}%`
              : '—'}
          </span>
        </div>

        <div className="bg-white border border-stone-200 rounded-lg p-3">
          <span className="text-[9px] font-mono text-stone-400 uppercase block">
            Unmapped
          </span>

          <span className={`text-sm font-mono font-bold ${
            coverage &&
            coverage.unmapped_fraction >
              0.05
              ? 'text-amber-800'
              : 'text-stone-900'
          }`}>
            {hasMeasurement
              ? `${unmappedPct}%`
              : '—'}
          </span>
        </div>

        <div className="bg-white border border-stone-200 rounded-lg p-3">
          <span className="text-[9px] font-mono text-stone-400 uppercase block">
            Transparent Excluded
          </span>

          <span className="text-sm font-mono font-bold text-stone-900">
            {hasMeasurement
              ? transparentCount.toLocaleString()
              : '—'}
          </span>
        </div>
      </div>

      {/* =====================================================================
          DYNAMIC VERIFICATION RULES
          ===================================================================== */}

      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="px-4 py-3 bg-stone-100/70 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-mono font-bold text-stone-800 uppercase tracking-wider">
            Deterministic Provenance Verification Rules
          </span>

          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
            <span className="text-emerald-700 font-bold">
              {passedCount} PASS
            </span>

            <span className="text-amber-700 font-bold">
              {reviewCount} REVIEW
            </span>

            <span className="text-stone-500">
              {notRunCount} NOT RUN
            </span>

            <span className="text-stone-400">
              / {totalCount} TOTAL
            </span>
          </div>
        </div>

        <div className="divide-y divide-stone-100">
          {validationChecks.map(
            (check) => (
              <div
                key={
                  check.id
                }
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-stone-50/50 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-stone-900">
                      {check.label}
                    </span>

                    <span className="text-[10px] font-mono text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                      {check.expected}
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-600 font-sans leading-relaxed">
                    {check.detail}
                  </p>
                </div>

                <div className="shrink-0 self-start sm:self-center">
                  {check.status ===
                  'pass' ? (
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 rounded border border-emerald-300 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />

                      <span>
                        PASS
                      </span>
                    </span>
                  ) : check.status ===
                    'review_required' ? (
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-100 text-amber-900 rounded border border-amber-300 inline-flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-700" />

                      <span>
                        REVIEW REQUIRED
                      </span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-stone-100 text-stone-600 rounded border border-stone-300 inline-flex items-center gap-1">
                      <Clock3 className="w-3 h-3 text-stone-500" />

                      <span>
                        NOT RUN
                      </span>
                    </span>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* =====================================================================
          METHOD NOTE
          ===================================================================== */}

      <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 flex items-start gap-2">
        <Info className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />

        <p className="text-[10px] text-stone-600 leading-relaxed">
          The ≥95% mapped-pixel threshold shown here is an application-level
          Vision QA threshold, not a claim that the manuscript defines 95% as
          a universal research-validity cutoff. Unmapped pixels remain visible
          and must be reviewed when coverage falls below this threshold.
          Source-format integrity is a separate gate: browser rasterization
          never upgrades SVG/JPEG/WebP evidence into a verified source PNG.
          Built-in SVG cases are demonstration-only and should correctly show
          REVIEW REQUIRED until replaced by original lossless PNG masks.
        </p>
      </div>
    </section>
  );
};
