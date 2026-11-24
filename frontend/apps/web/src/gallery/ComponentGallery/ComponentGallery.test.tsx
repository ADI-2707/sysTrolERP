import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ComponentGallery } from "./ComponentGallery";

describe("ComponentGallery", () => {
  it("renders gallery title and theme sections", () => {
    render(<ComponentGallery />);
    expect(screen.getByText("sysTrol ERP Component Gallery")).toBeInTheDocument();
    expect(screen.getByText("Light Theme Preview")).toBeInTheDocument();
    expect(screen.getByText("Dark Theme Preview")).toBeInTheDocument();
  });

  it("renders layout previews, icons, and interactive components", () => {
    render(<ComponentGallery />);
    expect(screen.getByText("Layout Previews")).toBeInTheDocument();
    expect(screen.getByText("Icon Showcase Sample")).toBeInTheDocument();
    const primaryButtons = screen.getAllByRole("button", { name: "Primary Toast" });
    expect(primaryButtons.length).toBeGreaterThan(0);
    fireEvent.click(primaryButtons[0]);
  });
});
