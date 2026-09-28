/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Binary, Info } from 'lucide-react';
import { ResearchSectionHeader } from './ResearchSectionHeader';
import { StatusBadge } from './StatusBadge';
import { V33PixelMeasurementResult, V33TaxonomyStatus, V33SegmentationTaxonomy } from '../types';

interface QuantitativeMeasurementsPanelProps {
  pixelMeasurements: V33PixelMeasurementResult | null;
  taxonomy: V33SegmentationTaxonomy | null;
  taxonomyStatus: V33TaxonomyStatus;
}

interface QuantitativeRowConfig {
  id: string;
  name: string;
  variable: string;
  getValue: (pm: V33PixelMeasurementResult | null) => string;
  getStatus: (pm: V33PixelMeasurementResult | null, ts: V33TaxonomyStatus) => {
    badgeStatus: string;
    label: string;
  };
  source: string;
  method: string;
  formula?: string;
  roi?: string;
  notes?: string;
}

export const QuantitativeMeasurementsPanel: React.FC<QuantitativeMeasurementsPanelProps> = ({
  pixelMeasurements,
  taxonomyStatus,
}) => {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  const rows: QuantitativeRowConfig[] = [
    {
      id: 'natural_above_ground',
      name: 'Natural Above-Ground',
      variable: 'P_natural_above_ground',
      getValue: (pm) => {
        const val = pm?.group_measurements?.P_natural_above_ground;
        const total = pm?.coverage?.valid_pixel_count;
        if (val == null) return '—';
        const pctStr = total && total > 0 ? ` (${((val / total) * 100).toFixed(2)}%)` : '';
        return `${val.toLocaleString()} px${pctStr}`;
      },
      getStatus: (pm, ts) => {
        if (pm?.group_measurements?.P_natural_above_ground != null) {
          return { badgeStatus: 'pass', label: 'EXECUTED' };
        }
        return { badgeStatus: 'pending', label: ts === 'configured' ? 'NO CLASS MAPPED' : 'TAXONOMY REQUIRED' };
      },
      source: 'Pixel Classification Raster Scan (Step 6 Engine)',
      method: 'Exact raster accounting over primary segmentation map at native resolution excluding transparent pixels.',
      formula: 'P_natural_above_ground = ∑ (P_i) for classes in natural_above_ground research group',
      roi: 'Full analytical frame (excluding alpha=0)',
      notes: 'Requires documented segmentation taxonomy assigning vegetation classes to natural_above_ground group.'
    },
    {
      id: 'built_above_ground',
      name: 'Built Above-Ground',
      variable: 'P_built_above_ground',
      getValue: (pm) => {
        const val = pm?.group_measurements?.P_built_above_ground;
        const total = pm?.coverage?.valid_pixel_count;
        if (val == null) return '—';
        const pctStr = total && total > 0 ? ` (${((val / total) * 100).toFixed(2)}%)` : '';
        return `${val.toLocaleString()} px${pctStr}`;
      },
      getStatus: (pm, ts) => {
        if (pm?.group_measurements?.P_built_above_ground != null) {
          return { badgeStatus: 'pass', label: 'EXECUTED' };
        }
        return { badgeStatus: 'pending', label: ts === 'configured' ? 'NO CLASS MAPPED' : 'TAXONOMY REQUIRED' };
      },
      source: 'Pixel Classification Raster Scan (Step 6 Engine)',
      method: 'Exact raster accounting of structural building mass and man-made enclosure surfaces.',
      formula: 'P_built_above_ground = ∑ (P_i) for classes in built_above_ground research group',
      roi: 'Full analytical frame (excluding alpha=0)',
      notes: 'Aggregates building facades, fences, walls, and structural elements.'
    },
    {
      id: 'natural_built_ratio',
      name: 'Natural / Built Ratio',
      variable: 'natural_built_above_ground_ratio',
      getValue: (pm) => {
        const ratio = pm?.derived_metrics?.natural_built_above_ground_ratio?.value;
        if (ratio == null) return '—';
        return ratio.toFixed(4);
      },
      getStatus: (pm, ts) => {
        const status = pm?.derived_metrics?.natural_built_above_ground_ratio?.status;
        if (status === 'computed') return { badgeStatus: 'pass', label: 'EXECUTED' };
        if (status === 'undefined_zero_denominator') return { badgeStatus: 'review', label: 'ZERO DENOMINATOR' };
        return { badgeStatus: 'pending', label: ts === 'configured' ? 'PENDING CALCULATION' : 'TAXONOMY REQUIRED' };
      },
      source: 'Deterministic Metric Synthesis',
      method: 'Deterministic ratio calculation with zero-denominator safeguarding.',
      formula: 'Ratio = P_natural_above_ground / P_built_above_ground',
      roi: 'Aggregated analytical groups',
      notes: 'Direct quantitative input planned for Place Imageability synthesis.'
    },
    {
      id: 'vegetation_pixels',
      name: 'Vegetation Pixels',
      variable: 'P_vegetation',
      getValue: (pm) => {
        const val = pm?.group_measurements?.P_vegetation;
        const total = pm?.coverage?.valid_pixel_count;
        if (val == null) return '—';
        const pctStr = total && total > 0 ? ` (${((val / total) * 100).toFixed(2)}%)` : '';
        return `${val.toLocaleString()} px${pctStr}`;
      },
      getStatus: (pm, ts) => {
        if (pm?.status === 'computed' && pm?.group_measurements?.P_vegetation != null) {
          return { badgeStatus: 'pass', label: 'EXECUTED' };
        }
        return { badgeStatus: 'pending', label: ts === 'configured' ? 'NO CLASS MAPPED' : 'TAXONOMY REQUIRED' };
      },
      source: 'Pixel Classification Raster Scan',
      method: 'Exact class-level pixel summation based on configured exact RGB values.',
      formula: 'P_vegetation = Count(pixels where RGB == exact_rgb[vegetation])',
      roi: 'Full analytical frame'
    },
    {
      id: 'sidewalk',
      name: 'Sidewalk',
      variable: 'P_sidewalk',
      getValue: (pm) => {
        const val = pm?.group_measurements?.P_sidewalk;
        const total = pm?.coverage?.valid_pixel_count;
        if (val == null) return '—';
        const pctStr = total && total > 0 ? ` (${((val / total) * 100).toFixed(2)}%)` : '';
        return `${val.toLocaleString()} px${pctStr}`;
      },
      getStatus: (pm, ts) => {
        if (pm?.status === 'computed' && pm?.group_measurements?.P_sidewalk != null) {
          return { badgeStatus: 'pass', label: 'EXECUTED' };
        }
        return { badgeStatus: 'pending', label: ts === 'configured' ? 'NO CLASS MAPPED' : 'TAXONOMY REQUIRED' };
      },
      source: 'Pixel Classification Raster Scan',
      method: 'Dedicated pedestrian sidewalk pavement raster accounting.',
      formula: 'P_sidewalk = Count(pixels where RGB == exact_rgb[sidewalk])',
      roi: 'Ground plane'
    },
    {
      id: 'paver',
      name: 'Paver',
      variable: 'P_paver',
      getValue: (pm) => {
        const val = pm?.group_measurements?.P_paver;
        const total = pm?.coverage?.valid_pixel_count;
        if (val == null) return '—';
        const pctStr = total && total > 0 ? ` (${((val / total) * 100).toFixed(2)}%)` : '';
        return `${val.toLocaleString()} px${pctStr}`;
      },
      getStatus: (pm, ts) => {
        if (pm?.status === 'computed' && pm?.group_measurements?.P_paver != null) {
          return { badgeStatus: 'pass', label: 'EXECUTED' };
        }
        return { badgeStatus: 'pending', label: ts === 'configured' ? 'NO CLASS MAPPED' : 'TAXONOMY REQUIRED' };
      },
      source: 'Pixel Classification Raster Scan',
      method: 'Decorative and tactile paver surface pixel accounting.',
      formula: 'P_paver = Count(pixels where RGB == exact_rgb[paver])',
      roi: 'Ground plane'
    },
    {
      id: 'sidewalk_paver_ratio',
      name: 'Sidewalk + Paver Ratio',
      variable: 'sidewalk_paver_ratio',
      getValue: (pm) => {
        const val = pm?.derived_metrics?.sidewalk_paver_ratio?.value;
        if (val == null) return '—';
        return `${(val * 100).toFixed(2)}%`;
      },
      getStatus: (pm, ts) => {
        if (pm?.derived_metrics?.sidewalk_paver_ratio?.status === 'computed') {
          return { badgeStatus: 'pass', label: 'EXECUTED' };
        }
        return { badgeStatus: 'pending', label: ts === 'configured' ? 'PENDING CALCULATION' : 'TAXONOMY REQUIRED' };
      },
      source: 'Deterministic Metric Synthesis',
      method: 'Combined pedestrian walkway coverage divided by total valid frame pixels.',
      formula: '(P_sidewalk + P_paver) / P_total',
      roi: 'Full analytical frame'
    },
    {
      id: 'signboard',
      name: 'Signboard',
      variable: 'P_signboard',
      getValue: (pm) => {
        const val = pm?.group_measurements?.P_signboard;
        const total = pm?.coverage?.valid_pixel_count;
        if (val == null) return '—';
        const pctStr = total && total > 0 ? ` (${((val / total) * 100).toFixed(2)}%)` : '';
        return `${val.toLocaleString()} px${pctStr}`;
      },
      getStatus: (pm, ts) => {
        if (pm?.status === 'computed' && pm?.group_measurements?.P_signboard != null) {
          return { badgeStatus: 'pass', label: 'EXECUTED' };
        }
        return { badgeStatus: 'pending', label: ts === 'configured' ? 'NO CLASS MAPPED' : 'TAXONOMY REQUIRED' };
      },
      source: 'Pixel Classification Raster Scan',
      method: 'Commercial signage and information signboard pixel accounting.',
      formula: 'P_signboard = Count(pixels where RGB == exact_rgb[signboard])',
      roi: 'Facade / street interface'
    },
    {
      id: 'architectural_detail',
      name: 'Architectural Detail',
      variable: 'P_architectural_detail',
      getValue: (pm) => {
        const val = pm?.group_measurements?.P_architectural_detail;
        const total = pm?.coverage?.valid_pixel_count;
        if (val == null) return '—';
        const pctStr = total && total > 0 ? ` (${((val / total) * 100).toFixed(2)}%)` : '';
        return `${val.toLocaleString()} px${pctStr}`;
      },
      getStatus: (pm, ts) => {
        if (pm?.status === 'computed' && pm?.group_measurements?.P_architectural_detail != null) {
          return { badgeStatus: 'pass', label: 'EXECUTED' };
        }
        return { badgeStatus: 'pending', label: ts === 'configured' ? 'NO CLASS MAPPED' : 'TAXONOMY REQUIRED' };
      },
      source: 'Pixel Classification Raster Scan',
      method: 'High-frequency architectural moldings, cornices, window tracery, and articulation.',
      formula: 'P_architectural_detail = Count(pixels where RGB == exact_rgb[architectural_detail])',
      roi: 'Facade surfaces'
    },
    {
      id: 'signboard_detail_ratio',
      name: 'Signboard + Detail Ratio',
      variable: 'signboard_detail_ratio',
      getValue: (pm) => {
        const val = pm?.derived_metrics?.signboard_detail_ratio?.value;
        if (val == null) return '—';
        return `${(val * 100).toFixed(2)}%`;
      },
      getStatus: (pm, ts) => {
        if (pm?.derived_metrics?.signboard_detail_ratio?.status === 'computed') {
          return { badgeStatus: 'pass', label: 'EXECUTED' };
        }
        return { badgeStatus: 'pending', label: ts === 'configured' ? 'PENDING CALCULATION' : 'TAXONOMY REQUIRED' };
      },
      source: 'Deterministic Metric Synthesis',
      method: 'Combined articulation metric dividing signboard and architectural details by building mass.',
      formula: '(P_signboard + P_architectural_detail) / P_built_above_ground',
      roi: 'Facade surfaces'
    },
    {
      id: 'gvi_eye',
      name: 'Eye-Level GVI',
      variable: 'GVI_eye (Quantitative ROI)',
      getValue: () => '—',
      getStatus: () => ({ badgeStatus: 'pending', label: 'PENDING DEFINITION' }),
      source: 'Eye-Level Horizontal Band ROI (Future Spec)',
      method: 'Deterministic pixel summation restricted to horizontal eye-level pedestrian band (y1..y2).',
      formula: 'GVI_eye = (P_veg_eye / P_total_eye) * 100',
      roi: 'Pending formal specification of eye-level vertical bounding box coordinates.',
      notes: 'Distinguished from full-frame greenness; will be activated upon formal horizontal band consensus.'
    },
    {
      id: 'street_canyon_hw',
      name: 'Street Canyon H/W',
      variable: 'street_canyon_hw',
      getValue: () => '—',
      getStatus: () => ({ badgeStatus: 'pending', label: 'EXTERNAL GEOMETRY REQUIRED' }),
      source: 'External GIS / 3D Building Geometry (Not supplied)',
      method: 'True orthogonal building height divided by street right-of-way width from vector GIS layers.',
      formula: 'H/W = Building_Height_meters / Street_Width_meters',
      roi: 'Urban street section',
      notes: 'Owned strictly by GIS / 3D CAD data; language models are forbidden from estimating exact values.'
    },
    {
      id: 'svf',
      name: 'Sky View Fraction',
      variable: 'SVF',
      getValue: () => '—',
      getStatus: () => ({ badgeStatus: 'pending', label: 'EXTERNAL GEOMETRY REQUIRED' }),
      source: 'Fisheye Hemispherical Photometry / 3D DSM Vector Raycasting',
      method: 'Solid angle sky visibility fraction calculated across complete upper hemisphere.',
      formula: 'SVF = 1 / (2π) ∫∫ sky_visible(θ, φ) cos(θ) sin(θ) dθ dφ',
      roi: 'Hemispherical zenith projection',
      notes: 'Requires fisheye projection or DSM raycasting; not computed from standard single-perspective photo.'
    },
  ];

  return (
    <section className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
      <ResearchSectionHeader
        title="Quantitative Measurements"
        subtitle="Deterministic measurements derived from segmentation or external geometry sources."
        icon={Binary}
      />

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50/80 text-[11px] font-mono text-stone-500 uppercase tracking-wider">
              <th className="py-2.5 px-3 font-semibold">Metric</th>
              <th className="py-2.5 px-3 font-semibold">Value</th>
              <th className="py-2.5 px-3 font-semibold">Status</th>
              <th className="py-2.5 px-3 font-semibold">Source</th>
              <th className="py-2.5 px-2 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-xs">
            {rows.map((row) => {
              const valueStr = row.getValue(pixelMeasurements);
              const statusInfo = row.getStatus(pixelMeasurements, taxonomyStatus);
              const isExpanded = expandedRowId === row.id;

              return (
                <React.Fragment key={row.id}>
                  <tr className={`hover:bg-stone-50/60 transition-colors ${isExpanded ? 'bg-stone-50/80' : ''}`}>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-stone-900 font-sans">{row.name}</div>
                      <div className="font-mono text-[10px] text-stone-400">{row.variable}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-stone-900">
                      {valueStr}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={statusInfo.badgeStatus} label={statusInfo.label} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-stone-600 font-sans text-[11px]">
                      {row.source}
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <button
                        onClick={() => toggleRow(row.id)}
                        className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded transition-colors"
                        title="View Metric Methodology & Provenance Details"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>

                  {/* Expandable Provenance Row */}
                  {isExpanded && (
                    <tr className="bg-stone-50 border-b border-stone-200">
                      <td colSpan={5} className="p-3.5 text-xs text-stone-700 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white border border-stone-200 rounded p-3">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-stone-500 uppercase block mb-0.5">
                              Calculation Method:
                            </span>
                            <p className="leading-relaxed text-stone-800">{row.method}</p>
                          </div>

                          {row.formula && (
                            <div>
                              <span className="text-[10px] font-mono font-bold text-stone-500 uppercase block mb-0.5">
                                Formal Definition / Formula:
                              </span>
                              <p className="font-mono text-[11px] bg-stone-50 p-1.5 rounded border border-stone-200 text-stone-800">
                                {row.formula}
                              </p>
                            </div>
                          )}

                          {row.roi && (
                            <div>
                              <span className="text-[10px] font-mono font-bold text-stone-500 uppercase block mb-0.5">
                                Analysis ROI:
                              </span>
                              <p className="font-mono text-[11px] text-stone-700">{row.roi}</p>
                            </div>
                          )}

                          {row.notes && (
                            <div>
                              <span className="text-[10px] font-mono font-bold text-stone-500 uppercase block mb-0.5">
                                Research Notes & Governance:
                              </span>
                              <p className="text-[11px] text-stone-600 leading-relaxed">{row.notes}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
