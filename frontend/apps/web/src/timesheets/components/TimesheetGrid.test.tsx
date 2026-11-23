import { render, screen, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { TimesheetData } from "../types";
import { TimesheetGrid } from "./TimesheetGrid";

describe("TimesheetGrid", () => {
  const mockTimesheet: TimesheetData = {
    id: 10,
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
    days: [
      "2026-11-23",
      "2026-11-24",
      "2026-11-25",
      "2026-11-26",
      "2026-11-27",
      "2026-11-28",
      "2026-11-29",
    ],
    day_totals: {
      "2026-11-23": "9.00",
      "2026-11-24": "8.00",
      "2026-11-25": "8.00",
      "2026-11-26": "8.00",
      "2026-11-27": "8.00",
      "2026-11-28": "0.00",
      "2026-11-29": "0.00",
    },
    day_regular: {
      "2026-11-23": "8.00",
      "2026-11-24": "8.00",
      "2026-11-25": "8.00",
      "2026-11-26": "8.00",
      "2026-11-27": "8.00",
      "2026-11-28": "0.00",
      "2026-11-29": "0.00",
    },
    day_overtime: {
      "2026-11-23": "1.00",
      "2026-11-24": "0.00",
      "2026-11-25": "0.00",
      "2026-11-26": "0.00",
      "2026-11-27": "0.00",
      "2026-11-28": "0.00",
      "2026-11-29": "0.00",
    },
    total_week_hours: "41.00",
    total_regular_hours: "40.00",
    total_overtime_hours: "1.00",
    rows: [
      {
        id: 101,
        project: {
          id: 1,
          code: "PRJ-0001",
          name: "Automation Plant",
          is_active: true,
        },
        description: "PLC programming and diagnostics",
        row_total: "41.00",
        entries: [
          {
            entry_id: 201,
            date: "2026-11-23",
            hours: "9.00",
            note: "Commissioning trial run",
            is_editable: true,
          },
          {
            entry_id: 202,
            date: "2026-11-24",
            hours: "8.00",
            note: "",
            is_editable: true,
          },
          {
            entry_id: 203,
            date: "2026-11-25",
            hours: "8.00",
            note: "",
            is_editable: true,
          },
          {
            entry_id: 204,
            date: "2026-11-26",
            hours: "8.00",
            note: "",
            is_editable: true,
          },
          {
            entry_id: 205,
            date: "2026-11-27",
            hours: "8.00",
            note: "",
            is_editable: true,
          },
          {
            entry_id: 206,
            date: "2026-11-28",
            hours: "0.00",
            note: "",
            is_editable: false,
          },
          {
            entry_id: 207,
            date: "2026-11-29",
            hours: "0.00",
            note: "",
            is_editable: false,
          },
        ],
      },
    ],
    assigned_projects: [
      {
        id: 1,
        code: "PRJ-0001",
        name: "Automation Plant",
        is_active: true,
      },
    ],
  };

  it("renders project rows and day headers", () => {
    render(<TimesheetGrid timesheet={mockTimesheet} />);

    expect(screen.getByText("PRJ-0001")).toBeInTheDocument();
    expect(screen.getByText("Automation Plant")).toBeInTheDocument();
    expect(screen.getByText("PLC programming and diagnostics")).toBeInTheDocument();

    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("23")).toBeInTheDocument();
    expect(screen.getByText("Sun")).toBeInTheDocument();
    expect(screen.getByText("29")).toBeInTheDocument();
  });

  it("displays row cells and total column value", () => {
    render(<TimesheetGrid timesheet={mockTimesheet} />);

    const mondayCell = screen.getByTestId("cell-1-2026-11-23");
    expect(mondayCell).toHaveTextContent("9.0");

    const sundayCell = screen.getByTestId("cell-1-2026-11-29");
    expect(sundayCell).toHaveTextContent("0.0");

    expect(screen.getAllByText("41.0")).toHaveLength(2);
  });

  it("renders footer summaries for regular, overtime, and daily totals", () => {
    render(<TimesheetGrid timesheet={mockTimesheet} />);

    const footer = screen.getByTestId("timesheet-footer");
    expect(footer).toBeInTheDocument();
    expect(within(footer).getByText("Regular Hours")).toBeInTheDocument();
    expect(within(footer).getByText("Overtime Hours")).toBeInTheDocument();
    expect(within(footer).getByText("Daily Total")).toBeInTheDocument();

    expect(within(footer).getByText("40.0")).toBeInTheDocument();
    expect(within(footer).getAllByText("1.0").length).toBeGreaterThanOrEqual(1);
  });
});
