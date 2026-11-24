import { useState, useEffect, useCallback, useMemo } from "react";
import { Table, Badge, Button, Spinner, EmptyState, type TableColumn } from "@systrol/ui";
import { fetchAuditLogs } from "../../../api/logs";
import type { AuditLogItem } from "../../types";
import { AuditDetailDrawer } from "../AuditDetailDrawer";
import styles from "./AuditTableView.module.css";

export interface AuditTableViewProps {
  search?: string;
  actionFilter?: string;
  startDate?: string;
  endDate?: string;
}

export function AuditTableView({
  search = "",
  actionFilter = "",
  startDate = "",
  endDate = "",
}: AuditTableViewProps) {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [prevCursor, setPrevCursor] = useState<string | null>(null);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const extractCursor = (urlStr: string | null): string | null => {
    if (!urlStr) return null;
    try {
      const parsed = new URL(urlStr, window.location.origin);
      return parsed.searchParams.get("cursor");
    } catch {
      return null;
    }
  };

  const loadLogs = useCallback(
    async (cursor?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchAuditLogs({
          search: search.trim() || undefined,
          action: actionFilter || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          cursor,
        });
        setLogs(res.results || []);
        setNextCursor(extractCursor(res.next));
        setPrevCursor(extractCursor(res.previous));
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load audit logs.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [search, actionFilter, startDate, endDate]
  );

  useEffect(() => {
    setCurrentCursor(undefined);
    loadLogs(undefined);
  }, [loadLogs]);

  const handleNextPage = () => {
    if (nextCursor) {
      setCurrentCursor(nextCursor);
      loadLogs(nextCursor);
    }
  };

  const handlePrevPage = () => {
    if (prevCursor) {
      setCurrentCursor(prevCursor);
      loadLogs(prevCursor);
    }
  };

  const columns: TableColumn<AuditLogItem>[] = useMemo(
    () => [
      {
        key: "created_at",
        header: "Timestamp",
        width: "160px",
        render: (item) => (
          <span className={styles.timestampCell} data-testid={`audit-ts-${item.id}`}>
            {new Date(item.created_at).toLocaleString()}
          </span>
        ),
      },
      {
        key: "actor",
        header: "Actor",
        width: "170px",
        render: (item) => (
          <div className={styles.actorCell} data-testid={`audit-actor-${item.id}`}>
            <span className={styles.actorName}>{item.actor_label}</span>
            <Badge variant="brand">{item.actor_kind}</Badge>
          </div>
        ),
      },
      {
        key: "action",
        header: "Action",
        width: "190px",
        render: (item) => (
          <span className={styles.actionCell} data-testid={`audit-action-${item.id}`}>
            {item.action}
          </span>
        ),
      },
      {
        key: "entity",
        header: "Entity",
        width: "150px",
        render: (item) => (
          <span className={styles.entityCell} data-testid={`audit-entity-${item.id}`}>
            {item.entity_type} #{item.entity_id}
          </span>
        ),
      },
      {
        key: "summary",
        header: "Summary",
        render: (item) => (
          <span className={styles.summaryCell} data-testid={`audit-summary-${item.id}`}>
            {item.summary}
          </span>
        ),
      },
      {
        key: "ip_address",
        header: "IP Address",
        width: "130px",
        render: (item) => (
          <span className={styles.ipCell} data-testid={`audit-ip-${item.id}`}>
            {item.ip_address || "-"}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className={styles.container} data-testid="audit-table-view">
      {error && (
        <div role="alert" className={styles.errorAlert} data-testid="audit-error-alert">
          <span>{error}</span>
          <Button size="sm" variant="secondary" onClick={() => loadLogs(currentCursor)}>
            Retry
          </Button>
        </div>
      )}

      <div className={styles.tableCard} data-testid="audit-table-card">
        {isLoading ? (
          <div className={styles.loadingContainer} data-testid="audit-loading">
            <Spinner size="lg" />
            <span>Loading audit records...</span>
          </div>
        ) : logs.length === 0 ? (
          <div data-testid="audit-empty-state">
            <EmptyState
              title="No audit events found"
              description="No audit records match the current filter criteria."
            />
          </div>
        ) : (
          <>
            <Table
              data={logs}
              columns={columns}
              rowKey={(item) => item.id}
              onRowClick={(item) => setSelectedLog(item)}
            />
            <div className={styles.paginationFooter} data-testid="audit-pagination-footer">
              <span className={styles.paginationMeta}>
                Viewing page ({logs.length} records)
              </span>
              <div className={styles.paginationNav}>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!prevCursor}
                  onClick={handlePrevPage}
                  data-testid="audit-prev-btn"
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!nextCursor}
                  onClick={handleNextPage}
                  data-testid="audit-next-btn"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <AuditDetailDrawer
        isOpen={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
        log={selectedLog}
      />
    </div>
  );
}
