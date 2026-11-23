import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../../theme/ThemeProvider";
import { ErrorBoundary } from "./ErrorBoundary";
import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { Topbar } from "./Topbar";

function ProblematicComponent(): JSX.Element {
  throw new Error("Simulated render crash");
}

describe("Layout components", () => {
  it("renders Sidebar and handles item navigation", () => {
    const handleNav = vi.fn();
    const handleCollapse = vi.fn();
    const items = [
      { key: "dash", label: "Dashboard", icon: <span>*</span>, onClick: handleNav },
      { key: "proj", label: "Projects", icon: <span>*</span> },
    ];

    render(
      <Sidebar
        logo={<span>sysTrol ERP</span>}
        items={items}
        onToggleCollapse={handleCollapse}
      />
    );

    expect(screen.getByText("sysTrol ERP")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Dashboard"));
    expect(handleNav).toHaveBeenCalledTimes(1);

    const collapseBtn = screen.getByRole("button", { name: "Collapse sidebar" });
    fireEvent.click(collapseBtn);
    expect(handleCollapse).toHaveBeenCalledTimes(1);
  });

  it("renders Topbar with actions and user menu", () => {
    const handleMenuClick = vi.fn();
    render(
      <Topbar
        breadcrumbs={<span>Dashboard / Projects</span>}
        actions={<button>Action</button>}
        userMenu={<span>User Profile</span>}
        onMenuClick={handleMenuClick}
      />
    );

    expect(screen.getByText("Dashboard / Projects")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
    expect(screen.getByText("User Profile")).toBeInTheDocument();

    const menuBtn = screen.getByRole("button", { name: "Open navigation drawer" });
    fireEvent.click(menuBtn);
    expect(handleMenuClick).toHaveBeenCalledTimes(1);
  });

  it("toggles theme with ThemeToggle", () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>
    );

    const btn = screen.getByRole("button", { name: "Switch to dark theme" });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeInTheDocument();
  });

  it("catches errors with ErrorBoundary and shows recovery UI", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ProblematicComponent />
      </ErrorBoundary>
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reload Application" })).toBeInTheDocument();

    consoleError.mockRestore();
  });
});
