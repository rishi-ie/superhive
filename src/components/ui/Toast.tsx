/**
 * Toast notification component — renders a stack of ephemeral toasts.
 */
import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { STROKE_WIDTH, TOAST_DURATION_MS } from '@/lib/constants';

export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'info';
};

type ToastProps = {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
};

const ICONS = {
  success: <CheckCircle size={14} strokeWidth={STROKE_WIDTH} className="text-chart-2 shrink-0" />,
  error: <XCircle size={14} strokeWidth={STROKE_WIDTH} className="text-chart-5 shrink-0" />,
  info: <Info size={14} strokeWidth={STROKE_WIDTH} className="text-chart-1 shrink-0" />,
};

function ToastItem({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 bg-card border border-border/40 rounded-lg shadow-lg px-3 py-2.5 min-w-64 max-w-80 pointer-events-auto animate-toast-in"
    >
      <span className="mt-0.5">{ICONS[toast.type ?? 'info']}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground leading-snug">{toast.title}</p>
        {toast.description && (
          <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
      >
        <X size={12} strokeWidth={STROKE_WIDTH} />
      </button>
    </div>
  );
}

/**
 * Toast notification component.
 * @param toasts - Array of toast items to display
 * @param onDismiss - Called when a toast's dismiss button is clicked
 */
export function Toast({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      role="status"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
