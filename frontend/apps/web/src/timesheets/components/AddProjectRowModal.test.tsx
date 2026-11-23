import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AddProjectRowModal } from "./AddProjectRowModal";
import type { ProjectSummary } from "../types";

describe("AddProjectRowModal", () => {
  const mockAssignedProjects: ProjectSummary[] = [
    {
      id: 1,
      code: "PRJ-0001",
      name: "Automation Plant",
      is_active: true,
    },
    {
      id: 2,
      code: "PRJ-0002",
      name: "Robotics Cell",
      is_active: true,
    },
    {
      id: 3,
      code: "PRJ-0003",
      name: "Conveyor Line",
      is_active: true,
    },
  ];

  it("renders when open and shows assigned projects list on focus", () => {
    render(
      <AddProjectRowModal
        isOpen={true}
        onClose={vi.fn()}
        onAddRow={vi.fn()}
        assignedProjects={mockAssignedProjects}
        existingProjectIds={[1]}
      />
    );

    expect(screen.getByText("Add Project Row")).toBeInTheDocument();

    const input = screen.getByTestId("project-combobox-input");
    fireEvent.focus(input);

    expect(screen.getByText("Robotics Cell")).toBeInTheDocument();
    expect(screen.getByText("Conveyor Line")).toBeInTheDocument();
  });

  it("indicates existing projects as duplicate and prevents selecting them", () => {
    render(
      <AddProjectRowModal
        isOpen={true}
        onClose={vi.fn()}
        onAddRow={vi.fn()}
        assignedProjects={mockAssignedProjects}
        existingProjectIds={[1]}
      />
    );

    const input = screen.getByTestId("project-combobox-input");
    fireEvent.focus(input);

    expect(screen.getByTestId("duplicate-badge")).toHaveTextContent("Already added");

    const duplicateOption = screen.getByTestId("project-option-1");
    fireEvent.click(duplicateOption);

    const submitBtn = screen.getByTestId("add-row-submit-button");
    expect(submitBtn).toBeDisabled();
  });

  it("filters assigned projects by code or name search", () => {
    render(
      <AddProjectRowModal
        isOpen={true}
        onClose={vi.fn()}
        onAddRow={vi.fn()}
        assignedProjects={mockAssignedProjects}
        existingProjectIds={[]}
      />
    );

    const input = screen.getByTestId("project-combobox-input");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "robot" } });

    expect(screen.getByText("Robotics Cell")).toBeInTheDocument();
    expect(screen.queryByText("Conveyor Line")).not.toBeInTheDocument();
  });

  it("submits valid project row with description", async () => {
    const handleAddRow = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <AddProjectRowModal
        isOpen={true}
        onClose={handleClose}
        onAddRow={handleAddRow}
        assignedProjects={mockAssignedProjects}
        existingProjectIds={[1]}
      />
    );

    const input = screen.getByTestId("project-combobox-input");
    fireEvent.focus(input);

    const option = screen.getByTestId("project-option-2");
    fireEvent.click(option);

    const descInput = screen.getByTestId("row-description-input");
    fireEvent.change(descInput, { target: { value: "Commissioning test" } });

    const submitBtn = screen.getByTestId("add-row-submit-button");
    expect(submitBtn).toBeEnabled();
    fireEvent.click(submitBtn);

    expect(handleAddRow).toHaveBeenCalledWith(2, "Commissioning test");
  });

  it("closes modal on cancel click", () => {
    const handleClose = vi.fn();

    render(
      <AddProjectRowModal
        isOpen={true}
        onClose={handleClose}
        onAddRow={vi.fn()}
        assignedProjects={mockAssignedProjects}
        existingProjectIds={[]}
      />
    );

    fireEvent.click(screen.getByText("Cancel"));
    expect(handleClose).toHaveBeenCalled();
  });
});
