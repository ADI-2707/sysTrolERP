import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../auth";
import { WeekNavigator } from "../timesheets/components/WeekNavigator";
import { useWeekNavigation } from "../timesheets/hooks/useWeekNavigation";
import { DashboardSummaryCards } from "../timesheets/components/DashboardSummaryCards";
import { TimesheetGrid } from "../timesheets/components/TimesheetGrid";
import { AdminTimesheetTabs } from "../timesheets/components/AdminTimesheetTabs";
import { TeamTimesheetReviewGrid } from "../timesheets/components/TeamTimesheetReviewGrid";
import { SystemTelemetryCards } from "../timesheets/components/SystemTelemetryCards";
import { useTimesheetAutosave } from "../timesheets/hooks/useTimesheetAutosave";
import {
  fetchOwnTimesheet,
  fetchTimesheetSummary,
  fetchTeamTimesheets,
  approveTimesheet,
  returnTimesheet,
  overrideTimesheet,
  createTimesheetRow,
  deleteTimesheetRow,
  submitOwnTimesheet,
} from "../api/timesheets";
import {
  fetchHealthCheck,
  fetchTelemetrySummary,
  type HealthCheckData,
  type TelemetrySummaryData,
} from "../api/telemetry";
import type {
  TimesheetData,
  DashboardSummaryData,
  TeamTimesheetItem,
  TimesheetStatus,
} from "../timesheets/types";
import styles from "./TimesheetsDashboardPage.module.css";

