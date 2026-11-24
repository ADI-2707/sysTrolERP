import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";
import { IconButton } from "./IconButton";

describe("Button component", () => {
  it("renders with children and responds to click", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    const btn = screen.getByRole("button", { name: "Click me" });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("handles loading state and disables click", () => {
    const handleClick = vi.fn();
    render(
      <Button loading onClick={handleClick}>
        Saving
      </Button>
    );
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("aria-busy", "true");
    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("renders IconButton with accessible label", () => {
    const handleClick = vi.fn();
    render(
      <IconButton
        icon={<span data-testid="test-icon">*</span>}
        label="Delete item"
        onClick={handleClick}
      />
    );
    const btn = screen.getByRole("button", { name: "Delete item" });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("aria-label", "Delete item");
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
