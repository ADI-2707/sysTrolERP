import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Drawer, Badge, Button, Spinner } from "@systrol/ui";
import { fetchEmployeeDetail } from "../../../api/employees";
import { fetchTeamTimesheets } from "../../../api/timesheets";
import type { EmployeeDetailData } from "../../types";
import type { TeamTimesheetItem } from "../../../timesheets/types";
import styles from "./EmployeeDetailDrawer.module.css";

export interface EmployeeDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: number | null;
  canManage?: boolean;
  isSuperAdmin?: boolean;
  onEditProfile?: (employee: EmployeeDetailData) => void;
  onRevokeAccess?: (employee: EmployeeDetailData) => void;
  onRestoreAccess?: (employee: EmployeeDetailData) => void;
  onResetPassword?: (employee: EmployeeDetailData) => void;
  onSuperResetAdmin?: (employee: EmployeeDetailData) => void;
  onSuperClearLockout?: (employee: EmployeeDetailData) => void;
}

export function EmployeeDetailDrawer({
  isOpen,
  onClose,
  employeeId,
  canManage = false,
  isSuperAdmin = false,
  onEditProfile,
  onRevokeAccess,
  onRestoreAccess,
  onResetPassword,
  onSuperResetAdmin,
  onSuperClearLockout,
}: EmployeeDetailDrawerProps) {
  const [employee, setEmployee] = useState<EmployeeDetailData | null>(null);
  const [timesheets, setTimesheets] = useState<TeamTimesheetItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const empData = await fetchEmployeeDetail(id);
      setEmployee(empData);

      try {
        const tsData = await fetchTeamTimesheets({ employee: empData.employee_code });
        setTimesheets(tsData.results || []);
      } catch {
        setTimesheets([]);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load employee details.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && employeeId !== null) {
      loadData(employeeId);
    } else {
      setEmployee(null);
      setTimesheets([]);
      setError(null);
    }
  }, [isOpen, employeeId, loadData]);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={employee ? `Staff Profile: ${employee.employee_code}` : "Staff Profile"}
      side="right"
    >
      <div className={styles.drawerContainer} data-testid="employee-detail-drawer">
        {isLoading && (
          <div className={styles.loadingContainer} data-testid="employee-drawer-loading">
            <Spinner size="lg" />
            <span>Loading details...</span>
          </div>
        )}

        {error && (
          <div role="alert" className={styles.errorAlert} data-testid="employee-drawer-error">
            <span>{error}</span>
            {employeeId && (
              <Button size="sm" variant="secondary" onClick={() => loadData(employeeId)}>
                Retry
              </Button>
            )}
          </div>
        )}

        {!isLoading && employee && (
          <>
            <div className={styles.headerCard}>
              <div className={styles.nameRow}>
                <h3 className={styles.fullName} data-testid="drawer-emp-name">
                  {employee.full_name}
                </h3>
                <div className={styles.badgeGroup}>
                  <span data-testid="drawer-role-badge">
                    <Badge variant={employee.role === "ADMIN" ? "brand" : "default"}>
                      {employee.role}
                    </Badge>
                  </span>
                  <span data-testid="drawer-status-badge">
                    <Badge variant={employee.is_active && !employee.revoked_at ? "success" : "danger"}>
                      {employee.is_active && !employee.revoked_at ? "ACTIVE" : "REVOKED"}
                    </Badge>
                  </span>
                </div>
              </div>

              <div className={styles.subMeta}>
                <span className={styles.codeBadge} data-testid="drawer-emp-code">
                  {employee.employee_code}
                </span>
                <span>{employee.email}</span>
              </div>
            </div>

            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Profile Details</h4>
              <div className={styles.infoGrid} data-testid="drawer-profile-grid">
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Designation</span>
                  <span className={styles.infoValue} data-testid="drawer-emp-designation">
                    {employee.designation || "-"}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Department</span>
                  <span className={styles.infoValue} data-testid="drawer-emp-department">
                    {employee.department || "-"}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Phone</span>
                  <span className={styles.infoValue} data-testid="drawer-emp-phone">
                    {employee.phone || "-"}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Joined On</span>
                  <span className={styles.infoValue} data-testid="drawer-emp-joined">
                    {new Date(employee.date_joined).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Last Login</span>
                  <span className={styles.infoValue} data-testid="drawer-emp-login">
                    {employee.last_login
                      ? new Date(employee.last_login).toLocaleString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Never"}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Password Status</span>
                  <span className={styles.infoValue} data-testid="drawer-emp-pw-status">
                    {employee.must_change_password ? "Reset required on login" : "Standard"}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h4 className={styles.sectionTitle}>Assigned Projects</h4>
                <span data-testid="drawer-projects-count">
                  <Badge variant="default">
                    {employee.assigned_projects?.length || 0}
                  </Badge>
                </span>
              </div>
              <div className={styles.listGroup} data-testid="drawer-projects-list">
                {!employee.assigned_projects || employee.assigned_projects.length === 0 ? (
                  <div className={styles.emptyText} data-testid="drawer-no-projects">
                    No active project assignments.
                  </div>
                ) : (
                  employee.assigned_projects.map((proj) => (
                    <Link
                      key={proj.project_id}
                      to={`/projects/${proj.project_id}`}
                      className={styles.listItem}
                      data-testid={`drawer-project-${proj.project_id}`}
                    >
                      <div>
                        <span className={styles.projectCode}>{proj.code}</span>
                        <span>{proj.name}</span>
                      </div>
                      <span aria-hidden="true">&rarr;</span>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h4 className={styles.sectionTitle}>Recent Timesheets</h4>
              </div>
              <div className={styles.listGroup} data-testid="drawer-timesheets-list">
                {timesheets.length === 0 ? (
                  <div className={styles.emptyText} data-testid="drawer-no-timesheets">
                    No timesheet submissions recorded.
                  </div>
                ) : (
                  timesheets.slice(0, 5).map((ts) => (
                    <div
                      key={ts.id}
                      className={styles.timesheetItem}
                      data-testid={`drawer-timesheet-${ts.id}`}
                    >
                      <div>
                        <div className={styles.timesheetWeek}>
                          Week of {ts.week_start_date}
                        </div>
                        <div className={styles.timesheetHours}>
                          Total: {ts.total_hours}h
                        </div>
                      </div>
                      <Badge
                        variant={
                          ts.status === "APPROVED"
                            ? "success"
                            : ts.status === "SUBMITTED"
                            ? "info"
                            : "default"
                        }
                      >
                        {ts.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h4 className={styles.sectionTitle}>Recent Activity</h4>
              </div>
              <div className={styles.listGroup} data-testid="drawer-activity-list">
                {!employee.recent_activity || employee.recent_activity.length === 0 ? (
                  <div className={styles.emptyText} data-testid="drawer-no-activity">
                    No recent audit events recorded.
                  </div>
                ) : (
                  employee.recent_activity.slice(0, 5).map((act) => (
                    <div
                      key={act.id}
                      className={styles.activityItem}
                      data-testid={`drawer-activity-${act.id}`}
                    >
                      <div className={styles.activityTop}>
                        <span className={styles.activityAction}>{act.action}</span>
                        <span className={styles.activityDate}>
                          {new Date(act.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className={styles.activitySummary}>{act.summary}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {canManage && (
              <div className={styles.drawerActions} data-testid="drawer-actions">
                {onEditProfile && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onEditProfile(employee)}
                    data-testid="drawer-edit-btn"
                  >
                    Edit Profile
                  </Button>
                )}

                {employee.role === "EMPLOYEE" && onResetPassword && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onResetPassword(employee)}
                    data-testid="drawer-reset-pw-btn"
                  >
                    Reset Password
                  </Button>
                )}

                {employee.role === "ADMIN" && isSuperAdmin && onSuperResetAdmin && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onSuperResetAdmin(employee)}
                    data-testid="drawer-super-reset-admin-btn"
                  >
                    Reset Admin Password
                  </Button>
                )}

                {employee.is_active && !employee.revoked_at ? (
                  onRevokeAccess && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => onRevokeAccess(employee)}
                      data-testid="drawer-revoke-btn"
                    >
                      Revoke Account
                    </Button>
                  )
                ) : (
                  onRestoreAccess && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onRestoreAccess(employee)}
                      data-testid="drawer-restore-btn"
                    >
                      Restore Account
                    </Button>
                  )
                )}

                {isSuperAdmin && onSuperClearLockout && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onSuperClearLockout(employee)}
                    data-testid="drawer-clear-lockout-btn"
                  >
                    Clear Lockout
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Drawer>
  );
}
