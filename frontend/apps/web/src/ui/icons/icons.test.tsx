import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Icon,
  IconDashboard,
  IconProjects,
  IconUsers,
  IconSettings,
  IconPlus,
  IconClose,
  IconCheck,
  IconInfo,
  IconWarning,
  IconSun,
  IconMoon,
} from "./index";

describe("Icon Components", () => {
  it("renders with default size 24 and decorative aria-hidden", () => {
    const { container } = render(<IconDashboard />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "24");
    expect(svg).toHaveAttribute("height", "24");
    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).not.toHaveAttribute("role");
  });

  it("renders with custom pixel size and named size", () => {
    const { container: c1 } = render(<IconProjects size={16} />);
    expect(c1.querySelector("svg")).toHaveAttribute("width", "16");

    const { container: c2 } = render(<IconUsers size="lg" />);
    expect(c2.querySelector("svg")).toHaveAttribute("width", "24");

    const { container: c3 } = render(<IconSettings size="sm" />);
    expect(c3.querySelector("svg")).toHaveAttribute("width", "16");
  });

  it("renders accessible role and label when label is provided", () => {
    render(<IconPlus label="Add project" />);
    const icon = screen.getByRole("img", { name: "Add project" });
    expect(icon).toBeInTheDocument();
    expect(icon).not.toHaveAttribute("aria-hidden");
    expect(icon).toHaveAttribute("aria-label", "Add project");
  });

  it("renders base Icon wrapper with children", () => {
    const { container } = render(
      <Icon color="red" label="Custom star">
        <circle cx="12" cy="12" r="8" />
      </Icon>
    );
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("stroke", "red");
    expect(svg).toHaveAttribute("aria-label", "Custom star");
  });

  it("renders representative icons properly", () => {
    const { container } = render(
      <div>
        <IconClose />
        <IconCheck />
        <IconInfo />
        <IconWarning />
        <IconSun />
        <IconMoon />
      </div>
    );
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBe(6);
  });
});
