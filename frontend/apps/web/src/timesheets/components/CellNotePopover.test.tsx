import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CellNotePopover } from "./CellNotePopover";

describe("CellNotePopover", () => {
  it("renders trigger button and shows active label when note exists", () => {
    render(
      <CellNotePopover
        note="Wiring check"
        isEditable={true}
        projectCode="PRJ-01"
        date="2026-11-23"
        onSaveNote={vi.fn()}
      />
    );

    const trigger = screen.getByTestId("note-trigger-PRJ-01-2026-11-23");
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-label", "Task note: Wiring check");
  });

  it("opens popover, allows editing note, and saves changes", () => {
    const handleSave = vi.fn();
    render(
      <CellNotePopover
        note="Initial note"
        isEditable={true}
        projectCode="PRJ-01"
        date="2026-11-23"
        onSaveNote={handleSave}
      />
    );

    const trigger = screen.getByTestId("note-trigger-PRJ-01-2026-11-23");
    fireEvent.click(trigger);

    expect(screen.getByText("Task Note")).toBeInTheDocument();
    expect(screen.getByText("PRJ-01 • 2026-11-23")).toBeInTheDocument();

    const textarea = screen.getByTestId("cell-note-textarea");
    expect(textarea).toHaveValue("Initial note");

    fireEvent.change(textarea, { target: { value: "Updated task note" } });

    const saveBtn = screen.getByTestId("save-note-btn");
    fireEvent.click(saveBtn);

    expect(handleSave).toHaveBeenCalledWith("Updated task note");
  });

  it("clears note when clear button is clicked", () => {
    const handleSave = vi.fn();
    render(
      <CellNotePopover
        note="Existing task"
        isEditable={true}
        projectCode="PRJ-01"
        date="2026-11-23"
        onSaveNote={handleSave}
      />
    );

    const trigger = screen.getByTestId("note-trigger-PRJ-01-2026-11-23");
    fireEvent.click(trigger);

    const clearBtn = screen.getByTestId("clear-note-btn");
    fireEvent.click(clearBtn);

    expect(handleSave).toHaveBeenCalledWith("");
  });

  it("displays read-only note when editing is not permitted", () => {
    render(
      <CellNotePopover
        note="Locked historical note"
        isEditable={false}
        projectCode="PRJ-01"
        date="2026-11-23"
        onSaveNote={vi.fn()}
      />
    );

    const trigger = screen.getByTestId("note-trigger-PRJ-01-2026-11-23");
    fireEvent.click(trigger);

    expect(screen.getByTestId("readonly-note-text")).toHaveTextContent("Locked historical note");
    expect(screen.queryByTestId("cell-note-textarea")).not.toBeInTheDocument();
  });
});
