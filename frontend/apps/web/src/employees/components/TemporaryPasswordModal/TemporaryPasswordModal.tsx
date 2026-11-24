import { useState } from "react";
import { Modal, Button, Badge } from "@systrol/ui";
import styles from "./TemporaryPasswordModal.module.css";

export interface TemporaryPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  temporaryPassword: string;
  employeeName?: string;
  employeeCode?: string;
  email?: string;
  role?: string;
}

export function TemporaryPasswordModal({
  isOpen,
  onClose,
  title = "Temporary Password Generated",
  temporaryPassword,
  employeeName,
  employeeCode,
  email,
  role,
}: TemporaryPasswordModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const inputEl = document.getElementById("temp-pw-input") as HTMLInputElement | null;
      if (inputEl) {
        inputEl.select();
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className={styles.container} data-testid="temporary-password-modal">
        <div className={styles.notice} role="alert" data-testid="temp-password-warning">
          <strong>Security Notice:</strong> This password is shown only once and cannot be retrieved later. The employee will be required to change it on their first login.
        </div>

        {(employeeName || employeeCode || email || role) && (
          <div className={styles.detailsGrid} data-testid="temp-password-details">
            {employeeCode && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Code</span>
                <span className={styles.detailValue} data-testid="temp-pw-code">{employeeCode}</span>
              </div>
            )}
            {employeeName && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Name</span>
                <span className={styles.detailValue} data-testid="temp-pw-name">{employeeName}</span>
              </div>
            )}
            {email && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Email</span>
                <span className={styles.detailValue} data-testid="temp-pw-email">{email}</span>
              </div>
            )}
            {role && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Role</span>
                <span className={styles.detailValue} data-testid="temp-pw-role">
                  <Badge variant={role === "ADMIN" ? "brand" : "default"}>
                    {role}
                  </Badge>
                </span>
              </div>
            )}
          </div>
        )}

        <div className={styles.passwordBox}>
          <label htmlFor="temp-pw-input" className={styles.passwordLabel}>
            One-Time Temporary Password
          </label>
          <div className={styles.passwordRow}>
            <input
              id="temp-pw-input"
              type="text"
              readOnly
              value={temporaryPassword}
              className={styles.passwordInput}
              data-testid="temp-password-value"
            />
            <Button
              type="button"
              variant={copied ? "secondary" : "primary"}
              onClick={handleCopy}
              data-testid="copy-temp-password-btn"
            >
              {copied ? "Copied!" : "Copy Password"}
            </Button>
          </div>
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="primary"
            onClick={onClose}
            data-testid="close-temp-password-btn"
          >
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
