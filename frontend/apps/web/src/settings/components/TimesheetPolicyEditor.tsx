import { useState, useEffect, type FormEvent } from "react";
import { Button, FormField, Input, Spinner, useToast } from "@systrol/ui";
import { useAuth } from "../../auth";
import { fetchTimesheetPolicy, updateTimesheetPolicy } from "../../api/timesheetPolicy";
import type { TimesheetPolicyData } from "../../timesheets/types";
import styles from "./TimesheetPolicyEditor.module.css";

export function TimesheetPolicyEditor() {
  const { isSuperAdmin } = useAuth();
  const { addToast } = useToast();

  const [policy, setPolicy] = useState<TimesheetPolicyData | null>(null);
  const [startTime, setStartTime] = useState("09:00:00");
  const [endTime, setEndTime] = useState("18:00:00");
  const [regularHours, setRegularHours] = useState("8.00");
  const [breakHours, setBreakHours] = useState("1.00");
  const [hourStep, setHourStep] = useState("0.25");
  const [overtimeThreshold, setOvertimeThreshold] = useState("8.00");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadPolicy() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await fetchTimesheetPolicy();
        if (isMounted) {
          setPolicy(data);
          setStartTime(data.standard_start_time || "09:00:00");
          setEndTime(data.standard_end_time || "18:00:00");
          setRegularHours(data.daily_regular_hours || "8.00");
          setBreakHours(data.break_duration_hours || "1.00");
          setHourStep(data.hour_step || "0.25");
          setOvertimeThreshold(data.overtime_threshold_daily || "8.00");
        }
      } catch (err: unknown) {
        if (isMounted) {
          if (err instanceof Error) {
            setErrorMessage(err.message);
          } else {
            setErrorMessage("Failed to load timesheet policy.");
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadPolicy();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const updated = await updateTimesheetPolicy({
        standard_start_time: startTime,
        standard_end_time: endTime,
        daily_regular_hours: regularHours,
        break_duration_hours: breakHours,
        hour_step: hourStep,
        overtime_threshold_daily: overtimeThreshold,
      });

      setPolicy(updated);
      addToast({
        type: "success",
        title: "Policy Updated",
        description: "Company timesheet standard hours and rules saved successfully.",
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to update timesheet policy.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.spinnerContainer} data-testid="policy-loading">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={styles.container} data-testid="timesheet-policy-editor">
      <div className={styles.header}>
        <h2 className={styles.title}>Timesheet Standard Policy</h2>
        <p className={styles.subtitle}>
          Define baseline workday hours, break spans, grid rounding increments, and daily overtime thresholds.
        </p>
      </div>

      {!isSuperAdmin && (
        <div className={styles.readOnlyNotice} data-testid="policy-readonly-notice">
          <span>🔒 Timesheet policy configuration is restricted to the Super Administrator.</span>
        </div>
      )}

      {errorMessage && (
        <div role="alert" className={styles.errorAlert} data-testid="policy-error-alert">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <FormField id="policy-start-time" label="Standard Start Time">
            <Input
              id="policy-start-time"
              type="text"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={!isSuperAdmin || isSubmitting}
              data-testid="input-start-time"
              placeholder="09:00:00"
            />
          </FormField>

          <FormField id="policy-end-time" label="Standard End Time">
            <Input
              id="policy-end-time"
              type="text"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={!isSuperAdmin || isSubmitting}
              data-testid="input-end-time"
              placeholder="18:00:00"
            />
          </FormField>

          <FormField id="policy-regular-hours" label="Daily Regular Hours (h)">
            <Input
              id="policy-regular-hours"
              type="number"
              step="0.25"
              value={regularHours}
              onChange={(e) => setRegularHours(e.target.value)}
              disabled={!isSuperAdmin || isSubmitting}
              data-testid="input-regular-hours"
              placeholder="8.00"
            />
          </FormField>

          <FormField id="policy-break-hours" label="Break Duration (h)">
            <Input
              id="policy-break-hours"
              type="number"
              step="0.25"
              value={breakHours}
              onChange={(e) => setBreakHours(e.target.value)}
              disabled={!isSuperAdmin || isSubmitting}
              data-testid="input-break-hours"
              placeholder="1.00"
            />
          </FormField>

          <FormField id="policy-hour-step" label="Hour Step Increment (h)">
            <Input
              id="policy-hour-step"
              type="number"
              step="0.05"
              value={hourStep}
              onChange={(e) => setHourStep(e.target.value)}
              disabled={!isSuperAdmin || isSubmitting}
              data-testid="input-hour-step"
              placeholder="0.25"
            />
          </FormField>

          <FormField id="policy-overtime-threshold" label="Overtime Daily Threshold (h)">
            <Input
              id="policy-overtime-threshold"
              type="number"
              step="0.25"
              value={overtimeThreshold}
              onChange={(e) => setOvertimeThreshold(e.target.value)}
              disabled={!isSuperAdmin || isSubmitting}
              data-testid="input-overtime-threshold"
              placeholder="8.00"
            />
          </FormField>

          <div className={[styles.fullWidth, styles.infoBox].join(" ")} data-testid="policy-summary-callout">
            <span className={styles.infoTitle}>Workday Span Calculation:</span>
            <span>
              A standard {startTime.slice(0, 5)} to {endTime.slice(0, 5)} span represents a 9-hour window comprising {regularHours} regular working hours and {breakHours} hour unpaid meal break. Entries exceeding {overtimeThreshold}h per day are recorded as overtime. Time entry grid precision enforces {hourStep}h intervals.
            </span>
            {policy?.updated_at && (
              <span data-testid="policy-last-updated" style={{ opacity: 0.85, fontSize: "11px" }}>
                Policy last updated: {new Date(policy.updated_at).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {isSuperAdmin && (
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            className={styles.submitBtn}
            data-testid="submit-policy-btn"
          >
            Save Timesheet Policy
          </Button>
        )}
      </form>
    </div>
  );
}
