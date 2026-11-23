import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import styles from "./Input.module.css";

export type InputSize = "sm" | "md" | "lg";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: InputSize;
  error?: boolean | string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    size = "md",
    error,
    leftIcon,
    rightIcon,
    className,
    disabled,
    id,
    "aria-describedby": ariaDescribedBy,
    ...props
  },
  ref
) {
  const hasError = Boolean(error);
  const inputClass = [
    styles.input,
    styles[`size-${size}`],
    hasError && styles["has-error"],
    leftIcon && styles["has-left-icon"],
    rightIcon && styles["has-right-icon"],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const errorDescribedBy = hasError && id ? `${id}-error` : undefined;
  const combinedDescribedBy = [ariaDescribedBy, errorDescribedBy].filter(Boolean).join(" ") || undefined;

  return (
    <div className={styles["input-wrapper"]}>
      {leftIcon && <span className={styles["left-icon"]} aria-hidden="true">{leftIcon}</span>}
      <input
        ref={ref}
        id={id}
        className={inputClass}
        disabled={disabled}
        aria-invalid={hasError ? "true" : undefined}
        aria-describedby={combinedDescribedBy}
        {...props}
      />
      {rightIcon && <span className={styles["right-icon"]} aria-hidden="true">{rightIcon}</span>}
    </div>
  );
});
