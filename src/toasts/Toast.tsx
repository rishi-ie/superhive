/**
 * Sonner toast container — renders the toast stack.
 * Place <Toast /> inside ToastProvider, near the root of your app.
 */
import { Toaster } from 'sonner';

export type ToastProps = {
  toasts?: Array<{ id: string; title: string; description?: string; type?: 'success' | 'error' | 'info' }>;
  onDismiss?: (id: string) => void;
};

/**
 * Sonner toaster — renders the global toast notification stack.
 * @param toasts - Ignored (sonner manages its own state internally)
 * @param onDismiss - Ignored (sonner provides its own dismiss via toast.dismiss())
 */
export function Toast(_props: ToastProps) {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'var(--card)',
          border: '1px solid var(--border)',
          color: 'var(--foreground)',
          fontSize: '12px',
        },
        className: 'gap-2',
      }}
    />
  );
}
