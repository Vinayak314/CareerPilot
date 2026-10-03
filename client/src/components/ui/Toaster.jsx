import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import useToastStore from '../../store/toastStore';

const STYLES = {
  success: { Icon: CheckCircle2, icon: 'text-emerald-600', bar: 'bg-emerald-500' },
  error: { Icon: AlertTriangle, icon: 'text-red-600', bar: 'bg-red-500' },
  info: { Icon: Info, icon: 'text-teal-700', bar: 'bg-teal-600' },
};

/** Renders queued toasts in a polite live region (errors are assertive). */
const Toaster = () => {
  const { toasts, dismiss } = useToastStore();
  return (
    <div className="fixed z-[60] bottom-4 right-4 left-4 sm:left-auto sm:w-96 flex flex-col gap-2 pointer-events-none">
      <div aria-live="polite" className="contents">
        {toasts
          .filter((t) => t.type !== 'error')
          .map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
          ))}
      </div>
      <div aria-live="assertive" className="contents">
        {toasts
          .filter((t) => t.type === 'error')
          .map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
          ))}
      </div>
    </div>
  );
};

const ToastItem = ({ toast, onDismiss }) => {
  const { Icon, icon, bar } = STYLES[toast.type] || STYLES.info;
  return (
    <div className="pointer-events-auto relative overflow-hidden bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-900/10 pl-4 pr-10 py-3 flex items-start gap-3 animate-[toastIn_200ms_ease-out]">
      <span className={`absolute left-0 top-0 bottom-0 w-1 ${bar}`} aria-hidden="true" />
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${icon}`} aria-hidden="true" />
      <div className="text-sm min-w-0">
        {toast.title && <p className="font-semibold text-slate-900">{toast.title}</p>}
        <p className="text-slate-600">{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="absolute top-2.5 right-2.5 p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
};

export default Toaster;
