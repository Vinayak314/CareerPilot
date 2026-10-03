import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog: traps focus, closes on Escape/backdrop, restores focus to the
 * trigger on close and locks page scroll while open.
 */
const Modal = ({ open, onClose, title, description, children, footer, size = 'md', dismissible = true }) => {
  const panelRef = useRef(null);
  const titleId = useId();
  const descId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    const first = panel?.querySelector('[data-autofocus]') || panel?.querySelector(FOCUSABLE);
    (first || panel)?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && dismissible) {
        event.stopPropagation();
        onCloseRef.current?.();
      }
      if (event.key === 'Tab' && panel) {
        const nodes = [...panel.querySelectorAll(FOCUSABLE)];
        if (!nodes.length) return;
        const firstNode = nodes[0];
        const lastNode = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === firstNode) {
          event.preventDefault();
          lastNode.focus();
        } else if (!event.shiftKey && document.activeElement === lastNode) {
          event.preventDefault();
          firstNode.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open, dismissible]);

  if (!open) return null;

  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-[fadeIn_150ms_ease-out]"
        onClick={dismissible ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={`relative w-full ${widths[size]} bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col focus:outline-none`}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-bold text-slate-900">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-sm text-slate-500 mt-1">
                {description}
              </p>
            )}
          </div>
          {dismissible && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 -mr-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap justify-end gap-3">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
