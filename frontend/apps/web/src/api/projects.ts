import { apiClient } from "./client";
import type { PaginatedResponse } from "./types";
import type {
  ProjectListItem,
  AssignmentMatrixData,
} from "../projects/types";

export interface ProjectListParams {
  search?: string;
  status?: string;
  is_active?: boolean;
  page?: number;
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

export async function fetchAssignmentMatrix(): Promise<AssignmentMatrixData> {
  return apiClient.get<AssignmentMatrixData>("/api/projects/matrix/");
}
