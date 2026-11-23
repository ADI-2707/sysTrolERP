import { useMemo } from "react";
import { DataGrid, type DataGridColumn } from "@systrol/ui";
import type { TimesheetData, TimesheetRowData } from "../types";
import { getDayLabel } from "../utils/dateUtils";
import styles from "./TimesheetGrid.module.css";

export interface TimesheetGridProps {
  timesheet: TimesheetData;
  className?: string;
}

export function TimesheetGrid({ timesheet, className }: TimesheetGridProps) {
  const columns = useMemo<DataGridColumn<TimesheetRowData>[]>(() => {
    const cols: DataGridColumn<TimesheetRowData>[] = [
      {
        id: "project",
        header: "Project",
        width: 240,
        sticky: true,
        renderCell: (row: TimesheetRowData) => (
          <div className={styles.projectCell}>
            <div className={styles.projectHeader}>
              <span className={styles.projectCode}>{row.project.code}</span>
              <span className={styles.projectName}>{row.project.name}</span>
            </div>
            {row.description && <span className={styles.projectDesc}>{row.description}</span>}
          </div>
        ),
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
        renderCell: (row: TimesheetRowData) => {
          const entry = row.entries.find((e) => e.date === dayDate);
          const hours = entry ? parseFloat(entry.hours).toFixed(1) : "0.0";
          const isEditable = entry?.is_editable ?? false;
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
  }, [timesheet.days]);

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
    <div className={[styles.gridWrapper, className].filter(Boolean).join(" ")}>
      <DataGrid
        rows={timesheet.rows}
        columns={columns}
        rowKey={(row) => row.id}
        renderFooter={renderFooter}
        aria-label={`Timesheet grid for week starting ${timesheet.week_start_date}`}
      />
    </div>
  );
}
