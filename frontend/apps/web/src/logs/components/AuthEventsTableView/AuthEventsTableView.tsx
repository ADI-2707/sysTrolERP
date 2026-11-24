import { useState, useEffect, useCallback, useMemo } from "react";
import { Table, Badge, Button, Spinner, EmptyState, type TableColumn, type BadgeVariant } from "@systrol/ui";
import { fetchAuditLogs } from "../../../api/logs";
import type { AuditLogItem } from "../../types";
import { AuditDetailDrawer } from "../AuditDetailDrawer";
import styles from "./AuthEventsTableView.module.css";

export interface AuthEventsTableViewProps {
  search?: string;
  actionFilter?: string;
  startDate?: string;
  endDate?: string;
}

const ALL_AUTH_ACTIONS = [
  "LOGIN_SUCCESS",
  "LOGIN_FAILURE",
  "LOGIN_LOCKOUT",
  "LOGOUT",
  "PASSWORD_CHANGE",
  "PASSWORD_RESET_BY_ADMIN",
  "SUPER_ADMIN_PASSWORD_RESET",
  "SUPER_CLEAR_LOCKOUT",
].join(",");

export function AuthEventsTableView({
  search = "",
  actionFilter = "",
  startDate = "",
  endDate = "",
}: AuthEventsTableViewProps) {
  const [events, setEvents] = useState<AuditLogItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [prevCursor, setPrevCursor] = useState<string | null>(null);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AuditLogItem | null>(null);

  const extractCursor = (urlStr: string | null): string | null => {
    if (!urlStr) return null;
    try {
      const parsed = new URL(urlStr, window.location.origin);
      return parsed.searchParams.get("cursor");
    } catch {
      return null;
    }
  };

  const loadEvents = useCallback(
    async (cursor?: string) => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetchAuditLogs({
          action: actionFilter.trim() || ALL_AUTH_ACTIONS,
          search: search.trim() || undefined,
          start_date: startDate.trim() || undefined,
          end_date: endDate.trim() || undefined,
          cursor,
        });
        setEvents(res.results || []);
        setNextCursor(extractCursor(res.next));
        setPrevCursor(extractCursor(res.previous));
      } catch (err: unknown) {
        if (err instanceof Error) {
          setErrorMsg(err.message);
        } else {
          setErrorMsg("Failed to load authentication events.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [search, actionFilter, startDate, endDate]
  );

  useEffect(() => {
    setCurrentCursor(undefined);
    loadEvents();
  }, [loadEvents]);

  const handleNextPage = () => {
    if (nextCursor) {
      setCurrentCursor(nextCursor);
      loadEvents(nextCursor);
    }
  };

  const handlePrevPage = () => {
    if (prevCursor) {
      setCurrentCursor(prevCursor);
      loadEvents(prevCursor);
    }
  };

  const getActionBadgeVariant = (action: string): BadgeVariant => {
    switch (action) {
      case "LOGIN_SUCCESS":
      case "SUPER_CLEAR_LOCKOUT":
        return "success";
      case "LOGIN_FAILURE":
      case "LOGIN_LOCKOUT":
        return "danger";
      case "PASSWORD_RESET_BY_ADMIN":
      case "SUPER_ADMIN_PASSWORD_RESET":
        return "warning";
      case "PASSWORD_CHANGE":
        return "info";
      default:
        return "default";
    }
  };

  const columns: TableColumn<AuditLogItem>[] = useMemo(
    () => [
      {
        key: "created_at",
        header: "Timestamp",
        width: "180px",
        render: (row) => (
          <span className={styles.timestampCell} data-testid={`auth-time-${row.id}`}>
            {new Date(row.created_at).toLocaleString()}
          </span>
        ),
      },
      {
        key: "action",
        header: "Auth Event",
        width: "200px",
        render: (row) => (
          <span data-testid={`auth-badge-${row.id}`}>
            <Badge variant={getActionBadgeVariant(row.action)}>
              {row.action}
            </Badge>
          </span>
        ),
      },
      {
        key: "actor_label",
        header: "Actor",
        width: "160px",
        render: (row) => (
          <span className={styles.actorLabel} data-testid={`auth-actor-${row.id}`}>
            {row.actor_label}
          </span>
        ),
      },
      {
        key: "ip_address",
        header: "IP Address",
        width: "140px",
        render: (row) => (
          <span className={styles.ipText} data-testid={`auth-ip-${row.id}`}>
            {row.ip_address || "-"}
          </span>
        ),
      },
      {
        key: "summary",
        header: "Details",
        render: (row) => (
          <span className={styles.summaryCell} data-testid={`auth-summary-${row.id}`}>
            {row.summary}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className={styles.container} data-testid="auth-events-table-view">
      {isLoading && (
        <div className={styles.spinnerContainer} data-testid="auth-events-loading">
          <Spinner size="lg" />
        </div>
      )}

      {errorMsg && (
        <div className={styles.errorAlert} role="alert" data-testid="auth-events-error">
          <span>{errorMsg}</span>
          <Button variant="secondary" size="sm" onClick={() => loadEvents(currentCursor)}>
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !errorMsg && events.length === 0 && (
        <EmptyState
          title="No authentication events found"
          description="Try broadening your search or clearing date and action filters."
          action={
            <Button size="sm" variant="secondary" onClick={() => loadEvents()}>
              Refresh
            </Button>
          }
        />
      )}

      {!isLoading && !errorMsg && events.length > 0 && (
        <div className={styles.tableWrapper}>
          <Table<AuditLogItem>
            columns={columns}
            data={events}
            rowKey={(row) => row.id}
            onRowClick={(row) => setSelectedEvent(row)}
          />

          <div className={styles.paginationBar} data-testid="auth-events-pagination">
            <Button
              variant="secondary"
              size="sm"
              disabled={!prevCursor}
              onClick={handlePrevPage}
              data-testid="auth-events-prev-btn"
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!nextCursor}
              onClick={handleNextPage}
              data-testid="auth-events-next-btn"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <AuditDetailDrawer
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        log={selectedEvent}
      />
    </div>
  );
}
