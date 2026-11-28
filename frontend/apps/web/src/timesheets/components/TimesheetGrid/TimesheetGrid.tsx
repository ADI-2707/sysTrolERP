import { useState, useMemo, useRef } from "react";
import type { TimesheetData, AssignedProject } from "../../types";
import type { CellSaveStatus } from "../../hooks/useTimesheetAutosave";
import { getDayLabel, isCurrentWeek as checkIsCurrentWeek } from "../../utils/dateUtils";
import { exportSiteDiary } from "../../../api/timesheets";
import { Modal } from "../../../ui/components/Modal";
import { ProjectDropdownCell } from "./ProjectDropdownCell";
import { TimesheetDescCell } from "./TimesheetDescCell";
import { TimesheetHoursCell } from "./TimesheetHoursCell";
import { TimesheetStatusBanner } from "../TimesheetStatusBanner";
import styles from "./TimesheetGrid.module.css";

export interface TimesheetGridProps {
  timesheet: TimesheetData;
  onCellChange?: (projectId: number, date: string, hours: string) => void;
  onNoteChange?: (projectId: number, date: string, note: string) => void;
  onAddRow?: (projectId: number, description: string) => Promise<void> | void;
  onDeleteRow?: (rowId: number) => Promise<void> | void;
  onSubmitTimesheet?: () => Promise<void> | void;
  onPreviousWeek?: () => void;
  onNextWeek?: () => void;
  canGoNext?: boolean;
  displayRange?: string;
  isCurrentWeek?: boolean;
  cellStatuses?: Record<string, CellSaveStatus>;
  globalStatus?: CellSaveStatus;
  className?: string;
  readOnly?: boolean;
  onExportSiteDiary?: (
    projectId: number,
    format: "pdf" | "excel",
    range?: { startDate: string; endDate: string }
  ) => Promise<void> | void;
}

