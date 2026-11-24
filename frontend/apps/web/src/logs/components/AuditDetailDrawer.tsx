import { Drawer, Badge } from "@systrol/ui";
import type { AuditLogItem } from "../types";
import styles from "./AuditDetailDrawer.module.css";

export interface AuditDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  log: AuditLogItem | null;
}

export function AuditDetailDrawer({ isOpen, onClose, log }: AuditDetailDrawerProps) {
  if (!log) return null;

  const changesEntries = log.changes ? Object.entries(log.changes) : [];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Audit Event #${log.id}`}
      side="right"
    >
      <div className={styles.container} data-testid="audit-detail-drawer">
        <div className={styles.headerCard}>
          <div className={styles.titleRow}>
            <h3 className={styles.actionTitle} data-testid="audit-drawer-action">
              {log.action}
            </h3>
            <div className={styles.badgeGroup}>
              <Badge variant="brand">{log.actor_kind}</Badge>
              {log.super_only && <Badge variant="warning">SUPER ONLY</Badge>}
            </div>
          </div>
          <div className={styles.summaryBox} data-testid="audit-drawer-summary">
            {log.summary}
          </div>
        </div>

        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Event Metadata</h4>
          <div className={styles.metaGrid} data-testid="audit-drawer-meta-grid">
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Timestamp</span>
              <span className={styles.metaValue} data-testid="audit-drawer-timestamp">
                {new Date(log.created_at).toLocaleString()}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Actor Label</span>
              <span className={styles.metaValue} data-testid="audit-drawer-actor-label">
                {log.actor_label}
              </span>
            </div>
            {log.actor_user && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Actor Account</span>
                <span className={styles.metaValue} data-testid="audit-drawer-actor-user">
                  {log.actor_user.code} - {log.actor_user.name}
                </span>
              </div>
            )}
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Target Entity</span>
              <span className={styles.metaValue} data-testid="audit-drawer-entity">
                {log.entity_type} #{log.entity_id}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>IP Address</span>
              <span className={styles.metaValue} data-testid="audit-drawer-ip">
                {log.ip_address || "None"}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Request ID</span>
              <span className={`${styles.metaValue} ${styles.mono}`} data-testid="audit-drawer-request-id">
                {log.request_id || "None"}
              </span>
            </div>
            <div className={styles.metaItem} style={{ gridColumn: "1 / -1" }}>
              <span className={styles.metaLabel}>User Agent</span>
              <span className={styles.metaValue} data-testid="audit-drawer-user-agent">
                {log.user_agent || "None"}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Field Mutations (Before & After)</h4>
          <div className={styles.diffContainer} data-testid="audit-drawer-diff-section">
            {changesEntries.length === 0 ? (
              <div className={styles.emptyDiff} data-testid="audit-drawer-no-diff">
                No field-level mutations recorded for this event.
              </div>
            ) : (
              changesEntries.map(([field, [beforeVal, afterVal]]) => (
                <div key={field} className={styles.diffCard} data-testid={`diff-card-${field}`}>
                  <div className={styles.diffFieldHeader}>{field}</div>
                  <div className={styles.diffGrid}>
                    <div className={styles.diffBefore} data-testid={`diff-before-${field}`}>
                      <span className={styles.diffLabel}>Previous Value</span>
                      <code>
                        {beforeVal === null
                          ? "null"
                          : typeof beforeVal === "object"
                          ? JSON.stringify(beforeVal, null, 2)
                          : String(beforeVal)}
                      </code>
                    </div>
                    <div className={styles.diffAfter} data-testid={`diff-after-${field}`}>
                      <span className={styles.diffLabel}>New Value</span>
                      <code>
                        {afterVal === null
                          ? "null"
                          : typeof afterVal === "object"
                          ? JSON.stringify(afterVal, null, 2)
                          : String(afterVal)}
                      </code>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
}
