import { useEffect, useRef, type ReactNode } from "react";
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
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const remainingRef = useRef<number>(duration);
  const startTimeRef = useRef<number>(Date.now());

  const startTimer = () => {
    if (duration <= 0) return;
    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onDismiss(id);
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
  }, [id, duration]);

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

  return (
    <div
      role="status"
      onMouseEnter={pauseTimer}
      onMouseLeave={startTimer}
      className={[styles.toast, styles[`variant-${type}`]].filter(Boolean).join(" ")}
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
            onClick={() => {
              action.onClick();
              onDismiss(id);
            }}
          >
            {action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className={styles["close-button"]}
        aria-label="Dismiss notification"
      >
        <IconClose size={16} />
      </button>
    </div>
  );
}
