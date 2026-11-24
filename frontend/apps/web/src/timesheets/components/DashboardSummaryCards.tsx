import type { TimesheetData, DashboardSummaryData } from "../types";
import styles from "./DashboardSummaryCards.module.css";

export interface DashboardSummaryCardsProps {
  timesheet?: TimesheetData;
  adminSummary?: DashboardSummaryData;
  className?: string;
}

export function DashboardSummaryCards({
  timesheet,
  adminSummary,
  className,
}: DashboardSummaryCardsProps) {
  if (adminSummary) {
    const totalHours = parseFloat(adminSummary.total_hours || "0.00");
    const regularHours = parseFloat(adminSummary.total_regular_hours || "0.00");
    const overtimeHours = parseFloat(adminSummary.total_overtime_hours || "0.00");
    const pendingCount = adminSummary.pending_approval_count;
    const submittedCount = adminSummary.week_submitted_count;
    const approvedCount = adminSummary.week_approved_count;
    const activeCount = adminSummary.active_employees_count;

    return (
      <div
        className={[styles.cardsGrid, className].filter(Boolean).join(" ")}
        data-testid="admin-summary-cards"
      >
        <div
          className={[
            styles.card,
            pendingCount > 0 && styles.cardWarning,
          ]
            .filter(Boolean)
            .join(" ")}
          data-testid="summary-pending-approvals"
        >
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Pending Review</span>
            {pendingCount > 0 && (
              <span className={styles.cardBadge}>Action needed</span>
            )}
          </div>
          <div className={styles.cardValueGroup}>
            <span className={styles.cardValue}>{pendingCount}</span>
            <span className={styles.cardUnit}>timesheets</span>
          </div>
          <span className={styles.cardSubtext}>
            {submittedCount} submitted this week
          </span>
        </div>

        <div className={styles.card} data-testid="summary-team-hours">
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Team Total Hours</span>
          </div>
          <div className={styles.cardValueGroup}>
            <span className={styles.cardValue}>{totalHours.toFixed(1)}</span>
            <span className={styles.cardUnit}>hrs</span>
          </div>
          <span className={styles.cardSubtext}>
            {regularHours.toFixed(1)}h reg &bull; {overtimeHours.toFixed(1)}h OT
          </span>
        </div>

        <div className={styles.card} data-testid="summary-approved-count">
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Approved</span>
          </div>
          <div className={styles.cardValueGroup}>
            <span className={styles.cardValue}>{approvedCount}</span>
            <span className={styles.cardUnit}>/ {activeCount} staff</span>
          </div>
          <span className={styles.cardSubtext}>
            {adminSummary.week_open_count} open &bull; {adminSummary.week_returned_count} returned
          </span>
        </div>

        <div className={styles.card} data-testid="summary-active-team">
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Active Team</span>
          </div>
          <div className={styles.cardValueGroup}>
            <span className={styles.cardValue}>{activeCount}</span>
            <span className={styles.cardUnit}>employees</span>
          </div>
          <span className={styles.cardSubtext}>
            Week of {adminSummary.week_start_date}
          </span>
        </div>
      </div>
    );
  }

  if (timesheet) {
    const totalWeek = parseFloat(timesheet.total_week_hours || "0.00");
    const regular = parseFloat(timesheet.total_regular_hours || "0.00");
    const overtime = parseFloat(timesheet.total_overtime_hours || "0.00");
    const projectsCount = timesheet.assigned_projects?.length || 0;

    return (
      <div
        className={[styles.cardsGrid, className].filter(Boolean).join(" ")}
        data-testid="employee-summary-cards"
      >
        <div className={styles.card} data-testid="summary-week-hours">
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Total Logged</span>
          </div>
          <div className={styles.cardValueGroup}>
            <span className={styles.cardValue}>{totalWeek.toFixed(1)}</span>
            <span className={styles.cardUnit}>hrs</span>
          </div>
          <span className={styles.cardSubtext}>
            Week starting {timesheet.week_start_date}
          </span>
        </div>

        <div className={styles.card} data-testid="summary-reg-ot">
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Regular vs Overtime</span>
          </div>
          <div className={styles.cardValueGroup}>
            <span className={styles.cardValue}>{regular.toFixed(1)}</span>
            <span className={styles.cardUnit}>/ {overtime.toFixed(1)}h OT</span>
          </div>
          <span className={styles.cardSubtext}>
            Standard 8.0h daily threshold
          </span>
        </div>

        <div className={styles.card} data-testid="summary-week-status">
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Status</span>
          </div>
          <div className={styles.cardValueGroup}>
            <span className={styles.cardValue}>{timesheet.status}</span>
          </div>
          <span className={styles.cardSubtext}>
            {timesheet.can_edit ? "Open for logging" : "Read-only"}
          </span>
        </div>

        <div className={styles.card} data-testid="summary-assigned-projects">
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Assigned Projects</span>
          </div>
          <div className={styles.cardValueGroup}>
            <span className={styles.cardValue}>{projectsCount}</span>
            <span className={styles.cardUnit}>active</span>
          </div>
          <span className={styles.cardSubtext}>
            {timesheet.rows?.length || 0} rows in timesheet
          </span>
        </div>
      </div>
    );
  }

  return null;
}
