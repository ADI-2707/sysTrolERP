import { useState, useMemo, useRef } from "react";
import { DataGrid, Button, type DataGridColumn } from "@systrol/ui";
import type { TimesheetData, TimesheetRowData } from "../types";
import { getDayLabel } from "../utils/dateUtils";
import { validateQuarterHours, parseClipboardHours } from "../utils/validation";
import { TimesheetCellEditor } from "./TimesheetCellEditor";
import { AddProjectRowModal } from "./AddProjectRowModal";
import styles from "./TimesheetGrid.module.css";

export interface TimesheetGridProps {
  timesheet: TimesheetData;
  onCellChange?: (projectId: number, date: string, hours: string) => void;
  onAddRow?: (projectId: number, description: string) => Promise<void> | void;
  onDeleteRow?: (rowId: number) => Promise<void> | void;
  className?: string;
  readOnly?: boolean;
}

export function TimesheetGrid({
  timesheet,
  onCellChange,
  onAddRow,
  onDeleteRow,
  className,
  readOnly = false,
}: TimesheetGridProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isAddRowOpen, setIsAddRowOpen] = useState(false);
  const [isAddingRow, setIsAddingRow] = useState(false);

  const existingProjectIds = useMemo(
    () => timesheet.rows.map((r) => r.project.id),
    [timesheet.rows]
  );

  const canEdit = !readOnly && timesheet.can_edit;

  const handleAddRow = async (projectId: number, description: string) => {
    if (!onAddRow) return;
    try {
      setIsAddingRow(true);
      await onAddRow(projectId, description);
      setIsAddRowOpen(false);
    } finally {
      setIsAddingRow(false);
    }
  };

  const columns = useMemo<DataGridColumn<TimesheetRowData>[]>(() => {
    const cols: DataGridColumn<TimesheetRowData>[] = [
      {
        id: "project",
        header: "Project",
        width: 240,
        sticky: true,
        renderCell: (row: TimesheetRowData) => {
          const isEmptyRow = parseFloat(row.row_total || "0") === 0;

          return (
            <div className={styles.projectCell}>
              <div className={styles.projectHeader}>
                <div className={styles.projectTitleGroup}>
                  <span className={styles.projectCode}>{row.project.code}</span>
                  <span className={styles.projectName}>{row.project.name}</span>
                </div>
                {canEdit && onDeleteRow && isEmptyRow && (
                  <button
                    type="button"
                    className={styles.deleteRowBtn}
                    onClick={() => onDeleteRow(row.id)}
                    aria-label={`Delete row for ${row.project.code}`}
                    data-testid={`delete-row-${row.id}`}
                  >
                    ✕
                  </button>
                )}
              </div>
              {row.description && <span className={styles.projectDesc}>{row.description}</span>}
            </div>
          );
        },
      },
    ];

    for (const dayDate of timesheet.days) {
      const { dayName, dayNumber } = getDayLabel(dayDate);

      cols.push({
        id: dayDate,
        header: (
          <div className={styles.dayHeader}>
            <span className={styles.dayName}>{dayName}</span>
            <span className={styles.dayNumber}>{dayNumber}</span>
          </div>
        ),
        width: 100,
        isEditable: (row: TimesheetRowData) => {
          if (!canEdit) return false;
          const entry = row.entries.find((e) => e.date === dayDate);
          return entry?.is_editable ?? false;
        },
        renderCell: (row: TimesheetRowData) => {
          const entry = row.entries.find((e) => e.date === dayDate);
          const hours = entry ? parseFloat(entry.hours).toFixed(1) : "0.0";
          const isEditable = canEdit && (entry?.is_editable ?? false);
          const hasNote = Boolean(entry?.note);

          return (
            <div
              className={[styles.hourCell, !isEditable && styles.nonEditable]
                .filter(Boolean)
                .join(" ")}
              data-testid={`cell-${row.project.id}-${dayDate}`}
            >
              <span>{hours}</span>
              {hasNote && <span className={styles.hasNote} aria-label="Has task note" />}
            </div>
          );
        },
        renderEdit: (
          row: TimesheetRowData,
          _rIdx: number,
          _cIdx: number,
          onCommit: (val: unknown) => void,
          onCancel: () => void
        ) => {
          const entry = row.entries.find((e) => e.date === dayDate);
          const initialHours = entry ? parseFloat(entry.hours).toFixed(2) : "0.00";
          const step = parseFloat(timesheet.policy?.hour_step || "0.25");

          return (
            <TimesheetCellEditor
              initialValue={initialHours}
              step={step}
              onCommit={(val) => {
                onCommit(val);
                onCellChange?.(row.project.id, dayDate, val);
              }}
              onCancel={onCancel}
              aria-label={`Hours for ${row.project.code} on ${dayDate}`}
            />
          );
        },
      });
    }

    cols.push({
      id: "total",
      header: "Total",
      width: 90,
      sticky: true,
      renderCell: (row: TimesheetRowData) => (
        <div className={styles.totalCell}>
          <span>{parseFloat(row.row_total).toFixed(1)}</span>
        </div>
      ),
    });

    return cols;
  }, [timesheet.days, canEdit, timesheet.policy, onCellChange, onDeleteRow]);

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (!onCellChange || !canEdit) return;

    const text = e.clipboardData.getData("text");
    if (!text) return;

    const matrix = parseClipboardHours(text);
    if (matrix.length === 0) return;

    const activeEl = document.activeElement as HTMLElement | null;
    const targetTd =
      activeEl?.closest("td") ||
      wrapperRef.current?.querySelector('td[data-focused="true"]');

    if (!targetTd) return;

    const rIdxAttr = targetTd.closest("tr")?.getAttribute("aria-rowindex");
    const cIdxAttr = targetTd.getAttribute("aria-colindex");

    if (!rIdxAttr || !cIdxAttr) return;

    const startRowIndex = Number(rIdxAttr) - 1;
    const startColIndex = Number(cIdxAttr) - 1;
    const step = parseFloat(timesheet.policy?.hour_step || "0.25");
    let changedAny = false;

    for (let r = 0; r < matrix.length; r++) {
      const rowIndex = startRowIndex + r;
      const row = timesheet.rows[rowIndex];
      if (!row) continue;

      for (let c = 0; c < matrix[r].length; c++) {
        let colIndex = startColIndex + c;
        if (colIndex === 0) colIndex = 1;
        if (colIndex < 1 || colIndex > timesheet.days.length) continue;

        const dayDate = timesheet.days[colIndex - 1];
        const entry = row.entries.find((item) => item.date === dayDate);
        if (!entry || !entry.is_editable) continue;

        const val = matrix[r][c];
        const res = validateQuarterHours(val, step);
        if (res.valid && res.normalized !== undefined) {
          onCellChange(row.project.id, dayDate, res.normalized);
          changedAny = true;
        }
      }
    }

    if (changedAny) {
      e.preventDefault();
    }
  };

  const renderFooter = () => (
    <tr data-testid="timesheet-footer">
      <td colSpan={columns.length} style={{ padding: 0 }}>
        <div className={styles.footerContainer}>
          <div className={styles.footerRow}>
            <span className={styles.footerLabel}>Regular Hours</span>
            <div className={styles.footerValues}>
              {timesheet.days.map((d) => (
                <span key={d} className={styles.footerVal}>
                  {parseFloat(timesheet.day_regular[d] || "0").toFixed(1)}
                </span>
              ))}
              <span className={styles.footerTotal}>
                {parseFloat(timesheet.total_regular_hours || "0").toFixed(1)}
              </span>
            </div>
          </div>

          <div className={styles.footerRow}>
            <span className={styles.footerLabel}>Overtime Hours</span>
            <div className={styles.footerValues}>
              {timesheet.days.map((d) => (
                <span key={d} className={styles.footerVal}>
                  {parseFloat(timesheet.day_overtime[d] || "0").toFixed(1)}
                </span>
              ))}
              <span className={styles.footerTotal}>
                {parseFloat(timesheet.total_overtime_hours || "0").toFixed(1)}
              </span>
            </div>
          </div>

          <div className={styles.footerRow}>
            <span className={styles.footerLabel}>Daily Total</span>
            <div className={styles.footerValues}>
              {timesheet.days.map((d) => (
                <span key={d} className={styles.footerVal}>
                  {parseFloat(timesheet.day_totals[d] || "0").toFixed(1)}
                </span>
              ))}
              <span className={styles.footerTotal}>
                {parseFloat(timesheet.total_week_hours || "0").toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );

  return (
    <div
      ref={wrapperRef}
      onPaste={handlePaste}
      className={[styles.gridWrapper, className].filter(Boolean).join(" ")}
    >
      {canEdit && onAddRow && (
        <div className={styles.toolbar}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsAddRowOpen(true)}
            data-testid="add-project-row-btn"
          >
            Add Project Row
          </Button>
        </div>
      )}

      <DataGrid
        rows={timesheet.rows}
        columns={columns}
        rowKey={(row) => row.id}
        renderFooter={renderFooter}
        aria-label={`Timesheet grid for week starting ${timesheet.week_start_date}`}
      />

      {onAddRow && (
        <AddProjectRowModal
          isOpen={isAddRowOpen}
          onClose={() => setIsAddRowOpen(false)}
          onAddRow={handleAddRow}
          assignedProjects={timesheet.assigned_projects}
          existingProjectIds={existingProjectIds}
          isLoading={isAddingRow}
        />
      )}
    </div>
  );
}
