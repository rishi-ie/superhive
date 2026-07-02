/**
 * Toast context and hook for ephemeral in-app notifications.
 * Internally uses sonner for accessible, customizable toast notifications.
 */
import { createContext, useContext, type ReactNode } from 'react';
import { toast as sonnerToast } from 'sonner';
import { Toast } from '@/toasts/Toast';

type ToastType = 'success' | 'error' | 'info';

type ToastOptions = {
  title: string;
  description?: string;
  type?: ToastType;
};

interface ToastContextValue {
  toast: (opts: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

/**
 * @param children - App content wrapped by the toast context
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = (opts: ToastOptions) => {
    const { title, description, type } = opts;
    if (type === 'success') {
      sonnerToast.success(title, { description });
    } else if (type === 'error') {
      sonnerToast.error(title, { description });
    } else {
      sonnerToast(title, { description });
    }
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <Toast />
    </ToastContext.Provider>
  );
}

export function useToast(): (opts: ToastOptions) => void {
  return useContext(ToastContext).toast;
}
