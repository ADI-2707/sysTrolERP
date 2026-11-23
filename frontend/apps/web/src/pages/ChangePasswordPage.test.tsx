import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as authModule from "../auth";
import { apiClient, ApiClientError } from "../api";
import { ChangePasswordPage } from "./ChangePasswordPage";

describe("ChangePasswordPage", () => {
  const mockRefreshUser = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const renderPage = (isSuper = false) => {
    vi.spyOn(authModule, "useAuth").mockReturnValue({
      user: {
        id: 1,
        employee_code: isSuper ? "SUPER" : "SYS-0002",
        email: "user@systrol.com",
        full_name: "User",
        role: isSuper ? "SUPER" : "EMPLOYEE",
        must_change_password: true,
      },
      isLoading: false,
      isAuthenticated: true,
      isSuperAdmin: isSuper,
      isAdmin: false,
      isEmployee: !isSuper,
      mustChangePassword: true,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: mockRefreshUser,
    });

    return render(
      <MemoryRouter initialEntries={["/change-password"]}>
        <Routes>
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/" element={<div>Dashboard Home</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it("renders password change form for standard employee", () => {
    renderPage(false);
    expect(screen.getByRole("heading", { name: "Set New Password" })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Current Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^New Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Confirm New Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update Password & Continue" })).toBeInTheDocument();
  });

  it("validates password length and matching confirmation", async () => {
    renderPage(false);

    fireEvent.change(screen.getByLabelText(/^Current Password/i), {
      target: { value: "oldpassword123" },
    });
    fireEvent.change(screen.getByLabelText(/^New Password/i), {
      target: { value: "short" },
    });
    fireEvent.change(screen.getByLabelText(/^Confirm New Password/i), {
      target: { value: "different" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update Password & Continue" }));

    expect(screen.getByText("Password must be at least 10 characters long.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^New Password/i), {
      target: { value: "longenoughpassword123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update Password & Continue" }));

    expect(screen.getByText("New passwords do not match.")).toBeInTheDocument();
  });

  it("submits valid passwords and navigates to dashboard", async () => {
    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValueOnce({
      message: "Password changed successfully.",
    });
    mockRefreshUser.mockResolvedValueOnce(null);

    renderPage(false);

    fireEvent.change(screen.getByLabelText(/^Current Password/i), {
      target: { value: "oldpassword123" },
    });
    fireEvent.change(screen.getByLabelText(/^New Password/i), {
      target: { value: "brandnewsecurepassword123" },
    });
    fireEvent.change(screen.getByLabelText(/^Confirm New Password/i), {
      target: { value: "brandnewsecurepassword123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update Password & Continue" }));

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith("/api/auth/password/change", {
        current_password: "oldpassword123",
        new_password: "brandnewsecurepassword123",
        confirm_password: "brandnewsecurepassword123",
      });
      expect(mockRefreshUser).toHaveBeenCalled();
      expect(screen.getByText("Dashboard Home")).toBeInTheDocument();
    });
  });

  it("displays backend validation errors", async () => {
    vi.spyOn(apiClient, "post").mockRejectedValueOnce(
      new ApiClientError(400, {
        code: "validation_error",
        message: "Validation failed.",
        fields: {
          current_password: ["Current password is incorrect."],
        },
      })
    );

    renderPage(false);

    fireEvent.change(screen.getByLabelText(/^Current Password/i), {
      target: { value: "wrongoldpass" },
    });
    fireEvent.change(screen.getByLabelText(/^New Password/i), {
      target: { value: "brandnewsecurepassword123" },
    });
    fireEvent.change(screen.getByLabelText(/^Confirm New Password/i), {
      target: { value: "brandnewsecurepassword123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update Password & Continue" }));

    await waitFor(() => {
      expect(screen.getByText("Current password is incorrect.")).toBeInTheDocument();
    });
  });

  it("displays notice when user is super administrator", () => {
    renderPage(true);
    expect(screen.getByRole("heading", { name: "Super Administrator Notice" })).toBeInTheDocument();
    expect(screen.getByText(/configured via environment variables/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to Dashboard" })).toBeInTheDocument();
  });
});
