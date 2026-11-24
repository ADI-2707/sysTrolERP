import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "@systrol/ui";
import { ProjectsPage } from "./ProjectsPage";
import * as authModule from "../../auth";
import * as projectsApi from "../../api/projects";
import type { ProjectListItem } from "../../projects/types";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../api/projects", () => ({
  fetchProjects: vi.fn(),
  createProject: vi.fn(),
  fetchActiveEmployees: vi.fn(),
  fetchAssignmentMatrix: vi.fn(),
  addProjectMember: vi.fn(),
  removeProjectMember: vi.fn(),
}));

describe("ProjectsPage", () => {
  const mockProjects: ProjectListItem[] = [
    {
      id: 1,
      code: "PRJ-01",
      name: "Turbine Installation",
      slug: "turbine-installation",
      client_name: "Apex Energy",
      description: "Commissioning of 500kW turbine",
      is_active: true,
      status: "IN_PROGRESS",
      total_steps: 14,
      completed_steps: 3,
      completion_percentage: 21,
      current_step: {
        id: 4,
        key: "ENGINEERING",
        name: "Engineering",
        status: "IN_PROGRESS",
        position: 4,
      },
      member_count: 3,
      members: [
        { id: 10, employee_code: "SYS-010", full_name: "Jane Engineer" },
      ],
      created_by_label: "Admin",
      created_at: "2026-11-10T10:00:00Z",
    },
    {
      id: 2,
      code: "PRJ-02",
      name: "Solar Array Setup",
      slug: "solar-array-setup",
      client_name: "Helios Power",
      description: "Solar panel field construction",
      is_active: true,
      status: "COMPLETED",
      total_steps: 14,
      completed_steps: 14,
      completion_percentage: 100,
      current_step: {
        id: 14,
        key: "AMC",
        name: "AMC",
        status: "COMPLETED",
        position: 14,
      },
      member_count: 2,
      members: [],
      created_by_label: "Admin",
      created_at: "2026-10-01T10:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders employee view with ongoing projects and without admin tabs", async () => {
    vi.mocked(authModule.useAuth).mockReturnValue({
      user: {
        id: "emp-1",
        full_name: "John Employee",
        email: "john@systrol.com",
        role: "EMPLOYEE",
        employee_code: "SYS-001",
        must_change_password: false,
      },
      isLoading: false,
      isAuthenticated: true,
      isSuperAdmin: false,
      isAdmin: false,
      isEmployee: true,
      mustChangePassword: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.mocked(projectsApi.fetchProjects).mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      results: mockProjects,
    });

    vi.mocked(projectsApi.fetchAssignmentMatrix).mockResolvedValue({
      employees: [],
      projects: [],
      assignments: [],
    });

    render(
      <ToastProvider>
        <MemoryRouter>
          <ProjectsPage />
        </MemoryRouter>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Turbine Installation")).toBeInTheDocument();
      expect(screen.getByText("PRJ-01")).toBeInTheDocument();
      expect(screen.queryByTestId("admin-projects-tabs")).not.toBeInTheDocument();
      expect(screen.queryByText("Solar Array Setup")).not.toBeInTheDocument();
    });
  });

  it("renders admin view with Projects and Assignments tabs and switches tabs", async () => {
    vi.mocked(authModule.useAuth).mockReturnValue({
      user: {
        id: "adm-1",
        full_name: "Admin User",
        email: "admin@systrol.com",
        role: "ADMIN",
        employee_code: "SYS-ADM",
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
    });

    vi.mocked(projectsApi.fetchProjects).mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      results: mockProjects,
    });

    vi.mocked(projectsApi.fetchAssignmentMatrix).mockResolvedValue({
      employees: [],
      projects: [],
      assignments: [],
    });

    render(
      <ToastProvider>
        <MemoryRouter>
          <ProjectsPage />
        </MemoryRouter>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("admin-projects-tabs")).toBeInTheDocument();
      expect(screen.getByText("Turbine Installation")).toBeInTheDocument();
      expect(screen.getByText("Solar Array Setup")).toBeInTheDocument();
      expect(screen.getByTestId("create-project-btn")).toBeInTheDocument();
    });

    const assignmentsTab = screen.getByRole("tab", { name: "Assignments" });
    fireEvent.click(assignmentsTab);

    expect(screen.getByTestId("assignments-matrix-panel")).toBeInTheDocument();
  });

  it("filters projects by search and status", async () => {
    vi.mocked(authModule.useAuth).mockReturnValue({
      user: {
        id: "adm-1",
        full_name: "Admin User",
        email: "admin@systrol.com",
        role: "ADMIN",
        employee_code: "SYS-ADM",
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
    });

    vi.mocked(projectsApi.fetchProjects).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [mockProjects[0]],
    });

    vi.mocked(projectsApi.fetchAssignmentMatrix).mockResolvedValue({
      employees: [],
      projects: [],
      assignments: [],
    });

    render(
      <ToastProvider>
        <MemoryRouter>
          <ProjectsPage />
        </MemoryRouter>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("project-search-input")).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId("project-search-input");
    fireEvent.change(searchInput, { target: { value: "Turbine" } });

    const statusFilter = screen.getByTestId("project-status-filter");
    fireEvent.change(statusFilter, { target: { value: "IN_PROGRESS" } });

    await waitFor(() => {
      expect(projectsApi.fetchProjects).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "Turbine",
          status: "IN_PROGRESS",
        })
      );
    });
  });

  it("navigates to project detail when a card is clicked", async () => {
    vi.mocked(authModule.useAuth).mockReturnValue({
      user: {
        id: "adm-1",
        full_name: "Admin User",
        email: "admin@systrol.com",
        role: "ADMIN",
        employee_code: "SYS-ADM",
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
    });

    vi.mocked(projectsApi.fetchProjects).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [mockProjects[0]],
    });

    vi.mocked(projectsApi.fetchAssignmentMatrix).mockResolvedValue({
      employees: [],
      projects: [],
      assignments: [],
    });

    render(
      <ToastProvider>
        <MemoryRouter>
          <ProjectsPage />
        </MemoryRouter>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("project-card-1")).toBeInTheDocument();
    });

    const card = screen.getByTestId("project-card-1");
    fireEvent.click(card);

    expect(mockNavigate).toHaveBeenCalledWith("/projects/1");
  });

  it("renders empty state when no projects are returned", async () => {
    vi.mocked(authModule.useAuth).mockReturnValue({
      user: {
        id: "adm-1",
        full_name: "Admin User",
        email: "admin@systrol.com",
        role: "ADMIN",
        employee_code: "SYS-ADM",
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
    });

    vi.mocked(projectsApi.fetchProjects).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    vi.mocked(projectsApi.fetchAssignmentMatrix).mockResolvedValue({
      employees: [],
      projects: [],
      assignments: [],
    });

    render(
      <ToastProvider>
        <MemoryRouter>
          <ProjectsPage />
        </MemoryRouter>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("projects-empty-state")).toBeInTheDocument();
      expect(screen.getByText("No projects found")).toBeInTheDocument();
    });
  });

  it("opens create project modal and creates a project", async () => {
    vi.mocked(authModule.useAuth).mockReturnValue({
      user: {
        id: "adm-1",
        full_name: "Admin User",
        email: "admin@systrol.com",
        role: "ADMIN",
        employee_code: "SYS-ADM",
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
    });

    vi.mocked(projectsApi.fetchProjects).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [mockProjects[0]],
    });
    vi.mocked(projectsApi.fetchActiveEmployees).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });
    vi.mocked(projectsApi.createProject).mockResolvedValue(mockProjects[0]);

    vi.mocked(projectsApi.fetchAssignmentMatrix).mockResolvedValue({
      employees: [],
      projects: [],
      assignments: [],
    });

    render(
      <ToastProvider>
        <MemoryRouter>
          <ProjectsPage />
        </MemoryRouter>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("create-project-btn")).toBeInTheDocument();
    });

    const createBtn = screen.getByTestId("create-project-btn");
    fireEvent.click(createBtn);

    expect(screen.getByRole("heading", { name: "Create Project" })).toBeInTheDocument();

    const nameInput = screen.getByTestId("create-project-name-input");
    fireEvent.change(nameInput, { target: { value: "New Industrial Plant" } });

    const clientInput = screen.getByTestId("create-project-client-input");
    fireEvent.change(clientInput, { target: { value: "MegaCorp" } });

    const submitBtn = screen.getByTestId("submit-create-project-btn");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(projectsApi.createProject).toHaveBeenCalledWith({
        name: "New Industrial Plant",
        client_name: "MegaCorp",
        description: "",
        member_ids: [],
      });
    });
  });
});
