import { useState, useEffect, type FormEvent } from "react";
import { Modal, Button } from "@systrol/ui";
import type { TimesheetStatus } from "../../types";
import styles from "./SuperAdminOverrideModal.module.css";

export interface SuperAdminOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: { reason: string; status: TimesheetStatus }) => Promise<void> | void;
  employeeName: string;
  weekRange: string;
  currentStatus: TimesheetStatus;
  isLoading?: boolean;
}

export function SuperAdminOverrideModal({
  isOpen,
  onClose,
  onConfirm,
  employeeName,
  weekRange,
  currentStatus,
  isLoading = false,
}: SuperAdminOverrideModalProps) {
  const [newStatus, setNewStatus] = useState<TimesheetStatus>("APPROVED");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNewStatus(currentStatus === "APPROVED" ? "OPEN" : "APPROVED");
      setReason("");
      setError(null);
    }
  }, [isOpen, currentStatus]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Audit reason is required for super admin override.");
      return;
    }

    try {
      setError(null);
      await onConfirm({ reason: trimmed, status: newStatus });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to apply override.");
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Super Admin Override"
      description="Administrative override bypasses standard workflow and is permanently audited."
      size="md"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.detailsSummary}>
          <span className={styles.employeeName}>{employeeName}</span>
          <span className={styles.weekRange}>
            Week: {weekRange} &bull; Current Status: {currentStatus}
          </span>
        </div>

        <div className={styles.warningBox}>
          <strong>Security Notice:</strong> All super admin override actions are recorded in the
          tamper-evident audit log including your identity, IP, and reason.
        </div>

        {error && (
          <div role="alert" className={styles.errorAlert}>
            {error}
          </div>
        )}

        <div className={styles.fieldGroup}>
          <label htmlFor="target-status" className={styles.label}>
            Target Status
          </label>
          <select
            id="target-status"
            className={styles.selectInput}
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as TimesheetStatus)}
            data-testid="override-status-select"
          >
            <option value="APPROVED">APPROVED (Force Approve)</option>
            <option value="OPEN">OPEN (Force Reopen)</option>
            <option value="RETURNED">RETURNED (Force Return)</option>
          </select>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="override-reason" className={styles.label}>
            Audit Reason (Required)
          </label>
          <textarea
            id="override-reason"
            className={styles.textarea}
            placeholder="Detailed explanation of why this administrative override is necessary..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            data-testid="override-reason-textarea"
          />
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            loading={isLoading}
            disabled={!reason.trim()}
            data-testid="confirm-override-button"
          >
            Apply Override
          </Button>
        </div>
      </form>
    </Modal>
  );
}
