import { useState, useEffect, useCallback, useMemo } from "react";
import { Badge, Button, Table, Pagination, EmptyState, Spinner, useToast, type TableColumn } from "@systrol/ui";
import { useAuth } from "../auth";
import { fetchEmployees, createEmployee, updateEmployee, revokeEmployee, restoreEmployee, resetEmployeePassword } from "../api/employees";
import type { EmployeeListItem, CreateEmployeePayload, EmployeeCreatedResponse, EmployeeDetailData, UpdateEmployeePayload } from "../employees/types";
import { CreateEmployeeModal } from "../employees/components/CreateEmployeeModal";
import { TemporaryPasswordModal } from "../employees/components/TemporaryPasswordModal";
import { EmployeeDetailDrawer } from "../employees/components/EmployeeDetailDrawer";
import { EditEmployeeModal } from "../employees/components/EditEmployeeModal";
import { ActionReasonModal } from "../employees/components/ActionReasonModal";
import styles from "./EmployeesPage.module.css";

export function EmployeesPage() {
  const { isSuperAdmin, isAdmin } = useAuth();
  const canManage = isSuperAdmin || isAdmin;
  const { addToast } = useToast();

  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [createdEmployee, setCreatedEmployee] = useState<EmployeeCreatedResponse | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeDetailData | null>(null);
  const [actionReasonState, setActionReasonState] = useState<{
    isOpen: boolean;
    mode: "revoke" | "restore";
    employee: EmployeeDetailData | null;
  }>({
    isOpen: false,
    mode: "revoke",
    employee: null,
  });
  const [temporaryResetPassword, setTemporaryResetPassword] = useState<{
    temporaryPassword: string;
    employeeName: string;
    employeeCode: string;
    email: string;
    role: string;
  } | null>(null);

  const [search, setSearch] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortColumn, setSortColumn] = useState<string>("employee_code");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState<number>(1);
  const pageSize = 20;

  const loadEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const orderingParam = sortDirection === "desc" ? `-${sortColumn}` : sortColumn;
      const res = await fetchEmployees({
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        ordering: orderingParam,
        page,
      });
      setEmployees(res.results || []);
      setTotalCount(res.count || 0);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load employees list.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter, statusFilter, sortColumn, sortDirection, page]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const handleSort = (columnKey: string, direction: "asc" | "desc") => {
    setSortColumn(columnKey);
    setSortDirection(direction);
    setPage(1);
  };

  const handleCreateSubmit = async (payload: CreateEmployeePayload) => {
    const res = await createEmployee(payload);
    setCreatedEmployee(res);
    loadEmployees();
    return res;
  };

  const handleUpdateEmployee = async (id: number, payload: UpdateEmployeePayload) => {
    await updateEmployee(id, payload);
    addToast({
      title: "Profile Updated",
      description: "Employee profile has been updated successfully.",
      type: "success",
    });
    loadEmployees();
    setEditingEmployee(null);
  };

  const handleRevokeClick = (emp: EmployeeDetailData) => {
    setActionReasonState({
      isOpen: true,
      mode: "revoke",
      employee: emp,
    });
  };

  const handleRestoreClick = (emp: EmployeeDetailData) => {
    setActionReasonState({
      isOpen: true,
      mode: "restore",
      employee: emp,
    });
  };

  const handleResetPasswordClick = async (emp: EmployeeDetailData) => {
    try {
      const res = await resetEmployeePassword(emp.id);
      setTemporaryResetPassword({
        temporaryPassword: res.temporary_password,
        employeeName: emp.full_name,
        employeeCode: emp.employee_code,
        email: emp.email,
        role: emp.role,
      });
      addToast({
        title: "Password Reset",
        description: `New temporary password generated for ${emp.employee_code}.`,
        type: "success",
      });
    } catch (err: unknown) {
      addToast({
        title: "Reset Failed",
        description: err instanceof Error ? err.message : "Failed to reset password.",
        type: "error",
      });
    }
  };

  const handleActionReasonSubmit = async (reason: string) => {
    const emp = actionReasonState.employee;
    if (!emp) return;

    if (actionReasonState.mode === "revoke") {
      await revokeEmployee(emp.id, reason);
      addToast({
        title: "Account Revoked",
        description: `Access for ${emp.employee_code} has been revoked.`,
        type: "warning",
      });
    } else {
      await restoreEmployee(emp.id, reason);
      addToast({
        title: "Account Restored",
        description: `Access for ${emp.employee_code} has been restored.`,
        type: "success",
      });
    }
    loadEmployees();
    setSelectedEmployeeId(null);
  };

  const columns: TableColumn<EmployeeListItem>[] = useMemo(
    () => [
      {
        key: "employee_code",
        header: "Code",
        sortable: true,
        width: "120px",
        render: (emp) => (
          <span className={styles.codeCell} data-testid={`employee-code-${emp.id}`}>
            {emp.employee_code}
          </span>
        ),
      },
      {
        key: "full_name",
        header: "Name",
        sortable: true,
        render: (emp) => (
          <div className={styles.nameCell}>
            <span className={styles.nameText} data-testid={`employee-name-${emp.id}`}>
              {emp.full_name}
            </span>
          </div>
        ),
      },
      {
        key: "email",
        header: "Email",
        sortable: true,
        render: (emp) => (
          <span className={styles.emailText} data-testid={`employee-email-${emp.id}`}>
            {emp.email}
          </span>
        ),
      },
      {
        key: "designation",
        header: "Designation",
        render: (emp) => <span data-testid={`employee-designation-${emp.id}`}>{emp.designation || "-"}</span>,
      },
      {
        key: "department",
        header: "Department",
        render: (emp) => <span data-testid={`employee-department-${emp.id}`}>{emp.department || "-"}</span>,
      },
      {
        key: "role",
        header: "Role",
        width: "110px",
        render: (emp) => (
          <span data-testid={`employee-role-badge-${emp.id}`}>
            <Badge variant={emp.role === "ADMIN" ? "brand" : "default"}>
              {emp.role}
            </Badge>
          </span>
        ),
      },
      {
        key: "is_active",
        header: "Status",
        width: "110px",
        render: (emp) => (
          <span data-testid={`employee-status-badge-${emp.id}`}>
            <Badge variant={emp.is_active && !emp.revoked_at ? "success" : "danger"}>
              {emp.is_active && !emp.revoked_at ? "ACTIVE" : "REVOKED"}
            </Badge>
          </span>
        ),
      },
      {
        key: "date_joined",
        header: "Joined Date",
        sortable: true,
        width: "130px",
        render: (emp) => (
          <span data-testid={`employee-joined-${emp.id}`}>
            {new Date(emp.date_joined).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        ),
      },
      {
        key: "last_login",
        header: "Last Login",
        sortable: true,
        width: "140px",
        render: (emp) => (
          <span data-testid={`employee-login-${emp.id}`}>
            {emp.last_login
              ? new Date(emp.last_login).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "Never"}
          </span>
        ),
      },
    ],
    []
  );

  const startIdx = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, totalCount);

  return (
    <div className={styles.pageContainer} data-testid="employees-page">
      <div className={styles.headerSection}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Employee Directory</h1>
          <p className={styles.subtitle}>
            Manage staff accounts, credentials, and access roles.
          </p>
        </div>
        {canManage && (
          <Button
            variant="primary"
            onClick={() => setIsCreateOpen(true)}
            data-testid="add-employee-btn"
          >
            Add Employee
          </Button>
        )}
      </div>

      <div className={styles.toolbar} data-testid="employees-toolbar">
        <div className={styles.filterGroup}>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search by code, name, email, department..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            data-testid="employee-search-input"
          />

          <select
            className={styles.selectInput}
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            data-testid="employee-role-filter"
            aria-label="Filter by role"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="EMPLOYEE">Employee</option>
          </select>

          <select
            className={styles.selectInput}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            data-testid="employee-status-filter"
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>
      </div>

      {error && (
        <div role="alert" className={styles.errorAlert} data-testid="employees-error">
          <span>{error}</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={loadEmployees}
            data-testid="employees-retry-btn"
          >
            Retry
          </Button>
        </div>
      )}

      <div className={styles.tableCard} data-testid="employees-table-card">
        {isLoading ? (
          <div className={styles.loadingContainer} data-testid="employees-loading">
            <Spinner size="lg" />
            <span>Loading employees...</span>
          </div>
        ) : employees.length === 0 ? (
          <div data-testid="employees-empty-state">
            <EmptyState
              title="No employees found"
              description="No staff accounts match your search or filter criteria."
            />
          </div>
        ) : (
          <>
            <Table
              data={employees}
              columns={columns}
              rowKey={(emp) => emp.id}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
              onRowClick={(emp) => setSelectedEmployeeId(emp.id)}
            />
            <div className={styles.paginationFooter} data-testid="employees-pagination-footer">
              <span className={styles.paginationMeta} data-testid="employees-pagination-meta">
                Showing {startIdx}-{endIdx} of {totalCount} employees
              </span>
              <Pagination
                page={page}
                pageSize={pageSize}
                total={totalCount}
                onChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      <CreateEmployeeModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        isSuperAdmin={isSuperAdmin}
      />

      {createdEmployee && (
        <TemporaryPasswordModal
          isOpen={true}
          onClose={() => setCreatedEmployee(null)}
          title="Account Created Successfully"
          temporaryPassword={createdEmployee.temporary_password}
          employeeName={createdEmployee.full_name}
          employeeCode={createdEmployee.employee_code}
          email={createdEmployee.email}
          role={createdEmployee.role}
        />
      )}

      <EmployeeDetailDrawer
        isOpen={selectedEmployeeId !== null}
        onClose={() => setSelectedEmployeeId(null)}
        employeeId={selectedEmployeeId}
        canManage={canManage}
        isSuperAdmin={isSuperAdmin}
        onEditProfile={(emp) => setEditingEmployee(emp)}
        onRevokeAccess={handleRevokeClick}
        onRestoreAccess={handleRestoreClick}
        onResetPassword={handleResetPasswordClick}
      />

      <EditEmployeeModal
        isOpen={editingEmployee !== null}
        onClose={() => setEditingEmployee(null)}
        employee={editingEmployee}
        onSubmit={handleUpdateEmployee}
      />

      <ActionReasonModal
        isOpen={actionReasonState.isOpen}
        onClose={() => setActionReasonState({ isOpen: false, mode: "revoke", employee: null })}
        title={actionReasonState.mode === "revoke" ? "Revoke Staff Account" : "Restore Staff Account"}
        description={
          actionReasonState.mode === "revoke"
            ? "Revoking an employee terminates all active sessions immediately and prevents future logins."
            : "Restoring an account reactivates login capabilities for this employee."
        }
        employeeName={actionReasonState.employee?.full_name}
        employeeCode={actionReasonState.employee?.employee_code}
        confirmLabel={actionReasonState.mode === "revoke" ? "Revoke Access" : "Restore Access"}
        confirmVariant={actionReasonState.mode === "revoke" ? "danger" : "primary"}
        reasonLabel="Reason (audited)"
        onSubmit={handleActionReasonSubmit}
      />

      {temporaryResetPassword && (
        <TemporaryPasswordModal
          isOpen={true}
          onClose={() => setTemporaryResetPassword(null)}
          title="Temporary Password Issued"
          temporaryPassword={temporaryResetPassword.temporaryPassword}
          employeeName={temporaryResetPassword.employeeName}
          employeeCode={temporaryResetPassword.employeeCode}
          email={temporaryResetPassword.email}
          role={temporaryResetPassword.role}
        />
      )}
    </div>
  );
}
