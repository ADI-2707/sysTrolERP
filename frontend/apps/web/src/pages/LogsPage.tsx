import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, type TabItem } from "@systrol/ui";
import type { LogsTabKey } from "../logs/types";
import { LogsFilterBar } from "../logs/components/LogsFilterBar";
import { AuditTableView } from "../logs/components/AuditTableView";
import styles from "./LogsPage.module.css";

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
  const statusCodeFilter = searchParams.get("status_code") || "";
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

  const tabs: TabItem[] = [
    { id: "audit", label: "Audit" },
    { id: "requests", label: "Requests" },
    { id: "errors", label: "Errors" },
    { id: "auth", label: "Auth" },
    { id: "telemetry", label: "Telemetry" },
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
          statusCodeFilter={statusCodeFilter}
          methodFilter={methodFilter}
          errorClassFilter={errorClassFilter}
          onSearchChange={(v) => updateParam("search", v)}
          onStartDateChange={(v) => updateParam("start_date", v)}
          onEndDateChange={(v) => updateParam("end_date", v)}
          onActionFilterChange={(v) => updateParam("action", v)}
          onStatusCodeFilterChange={(v) => updateParam("status_code", v)}
          onMethodFilterChange={(v) => updateParam("method", v)}
          onErrorClassFilterChange={(v) => updateParam("error_class", v)}
          onResetFilters={handleResetFilters}
        />
      )}

      <div className={styles.panelContainer}>
        {activeTab === "audit" && (
          <div data-testid="audit-tab-panel">
            <AuditTableView
              search={search}
              actionFilter={actionFilter}
              startDate={startDate}
              endDate={endDate}
            />
          </div>
        )}

        {activeTab === "requests" && (
          <div data-testid="requests-tab-panel" className={styles.placeholderCard}>
            HTTP request telemetry records view
          </div>
        )}

        {activeTab === "errors" && (
          <div data-testid="errors-tab-panel" className={styles.placeholderCard}>
            Application error logs and stack traces view
          </div>
        )}

        {activeTab === "auth" && (
          <div data-testid="auth-tab-panel" className={styles.placeholderCard}>
            Authentication events and security alerts view
          </div>
        )}

        {activeTab === "telemetry" && (
          <div data-testid="telemetry-tab-panel" className={styles.placeholderCard}>
            Telemetry performance metrics dashboard
          </div>
        )}
      </div>
    </div>
  );
}
