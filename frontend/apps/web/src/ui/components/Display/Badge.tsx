import type { ReactNode } from "react";
import styles from "./Display.module.css";

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "brand";

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={[styles.badge, styles[`badge-${variant}`], className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