export function TimesheetGrid({
  timesheet,
  onCellChange,
  onNoteChange,
  onAddRow,
  onDeleteRow,
  onSubmitTimesheet,
  onPreviousWeek,
  onNextWeek,
  canGoNext,
  displayRange,
  isCurrentWeek,
  cellStatuses,
  globalStatus,
  className,
  readOnly = false,
  onExportSiteDiary,
}: TimesheetGridProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canEdit = !readOnly && timesheet.can_edit;
  const [projectSearch, setProjectSearch] = useState("");
  const [hideEmptyRows, setHideEmptyRows] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedExportProjectId, setSelectedExportProjectId] = useState<number | null>(null);
  const [selectedExportFormat, setSelectedExportFormat] = useState<"pdf" | "excel">("pdf");
  const [rangeMode, setRangeMode] = useState<"week" | "month" | "custom">("week");
  const [customStartDate, setCustomStartDate] = useState(timesheet.week_start_date);
  const [customEndDate, setCustomEndDate] = useState(timesheet.week_end_date);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleRangeModeChange = (mode: "week" | "month" | "custom") => {
    setRangeMode(mode);
    if (mode === "week") {
      setCustomStartDate(timesheet.week_start_date);
      setCustomEndDate(timesheet.week_end_date);
    } else if (mode === "month") {
      const parts = timesheet.week_start_date.split("-");
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const start = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      setCustomStartDate(start);
      setCustomEndDate(end);
    }
  };

  const handleExportSiteDiary = async (
    projectId: number,
    format: "pdf" | "excel",
    range?: { startDate: string; endDate: string }
  ) => {
    try {
      setIsExporting(true);
      setExportError(null);
      if (onExportSiteDiary) {
        if (range) {
          await onExportSiteDiary(projectId, format, range);
        } else {
          await onExportSiteDiary(projectId, format);
        }
      } else {
        if (range) {
          await exportSiteDiary({
            projectId,
            startDate: range.startDate,
            endDate: range.endDate,
            format,
          });
        } else {
          await exportSiteDiary(timesheet.id, projectId, format);
        }
      }
      setIsExportModalOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to export site diary";
      setExportError(message);
    } finally {
      setIsExporting(false);
    }
  };

  const existingProjectIds = useMemo(
    () => timesheet.rows.map((r) => r.project.id),
    [timesheet.rows]
  );

  const availableProjects: AssignedProject[] = useMemo(() => {
    return timesheet.available_projects || timesheet.assigned_projects || [];
  }, [timesheet.available_projects, timesheet.assigned_projects]);

  const filteredRows = useMemo(() => {
    return timesheet.rows.filter((row) => {
      if (hideEmptyRows && parseFloat(row.row_total || "0") === 0) {
        return false;
      }
      if (projectSearch.trim()) {
        const query = projectSearch.toLowerCase().trim();
        const code = row.project.code.toLowerCase();
        const name = row.project.name.toLowerCase();
        if (!code.includes(query) && !name.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [timesheet.rows, hideEmptyRows, projectSearch]);

  const step = parseFloat(timesheet.policy?.hour_step || "0.25");

  const isCurrent = isCurrentWeek !== undefined ? isCurrentWeek : checkIsCurrentWeek(timesheet.week_start_date);
  const allowNext = canGoNext !== undefined ? canGoNext : !isCurrent;

  const handleSelectNewProject = async (projectId: number) => {
    if (onAddRow) {
      await onAddRow(projectId, "");
    }
  };

  return (
    <div className={[styles.gridOuterWrapper, className].filter(Boolean).join(" ")} ref={wrapperRef}>
      {timesheet.status === "RETURNED" && timesheet.return_reason && (
        <TimesheetStatusBanner
          status={timesheet.status}
          canSubmit={timesheet.can_submit}
          submittedAt={timesheet.submitted_at}
          approvedAt={timesheet.approved_at}
          approvedByLabel={timesheet.approved_by_label}
          returnedAt={timesheet.returned_at}
          returnedByLabel={timesheet.returned_by_label}
          returnReason={timesheet.return_reason}
          weekStartDate={timesheet.week_start_date}
          onSubmit={onSubmitTimesheet}
        />
      )}

      <div className={styles.gridCardWrapper}>
        <div className={styles.weekNavCard}>
          <div className={styles.weekNavContent}>
            <div className={styles.weekControls}>
              {onPreviousWeek && (
                <button
                  type="button"
                  className={styles.navArrowBtn}
                  onClick={onPreviousWeek}
                  aria-label="Previous week"
                  title="Go to previous week"
                >
                  ‹
                </button>
              )}

              <span className={styles.weekDisplayRange}>
                {displayRange || `Week of ${timesheet.week_start_date}`}
              </span>

              {onNextWeek && (
                <button
                  type="button"
                  className={styles.navArrowBtn}
                  disabled={!allowNext || isCurrent}
                  onClick={onNextWeek}
                  aria-label="Next week"
                  title={!allowNext || isCurrent ? "Cannot navigate to future weeks" : "Go to next week"}
                >
                  ›
                </button>
              )}

              <span className={[styles.statusBadge, styles[`status_${timesheet.status}`]].join(" ")}>
                {timesheet.status}
              </span>
            </div>

            <div className={styles.weekActions}>
              {globalStatus && globalStatus !== "idle" && (
                <span className={[styles.autosaveBadge, styles[globalStatus]].join(" ")} data-testid="autosave-status-badge">
                  {globalStatus === "saving" && "Saving..."}
                  {globalStatus === "saved" && "Saved"}
                  {globalStatus === "error" && "Error saving"}
                </span>
              )}

              <span className={styles.weekTotalPill}>
                Week Total: <strong>{parseFloat(timesheet.total_week_hours || "0").toFixed(1)}h</strong>
              </span>

              <input
                type="text"
                className={styles.rowSearchInput}
                placeholder="Search projects..."
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                data-testid="timesheet-row-search-input"
              />

              <button
                type="button"
                className={[styles.filterToggleBtn, hideEmptyRows && styles.filterToggleActive].filter(Boolean).join(" ")}
                onClick={() => setHideEmptyRows(!hideEmptyRows)}
                data-testid="toggle-hide-empty-rows-btn"
              >
                {hideEmptyRows ? "Show Empty Rows" : "Hide Empty Rows"}
              </button>

              <button
                type="button"
                className={styles.exportDiaryHeaderBtn}
                onClick={() => {
                  if (timesheet.rows.length > 0) {
                    setSelectedExportProjectId(timesheet.rows[0].project.id);
                  }
                  setRangeMode("week");
                  setCustomStartDate(timesheet.week_start_date);
                  setCustomEndDate(timesheet.week_end_date);
                  setExportError(null);
                  setIsExportModalOpen(true);
                }}
                data-testid="open-export-diary-modal-btn"
                title="Export site diary report (PDF or Excel)"
              >
                Site Diary
              </button>

              {canEdit && timesheet.can_submit && onSubmitTimesheet && (
                <button
                  type="button"
                  className={styles.submitTimesheetBtn}
                  onClick={onSubmitTimesheet}
                  data-testid="submit-timesheet-btn"
                >
                  Submit Timesheet
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Infinite Scrollable Table Container (Only day date and sub-columns scroll horizontally) */}
        <div className={styles.scrollContainer} data-testid="timesheet-scroll-container">
          <table className={styles.timesheetTable} role="grid" aria-label={`Timesheet for week ${timesheet.week_start_date}`}>
            <thead>
              {/* Row 1: Main Headers (Project + 7 Days + Total) */}
              <tr className={styles.mainHeaderRow}>
                <th rowSpan={2} className={styles.stickyProjectHeader} scope="col">
                  <span className={styles.projectHeaderTitle}>Project</span>
                </th>
                {timesheet.days.map((dayDate) => {
                  const { dayName, dayNumber } = getDayLabel(dayDate);
                  return (
                    <th key={dayDate} colSpan={2} className={styles.dayGroupHeader} scope="colgroup">
                      <span className={styles.dayName}>{dayName}</span>
                      <span className={styles.dayNumber}>{dayNumber}</span>
                    </th>
                  );
                })}
                <th rowSpan={2} className={styles.totalHeader} scope="col">
                  Total
                </th>
              </tr>

              {/* Row 2: Sub-Columns (Desc + Hours for each day) */}
              <tr className={styles.subHeaderRow}>
                {timesheet.days.map((dayDate) => (
                  <th key={`${dayDate}-subcols`} colSpan={2} className={styles.subHeaderThWrapper} scope="colgroup">
                    <div className={styles.subHeaderGroup}>
                      <span className={styles.subHeaderDesc}>Desc</span>
                      <span className={styles.subHeaderHours}>Hours</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

          <tbody>
            {filteredRows.length === 0 && timesheet.rows.length > 0 && (
              <tr>
                <td colSpan={16} className={styles.emptyFilteredRows}>
                  No project rows match your filter.
                </td>
              </tr>
            )}
            {filteredRows.map((row) => {
              const isEmptyRow = parseFloat(row.row_total || "0") === 0;

              return (
                <tr key={row.id} className={styles.gridRow} data-testid={`timesheet-row-${row.id}`}>
                  {/* Sticky Project Column */}
                  <td className={styles.stickyProjectCell}>
                    <ProjectDropdownCell
                      project={row.project}
                      availableProjects={availableProjects}
                      existingProjectIds={existingProjectIds}
                      onSelectProject={() => {}}
                      onDeleteRow={onDeleteRow ? () => onDeleteRow(row.id) : undefined}
                      canEdit={canEdit}
                      isEmptyRow={isEmptyRow}
                      onExportSiteDiary={(format) => handleExportSiteDiary(row.project.id, format)}
                    />
                  </td>

                  {/* 7 Days: Dual Sub-Columns (Desc + Hours) */}
                  {timesheet.days.map((dayDate) => {
                    const entry = row.entries.find((e) => e.date === dayDate);
                    const cellKey = `${row.project.id}:${dayDate}`;
                    const cellStatus = cellStatuses?.[cellKey];
                    const isEditable = canEdit && (entry?.is_editable ?? false);

                    return (
                      <td key={dayDate} colSpan={2} className={styles.daySubCellsWrapper}>
                        <div className={styles.dualCellContainer}>
                          <div className={styles.descCellPart}>
                            <TimesheetDescCell
                              value={entry?.note || ""}
                              date={dayDate}
                              isEditable={isEditable}
                              onChange={(newDesc) => onNoteChange?.(row.project.id, dayDate, newDesc)}
                              maxLength={200}
                              aria-label={`Description for ${row.project.code} on ${dayDate}`}
                            />
                          </div>

                          <div className={styles.hoursCellPart} data-testid={`cell-${row.project.id}-${dayDate}`}>
                            <TimesheetHoursCell
                              value={entry?.hours || "0.0"}
                              date={dayDate}
                              step={step}
                              isEditable={isEditable}
                              status={cellStatus}
                              onChange={(newHours) => onCellChange?.(row.project.id, dayDate, newHours)}
                              aria-label={`Hours for ${row.project.code} on ${dayDate}`}
                            />
                          </div>
                        </div>
                      </td>
                    );
                  })}

                  {/* Row Total Hours */}
                  <td className={styles.totalCell}>
                    <span className={styles.rowTotalVal}>{parseFloat(row.row_total || "0").toFixed(1)}</span>
                  </td>
                </tr>
              );
            })}

            {/* Auto Excel Placeholder Row (Always present at the bottom to pick a project directly) */}
            {canEdit && onAddRow && (
              <tr className={styles.placeholderRow} data-testid="timesheet-placeholder-row">
                <td className={styles.placeholderProjectCell}>
                  <ProjectDropdownCell
                    project={null}
                    availableProjects={availableProjects}
                    existingProjectIds={existingProjectIds}
                    onSelectProject={handleSelectNewProject}
                    canEdit={canEdit}
                  />
                </td>

                {timesheet.days.map((dayDate) => (
                  <td key={`placeholder-${dayDate}`} colSpan={2} className={styles.daySubCellsWrapper}>
                    <div className={styles.dualCellContainer}>
                      <div className={styles.descCellPart}>
                        <span className={styles.placeholderEmptyText}>—</span>
                      </div>
                      <div className={styles.hoursCellPart}>
                        <span className={styles.placeholderEmptyText}>0.0</span>
                      </div>
                    </div>
                  </td>
                ))}

                <td className={styles.totalCell}>
                  <span className={styles.placeholderEmptyText}>0.0</span>
                </td>
              </tr>
            )}
          </tbody>

          {/* Sticky Summary Rows at Bottom */}
          <tfoot className={styles.gridFooter}>
            {/* Summary Row 1: Total Working Hours */}
            <tr className={styles.footerRowTotal}>
              <td className={styles.footerStickyProjectCell}>
                <span className={styles.footerLabel}>Total Working Hours</span>
              </td>
              {timesheet.days.map((d) => (
                <td key={`tot-${d}`} colSpan={2} className={styles.footerDayValCell}>
                  <span className={styles.footerDayValue}>
                    {parseFloat(timesheet.day_totals[d] || "0").toFixed(1)}
                  </span>
                </td>
              ))}
              <td className={styles.totalCell}>
                <span className={styles.footerGrandTotal}>
                  {parseFloat(timesheet.total_week_hours || "0").toFixed(1)}
                </span>
              </td>
            </tr>

            {/* Summary Row 2: Overtime Hours */}
            <tr className={styles.footerRowOt}>
              <td className={styles.footerStickyProjectCell}>
                <span className={styles.footerLabel}>Overtime Hours</span>
              </td>
              {timesheet.days.map((d) => {
                const ot = parseFloat(timesheet.day_overtime[d] || "0");
                return (
                  <td key={`ot-${d}`} colSpan={2} className={styles.footerDayValCell}>
                    {ot > 0 ? (
                      <span className={styles.badgeOt} data-testid={`status-badge-${d}`}>
                        +{ot.toFixed(1)}h OT
                      </span>
                    ) : (
                      <span className={styles.footerDayMuted}>0.0</span>
                    )}
                  </td>
                );
              })}
              <td className={styles.totalCell}>
                <span className={styles.footerOtTotal}>
                  {parseFloat(timesheet.total_overtime_hours || "0").toFixed(1)}
                </span>
              </td>
            </tr>

            {/* Summary Row 3: Regular Hours */}
            <tr className={styles.footerRowReg}>
              <td className={styles.footerStickyProjectCell}>
                <span className={styles.footerLabel}>Regular Hours</span>
              </td>
              {timesheet.days.map((d) => (
                <td key={`reg-${d}`} colSpan={2} className={styles.footerDayValCell}>
                  <span className={styles.footerDayMuted}>
                    {parseFloat(timesheet.day_regular[d] || "0").toFixed(1)}
                  </span>
                </td>
              ))}
              <td className={styles.totalCell}>
                <span className={styles.footerDayMuted}>
                  {parseFloat(timesheet.total_regular_hours || "0").toFixed(1)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    {isExportModalOpen && (
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => {
          if (!isExporting) setIsExportModalOpen(false);
        }}
        title="Export Project Site Diary"
        size="sm"
      >
        <div className={styles.modalContent}>
          {timesheet.rows.length === 0 ? (
            <p className={styles.modalEmptyNotice}>No projects recorded in this timesheet to export.</p>
          ) : (
            <>
              <p className={styles.modalDescription}>
                Export an official site diary for this week with daily activity logs, hours, overtime calculations, and sign-off blocks.
              </p>

              {exportError && (
                <div className={styles.modalAlertDanger} role="alert">
                  {exportError}
                </div>
              )}

              <div className={styles.modalFieldGroup}>
                <label htmlFor="site-diary-project-select" className={styles.modalFieldLabel}>
                  Select Project
                </label>
                <select
                  id="site-diary-project-select"
                  className={styles.modalSelect}
                  value={selectedExportProjectId ?? timesheet.rows[0]?.project.id}
                  onChange={(e) => setSelectedExportProjectId(Number(e.target.value))}
                  disabled={isExporting}
                  data-testid="site-diary-project-select"
                >
                  {timesheet.rows.map((r) => (
                    <option key={r.project.id} value={r.project.id}>
                      {r.project.code} — {r.project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.modalFieldGroup}>
                <label className={styles.modalFieldLabel}>Date Range Period</label>
                <div className={styles.rangePresetGroup}>
                  <button
                    type="button"
                    className={[
                      styles.rangePresetBtn,
                      rangeMode === "week" && styles.rangePresetActive,
                    ].filter(Boolean).join(" ")}
                    onClick={() => handleRangeModeChange("week")}
                    data-testid="preset-week-btn"
                  >
                    Current Week
                  </button>
                  <button
                    type="button"
                    className={[
                      styles.rangePresetBtn,
                      rangeMode === "month" && styles.rangePresetActive,
                    ].filter(Boolean).join(" ")}
                    onClick={() => handleRangeModeChange("month")}
                    data-testid="preset-month-btn"
                  >
                    Full Month
                  </button>
                  <button
                    type="button"
                    className={[
                      styles.rangePresetBtn,
                      rangeMode === "custom" && styles.rangePresetActive,
                    ].filter(Boolean).join(" ")}
                    onClick={() => handleRangeModeChange("custom")}
                    data-testid="preset-custom-btn"
                  >
                    Custom Range
                  </button>
                </div>

                <div className={styles.customDateRow}>
                  <div className={styles.dateInputWrapper}>
                    <span className={styles.dateInputSubLabel}>From Date</span>
                    <input
                      type="date"
                      className={styles.rangeDateInput}
                      value={customStartDate}
                      onChange={(e) => {
                        setCustomStartDate(e.target.value);
                        setRangeMode("custom");
                      }}
                      disabled={isExporting}
                      data-testid="range-start-date"
                    />
                  </div>
                  <div className={styles.dateInputWrapper}>
                    <span className={styles.dateInputSubLabel}>To Date</span>
                    <input
                      type="date"
                      className={styles.rangeDateInput}
                      value={customEndDate}
                      onChange={(e) => {
                        setCustomEndDate(e.target.value);
                        setRangeMode("custom");
                      }}
                      disabled={isExporting}
                      data-testid="range-end-date"
                    />
                  </div>
                </div>
              </div>

              <div className={styles.modalFieldGroup}>
                <label className={styles.modalFieldLabel}>Export Format</label>
                <div className={styles.formatRadioGroup}>
                  <label className={styles.formatRadioLabel}>
                    <input
                      type="radio"
                      name="exportFormat"
                      value="pdf"
                      checked={selectedExportFormat === "pdf"}
                      onChange={() => setSelectedExportFormat("pdf")}
                      disabled={isExporting}
                      data-testid="format-radio-pdf"
                    />
                    <span>PDF Document (.pdf)</span>
                  </label>
                  <label className={styles.formatRadioLabel}>
                    <input
                      type="radio"
                      name="exportFormat"
                      value="excel"
                      checked={selectedExportFormat === "excel"}
                      onChange={() => setSelectedExportFormat("excel")}
                      disabled={isExporting}
                      data-testid="format-radio-excel"
                    />
                    <span>Excel Spreadsheet (.xlsx)</span>
                  </label>
                </div>
              </div>

              <div className={styles.modalActionsRow}>
                <button
                  type="button"
                  className={styles.modalCancelBtn}
                  onClick={() => setIsExportModalOpen(false)}
                  disabled={isExporting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.modalDownloadBtn}
                  onClick={() => {
                    const pid = selectedExportProjectId ?? timesheet.rows[0]?.project.id;
                    if (pid) {
                      if (rangeMode === "week") {
                        handleExportSiteDiary(pid, selectedExportFormat);
                      } else {
                        handleExportSiteDiary(pid, selectedExportFormat, {
                          startDate: customStartDate,
                          endDate: customEndDate,
                        });
                      }
                    }
                  }}
                  disabled={isExporting}
                  data-testid="confirm-download-diary-btn"
                >
                  {isExporting ? "Exporting..." : "Download Diary"}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    )}
  </div>
  );
}
