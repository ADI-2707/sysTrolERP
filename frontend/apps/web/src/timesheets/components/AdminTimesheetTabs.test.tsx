import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AdminTimesheetTabs } from "./AdminTimesheetTabs";

describe("AdminTimesheetTabs", () => {
  it("renders both tabs and handles tab change", () => {
    const handleTabChange = vi.fn();

    render(
      <AdminTimesheetTabs
        activeTab="my"
        onTabChange={handleTabChange}
        pendingCount={0}
      />
    );

    expect(screen.getByRole("tab", { name: "My Timesheet" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Team Timesheets" })).toBeInTheDocument();

    const teamTab = screen.getByRole("tab", { name: "Team Timesheets" });
    fireEvent.click(teamTab);

    expect(handleTabChange).toHaveBeenCalledWith("team");
  });

  it("displays pending count badge when pending approvals exist", () => {
    render(
      <AdminTimesheetTabs
        activeTab="my"
        onTabChange={vi.fn()}
        pendingCount={5}
      />
    );

    expect(screen.getByTestId("pending-badge")).toHaveTextContent("5");
  });
});
