import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import styles from "./Selection.module.css";

export interface SwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { checked = false, onChange, label, description, disabled, className, ...props },
  ref
) {
  const handleChange = () => {
    if (disabled) return;
    onChange?.(!checked);
  };

  return (
    <label
      className={[styles["control-wrapper"], disabled && styles["is-disabled"], className]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        aria-checked={checked}
        className={styles["visually-hidden"]}
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
        {...props}
      />
      <span
        className={[styles["switch-track"], checked && styles["is-checked"]].filter(Boolean).join(" ")}
        aria-hidden="true"
      >
        <span className={styles["switch-thumb"]} />
      </span>
      {(label || description) && (
        <span className={styles["text-group"]}>
          {label && <span className={styles.label}>{label}</span>}
          {description && <span className={styles.description}>{description}</span>}
        </span>
      )}
    </label>
  );
});
