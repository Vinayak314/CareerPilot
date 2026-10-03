import { X, AlertCircle, Check, Plus } from 'lucide-react';
import { scoreLevel } from '../../lib/format';

const SEVERITY = {
  critical: { classes: 'bg-red-50 text-red-800 ring-red-200', Icon: X, sr: 'Critical gap' },
  warning: { classes: 'bg-amber-50 text-amber-800 ring-amber-200', Icon: AlertCircle, sr: 'Warning' },
  success: { classes: 'bg-emerald-50 text-emerald-800 ring-emerald-200', Icon: Check, sr: 'Matched' },
  neutral: { classes: 'bg-slate-100 text-slate-700 ring-slate-200', Icon: null, sr: '' },
  brand: { classes: 'bg-teal-50 text-teal-800 ring-teal-200', Icon: null, sr: '' },
  added: { classes: 'bg-emerald-50 text-emerald-800 ring-emerald-200', Icon: Plus, sr: 'Added keyword' },
};

/**
 * Severity chip from the design system. Each severity carries an icon and a
 * screen-reader prefix so meaning doesn't rely on colour.
 */
export const SeverityTag = ({ severity = 'neutral', children, size = 'md', className = '' }) => {
  const { classes, Icon, sr } = SEVERITY[severity] || SEVERITY.neutral;
  const sizing = size === 'sm' ? 'text-xs px-2 py-0.5 gap-1' : 'text-sm px-3 py-1.5 gap-1.5';
  return (
    <span
      className={`inline-flex items-center rounded-md font-medium ring-1 ring-inset max-w-full ${sizing} ${classes} ${className}`}
    >
      {Icon && <Icon className={size === 'sm' ? 'w-3 h-3 flex-shrink-0' : 'w-3.5 h-3.5 flex-shrink-0'} strokeWidth={2.5} aria-hidden="true" />}
      {sr && <span className="sr-only">{sr}: </span>}
      <span className="break-words min-w-0">{children}</span>
    </span>
  );
};

const FIT_CLASSES = {
  good: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  fair: 'bg-amber-50 text-amber-800 ring-amber-200',
  poor: 'bg-red-50 text-red-700 ring-red-200',
};

/** Compact "88% FIT" badge used on tracker cards and resume rows. */
export const FitBadge = ({ score, className = '' }) => {
  const level = scoreLevel(score);
  if (level === 'none') return null;
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset whitespace-nowrap ${FIT_CLASSES[level]} ${className}`}
    >
      {score}% fit
    </span>
  );
};

/** Category / difficulty label used in interview prep. */
export const Label = ({ tone = 'neutral', children, className = '' }) => {
  const tones = {
    neutral: 'bg-slate-100 text-slate-700',
    easy: 'bg-emerald-50 text-emerald-800',
    medium: 'bg-amber-50 text-amber-800',
    hard: 'bg-red-50 text-red-800',
    brand: 'bg-teal-50 text-teal-800',
  };
  return (
    <span className={`inline-flex items-center rounded px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${tones[tone] || tones.neutral} ${className}`}>
      {children}
    </span>
  );
};
