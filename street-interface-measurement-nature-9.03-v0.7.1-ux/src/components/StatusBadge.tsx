/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Info,
  Minus
} from 'lucide-react';

export type StatusBadgeVariant =
  | 'pass'
  | 'review'
  | 'pending'
  | 'error'
  | 'info'
  | 'neutral'
  | 'configured'
  | 'not_configured';

interface StatusBadgeProps {
  status: StatusBadgeVariant | string;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  className = '',
  size = 'sm',
  showIcon = true,
}) => {
  const normalized = status.toLowerCase();

  let badgeStyle = 'bg-stone-100 text-stone-700 border-stone-200';
  let IconComponent = Minus;
  let defaultText = label || status;

  if (normalized === 'pass' || normalized === 'validated' || normalized === 'validated pass' || normalized === 'completed' || normalized === 'executed' || normalized === 'configured') {
    badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    IconComponent = CheckCircle2;
    defaultText = label || (normalized === 'configured' ? 'CONFIGURED' : 'PASS');
  } else if (normalized === 'review' || normalized === 'review required' || normalized === 'pending' || normalized === 'pending specification' || normalized === 'pending definition' || normalized === 'taxonomy required' || normalized === 'not_configured' || normalized === 'not configured') {
    badgeStyle = 'bg-amber-50 text-amber-900 border-amber-300';
    IconComponent = normalized.includes('pending') ? Clock : AlertTriangle;
    defaultText = label || (normalized === 'not_configured' || normalized === 'not configured' ? 'NOT CONFIGURED' : normalized.includes('pending') ? 'PENDING' : 'REVIEW REQUIRED');
  } else if (normalized === 'error' || normalized === 'invalid' || normalized === 'fail' || normalized === 'failed') {
    badgeStyle = 'bg-rose-50 text-rose-900 border-rose-300';
    IconComponent = XCircle;
    defaultText = label || 'INVALID';
  } else if (normalized === 'info' || normalized === 'primary' || normalized === 'secondary') {
    badgeStyle = 'bg-sky-50 text-sky-900 border-sky-300';
    IconComponent = Info;
    defaultText = label || status.toUpperCase();
  }

  const sizeClasses = size === 'md'
    ? 'px-2.5 py-1 text-xs gap-1.5 font-semibold'
    : 'px-2 py-0.5 text-[11px] gap-1 font-medium';

  return (
    <span
      className={`inline-flex items-center rounded-md border font-mono tracking-tight uppercase select-none ${sizeClasses} ${badgeStyle} ${className}`}
    >
      {showIcon && <IconComponent className={size === 'md' ? 'w-3.5 h-3.5 shrink-0' : 'w-3 h-3 shrink-0'} />}
      <span>{defaultText}</span>
    </span>
  );
};
