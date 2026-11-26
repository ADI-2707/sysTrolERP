import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ProjectCard } from "./ProjectCard";
import type { ProjectListItem } from "../../types";

describe("ProjectCard", () => {
  const mockProject: ProjectListItem = {
    id: 1,
    code: "PRJ-001",
    name: "Solar Turbine Array",
    slug: "solar-turbine-array",
    client_name: "Apex Renewables",
    description: "High efficiency solar-thermal turbine system installation",
    is_active: true,
    status: "IN_PROGRESS",
    total_steps: 14,
    completed_steps: 4,
    completion_percentage: 28,
    current_step: {
      id: 5,
      key: "MANUFACTURING",
      name: "Manufacturing",
      status: "IN_PROGRESS",
      position: 5,
    },
    member_count: 5,
    members: [
      { id: 10, employee_code: "SYS-010", full_name: "Alice Engineer" },
      { id: 11, employee_code: "SYS-011", full_name: "Bob Builder" },
      { id: 12, employee_code: "SYS-012", full_name: "Charlie Site" },
    ],
    created_by_label: "Admin User",
    created_at: "2026-11-01T10:00:00Z",
  };

  it("renders project information, progress, and step badge", () => {
    render(<ProjectCard project={mockProject} />);

    expect(screen.getByText("Solar Turbine Array")).toBeInTheDocument();
    expect(screen.getByText("PRJ-001")).toBeInTheDocument();
    expect(screen.getByText("Apex Renewables")).toBeInTheDocument();
    expect(screen.getByText(/High efficiency solar-thermal turbine/)).toBeInTheDocument();
    expect(screen.getByText("28%")).toBeInTheDocument();
    expect(screen.getByText("4 / 14 steps")).toBeInTheDocument();
    expect(screen.getByText("Manufacturing")).toBeInTheDocument();
    expect(screen.queryByTestId("project-members")).not.toBeInTheDocument();
  });

  it("triggers onClick on mouse click and keyboard Enter", () => {
    const handleClick = vi.fn();
    render(<ProjectCard project={mockProject} onClick={handleClick} />);

    const card = screen.getByTestId("project-card-1");
    fireEvent.click(card);
    expect(handleClick).toHaveBeenCalledWith(mockProject);

    fireEvent.keyDown(card, { key: "Enter" });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });
});
