import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { IconCheck } from "../../icons";
import styles from "./Selection.module.css";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange" | "checked"> {
  checked?: boolean | "indeterminate";
  onChange?: (checked: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { checked = false, onChange, label, description, disabled, className, ...props },
  ref
) {
  const isChecked = checked === true;
  const isIndeterminate = checked === "indeterminate";

  const handleChange = () => {
    if (disabled) return;
    onChange?.(!isChecked);
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
        className={styles["visually-hidden"]}
        checked={isChecked}
        disabled={disabled}
        onChange={handleChange}
        {...props}
      />
      <span
        className={[
          styles["checkbox-box"],
          isChecked && styles["is-checked"],
          isIndeterminate && styles["is-indeterminate"],
        ]
          .filter(Boolean)
          .join(" ")}
        aria-hidden="true"
      >
        {isChecked && <IconCheck size={14} />}
        {isIndeterminate && (
          <span style={{ width: 8, height: 2, backgroundColor: "currentColor" }} />
        )}
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
