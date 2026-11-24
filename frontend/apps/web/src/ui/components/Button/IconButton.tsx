import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";
import type { ButtonSize, ButtonVariant } from "./Button";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function IconButton({
  icon,
  label,
  variant = "ghost",
  size = "md",
  loading = false,
  disabled = false,
  className,
  ...props
}: IconButtonProps) {
  const isActuallyDisabled = disabled || loading;

  const classList = [
    styles.button,
    styles["icon-button"],
    styles[`variant-${variant}`],
    styles[`size-${size}`],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={classList}
      disabled={isActuallyDisabled}
      aria-label={label}
      aria-busy={loading ? "true" : undefined}
      title={label}
      {...props}
    >
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : icon}
    </button>
  );
}
