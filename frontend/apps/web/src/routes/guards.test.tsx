import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import * as authModule from "../auth";
import type { CurrentUser } from "../auth";
import { RequireAnonymous, RequireAuth, RequireRole } from "./guards";
import { ForbiddenPage } from "../pages/ForbiddenPage";
import { NotFoundPage } from "../pages/NotFoundPage";

describe("Route Guards and Error Pages", () => {
  const mockAuth = (overrides: Partial<authModule.AuthContextValue>) => {
    vi.spyOn(authModule, "useAuth").mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      isSuperAdmin: false,
      isAdmin: false,
      isEmployee: false,
      mustChangePassword: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      ...overrides,
    });
  };

  it("redirects unauthenticated user to /login", () => {
    mockAuth({ isAuthenticated: false, isLoading: false });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<div>Dashboard Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Login Screen")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard Content")).not.toBeInTheDocument();
  });

  it("redirects must_change_password user to /change-password", () => {
    const user: CurrentUser = {
      id: 1,
      employee_code: "SYS-0002",
      email: "eng@systrol.com",
      full_name: "Engineer",
      role: "EMPLOYEE",
      must_change_password: true,
    };
    mockAuth({ isAuthenticated: true, user, mustChangePassword: true });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<div>Dashboard Content</div>} />
          </Route>
          <Route path="/change-password" element={<div>Change Password Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Change Password Screen")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard Content")).not.toBeInTheDocument();
  });

  it("renders protected content for authenticated user", () => {
    const user: CurrentUser = {
      id: 1,
      employee_code: "SYS-0001",
      email: "admin@systrol.com",
      full_name: "Admin",
      role: "ADMIN",
      must_change_password: false,
    };
    mockAuth({ isAuthenticated: true, user, mustChangePassword: false });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<div>Dashboard Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Dashboard Content")).toBeInTheDocument();
  });

  it("blocks unauthorized role and renders forbidden page", () => {
    const user: CurrentUser = {
      id: 1,
      employee_code: "SYS-0002",
      email: "user@systrol.com",
      full_name: "User",
      role: "EMPLOYEE",
      must_change_password: false,
    };
    mockAuth({ isAuthenticated: true, user });

    render(
      <MemoryRouter initialEntries={["/admin-only"]}>
        <Routes>
          <Route element={<RequireRole allowedRoles={["ADMIN", "SUPER"]} />}>
            <Route path="/admin-only" element={<div>Admin Secret</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("403 - Access Forbidden")).toBeInTheDocument();
    expect(screen.queryByText("Admin Secret")).not.toBeInTheDocument();
  });

  it("allows permitted role to access content", () => {
    const user: CurrentUser = {
      id: 1,
      employee_code: "SYS-0001",
      email: "admin@systrol.com",
      full_name: "Admin",
      role: "ADMIN",
      must_change_password: false,
    };
    mockAuth({ isAuthenticated: true, user, isAdmin: true });

    render(
      <MemoryRouter initialEntries={["/admin-only"]}>
        <Routes>
          <Route element={<RequireRole allowedRoles={["ADMIN", "SUPER"]} />}>
            <Route path="/admin-only" element={<div>Admin Secret</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Admin Secret")).toBeInTheDocument();
  });

  it("redirects authenticated user away from login under RequireAnonymous", () => {
    const user: CurrentUser = {
      id: 1,
      employee_code: "SYS-0001",
      email: "admin@systrol.com",
      full_name: "Admin",
      role: "ADMIN",
      must_change_password: false,
    };
    mockAuth({ isAuthenticated: true, user });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route element={<RequireAnonymous />}>
            <Route path="/login" element={<div>Login Form</div>} />
          </Route>
          <Route path="/" element={<div>Home Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Home Screen")).toBeInTheDocument();
    expect(screen.queryByText("Login Form")).not.toBeInTheDocument();
  });

  it("renders 404 Not Found page with dashboard link", () => {
    render(
      <MemoryRouter initialEntries={["/unknown"]}>
        <NotFoundPage />
      </MemoryRouter>
    );

    expect(screen.getByText("404 - Page Not Found")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to Dashboard" })).toBeInTheDocument();
  });

  it("renders 403 Forbidden page with dashboard link", () => {
    render(
      <MemoryRouter initialEntries={["/forbidden"]}>
        <ForbiddenPage />
      </MemoryRouter>
    );

    expect(screen.getByText("403 - Access Forbidden")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to Dashboard" })).toBeInTheDocument();
  });
});
