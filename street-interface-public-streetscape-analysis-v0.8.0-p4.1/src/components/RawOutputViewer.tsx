/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Download, Copy, Check } from 'lucide-react';
import { downloadJsonFile } from '../utils/exportUtils';
import { VlmStreetscapeEvaluationV31 } from '../types';

interface RawOutputViewerProps {
  evaluation: VlmStreetscapeEvaluationV31;
  rawResponseText: string;
}

export const RawOutputViewer: React.FC<RawOutputViewerProps> = ({
  evaluation,
  rawResponseText
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const formattedJson = rawResponseText
    ? (function() {
        try {
          return JSON.stringify(JSON.parse(rawResponseText), null, 2);
        } catch {
          return rawResponseText;
        }
      })()
    : JSON.stringify(evaluation, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadJsonFile(
      JSON.parse(formattedJson),
      `vlm_streetscape_${evaluation.image_id || 'evaluation'}_raw.json`
    );
  };

  return (
    <section className="bg-white border border-stone-200 rounded-lg shadow-xs overflow-hidden">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-stone-50 transition-colors select-none"
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-stone-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-stone-500" />
          )}
          <h3 className="text-sm font-bold font-mono text-stone-900 uppercase tracking-tight">
            RAW STRUCTURED OUTPUT (JSON)
          </h3>
        </div>
        <span className="text-xs font-mono text-stone-400">
          {isOpen ? 'Click to collapse' : 'Click to expand'}
        </span>
      </div>

      {isOpen && (
        <div className="border-t border-stone-200 p-4 bg-stone-950 text-stone-100 font-mono text-xs">
          <div className="flex items-center justify-end gap-2 pb-3 mb-3 border-b border-stone-800">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-xs transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON</span>
            </button>
          </div>

          <pre className="overflow-x-auto max-h-96 text-[11px] leading-relaxed text-emerald-300">
            {formattedJson}
          </pre>
        </div>
      )}
    </section>
  );
};
