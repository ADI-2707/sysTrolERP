import { useState, useEffect, useRef, type ChangeEvent, type KeyboardEvent } from "react";
import { validateQuarterHours } from "../../utils/validation";
import type { CellSaveStatus } from "../../hooks/useTimesheetAutosave";
import styles from "./TimesheetHoursCell.module.css";

export interface TimesheetHoursCellProps {
  value: string;
  date: string;
  step?: number;
  isEditable: boolean;
  status?: CellSaveStatus;
  onChange: (newHours: string) => void;
  "aria-label"?: string;
}

export function TimesheetHoursCell({
  value,
  date,
  step = 0.25,
  isEditable,
  status,
  onChange,
  "aria-label": ariaLabel,
}: TimesheetHoursCellProps) {
  const [val, setVal] = useState(value || "0.0");
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setVal(value || "0.0");
    }
  }, [value, isEditing]);

  const handleStartEdit = () => {
    if (!isEditable) return;
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 10);
  };

  const handleCommit = () => {
    setIsEditing(false);
    const trimmed = val.trim();
    if (!trimmed || trimmed === "0" || trimmed === "0.0") {
      setError(null);
      onChange("0.00");
      return;
    }

    const validation = validateQuarterHours(trimmed, step);
    if (!validation.valid) {
      setError(validation.error || "Invalid hours");
      setVal(value || "0.0"); // revert on invalid
      return;
    }

    setError(null);
    const normalized = validation.normalized || "0.00";
    onChange(normalized);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCommit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setVal(value || "0.0");
      setError(null);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const current = parseFloat(val) || 0;
      const next = Math.min(24, current + step);
      setVal(next.toFixed(2));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const current = parseFloat(val) || 0;
      const next = Math.max(0, current - step);
      setVal(next.toFixed(2));
    }
  };

  const displayHours = parseFloat(val || "0").toFixed(1);

  if (!isEditable) {
    return (
      <div className={styles.cellReadonly} title={`Read-only: ${displayHours}h`}>
        <span>{displayHours}</span>
      </div>
    );
  }

  return (
    <div
      className={[
        styles.cellWrapper,
        isEditing && styles.editing,
        error && styles.hasError,
        status === "error" && styles.cellError,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={handleStartEdit}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          className={styles.hoursInput}
          value={val}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setVal(e.target.value)}
          onBlur={handleCommit}
          onKeyDown={handleKeyDown}
          aria-label={ariaLabel || `Hours for ${date}`}
        />
      ) : (
        <span className={styles.hoursDisplay}>{displayHours}</span>
      )}

      {status && status !== "idle" && (
        <span
          className={[
            styles.statusDot,
            status === "saving" && styles.statusSaving,
            status === "saved" && styles.statusSaved,
            status === "error" && styles.statusError,
          ]
            .filter(Boolean)
            .join(" ")}
          title={`Save status: ${status}`}
        />
      )}
    </div>
  );
}
