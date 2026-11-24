import { render, screen, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DashboardSummaryCards } from "./DashboardSummaryCards";
import type { TimesheetData, DashboardSummaryData } from "../types";

describe("DashboardSummaryCards", () => {
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
    days: ["2026-11-23"],
    day_totals: { "2026-11-23": "8.00" },
    day_regular: { "2026-11-23": "8.00" },
    day_overtime: { "2026-11-23": "0.00" },
    total_week_hours: "40.00",
    total_regular_hours: "40.00",
    total_overtime_hours: "0.00",
    rows: [
      {
        id: 10,
        project: { id: 101, code: "PRJ-01", name: "Plant", is_active: true },
        description: "",
        row_total: "40.00",
        entries: [],
      },
    ],
    assigned_projects: [
      { id: 101, code: "PRJ-01", name: "Plant", is_active: true },
      { id: 102, code: "PRJ-02", name: "Automation", is_active: true },
    ],
  };

  const mockAdminSummary: DashboardSummaryData = {
    week_start_date: "2026-11-23",
    week_end_date: "2026-11-29",
    active_employees_count: 12,
    pending_approval_count: 3,
    week_submitted_count: 4,
    week_approved_count: 7,
    week_open_count: 1,
    week_returned_count: 0,
    total_hours: "480.00",
    total_regular_hours: "450.00",
    total_overtime_hours: "30.00",
  };

  it("renders employee summary metrics when timesheet prop is provided", () => {
    render(<DashboardSummaryCards timesheet={mockTimesheet} />);

    expect(screen.getByTestId("employee-summary-cards")).toBeInTheDocument();
    const totalCard = screen.getByTestId("summary-week-hours");
    expect(within(totalCard).getByText("Total Logged")).toBeInTheDocument();
    expect(within(totalCard).getByText("40.0")).toBeInTheDocument();

    const regOtCard = screen.getByTestId("summary-reg-ot");
    expect(within(regOtCard).getByText("Regular vs Overtime")).toBeInTheDocument();
    expect(within(regOtCard).getByText("40.0")).toBeInTheDocument();
    expect(within(regOtCard).getByText("/ 0.0h OT")).toBeInTheDocument();

    expect(screen.getByTestId("summary-week-status")).toHaveTextContent("OPEN");
    expect(screen.getByText("Assigned Projects")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders admin summary metrics when adminSummary prop is provided", () => {
    render(<DashboardSummaryCards adminSummary={mockAdminSummary} />);

    expect(screen.getByTestId("admin-summary-cards")).toBeInTheDocument();
    expect(screen.getByText("Pending Review")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Action needed")).toBeInTheDocument();

    expect(screen.getByText("Team Total Hours")).toBeInTheDocument();
    expect(screen.getByText("480.0")).toBeInTheDocument();

    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();

    expect(screen.getByText("Active Team")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });
});
