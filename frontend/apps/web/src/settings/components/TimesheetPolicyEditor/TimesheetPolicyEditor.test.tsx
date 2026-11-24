import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TimesheetPolicyEditor } from "./TimesheetPolicyEditor";
import { ToastProvider } from "@systrol/ui";
import * as policyApi from "../../../api/timesheetPolicy";
import * as authHook from "../../../auth";
import type { TimesheetPolicyData } from "../../../timesheets/types";

vi.mock("../../../api/timesheetPolicy", () => ({
  fetchTimesheetPolicy: vi.fn(),
  updateTimesheetPolicy: vi.fn(),
}));

vi.mock("../../../auth", () => ({
  useAuth: vi.fn(),
}));

const mockPolicy: TimesheetPolicyData = {
  standard_start_time: "09:00:00",
  standard_end_time: "18:00:00",
  daily_regular_hours: "8.00",
  break_duration_hours: "1.00",
  hour_step: "0.25",
  overtime_threshold_daily: "8.00",
  updated_at: "2026-03-31T10:00:00Z",
};

function renderEditor() {
  return render(
    <ToastProvider>
      <TimesheetPolicyEditor />
    </ToastProvider>
  );
}

describe("TimesheetPolicyEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders read-only notice and disables inputs for regular users", async () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: null,
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

    vi.mocked(policyApi.fetchTimesheetPolicy).mockResolvedValueOnce(mockPolicy);

    renderEditor();

    expect(screen.getByTestId("policy-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("timesheet-policy-editor")).toBeInTheDocument();
      expect(screen.getByTestId("policy-readonly-notice")).toBeInTheDocument();
    });

    expect(screen.getByTestId("input-start-time")).toBeDisabled();
    expect(screen.getByTestId("input-regular-hours")).toBeDisabled();
    expect(screen.queryByTestId("submit-policy-btn")).not.toBeInTheDocument();
  });

  it("allows super admin to edit and save policy parameters", async () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: null,
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

    vi.mocked(policyApi.fetchTimesheetPolicy).mockResolvedValueOnce(mockPolicy);
    vi.mocked(policyApi.updateTimesheetPolicy).mockResolvedValueOnce({
      ...mockPolicy,
      daily_regular_hours: "7.50",
    });

    renderEditor();

    await waitFor(() => {
      expect(screen.getByTestId("submit-policy-btn")).toBeInTheDocument();
    });

    const hoursInput = screen.getByTestId("input-regular-hours");
    expect(hoursInput).not.toBeDisabled();
    fireEvent.change(hoursInput, { target: { value: "7.50" } });

    fireEvent.click(screen.getByTestId("submit-policy-btn"));

    await waitFor(() => {
      expect(policyApi.updateTimesheetPolicy).toHaveBeenCalledWith(
        expect.objectContaining({
          daily_regular_hours: "7.50",
        })
      );
    });
  });

  it("displays error message if update fails", async () => {
    vi.mocked(authHook.useAuth).mockReturnValue({
      user: null,
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

    vi.mocked(policyApi.fetchTimesheetPolicy).mockResolvedValueOnce(mockPolicy);
    vi.mocked(policyApi.updateTimesheetPolicy).mockRejectedValueOnce(
      new Error("Daily regular hours must be greater than zero.")
    );

    renderEditor();

    await waitFor(() => {
      expect(screen.getByTestId("submit-policy-btn")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("submit-policy-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("policy-error-alert")).toBeInTheDocument();
      expect(screen.getByText("Daily regular hours must be greater than zero.")).toBeInTheDocument();
    });
  });
});
