import type { ReactNode } from "react";
import styles from "./Display.module.css";

export interface CardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  hoverable?: boolean;
  className?: string;
  onClick?: () => void;
}

export function Card({
  title,
  subtitle,
  actions,
  children,
  footer,
  hoverable = false,
  className,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={[
        styles.card,
        hoverable && styles["is-hoverable"],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {(title || actions) && (
        <div className={styles["card-header"]}>
          <div>
            {title && <div className={styles["card-title"]}>{title}</div>}
            {subtitle && <div className={styles["card-subtitle"]}>{subtitle}</div>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className={styles["card-body"]}>{children}</div>
      {footer && <div className={styles["card-footer"]}>{footer}</div>}
    </div>
  );
}
