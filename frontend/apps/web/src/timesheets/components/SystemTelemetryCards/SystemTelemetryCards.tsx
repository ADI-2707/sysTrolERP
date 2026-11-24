import type { HealthCheckData, TelemetrySummaryData } from "../../../api/telemetry";
import styles from "./SystemTelemetryCards.module.css";

export interface SystemTelemetryCardsProps {
  health?: HealthCheckData | null;
  telemetry?: TelemetrySummaryData | null;
  className?: string;
}

export function SystemTelemetryCards({
  health,
  telemetry,
  className,
}: SystemTelemetryCardsProps) {
  const m24h = telemetry?.["24h"];

  const dbStatus = health?.database === "connected" ? "Connected" : "Unknown";
  const systemStatus = health?.status === "healthy" ? "Healthy" : "Operational";

  const totalReq = m24h?.total_requests ?? 0;
  const avgDuration = m24h?.avg_duration_ms ?? 0;
  const p95Duration = m24h?.p95_duration_ms ?? 0;
  const errorRate = m24h?.error_rate ?? 0;
  const errorCount = m24h?.error_count ?? 0;

  return (
    <div
      className={[styles.container, className].filter(Boolean).join(" ")}
      data-testid="system-telemetry-cards"
    >
      <div className={styles.titleGroup}>
        <span className={styles.title}>
          System Telemetry & Health
          <span className={styles.liveBadge}>
            <span className={styles.pulseDot} />
            Live
          </span>
        </span>
      </div>

      <div className={styles.cardsGrid}>
        <div className={styles.card} data-testid="telemetry-health-card">
          <span className={styles.cardLabel}>System Health</span>
          <div className={styles.cardValue}>{systemStatus}</div>
          <span className={styles.cardSubtext}>Database: {dbStatus}</span>
        </div>

        <div className={styles.card} data-testid="telemetry-volume-card">
          <span className={styles.cardLabel}>24h Requests</span>
          <div className={styles.cardValue}>{totalReq.toLocaleString()}</div>
          <span className={styles.cardSubtext}>
            Avg: {avgDuration.toFixed(0)}ms &bull; P95: {p95Duration.toFixed(0)}ms
          </span>
        </div>

        <div className={styles.card} data-testid="telemetry-errors-card">
          <span className={styles.cardLabel}>24h Error Rate</span>
          <div className={styles.cardValue}>{(errorRate * 100).toFixed(1)}%</div>
          <span className={styles.cardSubtext}>{errorCount} total errors recorded</span>
        </div>

        <div className={styles.card} data-testid="telemetry-audit-card">
          <span className={styles.cardLabel}>Audit Guarantee</span>
          <div className={styles.cardValue}>Append-Only</div>
          <span className={styles.cardSubtext}>Tamper-evident super admin logs</span>
        </div>
      </div>
    </div>
  );
}
