import { AlertTriangle, RotateCw, Inbox } from 'lucide-react';
import Button from './Button';

export const Card = ({ as: Component = 'div', className = '', padded = true, children, ...rest }) => (
  <Component className={`bg-white border border-slate-200 rounded-xl ${padded ? 'p-5 sm:p-6' : ''} ${className}`} {...rest}>
    {children}
  </Component>
);

export const PageHeader = ({ eyebrow, title, description, actions, className = '' }) => (
  <header className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8 ${className}`}>
    <div className="min-w-0">
      {eyebrow && (
        <div className="text-xs font-bold text-teal-700 uppercase tracking-widest mb-2 flex flex-wrap items-center gap-2">
          {eyebrow}
        </div>
      )}
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight break-words">{title}</h1>
      {description && <p className="text-slate-500 mt-2 text-sm sm:text-base max-w-2xl">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-3 sm:justify-end flex-shrink-0">{actions}</div>}
  </header>
);

export const Skeleton = ({ className = '' }) => <div className={`skeleton rounded-md ${className}`} aria-hidden="true" />;

export const LoadingState = ({ label = 'Loading…', rows = 3, className = '' }) => (
  <div role="status" aria-live="polite" className={`space-y-4 ${className}`}>
    <span className="sr-only">{label}</span>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 flex gap-5">
        <Skeleton className="w-14 h-14 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

export const EmptyState = ({ icon: Icon = Inbox, title, description, action, className = '' }) => (
  <div
    className={`flex flex-col items-center text-center px-6 py-14 bg-slate-50/60 border border-dashed border-slate-300 rounded-xl ${className}`}
  >
    <div className="w-14 h-14 rounded-full bg-white shadow-sm ring-1 ring-slate-200 flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-teal-700" aria-hidden="true" />
    </div>
    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    {description && <p className="text-sm text-slate-500 mt-1.5 max-w-md">{description}</p>}
    {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
  </div>
);

export const ErrorState = ({ title = 'Couldn’t load this page', message, onRetry, retrying, className = '' }) => (
  <div role="alert" className={`flex flex-col items-center text-center px-6 py-14 bg-red-50/40 border border-red-200 rounded-xl ${className}`}>
    <div className="w-14 h-14 rounded-full bg-white shadow-sm ring-1 ring-red-200 flex items-center justify-center mb-4">
      <AlertTriangle className="w-6 h-6 text-red-600" aria-hidden="true" />
    </div>
    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    {message && <p className="text-sm text-slate-600 mt-1.5 max-w-md">{message}</p>}
    {onRetry && (
      <Button variant="secondary" icon={RotateCw} className="mt-6" onClick={onRetry} loading={retrying}>
        Try again
      </Button>
    )}
  </div>
);

/** Inline banner for form-level errors and notices. */
export const Alert = ({ tone = 'error', title, children, action, className = '' }) => {
  const tones = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    info: 'bg-teal-50 border-teal-200 text-teal-900',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  };
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`border rounded-lg px-4 py-3 text-sm ${tones[tone]} ${className}`}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={title ? 'mt-0.5' : ''}>{children}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};
