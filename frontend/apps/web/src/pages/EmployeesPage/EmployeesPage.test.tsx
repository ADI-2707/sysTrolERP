import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@systrol/ui";
import { EmployeesPage } from "./EmployeesPage";
import * as employeesApi from "../../api/employees";
import * as authModule from "../../auth";
import type { EmployeeListItem } from "../../employees/types";

vi.mock("../../api/employees");
vi.mock("../../auth", () => ({
  useAuth: vi.fn(),
}));

const mockEmployees: EmployeeListItem[] = [
  {
    id: 1,
    employee_code: "SYS-0001",
    email: "alice@systrol.local",
    full_name: "Alice Engineer",
    phone: "1234567890",
    designation: "Lead Engineer",
    department: "Engineering",
    role: "ADMIN",
    is_active: true,
    must_change_password: false,
    revoked_at: null,
    date_joined: "2026-01-15T09:00:00Z",
    last_login: "2026-03-01T10:30:00Z",
  },
  {
    id: 2,
    employee_code: "SYS-0002",
    email: "bob@systrol.local",
    full_name: "Bob Operator",
    phone: "0987654321",
    designation: "Site Operator",
    department: "Operations",
    role: "EMPLOYEE",
    is_active: false,
    must_change_password: false,
    revoked_at: "2026-02-20T12:00:00Z",
    date_joined: "2026-02-01T09:00:00Z",
    last_login: null,
  },
];

function renderEmployeesPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

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

describe("EmployeesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authModule.useAuth).mockReturnValue({
      user: {
        id: 1,
        employee_code: "SYS-0001",
        email: "admin@systrol.local",
        full_name: "Admin User",
        role: "ADMIN",
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
    });
  });

  it("renders employee table with code, name, email, designation, department, role, status, joined and login", async () => {
    vi.mocked(employeesApi.fetchEmployees).mockResolvedValueOnce({
      count: 2,
      next: null,
      previous: null,
      results: mockEmployees,
    });

    renderEmployeesPage();

    expect(screen.getByTestId("employees-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("employee-code-1")).toHaveTextContent("SYS-0001");
    });

    expect(screen.getByTestId("employee-name-1")).toHaveTextContent("Alice Engineer");
    expect(screen.getByTestId("employee-email-1")).toHaveTextContent("alice@systrol.local");
    expect(screen.getByTestId("employee-designation-1")).toHaveTextContent("Lead Engineer");
    expect(screen.getByTestId("employee-department-1")).toHaveTextContent("Engineering");
    expect(screen.getByTestId("employee-role-badge-1")).toHaveTextContent("ADMIN");
    expect(screen.getByTestId("employee-status-badge-1")).toHaveTextContent("ACTIVE");
    expect(screen.getByTestId("employee-login-1")).not.toHaveTextContent("Never");

    expect(screen.getByTestId("employee-code-2")).toHaveTextContent("SYS-0002");
    expect(screen.getByTestId("employee-name-2")).toHaveTextContent("Bob Operator");
    expect(screen.getByTestId("employee-email-2")).toHaveTextContent("bob@systrol.local");
    expect(screen.getByTestId("employee-role-badge-2")).toHaveTextContent("EMPLOYEE");
    expect(screen.getByTestId("employee-status-badge-2")).toHaveTextContent("REVOKED");
    expect(screen.getByTestId("employee-login-2")).toHaveTextContent("Never");
  });

  it("handles search input filtering", async () => {
    vi.mocked(employeesApi.fetchEmployees).mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      results: mockEmployees,
    });

    renderEmployeesPage();

    await waitFor(() => {
      expect(screen.getByTestId("employee-code-1")).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId("employee-search-input");
    fireEvent.change(searchInput, { target: { value: "Alice" } });

    await waitFor(() => {
      expect(employeesApi.fetchEmployees).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "Alice",
          page: 1,
        })
      );
    });
  });

  it("handles role filter change", async () => {
    vi.mocked(employeesApi.fetchEmployees).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [mockEmployees[0]],
    });

    renderEmployeesPage();

    await waitFor(() => {
      expect(screen.getByTestId("employee-code-1")).toBeInTheDocument();
    });

    const roleSelect = screen.getByTestId("employee-role-filter");
    fireEvent.change(roleSelect, { target: { value: "ADMIN" } });

    await waitFor(() => {
      expect(employeesApi.fetchEmployees).toHaveBeenCalledWith(
        expect.objectContaining({
          role: "ADMIN",
          page: 1,
        })
      );
    });
  });

  it("handles status filter change", async () => {
    vi.mocked(employeesApi.fetchEmployees).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [mockEmployees[0]],
    });

    renderEmployeesPage();

    await waitFor(() => {
      expect(screen.getByTestId("employee-code-1")).toBeInTheDocument();
    });

    const statusSelect = screen.getByTestId("employee-status-filter");
    fireEvent.change(statusSelect, { target: { value: "active" } });

    await waitFor(() => {
      expect(employeesApi.fetchEmployees).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "active",
          page: 1,
        })
      );
    });
  });

  it("handles sorting toggle", async () => {
    vi.mocked(employeesApi.fetchEmployees).mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      results: mockEmployees,
    });

    renderEmployeesPage();

    await waitFor(() => {
      expect(screen.getByTestId("employee-code-1")).toBeInTheDocument();
    });

    const nameHeader = screen.getByText("Name");
    fireEvent.click(nameHeader);

    await waitFor(() => {
      expect(employeesApi.fetchEmployees).toHaveBeenCalledWith(
        expect.objectContaining({
          ordering: "full_name",
        })
      );
    });
  });

  it("renders pagination and handles page change", async () => {
    vi.mocked(employeesApi.fetchEmployees).mockResolvedValue({
      count: 45,
      next: "http://example.com/?page=2",
      previous: null,
      results: mockEmployees,
    });

    renderEmployeesPage();

    await waitFor(() => {
      expect(screen.getByTestId("employees-pagination-meta")).toHaveTextContent("Showing 1-20 of 45 employees");
    });

    const nextBtn = screen.getByRole("button", { name: /Next page/i });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(employeesApi.fetchEmployees).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        })
      );
    });
  });

  it("shows empty state when no employees match query", async () => {
    vi.mocked(employeesApi.fetchEmployees).mockResolvedValueOnce({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    renderEmployeesPage();

    await waitFor(() => {
      expect(screen.getByTestId("employees-empty-state")).toBeInTheDocument();
    });
    expect(screen.getByText("No employees found")).toBeInTheDocument();
  });

  it("shows error alert and allows retry", async () => {
    vi.mocked(employeesApi.fetchEmployees).mockRejectedValueOnce(new Error("Network error"));

    renderEmployeesPage();

    await waitFor(() => {
      expect(screen.getByTestId("employees-error")).toBeInTheDocument();
    });
    expect(screen.getByText("Network error")).toBeInTheDocument();

    vi.mocked(employeesApi.fetchEmployees).mockResolvedValueOnce({
      count: 2,
      next: null,
      previous: null,
      results: mockEmployees,
    });

    const retryBtn = screen.getByTestId("employees-retry-btn");
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByTestId("employee-code-1")).toBeInTheDocument();
    });
  });
});