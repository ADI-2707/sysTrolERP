import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { EmployeeDetailDrawer } from "./EmployeeDetailDrawer";
import * as employeesApi from "../../../api/employees";
import * as timesheetsApi from "../../../api/timesheets";
import type { EmployeeDetailData } from "../../types";
import type { TeamTimesheetItem } from "../../../timesheets/types";

vi.mock("../../../api/employees");
vi.mock("../../../api/timesheets");

const mockDetail: EmployeeDetailData = {
  id: 1,
  employee_code: "SYS-0001",
  email: "alice@systrol.local",
  full_name: "Alice Engineer",
  phone: "1234567890",
  designation: "Lead Engineer",
  department: "Engineering",
  role: "EMPLOYEE",
  is_active: true,
  must_change_password: true,
  revoked_at: null,
  revoked_by: null,
  date_joined: "2026-01-15T09:00:00Z",
  last_login: "2026-03-01T10:30:00Z",
  assigned_projects: [
    { project_id: 101, code: "PRJ-001", name: "Plant Alpha" },
    { project_id: 102, code: "PRJ-002", name: "Turbine Beta" },
  ],
  recent_activity: [
    { id: 1, action: "AUTH_LOGIN", summary: "Logged in successfully", created_at: "2026-03-01T10:30:00Z" },
  ],
};

const mockTimesheets: TeamTimesheetItem[] = [
  {
    id: 50,
    employee: {
      id: 1,
      code: "SYS-0001",
      name: "Alice Engineer",
    },
    week_start_date: "2026-02-23",
    week_end_date: "2026-03-01",
    status: "APPROVED",
    total_hours: "45.00",
    submitted_at: "2026-03-01T17:00:00Z",
    approved_at: "2026-03-02T09:00:00Z",
    approved_by_label: "Admin",
    returned_at: null,
    returned_by_label: null,
    return_reason: null,
    can_approve: false,
  },
];

function renderDrawer(props: Partial<React.ComponentProps<typeof EmployeeDetailDrawer>> = {}) {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    employeeId: 1,
    canManage: true,
    isSuperAdmin: false,
    onEditProfile: vi.fn(),
    onResetPassword: vi.fn(),
    onRevokeAccess: vi.fn(),
    ...props,
  };

  return render(
    <MemoryRouter>
      <EmployeeDetailDrawer {...defaultProps} />
    </MemoryRouter>
  );
}

