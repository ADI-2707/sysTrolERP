import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateProjectModal } from "./CreateProjectModal";
import * as projectsApi from "../../api/projects";

vi.mock("../../api/projects", async () => {
  const actual = await vi.importActual("../../api/projects");
  return {
    ...actual,
    fetchActiveEmployees: vi.fn(),
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

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(projectsApi.fetchActiveEmployees).mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      results: mockEmployees,
    });
  });

  it("renders modal form and disables submit when name is empty", async () => {
    render(
      <CreateProjectModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: "Create Project" })).toBeInTheDocument();
    expect(screen.getByTestId("create-project-name-input")).toBeInTheDocument();
    expect(screen.getByTestId("create-project-client-input")).toBeInTheDocument();
    expect(screen.getByTestId("create-project-description-input")).toBeInTheDocument();

    const submitBtn = screen.getByTestId("submit-create-project-btn");
    expect(submitBtn).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText("Alice Engineer")).toBeInTheDocument();
      expect(screen.getByText("Bob Builder")).toBeInTheDocument();
    });
  });

  it("submits project with entered details and selected members", async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <CreateProjectModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Alice Engineer")).toBeInTheDocument();
    });

    const nameInput = screen.getByTestId("create-project-name-input");
    fireEvent.change(nameInput, { target: { value: "Gas Turbine Unit 4" } });

    const clientInput = screen.getByTestId("create-project-client-input");
    fireEvent.change(clientInput, { target: { value: "Apex Corp" } });

    const descInput = screen.getByTestId("create-project-description-input");
    fireEvent.change(descInput, { target: { value: "Turbine installation and testing" } });

    const memberCheckbox = screen.getByTestId("member-checkbox-10");
    fireEvent.click(memberCheckbox);

    const submitBtn = screen.getByTestId("submit-create-project-btn");
    expect(submitBtn).toBeEnabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        name: "Gas Turbine Unit 4",
        client_name: "Apex Corp",
        description: "Turbine installation and testing",
        member_ids: [10],
      });
    });
  });

  it("calls onClose when Cancel is clicked", () => {
    const handleClose = vi.fn();
    render(
      <CreateProjectModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Cancel"));
    expect(handleClose).toHaveBeenCalled();
  });
});
