import { apiClient } from "./client";
import type {
  AuditLogItem,
  RequestLogItem,
  ErrorLogItem,
  TelemetrySummaryData,
  CursorPaginatedResponse,
} from "../logs/types";

export interface AuditLogQueryParams {
  action?: string;
  actor?: string;
  entity_type?: string;
  entity_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  cursor?: string;
}

export interface RequestLogQueryParams {
  status_code?: string;
  method?: string;
  search?: string;
  cursor?: string;
}

export interface ErrorLogQueryParams {
  error_class?: string;
  search?: string;
  cursor?: string;
}

export async function fetchAuditLogs(
  params?: AuditLogQueryParams
): Promise<CursorPaginatedResponse<AuditLogItem>> {
  const q = new URLSearchParams();
  if (params?.action) q.set("action", params.action);
  if (params?.actor) q.set("actor", params.actor);
  if (params?.entity_type) q.set("entity_type", params.entity_type);
  if (params?.entity_id) q.set("entity_id", params.entity_id);
  if (params?.start_date) q.set("start_date", params.start_date);
  if (params?.end_date) q.set("end_date", params.end_date);
  if (params?.search) q.set("search", params.search);
  if (params?.cursor) q.set("cursor", params.cursor);

  const query = q.toString() ? `?${q.toString()}` : "";
  return apiClient.get<CursorPaginatedResponse<AuditLogItem>>(`/api/audit/logs/${query}`);
}

export async function fetchRequestLogs(
  params?: RequestLogQueryParams
): Promise<CursorPaginatedResponse<RequestLogItem>> {
  const q = new URLSearchParams();
  if (params?.status_code) q.set("status_code", params.status_code);
  if (params?.method) q.set("method", params.method);
  if (params?.search) q.set("search", params.search);
  if (params?.cursor) q.set("cursor", params.cursor);

  const query = q.toString() ? `?${q.toString()}` : "";
  return apiClient.get<CursorPaginatedResponse<RequestLogItem>>(`/api/telemetry/requests/${query}`);
}

export async function fetchErrorLogs(
  params?: ErrorLogQueryParams
): Promise<CursorPaginatedResponse<ErrorLogItem>> {
  const q = new URLSearchParams();
  if (params?.error_class) q.set("error_class", params.error_class);
  if (params?.search) q.set("search", params.search);
  if (params?.cursor) q.set("cursor", params.cursor);

  const query = q.toString() ? `?${q.toString()}` : "";
  return apiClient.get<CursorPaginatedResponse<ErrorLogItem>>(`/api/telemetry/errors/${query}`);
}

export async function fetchTelemetrySummary(): Promise<TelemetrySummaryData> {
  return apiClient.get<TelemetrySummaryData>("/api/telemetry/summary/");
}

export function getAuditLogExportUrl(params?: AuditLogQueryParams, gzip = false): string {
  const q = new URLSearchParams();
  if (params?.action) q.set("action", params.action);
  if (params?.actor) q.set("actor", params.actor);
  if (params?.entity_type) q.set("entity_type", params.entity_type);
  if (params?.entity_id) q.set("entity_id", params.entity_id);
  if (params?.start_date) q.set("start_date", params.start_date);
  if (params?.end_date) q.set("end_date", params.end_date);
  if (params?.search) q.set("search", params.search);
  if (gzip) q.set("gzip", "true");

  const query = q.toString() ? `?${q.toString()}` : "";
  return `/api/audit/logs/export/${query}`;
}
