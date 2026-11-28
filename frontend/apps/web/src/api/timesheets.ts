import { apiClient } from "./client";
import type { PaginatedResponse } from "./types";
import type {
  TimesheetData,
  DashboardSummaryData,
  TeamTimesheetItem,
  AdminTimesheetDetailData,
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

export interface OwnTimesheetHistoryItem {
  id: number;
  week_start_date: string;
  week_end_date: string;
  status: string;
  total_hours: string;
  submitted_at: string | null;
  approved_at: string | null;
  returned_at: string | null;
  return_reason: string;
}

export async function fetchTeamTimesheets(params?: {
  week?: string;
  status?: string;
  employee?: string;
  search?: string;
  department?: string;
  project_id?: number | string;
  all_pending?: boolean;
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<TeamTimesheetItem>> {
  const queryParams = new URLSearchParams();
  if (params?.week) queryParams.set("week", params.week);
  if (params?.status) queryParams.set("status", params.status);
  if (params?.employee) queryParams.set("employee", params.employee);
  if (params?.search) queryParams.set("search", params.search);
  if (params?.department) queryParams.set("department", params.department);
  if (params?.project_id) queryParams.set("project_id", String(params.project_id));
  if (params?.all_pending) queryParams.set("all_pending", "true");
  if (params?.page) queryParams.set("page", String(params.page));
  if (params?.page_size) queryParams.set("page_size", String(params.page_size));

  const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
  return apiClient.get<PaginatedResponse<TeamTimesheetItem>>(`/api/timesheets/${query}`);
}

export async function fetchOwnTimesheetHistory(
  page?: number,
  pageSize?: number
): Promise<PaginatedResponse<OwnTimesheetHistoryItem>> {
  const queryParams = new URLSearchParams();
  if (page) queryParams.set("page", String(page));
  if (pageSize) queryParams.set("page_size", String(pageSize));
  const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
  return apiClient.get<PaginatedResponse<OwnTimesheetHistoryItem>>(`/api/timesheets/me/history/${query}`);
}

export async function fetchPendingTimesheets(): Promise<PaginatedResponse<TeamTimesheetItem>> {
  return apiClient.get<PaginatedResponse<TeamTimesheetItem>>("/api/timesheets/pending/");
}

export async function fetchAdminTimesheetDetail(
  employee: string | number,
  week: string
): Promise<AdminTimesheetDetailData> {
  const queryParams = new URLSearchParams({
    employee: String(employee),
    week,
  });
  return apiClient.get<AdminTimesheetDetailData>(`/api/timesheets/?${queryParams.toString()}`);
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

export interface ExportSiteDiaryParams {
  timesheetId?: number;
  projectId: number;
  format?: "pdf" | "excel";
  startDate?: string;
  endDate?: string;
  employeeId?: number;
}

export async function exportSiteDiary(
  timesheetIdOrParams: number | ExportSiteDiaryParams,
  projectId?: number,
  format: "pdf" | "excel" = "pdf"
): Promise<void> {
  let endpoint = "/api/timesheets/site-diary/";
  const queryParams: Record<string, string | number> = {
    format,
  };

  if (typeof timesheetIdOrParams === "number") {
    endpoint = `/api/timesheets/${timesheetIdOrParams}/site-diary/`;
    if (projectId) {
      queryParams.project_id = projectId;
    }
  } else {
    const p = timesheetIdOrParams;
    if (p.timesheetId && !p.startDate && !p.endDate) {
      endpoint = `/api/timesheets/${p.timesheetId}/site-diary/`;
    }
    queryParams.project_id = p.projectId;
    queryParams.format = p.format || "pdf";
    if (p.startDate) queryParams.start_date = p.startDate;
    if (p.endDate) queryParams.end_date = p.endDate;
    if (p.employeeId) queryParams.employee_id = p.employeeId;
  }

  const { blob, filename } = await apiClient.downloadFile(endpoint, {
    params: queryParams,
  });

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
