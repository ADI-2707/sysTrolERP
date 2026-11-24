import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TimesheetTotalsSummary } from "./TimesheetTotalsSummary";
import type { TimesheetData } from "../../types";

describe("TimesheetTotalsSummary", () => {
  const mockTimesheet: TimesheetData = {
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
      "2026-11-23": "9.50",
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
      "2026-11-23": "1.50",
      "2026-11-24": "0.00",
      "2026-11-25": "0.00",
      "2026-11-26": "0.00",
      "2026-11-27": "0.00",
      "2026-11-28": "0.00",
      "2026-11-29": "0.00",
    },
    total_week_hours: "41.50",
    total_regular_hours: "40.00",
    total_overtime_hours: "1.50",
    rows: [],
    assigned_projects: [],
  };

  it("renders regular, overtime, and total week hours", () => {
    render(<TimesheetTotalsSummary timesheet={mockTimesheet} />);

    expect(screen.getByText("Regular Hours")).toBeInTheDocument();
    expect(screen.getByText("40.0")).toBeInTheDocument();
    expect(screen.getByText("/ 40.0h")).toBeInTheDocument();

    expect(screen.getByText("Overtime Hours")).toBeInTheDocument();
    expect(screen.getByText("1.5")).toBeInTheDocument();

    expect(screen.getByText("Total Week")).toBeInTheDocument();
    expect(screen.getByText("41.5")).toBeInTheDocument();
  });

  it("renders 100% progress and standard target reached message", () => {
    render(<TimesheetTotalsSummary timesheet={mockTimesheet} />);

    const progress = screen.getByRole("progressbar");
    expect(progress).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByText("Standard Target Reached")).toBeInTheDocument();
  });

  it("renders daily compliance pills with overtime and met badges", () => {
    render(<TimesheetTotalsSummary timesheet={mockTimesheet} />);

    const mondayPill = screen.getByTestId("daily-pill-2026-11-23");
    expect(mondayPill).toHaveTextContent("Mon: 9.5h (+1.5h OT)");

    const tuesdayPill = screen.getByTestId("daily-pill-2026-11-24");
    expect(tuesdayPill).toHaveTextContent("Tue: 8.0h (Met)");

    const sundayPill = screen.getByTestId("daily-pill-2026-11-29");
    expect(sundayPill).toHaveTextContent("Sun: 0h");
  });
});
