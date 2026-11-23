import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TimesheetCellEditor } from "./TimesheetCellEditor";

describe("TimesheetCellEditor", () => {
  it("renders with initial value and focuses input", () => {
    render(
      <TimesheetCellEditor
        initialValue="8.00"
        step={0.25}
        onCommit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const input = screen.getByTestId("cell-editor-input") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("8.00");
    expect(document.activeElement).toBe(input);
  });

  it("commits valid increment when Enter is pressed", () => {
    const handleCommit = vi.fn();
    render(
      <TimesheetCellEditor
        initialValue="8.00"
        step={0.25}
        onCommit={handleCommit}
        onCancel={vi.fn()}
      />
    );

    const input = screen.getByTestId("cell-editor-input");
    fireEvent.change(input, { target: { value: "8.50" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(handleCommit).toHaveBeenCalledWith("8.50");
  });

  it("displays validation error when entering non-quarter-hour value", () => {
    const handleCommit = vi.fn();
    render(
      <TimesheetCellEditor
        initialValue="8.00"
        step={0.25}
        onCommit={handleCommit}
        onCancel={vi.fn()}
      />
    );

    const input = screen.getByTestId("cell-editor-input");
    fireEvent.change(input, { target: { value: "8.33" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(handleCommit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("increments of 0.25");
  });

  it("calls onCancel when Escape is pressed", () => {
    const handleCancel = vi.fn();
    render(
      <TimesheetCellEditor
        initialValue="8.00"
        step={0.25}
        onCommit={vi.fn()}
        onCancel={handleCancel}
      />
    );

    const input = screen.getByTestId("cell-editor-input");
    fireEvent.keyDown(input, { key: "Escape" });

    expect(handleCancel).toHaveBeenCalled();
  });

  it("reverts via onCancel when blurring on invalid input", () => {
    const handleCancel = vi.fn();
    const handleCommit = vi.fn();
    render(
      <TimesheetCellEditor
        initialValue="8.00"
        step={0.25}
        onCommit={handleCommit}
        onCancel={handleCancel}
      />
    );

    const input = screen.getByTestId("cell-editor-input");
    fireEvent.change(input, { target: { value: "invalid" } });
    fireEvent.blur(input);

    expect(handleCancel).toHaveBeenCalled();
    expect(handleCommit).not.toHaveBeenCalled();
  });
});
