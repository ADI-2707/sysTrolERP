import { useState } from "react";
import { Tabs, type TabItem } from "@systrol/ui";
import { useAuth } from "../auth";
import { ChangePasswordForm } from "../settings/components/ChangePasswordForm";
import styles from "./SettingsPage.module.css";

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<string>("security");
  const { isSuperAdmin } = useAuth();

  const tabs: TabItem[] = [
    { id: "security", label: "Security & Password" },
  ];

  return (
    <div className={styles.container} data-testid="settings-page">
      <div className={styles.header}>
        <h1 className={styles.title}>Account & System Settings</h1>
        <p className={styles.subtitle}>
          Manage your credentials, display preferences, and administrative policies.
        </p>
      </div>

      <div className={styles.tabsContainer}>
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id)}
          aria-label="Settings navigation"
        />
      </div>

      <div className={styles.contentCard} data-testid="settings-tab-content">
        {activeTab === "security" && (
          <div data-testid="settings-security-panel">
            {isSuperAdmin ? (
              <div data-testid="super-admin-settings-notice">
                Super Administrator credentials are configured via environment variables and cannot be modified through the web interface.
              </div>
            ) : (
              <ChangePasswordForm />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
