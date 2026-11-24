import { useState, useEffect, useCallback, useMemo } from "react";
import { Badge, Button, Table, Pagination, EmptyState, Spinner, type TableColumn } from "@systrol/ui";
import { fetchEmployees } from "../api/employees";
import type { EmployeeListItem } from "../employees/types";
import styles from "./EmployeesPage.module.css";

export function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
    </div>
  );
}
