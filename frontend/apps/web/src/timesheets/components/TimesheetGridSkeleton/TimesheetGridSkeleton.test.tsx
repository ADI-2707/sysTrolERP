import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TimesheetGridSkeleton } from "./TimesheetGridSkeleton";

describe("TimesheetGridSkeleton component", () => {
  it("renders with summary cards and default rows", () => {
    render(<TimesheetGridSkeleton rows={4} showCards={true} />);
    expect(screen.getByTestId("timesheet-grid-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("timesheet-cards-skeleton")).toBeInTheDocument();
    expect(screen.getAllByTestId("timesheet-row-skeleton")).toHaveLength(4);
  });

  it("omits summary cards when showCards is false", () => {
    render(<TimesheetGridSkeleton rows={2} showCards={false} />);
    expect(screen.getByTestId("timesheet-grid-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("timesheet-cards-skeleton")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("timesheet-row-skeleton")).toHaveLength(2);
  });
});
