import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AssignmentMatrix } from "./AssignmentMatrix";
import * as projectsApi from "../../api/projects";
import type { AssignmentMatrixData } from "../types";

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

vi.mock("../../api/projects", () => ({
  fetchAssignmentMatrix: vi.fn(),
  addProjectMember: vi.fn(),
  removeProjectMember: vi.fn(),
}));

describe("AssignmentMatrix", () => {
  const mockMatrixData: AssignmentMatrixData = {
    employees: [
      { id: 10, code: "SYS-010", name: "Alice Engineer" },
      { id: 20, code: "SYS-020", name: "Bob Technician" },
    ],
    projects: [
      { id: 101, code: "PRJ-01", slug: "turbine-installation", name: "Turbine Installation" },
      { id: 102, code: "PRJ-02", slug: "solar-array-setup", name: "Solar Array Setup" },
    ],
    assignments: [
      { employee_id: 10, project_id: 101 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    vi.mocked(projectsApi.fetchAssignmentMatrix).mockReturnValue(new Promise(() => {}));
    render(<AssignmentMatrix />);
    expect(screen.getByTestId("matrix-loading")).toBeInTheDocument();
  });

  it("renders matrix with sticky headers, employees and projects", async () => {
    vi.mocked(projectsApi.fetchAssignmentMatrix).mockResolvedValue(mockMatrixData);
    render(<AssignmentMatrix />);

    await waitFor(() => {
      expect(screen.getByTestId("assignment-matrix")).toBeInTheDocument();
    });

    expect(screen.getByTestId("matrix-col-101")).toHaveTextContent("Turbine Installation");
    expect(screen.getByTestId("matrix-col-102")).toHaveTextContent("Solar Array Setup");
    expect(screen.getByTestId("matrix-row-10")).toHaveTextContent("Alice Engineer");
    expect(screen.getByTestId("matrix-row-20")).toHaveTextContent("Bob Technician");

    expect(screen.getByTestId("matrix-dot-10-101")).toBeInTheDocument();
    expect(screen.queryByTestId("matrix-dot-10-102")).not.toBeInTheDocument();
    expect(screen.queryByTestId("matrix-dot-20-101")).not.toBeInTheDocument();
    expect(screen.queryByTestId("matrix-dot-20-102")).not.toBeInTheDocument();
  });

  it("toggles unassigned cell to assigned by calling addProjectMember", async () => {
    vi.mocked(projectsApi.fetchAssignmentMatrix).mockResolvedValue(mockMatrixData);
    vi.mocked(projectsApi.addProjectMember).mockResolvedValue(undefined);

    render(<AssignmentMatrix />);

    await waitFor(() => {
      expect(screen.getByTestId("assignment-matrix")).toBeInTheDocument();
    });

    const unassignedCell = screen.getByTestId("matrix-cell-20-101");
    expect(screen.queryByTestId("matrix-dot-20-101")).not.toBeInTheDocument();

    fireEvent.click(unassignedCell);

    await waitFor(() => {
      expect(projectsApi.addProjectMember).toHaveBeenCalledWith(101, 20);
    });

    expect(screen.getByTestId("matrix-dot-20-101")).toBeInTheDocument();
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "success",
        title: "Assignment added",
      })
    );
  });

  it("toggles assigned cell to unassigned by calling removeProjectMember", async () => {
    vi.mocked(projectsApi.fetchAssignmentMatrix).mockResolvedValue(mockMatrixData);
    vi.mocked(projectsApi.removeProjectMember).mockResolvedValue(undefined);

    render(<AssignmentMatrix />);

    await waitFor(() => {
      expect(screen.getByTestId("assignment-matrix")).toBeInTheDocument();
    });

    const assignedCell = screen.getByTestId("matrix-cell-10-101");
    expect(screen.getByTestId("matrix-dot-10-101")).toBeInTheDocument();

    fireEvent.click(assignedCell);

    await waitFor(() => {
      expect(projectsApi.removeProjectMember).toHaveBeenCalledWith(101, 10);
    });

    expect(screen.queryByTestId("matrix-dot-10-101")).not.toBeInTheDocument();
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "success",
        title: "Assignment removed",
      })
    );
  });

  it("reverts optimistic update and shows error toast on failure", async () => {
    vi.mocked(projectsApi.fetchAssignmentMatrix).mockResolvedValue(mockMatrixData);
    vi.mocked(projectsApi.addProjectMember).mockRejectedValue(new Error("Database error"));

    render(<AssignmentMatrix />);

    await waitFor(() => {
      expect(screen.getByTestId("assignment-matrix")).toBeInTheDocument();
    });

    const unassignedCell = screen.getByTestId("matrix-cell-20-102");
    fireEvent.click(unassignedCell);

    await waitFor(() => {
      expect(projectsApi.addProjectMember).toHaveBeenCalledWith(102, 20);
    });

    await waitFor(() => {
      expect(screen.queryByTestId("matrix-dot-20-102")).not.toBeInTheDocument();
    });

    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
        title: "Update failed",
      })
    );
  });

  it("filters rows by employee search term", async () => {
    vi.mocked(projectsApi.fetchAssignmentMatrix).mockResolvedValue(mockMatrixData);
    render(<AssignmentMatrix />);

    await waitFor(() => {
      expect(screen.getByTestId("assignment-matrix")).toBeInTheDocument();
    });

    const filterInput = screen.getByTestId("matrix-employee-filter");
    fireEvent.change(filterInput, { target: { value: "Alice" } });

    expect(screen.getByTestId("matrix-row-10")).toBeInTheDocument();
    expect(screen.queryByTestId("matrix-row-20")).not.toBeInTheDocument();
  });

  it("filters columns by project search term", async () => {
    vi.mocked(projectsApi.fetchAssignmentMatrix).mockResolvedValue(mockMatrixData);
    render(<AssignmentMatrix />);

    await waitFor(() => {
      expect(screen.getByTestId("assignment-matrix")).toBeInTheDocument();
    });

    const filterInput = screen.getByTestId("matrix-project-filter");
    fireEvent.change(filterInput, { target: { value: "Solar" } });

    expect(screen.getByTestId("matrix-col-102")).toBeInTheDocument();
    expect(screen.queryByTestId("matrix-col-101")).not.toBeInTheDocument();
  });

  it("renders error state with retry button and retries on click", async () => {
    vi.mocked(projectsApi.fetchAssignmentMatrix).mockRejectedValueOnce(new Error("Network failed"));
    vi.mocked(projectsApi.fetchAssignmentMatrix).mockResolvedValueOnce(mockMatrixData);

    render(<AssignmentMatrix />);

    await waitFor(() => {
      expect(screen.getByTestId("matrix-error")).toBeInTheDocument();
      expect(screen.getByText("Network failed")).toBeInTheDocument();
    });

    const retryBtn = screen.getByTestId("matrix-retry-btn");
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByTestId("assignment-matrix")).toBeInTheDocument();
    });
  });
});
