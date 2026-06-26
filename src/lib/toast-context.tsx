/**
 * Toast context and hook for ephemeral in-app notifications.
 */
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Toast, type ToastItem } from '@/components/ui/Toast';

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
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const toast = useCallback((opts: ToastOptions) => {
    const id = `toast-${++counterRef.current}`;
    setToasts(prev => [...prev, { id, ...opts }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <Toast toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): (opts: ToastOptions) => void {
  return useContext(ToastContext).toast;
}
