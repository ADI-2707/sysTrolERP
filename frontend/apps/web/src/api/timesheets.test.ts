import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "./client";
import { fetchAdminTimesheetDetail } from "./timesheets";

describe("timesheets API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches admin timesheet detail with employee and week parameters", async () => {
    const mockDetail = {
      id: 10,
      employee: {
        id: 1,
        code: "EMP-001",
        name: "Jane Doe",
      },
      week_start_date: "2026-11-23",
      week_end_date: "2026-11-29",
      status: "SUBMITTED",
      can_approve: true,
      can_return: true,
      return_reason: null,
      submitted_at: "2026-11-27T10:00:00Z",
      approved_at: null,
      approved_by_label: null,
      returned_at: null,
      returned_by_label: null,
      days: ["2026-11-23"],
      day_totals: { "2026-11-23": "8.00" },
      day_regular: { "2026-11-23": "8.00" },
      day_overtime: { "2026-11-23": "0.00" },
      total_week_hours: "8.00",
      total_regular_hours: "8.00",
      total_overtime_hours: "0.00",
      rows: [],
    };

    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue(mockDetail);

    const result = await fetchAdminTimesheetDetail("EMP-001", "2026-11-23");

    expect(getSpy).toHaveBeenCalledWith("/api/timesheets/?employee=EMP-001&week=2026-11-23");
    expect(result).toEqual(mockDetail);
  });
});
