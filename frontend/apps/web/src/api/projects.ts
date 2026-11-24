import { apiClient } from "./client";
import type { PaginatedResponse } from "./types";
import type {
  ProjectListItem,
  ProjectDetailData,
  ProjectStepDetail,
  StepStatusType,
  AssignmentMatrixData,
} from "../projects/types";

export interface ProjectListParams {
  search?: string;
  status?: string;
  is_active?: boolean;
  page?: number;
}

export interface CreateProjectPayload {
  name: string;
  client_name?: string;
  description?: string;
  member_ids?: number[];
}

export interface EmployeeSummary {
  id: number;
  employee_code: string;
  full_name: string;
  designation?: string;
  department?: string;
}

export async function fetchProjects(
  params?: ProjectListParams
): Promise<PaginatedResponse<ProjectListItem>> {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.set("search", params.search);
  if (params?.status) queryParams.set("status", params.status);
  if (params?.is_active !== undefined) queryParams.set("is_active", String(params.is_active));
  if (params?.page) queryParams.set("page", String(params.page));

  const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
  return apiClient.get<PaginatedResponse<ProjectListItem>>(`/api/projects/${query}`);
}

export async function createProject(
  payload: CreateProjectPayload
): Promise<ProjectListItem> {
  return apiClient.post<ProjectListItem>("/api/projects/", payload);
}

export async function fetchActiveEmployees(): Promise<PaginatedResponse<EmployeeSummary>> {
  return apiClient.get<PaginatedResponse<EmployeeSummary>>("/api/employees/?is_active=true");
}

export async function fetchAssignmentMatrix(): Promise<AssignmentMatrixData> {
  return apiClient.get<AssignmentMatrixData>("/api/projects/matrix/");
}

export async function fetchProjectDetail(
  idOrSlug: string | number
): Promise<ProjectDetailData> {
  return apiClient.get<ProjectDetailData>(`/api/projects/${idOrSlug}/`);
}

export async function updateStepStatus(
  projectId: number | string,
  stepId: number | string,
  status: StepStatusType,
  confirm: boolean = false
): Promise<ProjectStepDetail> {
  return apiClient.post<ProjectStepDetail>(
    `/api/projects/${projectId}/steps/${stepId}/status/`,
    { status, confirm }
  );
}
