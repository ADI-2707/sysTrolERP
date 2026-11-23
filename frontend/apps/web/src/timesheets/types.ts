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
  daily_regular_hours: string;
  hour_step: string;
  break_duration_hours: string;
  overtime_threshold_daily: string;
}

export interface AssignedProject {
  id: number;
  code: string;
  name: string;
  slug?: string;
  is_active: boolean;
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
}
