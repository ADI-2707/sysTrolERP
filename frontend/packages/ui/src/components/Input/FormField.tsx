import type { ReactNode } from "react";
import styles from "./Input.module.css";

export interface FormFieldProps {
  id?: string;
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({
  id,
  label,
  required,
  hint,
  error,
  children,
  className,
}: FormFieldProps) {
  const hintId = hint && id ? `${id}-hint` : undefined;
  const errorId = error && id ? `${id}-error` : undefined;

  return (
    <div className={[styles["form-field"], className].filter(Boolean).join(" ")}>
      {label && (
        <div className={styles["label-row"]}>
          <label htmlFor={id} className={styles.label}>
            {label}
            {required && <span className={styles["required-star"]}>*</span>}
          </label>
        </div>
      )}
      {children}
      {hint && !error && (
        <span id={hintId} className={styles.hint}>
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} role="alert" className={styles.error}>
          {error}
        </span>
      )}
    </div>
  );
}
