import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateProjectModal } from "./CreateProjectModal";

describe("CreateProjectModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders modal with mandatory field markers and without initial assigned members", () => {
    render(<CreateProjectModal {...defaultProps} />);

    expect(screen.getByRole("heading", { name: "Create Project" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Project ID \/ Code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Project Name/i)).toBeInTheDocument();
    expect(screen.queryByText(/Initial Assigned Members/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId("create-project-employee-search")).not.toBeInTheDocument();
    expect(screen.queryByTestId("initial-members-list")).not.toBeInTheDocument();
  });

  it("validates mandatory fields on submission with error texts and input error styling", async () => {
    render(<CreateProjectModal {...defaultProps} />);

    fireEvent.submit(screen.getByTestId("create-project-form"));

    await waitFor(() => {
      expect(screen.getByTestId("error-code")).toHaveTextContent("Please enter Project ID / Code.");
      expect(screen.getByTestId("error-name")).toHaveTextContent("Please enter project name.");
    });

    const codeInput = screen.getByTestId("create-project-code-input");
    const nameInput = screen.getByTestId("create-project-name-input");
    expect(codeInput.className).toContain("inputError");
    expect(nameInput.className).toContain("inputError");
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it("validates alphanumeric requirement on project code", async () => {
    render(<CreateProjectModal {...defaultProps} />);

    fireEvent.change(screen.getByTestId("create-project-code-input"), {
      target: { value: "PRJ-001!" },
    });
    fireEvent.change(screen.getByTestId("create-project-name-input"), {
      target: { value: "Test Project" },
    });

    fireEvent.submit(screen.getByTestId("create-project-form"));

    await waitFor(() => {
      expect(screen.getByTestId("error-code")).toHaveTextContent(
        "Project ID / Code must be alphanumeric with no spaces or special characters."
      );
    });

    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it("clears validation error when user types into field", async () => {
    render(<CreateProjectModal {...defaultProps} />);

    fireEvent.submit(screen.getByTestId("create-project-form"));

    await waitFor(() => {
      expect(screen.getByTestId("error-code")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("create-project-code-input"), {
      target: { value: "PRJ01" },
    });

    await waitFor(() => {
      expect(screen.queryByTestId("error-code")).not.toBeInTheDocument();
    });
  });

  it("submits valid project data", async () => {
    render(<CreateProjectModal {...defaultProps} />);

    fireEvent.change(screen.getByTestId("create-project-code-input"), {
      target: { value: "PRJ001" },
    });
    fireEvent.change(screen.getByTestId("create-project-name-input"), {
      target: { value: "New Automation Line" },
    });
    fireEvent.change(screen.getByTestId("create-project-client-input"), {
      target: { value: "Apex Industries" },
    });
    fireEvent.change(screen.getByTestId("create-project-description-input"), {
      target: { value: "Project scope" },
    });

    fireEvent.submit(screen.getByTestId("create-project-form"));

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith({
        code: "PRJ001",
        name: "New Automation Line",
        client_name: "Apex Industries",
        description: "Project scope",
        member_ids: [],
      });
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it("calls onClose when Cancel button is clicked", () => {
    render(<CreateProjectModal {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
