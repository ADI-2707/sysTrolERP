import type { ReactNode } from "react";
import styles from "./Display.module.css";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={[styles["empty-state"], className].filter(Boolean).join(" ")}>
      {icon && <div className={styles["empty-state-icon"]}>{icon}</div>}
      <h3 className={styles["empty-state-title"]}>{title}</h3>
      {description && <div className={styles["empty-state-desc"]}>{description}</div>}
      {action && <div>{action}</div>}
    </div>
  );
}
