import { apiClient } from "./client";
import type { PaginatedResponse } from "./types";
import type {
  TimesheetData,
  DashboardSummaryData,
  TeamTimesheetItem,
} from "../timesheets/types";

export interface UpsertCellPayload {
  project_id: number;
  date: string;
  hours: string;
  note?: string;
}

export async function fetchOwnTimesheet(weekDate?: string): Promise<TimesheetData> {
  const query = weekDate ? `?week=${weekDate}` : "";
  return apiClient.get<TimesheetData>(`/api/timesheets/me/${query}`);
}

export async function fetchTimesheetSummary(weekDate?: string): Promise<DashboardSummaryData> {
  const query = weekDate ? `?week=${weekDate}` : "";
  return apiClient.get<DashboardSummaryData>(`/api/timesheets/summary/${query}`);
}

export async function fetchTeamTimesheets(params?: {
  week?: string;
  status?: string;
  employee?: string;
  page?: number;
}): Promise<PaginatedResponse<TeamTimesheetItem>> {
  const queryParams = new URLSearchParams();
  if (params?.week) queryParams.set("week", params.week);
  if (params?.status) queryParams.set("status", params.status);
  if (params?.employee) queryParams.set("employee", params.employee);
  if (params?.page) queryParams.set("page", String(params.page));

  const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
  return apiClient.get<PaginatedResponse<TeamTimesheetItem>>(`/api/timesheets/${query}`);
}

export async function fetchPendingTimesheets(): Promise<PaginatedResponse<TeamTimesheetItem>> {
  return apiClient.get<PaginatedResponse<TeamTimesheetItem>>("/api/timesheets/pending/");
}

export async function approveTimesheet(timesheetId: number): Promise<unknown> {
  return apiClient.post(`/api/timesheets/${timesheetId}/approve/`, {});
}

export async function returnTimesheet(timesheetId: number, reason: string): Promise<unknown> {
  return apiClient.post(`/api/timesheets/${timesheetId}/return/`, { reason });
}

export async function overrideTimesheet(
  timesheetId: number,
  payload: { reason: string; status?: string; cells?: unknown[] }
): Promise<unknown> {
  return apiClient.put(`/api/timesheets/${timesheetId}/override/`, payload);
}

export async function upsertCell(payload: UpsertCellPayload): Promise<unknown> {
  return apiClient.put("/api/timesheets/me/cells/", payload);
}

export async function createTimesheetRow(payload: {
  project_id: number;
  week?: string;
  description?: string;
}): Promise<unknown> {
  return apiClient.post("/api/timesheets/me/rows/", payload);
}

export async function deleteTimesheetRow(rowId: number): Promise<void> {
  return apiClient.delete(`/api/timesheets/me/rows/${rowId}/`);
}

export async function submitOwnTimesheet(weekDate?: string): Promise<unknown> {
  return apiClient.post("/api/timesheets/me/submit/", { week: weekDate });
}
