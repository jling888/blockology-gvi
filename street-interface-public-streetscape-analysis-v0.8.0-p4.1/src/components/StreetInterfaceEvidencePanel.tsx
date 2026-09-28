/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ============================================================================
 * PAPER-ALIGNED STREET INTERFACE EVIDENCE PANEL
 * Street Interface Measurement — Nature 9.02 Aligned v0.4 · Qwen + Space Syntax/GWR
 * ============================================================================
 *
 * PURPOSE
 * -------
 * Presents deterministic physical evidence from the frozen segmentation
 * taxonomy without converting raw pixel presence into unsupported research
 * interpretations.
 *
 * CRITICAL BOUNDARIES
 * -------------------
 * - Ground-floor glazing presence is NOT automatically "Active Frontage".
 * - Glazing / entrances are evidence inputs for later GFAPI reasoning.
 * - Ledges / stoops / furniture are potential affordance evidence, not IAS.
 * - Whole-frame vegetation is NOT GVI_eye.
 * - Perspective sky fraction is NOT true SVF.
 * - Pixel geometry is NOT exact H/W.
 */

import React from 'react';

import {
  V33PixelMeasurementResult,
} from '../types';

import {
  Trees,
  Shield,
  Building2,
  Armchair,
  Info,
  LockKeyhole,
  Sparkles,
} from 'lucide-react';

interface StreetInterfaceEvidencePanelProps {
  pixelMeasurements: V33PixelMeasurementResult | null;
  isLoading?: boolean;
}

export const StreetInterfaceEvidencePanel: React.FC<
  StreetInterfaceEvidencePanelProps
