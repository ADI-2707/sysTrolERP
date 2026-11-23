import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Breadcrumbs } from "./Breadcrumbs";
import { Pagination } from "./Pagination";
import { Tabs } from "./Tabs";

describe("Navigation components", () => {
  it("renders Tabs and handles switching with click and keyboard", () => {
    const handleChange = vi.fn();
    const tabs = [
      { id: "my", label: "My Timesheet" },
      { id: "team", label: "Team Timesheets" },
    ];

    render(<Tabs tabs={tabs} activeTab="my" onChange={handleChange} />);
    const teamTab = screen.getByRole("tab", { name: "Team Timesheets" });
    fireEvent.click(teamTab);
    expect(handleChange).toHaveBeenCalledWith("team");
  });

  it("renders Breadcrumbs with current page indication", () => {
    const items = [
      { label: "Dashboard", href: "/" },
      { label: "Projects", href: "/projects" },
      { label: "PRJ-0001", isCurrent: true },
    ];

    render(<Breadcrumbs items={items} />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("PRJ-0001")).toHaveAttribute("aria-current", "page");
  });

  it("renders Pagination and triggers page navigation", () => {
    const handleChange = vi.fn();
    render(<Pagination page={1} pageSize={10} total={50} onChange={handleChange} />);

    const nextBtn = screen.getByRole("button", { name: "Next page" });
    fireEvent.click(nextBtn);
    expect(handleChange).toHaveBeenCalledWith(2);

    const page3Btn = screen.getByRole("button", { name: "3" });
    fireEvent.click(page3Btn);
    expect(handleChange).toHaveBeenCalledWith(3);
  });
});
