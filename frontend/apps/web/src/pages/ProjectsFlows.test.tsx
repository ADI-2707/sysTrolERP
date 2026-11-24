import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ToastProvider } from "@systrol/ui";
import { ProjectsPage } from "./ProjectsPage";
import { ProjectDetailPage } from "./ProjectDetailPage";
import * as authModule from "../auth";
import * as projectsApi from "../api/projects";
import type {
  ProjectListItem,
  ProjectDetailData,
  AssignmentMatrixData,
} from "../projects/types";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../api/projects", () => ({
  fetchProjects: vi.fn(),
  fetchProjectDetail: vi.fn(),
  createProject: vi.fn(),
  updateStepStatus: vi.fn(),
  insertSubStep: vi.fn(),
  updateSubStep: vi.fn(),
  deleteSubStep: vi.fn(),
  addProjectMember: vi.fn(),
  removeProjectMember: vi.fn(),
  fetchActiveEmployees: vi.fn(),
  fetchAssignmentMatrix: vi.fn(),
}));

describe("ProjectsFlows", () => {
  const adminUser = {
    id: 1,
    employee_code: "SYS-001",
    full_name: "Admin John",
    role: "ADMIN" as const,
    email: "admin@systrol.com",
    must_change_password: false,
  };

  const employeeUser = {
    id: 20,
    employee_code: "SYS-020",
    full_name: "Alice Engineer",
    role: "EMPLOYEE" as const,
    email: "alice@systrol.com",
    must_change_password: false,
  };

  const mockProjectsList: ProjectListItem[] = [
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
        id: 104,
        key: "ENGINEERING",
        name: "Engineering",
        status: "IN_PROGRESS",
        position: 4,
      },
      member_count: 2,
      members: [
        { id: 20, employee_code: "SYS-020", full_name: "Alice Engineer" },
      ],
      created_by_label: "Admin John",
      created_at: "2026-11-10T10:00:00Z",
    },
    {
      id: 2,
      code: "PRJ-02",
      name: "Solar Array Setup",
      slug: "solar-array-setup",
      client_name: "Helios Power",
      description: "Solar photovoltaic farm",
      is_active: false,
      status: "COMPLETED",
      total_steps: 14,
      completed_steps: 14,
      completion_percentage: 100,
      current_step: null,
      member_count: 1,
      members: [],
      created_by_label: "Admin John",
      created_at: "2026-10-01T10:00:00Z",
    },
  ];

  const mockProjectDetail: ProjectDetailData = {
    id: 1,
    code: "PRJ-01",
    name: "Turbine Installation",
    slug: "turbine-installation",
    client_name: "Apex Energy",
    description: "Commissioning of 500kW turbine",
    is_active: true,
    status: "IN_PROGRESS",
    creator: {
      id: 1,
      employee_code: "SYS-001",
      full_name: "Admin John",
    },
    created_at: "2026-11-10T10:00:00Z",
    completion_percentage: 21,
    total_steps: 14,
    completed_steps: 3,
    steps: [
      { id: 101, key: "ENQUIRY", name: "Enquiry", position: 1, is_custom: false, status: "COMPLETED", confirmed_at: "2026-11-11T12:00:00Z", confirmed_by_label: "Admin John" },
      { id: 102, key: "SALES_VISIT", name: "Sales Visit", position: 2, is_custom: false, status: "COMPLETED", confirmed_at: "2026-11-12T12:00:00Z", confirmed_by_label: "Admin John" },
      { id: 103, key: "PROCUREMENT", name: "Procurement", position: 3, is_custom: false, status: "COMPLETED", confirmed_at: "2026-11-13T12:00:00Z", confirmed_by_label: "Admin John" },
      { id: 104, key: "ENGINEERING", name: "Engineering", position: 4, is_custom: false, status: "IN_PROGRESS", confirmed_at: null, confirmed_by_label: null },
      { id: 105, key: "MANUFACTURING", name: "Manufacturing", position: 5, is_custom: false, status: "NOT_STARTED", confirmed_at: null, confirmed_by_label: null },
      { id: 199, key: "SUB_MFG_1", name: "Custom Tooling Verification", position: 6, is_custom: true, status: "NOT_STARTED", confirmed_at: null, confirmed_by_label: null },
      { id: 106, key: "AMC", name: "Annual Maintenance Contract", position: 7, is_custom: false, status: "NOT_STARTED", confirmed_at: null, confirmed_by_label: null },
    ],
    members: [
      { id: 20, employee_code: "SYS-020", full_name: "Alice Engineer", designation: "Senior Lead", department: "Engineering" },
    ],
  };

  const mockMatrix: AssignmentMatrixData = {
    employees: [
      { id: 20, code: "SYS-020", name: "Alice Engineer" },
      { id: 21, code: "SYS-021", name: "Bob Technician" },
    ],
    projects: [
      { id: 1, code: "PRJ-01", slug: "turbine-installation", name: "Turbine Installation" },
    ],
    assignments: [
      { employee_id: 20, project_id: 1 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderApp = (initialRoute = "/projects", role: "ADMIN" | "EMPLOYEE" = "ADMIN") => {
    const user = role === "ADMIN" ? adminUser : employeeUser;
    vi.mocked(authModule.useAuth).mockReturnValue({
      user,
      isAdmin: role === "ADMIN",
      isSuperAdmin: false,
      isEmployee: role === "EMPLOYEE",
      isAuthenticated: true,
      isLoading: false,
      mustChangePassword: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    return render(
      <ToastProvider>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    );
  };

  it("admin project lifecycle: view projects, create project, and click card to navigate", async () => {
    vi.mocked(projectsApi.fetchProjects).mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      results: mockProjectsList,
    });
    vi.mocked(projectsApi.fetchActiveEmployees).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [{ id: 20, employee_code: "SYS-020", full_name: "Alice Engineer" }],
    });
    vi.mocked(projectsApi.createProject).mockResolvedValue({
      id: 3,
      code: "PRJ-03",
      name: "Wind Turbine Stage 2",
      slug: "wind-turbine-stage-2",
      client_name: "Breeze Co",
      description: "Phase two construction",
      is_active: true,
      status: "NOT_STARTED",
      total_steps: 14,
      completed_steps: 0,
      completion_percentage: 0,
      current_step: null,
      member_count: 0,
      members: [],
      created_by_label: "Admin John",
      created_at: "2026-11-24T10:00:00Z",
    });

    renderApp("/projects", "ADMIN");

    await waitFor(() => {
      expect(screen.getByText("Turbine Installation")).toBeInTheDocument();
      expect(screen.getByText("Solar Array Setup")).toBeInTheDocument();
    });

    const createBtn = screen.getByTestId("create-project-btn");
    fireEvent.click(createBtn);

    const form = screen.getByTestId("create-project-form");
    expect(form).toBeInTheDocument();

    const nameInput = screen.getByTestId("create-project-name-input");
    fireEvent.change(nameInput, { target: { value: "Wind Turbine Stage 2" } });

    const submitBtn = screen.getByTestId("submit-create-project-btn");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(projectsApi.createProject).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Wind Turbine Stage 2" })
      );
    });

    const projectCard = screen.getByTestId("project-card-1");
    fireEvent.click(projectCard);
    expect(mockNavigate).toHaveBeenCalledWith("/projects/1");
  });

  it("admin step status workflow: advance step and modal confirmation for completion", async () => {
    vi.mocked(projectsApi.fetchProjectDetail).mockResolvedValue(mockProjectDetail);
    vi.mocked(projectsApi.updateStepStatus).mockResolvedValue({
      id: 104,
      key: "ENGINEERING",
      name: "Engineering",
      position: 4,
      is_custom: false,
      status: "COMPLETED",
      confirmed_at: "2026-11-24T10:00:00Z",
      confirmed_by_label: "Admin John",
    });

    renderApp("/projects/1", "ADMIN");

    await waitFor(() => {
      expect(screen.getByTestId("project-detail-page")).toBeInTheDocument();
      expect(screen.getByText("Turbine Installation")).toBeInTheDocument();
    });

    expect(screen.getByTestId("step-locked-tag-101")).toBeInTheDocument();
    expect(screen.getByTestId("step-locked-tag-102")).toBeInTheDocument();
    expect(screen.getByTestId("step-locked-tag-103")).toBeInTheDocument();

    const advanceBtn = screen.getByTestId("advance-step-btn-104");
    fireEvent.click(advanceBtn);

    const modal = screen.getByTestId("complete-step-modal");
    expect(modal).toBeInTheDocument();
    expect(within(modal).getByText(/Engineering/)).toBeInTheDocument();

    const confirmBtn = screen.getByTestId("confirm-complete-step-btn");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(projectsApi.updateStepStatus).toHaveBeenCalledWith(1, 104, "COMPLETED", true);
    });
  });

  it("sub-step rules and operations: insert affordance, edit, and delete custom step", async () => {
    vi.mocked(projectsApi.fetchProjectDetail).mockResolvedValue(mockProjectDetail);
    vi.mocked(projectsApi.insertSubStep).mockResolvedValue({
      id: 200,
      key: "SUB_ENG_2",
      name: "Safety Audit",
      position: 5,
      is_custom: true,
      status: "NOT_STARTED",
      confirmed_at: null,
      confirmed_by_label: null,
    });
    vi.mocked(projectsApi.updateSubStep).mockResolvedValue({
      id: 199,
      key: "SUB_MFG_1",
      name: "Custom Tooling Approved",
      position: 6,
      is_custom: true,
      status: "NOT_STARTED",
      confirmed_at: null,
      confirmed_by_label: null,
    });
    vi.mocked(projectsApi.deleteSubStep).mockResolvedValue(undefined);

    renderApp("/projects/1", "ADMIN");

    await waitFor(() => {
      expect(screen.getByTestId("project-detail-page")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("insert-substep-after-101")).not.toBeInTheDocument();
    expect(screen.queryByTestId("insert-substep-after-102")).not.toBeInTheDocument();

    expect(screen.getByTestId("insert-substep-after-103")).toBeInTheDocument();
    expect(screen.getByTestId("insert-substep-after-104")).toBeInTheDocument();

    expect(screen.queryByTestId("insert-substep-after-106")).not.toBeInTheDocument();

    const editBtn = screen.getByTestId("edit-substep-btn-199");
    fireEvent.click(editBtn);

    const editModal = screen.getByTestId("edit-substep-modal");
    expect(editModal).toBeInTheDocument();

    const editInput = screen.getByTestId("edit-substep-name-input");
    fireEvent.change(editInput, { target: { value: "Custom Tooling Approved" } });

    const confirmEditBtn = screen.getByTestId("confirm-edit-substep-btn");
    fireEvent.click(confirmEditBtn);

    await waitFor(() => {
      expect(projectsApi.updateSubStep).toHaveBeenCalledWith(1, 199, "Custom Tooling Approved");
    });

    const deleteBtn = screen.getByTestId("delete-substep-btn-199");
    fireEvent.click(deleteBtn);

    const deleteModal = screen.getByTestId("delete-substep-modal");
    expect(deleteModal).toBeInTheDocument();

    const confirmDeleteBtn = screen.getByTestId("confirm-delete-substep-btn");
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(projectsApi.deleteSubStep).toHaveBeenCalledWith(1, 199);
    });
  });

  it("assignments matrix workflow: view, filter, and toggle assignments", async () => {
    vi.mocked(projectsApi.fetchProjects).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [mockProjectsList[0]],
    });
    vi.mocked(projectsApi.fetchAssignmentMatrix).mockResolvedValue(mockMatrix);
    vi.mocked(projectsApi.addProjectMember).mockResolvedValue(undefined);
    vi.mocked(projectsApi.removeProjectMember).mockResolvedValue(undefined);

    renderApp("/projects", "ADMIN");

    await waitFor(() => {
      expect(screen.getByTestId("admin-projects-tabs")).toBeInTheDocument();
    });

    const assignmentsTab = screen.getByRole("tab", { name: "Assignments" });
    fireEvent.click(assignmentsTab);

    await waitFor(() => {
      expect(screen.getByTestId("assignment-matrix")).toBeInTheDocument();
    });

    expect(screen.getByTestId("matrix-dot-20-1")).toBeInTheDocument();
    expect(screen.queryByTestId("matrix-dot-21-1")).not.toBeInTheDocument();

    const unassignedCell = screen.getByTestId("matrix-cell-21-1");
    fireEvent.click(unassignedCell);

    await waitFor(() => {
      expect(projectsApi.addProjectMember).toHaveBeenCalledWith(1, 21);
    });

    const assignedCell = screen.getByTestId("matrix-cell-20-1");
    fireEvent.click(assignedCell);

    await waitFor(() => {
      expect(projectsApi.removeProjectMember).toHaveBeenCalledWith(1, 20);
    });
  });

  it("employee access matrix enforcement: ongoing projects only, no admin tabs, read-only detail", async () => {
    vi.mocked(projectsApi.fetchProjects).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [mockProjectsList[0]],
    });
    vi.mocked(projectsApi.fetchProjectDetail).mockResolvedValue(mockProjectDetail);

    renderApp("/projects", "EMPLOYEE");

    await waitFor(() => {
      expect(screen.getByText("Turbine Installation")).toBeInTheDocument();
    });

    expect(screen.queryByText("Solar Array Setup")).not.toBeInTheDocument();
    expect(screen.queryByTestId("admin-projects-tabs")).not.toBeInTheDocument();
    expect(screen.queryByTestId("create-project-btn")).not.toBeInTheDocument();

    renderApp("/projects/1", "EMPLOYEE");

    await waitFor(() => {
      expect(screen.getByTestId("project-detail-page")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("advance-step-btn-104")).not.toBeInTheDocument();
    expect(screen.queryByTestId("advance-step-btn-105")).not.toBeInTheDocument();
    expect(screen.queryByTestId("insert-substep-after-103")).not.toBeInTheDocument();
    expect(screen.queryByTestId("edit-substep-btn-199")).not.toBeInTheDocument();
    expect(screen.queryByTestId("delete-substep-btn-199")).not.toBeInTheDocument();
    expect(screen.queryByTestId("open-add-member-modal-btn")).not.toBeInTheDocument();
    expect(screen.queryByTestId("remove-member-btn-20")).not.toBeInTheDocument();
  });
});
