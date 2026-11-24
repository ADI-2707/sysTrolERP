import { useState, useEffect, type FormEvent } from "react";
import { Modal, Button } from "@systrol/ui";
import styles from "./CreateEmployeeModal.module.css";

export interface ClearLockoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultIdentifier?: string;
  onSubmit: (identifier: string, ipAddress?: string) => Promise<void>;
}

export function ClearLockoutModal({
  isOpen,
  onClose,
  defaultIdentifier = "",
  onSubmit,
}: ClearLockoutModalProps) {
  const [identifier, setIdentifier] = useState(defaultIdentifier);
  const [ipAddress, setIpAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIdentifier(defaultIdentifier);
      setIpAddress("");
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, defaultIdentifier]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedId = identifier.trim();
    if (!trimmedId) {
      setError("Account identifier or email is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(trimmedId, ipAddress.trim() || undefined);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to clear lockout.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Clear Login Lockout" size="sm">
      <form onSubmit={handleSubmit} className={styles.form} data-testid="clear-lockout-form">
        {error && (
          <div role="alert" className={styles.errorAlert} data-testid="clear-lockout-error">
            {error}
          </div>
        )}

        <div className={styles.fieldGroup}>
          <label htmlFor="lockout-identifier" className={styles.label}>
            Email / Username / Identifier <span className={styles.required}>*</span>
          </label>
          <input
            id="lockout-identifier"
            type="text"
            className={styles.input}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="e.g. user@example.com"
            data-testid="lockout-identifier-input"
            required
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="lockout-ip" className={styles.label}>
            IP Address (Optional)
          </label>
          <input
            id="lockout-ip"
            type="text"
            className={styles.input}
            value={ipAddress}
            onChange={(e) => setIpAddress(e.target.value)}
            placeholder="e.g. 192.168.1.100 (blank for all IPs)"
            data-testid="lockout-ip-input"
          />
          <span className={styles.hint}>
            Leave blank to remove all failed login attempts for this identifier across all IPs.
          </span>
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
            data-testid="clear-lockout-cancel-btn"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            data-testid="clear-lockout-submit-btn"
          >
            Clear Lockout
          </Button>
        </div>
      </form>
    </Modal>
  );
}
