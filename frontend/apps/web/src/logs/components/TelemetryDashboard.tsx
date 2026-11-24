import { useState, useEffect, useCallback } from "react";
import { Button, Spinner, Badge, Sparkline, LineChart, BarChart } from "@systrol/ui";
import { fetchTelemetrySummary } from "../../api/logs";
import type { TelemetrySummaryData } from "../types";
import styles from "./TelemetryDashboard.module.css";

export type TimeWindowKey = "1h" | "24h" | "7d";

export function TelemetryDashboard() {
  const [timeRange, setTimeRange] = useState<TimeWindowKey>("24h");
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [summary, setSummary] = useState<TelemetrySummaryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchTelemetrySummary();
      setSummary(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Failed to load telemetry summary.");
      }
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = window.setInterval(() => {
      loadData(false);
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  if (isLoading && !summary) {
    return (
      <div className={styles.spinnerContainer} data-testid="telemetry-loading">
        <Spinner size="lg" />
      </div>
    );
  }

  if (errorMsg && !summary) {
    return (
      <div className={styles.errorAlert} role="alert" data-testid="telemetry-error">
        <span>{errorMsg}</span>
        <Button size="sm" variant="secondary" onClick={() => loadData(true)}>
          Retry
        </Button>
      </div>
    );
  }

  const current = summary ? summary[timeRange] : null;
  const errorRate = current
    ? ((current.error_count / Math.max(1, current.total_requests)) * 100).toFixed(2)
    : "0.00";

  const requestVolumeData = summary
    ? [
        { label: "1h", value: summary["1h"].total_requests },
        { label: "24h", value: summary["24h"].total_requests },
        { label: "7d", value: summary["7d"].total_requests },
      ]
    : [];

  const errorVolumeData = summary
    ? [
        { label: "1h", value: summary["1h"].error_count, color: "#ef4444" },
        { label: "24h", value: summary["24h"].error_count, color: "#ef4444" },
        { label: "7d", value: summary["7d"].error_count, color: "#ef4444" },
      ]
    : [];

  const latencyTrendData = summary
    ? [
        { label: "1h Avg", value: summary["1h"].avg_duration_ms },
        { label: "1h P95", value: summary["1h"].p95_duration_ms },
        { label: "24h Avg", value: summary["24h"].avg_duration_ms },
        { label: "24h P95", value: summary["24h"].p95_duration_ms },
        { label: "7d Avg", value: summary["7d"].avg_duration_ms },
        { label: "7d P95", value: summary["7d"].p95_duration_ms },
      ]
    : [];

  return (
    <div className={styles.container} data-testid="telemetry-dashboard">
      <div className={styles.topBar}>
        <div className={styles.rangeButtonGroup} role="group" aria-label="Time window selector">
          <button
            type="button"
            className={[styles.rangeBtn, timeRange === "1h" && styles.rangeBtnActive]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setTimeRange("1h")}
            data-testid="range-btn-1h"
          >
            1 Hour
          </button>
          <button
            type="button"
            className={[styles.rangeBtn, timeRange === "24h" && styles.rangeBtnActive]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setTimeRange("24h")}
            data-testid="range-btn-24h"
          >
            24 Hours
          </button>
          <button
            type="button"
            className={[styles.rangeBtn, timeRange === "7d" && styles.rangeBtnActive]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setTimeRange("7d")}
            data-testid="range-btn-7d"
          >
            7 Days
          </button>
        </div>

        <div className={styles.controlsRight}>
          <label className={styles.autoRefreshLabel}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              data-testid="telemetry-auto-refresh-toggle"
            />
            Auto-refresh (30s)
          </label>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => loadData(false)}
            data-testid="telemetry-refresh-btn"
          >
            Refresh
          </Button>
        </div>
      </div>

      {current && (
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard} data-testid="metric-total-requests">
            <div className={styles.cardHeader}>
              <h4 className={styles.cardTitle}>Total Requests</h4>
              <Badge variant="brand">{timeRange.toUpperCase()}</Badge>
            </div>
            <div className={styles.cardMain}>
              <span className={styles.cardValue} data-testid="val-total-requests">
                {current.total_requests.toLocaleString()}
              </span>
              <Sparkline
                data={summary ? [summary["1h"].total_requests, summary["24h"].total_requests, summary["7d"].total_requests] : []}
                width={80}
                height={28}
                fill
              />
            </div>
            <div className={styles.cardSub}>Cumulative requests in window</div>
          </div>

          <div className={styles.metricCard} data-testid="metric-error-rate">
            <div className={styles.cardHeader}>
              <h4 className={styles.cardTitle}>Error Rate</h4>
              <Badge variant={current.error_count > 0 ? "warning" : "success"}>
                {current.error_count > 0 ? "Errors Detected" : "Optimal"}
              </Badge>
            </div>
            <div className={styles.cardMain}>
              <span className={styles.cardValue} data-testid="val-error-rate">
                {errorRate}%
              </span>
              <span className={styles.cardSub} data-testid="val-error-count">
                {current.error_count} errors
              </span>
            </div>
            <div className={styles.cardSub}>Failed HTTP requests / 5xx errors</div>
          </div>

          <div className={styles.metricCard} data-testid="metric-avg-latency">
            <div className={styles.cardHeader}>
              <h4 className={styles.cardTitle}>Avg Latency</h4>
              <Badge variant="info">Response Time</Badge>
            </div>
            <div className={styles.cardMain}>
              <span className={styles.cardValue} data-testid="val-avg-latency">
                {current.avg_duration_ms} ms
              </span>
              <Sparkline
                data={summary ? [summary["1h"].avg_duration_ms, summary["24h"].avg_duration_ms, summary["7d"].avg_duration_ms] : []}
                color="#2563eb"
                width={80}
                height={28}
              />
            </div>
            <div className={styles.cardSub}>Mean server processing time</div>
          </div>

          <div className={styles.metricCard} data-testid="metric-p95-latency">
            <div className={styles.cardHeader}>
              <h4 className={styles.cardTitle}>P95 Latency</h4>
              <Badge variant="default">95th Percentile</Badge>
            </div>
            <div className={styles.cardMain}>
              <span className={styles.cardValue} data-testid="val-p95-latency">
                {current.p95_duration_ms} ms
              </span>
              <Sparkline
                data={summary ? [summary["1h"].p95_duration_ms, summary["24h"].p95_duration_ms, summary["7d"].p95_duration_ms] : []}
                color="#64748b"
                width={80}
                height={28}
              />
            </div>
            <div className={styles.cardSub}>Worst 5% request latency</div>
          </div>
        </div>
      )}

      {summary && (
        <div className={styles.chartsSection}>
          <div className={styles.chartCard} data-testid="requests-volume-chart">
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>Request Volume by Window</h3>
              <span className={styles.chartSubtitle}>Total HTTP requests</span>
            </div>
            <BarChart
              data={requestVolumeData}
              height={180}
              showValues
              unit=" req"
              ariaLabel="Requests volume chart"
            />
          </div>

          <div className={styles.chartCard} data-testid="errors-volume-chart">
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>Error Volume by Window</h3>
              <span className={styles.chartSubtitle}>Total exceptions & 5xx</span>
            </div>
            <BarChart
              data={errorVolumeData}
              height={180}
              showValues
              unit=" err"
              ariaLabel="Errors volume chart"
            />
          </div>

          <div className={styles.chartCard} style={{ gridColumn: "1 / -1" }} data-testid="latency-trend-chart">
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>Latency Overview (Avg vs P95)</h3>
              <span className={styles.chartSubtitle}>Milliseconds response duration</span>
            </div>
            <LineChart
              data={latencyTrendData}
              height={220}
              unit=" ms"
              color="#16a34a"
              ariaLabel="Latency profile chart"
            />
          </div>
        </div>
      )}
    </div>
  );
}
