import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TeamTimesheetReviewGrid } from "./TeamTimesheetReviewGrid";
import type { TeamTimesheetItem } from "../types";

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

  it("calls onApprove when Approve button is clicked", () => {
    const handleApprove = vi.fn();

    render(
      <TeamTimesheetReviewGrid
        timesheets={mockTimesheets}
        onApprove={handleApprove}
        onReturn={vi.fn()}
      />
    );

    const approveBtn = screen.getByTestId("approve-btn-101");
    fireEvent.click(approveBtn);

    expect(handleApprove).toHaveBeenCalledWith(101);
  });

  it("opens return modal and calls onReturn when reason is confirmed", async () => {
    const handleReturn = vi.fn().mockResolvedValue(undefined);

    render(
      <TeamTimesheetReviewGrid
        timesheets={mockTimesheets}
        onApprove={vi.fn()}
        onReturn={handleReturn}
      />
    );

    const returnBtn = screen.getByTestId("return-btn-101");
    fireEvent.click(returnBtn);

    expect(screen.getByText("Return Timesheet for Correction")).toBeInTheDocument();
    const textarea = screen.getByTestId("return-reason-textarea");
    fireEvent.change(textarea, { target: { value: "Overtime is missing site notes." } });

    const confirmBtn = screen.getByTestId("confirm-return-button");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(handleReturn).toHaveBeenCalledWith(101, "Overtime is missing site notes.");
    });
  });

  it("disallows approving own timesheet and displays own notice", () => {
    render(
      <TeamTimesheetReviewGrid
        timesheets={mockTimesheets}
        onApprove={vi.fn()}
        onReturn={vi.fn()}
      />
    );

    expect(screen.queryByTestId("approve-btn-102")).not.toBeInTheDocument();
    expect(screen.queryByTestId("return-btn-102")).not.toBeInTheDocument();
    expect(screen.getByTestId("own-notice-102")).toHaveTextContent("Own timesheet");
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
});
