import { useId } from 'react';
import { AlertCircle } from 'lucide-react';

const baseInput =
  'block w-full rounded-lg border bg-white text-slate-900 placeholder-slate-400 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 disabled:bg-slate-50 disabled:text-slate-500';

const borderFor = (error) => (error ? 'border-red-400 focus:ring-red-500/30 focus:border-red-500' : 'border-slate-200 hover:border-slate-300');

/** Shared label / hint / error wrapper. Wires aria-describedby and aria-invalid for the control. */
const Field = ({ label, hint, error, required, id, children, className = '', labelClassName = '' }) => {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className={`block text-sm font-semibold text-slate-800 mb-1.5 ${labelClassName}`}>
          {label}
          {required && (
            <span className="text-red-600 ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children({ describedBy, invalid: Boolean(error) })}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      )}
      <div aria-live="polite">
        {error && (
          <p id={errorId} className="mt-1.5 text-xs font-medium text-red-700 flex items-start gap-1">
            <AlertCircle className="w-3.5 h-3.5 mt-px flex-shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export const TextField = ({
  label,
  hint,
  error,
  required,
  icon: Icon,
  trailing,
  className,
  inputClassName = '',
  id: idProp,
  ...inputProps
}) => {
  const autoId = useId();
  const id = idProp || autoId;
  return (
    <Field label={label} hint={hint} error={error} required={required} id={id} className={className}>
      {({ describedBy, invalid }) => (
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
            </div>
          )}
          <input
            id={id}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            aria-required={required || undefined}
            className={`${baseInput} ${borderFor(error)} ${Icon ? 'pl-9' : 'pl-3.5'} ${trailing ? 'pr-11' : 'pr-3.5'} py-2.5 ${inputClassName}`}
            {...inputProps}
          />
          {trailing && <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">{trailing}</div>}
        </div>
      )}
    </Field>
  );
};

export const TextArea = ({ label, hint, error, required, className, inputClassName = '', id: idProp, ...props }) => {
  const autoId = useId();
  const id = idProp || autoId;
  return (
    <Field label={label} hint={hint} error={error} required={required} id={id} className={className}>
      {({ describedBy, invalid }) => (
        <textarea
          id={id}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          className={`${baseInput} ${borderFor(error)} px-3.5 py-3 resize-y leading-relaxed ${inputClassName}`}
          {...props}
        />
      )}
    </Field>
  );
};

export const SelectField = ({ label, hint, error, required, className, inputClassName = '', id: idProp, children, ...props }) => {
  const autoId = useId();
  const id = idProp || autoId;
  return (
    <Field label={label} hint={hint} error={error} required={required} id={id} className={className}>
      {({ describedBy, invalid }) => (
        <select
          id={id}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={`${baseInput} ${borderFor(error)} px-3 py-2.5 pr-8 ${inputClassName}`}
          {...props}
        >
          {children}
        </select>
      )}
    </Field>
  );
};

/** Accessible on/off switch. */
export const Toggle = ({ checked, onChange, label, description, disabled, id: idProp }) => {
  const autoId = useId();
  const id = idProp || autoId;
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="min-w-0">
        <label htmlFor={id} className="block text-sm font-semibold text-slate-900 cursor-pointer">
          {label}
        </label>
        {description && (
          <p id={`${id}-desc`} className="text-xs text-slate-500 mt-0.5">
            {description}
          </p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? `${id}-desc` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
          checked ? 'bg-teal-700' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};
