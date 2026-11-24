import { useMemo, type ReactNode } from "react";
import { Tabs, type TabItem } from "@systrol/ui";
import styles from "./AdminTimesheetTabs.module.css";

export interface AdminTimesheetTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  pendingCount?: number;
  children?: ReactNode;
  className?: string;
}

export function AdminTimesheetTabs({
  activeTab,
  onTabChange,
  pendingCount = 0,
  children,
  className,
}: AdminTimesheetTabsProps) {
  const tabs = useMemo<TabItem[]>(() => {
    return [
      {
        id: "my",
        label: "My Timesheet",
      },
      {
        id: "team",
        label: "Team Timesheets",
        badge:
          pendingCount > 0 ? (
            <span className={styles.tabBadge} data-testid="pending-badge">
              {pendingCount}
            </span>
          ) : undefined,
      },
    ];
  }, [pendingCount]);

  return (
    <div
      className={[styles.container, className].filter(Boolean).join(" ")}
      data-testid="admin-timesheet-tabs"
    >
      <div className={styles.tabsNav}>
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={onTabChange}
          aria-label="Timesheet dashboard navigation"
        />
      </div>

      {children}
    </div>
  );
}
