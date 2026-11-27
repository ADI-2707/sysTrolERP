import { useState, useEffect, useCallback } from "react";
import { Drawer, Badge, Button, Spinner } from "@systrol/ui";
import { fetchAdminTimesheetDetail } from "../../../api/timesheets";
import type { TeamTimesheetItem, AdminTimesheetDetailData } from "../../types";
import { getDayLabel, formatWeekDisplay } from "../../utils/dateUtils";
import styles from "./TimesheetReviewDrawer.module.css";

export interface TimesheetReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  timesheetItem: TeamTimesheetItem | null;
  onApprove: (id: number) => Promise<void> | void;
  onReturn: (id: number, reason: string) => Promise<void> | void;
  isSuper?: boolean;
  isProcessing?: boolean;
}

export function TimesheetReviewDrawer({
  isOpen,
  onClose,
  timesheetItem,
  onApprove,
  onReturn,
  isSuper = false,
  isProcessing = false,
}: TimesheetReviewDrawerProps) {
  const [detail, setDetail] = useState<AdminTimesheetDetailData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [returnMode, setReturnMode] = useState<boolean>(false);
  const [returnReason, setReturnReason] = useState<string>("");

  const loadDetail = useCallback(async (item: TeamTimesheetItem) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAdminTimesheetDetail(item.employee.code, item.week_start_date);
      setDetail(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load timesheet details.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && timesheetItem) {
      setReturnMode(false);
      setReturnReason("");
      loadDetail(timesheetItem);
    } else {
      setDetail(null);
      setError(null);
      setReturnMode(false);
      setReturnReason("");
    }
  }, [isOpen, timesheetItem, loadDetail]);

  const handleConfirmReturn = async () => {
    if (!timesheetItem || !returnReason.trim()) return;
    await onReturn(timesheetItem.id, returnReason.trim());
    setReturnMode(false);
    setReturnReason("");
    onClose();
  };

  const handleApprove = async () => {
    if (!timesheetItem) return;
    await onApprove(timesheetItem.id);
    onClose();
  };

  const status = timesheetItem?.status || detail?.status || "OPEN";
  const canApprove = timesheetItem?.can_approve ?? detail?.can_approve ?? false;
  const days = detail?.days || [];

  const notesList: Array<{ project: string; date: string; note: string }> = [];
  if (detail?.rows) {
    for (const r of detail.rows) {
      if (r.description) {
        notesList.push({
          project: `${r.project.code} - ${r.project.name}`,
          date: "General Project Task",
          note: r.description,
        });
      }
      for (const e of r.entries) {
        if (e.note) {
          notesList.push({
            project: `${r.project.code} - ${r.project.name}`,
            date: e.date,
            note: e.note,
          });
        }
      }
    }
  }

  const weekDisplay = timesheetItem
    ? formatWeekDisplay(timesheetItem.week_start_date, timesheetItem.week_end_date)
    : "";

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={timesheetItem ? `Timesheet Review: ${timesheetItem.employee.name}` : "Timesheet Review"}
      side="right"
      size="lg"
    >
      <div className={styles.container} data-testid="timesheet-review-drawer">
        {isLoading && (
          <div className={styles.loadingState} data-testid="drawer-loading-indicator">
            <Spinner size="lg" />
            <span>Loading timesheet details...</span>
          </div>
        )}

        {error && (
          <div role="alert" className={styles.errorAlert} data-testid="drawer-error-alert">
            <span>{error}</span>
            {timesheetItem && (
              <Button size="sm" variant="secondary" onClick={() => loadDetail(timesheetItem)}>
                Retry
              </Button>
            )}
          </div>
        )}

        {!isLoading && timesheetItem && (
          <>
            <div className={styles.headerSection}>
              <div className={styles.nameRow}>
                <h3 className={styles.employeeName} data-testid="drawer-employee-name">
                  {timesheetItem.employee.name}
                </h3>
                <div className={styles.badgeGroup}>
                  <Badge variant="brand">{status}</Badge>
                </div>
              </div>

              <div className={styles.subMeta}>
                <span className={styles.codeBadge} data-testid="drawer-employee-code">
                  {timesheetItem.employee.code}
                </span>
                {timesheetItem.employee.department && (
                  <span>{timesheetItem.employee.department}</span>
                )}
                {timesheetItem.employee.designation && (
                  <span>&bull; {timesheetItem.employee.designation}</span>
                )}
                <span>&bull; {weekDisplay}</span>
              </div>

              <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Total Hours</span>
                  <span className={styles.metricValue} data-testid="drawer-total-hours">
                    {parseFloat(detail?.total_week_hours || timesheetItem.total_hours || "0").toFixed(1)}h
                  </span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Regular Hours</span>
                  <span className={styles.metricValue}>
                    {parseFloat(detail?.total_regular_hours || timesheetItem.total_hours || "0").toFixed(1)}h
                  </span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Overtime Hours</span>
                  <span className={styles.metricValue}>
                    {parseFloat(detail?.total_overtime_hours || "0").toFixed(1)}h
                  </span>
                </div>
              </div>
            </div>

            {detail && detail.rows && (
              <div className={styles.section}>
                <h4 className={styles.sectionTitle}>Daily Breakdown</h4>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={[styles.th, styles.thProject].join(" ")}>Project</th>
                        {days.map((d) => {
                          const label = getDayLabel(d);
                          return (
                            <th key={d} className={styles.th}>
                              {label.formatted}
                            </th>
                          );
                        })}
                        <th className={[styles.th, styles.thTotal].join(" ")}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.rows.length === 0 ? (
                        <tr>
                          <td colSpan={days.length + 2} className={styles.td}>
                            No project hours logged for this week.
                          </td>
                        </tr>
                      ) : (
                        detail.rows.map((r) => (
                          <tr key={r.id}>
                            <td className={[styles.td, styles.tdProject].join(" ")}>
                              <div className={styles.projectCell}>
                                <span className={styles.projectCode}>{r.project.code}</span>
                                <span className={styles.projectName}>{r.project.name}</span>
                              </div>
                            </td>
                            {days.map((d) => {
                              const entry = r.entries.find((e) => e.date === d);
                              const h = entry ? parseFloat(entry.hours || "0") : 0;
                              return (
                                <td key={d} className={styles.td}>
                                  {h > 0 ? `${h.toFixed(1)}h` : "—"}
                                </td>
                              );
                            })}
                            <td className={[styles.td, styles.tdTotal].join(" ")}>
                              {parseFloat(r.row_total || "0").toFixed(1)}h
                            </td>
                          </tr>
                        ))
                      )}
                      {detail.rows.length > 0 && (
                        <tr className={styles.totalRow}>
                          <td className={[styles.td, styles.tdProject].join(" ")}>
                            Daily Totals
                          </td>
                          {days.map((d) => {
                            const tot = detail.day_totals?.[d] || "0";
                            return (
                              <td key={d} className={styles.td}>
                                {parseFloat(tot).toFixed(1)}h
                              </td>
                            );
                          })}
                          <td className={[styles.td, styles.tdTotal].join(" ")}>
                            {parseFloat(detail.total_week_hours || "0").toFixed(1)}h
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {notesList.length > 0 && (
              <div className={styles.section}>
                <h4 className={styles.sectionTitle}>Task Descriptions & Notes</h4>
                {notesList.map((n, i) => (
                  <div key={i} className={styles.notesCard} data-testid={`drawer-note-${i}`}>
                    <div className={styles.noteHeader}>
                      <span className={styles.noteProject}>{n.project}</span>
                      <span>&bull;</span>
                      <span>{n.date}</span>
                    </div>
                    <p className={styles.noteBody}>{n.note}</p>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.footerSection}>
              {status === "SUBMITTED" && (
                <>
                  {returnMode ? (
                    <div className={styles.returnForm}>
                      <textarea
                        className={styles.textarea}
                        placeholder="Provide details on why this timesheet is being returned..."
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                        data-testid="drawer-return-reason-input"
                      />
                      <div className={styles.returnActions}>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={isProcessing}
                          onClick={() => setReturnMode(false)}
                          data-testid="drawer-cancel-return-btn"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          loading={isProcessing}
                          disabled={!returnReason.trim() || isProcessing}
                          onClick={handleConfirmReturn}
                          data-testid="drawer-confirm-return-btn"
                        >
                          Confirm Return
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.actionsRow}>
                      {!canApprove && !isSuper && (
                        <span className={styles.ownNotice} data-testid="drawer-own-timesheet-notice">
                          Own timesheet - approval disabled
                        </span>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!canApprove || isProcessing}
                        onClick={() => setReturnMode(true)}
                        data-testid="drawer-return-btn"
                      >
                        Return
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        loading={isProcessing}
                        disabled={!canApprove || isProcessing}
                        onClick={handleApprove}
                        data-testid="drawer-approve-btn"
                      >
                        Approve
                      </Button>
                    </div>
                  )}
                </>
              )}

              {status === "APPROVED" && (
                <div className={styles.statusNotice} data-testid="drawer-approved-notice">
                  Timesheet approved by {detail?.approved_by_label || timesheetItem.approved_by_label || "Admin"}.
                </div>
              )}

              {status === "RETURNED" && (
                <div className={styles.statusNotice} data-testid="drawer-returned-notice">
                  Returned for revision: {detail?.return_reason || timesheetItem.return_reason || "Correction requested."}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
}
