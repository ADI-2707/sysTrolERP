import { render, screen, within, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { TimesheetData } from "../../types";
import { TimesheetGrid } from "./TimesheetGrid";

describe("TimesheetGrid - Redesigned Excel-Style Infinite Grid", () => {
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
    available_projects: [
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
    assigned_projects: [
      {
        id: 1,
        code: "PRJ-0001",
        name: "Automation Plant",
        is_active: true,
      },
    ],
  };

  it("renders spanning week navigation header with status badge and week controls", () => {
    const handlePrevious = vi.fn();
    const handleNext = vi.fn();

    render(
      <TimesheetGrid
        timesheet={mockTimesheet}
        displayRange="23 Nov - 29 Nov 2026"
        onPreviousWeek={handlePrevious}
        onNextWeek={handleNext}
        canGoNext={false}
        isCurrentWeek={true}
      />
    );

    expect(screen.getByText("23 Nov - 29 Nov 2026")).toBeInTheDocument();
    expect(screen.getByText("OPEN")).toBeInTheDocument();
    expect(screen.getByText("41.0h")).toBeInTheDocument();

    const prevBtn = screen.getByLabelText("Previous week");
    fireEvent.click(prevBtn);
    expect(handlePrevious).toHaveBeenCalledTimes(1);

    const nextBtn = screen.getByLabelText("Next week");
    expect(nextBtn).toBeDisabled();
  });

  it("renders two-tier headers with Project, days of week, and Desc & Hours sub-columns", () => {
    render(<TimesheetGrid timesheet={mockTimesheet} />);

    expect(screen.getByText("Project")).toBeInTheDocument();
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("23")).toBeInTheDocument();
    expect(screen.getByText("Sun")).toBeInTheDocument();
    expect(screen.getByText("29")).toBeInTheDocument();

    const descHeaders = screen.getAllByText("Desc");
    expect(descHeaders.length).toBe(7);
    const hoursHeaders = screen.getAllByText("Hours");
    expect(hoursHeaders.length).toBe(7);
  });

  it("renders project rows with description and hours cells", () => {
    render(<TimesheetGrid timesheet={mockTimesheet} />);

    expect(screen.getByText("PRJ-0001")).toBeInTheDocument();
    expect(screen.getByText("Automation Plant")).toBeInTheDocument();

    const descInput = screen.getByLabelText("Description for PRJ-0001 on 2026-11-23") as HTMLInputElement;
    expect(descInput).toBeInTheDocument();
    expect(descInput.value).toBe("Commissioning trial run");

    const hoursCell = screen.getByTestId("cell-1-2026-11-23");
    expect(hoursCell).toHaveTextContent("9.0");
  });

  it("triggers onNoteChange when description cell is updated", () => {
    const handleNoteChange = vi.fn();
    render(
      <TimesheetGrid
        timesheet={mockTimesheet}
        onNoteChange={handleNoteChange}
      />
    );

    const descInput = screen.getByLabelText("Description for PRJ-0001 on 2026-11-23");
    fireEvent.change(descInput, { target: { value: "Updated testing notes" } });
    fireEvent.blur(descInput);

    expect(handleNoteChange).toHaveBeenCalledWith(1, "2026-11-23", "Updated testing notes");
  });

  it("triggers onCellChange when hours cell is clicked and edited", async () => {
    const handleCellChange = vi.fn();
    render(
      <TimesheetGrid
        timesheet={mockTimesheet}
        onCellChange={handleCellChange}
      />
    );

    const hoursCellContainer = screen.getByTestId("cell-1-2026-11-23");
    const displaySpan = within(hoursCellContainer).getByText("9.0");
    fireEvent.click(displaySpan);

    const input = await screen.findByLabelText("Hours for PRJ-0001 on 2026-11-23");
    fireEvent.change(input, { target: { value: "8.50" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(handleCellChange).toHaveBeenCalledWith(1, "2026-11-23", "8.50");
  });

  it("renders bottom sticky summary rows for Total Working Hours, Overtime Hours, and Regular Hours", () => {
    render(<TimesheetGrid timesheet={mockTimesheet} />);

    expect(screen.getByText("Total Working Hours")).toBeInTheDocument();
    expect(screen.getByText("Overtime Hours")).toBeInTheDocument();
    expect(screen.getByText("Regular Hours")).toBeInTheDocument();

    expect(screen.getByTestId("status-badge-2026-11-23")).toHaveTextContent("+1.0h OT");
  });

  it("renders excel placeholder row with in-cell project dropdown and triggers onAddRow on select", async () => {
    const handleAddRow = vi.fn().mockResolvedValue(undefined);
    render(
      <TimesheetGrid
        timesheet={mockTimesheet}
        onAddRow={handleAddRow}
      />
    );

    const placeholderRow = screen.getByTestId("timesheet-placeholder-row");
    expect(placeholderRow).toBeInTheDocument();

    const selectBtn = within(placeholderRow).getByTestId("select-project-cell-btn");
    expect(selectBtn).toHaveTextContent("+ Select Project");
    fireEvent.click(selectBtn);

    expect(screen.getByText("Conveyor Line")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Conveyor Line"));

    await waitFor(() => {
      expect(handleAddRow).toHaveBeenCalledWith(3, "");
    });
  });

  it("triggers onSubmitTimesheet when submit timesheet button is clicked", () => {
    const handleSubmit = vi.fn();
    render(
      <TimesheetGrid
        timesheet={mockTimesheet}
        onSubmitTimesheet={handleSubmit}
      />
    );

    const submitBtn = screen.getByTestId("submit-timesheet-btn");
    expect(submitBtn).toBeInTheDocument();
    fireEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it("filters project rows by search query and empty hours toggle", () => {
    render(<TimesheetGrid timesheet={mockTimesheet} />);

    expect(screen.getByTestId("timesheet-row-101")).toBeInTheDocument();
    expect(screen.getByTestId("timesheet-row-102")).toBeInTheDocument();

    const searchInput = screen.getByTestId("timesheet-row-search-input");
    fireEvent.change(searchInput, { target: { value: "Robotics" } });

    expect(screen.queryByTestId("timesheet-row-101")).not.toBeInTheDocument();
    expect(screen.getByTestId("timesheet-row-102")).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "" } });
    expect(screen.getByTestId("timesheet-row-101")).toBeInTheDocument();
    expect(screen.getByTestId("timesheet-row-102")).toBeInTheDocument();

    const hideEmptyBtn = screen.getByTestId("toggle-hide-empty-rows-btn");
    fireEvent.click(hideEmptyBtn);

    expect(screen.getByTestId("timesheet-row-101")).toBeInTheDocument();
    expect(screen.queryByTestId("timesheet-row-102")).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "NonExistent" } });
    expect(screen.getByText("No project rows match your filter.")).toBeInTheDocument();
  });

  it("triggers onExportSiteDiary directly from row quick-export menu", async () => {
    const handleExport = vi.fn().mockResolvedValue(undefined);
    render(
      <TimesheetGrid
        timesheet={mockTimesheet}
        onExportSiteDiary={handleExport}
      />
    );

    const diaryRowBtn = screen.getByTestId("export-site-diary-btn-1");
    expect(diaryRowBtn).toBeInTheDocument();
    fireEvent.click(diaryRowBtn);

    const pdfBtn = screen.getByTestId("export-pdf-1");
    expect(pdfBtn).toBeInTheDocument();
    fireEvent.click(pdfBtn);

    expect(handleExport).toHaveBeenCalledWith(1, "pdf");

    fireEvent.click(diaryRowBtn);
    const excelBtn = screen.getByTestId("export-excel-1");
    expect(excelBtn).toBeInTheDocument();
    fireEvent.click(excelBtn);

    expect(handleExport).toHaveBeenCalledWith(1, "excel");
  });

  it("opens export site diary modal from header and downloads selected project", async () => {
    const handleExport = vi.fn().mockResolvedValue(undefined);
    render(
      <TimesheetGrid
        timesheet={mockTimesheet}
        onExportSiteDiary={handleExport}
      />
    );

    const openModalBtn = screen.getByTestId("open-export-diary-modal-btn");
    expect(openModalBtn).toBeInTheDocument();
    fireEvent.click(openModalBtn);

    expect(screen.getByText("Export Project Site Diary")).toBeInTheDocument();

    const select = screen.getByTestId("site-diary-project-select");
    fireEvent.change(select, { target: { value: "2" } });

    const excelRadio = screen.getByTestId("format-radio-excel");
    fireEvent.click(excelRadio);

    const downloadBtn = screen.getByTestId("confirm-download-diary-btn");
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(handleExport).toHaveBeenCalledWith(2, "excel");
    });
  });

  it("supports date range selection with presets and custom dates in export modal", async () => {
    const handleExport = vi.fn().mockResolvedValue(undefined);
    render(
      <TimesheetGrid
        timesheet={mockTimesheet}
        onExportSiteDiary={handleExport}
      />
    );

    const openModalBtn = screen.getByTestId("open-export-diary-modal-btn");
    fireEvent.click(openModalBtn);

    const presetMonthBtn = screen.getByTestId("preset-month-btn");
    fireEvent.click(presetMonthBtn);

    const startDateInput = screen.getByTestId("range-start-date") as HTMLInputElement;
    const endDateInput = screen.getByTestId("range-end-date") as HTMLInputElement;
    expect(startDateInput.value).toBe("2026-11-01");
    expect(endDateInput.value).toBe("2026-11-30");

    const presetCustomBtn = screen.getByTestId("preset-custom-btn");
    fireEvent.click(presetCustomBtn);

    fireEvent.change(startDateInput, { target: { value: "2026-10-15" } });
    fireEvent.change(endDateInput, { target: { value: "2026-12-15" } });

    const downloadBtn = screen.getByTestId("confirm-download-diary-btn");
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(handleExport).toHaveBeenCalledWith(1, "pdf", {
        startDate: "2026-10-15",
        endDate: "2026-12-15",
      });
    });
  });
});
