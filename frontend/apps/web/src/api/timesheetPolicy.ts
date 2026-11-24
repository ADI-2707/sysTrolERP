import { apiClient } from "./client";
import type { TimesheetPolicyData } from "../timesheets/types";

export async function fetchTimesheetPolicy(): Promise<TimesheetPolicyData> {
  return apiClient.get<TimesheetPolicyData>("/api/timesheets/policy/");
}

export async function updateTimesheetPolicy(
  policy: Partial<TimesheetPolicyData>
): Promise<TimesheetPolicyData> {
  return apiClient.put<TimesheetPolicyData>("/api/timesheets/policy/", policy);
}
