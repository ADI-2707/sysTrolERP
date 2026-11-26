import { useState, useEffect, useCallback, useMemo } from "react";
import { Spinner, EmptyState, Input, Button, Pagination, useToast } from "@systrol/ui";
import {
  fetchAssignmentMatrix,
  addProjectMember,
  removeProjectMember,
} from "../../../api/projects";
import type {
  AssignmentMatrixData,
  AssignmentMatrixEmployee,
  AssignmentMatrixProject,
} from "../../types";
import styles from "./AssignmentMatrix.module.css";

export function AssignmentMatrix() {
  const { addToast } = useToast();
  const [data, setData] = useState<AssignmentMatrixData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [employeeSearch, setEmployeeSearch] = useState<string>("");
  const [projectSearch, setProjectSearch] = useState<string>("");
  const [employeePage, setEmployeePage] = useState<number>(1);
  const employeePageSize = 25;
  const [togglingKeys, setTogglingKeys] = useState<Set<string>>(new Set());

  const loadMatrix = useCallback(async (pageToLoad = employeePage) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchAssignmentMatrix({
        page: pageToLoad,
        page_size: employeePageSize,
      });
      setData(res);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load assignment matrix.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [employeePage, employeePageSize]);

  useEffect(() => {
    loadMatrix(employeePage);
  }, [employeePage]);

  const assignmentSet = useMemo(() => {
    const set = new Set<string>();
    if (data?.assignments) {
      for (const a of data.assignments) {
        set.add(`${a.employee_id}:${a.project_id}`);
      }
    }
    return set;
  }, [data?.assignments]);

  const filteredEmployees = useMemo(() => {
    if (!data?.employees) return [];
    const term = employeeSearch.trim().toLowerCase();
    if (!term) return data.employees;
    return data.employees.filter(
      (e) =>
        e.name.toLowerCase().includes(term) || e.code.toLowerCase().includes(term)
    );
  }, [data?.employees, employeeSearch]);

  const filteredProjects = useMemo(() => {
    if (!data?.projects) return [];
    const term = projectSearch.trim().toLowerCase();
    if (!term) return data.projects;
    return data.projects.filter(
      (p) =>
        p.name.toLowerCase().includes(term) || p.code.toLowerCase().includes(term)
    );
  }, [data?.projects, projectSearch]);

  const handleToggle = async (
    project: AssignmentMatrixProject,
    employee: AssignmentMatrixEmployee
  ) => {
    const key = `${employee.id}:${project.id}`;
    if (togglingKeys.has(key)) return;

    const isAssigned = assignmentSet.has(key);

    setTogglingKeys((prev) => new Set(prev).add(key));

    setData((prev) => {
      if (!prev) return prev;
      const nextAssignments = isAssigned
        ? prev.assignments.filter(
            (a) => !(a.employee_id === employee.id && a.project_id === project.id)
          )
        : [...prev.assignments, { employee_id: employee.id, project_id: project.id }];
      return { ...prev, assignments: nextAssignments };
    });

    try {
      if (isAssigned) {
        await removeProjectMember(project.id, employee.id);
        addToast({
          type: "success",
          title: "Assignment removed",
          description: `Removed ${employee.name} from ${project.code}.`,
        });
      } else {
        await addProjectMember(project.id, employee.id);
        addToast({
          type: "success",
          title: "Assignment added",
          description: `Assigned ${employee.name} to ${project.code}.`,
        });
      }
    } catch (err: unknown) {
      setData((prev) => {
        if (!prev) return prev;
        const revertedAssignments = isAssigned
          ? [...prev.assignments, { employee_id: employee.id, project_id: project.id }]
          : prev.assignments.filter(
              (a) => !(a.employee_id === employee.id && a.project_id === project.id)
            );
        return { ...prev, assignments: revertedAssignments };
      });
      addToast({
        type: "error",
        title: "Update failed",
        description: err instanceof Error ? err.message : "Failed to update assignment.",
      });
    } finally {
      setTogglingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingWrapper} data-testid="matrix-loading">
        <Spinner size="lg" />
        <span>Loading assignment matrix...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div role="alert" className={styles.loadingWrapper} data-testid="matrix-error">
        <span>{error || "Failed to load matrix data."}</span>
        <Button size="sm" variant="secondary" onClick={() => loadMatrix()} data-testid="matrix-retry-btn">
          Retry
        </Button>
      </div>
    );
  }

  if (data.employees.length === 0 || data.projects.length === 0) {
    return (
      <div data-testid="matrix-empty-state">
        <EmptyState
          title="No data available"
          description={
            data.employees.length === 0
              ? "No active employees found to display in the matrix."
              : "No active projects found to display in the matrix."
          }
        />
      </div>
    );
  }

  return (
    <div className={styles.container} data-testid="assignment-matrix">
      <div className={styles.toolbar}>
        <div className={styles.filterInput}>
          <Input
            value={employeeSearch}
            onChange={(e) => setEmployeeSearch(e.target.value)}
            placeholder="Filter employees..."
            data-testid="matrix-employee-filter"
            size="sm"
          />
        </div>
        <div className={styles.filterInput}>
          <Input
            value={projectSearch}
            onChange={(e) => setProjectSearch(e.target.value)}
            placeholder="Filter projects..."
            data-testid="matrix-project-filter"
            size="sm"
          />
        </div>
      </div>

      <div className={styles.tableWrapper} data-testid="matrix-table-wrapper">
        <table className={styles.matrixTable} data-testid="matrix-table">
          <thead>
            <tr>
              <th className={styles.cornerHeader} scope="col">
                Employees \ Projects
              </th>
              {filteredProjects.map((p) => (
                <th key={p.id} className={styles.colHeader} scope="col" data-testid={`matrix-col-${p.id}`}>
                  <div className={styles.colHeaderContent}>
                    <span className={styles.projectCode}>{p.code}</span>
                    <span className={styles.projectName} title={p.name}>
                      {p.name}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 || filteredProjects.length === 0 ? (
              <tr>
                <td
                  colSpan={filteredProjects.length + 1}
                  style={{ textAlign: "center", padding: "var(--space-8)" }}
                  data-testid="matrix-no-results"
                >
                  No matching employees or projects.
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => (
                <tr key={emp.id} data-testid={`matrix-row-${emp.id}`}>
                  <th className={styles.rowHeader} scope="row">
                    <div className={styles.employeeContent}>
                      <span className={styles.employeeName}>{emp.name}</span>
                      <span className={styles.employeeCode}>{emp.code}</span>
                    </div>
                  </th>
                  {filteredProjects.map((proj) => {
                    const key = `${emp.id}:${proj.id}`;
                    const isAssigned = assignmentSet.has(key);
                    const isToggling = togglingKeys.has(key);

                    return (
                      <td key={proj.id} className={styles.cell}>
                        <button
                          type="button"
                          className={styles.cellBtn}
                          onClick={() => handleToggle(proj, emp)}
                          disabled={isToggling}
                          aria-label={`${emp.name} on ${proj.name}: ${isAssigned ? "Assigned" : "Not assigned"}`}
                          aria-pressed={isAssigned}
                          data-testid={`matrix-cell-${emp.id}-${proj.id}`}
                        >
                          {isToggling ? (
                            <span className={styles.cellLoading}>
                              <Spinner size="sm" />
                            </span>
                          ) : isAssigned ? (
                            <span
                              className={styles.dotAssigned}
                              data-testid={`matrix-dot-${emp.id}-${proj.id}`}
                            />
                          ) : (
                            <span className={styles.dotUnassigned} />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data.total_employees !== undefined && data.total_employees > 0 && (
        <div className={styles.paginationFooter} data-testid="matrix-pagination-footer">
          <span className={styles.paginationMeta} data-testid="matrix-pagination-meta">
            Showing {(employeePage - 1) * employeePageSize + 1}–{Math.min(employeePage * employeePageSize, data.total_employees)} of {data.total_employees} employees
          </span>
          <Pagination
            page={employeePage}
            pageSize={employeePageSize}
            total={data.total_employees}
            onChange={setEmployeePage}
          />
        </div>
      )}
    </div>
  );
}
