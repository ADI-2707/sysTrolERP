import { useState, useEffect, type FormEvent } from "react";
import { Modal, Button } from "@systrol/ui";
import styles from "./ActionReasonModal.module.css";

export interface ActionReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  employeeName?: string;
  employeeCode?: string;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  confirmLabel?: string;
  confirmVariant?: "primary" | "danger" | "secondary";
  onSubmit: (reason: string) => Promise<void>;
}

export function ActionReasonModal({
  isOpen,
  onClose,
  title,
  description,
  employeeName,
  employeeCode,
  reasonLabel = "Reason for this action",
  reasonPlaceholder = "Provide an audited explanation...",
  confirmLabel = "Confirm",
  confirmVariant = "primary",
  onSubmit,
}: ActionReasonModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setError("A reason is required to perform this action.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(trimmedReason);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to execute action.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <form onSubmit={handleSubmit} className={styles.form} data-testid="action-reason-form">
        {description && (
          <p className={styles.description} data-testid="action-reason-description">
            {description}
          </p>
        )}

        {(employeeName || employeeCode) && (
          <div className={styles.employeeMeta} data-testid="action-reason-employee-meta">
            {employeeCode && (
              <span className={styles.codeBadge} data-testid="action-reason-emp-code">
                {employeeCode}
              </span>
            )}
            {employeeName && (
              <span data-testid="action-reason-emp-name">{employeeName}</span>
            )}
          </div>
        )}

        {error && (
          <div role="alert" className={styles.errorAlert} data-testid="action-reason-error">
            {error}
          </div>
        )}

        <div className={styles.fieldGroup}>
          <label htmlFor="action-reason-textarea" className={styles.label}>
            {reasonLabel} <span className={styles.required}>*</span>
          </label>
          <textarea
            id="action-reason-textarea"
            className={styles.textarea}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={reasonPlaceholder}
            data-testid="action-reason-textarea"
          />
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
            data-testid="action-reason-cancel-btn"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant={confirmVariant}
            loading={isSubmitting}
            data-testid="action-reason-confirm-btn"
          >
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