describe("EmployeeDetailDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads and displays full profile, assigned projects, timesheets, and activity", async () => {
    vi.mocked(employeesApi.fetchEmployeeDetail).mockResolvedValueOnce(mockDetail);
    vi.mocked(timesheetsApi.fetchTeamTimesheets).mockResolvedValueOnce({
      count: 1,
      next: null,
      previous: null,
      results: mockTimesheets,
    });

    renderDrawer();

    expect(screen.getByTestId("employee-drawer-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("drawer-emp-name")).toHaveTextContent("Alice Engineer");
    });

    expect(screen.getByTestId("drawer-emp-code")).toHaveTextContent("SYS-0001");
    expect(screen.getByTestId("drawer-role-badge")).toHaveTextContent("EMPLOYEE");
    expect(screen.getByTestId("drawer-status-badge")).toHaveTextContent("ACTIVE");
    expect(screen.getByTestId("drawer-emp-designation")).toHaveTextContent("Lead Engineer");
    expect(screen.getByTestId("drawer-emp-department")).toHaveTextContent("Engineering");
    expect(screen.getByTestId("drawer-emp-phone")).toHaveTextContent("1234567890");
    expect(screen.getByTestId("drawer-emp-pw-status")).toHaveTextContent("Reset required on login");

    expect(screen.getByTestId("drawer-project-101")).toBeInTheDocument();
    expect(screen.getByTestId("drawer-project-102")).toBeInTheDocument();
    expect(screen.getByTestId("drawer-projects-count")).toHaveTextContent("2");

    expect(screen.getByTestId("drawer-timesheet-50")).toBeInTheDocument();
    expect(screen.getByTestId("drawer-activity-1")).toBeInTheDocument();

    expect(screen.getByTestId("drawer-edit-btn")).toBeInTheDocument();
    expect(screen.getByTestId("drawer-reset-pw-btn")).toBeInTheDocument();
    expect(screen.getByTestId("drawer-revoke-btn")).toBeInTheDocument();
  });

  it("renders empty state messages when projects, timesheets, and activity are empty", async () => {
    const emptyDetail: EmployeeDetailData = {
      ...mockDetail,
      assigned_projects: [],
      recent_activity: [],
    };
    vi.mocked(employeesApi.fetchEmployeeDetail).mockResolvedValueOnce(emptyDetail);
    vi.mocked(timesheetsApi.fetchTeamTimesheets).mockResolvedValueOnce({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    renderDrawer();

    await waitFor(() => {
      expect(screen.getByTestId("drawer-no-projects")).toBeInTheDocument();
    });
    expect(screen.getByTestId("drawer-no-timesheets")).toBeInTheDocument();
    expect(screen.getByTestId("drawer-no-activity")).toBeInTheDocument();
  });

  it("renders super admin recovery buttons only for super admin and admin accounts", async () => {
    const adminDetail: EmployeeDetailData = {
      ...mockDetail,
      role: "ADMIN",
    };
    vi.mocked(employeesApi.fetchEmployeeDetail).mockResolvedValueOnce(adminDetail);
    vi.mocked(timesheetsApi.fetchTeamTimesheets).mockResolvedValueOnce({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    const onSuperResetAdmin = vi.fn();
    const onSuperClearLockout = vi.fn();

    renderDrawer({
      isSuperAdmin: true,
      onSuperResetAdmin,
      onSuperClearLockout,
    });

    await waitFor(() => {
      expect(screen.getByTestId("drawer-super-reset-admin-btn")).toBeInTheDocument();
    });
    expect(screen.getByTestId("drawer-clear-lockout-btn")).toBeInTheDocument();
    expect(screen.queryByTestId("drawer-reset-pw-btn")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("drawer-super-reset-admin-btn"));
    expect(onSuperResetAdmin).toHaveBeenCalledWith(adminDetail);

    fireEvent.click(screen.getByTestId("drawer-clear-lockout-btn"));
    expect(onSuperClearLockout).toHaveBeenCalledWith(adminDetail);
  });

  it("renders restore button instead of revoke when account is revoked", async () => {
    const revokedDetail: EmployeeDetailData = {
      ...mockDetail,
      is_active: false,
      revoked_at: "2026-02-15T00:00:00Z",
    };
    vi.mocked(employeesApi.fetchEmployeeDetail).mockResolvedValueOnce(revokedDetail);
    vi.mocked(timesheetsApi.fetchTeamTimesheets).mockResolvedValueOnce({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    const onRestoreAccess = vi.fn();

    renderDrawer({
      onRestoreAccess,
    });

    await waitFor(() => {
      expect(screen.getByTestId("drawer-restore-btn")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("drawer-revoke-btn")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("drawer-restore-btn"));
    expect(onRestoreAccess).toHaveBeenCalledWith(revokedDetail);
  });

  it("handles fetch error and retry", async () => {
    vi.mocked(employeesApi.fetchEmployeeDetail).mockRejectedValueOnce(new Error("Failed to load"));

    renderDrawer();

    await waitFor(() => {
      expect(screen.getByTestId("employee-drawer-error")).toBeInTheDocument();
    });

    vi.mocked(employeesApi.fetchEmployeeDetail).mockResolvedValueOnce(mockDetail);
    vi.mocked(timesheetsApi.fetchTeamTimesheets).mockResolvedValueOnce({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    const retryBtn = screen.getByRole("button", { name: "Retry" });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByTestId("drawer-emp-name")).toBeInTheDocument();
    });
  });
});
