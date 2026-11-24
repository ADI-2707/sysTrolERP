import { useState, useRef, useCallback, useEffect } from "react";
import type { TimesheetData } from "../types";
import { upsertCell } from "../../api/timesheets";

export type CellSaveStatus = "idle" | "saving" | "saved" | "error";

export interface UseTimesheetAutosaveOptions {
  debounceMs?: number;
  onSaveSuccess?: () => void;
  onSaveError?: (error: unknown) => void;
}

export function useTimesheetAutosave(
  initialTimesheet: TimesheetData,
  options: UseTimesheetAutosaveOptions = {}
) {
  const { debounceMs = 400, onSaveSuccess, onSaveError } = options;

  const [timesheet, setTimesheet] = useState<TimesheetData>(initialTimesheet);
  const [cellStatuses, setCellStatuses] = useState<Record<string, CellSaveStatus>>({});
  const [globalStatus, setGlobalStatus] = useState<CellSaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pendingRequestsRef = useRef<Map<string, AbortController>>(new Map());
  const previousValuesRef = useRef<Map<string, { hours: string; note: string }>>(new Map());

  useEffect(() => {
    setTimesheet(initialTimesheet);
  }, [initialTimesheet]);

  useEffect(() => {
    const timers = timersRef.current;
    const aborts = pendingRequestsRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
      aborts.forEach((a) => a.abort());
      aborts.clear();
    };
  }, []);

  const recalculateTotals = (draft: TimesheetData): TimesheetData => {
    const newDayTotals: Record<string, string> = {};
    const newDayRegular: Record<string, string> = {};
    const newDayOvertime: Record<string, string> = {};
    let weekTotal = 0;
    let regularTotal = 0;
    let overtimeTotal = 0;

    const dailyThreshold = parseFloat(draft.policy?.daily_regular_hours || "8.0");

    for (const d of draft.days) {
      let daySum = 0;
      for (const row of draft.rows) {
        const entry = row.entries.find((e) => e.date === d);
        if (entry) {
          daySum += parseFloat(entry.hours || "0");
        }
      }
      newDayTotals[d] = daySum.toFixed(2);
      weekTotal += daySum;

      const reg = Math.min(daySum, dailyThreshold);
      const ot = Math.max(0, daySum - dailyThreshold);
      newDayRegular[d] = reg.toFixed(2);
      newDayOvertime[d] = ot.toFixed(2);
      regularTotal += reg;
      overtimeTotal += ot;
    }

    const updatedRows = draft.rows.map((row) => {
      let rSum = 0;
      for (const e of row.entries) {
        rSum += parseFloat(e.hours || "0");
      }
      return {
        ...row,
        row_total: rSum.toFixed(2),
      };
    });

    return {
      ...draft,
      rows: updatedRows,
      day_totals: newDayTotals,
      day_regular: newDayRegular,
      day_overtime: newDayOvertime,
      total_week_hours: weekTotal.toFixed(2),
      total_regular_hours: regularTotal.toFixed(2),
      total_overtime_hours: overtimeTotal.toFixed(2),
    };
  };

  const executeSave = useCallback(
    async (projectId: number, date: string, hours: string, note?: string) => {
      const cellKey = `${projectId}:${date}`;

      try {
        await upsertCell({
          project_id: projectId,
          date,
          hours,
          note,
        });

        setCellStatuses((prev) => ({ ...prev, [cellKey]: "saved" }));
        setGlobalStatus("saved");
        setErrorMessage(null);
        previousValuesRef.current.delete(cellKey);
        onSaveSuccess?.();

        setTimeout(() => {
          setCellStatuses((prev) => {
            if (prev[cellKey] === "saved") {
              const next = { ...prev };
              delete next[cellKey];
              return next;
            }
            return prev;
          });
          setGlobalStatus((cur) => (cur === "saved" ? "idle" : cur));
        }, 1500);
      } catch (err: unknown) {
        setCellStatuses((prev) => ({ ...prev, [cellKey]: "error" }));
        setGlobalStatus("error");

        const msg = err instanceof Error ? err.message : "Failed to save hours";
        setErrorMessage(msg);

        const prev = previousValuesRef.current.get(cellKey);
        if (prev) {
          setTimesheet((current) => {
            const reverted = {
              ...current,
              rows: current.rows.map((r) => {
                if (r.project.id !== projectId) return r;
                return {
                  ...r,
                  entries: r.entries.map((e) => {
                    if (e.date !== date) return e;
                    return { ...e, hours: prev.hours, note: prev.note };
                  }),
                };
              }),
            };
            return recalculateTotals(reverted);
          });
          previousValuesRef.current.delete(cellKey);
        }

        onSaveError?.(err);
      }
    },
    [onSaveSuccess, onSaveError]
  );

  const updateCell = useCallback(
    (projectId: number, date: string, hours: string, note?: string) => {
      const cellKey = `${projectId}:${date}`;

      setTimesheet((current) => {
        const row = current.rows.find((r) => r.project.id === projectId);
        const entry = row?.entries.find((e) => e.date === date);

        if (!previousValuesRef.current.has(cellKey) && entry) {
          previousValuesRef.current.set(cellKey, {
            hours: entry.hours,
            note: entry.note,
          });
        }

        const updated = {
          ...current,
          rows: current.rows.map((r) => {
            if (r.project.id !== projectId) return r;
            return {
              ...r,
              entries: r.entries.map((e) => {
                if (e.date !== date) return e;
                return {
                  ...e,
                  hours,
                  note: note !== undefined ? note : e.note,
                };
              }),
            };
          }),
        };

        return recalculateTotals(updated);
      });

      setCellStatuses((prev) => ({ ...prev, [cellKey]: "saving" }));
      setGlobalStatus("saving");

      const existingTimer = timersRef.current.get(cellKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        timersRef.current.delete(cellKey);
        executeSave(projectId, date, hours, note);
      }, debounceMs);

      timersRef.current.set(cellKey, timer);
    },
    [debounceMs, executeSave]
  );

  return {
    timesheet,
    setTimesheet,
    updateCell,
    cellStatuses,
    globalStatus,
    errorMessage,
  };
}
