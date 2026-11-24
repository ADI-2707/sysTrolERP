import { apiClient } from "./client";

export interface HealthCheckData {
  status: string;
  database: string;
  timestamp: string;
}

export interface WindowTelemetryMetrics {
  total_requests: number;
  error_rate: number;
  avg_duration_ms: number;
  p95_duration_ms: number;
  error_count: number;
}

export interface TelemetrySummaryData {
  "1h": WindowTelemetryMetrics;
  "24h": WindowTelemetryMetrics;
  "7d": WindowTelemetryMetrics;
}

export async function fetchHealthCheck(): Promise<HealthCheckData> {
  return apiClient.get<HealthCheckData>("/api/health/");
}

export async function fetchTelemetrySummary(): Promise<TelemetrySummaryData> {
  return apiClient.get<TelemetrySummaryData>("/api/telemetry/summary/");
}
