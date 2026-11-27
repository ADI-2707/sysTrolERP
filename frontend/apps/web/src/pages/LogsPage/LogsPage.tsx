import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, type TabItem } from "@systrol/ui";
import type { LogsTabKey } from "../../logs/types";
import { LogsFilterBar } from "../../logs/components/LogsFilterBar";
import { AuditTableView } from "../../logs/components/AuditTableView";
import { RequestsTableView } from "../../logs/components/RequestsTableView";
import { ErrorsTableView } from "../../logs/components/ErrorsTableView";
import { AuthEventsTableView } from "../../logs/components/AuthEventsTableView";
import { TelemetryDashboard } from "../../logs/components/TelemetryDashboard";
import { getAuditLogExportUrl } from "../../api/logs";
import styles from "./LogsPage.module.css";

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

export function LogsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab: LogsTabKey = useMemo(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam === "requests" ||
      tabParam === "errors" ||
      tabParam === "auth" ||
      tabParam === "telemetry"
    ) {
      return tabParam;
    }
    return "audit";
  }, [searchParams]);

  const search = searchParams.get("search") || "";
  const startDate = searchParams.get("start_date") || "";
  const endDate = searchParams.get("end_date") || "";
  const actionFilter = searchParams.get("action") || "";
  const actorFilter = searchParams.get("actor") || "";
  const entityTypeFilter = searchParams.get("entity_type") || "";
  const statusCodeFilter = searchParams.get("status_code") || "";
  const statusClassFilter = searchParams.get("status_class") || "";
  const minDurationFilter = searchParams.get("min_duration") || "";
  const methodFilter = searchParams.get("method") || "";
  const errorClassFilter = searchParams.get("error_class") || "";

  const updateParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      return next;
    });
  };

  const handleTabChange = (newTab: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", newTab);
      return next;
    });
  };

  const handleResetFilters = () => {
    setSearchParams({ tab: activeTab });
  };

  const handleExport = (gzip: boolean) => {
    const action = activeTab === "auth" ? (actionFilter || ALL_AUTH_ACTIONS) : actionFilter;
    const url = getAuditLogExportUrl(
      {
        search: search || undefined,
        action: action || undefined,
        actor: actorFilter || undefined,
        entity_type: entityTypeFilter || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      },
      gzip
    );
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", gzip ? "audit_logs.csv.gz" : "audit_logs.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const tabs: TabItem[] = [
    { id: "audit", label: "Audit" },
    { id: "requests", label: "Requests" },
    { id: "errors", label: "Errors" },
    { id: "auth", label: "Auth & Security" },
    { id: "telemetry", label: "Performance Matrix" },
  ];

  return (
    <div className={styles.pageContainer} data-testid="logs-page">
      <div className={styles.headerSection}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>System Logs & Audit</h1>
          <p className={styles.subtitle}>
            Comprehensive audit trails, HTTP traffic, error logs, authentication events, and telemetry.
          </p>
        </div>
      </div>

      <div className={styles.tabsContainer}>
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={handleTabChange}
          aria-label="Log sections"
        />
      </div>

      {activeTab !== "telemetry" && (
        <LogsFilterBar
          activeTab={activeTab}
          search={search}
          startDate={startDate}
          endDate={endDate}
          actionFilter={actionFilter}
          actorFilter={actorFilter}
          entityTypeFilter={entityTypeFilter}
          statusCodeFilter={statusCodeFilter}
          statusClassFilter={statusClassFilter}
          minDurationFilter={minDurationFilter}
          methodFilter={methodFilter}
          errorClassFilter={errorClassFilter}
          onSearchChange={(v) => updateParam("search", v)}
          onStartDateChange={(v) => updateParam("start_date", v)}
          onEndDateChange={(v) => updateParam("end_date", v)}
          onActionFilterChange={(v) => updateParam("action", v)}
          onActorFilterChange={(v) => updateParam("actor", v)}
          onEntityTypeFilterChange={(v) => updateParam("entity_type", v)}
          onStatusCodeFilterChange={(v) => updateParam("status_code", v)}
          onStatusClassFilterChange={(v) => updateParam("status_class", v)}
          onMinDurationFilterChange={(v) => updateParam("min_duration", v)}
          onMethodFilterChange={(v) => updateParam("method", v)}
          onErrorClassFilterChange={(v) => updateParam("error_class", v)}
          onResetFilters={handleResetFilters}
          onExportCsv={() => handleExport(false)}
          onExportGzip={() => handleExport(true)}
        />
      )}

      <div
        className={styles.panelContainer}
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTab === "audit" && (
          <div data-testid="audit-tab-panel">
            <AuditTableView
              search={search}
              actionFilter={actionFilter}
              actorFilter={actorFilter}
              entityTypeFilter={entityTypeFilter}
              startDate={startDate}
              endDate={endDate}
            />
          </div>
        )}

        {activeTab === "requests" && (
          <div data-testid="requests-tab-panel">
            <RequestsTableView
              search={search}
              methodFilter={methodFilter}
              statusCodeFilter={statusCodeFilter}
              statusClassFilter={statusClassFilter}
              minDurationFilter={minDurationFilter}
              startDate={startDate}
              endDate={endDate}
            />
          </div>
        )}

        {activeTab === "errors" && (
          <div data-testid="errors-tab-panel">
            <ErrorsTableView
              search={search}
              errorClassFilter={errorClassFilter}
            />
          </div>
        )}

        {activeTab === "auth" && (
          <div data-testid="auth-tab-panel">
            <AuthEventsTableView
              search={search}
              actionFilter={actionFilter}
              startDate={startDate}
              endDate={endDate}
            />
          </div>
        )}

        {activeTab === "telemetry" && (
          <div data-testid="telemetry-tab-panel">
            <TelemetryDashboard />
          </div>
        )}
      </div>
    </div>
  );
}
