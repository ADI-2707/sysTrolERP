import { render } from "@testing-library/react";
import axe from "axe-core";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider, ToastProvider } from "@systrol/ui";
import { LoginPage } from "../pages/LoginPage";
import { ChangePasswordPage } from "../pages/ChangePasswordPage";
import { TimesheetsDashboardPage } from "../pages/TimesheetsDashboardPage";
import { ProjectsPage } from "../pages/ProjectsPage";
import { ProjectDetailPage } from "../pages/ProjectDetailPage";
import { EmployeesPage } from "../pages/EmployeesPage";
import { LogsPage } from "../pages/LogsPage";
import { SettingsPage } from "../pages/SettingsPage";
import { NotFoundPage } from "../pages/NotFoundPage";

vi.mock("../auth", () => ({
  useAuth: () => ({
    user: {
      id: 1,
      employee_code: "SYS-0001",
      full_name: "Admin Alice",
      email: "alice@systrol.local",
      role: "ADMIN",
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
  }),
}));

vi.mock("../api", () => ({
  apiClient: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/auth/csrf/")) return Promise.resolve({ csrfToken: "dummy" });
      if (url.includes("/api/timesheets/summary/")) {
        return Promise.resolve({ current_week_total: "40.00", overtime_total: "0.00", approval_pending_count: 0 });
      }
      if (url.includes("/api/timesheets/my-weeks/")) {
        return Promise.resolve({
          week_start: "2026-03-30",
          week_end: "2026-04-05",
          status: "OPEN",
          policy: { daily_regular_hours: "8.00", hour_step: "0.25", break_duration_hours: "1.00", overtime_threshold_daily: "8.00" },
          days: [],
          rows: [],
        });
      }
      if (url.includes("/api/projects/")) {
        return Promise.resolve({ count: 0, next: null, previous: null, results: [] });
      }
      if (url.includes("/api/employees/")) {
        return Promise.resolve({ count: 0, next: null, previous: null, results: [] });
      }
      if (url.includes("/api/audit/logs/")) {
        return Promise.resolve({ next: null, previous: null, results: [] });
      }
      if (url.includes("/api/telemetry/requests/")) {
        return Promise.resolve({ next: null, previous: null, results: [] });
      }
      if (url.includes("/api/telemetry/errors/")) {
        return Promise.resolve({ next: null, previous: null, results: [] });
      }
      if (url.includes("/api/telemetry/summary/")) {
        return Promise.resolve({
          "1h": { total_requests: 10, error_count: 0, avg_duration_ms: 20, p95_duration_ms: 50 },
          "24h": { total_requests: 100, error_count: 1, avg_duration_ms: 25, p95_duration_ms: 60 },
          "7d": { total_requests: 500, error_count: 5, avg_duration_ms: 22, p95_duration_ms: 55 },
        });
      }
      if (url.includes("/api/timesheets/policy/")) {
        return Promise.resolve({
          standard_start_time: "09:00:00",
          standard_end_time: "18:00:00",
          daily_regular_hours: "8.00",
          break_duration_hours: "1.00",
          hour_step: "0.25",
          overtime_threshold_daily: "8.00",
        });
      }
      return Promise.resolve({});
    }),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
  ApiClientError: class ApiClientError extends Error {},
}));

async function expectNoAxeViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      "color-contrast": { enabled: false },
    },
  });
  expect(results.violations).toEqual([]);
}

function renderInTheme(element: React.ReactNode, theme: "light" | "dark", initialEntry = "/") {
  return render(
    <div data-theme={theme} style={{ backgroundColor: theme === "dark" ? "#0b1411" : "#f8fafc" }}>
      <ThemeProvider defaultTheme={theme}>
        <ToastProvider>
          <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
              <Route path="*" element={element} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </ThemeProvider>
    </div>
  );
}

describe("Accessibility Sweep (axe) across all pages and themes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const themes: ("light" | "dark")[] = ["light", "dark"];

  for (const theme of themes) {
    describe(`Theme: ${theme}`, () => {
      it(`passes axe checks on LoginPage (${theme})`, async () => {
        const { container } = renderInTheme(<LoginPage />, theme, "/login");
        await expectNoAxeViolations(container);
      });

      it(`passes axe checks on ChangePasswordPage (${theme})`, async () => {
        const { container } = renderInTheme(<ChangePasswordPage />, theme, "/change-password");
        await expectNoAxeViolations(container);
      });

      it(`passes axe checks on TimesheetsDashboardPage (${theme})`, async () => {
        const { container } = renderInTheme(<TimesheetsDashboardPage />, theme, "/timesheets");
        await expectNoAxeViolations(container);
      });

      it(`passes axe checks on ProjectsPage (${theme})`, async () => {
        const { container } = renderInTheme(<ProjectsPage />, theme, "/projects");
        await expectNoAxeViolations(container);
      });

      it(`passes axe checks on ProjectDetailPage (${theme})`, async () => {
        const { container } = renderInTheme(<ProjectDetailPage />, theme, "/projects/1");
        await expectNoAxeViolations(container);
      });

      it(`passes axe checks on EmployeesPage (${theme})`, async () => {
        const { container } = renderInTheme(<EmployeesPage />, theme, "/employees");
        await expectNoAxeViolations(container);
      });

      it(`passes axe checks on LogsPage (${theme})`, async () => {
        const { container } = renderInTheme(<LogsPage />, theme, "/audit");
        await expectNoAxeViolations(container);
      });

      it(`passes axe checks on SettingsPage (${theme})`, async () => {
        const { container } = renderInTheme(<SettingsPage />, theme, "/settings");
        await expectNoAxeViolations(container);
      });

      it(`passes axe checks on NotFoundPage (${theme})`, async () => {
        const { container } = renderInTheme(<NotFoundPage />, theme, "/404");
        await expectNoAxeViolations(container);
      });
    });
  }
});
