import { useState } from "react";
import { Drawer, Badge, Button } from "@systrol/ui";
import type { ErrorLogItem } from "../types";
import styles from "./ErrorDetailDrawer.module.css";

export interface ErrorDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  errorLog: ErrorLogItem | null;
}

export function ErrorDetailDrawer({ isOpen, onClose, errorLog }: ErrorDetailDrawerProps) {
  const [copied, setCopied] = useState(false);

  if (!errorLog) return null;

  const handleCopyTrace = async () => {
    if (!errorLog.trace) return;
    try {
      await navigator.clipboard.writeText(errorLog.trace);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.getElementById("stack-trace-pre");
      if (el) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(el);
        selection?.removeAllRanges();
        selection?.addRange(range);
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Error Event #${errorLog.id}`}
      side="right"
    >
      <div className={styles.container} data-testid="error-detail-drawer">
        <div className={styles.headerCard}>
          <div className={styles.errorClassRow}>
            <h3 className={styles.errorClass} data-testid="error-drawer-class">
              {errorLog.error_class}
            </h3>
            <Badge variant="danger">ERROR</Badge>
          </div>
          <div className={styles.errorMessage} data-testid="error-drawer-message">
            {errorLog.message}
          </div>
        </div>

        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Request Context</h4>
          <div className={styles.metaGrid} data-testid="error-drawer-meta-grid">
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Timestamp</span>
              <span className={styles.metaValue} data-testid="error-drawer-timestamp">
                {new Date(errorLog.created_at).toLocaleString()}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>HTTP Method</span>
              <span className={`${styles.metaValue} ${styles.mono}`} data-testid="error-drawer-method">
                {errorLog.method || "N/A"}
              </span>
            </div>
            <div className={styles.metaItem} style={{ gridColumn: "1 / -1" }}>
              <span className={styles.metaLabel}>Path</span>
              <span className={`${styles.metaValue} ${styles.mono}`} data-testid="error-drawer-path">
                {errorLog.path || "N/A"}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Actor</span>
              <span className={styles.metaValue} data-testid="error-drawer-actor">
                {errorLog.actor_label}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Request ID</span>
              <span className={`${styles.metaValue} ${styles.mono}`} data-testid="error-drawer-request-id">
                {errorLog.request_id || "None"}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h4 className={styles.sectionTitle}>Stack Trace</h4>
            {errorLog.trace && (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleCopyTrace}
                data-testid="error-drawer-copy-trace-btn"
              >
                {copied ? "Copied!" : "Copy Trace"}
              </Button>
            )}
          </div>
          <div className={styles.traceContainer}>
            {errorLog.trace ? (
              <pre
                id="stack-trace-pre"
                className={styles.traceBox}
                data-testid="error-drawer-stack-trace"
              >
                {errorLog.trace}
              </pre>
            ) : (
              <div className={styles.emptyTrace} data-testid="error-drawer-no-trace">
                No stack trace recorded for this error.
              </div>
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
}
