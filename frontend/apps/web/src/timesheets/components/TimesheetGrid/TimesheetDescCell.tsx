import { useState, useEffect, useRef, type ChangeEvent, type KeyboardEvent } from "react";
import styles from "./TimesheetDescCell.module.css";

export interface TimesheetDescCellProps {
  value: string;
  date: string;
  isEditable: boolean;
  onChange: (newValue: string) => void;
  maxLength?: number;
  "aria-label"?: string;
}

export function TimesheetDescCell({
  value,
  date,
  isEditable,
  onChange,
  maxLength = 200,
  "aria-label": ariaLabel,
}: TimesheetDescCellProps) {
  const [val, setVal] = useState(value || "");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setVal(value || "");
  }, [value]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    if (text.length <= maxLength) {
      setVal(text);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (val !== value) {
      onChange(val.trim());
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  if (!isEditable) {
    return (
      <div className={styles.cellReadonly} title={val || "No description"}>
        <span className={styles.textSnippet}>{val || "—"}</span>
      </div>
    );
  }

  return (
    <div className={[styles.cellWrapper, isFocused && styles.focused].filter(Boolean).join(" ")}>
      <input
        ref={inputRef}
        type="text"
        className={styles.cellInput}
        value={val}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Work done..."
        maxLength={maxLength}
        aria-label={ariaLabel || `Work description for ${date}`}
        title={val}
      />
      {isFocused && (
        <span className={styles.charCounter}>
          {val.length}/{maxLength}
        </span>
      )}
    </div>
  );
}
