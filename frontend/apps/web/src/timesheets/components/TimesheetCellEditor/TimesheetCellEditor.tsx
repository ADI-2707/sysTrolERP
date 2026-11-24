import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { validateQuarterHours } from "../../utils/validation";
import styles from "./TimesheetCellEditor.module.css";

export interface TimesheetCellEditorProps {
  initialValue: string;
  step: number;
  onCommit: (value: string) => void;
  onCancel: () => void;
  "aria-label"?: string;
}

export function TimesheetCellEditor({
  initialValue,
  step,
  onCommit,
  onCancel,
  "aria-label": ariaLabel = "Edit hours",
}: TimesheetCellEditorProps) {
  const [val, setVal] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleCommit = (revertOnInvalid = false) => {
    const result = validateQuarterHours(val, step);
    if (!result.valid) {
      if (revertOnInvalid) {
        onCancel();
      } else {
        setError(result.error || "Invalid hours");
      }
      return;
    }
    setError(null);
    onCommit(result.normalized || "0.00");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCommit(false);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className={styles.editorWrapper}>
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        className={[styles.editorInput, error && styles.hasError]
          .filter(Boolean)
          .join(" ")}
        value={val}
        onChange={(e) => {
          setVal(e.target.value);
          if (error) setError(null);
        }}
        onBlur={() => handleCommit(true)}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel}
        aria-invalid={Boolean(error)}
        data-testid="cell-editor-input"
      />
      {error && (
        <div role="alert" className={styles.errorMessage}>
          {error}
        </div>
      )}
    </div>
  );
}
