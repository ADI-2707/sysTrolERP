import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Avatar } from "./Avatar";
import { Badge } from "./Badge";
import { Card } from "./Card";
import { Chip } from "./Chip";
import { EmptyState } from "./EmptyState";
import { ProgressBar } from "./ProgressBar";
import { ProgressRing } from "./ProgressRing";
import { Skeleton } from "./Skeleton";
import { Spinner } from "./Spinner";
import { TableSkeleton } from "./TableSkeleton";

describe("Display components", () => {
  it("renders Badge with variant", () => {
    render(<Badge variant="success">Completed</Badge>);
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("renders Chip and handles delete", () => {
    const handleDelete = vi.fn();
    render(<Chip label="Engineering" onDelete={handleDelete} />);
    expect(screen.getByText("Engineering")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove item" }));
    expect(handleDelete).toHaveBeenCalledTimes(1);
  });

  it("derives initials in Avatar", () => {
    render(<Avatar name="Rahul Sharma" />);
    expect(screen.getByText("RS")).toBeInTheDocument();
  });

  it("renders Card with header and content", () => {
    render(
      <Card title="Project Overview" subtitle="Updated 2 hrs ago">
        Card Content
      </Card>
    );
    expect(screen.getByText("Project Overview")).toBeInTheDocument();
    expect(screen.getByText("Card Content")).toBeInTheDocument();
  });

  it("renders ProgressBar and ProgressRing with progress values", () => {
    render(
      <div>
        <ProgressBar value={75} />
        <ProgressRing value={50} />
      </div>
    );
    const bars = screen.getAllByRole("progressbar");
    expect(bars[0]).toHaveAttribute("aria-valuenow", "75");
    expect(bars[1]).toHaveAttribute("aria-valuenow", "50");
  });

  it("renders EmptyState with title, description, and action", () => {
    render(
      <EmptyState
        title="No Projects"
        description="Get started by creating a new project"
        action={<button>Create</button>}
      />
    );
    expect(screen.getByText("No Projects")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });

  it("renders Skeleton and Spinner", () => {
    render(
      <div>
        <Skeleton width={100} height={20} />
        <Spinner />
      </div>
    );
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("renders TableSkeleton with specified rows, columns, and avatar", () => {
    render(<TableSkeleton rows={4} columns={6} hasAvatar={true} />);
    expect(screen.getByTestId("table-skeleton")).toBeInTheDocument();
    expect(screen.getAllByTestId("table-skeleton-row")).toHaveLength(4);
  });
});
