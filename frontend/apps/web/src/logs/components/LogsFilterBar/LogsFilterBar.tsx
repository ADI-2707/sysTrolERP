import { Button } from "@systrol/ui";
import type { LogsTabKey } from "../../types";
import styles from "./LogsFilterBar.module.css";

export interface LogsFilterBarProps {
  activeTab: LogsTabKey;
  search: string;
  startDate: string;
  endDate: string;
  actionFilter: string;
  statusCodeFilter: string;
  methodFilter: string;
  errorClassFilter: string;
  onSearchChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onActionFilterChange: (value: string) => void;
  onStatusCodeFilterChange: (value: string) => void;
  onMethodFilterChange: (value: string) => void;
  onErrorClassFilterChange: (value: string) => void;
  onResetFilters: () => void;
  onExportCsv?: () => void;
  onExportGzip?: () => void;
}

export function LogsFilterBar({
  activeTab,
  search,
  startDate,
  endDate,
  actionFilter,
  statusCodeFilter,
  methodFilter,
  errorClassFilter,
  onSearchChange,
  onStartDateChange,
  onEndDateChange,
  onActionFilterChange,
  onStatusCodeFilterChange,
  onMethodFilterChange,
  onErrorClassFilterChange,
  onResetFilters,
  onExportCsv,
  onExportGzip,
}: LogsFilterBarProps) {
  const hasActiveFilters = Boolean(
    search ||
      startDate ||
      endDate ||
      actionFilter ||
      statusCodeFilter ||
      methodFilter ||
      errorClassFilter
  );

  return (
    <div className={styles.filterBar} data-testid="logs-filter-bar">
      <div className={styles.controlsRow}>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Search logs by keyword, entity, IP, actor..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          data-testid="logs-search-input"
        />

        <input
          type="date"
          className={styles.dateInput}
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          aria-label="Start date"
          data-testid="logs-start-date"
        />

        <input
          type="date"
          className={styles.dateInput}
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          aria-label="End date"
          data-testid="logs-end-date"
        />

        {activeTab === "audit" && (
          <select
            className={styles.selectInput}
            value={actionFilter}
            onChange={(e) => onActionFilterChange(e.target.value)}
            aria-label="Filter by action"
            data-testid="logs-action-filter"
          >
            <option value="">All Actions</option>
            <option value="EMPLOYEE_CREATE">EMPLOYEE_CREATE</option>
            <option value="EMPLOYEE_UPDATE">EMPLOYEE_UPDATE</option>
            <option value="EMPLOYEE_REVOKE">EMPLOYEE_REVOKE</option>
            <option value="EMPLOYEE_RESTORE">EMPLOYEE_RESTORE</option>
            <option value="PROJECT_CREATE">PROJECT_CREATE</option>
            <option value="PROJECT_STATUS_CHANGE">PROJECT_STATUS_CHANGE</option>
            <option value="TIMESHEET_APPROVE">TIMESHEET_APPROVE</option>
            <option value="TIMESHEET_RETURN">TIMESHEET_RETURN</option>
            <option value="TIMESHEET_OVERRIDE">TIMESHEET_OVERRIDE</option>
          </select>
        )}

        {activeTab === "auth" && (
          <select
            className={styles.selectInput}
            value={actionFilter}
            onChange={(e) => onActionFilterChange(e.target.value)}
            aria-label="Filter by auth event"
            data-testid="logs-auth-action-filter"
          >
            <option value="">All Auth Events</option>
            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
            <option value="LOGIN_FAILURE">LOGIN_FAILURE</option>
            <option value="LOGIN_LOCKOUT">LOGIN_LOCKOUT</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="PASSWORD_CHANGE">PASSWORD_CHANGE</option>
            <option value="PASSWORD_RESET_BY_ADMIN">PASSWORD_RESET_BY_ADMIN</option>
            <option value="SUPER_ADMIN_PASSWORD_RESET">SUPER_ADMIN_PASSWORD_RESET</option>
            <option value="SUPER_CLEAR_LOCKOUT">SUPER_CLEAR_LOCKOUT</option>
          </select>
        )}

        {activeTab === "requests" && (
          <>
            <select
              className={styles.selectInput}
              value={methodFilter}
              onChange={(e) => onMethodFilterChange(e.target.value)}
              aria-label="Filter by HTTP method"
              data-testid="logs-method-filter"
            >
              <option value="">All Methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>

            <select
              className={styles.selectInput}
              value={statusCodeFilter}
              onChange={(e) => onStatusCodeFilterChange(e.target.value)}
              aria-label="Filter by status code"
              data-testid="logs-status-filter"
            >
              <option value="">All Statuses</option>
              <option value="200">200 OK</option>
              <option value="201">201 Created</option>
              <option value="204">204 No Content</option>
              <option value="400">400 Bad Request</option>
              <option value="401">401 Unauthorized</option>
              <option value="403">403 Forbidden</option>
              <option value="404">404 Not Found</option>
              <option value="500">500 Server Error</option>
            </select>
          </>
        )}

        {activeTab === "errors" && (
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Filter by error class (e.g. ValueError)..."
            value={errorClassFilter}
            onChange={(e) => onErrorClassFilterChange(e.target.value)}
            data-testid="logs-error-class-filter"
          />
        )}

        <div className={styles.actionGroup}>
          {hasActiveFilters && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onResetFilters}
              data-testid="logs-clear-filters-btn"
            >
              Clear Filters
            </Button>
          )}

          {(activeTab === "audit" || activeTab === "auth") && (
            <>
              {onExportCsv && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onExportCsv}
                  data-testid="logs-export-csv-btn"
                >
                  Export CSV
                </Button>
              )}
              {onExportGzip && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onExportGzip}
                  data-testid="logs-export-gzip-btn"
                >
                  Export Gzip (.gz)
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
