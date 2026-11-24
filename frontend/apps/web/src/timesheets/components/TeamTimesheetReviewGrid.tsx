import { useState, useMemo } from "react";
import { Button } from "@systrol/ui";
import type { TeamTimesheetItem, TimesheetStatus } from "../types";
import { ReturnTimesheetModal } from "./ReturnTimesheetModal";
import { SuperAdminOverrideModal } from "./SuperAdminOverrideModal";
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
}: TeamTimesheetReviewGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [returnItem, setReturnItem] = useState<TeamTimesheetItem | null>(null);
  const [overrideItem, setOverrideItem] = useState<TeamTimesheetItem | null>(null);

  const filteredTimesheets = useMemo(() => {
    return timesheets.filter((ts) => {
      if (statusFilter !== "ALL" && ts.status !== statusFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const empName = ts.employee.name.toLowerCase();
        const empCode = ts.employee.code.toLowerCase();
        if (!empName.includes(query) && !empCode.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [timesheets, statusFilter, searchTerm]);

  const handleReturnConfirm = async (reason: string) => {
    if (!returnItem) return;
    await onReturn(returnItem.id, reason);
    setReturnItem(null);
  };

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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="search-employee-input"
          />

          <select
            className={styles.selectInput}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            data-testid="filter-status-select"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="APPROVED">Approved</option>
            <option value="RETURNED">Returned</option>
            <option value="OPEN">Open</option>
          </select>
        </div>

        <span className={styles.countNotice}>
          Showing {filteredTimesheets.length} of {timesheets.length} timesheets
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
                const canAction = ts.can_approve && ts.status === "SUBMITTED";

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
                        {canAction && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              loading={isProcessing}
                              onClick={() => onApprove(ts.id)}
                              data-testid={`approve-btn-${ts.id}`}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={isProcessing}
                              onClick={() => setReturnItem(ts)}
                              data-testid={`return-btn-${ts.id}`}
                            >
                              Return
                            </Button>
                          </>
                        )}

                        {!ts.can_approve && ts.status === "SUBMITTED" && !isSuper && (
                          <span
                            className={styles.ownTimesheetNotice}
                            data-testid={`own-notice-${ts.id}`}
                          >
                            Own timesheet
                          </span>
                        )}

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

      {returnItem && (
        <ReturnTimesheetModal
          isOpen={true}
          onClose={() => setReturnItem(null)}
          onConfirm={handleReturnConfirm}
          employeeName={returnItem.employee.name}
          weekRange={`${returnItem.week_start_date} - ${returnItem.week_end_date}`}
          isLoading={isProcessingId === returnItem.id}
        />
      )}

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
    </div>
  );
}
