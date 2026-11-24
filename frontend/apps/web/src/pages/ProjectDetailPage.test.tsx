import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProjectDetailPage } from "./ProjectDetailPage";
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

vi.mock("../api/projects", () => ({
  fetchProjectDetail: vi.fn(),
}));

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

  it("renders project details, steps timeline and member cards correctly", async () => {
    vi.mocked(projectsApi.fetchProjectDetail).mockResolvedValue(mockProjectDetail);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("project-detail-page")).toBeInTheDocument();
    });

    expect(screen.getByText("Turbine Installation")).toBeInTheDocument();
    expect(screen.getByTestId("project-detail-code")).toHaveTextContent("PRJ-01");
    expect(screen.getByTestId("project-client-name")).toHaveTextContent("Apex Energy");
    expect(screen.getByText("Commissioning of 500kW turbine")).toBeInTheDocument();

    expect(screen.getByTestId("project-creator")).toHaveTextContent("Project Admin");
    expect(screen.getByTestId("project-active-status")).toHaveTextContent("Active");
    expect(screen.getByTestId("project-progress-percentage")).toHaveTextContent("21% (3 / 14 steps)");

    expect(screen.getByTestId("project-stepper-timeline")).toBeInTheDocument();
    expect(screen.getByText("Enquiry")).toBeInTheDocument();
    expect(screen.getByText("Sales Visit")).toBeInTheDocument();
    expect(screen.getByText("Procurement")).toBeInTheDocument();
    expect(screen.getByText("Engineering")).toBeInTheDocument();
    expect(screen.getByText("Manufacturing")).toBeInTheDocument();

    expect(screen.getByText("Assigned Members (2)")).toBeInTheDocument();
    expect(screen.getByTestId("project-members-grid")).toBeInTheDocument();
    expect(screen.getByText("Alice Engineer")).toBeInTheDocument();
    expect(screen.getByText("Bob Tech")).toBeInTheDocument();

    const backBtn = screen.getByTestId("back-to-projects-btn");
    fireEvent.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/projects");
  });

  it("renders empty members state when no members assigned", async () => {
    const noMembersProject = { ...mockProjectDetail, members: [] };
    vi.mocked(projectsApi.fetchProjectDetail).mockResolvedValue(noMembersProject);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Assigned Members (0)")).toBeInTheDocument();
      expect(screen.getByText("No team members currently assigned.")).toBeInTheDocument();
    });
  });
});
