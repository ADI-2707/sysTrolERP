export type TimesheetStatus = "OPEN" | "SUBMITTED" | "APPROVED" | "RETURNED";

export interface TimesheetEntryData {
  entry_id: number | null;
  date: string;
  hours: string;
  note: string;
  is_editable: boolean;
}

export interface TimesheetRowData {
  id: number;
  project: {
    id: number;
    code: string;
    name: string;
    slug?: string;
    is_active: boolean;
  };
  description: string;
  row_total: string;
  entries: TimesheetEntryData[];
}

export interface TimesheetPolicyData {
  standard_start_time?: string;
  standard_end_time?: string;
  daily_regular_hours: string;
  hour_step: string;
  break_duration_hours: string;
  overtime_threshold_daily: string;
  updated_at?: string;
}

export interface AssignedProject {
  id: number;
  code: string;
  name: string;
  slug?: string;
  is_active: boolean;
}

export type ProjectSummary = AssignedProject;

export interface DashboardSummaryData {
  week_start_date: string;
  week_end_date: string;
  active_employees_count: number;
  pending_approval_count: number;
  week_submitted_count: number;
  week_approved_count: number;
  week_open_count: number;
  week_returned_count: number;
  total_hours: string;
  total_regular_hours: string;
  total_overtime_hours: string;
}

export interface TeamTimesheetEmployee {
  id: number | string;
  code: string;
  name: string;
  designation?: string;
  department?: string;
}

export interface TeamTimesheetItem {
  id: number;
  employee: TeamTimesheetEmployee;
  week_start_date: string;
  week_end_date: string;
  status: TimesheetStatus;
  total_hours: string;
  submitted_at: string | null;
  approved_at: string | null;
  approved_by_label: string | null;
  returned_at: string | null;
  returned_by_label: string | null;
  return_reason: string | null;
  can_approve: boolean;
}

export interface TimesheetData {
  id: number;
  week_start_date: string;
  week_end_date: string;
  status: TimesheetStatus;
  can_edit: boolean;
  can_submit: boolean;
  return_reason: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  approved_by_label: string | null;
  returned_at: string | null;
  returned_by_label: string | null;
  policy: TimesheetPolicyData;
  days: string[];
  day_totals: Record<string, string>;
  day_regular: Record<string, string>;
  day_overtime: Record<string, string>;
  total_week_hours: string;
  total_regular_hours: string;
  total_overtime_hours: string;
  rows: TimesheetRowData[];
  assigned_projects: AssignedProject[];
  available_projects?: AssignedProject[];
}
