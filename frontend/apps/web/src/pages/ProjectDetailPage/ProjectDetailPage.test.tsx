import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProjectDetailPage } from "./ProjectDetailPage";
import * as authModule from "../../auth";
import * as projectsApi from "../../api/projects";
import type { ProjectDetailData } from "../../projects/types";

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
  fetchProjectDetail: vi.fn(),
  updateStepStatus: vi.fn(),
  insertSubStep: vi.fn(),
  updateSubStep: vi.fn(),
  deleteSubStep: vi.fn(),
}));

const mockAddToast = vi.fn();
vi.mock("@systrol/ui", async () => {
  const actual = await vi.importActual("@systrol/ui");
  return {
    ...actual,
    useToast: () => ({
      addToast: mockAddToast,
    }),
  };
});

describe("ProjectDetailPage", () => {
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
      id: 5,
      employee_code: "SYS-005",
      full_name: "Project Admin",
    },
    created_at: "2026-11-10T10:00:00Z",
    completion_percentage: 21,
    total_steps: 14,
    completed_steps: 3,
    steps: [
      {
        id: 101,
        key: "ENQUIRY",
        name: "Enquiry",
        position: 1,
        is_custom: false,
        status: "COMPLETED",
        confirmed_at: "2026-11-11T12:00:00Z",
        confirmed_by_label: "Admin John",
      },
      {
        id: 102,
        key: "SALES_VISIT",
        name: "Sales Visit",
        position: 2,
        is_custom: false,
        status: "COMPLETED",
        confirmed_at: "2026-11-12T12:00:00Z",
        confirmed_by_label: "Admin John",
      },
      {
        id: 103,
        key: "PROCUREMENT",
        name: "Procurement",
        position: 3,
        is_custom: false,
        status: "COMPLETED",
        confirmed_at: "2026-11-13T12:00:00Z",
        confirmed_by_label: "Admin John",
      },
      {
        id: 104,
        key: "ENGINEERING",
        name: "Engineering",
        position: 4,
        is_custom: false,
        status: "IN_PROGRESS",
        confirmed_at: null,
        confirmed_by_label: null,
      },
      {
        id: 105,
        key: "MANUFACTURING",
        name: "Manufacturing",
        position: 5,
        is_custom: false,
        status: "NOT_STARTED",
        confirmed_at: null,
        confirmed_by_label: null,
      },
      {
        id: 198,
        key: "SUB_ENG_1",
        name: "Custom Started Review",
        position: 6,
        is_custom: true,
        status: "INITIATED",
        confirmed_at: null,
        confirmed_by_label: null,
      },
      {
        id: 199,
        key: "SUB_MFG_1",
        name: "Custom Pre-Check",
        position: 7,
        is_custom: true,
        status: "NOT_STARTED",
        confirmed_at: null,
        confirmed_by_label: null,
      },
      {
        id: 106,
        key: "AMC",
        name: "Annual Maintenance Contract",
        position: 8,
        is_custom: false,
        status: "NOT_STARTED",
        confirmed_at: null,
        confirmed_by_label: null,
      },
    ],
    members: [
      {
        id: 201,
        employee_code: "SYS-020",
        full_name: "Alice Engineer",
        designation: "Senior Lead",
        department: "Engineering",
      },
      {
        id: 202,
        employee_code: "SYS-021",
        full_name: "Bob Tech",
        designation: "Technician",
        department: "Field Ops",
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authModule.useAuth).mockReturnValue({
      user: {
        id: 1,
        employee_code: "SYS-001",
        full_name: "Admin User",
        role: "ADMIN",
        email: "admin@example.com",
        must_change_password: false,
      },
      isAdmin: true,
      isSuperAdmin: false,
      isEmployee: false,
      isAuthenticated: true,
      isLoading: false,
      mustChangePassword: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });
  });

  const renderComponent = (projectId = "1") => {
    return render(
      <MemoryRouter initialEntries={[`/projects/${projectId}`]}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it("renders loading state initially", () => {
    vi.mocked(projectsApi.fetchProjectDetail).mockReturnValue(new Promise(() => {}));
    renderComponent();
    expect(screen.getByTestId("project-detail-loading")).toBeInTheDocument();
    expect(screen.getByTestId("project-detail-loading-skeleton")).toBeInTheDocument();
  });

  it("renders error state when fetch fails and allows retry", async () => {
    vi.mocked(projectsApi.fetchProjectDetail).mockRejectedValueOnce(new Error("Network Error"));
    vi.mocked(projectsApi.fetchProjectDetail).mockResolvedValueOnce(mockProjectDetail);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("project-detail-error")).toBeInTheDocument();
      expect(screen.getByText("Network Error")).toBeInTheDocument();
    });

    const retryBtn = screen.getByTestId("project-detail-retry-btn");
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByTestId("project-detail-page")).toBeInTheDocument();
    });
  });

  it("renders project details and locked tags for completed steps", async () => {
    vi.mocked(projectsApi.fetchProjectDetail).mockResolvedValue(mockProjectDetail);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("project-detail-page")).toBeInTheDocument();
    });

    expect(screen.getByText("Turbine Installation")).toBeInTheDocument();
    expect(screen.getByTestId("project-detail-code")).toHaveTextContent("PRJ-01");
    expect(screen.getByTestId("step-locked-tag-101")).toBeInTheDocument();
    expect(screen.getByTestId("step-locked-tag-102")).toBeInTheDocument();
    expect(screen.getByTestId("step-locked-tag-103")).toBeInTheDocument();
    expect(screen.queryByTestId("advance-step-btn-101")).not.toBeInTheDocument();
  });

  it("advances step from NOT_STARTED to INITIATED without modal", async () => {
    vi.mocked(projectsApi.fetchProjectDetail).mockResolvedValue(mockProjectDetail);
    vi.mocked(projectsApi.updateStepStatus).mockResolvedValue({
      id: 105,
      key: "MANUFACTURING",
      name: "Manufacturing",
      position: 5,
      is_custom: false,
      status: "INITIATED",
      confirmed_at: null,
      confirmed_by_label: null,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("project-detail-page")).toBeInTheDocument();
    });

    const advanceBtn = screen.getByTestId("advance-step-btn-105");
    fireEvent.click(advanceBtn);

    await waitFor(() => {
      expect(projectsApi.updateStepStatus).toHaveBeenCalledWith(1, 105, "INITIATED", false);
    });
  });

  it("opens confirmation modal when advancing IN_PROGRESS step to COMPLETED", async () => {
    vi.mocked(projectsApi.fetchProjectDetail).mockResolvedValue(mockProjectDetail);
    vi.mocked(projectsApi.updateStepStatus).mockResolvedValue({
      id: 104,
      key: "ENGINEERING",
      name: "Engineering",
      position: 4,
      is_custom: false,
      status: "COMPLETED",
      confirmed_at: "2026-11-20T10:00:00Z",
      confirmed_by_label: "Admin User",
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("project-detail-page")).toBeInTheDocument();
    });

    const advanceBtn = screen.getByTestId("advance-step-btn-104");
    fireEvent.click(advanceBtn);

    const modal = screen.getByTestId("complete-step-modal");
    expect(modal).toBeInTheDocument();
    expect(within(modal).getByText(/Engineering/)).toBeInTheDocument();

    const cancelBtn = screen.getByTestId("cancel-complete-step-btn");
    fireEvent.click(cancelBtn);
    expect(screen.queryByTestId("complete-step-modal")).not.toBeInTheDocument();

    fireEvent.click(advanceBtn);
    expect(screen.getByTestId("complete-step-modal")).toBeInTheDocument();

    const confirmBtn = screen.getByTestId("confirm-complete-step-btn");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(projectsApi.updateStepStatus).toHaveBeenCalledWith(1, 104, "COMPLETED", true);
    });
  });

  it("does not allow employees to see step advance controls", async () => {
    vi.mocked(authModule.useAuth).mockReturnValue({
      user: {
        id: 20,
        employee_code: "SYS-020",
        full_name: "Alice Employee",
        role: "EMPLOYEE",
        email: "alice@example.com",
        must_change_password: false,
      },
      isAdmin: false,
      isSuperAdmin: false,
      isEmployee: true,
      isAuthenticated: true,
      isLoading: false,
      mustChangePassword: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.mocked(projectsApi.fetchProjectDetail).mockResolvedValue(mockProjectDetail);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("project-detail-page")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("advance-step-btn-104")).not.toBeInTheDocument();
    expect(screen.queryByTestId("advance-step-btn-105")).not.toBeInTheDocument();
  });

  it("enforces sub-step insertion rules and hides insert before highest completed step and after AMC", async () => {
    vi.mocked(projectsApi.fetchProjectDetail).mockResolvedValue(mockProjectDetail);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("project-detail-page")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("insert-substep-after-101")).not.toBeInTheDocument();
    expect(screen.queryByTestId("insert-substep-after-102")).not.toBeInTheDocument();

    expect(screen.getByTestId("insert-substep-after-103")).toBeInTheDocument();
    expect(screen.getByTestId("insert-substep-after-104")).toBeInTheDocument();
    expect(screen.getByTestId("insert-substep-after-105")).toBeInTheDocument();
    expect(screen.getByTestId("insert-substep-after-198")).toBeInTheDocument();
    expect(screen.getByTestId("insert-substep-after-199")).toBeInTheDocument();

    expect(screen.queryByTestId("insert-substep-after-106")).not.toBeInTheDocument();
  });

  it("opens add sub-step modal, validates input, and successfully inserts sub-step", async () => {
    vi.mocked(projectsApi.fetchProjectDetail).mockResolvedValue(mockProjectDetail);
    vi.mocked(projectsApi.insertSubStep).mockResolvedValue({
      id: 199,
      key: "SUB_PROCUREMENT_1",
      name: "Vendor Quality Audit",
      position: 4,
      is_custom: true,
      status: "NOT_STARTED",
      confirmed_at: null,
      confirmed_by_label: null,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("project-detail-page")).toBeInTheDocument();
    });

    const insertBtn = screen.getByTestId("insert-substep-after-103");
    fireEvent.click(insertBtn);

    const modal = screen.getByTestId("add-substep-modal");
    expect(modal).toBeInTheDocument();
    expect(within(modal).getByText(/Procurement/)).toBeInTheDocument();

    const submitBtn = screen.getByTestId("confirm-add-substep-btn");
    expect(submitBtn).toBeDisabled();

    const nameInput = screen.getByTestId("substep-name-input");
    fireEvent.change(nameInput, { target: { value: "Vendor Quality Audit" } });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(projectsApi.insertSubStep).toHaveBeenCalledWith(1, {
        after_step_id: 103,
        name: "Vendor Quality Audit",
      });
    });

    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "success",
        title: "Sub-step added",
      })
    );
  });

  it("only allows custom sub-steps in NOT_STARTED status to be edited or deleted", async () => {
    vi.mocked(projectsApi.fetchProjectDetail).mockResolvedValue(mockProjectDetail);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("project-detail-page")).toBeInTheDocument();
    });

    expect(screen.getByTestId("edit-substep-btn-199")).toBeInTheDocument();
    expect(screen.getByTestId("delete-substep-btn-199")).toBeInTheDocument();

    expect(screen.queryByTestId("edit-substep-btn-198")).not.toBeInTheDocument();
    expect(screen.queryByTestId("delete-substep-btn-198")).not.toBeInTheDocument();

    expect(screen.queryByTestId("edit-substep-btn-101")).not.toBeInTheDocument();
    expect(screen.queryByTestId("delete-substep-btn-101")).not.toBeInTheDocument();
    expect(screen.queryByTestId("edit-substep-btn-105")).not.toBeInTheDocument();
    expect(screen.queryByTestId("delete-substep-btn-105")).not.toBeInTheDocument();
  });

  it("opens edit sub-step modal and saves updated name", async () => {
    vi.mocked(projectsApi.fetchProjectDetail).mockResolvedValue(mockProjectDetail);
    vi.mocked(projectsApi.updateSubStep).mockResolvedValue({
      id: 199,
      key: "SUB_MFG_1",
      name: "Custom Pre-Check Revised",
      position: 7,
      is_custom: true,
      status: "NOT_STARTED",
      confirmed_at: null,
      confirmed_by_label: null,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("project-detail-page")).toBeInTheDocument();
    });

    const editBtn = screen.getByTestId("edit-substep-btn-199");
    fireEvent.click(editBtn);

    const modal = screen.getByTestId("edit-substep-modal");
    expect(modal).toBeInTheDocument();

    const nameInput = screen.getByTestId("edit-substep-name-input");
    expect(nameInput).toHaveValue("Custom Pre-Check");

    fireEvent.change(nameInput, { target: { value: "Custom Pre-Check Revised" } });
    const saveBtn = screen.getByTestId("confirm-edit-substep-btn");
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(projectsApi.updateSubStep).toHaveBeenCalledWith(1, 199, "Custom Pre-Check Revised");
    });

    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "success",
        title: "Sub-step updated",
      })
    );
  });

  it("opens delete sub-step confirmation modal and removes custom sub-step", async () => {
    vi.mocked(projectsApi.fetchProjectDetail).mockResolvedValueOnce(mockProjectDetail);
    vi.mocked(projectsApi.deleteSubStep).mockResolvedValue(undefined);

    const updatedAfterDelete: ProjectDetailData = {
      ...mockProjectDetail,
      total_steps: 13,
      completion_percentage: 23,
      steps: mockProjectDetail.steps.filter((s) => s.id !== 199),
    };
    vi.mocked(projectsApi.fetchProjectDetail).mockResolvedValueOnce(updatedAfterDelete);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("project-detail-page")).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTestId("delete-substep-btn-199");
    fireEvent.click(deleteBtn);

    const modal = screen.getByTestId("delete-substep-modal");
    expect(modal).toBeInTheDocument();
    expect(within(modal).getByText(/Custom Pre-Check/)).toBeInTheDocument();

    const confirmDeleteBtn = screen.getByTestId("confirm-delete-substep-btn");
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(projectsApi.deleteSubStep).toHaveBeenCalledWith(1, 199);
    });

    await waitFor(() => {
      expect(screen.getByTestId("project-progress-percentage")).toHaveTextContent("23% (3 / 13 steps)");
    });

    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "success",
        title: "Sub-step deleted",
      })
    );
  });

  it("filters lifecycle steps by status and filters team members", async () => {
    const detailWithTeam: ProjectDetailData = {
      ...mockProjectDetail,
      members: [
        {
          id: 10,
          employee_code: "SYS-010",
          full_name: "Jane Engineer",
          department: "Engineering",
        },
        {
          id: 20,
          employee_code: "SYS-020",
          full_name: "Bob Technician",
          department: "Operations",
        },
      ],
    };
    vi.mocked(projectsApi.fetchProjectDetail).mockResolvedValue(detailWithTeam);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("project-detail-page")).toBeInTheDocument();
    });

    expect(screen.getByTestId("step-filter-all")).toBeInTheDocument();
    expect(screen.getByText("Enquiry")).toBeInTheDocument();
    expect(screen.getByText("Engineering")).toBeInTheDocument();

    const pendingFilter = screen.getByTestId("step-filter-pending");
    fireEvent.click(pendingFilter);

    expect(screen.queryByText("Enquiry")).not.toBeInTheDocument();
    expect(screen.getByText("Engineering")).toBeInTheDocument();

    const completedFilter = screen.getByTestId("step-filter-completed");
    fireEvent.click(completedFilter);

    expect(screen.getByText("Enquiry")).toBeInTheDocument();
    expect(screen.queryByText("Engineering")).not.toBeInTheDocument();

    const allFilter = screen.getByTestId("step-filter-all");
    fireEvent.click(allFilter);

    expect(screen.getByText("Enquiry")).toBeInTheDocument();
    expect(screen.getByText("Engineering")).toBeInTheDocument();

    expect(screen.getByText("Jane Engineer")).toBeInTheDocument();
    expect(screen.getByText("Bob Technician")).toBeInTheDocument();

    const memberSearch = screen.getByTestId("member-search-input");
    fireEvent.change(memberSearch, { target: { value: "Jane" } });

    expect(screen.getByText("Jane Engineer")).toBeInTheDocument();
    expect(screen.queryByText("Bob Technician")).not.toBeInTheDocument();
  });
});
