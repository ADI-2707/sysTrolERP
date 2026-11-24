import { Avatar, Badge } from "@systrol/ui";
import { useAuth } from "../../../auth";
import styles from "./ProfileSection.module.css";

export function ProfileSection() {
  const { user, isSuperAdmin } = useAuth();

  if (isSuperAdmin) {
    return (
      <div className={styles.container} data-testid="profile-section">
        <div className={styles.superNoticeCard} data-testid="super-admin-notice-card">
          <div className={styles.superTitleRow}>
            <h2 className={styles.superTitle}>Super Administrator Principal</h2>
            <Badge variant="brand">SUPER ADMIN</Badge>
          </div>
          <div className={styles.superDescription}>
            The Super Administrator is a host-seeded system principal governed exclusively by environment variables (<span className={styles.codeSnippet}>SUPER_ADMIN_USERNAME</span> and <span className={styles.codeSnippet}>SUPER_ADMIN_PASSWORD_HASH</span>).
          </div>
          <div className={styles.superDescription}>
            Password updates and account recovery cannot be performed through the web application. To rotate or generate new credentials, execute the administrative command on the backend host:
          </div>
          <div style={{ marginTop: 8 }}>
            <code className={styles.codeSnippet} data-testid="super-admin-command-snippet">
              python manage.py generate_super_admin_hash
            </code>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.container} data-testid="profile-section-empty">
        <p>No user profile available.</p>
      </div>
    );
  }

  const roleVariant = user.role === "ADMIN" ? "info" : "default";

  return (
    <div className={styles.container} data-testid="profile-section">
      <div className={styles.profileCard} data-testid="user-profile-card">
        <div className={styles.headerRow}>
          <Avatar name={user.full_name} size="lg" />
          <div className={styles.headerText}>
            <h2 className={styles.displayName} data-testid="profile-name">
              {user.full_name}
            </h2>
            <div className={styles.roleGroup}>
              <Badge variant={roleVariant}>{user.role}</Badge>
              <span className={styles.codeText} data-testid="profile-code">
                {user.employee_code}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.metaGrid} data-testid="profile-meta-grid">
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Email Address</span>
            <span className={styles.metaValue} data-testid="profile-email">
              {user.email}
            </span>
          </div>

          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Phone Number</span>
            <span className={styles.metaValue} data-testid="profile-phone">
              {user.phone || "Not configured"}
            </span>
          </div>

          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Designation</span>
            <span className={styles.metaValue} data-testid="profile-designation">
              {user.designation || "Not configured"}
            </span>
          </div>

          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Department</span>
            <span className={styles.metaValue} data-testid="profile-department">
              {user.department || "Not configured"}
            </span>
          </div>

          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>System Role</span>
            <span className={styles.metaValue} data-testid="profile-role">
              {user.role}
            </span>
          </div>

          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Account Status</span>
            <span className={styles.metaValue} data-testid="profile-status">
              Active
            </span>
          </div>
        </div>
      </div>

      <div className={styles.readOnlyNotice} data-testid="profile-readonly-notice">
        <span>ℹ️ Profile details are read-only. Contact an administrator to update designations or contact details.</span>
      </div>
    </div>
  );
}
