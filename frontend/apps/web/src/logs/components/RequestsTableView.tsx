import { useState, useEffect, useCallback, useMemo } from "react";
import { Table, Badge, Button, Spinner, EmptyState, type TableColumn, type BadgeVariant } from "@systrol/ui";
import { fetchRequestLogs } from "../../api/logs";
import type { RequestLogItem } from "../types";
import styles from "./AuditTableView.module.css";

export interface RequestsTableViewProps {
  search?: string;
  methodFilter?: string;
  statusCodeFilter?: string;
}

export function RequestsTableView({
  search = "",
  methodFilter = "",
  statusCodeFilter = "",
}: RequestsTableViewProps) {
  const [requests, setRequests] = useState<RequestLogItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [prevCursor, setPrevCursor] = useState<string | null>(null);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const extractCursor = (urlStr: string | null): string | null => {
    if (!urlStr) return null;
    try {
      const parsed = new URL(urlStr, window.location.origin);
      return parsed.searchParams.get("cursor");
    } catch {
      return null;
    }
  };

  const loadRequests = useCallback(
    async (cursor?: string) => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetchRequestLogs({
          search: search.trim() || undefined,
          method: methodFilter || undefined,
          status_code: statusCodeFilter || undefined,
          cursor,
        });
        setRequests(res.results || []);
        setNextCursor(extractCursor(res.next));
        setPrevCursor(extractCursor(res.previous));
      } catch (err: unknown) {
        if (err instanceof Error) {
          setErrorMsg(err.message);
        } else {
          setErrorMsg("Failed to load request logs.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [search, methodFilter, statusCodeFilter]
  );

  useEffect(() => {
    setCurrentCursor(undefined);
    loadRequests(undefined);
  }, [loadRequests]);

  const handleNextPage = () => {
    if (nextCursor) {
      setCurrentCursor(nextCursor);
      loadRequests(nextCursor);
    }
  };

  const handlePrevPage = () => {
    if (prevCursor) {
      setCurrentCursor(prevCursor);
      loadRequests(prevCursor);
    }
  };

  const getStatusBadgeVariant = (code: number): BadgeVariant => {
    if (code >= 200 && code < 300) return "success";
    if (code >= 300 && code < 400) return "info";
    if (code >= 400 && code < 500) return "warning";
    return "danger";
  };

  const formatSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const columns: TableColumn<RequestLogItem>[] = useMemo(
    () => [
      {
        key: "created_at",
        header: "Timestamp",
        width: "160px",
        render: (item) => (
          <span className={styles.timestampCell} data-testid={`req-ts-${item.id}`}>
            {new Date(item.created_at).toLocaleString()}
          </span>
        ),
      },
      {
        key: "method",
        header: "Method",
        width: "100px",
        render: (item) => (
          <span data-testid={`req-method-${item.id}`}>
            <Badge variant="brand">{item.method}</Badge>
          </span>
        ),
      },
      {
        key: "status_code",
        header: "Status",
        width: "110px",
        render: (item) => (
          <span data-testid={`req-status-${item.id}`}>
            <Badge variant={getStatusBadgeVariant(item.status_code)}>
              {item.status_code}
            </Badge>
          </span>
        ),
      },
      {
        key: "path",
        header: "Path",
        render: (item) => (
          <span className={styles.entityCell} data-testid={`req-path-${item.id}`}>
            {item.path}
          </span>
        ),
      },
      {
        key: "duration_ms",
        header: "Duration",
        width: "110px",
        render: (item) => (
          <span
            className={styles.actionCell}
            data-testid={`req-duration-${item.id}`}
            style={{ color: item.duration_ms > 500 ? "var(--color-warning)" : undefined }}
          >
            {item.duration_ms} ms
          </span>
        ),
      },
      {
        key: "response_size_bytes",
        header: "Size",
        width: "100px",
        render: (item) => (
          <span className={styles.ipCell} data-testid={`req-size-${item.id}`}>
            {formatSize(item.response_size_bytes)}
          </span>
        ),
      },
      {
        key: "actor_label",
        header: "Actor",
        width: "140px",
        render: (item) => (
          <span className={styles.actorName} data-testid={`req-actor-${item.id}`}>
            {item.actor_label}
          </span>
        ),
      },
      {
        key: "ip_address",
        header: "IP Address",
        width: "120px",
        render: (item) => (
          <span className={styles.ipCell} data-testid={`req-ip-${item.id}`}>
            {item.ip_address || "-"}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className={styles.container} data-testid="requests-table-view">
      {errorMsg && (
        <div role="alert" className={styles.errorAlert} data-testid="requests-error-alert">
          <span>{errorMsg}</span>
          <Button size="sm" variant="secondary" onClick={() => loadRequests(currentCursor)}>
            Retry
          </Button>
        </div>
      )}

      <div className={styles.tableCard} data-testid="requests-table-card">
        {isLoading ? (
          <div className={styles.loadingContainer} data-testid="requests-loading">
            <Spinner size="lg" />
            <span>Loading request logs...</span>
          </div>
        ) : requests.length === 0 ? (
          <div data-testid="requests-empty-state">
            <EmptyState
              title="No requests recorded"
              description="No HTTP request telemetry matches the current filters."
            />
          </div>
        ) : (
          <>
            <Table
              data={requests}
              columns={columns}
              rowKey={(item) => item.id}
            />
            <div className={styles.paginationFooter} data-testid="requests-pagination-footer">
              <span className={styles.paginationMeta}>
                Viewing page ({requests.length} records)
              </span>
              <div className={styles.paginationNav}>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!prevCursor}
                  onClick={handlePrevPage}
                  data-testid="requests-prev-btn"
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!nextCursor}
                  onClick={handleNextPage}
                  data-testid="requests-next-btn"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
