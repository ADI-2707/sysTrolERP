import { render, screen, act, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider, ToastProvider } from "@systrol/ui";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "../../api";
import * as authModule from "../../auth";
import type { CurrentUser } from "../../auth";
import { AppShell } from "../AppShell";
import { SessionExpiryWatcher } from "./SessionExpiryWatcher";

describe("SessionExpiry and Dynamic Topbar", () => {
  const mockUser: CurrentUser = {
    id: 1,
    employee_code: "SYS-0001",
    email: "admin@systrol.com",
    full_name: "Admin User",
    role: "ADMIN",
    must_change_password: false,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(authModule, "useAuth").mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      isSuperAdmin: false,
      isAdmin: true,
      isEmployee: false,
      mustChangePassword: false,
      login: vi.fn(),
      logout: vi.fn().mockResolvedValue(undefined),
      refreshUser: vi.fn(),
    });
  });

  it("renders dynamic breadcrumbs based on current route path", () => {
    render(
      <ThemeProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={["/projects"]}>
            <Routes>
              <Route element={<AppShell />}>
                <Route path="/projects" element={<div>Projects Screen</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </ThemeProvider>
    );

    const breadcrumbsNav = screen.getByRole("navigation", { name: /breadcrumb/i });
    expect(breadcrumbsNav).toBeInTheDocument();
    expect(within(breadcrumbsNav).getByText("Dashboard")).toBeInTheDocument();
    expect(within(breadcrumbsNav).getByText("Projects")).toBeInTheDocument();
  });

  it("triggers warning toast and redirects to /login on 401 unauthorized", async () => {
    let unauthorizedCallback: (() => void) | null = null;
    vi.spyOn(apiClient, "onUnauthorized").mockImplementation((cb) => {
      unauthorizedCallback = cb;
      return () => {
        unauthorizedCallback = null;
      };
    });

    render(
      <ThemeProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={["/timesheets"]}>
            <SessionExpiryWatcher />
            <Routes>
              <Route path="/timesheets" element={<div>Timesheets Workspace</div>} />
              <Route path="/login" element={<div>Login Screen</div>} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </ThemeProvider>
    );

    expect(screen.getByText("Timesheets Workspace")).toBeInTheDocument();

    act(() => {
      unauthorizedCallback?.();
    });

    await waitFor(() => {
      expect(screen.getByText("Login Screen")).toBeInTheDocument();
      expect(screen.getByText("Your session has expired. Please sign in again.")).toBeInTheDocument();
    });
  });
});
