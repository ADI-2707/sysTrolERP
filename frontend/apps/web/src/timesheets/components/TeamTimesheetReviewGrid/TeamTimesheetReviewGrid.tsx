import { useState, useMemo } from "react";
import { Button, Pagination } from "@systrol/ui";
import type { TeamTimesheetItem, TimesheetStatus } from "../../types";
import { SuperAdminOverrideModal } from "../SuperAdminOverrideModal";
import { TimesheetReviewDrawer } from "../TimesheetReviewDrawer";
import styles from "./TeamTimesheetReviewGrid.module.css";

export interface TeamTimesheetReviewGridProps {
  timesheets: TeamTimesheetItem[];
  onApprove: (id: number) => Promise<void> | void;
  onReturn: (id: number, reason: string) => Promise<void> | void;
  onOverride?: (id: number, payload: { reason: string; status: TimesheetStatus }) => Promise<void> | void;
  isSuper?: boolean;
  isLoading?: boolean;
  isProcessingId?: number | null;
  className?: string;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (val: string) => void;
  allPending?: boolean;
  onAllPendingChange?: (val: boolean) => void;
  departmentFilter?: string;
  onDepartmentFilterChange?: (val: string) => void;
}

export function TeamTimesheetReviewGrid({
  timesheets,
  onApprove,
  onReturn,
  onOverride,
  isSuper = false,
  isLoading = false,
  isProcessingId = null,
  className,
  page = 1,
  pageSize = 20,
  totalCount,
  onPageChange,
  searchTerm = "",
  onSearchChange,
  statusFilter = "ALL",
  onStatusFilterChange,
  allPending = false,
  onAllPendingChange,
  departmentFilter = "",
  onDepartmentFilterChange,
}: TeamTimesheetReviewGridProps) {
  const [localSearch, setLocalSearch] = useState("");
  const [localStatus, setLocalStatus] = useState<string>("ALL");
  const [localDepartment, setLocalDepartment] = useState("");
  const [reviewItem, setReviewItem] = useState<TeamTimesheetItem | null>(null);
  const [overrideItem, setOverrideItem] = useState<TeamTimesheetItem | null>(null);

  const isServerFiltered = onSearchChange !== undefined;
  const currentSearch = isServerFiltered ? searchTerm : localSearch;
  const currentStatus = isServerFiltered ? statusFilter : localStatus;
  const currentDepartment = onDepartmentFilterChange !== undefined ? (departmentFilter || "") : localDepartment;

  const handleSearchChange = (val: string) => {
    if (onSearchChange) onSearchChange(val);
    else setLocalSearch(val);
  };

  const handleStatusChange = (val: string) => {
    if (onStatusFilterChange) onStatusFilterChange(val);
    else setLocalStatus(val);
  };

  const handleDepartmentChange = (val: string) => {
    if (onDepartmentFilterChange) onDepartmentFilterChange(val);
    else setLocalDepartment(val);
  };

  const filteredTimesheets = useMemo(() => {
    if (isServerFiltered) return timesheets;
    return timesheets.filter((ts) => {
      if (allPending && ts.status !== "SUBMITTED") {
        return false;
      }
      if (!allPending && currentStatus !== "ALL" && ts.status !== currentStatus) {
        return false;
      }
      if (currentDepartment && ts.employee.department?.toLowerCase() !== currentDepartment.toLowerCase()) {
        return false;
      }
      if (currentSearch.trim()) {
        const query = currentSearch.toLowerCase().trim();
        const empName = ts.employee.name.toLowerCase();
        const empCode = ts.employee.code.toLowerCase();
        if (!empName.includes(query) && !empCode.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [timesheets, currentStatus, currentSearch, currentDepartment, allPending, isServerFiltered]);

  const handleOverrideConfirm = async (payload: { reason: string; status: TimesheetStatus }) => {
    if (!overrideItem || !onOverride) return;
    await onOverride(overrideItem.id, payload);
    setOverrideItem(null);
  };

  return (
    <div
      className={[styles.container, className].filter(Boolean).join(" ")}
      data-testid="team-timesheet-review-grid"
    >
      <div className={styles.filterBar}>
        <div className={styles.filterControls}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search employee..."
            value={currentSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            data-testid="search-employee-input"
          />

          <select
            className={styles.selectInput}
            value={currentStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            data-testid="filter-status-select"
            disabled={allPending}
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="APPROVED">Approved</option>
            <option value="RETURNED">Returned</option>
            <option value="OPEN">Open</option>
          </select>

          <select
            className={styles.selectInput}
            value={currentDepartment}
            onChange={(e) => handleDepartmentChange(e.target.value)}
            data-testid="filter-department-select"
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Project Management">Project Management</option>
            <option value="Quality Assurance">Quality Assurance</option>
            <option value="Site Operations">Site Operations</option>
            <option value="Commissioning">Commissioning</option>
          </select>

          <button
            type="button"
            className={[styles.toggleBtn, allPending && styles.activeToggleBtn].filter(Boolean).join(" ")}
            onClick={() => onAllPendingChange?.(!allPending)}
            data-testid="toggle-all-pending-btn"
          >
            {allPending ? "Pending (All Weeks)" : "All Weeks Pending"}
          </button>
        </div>

        <span className={styles.countNotice}>
          {totalCount !== undefined
            ? `Showing ${(page - 1) * pageSize + (filteredTimesheets.length ? 1 : 0)}–${Math.min(page * pageSize, totalCount)} of ${totalCount} timesheets`
            : `Showing ${filteredTimesheets.length} of ${timesheets.length} timesheets`}
        </span>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Employee</th>
              <th className={styles.th}>Week</th>
              <th className={styles.th}>Total Hours</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Details</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTimesheets.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  {isLoading ? "Loading team timesheets..." : "No matching timesheets found."}
                </td>
              </tr>
            ) : (
              filteredTimesheets.map((ts) => {
                const isProcessing = isProcessingId === ts.id;

                return (
                  <tr key={ts.id} className={styles.tr} data-testid={`timesheet-row-${ts.id}`}>
                    <td className={styles.td}>
                      <div className={styles.employeeInfo}>
                        <span className={styles.employeeName}>{ts.employee.name}</span>
                        <span className={styles.employeeMeta}>
                          {ts.employee.code}
                          {ts.employee.department ? ` &bull; ${ts.employee.department}` : ""}
                        </span>
                      </div>
                    </td>

                    <td className={styles.td}>
                      <span>
                        {ts.week_start_date} &ndash; {ts.week_end_date}
                      </span>
                    </td>

                    <td className={styles.td}>
                      <span className={styles.hoursVal}>
                        {parseFloat(ts.total_hours || "0").toFixed(1)}h
                      </span>
                    </td>

                    <td className={styles.td}>
                      <span
                        className={[
                          styles.statusBadge,
                          styles[`badge${ts.status as TimesheetStatus}`],
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        data-testid={`status-badge-${ts.id}`}
                      >
                        {ts.status}
                      </span>
                    </td>

                    <td className={styles.td}>
                      {ts.status === "SUBMITTED" && ts.submitted_at && (
                        <span>Submitted {new Date(ts.submitted_at).toLocaleDateString()}</span>
                      )}
                      {ts.status === "APPROVED" && (
                        <span>
                          Approved by {ts.approved_by_label || "Admin"}
                        </span>
                      )}
                      {ts.status === "RETURNED" && ts.return_reason && (
                        <span title={ts.return_reason}>
                          Returned: {ts.return_reason.slice(0, 30)}...
                        </span>
                      )}
                    </td>

                    <td className={styles.td}>
                      <div className={styles.actionsGroup}>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={isProcessing}
                          onClick={() => setReviewItem(ts)}
                          data-testid={`review-btn-${ts.id}`}
                        >
                          Review
                        </Button>

                        {isSuper && onOverride && (
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => setOverrideItem(ts)}
                            data-testid={`override-btn-${ts.id}`}
                          >
                            Override
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <TimesheetReviewDrawer
        isOpen={reviewItem !== null}
        onClose={() => setReviewItem(null)}
        timesheetItem={reviewItem}
        onApprove={async (id) => {
          await onApprove(id);
          setReviewItem(null);
        }}
        onReturn={async (id, reason) => {
          await onReturn(id, reason);
          setReviewItem(null);
        }}
        isSuper={isSuper}
        isProcessing={reviewItem ? isProcessingId === reviewItem.id : false}
      />

      {overrideItem && (
        <SuperAdminOverrideModal
          isOpen={true}
          onClose={() => setOverrideItem(null)}
          onConfirm={handleOverrideConfirm}
          employeeName={overrideItem.employee.name}
          weekRange={`${overrideItem.week_start_date} - ${overrideItem.week_end_date}`}
          currentStatus={overrideItem.status}
          isLoading={isProcessingId === overrideItem.id}
        />
      )}

      {totalCount !== undefined && totalCount > 0 && onPageChange && (
        <div className={styles.paginationFooter} data-testid="review-pagination-footer">
          <span className={styles.paginationMeta}>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount} timesheets
          </span>
          <Pagination
            page={page}
            pageSize={pageSize}
            total={totalCount}
            onChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
