import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { AppearanceSettings } from "./AppearanceSettings";
import { ThemeProvider } from "@systrol/ui";

function renderAppearance() {
  return render(
    <ThemeProvider>
      <AppearanceSettings />
    </ThemeProvider>
  );
}

describe("AppearanceSettings", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders theme cards and sidebar options", () => {
    renderAppearance();

    expect(screen.getByTestId("appearance-settings")).toBeInTheDocument();
    expect(screen.getByTestId("theme-card-light")).toBeInTheDocument();
    expect(screen.getByTestId("theme-card-dark")).toBeInTheDocument();
    expect(screen.getByTestId("theme-card-system")).toBeInTheDocument();

    expect(screen.getByTestId("sidebar-opt-expanded")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-opt-collapsed")).toBeInTheDocument();
  });

  it("allows switching theme modes and highlights active theme", () => {
    renderAppearance();

    const darkCard = screen.getByTestId("theme-card-dark");
    fireEvent.click(darkCard);
    expect(darkCard.className).toContain("themeCardActive");
    expect(localStorage.getItem("systrol_theme")).toBe("dark");

    const lightCard = screen.getByTestId("theme-card-light");
    fireEvent.click(lightCard);
    expect(lightCard.className).toContain("themeCardActive");
    expect(localStorage.getItem("systrol_theme")).toBe("light");
  });

  it("updates sidebar layout preference and saves to localStorage", () => {
    renderAppearance();

    const collapsedRadio = screen.getByRole("radio", { name: /Collapsed Rail/i });
    fireEvent.click(collapsedRadio);
    expect(collapsedRadio).toBeChecked();
    expect(localStorage.getItem("systrol_sidebar_collapsed")).toBe("true");

    const expandedRadio = screen.getByRole("radio", { name: /Expanded Sidebar/i });
    fireEvent.click(expandedRadio);
    expect(expandedRadio).toBeChecked();
    expect(localStorage.getItem("systrol_sidebar_collapsed")).toBe("false");
  });
});
