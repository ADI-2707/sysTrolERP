import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as authModule from "../../auth";
import { ApiClientError } from "../../api";
import { LoginPage } from "./LoginPage";

describe("LoginPage", () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(authModule, "useAuth").mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      isSuperAdmin: false,
      isAdmin: false,
      isEmployee: false,
      mustChangePassword: false,
      login: mockLogin,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });
  });

  const renderLoginPage = (initialState?: Record<string, unknown>) => {
    return render(
      <MemoryRouter initialEntries={[{ pathname: "/login", state: initialState }]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>Dashboard Home</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it("renders brand panel, logo, and login form fields", () => {
    renderLoginPage();
    expect(screen.getByRole("heading", { name: "sysTrol ERP" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sign In" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Employee Code or Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("validates empty submission before calling login", async () => {
    renderLoginPage();
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
    expect(mockLogin).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Please enter both your identifier and password.");
  });

  it("submits valid credentials and navigates on success", async () => {
    mockLogin.mockResolvedValueOnce({
      id: 1,
      employee_code: "SYS-0001",
      email: "admin@systrol.com",
      full_name: "Admin User",
      role: "ADMIN",
      must_change_password: false,
    });

    renderLoginPage();
    fireEvent.change(screen.getByLabelText(/Employee Code or Email/i), {
      target: { value: "SYS-0001" },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("SYS-0001", "password123");
      expect(screen.getByText("Dashboard Home")).toBeInTheDocument();
    });
  });

  it("displays lockout banner when account is locked", async () => {
    mockLogin.mockRejectedValueOnce(
      new ApiClientError(429, {
        code: "account_locked",
        message: "Too many failed login attempts. Account is temporarily locked for 15 minutes.",
      })
    );

    renderLoginPage();
    fireEvent.change(screen.getByLabelText(/Employee Code or Email/i), {
      target: { value: "SYS-0001" },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: "wrongpassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByTestId("banner-lockout")).toBeInTheDocument();
      expect(screen.getByText(/Account is temporarily locked for 15 minutes/i)).toBeInTheDocument();
    });
  });

  it("displays revocation banner when user account is deactivated or revoked", async () => {
    mockLogin.mockRejectedValueOnce(
      new ApiClientError(401, {
        code: "authentication_failed",
        message: "Account is deactivated or revoked.",
      })
    );

    renderLoginPage();
    fireEvent.change(screen.getByLabelText(/Employee Code or Email/i), {
      target: { value: "SYS-0002" },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: "anypassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByTestId("banner-revoked")).toBeInTheDocument();
      expect(screen.getByText(/Access Revoked/i)).toBeInTheDocument();
    });
  });

  it("displays generic error banner when credentials are invalid", async () => {
    mockLogin.mockRejectedValueOnce(
      new ApiClientError(401, {
        code: "authentication_failed",
        message: "Invalid credentials.",
      })
    );

    renderLoginPage();
    fireEvent.change(screen.getByLabelText(/Employee Code or Email/i), {
      target: { value: "SYS-0001" },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: "badpass" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByTestId("banner-general")).toBeInTheDocument();
      expect(screen.getByText("Invalid credentials.")).toBeInTheDocument();
    });
  });

  it("displays UiLock with status message while login request is in flight", async () => {
    let resolveLogin: (value: unknown) => void;
    mockLogin.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveLogin = resolve;
      })
    );

    renderLoginPage();
    fireEvent.change(screen.getByLabelText(/Employee Code or Email/i), {
      target: { value: "SYS-0001" },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    expect(screen.getByTestId("ui-lock-overlay")).toBeInTheDocument();
    expect(screen.getByText("Signing in...")).toBeInTheDocument();

    resolveLogin!({
      id: 1,
      employee_code: "SYS-0001",
      email: "admin@systrol.com",
      full_name: "Admin User",
      role: "ADMIN",
      must_change_password: false,
    });

    await waitFor(() => {
      expect(screen.queryByTestId("ui-lock-overlay")).not.toBeInTheDocument();
      expect(screen.getByText("Dashboard Home")).toBeInTheDocument();
    });
  });

  it("always forces light theme and restores previous theme on unmount", () => {
    document.documentElement.setAttribute("data-theme", "dark");

    const { unmount } = renderLoginPage();

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(screen.getByTestId("login-container")).toHaveAttribute("data-theme", "light");

    unmount();

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});
