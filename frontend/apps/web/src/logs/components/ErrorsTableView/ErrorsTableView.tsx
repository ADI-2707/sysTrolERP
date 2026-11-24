import { useState, useEffect, useCallback, useMemo } from "react";
import { Table, Button, Spinner, EmptyState, type TableColumn } from "@systrol/ui";
import { fetchErrorLogs } from "../../../api/logs";
import type { ErrorLogItem } from "../../types";
import { ErrorDetailDrawer } from "../ErrorDetailDrawer";
import styles from "./ErrorsTableView.module.css";

export interface ErrorsTableViewProps {
  search?: string;
  errorClassFilter?: string;
}

export function ErrorsTableView({
  search = "",
  errorClassFilter = "",
}: ErrorsTableViewProps) {
  const [errors, setErrors] = useState<ErrorLogItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [prevCursor, setPrevCursor] = useState<string | null>(null);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedError, setSelectedError] = useState<ErrorLogItem | null>(null);

  const extractCursor = (urlStr: string | null): string | null => {
    if (!urlStr) return null;
    try {
      const parsed = new URL(urlStr, window.location.origin);
      return parsed.searchParams.get("cursor");
    } catch {
      return null;
    }
  };

  const loadErrors = useCallback(
    async (cursor?: string) => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetchErrorLogs({
          search: search.trim() || undefined,
          error_class: errorClassFilter.trim() || undefined,
          cursor,
        });
        setErrors(res.results || []);
        setNextCursor(extractCursor(res.next));
        setPrevCursor(extractCursor(res.previous));
      } catch (err: unknown) {
        if (err instanceof Error) {
          setErrorMsg(err.message);
        } else {
          setErrorMsg("Failed to load error logs.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [search, errorClassFilter]
  );

  useEffect(() => {
    setCurrentCursor(undefined);
    loadErrors(undefined);
  }, [loadErrors]);

  const handleNextPage = () => {
    if (nextCursor) {
      setCurrentCursor(nextCursor);
      loadErrors(nextCursor);
    }
  };

  const handlePrevPage = () => {
    if (prevCursor) {
      setCurrentCursor(prevCursor);
      loadErrors(prevCursor);
    }
  };

  const columns: TableColumn<ErrorLogItem>[] = useMemo(
    () => [
      {
        key: "created_at",
        header: "Timestamp",
        width: "160px",
        render: (item) => (
          <span className={styles.timestampCell} data-testid={`error-ts-${item.id}`}>
            {new Date(item.created_at).toLocaleString()}
          </span>
        ),
      },
      {
        key: "error_class",
        header: "Error Class",
        width: "200px",
        render: (item) => (
          <span className={styles.actionCell} data-testid={`error-class-${item.id}`} style={{ color: "var(--color-danger)" }}>
            {item.error_class}
          </span>
        ),
      },
      {
        key: "message",
        header: "Message",
        render: (item) => (
          <span className={styles.summaryCell} data-testid={`error-msg-${item.id}`}>
            {item.message}
          </span>
        ),
      },
      {
        key: "path",
        header: "Request",
        width: "200px",
        render: (item) => (
          <span className={styles.entityCell} data-testid={`error-path-${item.id}`}>
            {item.method} {item.path}
          </span>
        ),
      },
      {
        key: "actor_label",
        header: "Actor",
        width: "140px",
        render: (item) => (
          <span className={styles.actorName} data-testid={`error-actor-${item.id}`}>
            {item.actor_label}
          </span>
        ),
      },
      {
        key: "request_id",
        header: "Request ID",
        width: "140px",
        render: (item) => (
          <span className={styles.ipCell} data-testid={`error-req-id-${item.id}`}>
            {item.request_id ? item.request_id.slice(0, 8) + "..." : "-"}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className={styles.container} data-testid="errors-table-view">
      {errorMsg && (
        <div role="alert" className={styles.errorAlert} data-testid="errors-error-alert">
          <span>{errorMsg}</span>
          <Button size="sm" variant="secondary" onClick={() => loadErrors(currentCursor)}>
            Retry
          </Button>
        </div>
      )}

      <div className={styles.tableCard} data-testid="errors-table-card">
        {isLoading ? (
          <div className={styles.loadingContainer} data-testid="errors-loading">
            <Spinner size="lg" />
            <span>Loading error logs...</span>
          </div>
        ) : errors.length === 0 ? (
          <div data-testid="errors-empty-state">
            <EmptyState
              title="No errors recorded"
              description="No application errors match the selected filter criteria."
            />
          </div>
        ) : (
          <>
            <Table
              data={errors}
              columns={columns}
              rowKey={(item) => item.id}
              onRowClick={(item) => setSelectedError(item)}
            />
            <div className={styles.paginationFooter} data-testid="errors-pagination-footer">
              <span className={styles.paginationMeta}>
                Viewing page ({errors.length} records)
              </span>
              <div className={styles.paginationNav}>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!prevCursor}
                  onClick={handlePrevPage}
                  data-testid="errors-prev-btn"
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!nextCursor}
                  onClick={handleNextPage}
                  data-testid="errors-next-btn"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <ErrorDetailDrawer
        isOpen={selectedError !== null}
        onClose={() => setSelectedError(null)}
        errorLog={selectedError}
      />
    </div>
  );
}
