import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@systrol/ui";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as authModule from "../../auth";
import type { CurrentUser } from "../../auth";
import { AppShell } from "./AppShell";

describe("AppShell", () => {
  const mockLogout = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  const renderShell = (user: CurrentUser, initialPath = "/") => {
    const isSuper = user.role === "SUPER";
    const isAdmin = user.role === "ADMIN";
    const isEmployee = user.role === "EMPLOYEE";

    vi.spyOn(authModule, "useAuth").mockReturnValue({
      user,
      isLoading: false,
      isAuthenticated: true,
      isSuperAdmin: isSuper,
      isAdmin,
      isEmployee,
      mustChangePassword: false,
      login: vi.fn(),
      logout: mockLogout,
      refreshUser: vi.fn(),
    });

    return render(
      <ThemeProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<div>Timesheets View</div>} />
              <Route path="/timesheets" element={<div>Timesheets View</div>} />
              <Route path="/projects" element={<div>Projects View</div>} />
              <Route path="/employees" element={<div>Employees View</div>} />
              <Route path="/audit" element={<div>Audit Logs View</div>} />
            </Route>
            <Route path="/login" element={<div>Login View</div>} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  it("renders app shell layout, brand logo, and navigates on menu clicks", () => {
    const user: CurrentUser = {
      id: 1,
      employee_code: "SYS-0001",
      email: "admin@systrol.com",
      full_name: "Admin User",
      role: "ADMIN",
      must_change_password: false,
    };

    renderShell(user);

    expect(screen.getByTestId("app-shell")).toBeInTheDocument();
    expect(screen.getByText("sysTrol ERP")).toBeInTheDocument();
    expect(screen.getByText("Timesheets View")).toBeInTheDocument();
    expect(screen.getByText("Admin User")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Project Management" }));
    expect(screen.getByText("Projects View")).toBeInTheDocument();
  });

  it("toggles sidebar collapse state and updates localStorage", () => {
    const user: CurrentUser = {
      id: 2,
      employee_code: "SYS-0002",
      email: "emp@systrol.com",
      full_name: "Employee User",
      role: "EMPLOYEE",
      must_change_password: false,
    };

    renderShell(user);

    const collapseBtn = screen.getByRole("button", { name: /collapse sidebar/i });
    expect(localStorage.getItem("systrol_sidebar_collapsed")).toBe("false");

    fireEvent.click(collapseBtn);
    expect(localStorage.getItem("systrol_sidebar_collapsed")).toBe("true");

    const expandBtn = screen.getByRole("button", { name: /expand sidebar/i });
    fireEvent.click(expandBtn);
    expect(localStorage.getItem("systrol_sidebar_collapsed")).toBe("false");
  });

  it("restricts navigation items for standard employee", () => {
    const user: CurrentUser = {
      id: 2,
      employee_code: "SYS-0002",
      email: "emp@systrol.com",
      full_name: "Employee User",
      role: "EMPLOYEE",
      must_change_password: false,
    };

    renderShell(user);

    expect(screen.getByRole("button", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Project Management" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Employee Management/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /System Logs/i })).not.toBeInTheDocument();
  });

  it("shows administrative navigation items for admin", () => {
    const user: CurrentUser = {
      id: 1,
      employee_code: "SYS-0001",
      email: "admin@systrol.com",
      full_name: "Admin User",
      role: "ADMIN",
      must_change_password: false,
    };

    renderShell(user);

    expect(screen.getByRole("button", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Project Management" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Employee Management" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "System Logs" })).toBeInTheDocument();
  });

  it("shows system telemetry for super admin without change password option", () => {
    const user: CurrentUser = {
      id: "super",
      employee_code: "SUPER",
      email: "super@systrol.com",
      full_name: "Super Administrator",
      role: "SUPER",
      must_change_password: false,
    };

    renderShell(user);

    expect(screen.getByRole("button", { name: "Employee Management" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "System Logs" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "User Account Menu" }));
    expect(screen.queryByRole("menuitem", { name: "Change Password" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Sign Out" })).toBeInTheDocument();
  });

  it("calls logout when signing out from user account menu", async () => {
    const user: CurrentUser = {
      id: 1,
      employee_code: "SYS-0001",
      email: "admin@systrol.com",
      full_name: "Admin User",
      role: "ADMIN",
      must_change_password: false,
    };

    renderShell(user);

    fireEvent.click(screen.getByRole("button", { name: "User Account Menu" }));
    const signOutBtn = screen.getByRole("menuitem", { name: "Sign Out" });
    fireEvent.click(signOutBtn);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });
});
