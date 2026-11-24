import { useState } from "react";
import { Button, ConfirmDialog } from "@systrol/ui";
import type { TimesheetStatus } from "../../types";
import styles from "./TimesheetStatusBanner.module.css";

export interface TimesheetStatusBannerProps {
  status: TimesheetStatus;
  canSubmit: boolean;
  submittedAt?: string | null;
  approvedAt?: string | null;
  approvedByLabel?: string | null;
  returnedAt?: string | null;
  returnedByLabel?: string | null;
  returnReason?: string | null;
  weekStartDate?: string;
  onSubmit?: () => Promise<void> | void;
  isSubmitting?: boolean;
  className?: string;
}

export function TimesheetStatusBanner({
  status,
  canSubmit,
  submittedAt,
  approvedAt,
  approvedByLabel,
  returnedAt,
  returnedByLabel,
  returnReason,
  weekStartDate,
  onSubmit,
  isSubmitting = false,
  className,
}: TimesheetStatusBannerProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleConfirmSubmit = async () => {
    if (!onSubmit) return;
    try {
      await onSubmit();
      setIsConfirmOpen(false);
    } catch {
      setIsConfirmOpen(false);
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case "SUBMITTED":
        return {
          bannerClass: styles.bannerSubmitted,
          badgeClass: styles.badgeSubmitted,
          title: "Timesheet Submitted",
          description: `Submitted${submittedAt ? ` on ${new Date(submittedAt).toLocaleDateString()}` : ""}. Awaiting administrator review. Timesheet is locked for editing.`,
          buttonText: null,
        };
      case "APPROVED":
        return {
          bannerClass: styles.bannerApproved,
          badgeClass: styles.badgeApproved,
          title: "Timesheet Approved",
          description: `Approved by ${approvedByLabel || "Administrator"}${approvedAt ? ` on ${new Date(approvedAt).toLocaleDateString()}` : ""}. Hours for this week are finalized and locked.`,
          buttonText: null,
        };
      case "RETURNED":
        return {
          bannerClass: styles.bannerReturned,
          badgeClass: styles.badgeReturned,
          title: "Timesheet Returned for Correction",
          description: `Returned by ${returnedByLabel || "Administrator"}${returnedAt ? ` on ${new Date(returnedAt).toLocaleDateString()}` : ""}. Please review the reason below and update your hours.`,
          buttonText: "Re-submit Timesheet",
        };
      case "OPEN":
      default:
        return {
          bannerClass: styles.bannerOpen,
          badgeClass: styles.badgeOpen,
          title: "Week In Progress",
          description: "Timesheet is open for time logging. The week will auto-submit when completed, or you may submit manually.",
          buttonText: "Submit Timesheet",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className={[styles.banner, config.bannerClass, className]
        .filter(Boolean)
        .join(" ")}
      role="region"
      aria-label={`Timesheet status: ${status}`}
      data-testid="timesheet-status-banner"
    >
      <div className={styles.headerRow}>
        <div className={styles.statusTitleGroup}>
          <span
            className={[styles.statusBadge, config.badgeClass].join(" ")}
            data-testid="timesheet-status-badge"
          >
            {status}
          </span>
          <span className={styles.statusTitle}>{config.title}</span>
        </div>

        {config.buttonText && onSubmit && (
          <Button
            type="button"
            variant="primary"
            onClick={() => setIsConfirmOpen(true)}
            disabled={!canSubmit || isSubmitting}
            loading={isSubmitting}
            data-testid="submit-timesheet-btn"
          >
            {config.buttonText}
          </Button>
        )}
      </div>

      <div className={styles.statusDescription}>{config.description}</div>

      {status === "RETURNED" && returnReason && (
        <div className={styles.returnReasonBox} data-testid="return-reason-box">
          <span className={styles.returnReasonLabel}>Reason for Return</span>
          <p className={styles.returnReasonText}>{returnReason}</p>
        </div>
      )}

      {onSubmit && (
        <ConfirmDialog
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleConfirmSubmit}
          title={status === "RETURNED" ? "Re-submit Timesheet" : "Submit Timesheet"}
          description={
            status === "RETURNED"
              ? "Are you sure you want to re-submit this timesheet for administrator review?"
              : `Submit timesheet${weekStartDate ? ` for the week of ${weekStartDate}` : ""}? Once submitted, you will not be able to edit hours unless returned by an administrator.`
          }
          confirmText={status === "RETURNED" ? "Re-submit" : "Submit"}
          loading={isSubmitting}
        />
      )}
    </div>
  );
}
