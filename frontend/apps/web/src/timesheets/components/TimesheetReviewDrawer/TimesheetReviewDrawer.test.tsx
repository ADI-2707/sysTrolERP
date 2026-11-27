import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TimesheetReviewDrawer } from "./TimesheetReviewDrawer";
import * as timesheetsApi from "../../../api/timesheets";
import type { TeamTimesheetItem, AdminTimesheetDetailData } from "../../types";

vi.mock("../../../api/timesheets", () => ({
  fetchAdminTimesheetDetail: vi.fn(),
}));

describe("TimesheetReviewDrawer", () => {
  const mockItem: TeamTimesheetItem = {
    id: 101,
    employee: {
      id: 5,
      code: "SYS-005",
      name: "Alice Engineer",
      designation: "Lead Engineer",
      department: "Engineering",
    },
    week_start_date: "2026-11-23",
    week_end_date: "2026-11-29",
    status: "SUBMITTED",
    total_hours: "40.00",
    submitted_at: "2026-11-27T18:00:00Z",
    approved_at: null,
    approved_by_label: null,
    returned_at: null,
    returned_by_label: null,
    return_reason: null,
    can_approve: true,
  };

  const mockDetail: AdminTimesheetDetailData = {
    id: 101,
    employee: {
      id: 5,
      code: "SYS-005",
      name: "Alice Engineer",
      designation: "Lead Engineer",
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
    days: ["2026-11-23", "2026-11-24"],
    day_totals: {
      "2026-11-23": "8.00",
      "2026-11-24": "8.00",
    },
    day_regular: {
      "2026-11-23": "8.00",
      "2026-11-24": "8.00",
    },
    day_overtime: {
      "2026-11-23": "0.00",
      "2026-11-24": "0.00",
    },
    total_week_hours: "16.00",
    total_regular_hours: "16.00",
    total_overtime_hours: "0.00",
    rows: [
      {
        id: 1,
        project: {
          id: 10,
          code: "PRJ-01",
          name: "Turbine Plant",
          is_active: true,
        },
        description: "Main turbine overhaul",
        row_total: "16.00",
        entries: [
          {
            entry_id: 1,
            date: "2026-11-23",
            hours: "8.00",
            note: "Alignment checks",
            is_editable: false,
          },
          {
            entry_id: 2,
            date: "2026-11-24",
            hours: "8.00",
            note: "",
            is_editable: false,
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders employee details and day-wise hours when open", async () => {
    vi.mocked(timesheetsApi.fetchAdminTimesheetDetail).mockResolvedValue(mockDetail);

    render(
      <TimesheetReviewDrawer
        isOpen={true}
        onClose={vi.fn()}
        timesheetItem={mockItem}
        onApprove={vi.fn()}
        onReturn={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("drawer-employee-name")).toHaveTextContent("Alice Engineer");
      expect(screen.getByTestId("drawer-employee-code")).toHaveTextContent("SYS-005");
      expect(screen.getByText("Turbine Plant")).toBeInTheDocument();
      expect(screen.getByText("PRJ-01")).toBeInTheDocument();
      expect(screen.getByText("Alignment checks")).toBeInTheDocument();
      expect(screen.getByTestId("drawer-total-hours")).toHaveTextContent("16.0h");
    });
  });

  it("approves timesheet and calls onApprove", async () => {
    vi.mocked(timesheetsApi.fetchAdminTimesheetDetail).mockResolvedValue(mockDetail);
    const onApprove = vi.fn();
    const onClose = vi.fn();

    render(
      <TimesheetReviewDrawer
        isOpen={true}
        onClose={onClose}
        timesheetItem={mockItem}
        onApprove={onApprove}
        onReturn={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("drawer-approve-btn")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("drawer-approve-btn"));

    await waitFor(() => {
      expect(onApprove).toHaveBeenCalledWith(101);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("returns timesheet with reason and calls onReturn", async () => {
    vi.mocked(timesheetsApi.fetchAdminTimesheetDetail).mockResolvedValue(mockDetail);
    const onReturn = vi.fn();
    const onClose = vi.fn();

    render(
      <TimesheetReviewDrawer
        isOpen={true}
        onClose={onClose}
        timesheetItem={mockItem}
        onApprove={vi.fn()}
        onReturn={onReturn}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("drawer-return-btn")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("drawer-return-btn"));

    const input = screen.getByTestId("drawer-return-reason-input");
    expect(input).toBeInTheDocument();

    const confirmBtn = screen.getByTestId("drawer-confirm-return-btn");
    expect(confirmBtn).toBeDisabled();

    fireEvent.change(input, { target: { value: "Hours mismatch on Tuesday" } });
    expect(confirmBtn).not.toBeDisabled();

    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(onReturn).toHaveBeenCalledWith(101, "Hours mismatch on Tuesday");
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("disables approve button when can_approve is false (own timesheet)", async () => {
    vi.mocked(timesheetsApi.fetchAdminTimesheetDetail).mockResolvedValue({
      ...mockDetail,
      can_approve: false,
    });

    render(
      <TimesheetReviewDrawer
        isOpen={true}
        onClose={vi.fn()}
        timesheetItem={{ ...mockItem, can_approve: false }}
        onApprove={vi.fn()}
        onReturn={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("drawer-approve-btn")).toBeDisabled();
      expect(screen.getByTestId("drawer-return-btn")).toBeDisabled();
      expect(screen.getByTestId("drawer-own-timesheet-notice")).toBeInTheDocument();
    });
  });
});
