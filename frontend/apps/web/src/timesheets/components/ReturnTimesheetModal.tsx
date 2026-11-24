import { useState, useEffect, type FormEvent } from "react";
import { Modal, Button } from "@systrol/ui";
import styles from "./ReturnTimesheetModal.module.css";

export interface ReturnTimesheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
  employeeName: string;
  weekRange: string;
  isLoading?: boolean;
}

export function ReturnTimesheetModal({
  isOpen,
  onClose,
  onConfirm,
  employeeName,
  weekRange,
  isLoading = false,
}: ReturnTimesheetModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Please provide a reason for returning this timesheet.");
      return;
    }

    try {
      setError(null);
      await onConfirm(trimmed);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to return timesheet.");
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Return Timesheet for Correction"
      description="The employee will be notified and this week will reopen for editing."
      size="md"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.detailsSummary}>
          <span className={styles.employeeName}>{employeeName}</span>
          <span className={styles.weekRange}>Week: {weekRange}</span>
        </div>

        {error && (
          <div role="alert" className={styles.errorAlert}>
            {error}
          </div>
        )}

        <div className={styles.fieldGroup}>
          <label htmlFor="return-reason" className={styles.label}>
            Reason for Return (Required)
          </label>
          <textarea
            id="return-reason"
            className={styles.textarea}
            placeholder="Explain what hours or tasks require correction before this timesheet can be approved..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            autoFocus
            data-testid="return-reason-textarea"
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
            data-testid="confirm-return-button"
          >
            Return Timesheet
          </Button>
        </div>
      </form>
    </Modal>
  );
}
