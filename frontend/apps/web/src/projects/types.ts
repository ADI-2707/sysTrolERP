export type StepStatusType = "NOT_STARTED" | "INITIATED" | "IN_PROGRESS" | "COMPLETED";

export interface ProjectCurrentStep {
  id: number;
  key: string;
  name: string;
  status: StepStatusType;
  position: number;
}

export interface ProjectMember {
  id: number;
  employee_code: string;
  full_name: string;
}

export interface ProjectListItem {
  id: number;
  code: string;
  name: string;
  slug: string;
  client_name: string;
  description: string;
  is_active: boolean;
  status: string;
  total_steps: number;
  completed_steps: number;
  completion_percentage: number;
  current_step: ProjectCurrentStep | null;
  member_count: number;
  members: ProjectMember[];
  created_by_label: string | null;
  created_at: string;
}

export interface ProjectStepDetail {
  id: number;
  key: string;
  name: string;
  position: number;
  is_custom: boolean;
  status: StepStatusType;
  confirmed_at: string | null;
  confirmed_by_label: string | null;
}

export interface ProjectMemberDetail {
  id: number;
  employee_code: string;
  full_name: string;
  designation?: string;
  department?: string;
}

export interface ProjectCreator {
  id: number | null;
  employee_code: string | null;
  full_name: string | null;
}

export interface ProjectDetailData {
  id: number;
  code: string;
  name: string;
  slug: string;
  client_name: string;
  description: string;
  is_active: boolean;
  status: string;
  creator: ProjectCreator | null;
  created_at: string;
  completion_percentage: number;
  total_steps: number;
  completed_steps: number;
  steps: ProjectStepDetail[];
  members: ProjectMemberDetail[];
}

export interface AssignmentMatrixEmployee {
  id: number;
  code: string;
  name: string;
}

export interface AssignmentMatrixProject {
  id: number;
  code: string;
  slug: string;
  name: string;
}

export interface AssignmentMatrixItem {
  project_id: number;
  employee_id: number;
}

export interface AssignmentMatrixData {
  employees: AssignmentMatrixEmployee[];
  projects: AssignmentMatrixProject[];
  assignments: AssignmentMatrixItem[];
}
