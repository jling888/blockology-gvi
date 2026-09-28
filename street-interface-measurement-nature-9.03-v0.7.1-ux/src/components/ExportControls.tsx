/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileImage, FileText, Loader2 } from 'lucide-react';
import { exportEvaluationToCsv, exportElementAsPng, exportElementAsPdf } from '../utils/exportUtils';
import { VlmStreetscapeEvaluationV31, MechanicalAuditResult } from '../types';

interface ExportControlsProps {
  evaluation: VlmStreetscapeEvaluationV31;
  mechanicalAudit: MechanicalAuditResult;
  reportElementId: string;
}

export const ExportControls: React.FC<ExportControlsProps> = ({
  evaluation,
  mechanicalAudit,
  reportElementId
}) => {
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportCsv = () => {
    exportEvaluationToCsv(
      evaluation,
      mechanicalAudit,
      `vlm_streetscape_${evaluation.image_id || 'case'}_dataset.csv`
    );
  };

  const handleExportPng = async () => {
    try {
      setIsExportingPng(true);
      await exportElementAsPng(
        reportElementId,
        `vlm_streetscape_${evaluation.image_id || 'case'}_report.png`
      );
    } catch (err) {
      console.error('PNG export failed:', err);
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      await exportElementAsPdf(
        reportElementId,
        `vlm_streetscape_${evaluation.image_id || 'case'}_report.pdf`
      );
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <section className="bg-stone-900 text-stone-100 border border-stone-800 rounded-lg p-5 shadow-xs">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold font-mono text-white uppercase tracking-tight flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-400" />
            <span>RESEARCH DATA & REPORT EXPORT</span>
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Export standardized flattened dataset rows or academic publication report layouts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* CSV Export */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-100 font-mono text-xs rounded border border-stone-700 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          {/* PNG Export */}
          <button
            onClick={handleExportPng}
            disabled={isExportingPng}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-100 font-mono text-xs rounded border border-stone-700 transition-colors disabled:opacity-50"
          >
            {isExportingPng ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
            ) : (
              <FileImage className="w-3.5 h-3.5 text-sky-400" />
            )}
            <span>Export Report as PNG</span>
          </button>

          {/* PDF Export */}
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-mono text-xs font-semibold rounded transition-colors shadow-xs disabled:opacity-50"
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-white" />
            )}
            <span>Export Report as PDF</span>
          </button>
        </div>
      </div>
    </section>
  );
};
