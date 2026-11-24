export type EmployeeRole = "ADMIN" | "EMPLOYEE";
export type EmployeeStatusFilter = "all" | "active" | "revoked";

export interface EmployeeListItem {
  id: number;
  employee_code: string;
  email: string;
  full_name: string;
  phone: string;
  designation: string;
  department: string;
  role: EmployeeRole;
  is_active: boolean;
  must_change_password: boolean;
  revoked_at: string | null;
  date_joined: string;
  last_login: string | null;
}

export interface EmployeeAssignedProject {
  project_id: number;
  code: string;
  name: string;
}

export interface EmployeeRecentActivity {
  id: number;
  action: string;
  summary: string;
  created_at: string;
}

export interface EmployeeDetailData {
  id: number;
  employee_code: string;
  email: string;
  full_name: string;
  phone: string;
  designation: string;
  department: string;
  role: EmployeeRole;
  is_active: boolean;
  must_change_password: boolean;
  revoked_at: string | null;
  revoked_by: number | null;
  date_joined: string;
  last_login: string | null;
  assigned_projects: EmployeeAssignedProject[];
  recent_activity: EmployeeRecentActivity[];
}

export interface CreateEmployeePayload {
  email: string;
  full_name: string;
  phone?: string;
  designation?: string;
  department?: string;
  role?: EmployeeRole;
}

export interface EmployeeCreatedResponse {
  id: number;
  employee_code: string;
  email: string;
  full_name: string;
  phone: string;
  designation: string;
  department: string;
  role: EmployeeRole;
  temporary_password: string;
  must_change_password: boolean;
  date_joined: string;
}

export interface UpdateEmployeePayload {
  email?: string;
  full_name?: string;
  phone?: string;
  designation?: string;
  department?: string;
}
