export interface AuditLogActor {
  id: number;
  code: string;
  name: string;
}

export interface AuditLogItem {
  id: number;
  actor_kind: "USER" | "SUPER" | "SYSTEM" | string;
  actor_label: string;
  actor_user: AuditLogActor | null;
  action: string;
  entity_type: string;
  entity_id: string;
  summary: string;
  changes: Record<string, [unknown, unknown]> | null;
  ip_address: string | null;
  user_agent: string;
  request_id: string;
  super_only: boolean;
  created_at: string;
}

export interface RequestLogItem {
  id: number;
  method: string;
  route_template: string;
  path: string;
  status_code: number;
  duration_ms: number;
  actor_label: string;
  ip_address: string | null;
  response_size_bytes: number;
  request_id: string;
  created_at: string;
}

export interface ErrorLogItem {
  id: number;
  error_class: string;
  message: string;
  trace: string;
  request_id: string;
  path: string;
  method: string;
  actor_label: string;
  created_at: string;
}

export interface TelemetrySummaryMetrics {
  total_requests: number;
  error_count: number;
  avg_duration_ms: number;
  p95_duration_ms: number;
}

export interface TelemetrySummaryData {
  "1h": TelemetrySummaryMetrics;
  "24h": TelemetrySummaryMetrics;
  "7d": TelemetrySummaryMetrics;
}

export interface CursorPaginatedResponse<T> {
  next: string | null;
  previous: string | null;
  results: T[];
}

export type LogsTabKey = "audit" | "requests" | "errors" | "auth" | "telemetry";
