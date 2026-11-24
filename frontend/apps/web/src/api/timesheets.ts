import { apiClient } from "./client";
import type { TimesheetData } from "../timesheets/types";

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
