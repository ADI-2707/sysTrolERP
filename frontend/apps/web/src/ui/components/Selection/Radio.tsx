import { createContext, forwardRef, useContext, type InputHTMLAttributes, type ReactNode } from "react";
import styles from "./Selection.module.css";

interface RadioGroupContextValue {
  name?: string;
  value?: string;
  onChange?: (val: string) => void;
  disabled?: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export interface RadioGroupProps {
  name?: string;
  value?: string;
  onChange?: (val: string) => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

export function RadioGroup({
  name,
  value,
  onChange,
  disabled,
  children,
  className,
}: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ name, value, onChange, disabled }}>
      <div role="radiogroup" className={className}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  value: string;
  label?: ReactNode;
  description?: ReactNode;
  onChange?: (val: string) => void;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { value, label, description, disabled, onChange, className, ...props },
  ref
) {
  const ctx = useContext(RadioGroupContext);
  const isChecked = ctx ? ctx.value === value : props.checked;
  const isDisabled = disabled ?? ctx?.disabled;
  const groupName = props.name ?? ctx?.name;

  const handleChange = () => {
    if (isDisabled) return;
    ctx?.onChange?.(value);
    onChange?.(value);
  };

  return (
    <label
      className={[styles["control-wrapper"], isDisabled && styles["is-disabled"], className]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        ref={ref}
        type="radio"
        name={groupName}
        value={value}
        className={styles["visually-hidden"]}
        checked={isChecked}
        disabled={isDisabled}
        onChange={handleChange}
        {...props}
      />
      <span
        className={[styles["radio-circle"], isChecked && styles["is-checked"]].filter(Boolean).join(" ")}
        aria-hidden="true"
      >
        {isChecked && <span className={styles["radio-dot"]} />}
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
