import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ThemeProvider, useTheme } from "./ThemeProvider";

function TestConsumer() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme("dark")}>Set Dark</button>
      <button onClick={() => setTheme("light")}>Set Light</button>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("sets initial resolved theme on document element", () => {
    render(
      <ThemeProvider defaultTheme="light">
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("updates document element and localStorage on theme change", () => {
    render(
      <ThemeProvider defaultTheme="light">
        <TestConsumer />
      </ThemeProvider>
    );

    act(() => {
      screen.getByText("Set Dark").click();
    });

    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("systrol_theme")).toBe("dark");

    act(() => {
      screen.getByText("Toggle").click();
    });

    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });
});
