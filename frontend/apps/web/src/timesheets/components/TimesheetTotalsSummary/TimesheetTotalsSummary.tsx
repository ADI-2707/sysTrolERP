import type { TimesheetData } from "../../types";
import { getDayLabel } from "../../utils/dateUtils";
import styles from "./TimesheetTotalsSummary.module.css";

export interface TimesheetTotalsSummaryProps {
  timesheet: TimesheetData;
  className?: string;
}

export function TimesheetTotalsSummary({
  timesheet,
  className,
}: TimesheetTotalsSummaryProps) {
  const dailyThreshold = parseFloat(timesheet.policy?.daily_regular_hours || "8.00");
  const weeklyTarget = dailyThreshold * 5;

  const totalRegular = parseFloat(timesheet.total_regular_hours || "0.00");
  const totalOvertime = parseFloat(timesheet.total_overtime_hours || "0.00");
  const totalWeek = parseFloat(timesheet.total_week_hours || "0.00");

  const progressPercent = Math.min(100, Math.round((totalRegular / (weeklyTarget || 40)) * 100));
  const isTargetMet = totalRegular >= weeklyTarget;

  return (
    <div
      className={[styles.card, className].filter(Boolean).join(" ")}
      data-testid="timesheet-totals-summary"
    >
      <div className={styles.metricsRow}>
        <div className={styles.metricBox}>
          <span className={styles.metricLabel}>Regular Hours</span>
          <div className={styles.metricValueGroup}>
            <span className={styles.metricValue}>{totalRegular.toFixed(1)}</span>
            <span className={styles.metricTarget}>/ {weeklyTarget.toFixed(1)}h</span>
          </div>
        </div>

        <div className={styles.metricBox}>
          <span className={styles.metricLabel}>Overtime Hours</span>
          <div className={styles.metricValueGroup}>
            <span className={styles.metricValue}>{totalOvertime.toFixed(1)}</span>
            <span className={styles.metricTarget}>hrs</span>
          </div>
        </div>

        <div className={styles.metricBox}>
          <span className={styles.metricLabel}>Total Week</span>
          <div className={styles.metricValueGroup}>
            <span className={styles.metricValue}>{totalWeek.toFixed(1)}</span>
            <span className={styles.metricTarget}>hrs</span>
          </div>
        </div>
      </div>

      <div className={styles.progressBarContainer}>
        <div className={styles.progressBarTrack} role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
          <div
            className={[styles.progressBarFill, isTargetMet && styles.progressBarFillMet]
              .filter(Boolean)
              .join(" ")}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className={styles.progressBarLabels}>
          <span>{progressPercent}% of standard 40h</span>
          <span>{isTargetMet ? "Standard Target Reached" : `${(weeklyTarget - totalRegular).toFixed(1)}h remaining`}</span>
        </div>
      </div>

      <div className={styles.dailyPillsContainer} data-testid="daily-compliance-pills">
        {timesheet.days.map((d) => {
          const { dayName } = getDayLabel(d);
          const dayTotal = parseFloat(timesheet.day_totals[d] || "0.00");
          const dayOt = parseFloat(timesheet.day_overtime[d] || "0.00");

          let statusClass = styles.pillOff;
          let label = `${dayName}: 0h`;

          if (dayOt > 0) {
            statusClass = styles.pillOt;
            label = `${dayName}: ${dayTotal.toFixed(1)}h (+${dayOt.toFixed(1)}h OT)`;
          } else if (dayTotal >= dailyThreshold) {
            statusClass = styles.pillMet;
            label = `${dayName}: ${dayTotal.toFixed(1)}h (Met)`;
          } else if (dayTotal > 0) {
            statusClass = styles.pillUnder;
            label = `${dayName}: ${dayTotal.toFixed(1)}h`;
          }

          return (
            <span
              key={d}
              className={[styles.dailyPill, statusClass].filter(Boolean).join(" ")}
              data-testid={`daily-pill-${d}`}
            >
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
