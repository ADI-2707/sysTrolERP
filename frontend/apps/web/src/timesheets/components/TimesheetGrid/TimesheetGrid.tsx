import { useMemo, useRef } from "react";
import type { TimesheetData, AssignedProject } from "../../types";
import type { CellSaveStatus } from "../../hooks/useTimesheetAutosave";
import { getDayLabel, isCurrentWeek as checkIsCurrentWeek } from "../../utils/dateUtils";
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
}: TimesheetGridProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canEdit = !readOnly && timesheet.can_edit;

  const existingProjectIds = useMemo(
    () => timesheet.rows.map((r) => r.project.id),
    [timesheet.rows]
  );

  const availableProjects: AssignedProject[] = useMemo(() => {
    return timesheet.available_projects || timesheet.assigned_projects || [];
  }, [timesheet.available_projects, timesheet.assigned_projects]);

  const step = parseFloat(timesheet.policy?.hour_step || "0.25");

  // Determine current week status for next week restriction
  const isCurrent = isCurrentWeek !== undefined ? isCurrentWeek : checkIsCurrentWeek(timesheet.week_start_date);
  const allowNext = canGoNext !== undefined ? canGoNext : !isCurrent;

  const handleSelectNewProject = async (projectId: number) => {
    if (onAddRow) {
      await onAddRow(projectId, "");
    }
  };

  return (
    <div className={[styles.gridOuterWrapper, className].filter(Boolean).join(" ")} ref={wrapperRef}>
      {/* Return Reason Alert Banner if Timesheet was Returned */}
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

      {/* Infinite Scrollable Table Container */}
      <div className={styles.scrollContainer} data-testid="timesheet-scroll-container">
        <table className={styles.timesheetTable} role="grid" aria-label={`Timesheet for week ${timesheet.week_start_date}`}>
          <thead>
            {/* Row 0: Full-Width Week Navigation Header */}
            <tr className={styles.weekNavRow}>
              <th colSpan={16} className={styles.weekNavCell}>
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
              </th>
            </tr>

            {/* Row 1: Main Headers (Project + 7 Days + Total) */}
            <tr className={styles.mainHeaderRow}>
              <th rowSpan={2} className={styles.stickyProjectHeader}>
                Project
              </th>
              {timesheet.days.map((dayDate) => {
                const { dayName, dayNumber } = getDayLabel(dayDate);
                return (
                  <th key={dayDate} colSpan={2} className={styles.dayGroupHeader}>
                    <span className={styles.dayName}>{dayName}</span>
                    <span className={styles.dayNumber}>{dayNumber}</span>
                  </th>
                );
              })}
              <th rowSpan={2} className={styles.stickyTotalHeader}>
                Total
              </th>
            </tr>

            {/* Row 2: Sub-Columns (Desc + Hours for each day) */}
            <tr className={styles.subHeaderRow}>
              {timesheet.days.map((dayDate) => (
                <th key={`${dayDate}-subcols`} colSpan={2} className={styles.subHeaderThWrapper}>
                  <div className={styles.subHeaderGroup}>
                    <span className={styles.subHeaderDesc}>Desc</span>
                    <span className={styles.subHeaderHours}>Hours</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* Render Logged Project Rows */}
            {timesheet.rows.map((row) => {
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
                  <td className={styles.stickyTotalCell}>
                    <span className={styles.rowTotalVal}>{parseFloat(row.row_total || "0").toFixed(1)}</span>
                  </td>
                </tr>
              );
            })}

            {/* Auto Excel Placeholder Row (Always present at the bottom to pick a project directly) */}
            {canEdit && onAddRow && (
              <tr className={styles.placeholderRow} data-testid="timesheet-placeholder-row">
                <td className={styles.stickyProjectCell}>
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

                <td className={styles.stickyTotalCell}>
                  <span className={styles.placeholderEmptyText}>0.0</span>
                </td>
              </tr>
            )}
          </tbody>

          {/* Sticky Summary Rows at Bottom */}
          <tfoot className={styles.gridFooter}>
            {/* Summary Row 1: Total Working Hours */}
            <tr className={styles.footerRowTotal}>
              <td className={styles.stickyProjectCell}>
                <span className={styles.footerLabel}>Total Working Hours</span>
              </td>
              {timesheet.days.map((d) => (
                <td key={`tot-${d}`} colSpan={2} className={styles.footerDayValCell}>
                  <span className={styles.footerDayValue}>
                    {parseFloat(timesheet.day_totals[d] || "0").toFixed(1)}
                  </span>
                </td>
              ))}
              <td className={styles.stickyTotalCell}>
                <span className={styles.footerGrandTotal}>
                  {parseFloat(timesheet.total_week_hours || "0").toFixed(1)}
                </span>
              </td>
            </tr>

            {/* Summary Row 2: Overtime Hours */}
            <tr className={styles.footerRowOt}>
              <td className={styles.stickyProjectCell}>
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
              <td className={styles.stickyTotalCell}>
                <span className={styles.footerOtTotal}>
                  {parseFloat(timesheet.total_overtime_hours || "0").toFixed(1)}
                </span>
              </td>
            </tr>

            {/* Summary Row 3: Regular Hours */}
            <tr className={styles.footerRowReg}>
              <td className={styles.stickyProjectCell}>
                <span className={styles.footerLabel}>Regular Hours</span>
              </td>
              {timesheet.days.map((d) => (
                <td key={`reg-${d}`} colSpan={2} className={styles.footerDayValCell}>
                  <span className={styles.footerDayMuted}>
                    {parseFloat(timesheet.day_regular[d] || "0").toFixed(1)}
                  </span>
                </td>
              ))}
              <td className={styles.stickyTotalCell}>
                <span className={styles.footerDayMuted}>
                  {parseFloat(timesheet.total_regular_hours || "0").toFixed(1)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
