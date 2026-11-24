import { createContext, useContext, useState, type ReactNode } from "react";
import { Portal } from "../../primitives";
import { Toast, type ToastItem } from "./Toast";
import styles from "./Toast.module.css";

export interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (options: Omit<ToastItem, "id">) => string;
  dismissToast: (id: string) => void;
  clearAll: () => void;
  toast: {
    info: (title: ReactNode, options?: Partial<ToastItem>) => string;
    success: (title: ReactNode, options?: Partial<ToastItem>) => string;
    warning: (title: ReactNode, options?: Partial<ToastItem>) => string;
    error: (title: ReactNode, options?: Partial<ToastItem>) => string;
    promise: <T>(
      promise: Promise<T>,
      messages: { loading: ReactNode; success: ReactNode; error: ReactNode }
    ) => Promise<T>;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

export interface ToastProviderProps {
  children: ReactNode;
  maxVisible?: number;
}

let toastCounter = 0;

export function ToastProvider({ children, maxVisible = 5 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const clearAll = () => {
    setToasts([]);
  };

  const addToast = (options: Omit<ToastItem, "id">): string => {
    const id = `toast-${++toastCounter}-${Date.now()}`;
    const newToast: ToastItem = { ...options, id };
    setToasts((prev) => {
      const next = [newToast, ...prev];
      return next.slice(0, maxVisible);
    });
    return id;
  };

  const helper = {
    info: (title: ReactNode, options?: Partial<ToastItem>) =>
      addToast({ type: "info", title, ...options }),
    success: (title: ReactNode, options?: Partial<ToastItem>) =>
      addToast({ type: "success", title, ...options }),
    warning: (title: ReactNode, options?: Partial<ToastItem>) =>
      addToast({ type: "warning", title, ...options }),
    error: (title: ReactNode, options?: Partial<ToastItem>) =>
      addToast({ type: "error", title, ...options }),
    promise: async <T,>(
      promise: Promise<T>,
      messages: { loading: ReactNode; success: ReactNode; error: ReactNode }
    ): Promise<T> => {
      const id = addToast({ type: "info", title: messages.loading, duration: 0 });
      try {
        const result = await promise;
        dismissToast(id);
        addToast({ type: "success", title: messages.success });
        return result;
      } catch (err) {
        dismissToast(id);
        addToast({ type: "error", title: messages.error });
        throw err;
      }
    },
  };

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, dismissToast, clearAll, toast: helper }}
    >
      {children}
      <Portal>
        <div
          role="region"
          aria-live="polite"
          aria-label="Notifications"
          className={styles["toast-container"]}
        >
          {toasts.map((t) => (
            <Toast key={t.id} toast={t} onDismiss={dismissToast} />
          ))}
        </div>
      </Portal>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
