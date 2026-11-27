import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { IconClose, IconError, IconInfo, IconSuccess, IconWarning } from "../../icons";
import styles from "./Toast.module.css";

export type ToastType = "info" | "success" | "warning" | "error";

export interface ToastItem {
  id: string;
  type?: ToastType;
  title: ReactNode;
  description?: ReactNode;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const { id, type = "info", title, description, duration = 4000, action } = toast;
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const remainingRef = useRef<number>(duration);
  const startTimeRef = useRef<number>(Date.now());

  const triggerDismiss = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
  }, [isExiting]);

  useEffect(() => {
    if (!isExiting) return;
    const timer = setTimeout(() => {
      onDismiss(id);
    }, 250);
    return () => clearTimeout(timer);
  }, [isExiting, id, onDismiss]);

  const startTimer = () => {
    if (duration <= 0 || isExiting) return;
    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      triggerDismiss();
    }, remainingRef.current);
  };

  const pauseTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      remainingRef.current -= Date.now() - startTimeRef.current;
    }
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [id, duration, isExiting]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return <IconSuccess size={18} />;
      case "warning":
        return <IconWarning size={18} />;
      case "error":
        return <IconError size={18} />;
      default:
        return <IconInfo size={18} />;
    }
  };

  const toastClass = [
    styles.toast,
    styles[`variant-${type}`],
    isExiting ? styles["toast-exit"] : styles["toast-enter"],
  ].filter(Boolean).join(" ");

  return (
    <div
      role="status"
      onMouseEnter={pauseTimer}
      onMouseLeave={startTimer}
      className={toastClass}
    >
      <div className={styles["icon-wrapper"]} aria-hidden="true">
        {getIcon()}
      </div>
      <div className={styles.content}>
        <div className={styles.title}>{title}</div>
        {description && <div className={styles.description}>{description}</div>}
        {action && (
          <button
            type="button"
            className={styles["action-button"]}
            disabled={isExiting}
            onClick={() => {
              action.onClick();
              triggerDismiss();
            }}
          >
            {action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={triggerDismiss}
        className={styles["close-button"]}
        aria-label="Dismiss notification"
        disabled={isExiting}
      >
        <IconClose size={16} />
      </button>
    </div>
  );
}