export function TimesheetsDashboardPage() {
  const { isSuperAdmin, isAdmin } = useAuth();
  const isSuper = isSuperAdmin;
  const canReviewTeam = isSuper || isAdmin;

  const [activeTab, setActiveTab] = useState<string>(isSuper ? "team" : "my");
  const {
    monday: currentWeekStart,
    sunday: currentWeekEnd,
    displayRange,
    isCurrent,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
  } = useWeekNavigation();

  const [ownTimesheet, setOwnTimesheet] = useState<TimesheetData | null>(null);
  const [adminSummary, setAdminSummary] = useState<DashboardSummaryData | null>(null);
  const [teamTimesheets, setTeamTimesheets] = useState<TeamTimesheetItem[]>([]);
  const [healthData, setHealthData] = useState<HealthCheckData | null>(null);
  const [telemetryData, setTelemetryData] = useState<TelemetrySummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!isSuper) {
        const tsData = await fetchOwnTimesheet(currentWeekStart);
        setOwnTimesheet(tsData);
      }

      if (canReviewTeam) {
        const [sumData, teamData] = await Promise.all([
          fetchTimesheetSummary(currentWeekStart),
          fetchTeamTimesheets({ week: currentWeekStart }),
        ]);
        setAdminSummary(sumData);
        setTeamTimesheets(teamData.results || []);
      }

      if (isSuper) {
        const [hData, tData] = await Promise.all([
          fetchHealthCheck(),
          fetchTelemetrySummary(),
        ]);
        setHealthData(hData);
        setTelemetryData(tData);
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, [currentWeekStart, isSuper, canReviewTeam]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const dummyTimesheet: TimesheetData = useMemo(
    () => ({
      id: 0,
      week_start_date: currentWeekStart,
      week_end_date: currentWeekStart,
      status: "OPEN",
      can_edit: false,
      can_submit: false,
      return_reason: null,
      submitted_at: null,
      approved_at: null,
      approved_by_label: null,
      returned_at: null,
      returned_by_label: null,
      policy: {
        daily_regular_hours: "8.00",
        hour_step: "0.25",
        break_duration_hours: "1.00",
        overtime_threshold_daily: "8.00",
      },
      days: [],
      day_totals: {},
      day_regular: {},
      day_overtime: {},
      total_week_hours: "0.00",
      total_regular_hours: "0.00",
      total_overtime_hours: "0.00",
      rows: [],
      assigned_projects: [],
    }),
    [currentWeekStart]
  );

  const {
    timesheet: activeTimesheet,
    updateCell,
    cellStatuses,
    globalStatus,
  } = useTimesheetAutosave(ownTimesheet || dummyTimesheet);

  const handleAddRow = async (projectId: number, description: string) => {
    await createTimesheetRow({
      project_id: projectId,
      week: currentWeekStart,
      description,
    });
    await loadData();
  };

  const handleDeleteRow = async (rowId: number) => {
    await deleteTimesheetRow(rowId);
    await loadData();
  };

  const handleSubmitTimesheet = async () => {
    await submitOwnTimesheet(currentWeekStart);
    await loadData();
  };

  const handleApproveTeamTimesheet = async (id: number) => {
    try {
      setProcessingId(id);
      await approveTimesheet(id);
      await loadData();
    } finally {
      setProcessingId(null);
    }
  };

  const handleReturnTeamTimesheet = async (id: number, reason: string) => {
    try {
      setProcessingId(id);
      await returnTimesheet(id, reason);
      await loadData();
    } finally {
      setProcessingId(null);
    }
  };

  const handleOverrideTeamTimesheet = async (
    id: number,
    payload: { reason: string; status: TimesheetStatus }
  ) => {
    try {
      setProcessingId(id);
      await overrideTimesheet(id, payload);
      await loadData();
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className={styles.pageContainer} data-testid="timesheets-dashboard-page">
      <div className={styles.topControls}>
        <div className={styles.sectionHeader}>
          <h1 className={styles.sectionTitle}>Timesheet Dashboard</h1>
          <p className={styles.sectionSubtitle}>
            Track and review project labor hours across weekly schedules.
          </p>
        </div>

        <WeekNavigator
          monday={currentWeekStart}
          sunday={currentWeekEnd}
          displayRange={displayRange}
          isCurrent={isCurrent}
          onPrevious={goToPreviousWeek}
          onNext={goToNextWeek}
          onCurrentWeek={goToCurrentWeek}
        />
      </div>

      {isAdmin && (
        <AdminTimesheetTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingCount={adminSummary?.pending_approval_count || 0}
        />
      )}

      {activeTab === "my" && !isSuper && (
        <div
          role="tabpanel"
          id="tabpanel-my"
          aria-labelledby="tab-my"
          className={styles.tabPanel}
        >
          {ownTimesheet ? (
            <>
              <DashboardSummaryCards timesheet={activeTimesheet} />
              <TimesheetGrid
                timesheet={activeTimesheet}
                onCellChange={(projectId, date, hours) =>
                  updateCell(projectId, date, hours)
                }
                onNoteChange={(projectId, date, note) => {
                  const row = activeTimesheet.rows.find((r) => r.project.id === projectId);
                  const entry = row?.entries.find((e) => e.date === date);
                  const currentHours = entry?.hours || "0.00";
                  updateCell(projectId, date, currentHours, note);
                }}
                onAddRow={handleAddRow}
                onDeleteRow={handleDeleteRow}
                onSubmitTimesheet={handleSubmitTimesheet}
                cellStatuses={cellStatuses}
                globalStatus={globalStatus}
              />
            </>
          ) : (
            <div className={styles.loadingPlaceholder}>
              {isLoading ? "Loading timesheet..." : "No timesheet found."}
            </div>
          )}
        </div>
      )}

      {activeTab === "team" && canReviewTeam && (
        <div
          role="tabpanel"
          id="tabpanel-team"
          aria-labelledby="tab-team"
          className={styles.tabPanel}
        >
          {isSuper && (
            <SystemTelemetryCards health={healthData} telemetry={telemetryData} />
          )}
          {adminSummary && <DashboardSummaryCards adminSummary={adminSummary} />}
          <TeamTimesheetReviewGrid
            timesheets={teamTimesheets}
            onApprove={handleApproveTeamTimesheet}
            onReturn={handleReturnTeamTimesheet}
            onOverride={handleOverrideTeamTimesheet}
            isSuper={isSuper}
            isLoading={isLoading}
            isProcessingId={processingId}
          />
        </div>
      )}
    </div>
  );
}
