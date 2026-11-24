import { apiClient } from "./client";
import type { PaginatedResponse } from "./types";
import type {
  EmployeeListItem,
  EmployeeDetailData,
  CreateEmployeePayload,
  EmployeeCreatedResponse,
  UpdateEmployeePayload,
} from "../employees/types";

export interface EmployeeListParams {
  search?: string;
  role?: string;
  status?: string;
  ordering?: string;
  page?: number;
}

export async function fetchEmployees(
  params?: EmployeeListParams
): Promise<PaginatedResponse<EmployeeListItem>> {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.set("search", params.search);
  if (params?.role) queryParams.set("role", params.role);
  if (params?.status) queryParams.set("status", params.status);
  if (params?.ordering) queryParams.set("ordering", params.ordering);
  if (params?.page) queryParams.set("page", String(params.page));

  const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
  return apiClient.get<PaginatedResponse<EmployeeListItem>>(`/api/employees/${query}`);
}

export async function fetchEmployeeDetail(id: number | string): Promise<EmployeeDetailData> {
  return apiClient.get<EmployeeDetailData>(`/api/employees/${id}/`);
}

export async function createEmployee(
  payload: CreateEmployeePayload
): Promise<EmployeeCreatedResponse> {
  return apiClient.post<EmployeeCreatedResponse>("/api/employees/", payload);
}

export async function updateEmployee(
  id: number | string,
  payload: UpdateEmployeePayload
): Promise<EmployeeDetailData> {
  return apiClient.patch<EmployeeDetailData>(`/api/employees/${id}/`, payload);
}

export async function revokeEmployee(
  id: number | string,
  reason: string
): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>(`/api/employees/${id}/revoke/`, { reason });
}

export async function restoreEmployee(
  id: number | string,
  reason: string
): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>(`/api/employees/${id}/restore/`, { reason });
}

export async function resetEmployeePassword(
  id: number | string
): Promise<{ temporary_password: string; message: string }> {
  return apiClient.post<{ temporary_password: string; message: string }>(
    `/api/employees/${id}/reset-password/`
  );
}

export async function superResetAdminPassword(
  employeeId: number
): Promise<{ temporary_password: string; message: string }> {
  return apiClient.post<{ temporary_password: string; message: string }>(
    "/api/employees/recovery/reset-admin-password/",
    { employee_id: employeeId }
  );
}

export async function superRestoreAccount(
  employeeId: number,
  reason: string
): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>(
    "/api/employees/recovery/restore-account/",
    { employee_id: employeeId, reason }
  );
}

export async function superClearLockout(
  identifier: string,
  ipAddress?: string
): Promise<{ message?: string }> {
  return apiClient.post<{ message?: string }>(
    "/api/employees/recovery/clear-lockout/",
    { identifier, ip_address: ipAddress || null }
  );
}
