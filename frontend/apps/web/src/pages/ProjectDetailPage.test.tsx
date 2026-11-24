import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProjectDetailPage } from "./ProjectDetailPage";
import * as authModule from "../auth";
import * as projectsApi from "../api/projects";
import type { ProjectDetailData } from "../projects/types";

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
  fetchProjectDetail: vi.fn(),
  updateStepStatus: vi.fn(),
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
  });

  it("renders error state when fetch fails", async () => {
    vi.mocked(projectsApi.fetchProjectDetail).mockRejectedValue(new Error("Network Error"));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("project-detail-error")).toBeInTheDocument();
      expect(screen.getByText("Network Error")).toBeInTheDocument();
    });

    const backBtn = screen.getByTestId("back-to-projects-btn");
    fireEvent.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/projects");
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
});
