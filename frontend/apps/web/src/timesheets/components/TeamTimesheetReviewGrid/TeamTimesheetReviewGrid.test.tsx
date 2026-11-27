import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TeamTimesheetReviewGrid } from "./TeamTimesheetReviewGrid";
import * as timesheetsApi from "../../../api/timesheets";
import type { TeamTimesheetItem } from "../../types";

vi.mock("../../../api/timesheets", () => ({
  fetchAdminTimesheetDetail: vi.fn(),
}));

describe("TeamTimesheetReviewGrid", () => {
  const mockTimesheets: TeamTimesheetItem[] = [
    {
      id: 101,
      employee: {
        id: 1,
        code: "SYS-001",
        name: "Alice Engineer",
        designation: "Automation Lead",
        department: "Engineering",
      },
      week_start_date: "2026-11-23",
      week_end_date: "2026-11-29",
      status: "SUBMITTED",
      total_hours: "42.00",
      submitted_at: "2026-11-27T18:00:00Z",
      approved_at: null,
      approved_by_label: null,
      returned_at: null,
      returned_by_label: null,
      return_reason: null,
      can_approve: true,
    },
    {
      id: 102,
      employee: {
        id: 2,
        code: "SYS-002",
        name: "Bob Admin",
        designation: "Project Manager",
        department: "Operations",
      },
      week_start_date: "2026-11-23",
      week_end_date: "2026-11-29",
      status: "SUBMITTED",
      total_hours: "40.00",
      submitted_at: "2026-11-27T19:00:00Z",
      approved_at: null,
      approved_by_label: null,
      returned_at: null,
      returned_by_label: null,
      return_reason: null,
      can_approve: false,
    },
    {
      id: 103,
      employee: {
        id: 3,
        code: "SYS-003",
        name: "Charlie Technician",
        designation: "Field Engineer",
        department: "Commissioning",
      },
      week_start_date: "2026-11-23",
      week_end_date: "2026-11-29",
      status: "APPROVED",
      total_hours: "40.00",
      submitted_at: "2026-11-26T17:00:00Z",
      approved_at: "2026-11-27T10:00:00Z",
      approved_by_label: "Admin",
      returned_at: null,
      returned_by_label: null,
      return_reason: null,
      can_approve: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(timesheetsApi.fetchAdminTimesheetDetail).mockResolvedValue({
      id: 101,
      employee: {
        id: 1,
        code: "SYS-001",
        name: "Alice Engineer",
        designation: "Automation Lead",
        department: "Engineering",
      },
      week_start_date: "2026-11-23",
      week_end_date: "2026-11-29",
      status: "SUBMITTED",
      can_approve: true,
      can_return: true,
      return_reason: null,
      submitted_at: "2026-11-27T18:00:00Z",
      approved_at: null,
      approved_by_label: null,
      returned_at: null,
      returned_by_label: null,
      days: ["2026-11-23"],
      day_totals: { "2026-11-23": "42.00" },
      day_regular: { "2026-11-23": "40.00" },
      day_overtime: { "2026-11-23": "2.00" },
      total_week_hours: "42.00",
      total_regular_hours: "40.00",
      total_overtime_hours: "2.00",
      rows: [],
    });
  });

  it("renders timesheet list with employee info and status badges", () => {
    render(
      <TeamTimesheetReviewGrid
        timesheets={mockTimesheets}
        onApprove={vi.fn()}
        onReturn={vi.fn()}
      />
    );

    expect(screen.getByText("Alice Engineer")).toBeInTheDocument();
    expect(screen.getByText(/SYS-001/)).toBeInTheDocument();
    expect(screen.getByText("Bob Admin")).toBeInTheDocument();
    expect(screen.getByText("Charlie Technician")).toBeInTheDocument();

    expect(screen.getByTestId("status-badge-101")).toHaveTextContent("SUBMITTED");
    expect(screen.getByTestId("status-badge-103")).toHaveTextContent("APPROVED");
  });

  it("opens review drawer and calls onApprove when confirmed", async () => {
    const handleApprove = vi.fn();

    render(
      <TeamTimesheetReviewGrid
        timesheets={mockTimesheets}
        onApprove={handleApprove}
        onReturn={vi.fn()}
      />
    );

    const reviewBtn = screen.getByTestId("review-btn-101");
    fireEvent.click(reviewBtn);

    await waitFor(() => {
      expect(screen.getByTestId("drawer-approve-btn")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("drawer-approve-btn"));

    await waitFor(() => {
      expect(handleApprove).toHaveBeenCalledWith(101);
    });
  });

  it("opens review drawer and calls onReturn when reason is confirmed", async () => {
    const handleReturn = vi.fn().mockResolvedValue(undefined);

    render(
      <TeamTimesheetReviewGrid
        timesheets={mockTimesheets}
        onApprove={vi.fn()}
        onReturn={handleReturn}
      />
    );

    const reviewBtn = screen.getByTestId("review-btn-101");
    fireEvent.click(reviewBtn);

    await waitFor(() => {
      expect(screen.getByTestId("drawer-return-btn")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("drawer-return-btn"));

    const textarea = screen.getByTestId("drawer-return-reason-input");
    fireEvent.change(textarea, { target: { value: "Overtime is missing site notes." } });

    const confirmBtn = screen.getByTestId("drawer-confirm-return-btn");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(handleReturn).toHaveBeenCalledWith(101, "Overtime is missing site notes.");
    });
  });

  it("disallows approving own timesheet inside drawer and displays own notice", async () => {
    vi.mocked(timesheetsApi.fetchAdminTimesheetDetail).mockResolvedValueOnce({
      id: 102,
      employee: {
        id: 2,
        code: "SYS-002",
        name: "Bob Admin",
        designation: "Project Manager",
        department: "Operations",
      },
      week_start_date: "2026-11-23",
      week_end_date: "2026-11-29",
      status: "SUBMITTED",
      can_approve: false,
      can_return: false,
      return_reason: null,
      submitted_at: "2026-11-27T19:00:00Z",
      approved_at: null,
      approved_by_label: null,
      returned_at: null,
      returned_by_label: null,
      days: ["2026-11-23"],
      day_totals: { "2026-11-23": "40.00" },
      day_regular: { "2026-11-23": "40.00" },
      day_overtime: { "2026-11-23": "0.00" },
      total_week_hours: "40.00",
      total_regular_hours: "40.00",
      total_overtime_hours: "0.00",
      rows: [],
    });

    render(
      <TeamTimesheetReviewGrid
        timesheets={mockTimesheets}
        onApprove={vi.fn()}
        onReturn={vi.fn()}
      />
    );

    const reviewBtn = screen.getByTestId("review-btn-102");
    fireEvent.click(reviewBtn);

    await waitFor(() => {
      expect(screen.getByTestId("drawer-own-timesheet-notice")).toBeInTheDocument();
      expect(screen.getByTestId("drawer-approve-btn")).toBeDisabled();
    });
  });

  it("filters timesheets by search term and status", () => {
    render(
      <TeamTimesheetReviewGrid
        timesheets={mockTimesheets}
        onApprove={vi.fn()}
        onReturn={vi.fn()}
      />
    );

    const searchInput = screen.getByTestId("search-employee-input");
    fireEvent.change(searchInput, { target: { value: "Charlie" } });

    expect(screen.getByText("Charlie Technician")).toBeInTheDocument();
    expect(screen.queryByText("Alice Engineer")).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "" } });
    const select = screen.getByTestId("filter-status-select");
    fireEvent.change(select, { target: { value: "APPROVED" } });

    expect(screen.getByText("Charlie Technician")).toBeInTheDocument();
    expect(screen.queryByText("Alice Engineer")).not.toBeInTheDocument();
  });

  it("renders override button for super admin and triggers onOverride", async () => {
    const handleOverride = vi.fn().mockResolvedValue(undefined);

    render(
      <TeamTimesheetReviewGrid
        timesheets={mockTimesheets}
        onApprove={vi.fn()}
        onReturn={vi.fn()}
        onOverride={handleOverride}
        isSuper={true}
      />
    );

    const overrideBtn = screen.getByTestId("override-btn-101");
    fireEvent.click(overrideBtn);

    expect(screen.getByText("Super Admin Override")).toBeInTheDocument();
    const reasonTextarea = screen.getByTestId("override-reason-textarea");
    fireEvent.change(reasonTextarea, { target: { value: "Executive emergency override." } });

    const confirmBtn = screen.getByTestId("confirm-override-button");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(handleOverride).toHaveBeenCalledWith(101, {
        status: "APPROVED",
        reason: "Executive emergency override.",
      });
    });
  });
});
