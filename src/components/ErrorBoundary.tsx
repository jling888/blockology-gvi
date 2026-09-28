/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-xl p-5 my-4 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-mono font-bold text-sm text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            <span>{this.props.fallbackTitle || 'Result presentation error — raw candidate data remains available.'}</span>
          </div>
          <p className="font-sans text-amber-800 leading-relaxed">
            A rendering issue occurred in this presentation panel. The candidate evaluation results and raw JSON remain intact in the Method & Diagnostics panel.
          </p>
          {this.state.error?.message && (
            <p className="font-mono text-[11px] text-amber-700 bg-amber-100/70 p-2 rounded border border-amber-200">
              {this.state.error.message}
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
