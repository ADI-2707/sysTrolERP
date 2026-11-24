import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useTimesheetAutosave } from "./useTimesheetAutosave";
import * as timesheetApi from "../../api/timesheets";
import type { TimesheetData } from "../types";

vi.mock("../../api/timesheets", () => ({
  upsertCell: vi.fn(),
}));

describe("useTimesheetAutosave", () => {
  const initialData: TimesheetData = {
    id: 1,
    week_start_date: "2026-11-23",
    week_end_date: "2026-11-29",
    status: "OPEN",
    can_edit: true,
    can_submit: true,
    return_reason: null,
    submitted_at: null,
    approved_at: null,
    approved_by_label: null,
    returned_at: null,
    returned_by_label: null,
    policy: {
      daily_regular_hours: "8.00",
      hour_step: "0.25",
      break_duration_hours: "1.00",
      overtime_threshold_daily: "8.00",
    },
    days: ["2026-11-23", "2026-11-24"],
    day_totals: { "2026-11-23": "8.00", "2026-11-24": "0.00" },
    day_regular: { "2026-11-23": "8.00", "2026-11-24": "0.00" },
    day_overtime: { "2026-11-23": "0.00", "2026-11-24": "0.00" },
    total_week_hours: "8.00",
    total_regular_hours: "8.00",
    total_overtime_hours: "0.00",
    rows: [
      {
        id: 10,
        project: {
          id: 100,
          code: "PRJ-01",
          name: "Plant A",
          is_active: true,
        },
        description: "",
        row_total: "8.00",
        entries: [
          {
            entry_id: 1,
            date: "2026-11-23",
            hours: "8.00",
            note: "",
            is_editable: true,
          },
          {
            entry_id: 2,
            date: "2026-11-24",
            hours: "0.00",
            note: "",
            is_editable: true,
          },
        ],
      },
    ],
    assigned_projects: [],
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("performs optimistic update and sets saving state on cell change", () => {
    const { result } = renderHook(() =>
      useTimesheetAutosave(initialData, { debounceMs: 300 })
    );

    act(() => {
      result.current.updateCell(100, "2026-11-23", "9.50");
    });

    const entry = result.current.timesheet.rows[0].entries[0];
    expect(entry.hours).toBe("9.50");
    expect(result.current.timesheet.day_totals["2026-11-23"]).toBe("9.50");
    expect(result.current.timesheet.day_overtime["2026-11-23"]).toBe("1.50");
    expect(result.current.cellStatuses["100:2026-11-23"]).toBe("saving");
    expect(result.current.globalStatus).toBe("saving");
  });

  it("calls upsertCell after debounce and transitions to saved", async () => {
    vi.mocked(timesheetApi.upsertCell).mockResolvedValue({});
    const onSuccess = vi.fn();

    const { result } = renderHook(() =>
      useTimesheetAutosave(initialData, { debounceMs: 300, onSaveSuccess: onSuccess })
    );

    act(() => {
      result.current.updateCell(100, "2026-11-23", "9.00");
    });

    expect(timesheetApi.upsertCell).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(timesheetApi.upsertCell).toHaveBeenCalledWith({
      project_id: 100,
      date: "2026-11-23",
      hours: "9.00",
      note: undefined,
    });
    expect(result.current.cellStatuses["100:2026-11-23"]).toBe("saved");
    expect(onSuccess).toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.cellStatuses["100:2026-11-23"]).toBeUndefined();
    expect(result.current.globalStatus).toBe("idle");
  });

  it("rolls back cell value and totals when saving fails", async () => {
    vi.mocked(timesheetApi.upsertCell).mockRejectedValue(new Error("Network error"));
    const onError = vi.fn();

    const { result } = renderHook(() =>
      useTimesheetAutosave(initialData, { debounceMs: 200, onSaveError: onError })
    );

    act(() => {
      result.current.updateCell(100, "2026-11-23", "10.00");
    });

    expect(result.current.timesheet.rows[0].entries[0].hours).toBe("10.00");

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.cellStatuses["100:2026-11-23"]).toBe("error");
    expect(result.current.globalStatus).toBe("error");
    expect(onError).toHaveBeenCalled();

    const rolledBackEntry = result.current.timesheet.rows[0].entries[0];
    expect(rolledBackEntry.hours).toBe("8.00");
    expect(result.current.timesheet.day_totals["2026-11-23"]).toBe("8.00");
    expect(result.current.timesheet.day_overtime["2026-11-23"]).toBe("0.00");
  });
});
