import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TimesheetsDashboardPage } from "./TimesheetsDashboardPage";
import * as authModule from "../../auth";
import * as timesheetsApi from "../../api/timesheets";
import type {
  TimesheetData,
  DashboardSummaryData,
  TeamTimesheetItem,
} from "../../timesheets/types";

vi.mock("../../auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../api/timesheets", () => ({
  fetchOwnTimesheet: vi.fn(),
  fetchTimesheetSummary: vi.fn(),
  fetchTeamTimesheets: vi.fn(),
  approveTimesheet: vi.fn(),
  returnTimesheet: vi.fn(),
  createTimesheetRow: vi.fn(),
  deleteTimesheetRow: vi.fn(),
  submitOwnTimesheet: vi.fn(),
  upsertCell: vi.fn(),
}));

describe("TimesheetsDashboardPage", () => {
  const mockEmployeeTimesheet: TimesheetData = {
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
    total_week_hours: "8.00",
    total_regular_hours: "8.00",
    total_overtime_hours: "0.00",
    rows: [
      {
        id: 10,
        project: { id: 101, code: "PRJ-01", name: "Plant", is_active: true },
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
        ],
      },
    ],
    assigned_projects: [
      { id: 101, code: "PRJ-01", name: "Plant", is_active: true },
    ],
  };

  const mockSummary: DashboardSummaryData = {
    week_start_date: "2026-11-23",
    week_end_date: "2026-11-29",
    active_employees_count: 5,
    pending_approval_count: 2,
    week_submitted_count: 3,
    week_approved_count: 2,
    week_open_count: 0,
    week_returned_count: 0,
    total_hours: "160.00",
    total_regular_hours: "160.00",
    total_overtime_hours: "0.00",
  };

  const mockTeamTimesheets: TeamTimesheetItem[] = [
    {
      id: 101,
      employee: {
        id: 2,
        code: "SYS-002",
        name: "Alice Engineer",
        designation: "Lead",
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
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders employee dashboard without admin tabs", async () => {
    vi.mocked(authModule.useAuth).mockReturnValue({
      user: {
        id: "emp-1",
        full_name: "John Doe",
        email: "john@systrol.com",
        role: "EMPLOYEE",
        employee_code: "SYS-001",
        must_change_password: false,
      },
      isLoading: false,
      isAuthenticated: true,
      isSuperAdmin: false,
      isAdmin: false,
      isEmployee: true,
      mustChangePassword: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });
    vi.mocked(timesheetsApi.fetchOwnTimesheet).mockResolvedValue(mockEmployeeTimesheet);

    render(<TimesheetsDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Timesheet Dashboard")).toBeInTheDocument();
      expect(screen.getByTestId("employee-summary-cards")).toBeInTheDocument();
      expect(screen.queryByTestId("admin-timesheet-tabs")).not.toBeInTheDocument();
    });
  });

  it("renders admin dashboard with tabs and allows approving team timesheet", async () => {
    vi.mocked(authModule.useAuth).mockReturnValue({
      user: {
        id: "admin-1",
        full_name: "Admin User",
        email: "admin@systrol.com",
        role: "ADMIN",
        employee_code: "SYS-ADM",
        must_change_password: false,
      },
      isLoading: false,
      isAuthenticated: true,
      isSuperAdmin: false,
      isAdmin: true,
      isEmployee: false,
      mustChangePassword: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });
    vi.mocked(timesheetsApi.fetchOwnTimesheet).mockResolvedValue(mockEmployeeTimesheet);
    vi.mocked(timesheetsApi.fetchTimesheetSummary).mockResolvedValue(mockSummary);
    vi.mocked(timesheetsApi.fetchTeamTimesheets).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: mockTeamTimesheets,
    });
    vi.mocked(timesheetsApi.approveTimesheet).mockResolvedValue({});

    render(<TimesheetsDashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("admin-timesheet-tabs")).toBeInTheDocument();
      expect(screen.getByTestId("pending-badge")).toHaveTextContent("2");
    });

    const teamTab = screen.getByRole("tab", { name: /Team Timesheets/i });
    fireEvent.click(teamTab);

    expect(screen.getByTestId("admin-summary-cards")).toBeInTheDocument();
    expect(screen.getByText("Alice Engineer")).toBeInTheDocument();

    const approveBtn = screen.getByTestId("approve-btn-101");
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(timesheetsApi.approveTimesheet).toHaveBeenCalledWith(101);
    });
  });

  it("renders super admin directly in team review view", async () => {
    vi.mocked(authModule.useAuth).mockReturnValue({
      user: {
        id: "super",
        full_name: "Super Admin",
        email: "super@systrol.com",
        role: "SUPER",
        employee_code: "",
        must_change_password: false,
      },
      isLoading: false,
      isAuthenticated: true,
      isSuperAdmin: true,
      isAdmin: false,
      isEmployee: false,
      mustChangePassword: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });
    vi.mocked(timesheetsApi.fetchTimesheetSummary).mockResolvedValue(mockSummary);
    vi.mocked(timesheetsApi.fetchTeamTimesheets).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: mockTeamTimesheets,
    });

    render(<TimesheetsDashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("admin-summary-cards")).toBeInTheDocument();
      expect(screen.getByText("Alice Engineer")).toBeInTheDocument();
      expect(timesheetsApi.fetchOwnTimesheet).not.toHaveBeenCalled();
    });
  });
});
