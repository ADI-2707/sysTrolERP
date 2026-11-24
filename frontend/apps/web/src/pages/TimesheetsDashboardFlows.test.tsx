import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TimesheetsDashboardPage } from "./TimesheetsDashboardPage";
import * as authModule from "../auth";
import * as timesheetsApi from "../api/timesheets";
import * as telemetryApi from "../api/telemetry";
import type {
  TimesheetData,
  DashboardSummaryData,
  TeamTimesheetItem,
} from "../timesheets/types";

vi.mock("../auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../api/timesheets", () => ({
  fetchOwnTimesheet: vi.fn(),
  fetchTimesheetSummary: vi.fn(),
  fetchTeamTimesheets: vi.fn(),
  approveTimesheet: vi.fn(),
  returnTimesheet: vi.fn(),
  overrideTimesheet: vi.fn(),
  createTimesheetRow: vi.fn(),
  deleteTimesheetRow: vi.fn(),
  submitOwnTimesheet: vi.fn(),
  upsertCell: vi.fn(),
}));

vi.mock("../api/telemetry", () => ({
  fetchHealthCheck: vi.fn(),
  fetchTelemetrySummary: vi.fn(),
}));

describe("TimesheetsDashboardFlows", () => {
  const baseEmployeeTimesheet: TimesheetData = {
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
    days: ["2026-11-23", "2026-11-24", "2026-11-25", "2026-11-26", "2026-11-27", "2026-11-28", "2026-11-29"],
    day_totals: {
      "2026-11-23": "8.00",
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
      "2026-11-23": "0.00",
      "2026-11-24": "0.00",
      "2026-11-25": "0.00",
      "2026-11-26": "0.00",
      "2026-11-27": "0.00",
      "2026-11-28": "0.00",
      "2026-11-29": "0.00",
    },
    total_week_hours: "40.00",
    total_regular_hours: "40.00",
    total_overtime_hours: "0.00",
    rows: [
      {
        id: 10,
        project: { id: 101, code: "PRJ-01", name: "Turbine Plant", is_active: true },
        description: "Core turbine integration",
        row_total: "40.00",
        entries: [
          { entry_id: 1, date: "2026-11-23", hours: "8.00", note: "Kickoff inspection", is_editable: true },
          { entry_id: 2, date: "2026-11-24", hours: "8.00", note: "", is_editable: true },
          { entry_id: 3, date: "2026-11-25", hours: "8.00", note: "", is_editable: true },
          { entry_id: 4, date: "2026-11-26", hours: "8.00", note: "", is_editable: true },
          { entry_id: 5, date: "2026-11-27", hours: "8.00", note: "", is_editable: true },
          { entry_id: 6, date: "2026-11-28", hours: "0.00", note: "", is_editable: true },
          { entry_id: 7, date: "2026-11-29", hours: "0.00", note: "", is_editable: true },
        ],
      },
    ],
    assigned_projects: [
      { id: 101, code: "PRJ-01", name: "Turbine Plant", is_active: true },
      { id: 102, code: "PRJ-02", name: "Solar Field", is_active: true },
    ],
  };

  const adminSummary: DashboardSummaryData = {
    week_start_date: "2026-11-23",
    week_end_date: "2026-11-29",
    active_employees_count: 8,
    pending_approval_count: 1,
    week_submitted_count: 5,
    week_approved_count: 2,
    week_open_count: 1,
    week_returned_count: 0,
    total_hours: "280.00",
    total_regular_hours: "260.00",
    total_overtime_hours: "20.00",
  };

  const teamList: TeamTimesheetItem[] = [
    {
      id: 201,
      employee: {
        id: 5,
        code: "SYS-005",
        name: "Bob Builder",
        designation: "Site Engineer",
        department: "Operations",
      },
      week_start_date: "2026-11-23",
      week_end_date: "2026-11-29",
      status: "SUBMITTED",
      total_hours: "42.00",
      submitted_at: "2026-11-27T17:30:00Z",
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

  it("completes full employee fill, note, row addition, and submit flow", async () => {
    vi.mocked(authModule.useAuth).mockReturnValue({
      user: {
        id: "emp-10",
        full_name: "Engineer Jane",
        email: "jane@systrol.com",
        role: "EMPLOYEE",
        employee_code: "SYS-010",
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

    vi.mocked(timesheetsApi.fetchOwnTimesheet).mockResolvedValue(baseEmployeeTimesheet);
    vi.mocked(timesheetsApi.createTimesheetRow).mockResolvedValue({});
    vi.mocked(timesheetsApi.submitOwnTimesheet).mockResolvedValue({});

    render(<TimesheetsDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Turbine Plant")).toBeInTheDocument();
      expect(screen.getByText("PRJ-01")).toBeInTheDocument();
    });

    const addRowBtn = screen.getByTestId("add-project-row-btn");
    fireEvent.click(addRowBtn);

    const comboboxInput = screen.getByTestId("project-combobox-input");
    fireEvent.focus(comboboxInput);

    const optionPrj2 = screen.getByTestId("project-option-102");
    fireEvent.click(optionPrj2);

    const submitRowBtn = screen.getByTestId("add-row-submit-button");
    fireEvent.click(submitRowBtn);

    await waitFor(() => {
      expect(timesheetsApi.createTimesheetRow).toHaveBeenCalledWith({
        project_id: 102,
        week: "2026-11-23",
        description: "",
      });
    });

    const noteTrigger = screen.getByTestId("note-trigger-PRJ-01-2026-11-23");
    fireEvent.click(noteTrigger);

    const noteTextarea = screen.getByTestId("cell-note-textarea");
    expect(noteTextarea).toHaveValue("Kickoff inspection");

    fireEvent.change(noteTextarea, { target: { value: "Kickoff inspection updated" } });
    const noteSaveBtn = screen.getByTestId("save-note-btn");
    fireEvent.click(noteSaveBtn);

    const openSubmitModalBtn = screen.getByTestId("submit-timesheet-btn");
    fireEvent.click(openSubmitModalBtn);

    const submitDialog = screen.getByRole("dialog");
    const confirmSubmitBtn = within(submitDialog).getByRole("button", { name: "Submit" });
    fireEvent.click(confirmSubmitBtn);

    await waitFor(() => {
      expect(timesheetsApi.submitOwnTimesheet).toHaveBeenCalledWith("2026-11-23");
    });
  });

  it("handles week boundary navigation back and forward", async () => {
    vi.mocked(authModule.useAuth).mockReturnValue({
      user: {
        id: "emp-10",
        full_name: "Engineer Jane",
        email: "jane@systrol.com",
        role: "EMPLOYEE",
        employee_code: "SYS-010",
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

    vi.mocked(timesheetsApi.fetchOwnTimesheet).mockResolvedValue(baseEmployeeTimesheet);

    render(<TimesheetsDashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole("navigation", { name: "Week navigation" })).toBeInTheDocument();
    });

    const prevBtn = screen.getByLabelText("Previous week");
    fireEvent.click(prevBtn);

    await waitFor(() => {
      expect(timesheetsApi.fetchOwnTimesheet).toHaveBeenCalledWith("2026-11-16");
    });

    const currentBtn = screen.getByRole("button", { name: "This Week" });
    fireEvent.click(currentBtn);

    await waitFor(() => {
      expect(timesheetsApi.fetchOwnTimesheet).toHaveBeenCalledWith("2026-11-23");
    });
  });

  it("completes admin approval and return with reason flows", async () => {
    vi.mocked(authModule.useAuth).mockReturnValue({
      user: {
        id: "adm-1",
        full_name: "Admin Alice",
        email: "alice@systrol.com",
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

    vi.mocked(timesheetsApi.fetchOwnTimesheet).mockResolvedValue(baseEmployeeTimesheet);
    vi.mocked(timesheetsApi.fetchTimesheetSummary).mockResolvedValue(adminSummary);
    vi.mocked(timesheetsApi.fetchTeamTimesheets).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: teamList,
    });
    vi.mocked(timesheetsApi.returnTimesheet).mockResolvedValue({});
    vi.mocked(timesheetsApi.approveTimesheet).mockResolvedValue({});

    render(<TimesheetsDashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("admin-timesheet-tabs")).toBeInTheDocument();
    });

    const teamTab = screen.getByRole("tab", { name: /Team Timesheets/i });
    fireEvent.click(teamTab);

    expect(screen.getByText("Bob Builder")).toBeInTheDocument();

    const returnBtn = screen.getByTestId("return-btn-201");
    fireEvent.click(returnBtn);

    const returnModal = screen.getByRole("dialog");
    const reasonInput = within(returnModal).getByTestId("return-reason-textarea");
    fireEvent.change(reasonInput, { target: { value: "Hours mismatch on Friday" } });

    const confirmReturnBtn = within(returnModal).getByTestId("confirm-return-button");
    fireEvent.click(confirmReturnBtn);

    await waitFor(() => {
      expect(timesheetsApi.returnTimesheet).toHaveBeenCalledWith(201, "Hours mismatch on Friday");
    });

    const approveBtn = screen.getByTestId("approve-btn-201");
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(timesheetsApi.approveTimesheet).toHaveBeenCalledWith(201);
    });
  });

  it("completes super admin telemetry review and override flow", async () => {
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

    vi.mocked(telemetryApi.fetchHealthCheck).mockResolvedValue({
      status: "healthy",
      database: "connected",
      timestamp: "2026-11-24T03:00:00Z",
    });

    vi.mocked(telemetryApi.fetchTelemetrySummary).mockResolvedValue({
      "1h": {
        total_requests: 120,
        error_rate: 0.0,
        avg_duration_ms: 35.0,
        p95_duration_ms: 80.0,
        error_count: 0,
      },
      "24h": {
        total_requests: 2500,
        error_rate: 0.004,
        avg_duration_ms: 42.0,
        p95_duration_ms: 110.0,
        error_count: 10,
      },
      "7d": {
        total_requests: 15000,
        error_rate: 0.002,
        avg_duration_ms: 40.0,
        p95_duration_ms: 105.0,
        error_count: 30,
      },
    });

    vi.mocked(timesheetsApi.fetchTimesheetSummary).mockResolvedValue(adminSummary);
    vi.mocked(timesheetsApi.fetchTeamTimesheets).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: teamList,
    });
    vi.mocked(timesheetsApi.overrideTimesheet).mockResolvedValue({});

    render(<TimesheetsDashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("system-telemetry-cards")).toBeInTheDocument();
      expect(screen.getByText("Bob Builder")).toBeInTheDocument();
    });

    const overrideBtn = screen.getByTestId("override-btn-201");
    fireEvent.click(overrideBtn);

    const overrideModal = screen.getByRole("dialog");
    expect(within(overrideModal).getByText("Super Admin Override")).toBeInTheDocument();
  });
});
