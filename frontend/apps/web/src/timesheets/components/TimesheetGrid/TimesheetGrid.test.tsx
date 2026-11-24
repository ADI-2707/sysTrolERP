import { render, screen, within, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { TimesheetData } from "../../types";
import { TimesheetGrid } from "./TimesheetGrid";

describe("TimesheetGrid", () => {
  const mockTimesheet: TimesheetData = {
    id: 10,
    week_start_date: "2026-11-23",
    week_end_date: "2026-11-29",
    status: "OPEN",
    can_edit: true,
    can_submit: true,
    return_reason: null,
    submitted_at: null,
    approved_at: null,
    approved_by_label: null,
    returned_at: null,
    returned_by_label: null,
    policy: {
      daily_regular_hours: "8.00",
      hour_step: "0.25",
      break_duration_hours: "1.00",
      overtime_threshold_daily: "8.00",
    },
    days: [
      "2026-11-23",
      "2026-11-24",
      "2026-11-25",
      "2026-11-26",
      "2026-11-27",
      "2026-11-28",
      "2026-11-29",
    ],
    day_totals: {
      "2026-11-23": "9.00",
      "2026-11-24": "8.00",
      "2026-11-25": "8.00",
      "2026-11-26": "8.00",
      "2026-11-27": "8.00",
      "2026-11-28": "0.00",
      "2026-11-29": "0.00",
    },
    day_regular: {
      "2026-11-23": "8.00",
      "2026-11-24": "8.00",
      "2026-11-25": "8.00",
      "2026-11-26": "8.00",
      "2026-11-27": "8.00",
      "2026-11-28": "0.00",
      "2026-11-29": "0.00",
    },
    day_overtime: {
      "2026-11-23": "1.00",
      "2026-11-24": "0.00",
      "2026-11-25": "0.00",
      "2026-11-26": "0.00",
      "2026-11-27": "0.00",
      "2026-11-28": "0.00",
      "2026-11-29": "0.00",
    },
    total_week_hours: "41.00",
    total_regular_hours: "40.00",
    total_overtime_hours: "1.00",
    rows: [
      {
        id: 101,
        project: {
          id: 1,
          code: "PRJ-0001",
          name: "Automation Plant",
          is_active: true,
        },
        description: "PLC programming and diagnostics",
        row_total: "41.00",
        entries: [
          {
            entry_id: 201,
            date: "2026-11-23",
            hours: "9.00",
            note: "Commissioning trial run",
            is_editable: true,
          },
          {
            entry_id: 202,
            date: "2026-11-24",
            hours: "8.00",
            note: "",
            is_editable: true,
          },
          {
            entry_id: 203,
            date: "2026-11-25",
            hours: "8.00",
            note: "",
            is_editable: true,
          },
          {
            entry_id: 204,
            date: "2026-11-26",
            hours: "8.00",
            note: "",
            is_editable: true,
          },
          {
            entry_id: 205,
            date: "2026-11-27",
            hours: "8.00",
            note: "",
            is_editable: true,
          },
          {
            entry_id: 206,
            date: "2026-11-28",
            hours: "0.00",
            note: "",
            is_editable: false,
          },
          {
            entry_id: 207,
            date: "2026-11-29",
            hours: "0.00",
            note: "",
            is_editable: false,
          },
        ],
      },
      {
        id: 102,
        project: {
          id: 2,
          code: "PRJ-0002",
          name: "Robotics Cell",
          is_active: true,
        },
        description: "Drafting",
        row_total: "0.00",
        entries: [
          {
            entry_id: 208,
            date: "2026-11-23",
            hours: "0.00",
            note: "",
            is_editable: true,
          },
        ],
      },
    ],
    assigned_projects: [
      {
        id: 1,
        code: "PRJ-0001",
        name: "Automation Plant",
        is_active: true,
      },
      {
        id: 2,
        code: "PRJ-0002",
        name: "Robotics Cell",
        is_active: true,
      },
      {
        id: 3,
        code: "PRJ-0003",
        name: "Conveyor Line",
        is_active: true,
      },
    ],
  };

  it("renders project rows and day headers", () => {
    render(<TimesheetGrid timesheet={mockTimesheet} />);

    expect(screen.getByTestId("timesheet-status-banner")).toBeInTheDocument();
    expect(screen.getByTestId("timesheet-status-badge")).toHaveTextContent("OPEN");
    expect(screen.getByText("PRJ-0001")).toBeInTheDocument();
    expect(screen.getByText("Automation Plant")).toBeInTheDocument();
    expect(screen.getByText("PLC programming and diagnostics")).toBeInTheDocument();

    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("23")).toBeInTheDocument();
    expect(screen.getByText("Sun")).toBeInTheDocument();
    expect(screen.getByText("29")).toBeInTheDocument();
  });

  it("displays row cells and total column value", () => {
    render(<TimesheetGrid timesheet={mockTimesheet} />);

    const mondayCell = screen.getByTestId("cell-1-2026-11-23");
    expect(mondayCell).toHaveTextContent("9.0");

    const sundayCell = screen.getByTestId("cell-1-2026-11-29");
    expect(sundayCell).toHaveTextContent("0.0");

    expect(screen.getAllByText("41.0")).toHaveLength(2);
  });

  it("renders footer summaries for regular, overtime, and daily totals", () => {
    render(<TimesheetGrid timesheet={mockTimesheet} />);

    const footer = screen.getByTestId("timesheet-footer");
    expect(footer).toBeInTheDocument();
    expect(within(footer).getByText("Regular Hours")).toBeInTheDocument();
    expect(within(footer).getByText("Overtime Hours")).toBeInTheDocument();
    expect(within(footer).getByText("Daily Total")).toBeInTheDocument();
    expect(within(footer).getByText("Standard Hours")).toBeInTheDocument();
    expect(screen.getByTestId("status-badge-2026-11-23")).toHaveTextContent("+1.0h OT");
    expect(screen.getByTestId("status-badge-2026-11-24")).toHaveTextContent("Met");

    expect(within(footer).getByText("40.0")).toBeInTheDocument();
    expect(within(footer).getAllByText("1.0").length).toBeGreaterThanOrEqual(1);
  });

  it("activates cell editor on cell click and commits valid quarter-hour change", () => {
    const handleCellChange = vi.fn();
    render(
      <TimesheetGrid
        timesheet={mockTimesheet}
        onCellChange={handleCellChange}
      />
    );

    const mondayCell = screen.getByTestId("cell-1-2026-11-23");
    fireEvent.click(mondayCell);

    const input = screen.getByTestId("cell-editor-input");
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "8.75" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(handleCellChange).toHaveBeenCalledWith(1, "2026-11-23", "8.75");
  });

  it("does not activate cell editor on non-editable cell click", () => {
    render(<TimesheetGrid timesheet={mockTimesheet} />);

    const saturdayCell = screen.getByTestId("cell-1-2026-11-28");
    fireEvent.click(saturdayCell);

    expect(screen.queryByTestId("cell-editor-input")).not.toBeInTheDocument();
  });

  it("handles clipboard paste across days", () => {
    const handleCellChange = vi.fn();
    render(
      <TimesheetGrid
        timesheet={mockTimesheet}
        onCellChange={handleCellChange}
      />
    );

    const mondayCell = screen.getByTestId("cell-1-2026-11-23");
    fireEvent.click(mondayCell);

    const input = screen.getByTestId("cell-editor-input");
    const pasteData = {
      getData: (format: string) => (format === "text" ? "7.50\t8.25" : ""),
    };

    fireEvent.paste(input, { clipboardData: pasteData });

    expect(handleCellChange).toHaveBeenCalledWith(1, "2026-11-23", "7.50");
    expect(handleCellChange).toHaveBeenCalledWith(1, "2026-11-24", "8.25");
  });

  it("opens add project row modal and adds row on submit", async () => {
    const handleAddRow = vi.fn().mockResolvedValue(undefined);
    render(
      <TimesheetGrid
        timesheet={mockTimesheet}
        onAddRow={handleAddRow}
      />
    );

    const addBtn = screen.getByTestId("add-project-row-btn");
    fireEvent.click(addBtn);

    const modal = screen.getByRole("dialog");
    expect(within(modal).getByText("Add Project Row")).toBeInTheDocument();

    const input = screen.getByTestId("project-combobox-input");
    fireEvent.focus(input);

    const option = screen.getByTestId("project-option-3");
    fireEvent.click(option);

    const submitBtn = screen.getByTestId("add-row-submit-button");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleAddRow).toHaveBeenCalledWith(3, "");
    });
  });

  it("renders delete button on empty row and triggers onDeleteRow", () => {
    const handleDeleteRow = vi.fn();
    render(
      <TimesheetGrid
        timesheet={mockTimesheet}
        onDeleteRow={handleDeleteRow}
      />
    );

    const deleteBtn = screen.getByTestId("delete-row-102");
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(deleteBtn);
    expect(handleDeleteRow).toHaveBeenCalledWith(102);

    expect(screen.queryByTestId("delete-row-101")).not.toBeInTheDocument();
  });

  it("renders cell status indicator and global autosave badge", () => {
    render(
      <TimesheetGrid
        timesheet={mockTimesheet}
        cellStatuses={{ "1:2026-11-23": "saving", "1:2026-11-24": "error" }}
        globalStatus="saving"
      />
    );

    expect(screen.getByTestId("autosave-status-badge")).toHaveTextContent("Saving changes...");
    expect(screen.getByTestId("cell-status-1:2026-11-23")).toBeInTheDocument();
    expect(screen.getByTestId("cell-status-1:2026-11-24")).toBeInTheDocument();
  });

  it("opens cell note popover and triggers onNoteChange", () => {
    const handleNoteChange = vi.fn();
    render(
      <TimesheetGrid
        timesheet={mockTimesheet}
        onNoteChange={handleNoteChange}
      />
    );

    const noteTrigger = screen.getByTestId("note-trigger-PRJ-0001-2026-11-23");
    fireEvent.click(noteTrigger);

    expect(screen.getByTestId("cell-note-popover")).toBeInTheDocument();
    const textarea = screen.getByTestId("cell-note-textarea");
    fireEvent.change(textarea, { target: { value: "Site alignment" } });

    const saveBtn = screen.getByTestId("save-note-btn");
    fireEvent.click(saveBtn);

    expect(handleNoteChange).toHaveBeenCalledWith(1, "2026-11-23", "Site alignment");
  });
});
