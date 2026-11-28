import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateProjectModal } from "./CreateProjectModal";
import * as projectsApi from "../../../api/projects";

vi.mock("../../../api/projects", async () => {
  const actual = await vi.importActual<typeof projectsApi>("../../../api/projects");
  return {
    ...actual,
    fetchActiveEmployees: vi.fn(),
    fetchEmployeeLookup: vi.fn(),
  };
});

describe("CreateProjectModal", () => {
  const mockEmployees = [
    {
      id: 10,
      employee_code: "SYS-010",
      full_name: "Alice Engineer",
      designation: "Automation Lead",
      department: "Engineering",
    },
    {
      id: 11,
      employee_code: "SYS-011",
      full_name: "Bob Builder",
      designation: "Site Tech",
      department: "Operations",
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(projectsApi.fetchActiveEmployees).mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      results: mockEmployees,
    });
    vi.mocked(projectsApi.fetchEmployeeLookup).mockResolvedValue(mockEmployees);
  });

  it("loads active employees when opened", async () => {
    render(<CreateProjectModal {...defaultProps} />);

    await waitFor(() => {
      expect(
        vi.mocked(projectsApi.fetchEmployeeLookup).mock.calls.length > 0 ||
          vi.mocked(projectsApi.fetchActiveEmployees).mock.calls.length > 0
      ).toBe(true);
    });

    expect(screen.getByText("Alice Engineer")).toBeInTheDocument();
    expect(screen.getByText("Bob Builder")).toBeInTheDocument();
  });

  it("searches employees in modal", async () => {
    render(<CreateProjectModal {...defaultProps} />);
    const searchInput = screen.getByTestId("create-project-employee-search");
    fireEvent.change(searchInput, { target: { value: "Bob" } });
    await waitFor(() => {
      expect(projectsApi.fetchEmployeeLookup).toHaveBeenCalledWith("Bob");
    });
  });

  it("validates required fields on submission", async () => {
    render(<CreateProjectModal {...defaultProps} />);

    fireEvent.submit(screen.getByTestId("create-project-form"));

    await waitFor(() => {
      expect(screen.getByText("Project ID / Code is required.")).toBeInTheDocument();
    });

    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it("submits valid project data", async () => {
    render(<CreateProjectModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Alice Engineer")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Project ID \/ Code/i), {
      target: { value: "PRJ001" },
    });
    fireEvent.change(screen.getByLabelText(/Project Name/i), {
      target: { value: "New Automation Line" },
    });
    fireEvent.change(screen.getByLabelText(/Client Name/i), {
      target: { value: "Apex Industries" },
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: "Project scope" },
    });

    fireEvent.click(screen.getByTestId("member-checkbox-10"));

    fireEvent.submit(screen.getByTestId("create-project-form"));

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith({
        code: "PRJ001",
        name: "New Automation Line",
        client_name: "Apex Industries",
        description: "Project scope",
        member_ids: [10],
      });
    });
  });

  it("calls onClose when Cancel button is clicked", () => {
    render(<CreateProjectModal {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
