import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@systrol/ui";
import { EmployeesPage } from "./EmployeesPage";
import * as authModule from "../../auth";
import * as employeesApi from "../../api/employees";
import * as timesheetsApi from "../../api/timesheets";
import type { EmployeeListItem, EmployeeDetailData } from "../../employees/types";
import type { TeamTimesheetItem } from "../../timesheets/types";

vi.mock("../../auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../api/employees");
vi.mock("../../api/timesheets");

describe("EmployeesFlows", () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const adminAuth = {
    user: {
      id: 1,
      employee_code: "SYS-0001",
      full_name: "Admin User",
      email: "admin@systrol.local",
      role: "ADMIN" as const,
      must_change_password: false,
    },
    isLoading: false,
    isAuthenticated: true,
    mustChangePassword: false,
    isSuperAdmin: false,
    isAdmin: true,
    isEmployee: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
  };

  const superAuth = {
    user: null,
    isLoading: false,
    isAuthenticated: true,
    mustChangePassword: false,
    isSuperAdmin: true,
    isAdmin: false,
    isEmployee: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
  };

  const mockEmployeeList: EmployeeListItem[] = [
    {
      id: 10,
      employee_code: "SYS-0010",
      email: "alice@systrol.local",
      full_name: "Alice Engineer",
      phone: "1234567890",
      designation: "Lead Engineer",
      department: "Engineering",
      role: "EMPLOYEE",
      is_active: true,
      must_change_password: false,
      revoked_at: null,
      date_joined: "2026-01-15T09:00:00Z",
      last_login: "2026-03-01T10:30:00Z",
    },
    {
      id: 11,
      employee_code: "SYS-0011",
      email: "bob.admin@systrol.local",
      full_name: "Bob Admin",
      phone: "0987654321",
      designation: "Operations Admin",
      department: "Operations",
      role: "ADMIN",
      is_active: true,
      must_change_password: false,
      revoked_at: null,
      date_joined: "2026-01-01T09:00:00Z",
      last_login: "2026-03-01T09:00:00Z",
    },
  ];

  const aliceDetail: EmployeeDetailData = {
    id: 10,
    employee_code: "SYS-0010",
    email: "alice@systrol.local",
    full_name: "Alice Engineer",
    phone: "1234567890",
    designation: "Lead Engineer",
    department: "Engineering",
    role: "EMPLOYEE",
    is_active: true,
    must_change_password: false,
    revoked_at: null,
    revoked_by: null,
    date_joined: "2026-01-15T09:00:00Z",
    last_login: "2026-03-01T10:30:00Z",
    assigned_projects: [
      { project_id: 101, code: "PRJ-001", name: "Plant Alpha" },
    ],
    recent_activity: [
      { id: 1, action: "AUTH_LOGIN", summary: "User login", created_at: "2026-03-01T10:30:00Z" },
    ],
  };

  const bobAdminDetail: EmployeeDetailData = {
    id: 11,
    employee_code: "SYS-0011",
    email: "bob.admin@systrol.local",
    full_name: "Bob Admin",
    phone: "0987654321",
    designation: "Operations Admin",
    department: "Operations",
    role: "ADMIN",
    is_active: false,
    must_change_password: true,
    revoked_at: "2026-02-28T12:00:00Z",
    revoked_by: null,
    date_joined: "2026-01-01T09:00:00Z",
    last_login: null,
    assigned_projects: [],
    recent_activity: [],
  };

  const mockTimesheets: TeamTimesheetItem[] = [
    {
      id: 88,
      employee: {
        id: 10,
        code: "SYS-0010",
        name: "Alice Engineer",
      },
      week_start_date: "2026-02-23",
      week_end_date: "2026-03-01",
      status: "APPROVED",
      total_hours: "40.00",
      submitted_at: "2026-03-01T18:00:00Z",
      approved_at: "2026-03-02T09:00:00Z",
      approved_by_label: "Admin",
      returned_at: null,
      returned_by_label: null,
      return_reason: null,
      can_approve: false,
    },
  ];

  function renderPage() {
    return render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter>
            <EmployeesPage />
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });
  });

  it("completes full employee lifecycle: create, copy temp password, view drawer, edit profile, revoke, restore, and reset password", async () => {
    vi.mocked(authModule.useAuth).mockReturnValue(adminAuth);
    vi.mocked(employeesApi.fetchEmployees).mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      results: mockEmployeeList,
    });
    vi.mocked(employeesApi.fetchEmployeeDetail).mockResolvedValue(aliceDetail);
    vi.mocked(timesheetsApi.fetchTeamTimesheets).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: mockTimesheets,
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("employee-code-10")).toHaveTextContent("SYS-0010");
    });

    const addBtn = screen.getByTestId("add-employee-btn");
    fireEvent.click(addBtn);

    expect(screen.getByTestId("create-employee-form")).toBeInTheDocument();

    vi.mocked(employeesApi.createEmployee).mockResolvedValueOnce({
      id: 12,
      employee_code: "SYS-0012",
      email: "charlie@systrol.local",
      full_name: "Charlie Welder",
      phone: "5551234567",
      designation: "Welder",
      department: "Fabrication",
      role: "EMPLOYEE",
      temporary_password: "TempPassword123!@#",
      must_change_password: true,
      date_joined: "2026-03-02T10:00:00Z",
    });

    fireEvent.change(screen.getByTestId("create-emp-name-input"), { target: { value: "Charlie Welder" } });
    fireEvent.change(screen.getByTestId("create-emp-email-input"), { target: { value: "charlie@systrol.local" } });
    fireEvent.change(screen.getByTestId("create-emp-designation-input"), { target: { value: "Welder" } });
    fireEvent.change(screen.getByTestId("create-emp-department-input"), { target: { value: "Fabrication" } });

    fireEvent.click(screen.getByTestId("create-emp-submit-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("temporary-password-modal")).toBeInTheDocument();
    });

    expect(screen.getByTestId("temp-password-value")).toHaveValue("TempPassword123!@#");
    expect(screen.getByTestId("temp-pw-code")).toHaveTextContent("SYS-0012");

    const copyBtn = screen.getByTestId("copy-temp-password-btn");
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("TempPassword123!@#");

    const doneBtn = screen.getByTestId("close-temp-password-btn");
    fireEvent.click(doneBtn);

    await waitFor(() => {
      expect(screen.queryByTestId("temporary-password-modal")).not.toBeInTheDocument();
    });

    const aliceRowCode = screen.getByTestId("employee-code-10");
    fireEvent.click(aliceRowCode);

    await waitFor(() => {
      expect(screen.getByTestId("employee-detail-drawer")).toBeInTheDocument();
    });
    expect(screen.getByTestId("drawer-emp-name")).toHaveTextContent("Alice Engineer");
    expect(screen.getByTestId("drawer-project-101")).toBeInTheDocument();
    expect(screen.getByTestId("drawer-timesheet-88")).toBeInTheDocument();

    const editBtn = screen.getByTestId("drawer-edit-btn");
    fireEvent.click(editBtn);

    await waitFor(() => {
      expect(screen.getByTestId("edit-employee-form")).toBeInTheDocument();
    });

    vi.mocked(employeesApi.updateEmployee).mockResolvedValueOnce({
      ...aliceDetail,
      designation: "Principal Engineer",
    });

    const designationInput = screen.getByTestId("edit-emp-designation-input");
    fireEvent.change(designationInput, { target: { value: "Principal Engineer" } });

    fireEvent.click(screen.getByTestId("edit-emp-submit-btn"));

    await waitFor(() => {
      expect(employeesApi.updateEmployee).toHaveBeenCalledWith(10, expect.objectContaining({
        designation: "Principal Engineer",
      }));
      expect(screen.queryByTestId("edit-employee-form")).not.toBeInTheDocument();
    });

    const revokeBtn = screen.getByTestId("drawer-revoke-btn");
    fireEvent.click(revokeBtn);

    await waitFor(() => {
      expect(screen.getByTestId("action-reason-form")).toBeInTheDocument();
    });
    expect(screen.getByTestId("action-reason-confirm-btn")).toHaveTextContent("Revoke Access");

    vi.mocked(employeesApi.revokeEmployee).mockResolvedValueOnce({
      message: "Employee access revoked successfully.",
    });

    fireEvent.change(screen.getByTestId("action-reason-textarea"), {
      target: { value: "Temporary contract ended." },
    });
    fireEvent.click(screen.getByTestId("action-reason-confirm-btn"));

    await waitFor(() => {
      expect(employeesApi.revokeEmployee).toHaveBeenCalledWith(10, "Temporary contract ended.");
      expect(screen.queryByTestId("action-reason-form")).not.toBeInTheDocument();
    });

    const revokedAliceDetail: EmployeeDetailData = {
      ...aliceDetail,
      is_active: false,
      revoked_at: "2026-03-02T12:00:00Z",
    };
    vi.mocked(employeesApi.fetchEmployeeDetail).mockResolvedValueOnce(revokedAliceDetail);

    await waitFor(() => {
      expect(screen.getByTestId("employee-code-10")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("employee-code-10"));

    await waitFor(() => {
      expect(screen.getByTestId("drawer-restore-btn")).toBeInTheDocument();
    });

    const restoreBtn = screen.getByTestId("drawer-restore-btn");
    fireEvent.click(restoreBtn);

    await waitFor(() => {
      expect(screen.getByTestId("action-reason-form")).toBeInTheDocument();
    });
    expect(screen.getByTestId("action-reason-confirm-btn")).toHaveTextContent("Restore Access");

    vi.mocked(employeesApi.restoreEmployee).mockResolvedValueOnce({
      message: "Employee access restored successfully.",
    });

    fireEvent.change(screen.getByTestId("action-reason-textarea"), {
      target: { value: "Rehired for new site contract." },
    });
    fireEvent.click(screen.getByTestId("action-reason-confirm-btn"));

    await waitFor(() => {
      expect(employeesApi.restoreEmployee).toHaveBeenCalledWith(10, "Rehired for new site contract.");
      expect(screen.queryByTestId("action-reason-form")).not.toBeInTheDocument();
    });

    vi.mocked(employeesApi.fetchEmployeeDetail).mockResolvedValueOnce(aliceDetail);

    await waitFor(() => {
      expect(screen.getByTestId("employee-code-10")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("employee-code-10"));

    await waitFor(() => {
      expect(screen.getByTestId("drawer-reset-pw-btn")).toBeInTheDocument();
    });

    vi.mocked(employeesApi.resetEmployeePassword).mockResolvedValueOnce({
      temporary_password: "NewSecretResetPassword789!#",
      message: "Temporary password issued successfully.",
    });

    const resetBtn = screen.getByTestId("drawer-reset-pw-btn");
    fireEvent.click(resetBtn);

    await waitFor(() => {
      expect(employeesApi.resetEmployeePassword).toHaveBeenCalledWith(10);
      expect(screen.getByTestId("temporary-password-modal")).toBeInTheDocument();
    });
    expect(screen.getByTestId("temp-password-value")).toHaveValue("NewSecretResetPassword789!#");
  });

  it("handles super admin recovery operations: clear lockout, reset admin password, and super restore", async () => {
    vi.mocked(authModule.useAuth).mockReturnValue(superAuth);
    vi.mocked(employeesApi.fetchEmployees).mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      results: mockEmployeeList,
    });
    vi.mocked(employeesApi.fetchEmployeeDetail).mockResolvedValue(bobAdminDetail);
    vi.mocked(timesheetsApi.fetchTeamTimesheets).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("super-clear-lockout-toolbar-btn")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("super-clear-lockout-toolbar-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("clear-lockout-form")).toBeInTheDocument();
    });

    vi.mocked(employeesApi.superClearLockout).mockResolvedValueOnce({
      message: "Lockout cleared.",
    });

    fireEvent.change(screen.getByTestId("lockout-identifier-input"), {
      target: { value: "locked.account@systrol.local" },
    });
    fireEvent.change(screen.getByTestId("lockout-ip-input"), {
      target: { value: "10.0.0.12" },
    });

    fireEvent.click(screen.getByTestId("clear-lockout-submit-btn"));

    await waitFor(() => {
      expect(employeesApi.superClearLockout).toHaveBeenCalledWith(
        "locked.account@systrol.local",
        "10.0.0.12"
      );
      expect(screen.queryByTestId("clear-lockout-form")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("employee-code-11"));

    await waitFor(() => {
      expect(screen.getByTestId("drawer-super-reset-admin-btn")).toBeInTheDocument();
    });
    expect(screen.getByTestId("drawer-clear-lockout-btn")).toBeInTheDocument();

    vi.mocked(employeesApi.superResetAdminPassword).mockResolvedValueOnce({
      temporary_password: "AdminOneTimeSuperPass555!@",
      message: "Admin password reset successfully.",
    });

    const resetAdminBtn = screen.getByTestId("drawer-super-reset-admin-btn");
    fireEvent.click(resetAdminBtn);

    await waitFor(() => {
      expect(employeesApi.superResetAdminPassword).toHaveBeenCalledWith(11);
      expect(screen.getByTestId("temporary-password-modal")).toBeInTheDocument();
    });
    expect(screen.getByTestId("temp-password-value")).toHaveValue("AdminOneTimeSuperPass555!@");

    fireEvent.click(screen.getByTestId("close-temp-password-btn"));

    const restoreAdminBtn = screen.getByTestId("drawer-restore-btn");
    fireEvent.click(restoreAdminBtn);

    await waitFor(() => {
      expect(screen.getByTestId("action-reason-form")).toBeInTheDocument();
    });

    vi.mocked(employeesApi.superRestoreAccount).mockResolvedValueOnce({
      message: "Account restored successfully.",
    });

    fireEvent.change(screen.getByTestId("action-reason-textarea"), {
      target: { value: "Restored administrator access after investigation." },
    });
    fireEvent.click(screen.getByTestId("action-reason-confirm-btn"));

    await waitFor(() => {
      expect(employeesApi.superRestoreAccount).toHaveBeenCalledWith(
        11,
        "Restored administrator access after investigation."
      );
      expect(screen.queryByTestId("action-reason-form")).not.toBeInTheDocument();
    });
  });

  it("enforces role isolation between admins and super admin", async () => {
    vi.mocked(authModule.useAuth).mockReturnValue(adminAuth);
    vi.mocked(employeesApi.fetchEmployees).mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      results: mockEmployeeList,
    });
    vi.mocked(employeesApi.fetchEmployeeDetail).mockResolvedValue(bobAdminDetail);
    vi.mocked(timesheetsApi.fetchTeamTimesheets).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("employee-code-11")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("super-clear-lockout-toolbar-btn")).not.toBeInTheDocument();

    const addBtn = screen.getByTestId("add-employee-btn");
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByTestId("create-emp-role-select")).toBeDisabled();
    });
    expect(screen.getByTestId("create-emp-role-hint")).toHaveTextContent(
      "Only Super Admin can create Administrators"
    );

    fireEvent.click(screen.getByTestId("create-emp-cancel-btn"));

    const bobRow = screen.getByTestId("employee-code-11");
    fireEvent.click(bobRow);

    await waitFor(() => {
      expect(screen.getByTestId("employee-detail-drawer")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("drawer-super-reset-admin-btn")).not.toBeInTheDocument();
    expect(screen.queryByTestId("drawer-clear-lockout-btn")).not.toBeInTheDocument();
  });
});