> = ({
  pixelMeasurements,
  isLoading,
}) => {
  const measurements =
    pixelMeasurements?.class_measurements || [];

  const groups =
    pixelMeasurements?.group_measurements;

  const derived =
    pixelMeasurements?.derived_metrics;

  const coverage =
    pixelMeasurements?.coverage;

  const validTotal =
    coverage?.valid_pixel_count || 0;

  const hasValidMeasurement =
    Boolean(
      pixelMeasurements &&
      pixelMeasurements.status === 'computed' &&
      validTotal > 0
    );

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  const getClassStats = (
    classId: string
  ) => {
    const measurement =
      measurements.find(
        (item) =>
          item.class_id === classId
      );

    const count =
      measurement?.pixel_count ?? 0;

    const fraction =
      measurement?.fraction_of_valid_pixels ?? 0;

    const pct =
      (
        fraction *
        100
      ).toFixed(2);

    return {
      count,
      fraction,
      pct,
      detected:
        count > 0,
    };
  };

  const percentageOfValid = (
    count: number
  ) => {
    if (
      !hasValidMeasurement ||
      validTotal <= 0
    ) {
      return '0.00';
    }

    return (
      (
        count /
        validTotal
      ) *
      100
    ).toFixed(2);
  };

  // ===========================================================================
  // DOMAIN A — GREEN / HABITAT PHYSICAL EVIDENCE
  // ===========================================================================

  const tree =
    getClassStats(
      'tree'
    );

  const shrubHedge =
    getClassStats(
      'shrub_hedge'
    );

  const groundVeg =
    getClassStats(
      'ground_vegetation'
    );

  const greenWall =
    getClassStats(
      'vertical_green_wall'
    );

  const totalVegPixels =
    groups?.P_vegetation ?? 0;

  const totalVegPct =
    percentageOfValid(
      totalVegPixels
    );

  const naturalAboveGround =
    groups?.P_natural_above_ground ?? 0;

  const natBuiltRatio =
    derived
      ?.natural_built_above_ground_ratio;

  // ===========================================================================
  // DOMAIN B — EDGE / BARRIER + GROUND-FLOOR INTERFACE EVIDENCE
  // ===========================================================================

  const fenceRailing =
    getClassStats(
      'fence_railing'
    );

  const wallLedge =
    getClassStats(
      'wall_ledge'
    );

  const curbEdge =
    getClassStats(
      'curb_edge'
    );

  const scaffoldShed =
    getClassStats(
      'sidewalk_shed_scaffold'
    );

  const gfGlazing =
    getClassStats(
      'ground_floor_glazing'
    );

  const gfSolidFacade =
    getClassStats(
      'ground_floor_solid_facade'
    );

  const doorEntrance =
    getClassStats(
      'door_entrance'
    );

  const totalBarrierPixels =
    fenceRailing.count +
    wallLedge.count +
    curbEdge.count +
    scaffoldShed.count;

  const totalBarrierPct =
    percentageOfValid(
      totalBarrierPixels
    );

  const frontageEvidencePixels =
    gfGlazing.count +
    doorEntrance.count;

  const frontageEvidencePct =
    percentageOfValid(
      frontageEvidencePixels
    );

  const frontageEvidencePresent =
    frontageEvidencePixels > 0;

  // ===========================================================================
  // DOMAIN C — STRUCTURAL ENCLOSURE PHYSICAL EVIDENCE
  // ===========================================================================

  const upperFacade =
    getClassStats(
      'upper_building_facade'
    );

  const upperGlazing =
    getClassStats(
      'upper_building_glazing'
    );

  const arcadeColumn =
    getClassStats(
      'arcade_column'
    );

  const arcadeSoffit =
    getClassStats(
      'arcade_soffit'
    );

  const sky =
    getClassStats(
      'sky'
    );

  const builtAboveGround =
    groups?.P_built_above_ground ?? 0;

  const builtAboveGroundPct =
    percentageOfValid(
      builtAboveGround
    );

  // ===========================================================================
  // DOMAIN D — MICRO-SPATIAL AFFORDANCE EVIDENCE
  // ===========================================================================

  const sidewalk =
    getClassStats(
      'sidewalk'
    );

  const stoop =
    getClassStats(
      'stoop_stair'
    );

  const bench =
    getClassStats(
      'bench_seating'
    );

  const tableChair =
    getClassStats(
      'table_chair'
    );

  const parasol =
    getClassStats(
      'parasol'
    );

  const planter =
    getClassStats(
      'planter_container'
    );

  const signboard =
    getClassStats(
      'signboard'
    );

  const awning =
    getClassStats(
      'awning_canopy'
    );

  const totalPedGroundPixels =
    groups?.P_sidewalk ?? 0;

  const pedGroundPct =
    percentageOfValid(
      totalPedGroundPixels
    );

  const explicitFurniturePixels =
    (
      groups?.P_outdoor_seating ??
      0
    ) +
    (
      groups?.P_parasol ??
      0
    ) +
    (
      groups?.P_planter ??
      0
    );

  /**
   * IMPORTANT:
   * wallLedge and stoop pixels are included only as POTENTIAL affordance
   * evidence. Pixel presence alone does not establish seatability or IAS.
   */
  const potentialAffordancePixels =
    explicitFurniturePixels +
    wallLedge.count +
    stoop.count;

  const potentialAffordancePct =
    percentageOfValid(
      potentialAffordancePixels
    );

  // ===========================================================================
  // LOADING / EMPTY STATUS
  // ===========================================================================

  const statusText =
    isLoading
      ? 'MEASURING'
      : hasValidMeasurement
      ? 'DETERMINISTIC EVIDENCE READY'
      : 'AWAITING VISION MEASUREMENT';

  return (
    <section
      id="street-interface-evidence"
      className="space-y-4"
    >
      {/* =====================================================================
          HEADER
          ===================================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-stone-900 text-stone-100 rounded">
              PHYSICAL EVIDENCE
            </span>

            <h2 className="text-base font-bold text-stone-900 font-mono tracking-tight flex items-center gap-2">
              <Building2 className="w-4 h-4 text-stone-700" />

              <span>
                Street Interface Physical Evidence
              </span>
            </h2>
          </div>

          <p className="text-xs text-stone-500 font-sans mt-0.5 max-w-4xl">
            Deterministic segmentation evidence organized into four
            analytical evidence families. Raw physical presence is kept
            separate from VLM interpretation and final paper indices.
          </p>
        </div>

        <span className="px-2 py-1 bg-stone-100 border border-stone-200 rounded text-[9px] font-mono font-bold text-stone-600">
          {statusText}
        </span>
      </div>

      {/* =====================================================================
          GLOBAL SAFEGUARD
          ===================================================================== */}

      <div className="bg-indigo-50/60 border border-indigo-200 rounded-lg p-3 flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />

        <p className="text-[10px] text-indigo-900 leading-relaxed">
          <strong>
            Evidence ≠ research score.
          </strong>
          {' '}
          Vision provides measurable physical evidence. Context-dependent
          constructs such as GFAPI, IAS and SFV require validated downstream
          reasoning or external measurement before they may enter the
          paper synthesis engine.
        </p>
      </div>

      {/* =====================================================================
          2 × 2 EVIDENCE GRID
          ===================================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ===================================================================
            A. GREEN / HABITAT
            =================================================================== */}

        <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded">
                  <Trees className="w-4 h-4" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-stone-900 font-mono">
                    1. Green / Habitat Evidence
                  </h3>

                  <span className="text-[10px] text-stone-400 font-mono">
                    Vegetation strata &amp; natural footprint
                  </span>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-xs font-bold text-emerald-800">
                  {totalVegPct}%
                </span>

                <span className="text-[10px] text-stone-400 block">
                  Whole-Frame Vegetation
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="text-[11px] text-stone-500 font-semibold uppercase tracking-wider font-sans">
                Directly Detected Vegetation Strata
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-stone-50 rounded border border-stone-100 flex items-center justify-between">
                  <span className="text-stone-700">
                    Tree
                  </span>

                  <span className="font-bold text-stone-900">
                    {tree.pct}%
                  </span>
                </div>

                <div className="p-2 bg-emerald-50 rounded border border-emerald-100 flex items-center justify-between">
                  <span className="text-emerald-800">
                    v1.5.7.1 Tree Policy
                  </span>

                  <span className="font-bold text-[9px] text-emerald-900">
                    crown + branches + trunk → tree
                  </span>
                </div>

                <div className="p-2 bg-stone-50 rounded border border-stone-100 flex items-center justify-between">
                  <span className="text-stone-700">
                    Shrub / Hedge
                  </span>

                  <span className="font-bold text-stone-900">
                    {shrubHedge.pct}%
                  </span>
                </div>

                <div className="p-2 bg-stone-50 rounded border border-stone-100 flex items-center justify-between">
                  <span className="text-stone-700">
                    Ground Vegetation
                  </span>

                  <span className="font-bold text-stone-900">
                    {groundVeg.pct}%
                  </span>
                </div>

                <div className="p-2 bg-stone-50 rounded border border-stone-100 flex items-center justify-between col-span-2">
                  <span className="text-stone-700">
                    Vertical Green Wall
                  </span>

                  <span className="font-bold text-stone-900">
                    {greenWall.pct}%
                  </span>
                </div>
              </div>

              <div className="mt-2 p-2 bg-emerald-50/50 border border-emerald-200 rounded flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-emerald-800 uppercase font-bold block">
                    Vision Candidate Natural / Built Ratio
                  </span>

                  <span className="text-[10px] text-emerald-700/80">
                    P_natural_above_ground ({naturalAboveGround.toLocaleString()} px)
                    {' '}
                    / P_built_above_ground
                  </span>
                </div>

                <span className="text-sm font-bold text-emerald-900 font-mono">
                  {natBuiltRatio?.value !== null &&
                  natBuiltRatio?.value !== undefined
                    ? natBuiltRatio.value.toFixed(3)
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border-t border-amber-200 pt-2 px-2 pb-2 flex items-start gap-1.5 text-[10px] text-amber-900 font-sans">
            <LockKeyhole className="w-3.5 h-3.5 shrink-0 mt-0.5" />

            <p className="leading-snug">
              Whole-frame vegetation percentage is
              {' '}
              <strong>not GVI_eye</strong>.
              {' '}
              GVI_eye remains gated until a calibrated eye-level / foveal
              camera ROI is defined.
            </p>
          </div>
        </div>

        {/* ===================================================================
            B. EDGE / BARRIER + GROUND FLOOR
            =================================================================== */}

        <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 text-blue-800 rounded">
                  <Shield className="w-4 h-4" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-stone-900 font-mono">
                    2. Edge / Barrier &amp; Frontage Evidence
                  </h3>

                  <span className="text-[10px] text-stone-400 font-mono">
                    Physical boundaries + ground-floor interface evidence
                  </span>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-xs font-bold text-blue-800">
                  {totalBarrierPct}%
                </span>

                <span className="text-[10px] text-stone-400 block">
                  Barrier Footprint
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="text-[11px] text-stone-500 font-semibold uppercase tracking-wider font-sans">
                Directly Detected Edge Elements
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-stone-50 rounded border border-stone-100 flex items-center justify-between">
                  <span className="text-stone-700">
                    Fence / Railing
                  </span>

                  <span className="font-bold text-stone-900">
                    {fenceRailing.pct}%
                  </span>
                </div>

                <div className="p-2 bg-stone-50 rounded border border-stone-100 flex items-center justify-between">
                  <span className="text-stone-700">
                    Wall / Ledge
                  </span>

                  <span className="font-bold text-stone-900">
                    {wallLedge.pct}%
                  </span>
                </div>

                <div className="p-2 bg-stone-50 rounded border border-stone-100 flex items-center justify-between">
                  <span className="text-stone-700">
                    Curb Edge
                  </span>

                  <span className="font-bold text-stone-900">
                    {curbEdge.pct}%
                  </span>
                </div>

                <div className="p-2 bg-stone-50 rounded border border-stone-100 flex items-center justify-between">
                  <span className="text-stone-700">
                    Shed / Scaffold
                  </span>

                  <span className="font-bold text-stone-900">
                    {scaffoldShed.pct}%
                  </span>
                </div>
              </div>

              <div className="mt-3 text-[11px] text-stone-500 font-semibold uppercase tracking-wider font-sans">
                Ground-Floor Interface Evidence
              </div>

              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div className="p-2 bg-stone-50 rounded border border-stone-100">
                  <span className="text-stone-500 block">
                    Glazing
                  </span>

                  <strong className="font-mono text-stone-900">
                    {gfGlazing.pct}%
                  </strong>
                </div>

                <div className="p-2 bg-stone-50 rounded border border-stone-100">
                  <span className="text-stone-500 block">
                    Entrances
                  </span>

                  <strong className="font-mono text-stone-900">
                    {doorEntrance.pct}%
                  </strong>
                </div>

                <div className="p-2 bg-stone-50 rounded border border-stone-100">
                  <span className="text-stone-500 block">
                    Solid Facade
                  </span>

                  <strong className="font-mono text-stone-900">
                    {gfSolidFacade.pct}%
                  </strong>
                </div>
              </div>

              {/* ------------------------------------------------------------
                  CRITICAL FIX:
                  glazing != active frontage
                  ------------------------------------------------------------ */}

              <div className="mt-2 p-2.5 bg-blue-50/50 border border-blue-200 rounded">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-blue-800 uppercase font-bold block">
                      GFAPI Evidence Readiness
                    </span>

                    <span className="text-[10px] text-blue-700/80">
                      Glazing + entrance evidence:
                      {' '}
                      {frontageEvidencePct}%
                      {' '}
                      of valid frame
                    </span>
                  </div>

                  <span className="text-[10px] font-bold text-blue-900 font-mono">
                    {frontageEvidencePresent
                      ? 'FRONTAGE EVIDENCE PRESENT'
                      : 'NO FRONTAGE EVIDENCE DETECTED'}
                  </span>
                </div>

                <div className="mt-2 pt-2 border-t border-blue-200 flex items-start gap-1.5">
                  <LockKeyhole className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />

                  <p className="text-[10px] text-blue-900 leading-relaxed">
                    Ground-floor glazing presence does
                    {' '}
                    <strong>not</strong>
                    {' '}
                    establish active frontage or GFAPI by itself.
                    Active permeability requires contextual evidence such as
                    usable entrances, visual/physical permeability, threshold
                    condition and ground-floor activity.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-stone-50 border-t border-stone-100 pt-2 flex items-start gap-1.5 text-[10px] text-stone-500 font-sans">
            <Info className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />

            <p className="leading-snug">
              Barrier pixels quantify physical presence only. Buffer depth,
              edge continuity and interface permeability require contextual
              reasoning beyond raw pixel count.
            </p>
          </div>
        </div>

        {/* ===================================================================
            C. STRUCTURAL ENCLOSURE
            =================================================================== */}

        <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 text-amber-800 rounded">
                  <Building2 className="w-4 h-4" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-stone-900 font-mono">
                    3. Structural Enclosure Evidence
                  </h3>

                  <span className="text-[10px] text-stone-400 font-mono">
                    Vertical built mass &amp; perspective sky aperture
                  </span>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-xs font-bold text-amber-900">
                  {builtAboveGroundPct}%
                </span>

                <span className="text-[10px] text-stone-400 block">
                  Vision Built Footprint
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="text-[11px] text-stone-500 font-semibold uppercase tracking-wider font-sans">
                Directly Detected Facade &amp; Sky Elements
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-stone-50 rounded border border-stone-100 flex items-center justify-between">
                  <span className="text-stone-700">
                    Upper Facade
                  </span>

                  <span className="font-bold text-stone-900">
                    {upperFacade.pct}%
                  </span>
                </div>

                <div className="p-2 bg-stone-50 rounded border border-stone-100 flex items-center justify-between">
                  <span className="text-stone-700">
                    Sky Aperture
                  </span>

                  <span className="font-bold text-stone-900">
                    {sky.pct}%
                  </span>
                </div>

                <div className="p-2 bg-stone-50 rounded border border-stone-100 flex items-center justify-between">
                  <span className="text-stone-700">
                    Upper Glazing
                  </span>

                  <span className="font-bold text-stone-900">
                    {upperGlazing.pct}%
                  </span>
                </div>

                <div className="p-2 bg-stone-50 rounded border border-stone-100 flex items-center justify-between">
                  <span className="text-stone-700">
                    Ground Solid Facade
                  </span>

                  <span className="font-bold text-stone-900">
                    {gfSolidFacade.pct}%
                  </span>
                </div>

                <div className="p-2 bg-stone-50 rounded border border-stone-100 flex items-center justify-between">
                  <span className="text-stone-700">
                    Arcade Column
                  </span>

                  <span className="font-bold text-stone-900">
                    {arcadeColumn.pct}%
                  </span>
                </div>

                <div className="p-2 bg-stone-50 rounded border border-stone-100 flex items-center justify-between">
                  <span className="text-stone-700">
                    Arcade Soffit
                  </span>

                  <span className="font-bold text-stone-900">
                    {arcadeSoffit.pct}%
                  </span>
                </div>
              </div>

              <div className="mt-2 p-2 bg-amber-50/50 border border-amber-200 rounded flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-amber-900 uppercase font-bold block">
                    Perspective Sky Fraction
                  </span>

                  <span className="text-[10px] text-amber-800/80">
                    Sky pixels ({sky.count.toLocaleString()} px)
                    {' '}
                    / P_total_valid
                  </span>
                </div>

                <span className="text-sm font-bold text-amber-900 font-mono">
                  {sky.pct}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border-t border-amber-200 pt-2 px-2 pb-2 flex items-start gap-1.5 text-[10px] text-amber-900 font-sans">
            <LockKeyhole className="w-3.5 h-3.5 shrink-0 mt-0.5" />

            <p className="leading-snug">
              Perspective sky fraction is
              {' '}
              <strong>not true SVF</strong>
              {' '}
              and pixel proportions are
              {' '}
              <strong>not exact H/W</strong>.
              {' '}
              Both physical variables remain owned by GIS / calibrated
              geometric analysis.
            </p>
          </div>
        </div>

        {/* ===================================================================
            D. MICRO-SPATIAL AFFORDANCE
            =================================================================== */}

        <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 text-purple-800 rounded">
                  <Armchair className="w-4 h-4" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-stone-900 font-mono">
                    4. Micro-Spatial Affordance Evidence
                  </h3>

                  <span className="text-[10px] text-stone-400 font-mono">
                    Walking surface + potential stationary-use elements
                  </span>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-xs font-bold text-purple-900">
                  {pedGroundPct}%
                </span>

                <span className="text-[10px] text-stone-400 block">
                  Sidewalk Evidence
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="text-[11px] text-stone-500 font-semibold uppercase tracking-wider font-sans">
                Directly Detected Pedestrian / Affordance Elements
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-stone-50 rounded border border-stone-100 flex items-center justify-between">
                  <span className="text-stone-700">
                    Sidewalk
                  </span>

                  <span className="font-bold text-stone-900">
                    {sidewalk.pct}%
                  </span>
                </div>

                <div className="p-2 bg-stone-50 rounded border border-stone-100 flex items-center justify-between">
                  <span className="text-stone-700">
                    Stoop / Stair
                  </span>

                  <span className="font-bold text-stone-900">
                    {stoop.pct}%
                  </span>
                </div>

                <div className="p-2 bg-stone-50 rounded border border-stone-100 flex items-center justify-between">
                  <span className="text-stone-700">
                    Bench Seating
                  </span>

                  <span className="font-bold text-stone-900">
                    {bench.pct}%
                  </span>
                </div>

                <div className="p-2 bg-stone-50 rounded border border-stone-100 flex items-center justify-between">
                  <span className="text-stone-700">
                    Table &amp; Chair
                  </span>

                  <span className="font-bold text-stone-900">
                    {tableChair.pct}%
                  </span>
                </div>

                <div className="p-2 bg-stone-50 rounded border border-stone-100 flex items-center justify-between">
                  <span className="text-stone-700">
                    Planter
                  </span>

                  <span className="font-bold text-stone-900">
                    {planter.pct}%
                  </span>
                </div>

                <div className="p-2 bg-stone-50 rounded border border-stone-100 flex items-center justify-between">
                  <span className="text-stone-700">
                    Wall / Ledge
                  </span>

                  <span className="font-bold text-stone-900">
                    {wallLedge.pct}%
                  </span>
                </div>

                <div className="p-2 bg-stone-50 rounded border border-stone-100 flex items-center justify-between">
                  <span className="text-stone-700">
                    Parasol
                  </span>

                  <span className="font-bold text-stone-900">
                    {parasol.pct}%
                  </span>
                </div>

                <div className="p-2 bg-stone-50 rounded border border-stone-100 flex items-center justify-between">
                  <span className="text-stone-700">
                    Awning
                  </span>

                  <span className="font-bold text-stone-900">
                    {awning.pct}%
                  </span>
                </div>

                <div className="p-2 bg-stone-50 rounded border border-stone-100 flex items-center justify-between col-span-2">
                  <span className="text-stone-700">
                    Signboard
                  </span>

                  <span className="font-bold text-stone-900">
                    {signboard.pct}%
                  </span>
                </div>
              </div>

              <div className="mt-2 p-2.5 bg-purple-50/50 border border-purple-200 rounded">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-purple-900 uppercase font-bold block">
                      Potential Affordance Evidence
                    </span>

                    <span className="text-[10px] text-purple-800/80">
                      Furniture + planters + stoops + ledges
                    </span>
                  </div>

                  <span className="text-xs font-bold text-purple-900 font-mono">
                    {potentialAffordancePct}%
                  </span>
                </div>

                <div className="mt-2 pt-2 border-t border-purple-200 flex items-start gap-1.5">
                  <LockKeyhole className="w-3.5 h-3.5 text-purple-700 shrink-0 mt-0.5" />

                  <p className="text-[10px] text-purple-900 leading-relaxed">
                    Presence does not establish usability. A ledge may be too
                    narrow, obstructed or inaccessible; a stoop may not support
                    lingering. These pixels are evidence candidates for a later
                    VLM-assisted IAS rubric, not IAS itself.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-stone-50 border-t border-stone-100 pt-2 flex items-start gap-1.5 text-[10px] text-stone-500 font-sans">
            <Info className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />

            <p className="leading-snug">
              Static imagery provides physical affordance evidence only.
              Empirical t_base still requires temporal pedestrian observation.
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================================
          PAPER VARIABLE BRIDGE SUMMARY
          ===================================================================== */}

      <div className="bg-stone-900 text-white rounded-lg p-4">
        <div className="text-[10px] font-mono uppercase font-bold tracking-wider text-stone-300 mb-3">
          Evidence → Paper Variable Boundary
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[10px]">
          <div className="bg-stone-800 border border-stone-700 rounded p-3">
            <strong className="font-mono text-emerald-300 block mb-1">
              Vision Can Measure
            </strong>

            <span className="text-stone-300">
              Pixel presence, class fractions, candidate V_nat/V_built,
              frontage components and physical amenity evidence.
            </span>
          </div>

          <div className="bg-stone-800 border border-stone-700 rounded p-3">
            <strong className="font-mono text-indigo-300 block mb-1">
              VLM Must Contextualize
            </strong>

            <span className="text-stone-300">
              Whether glazing is actively permeable, whether ledges/stoops
              are usable, and how facade articulation functions spatially.
            </span>
          </div>

          <div className="bg-stone-800 border border-stone-700 rounded p-3">
            <strong className="font-mono text-sky-300 block mb-1">
              GIS / Other Owners
            </strong>

            <span className="text-stone-300">
              Exact H/W, true SVF, GWR coefficients and empirical pedestrian
              behavior remain outside pixel inference.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
