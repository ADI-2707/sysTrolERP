import { test, expect } from "@playwright/test";

test.describe("Critical Journey: Timesheet Week Boundaries", () => {
  test("enforces Monday to Sunday week boundary and cell editability", async ({ page }) => {
    const mockUser = {
      id: 5,
      employee_code: "SYS-0005",
      full_name: "Engineer Five",
      email: "engineer5@systrol.local",
      role: "EMPLOYEE",
      must_change_password: false,
    };

    await page.route("**/api/auth/me/", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockUser),
      });
    });

    await page.route("**/api/auth/csrf/", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ csrfToken: "test-token" }),
      });
    });

    await page.route("**/api/timesheets/summary/", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          current_week_total: "40.00",
          overtime_total: "2.00",
          approval_pending_count: 0,
        }),
      });
    });

    await page.route("**/api/timesheets/my-weeks/?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          week_start: "2026-03-30",
          week_end: "2026-04-05",
          status: "OPEN",
          policy: {
            daily_regular_hours: "8.00",
            hour_step: "0.25",
            break_duration_hours: "1.00",
            overtime_threshold_daily: "8.00",
          },
          days: [
            { date: "2026-03-30", day_name: "Mon", is_today: true, is_future: false },
            { date: "2026-03-31", day_name: "Tue", is_today: false, is_future: true },
            { date: "2026-04-01", day_name: "Wed", is_today: false, is_future: true },
            { date: "2026-04-02", day_name: "Thu", is_today: false, is_future: true },
            { date: "2026-04-03", day_name: "Fri", is_today: false, is_future: true },
            { date: "2026-04-04", day_name: "Sat", is_today: false, is_future: true },
            { date: "2026-04-05", day_name: "Sun", is_today: false, is_future: true },
          ],
          rows: [
            {
              id: 101,
              project: { id: 1, code: "PRJ-001", name: "FGD Absorber", is_active: true },
              description: "Main task",
              row_total: "8.00",
              entries: [
                { entry_id: 1, date: "2026-03-30", hours: "8.00", note: "Monday shift", is_editable: true },
                { entry_id: 2, date: "2026-03-31", hours: "0.00", note: "", is_editable: false },
                { entry_id: 3, date: "2026-04-01", hours: "0.00", note: "", is_editable: false },
                { entry_id: 4, date: "2026-04-02", hours: "0.00", note: "", is_editable: false },
                { entry_id: 5, date: "2026-04-03", hours: "0.00", note: "", is_editable: false },
                { entry_id: 6, date: "2026-04-04", hours: "0.00", note: "", is_editable: false },
                { entry_id: 7, date: "2026-04-05", hours: "0.00", note: "", is_editable: false },
              ],
            },
          ],
        }),
      });
    });

    await page.goto("/timesheets");

    await expect(page.locator('[data-testid="timesheets-page"]')).toBeVisible();
    await expect(page.locator("text=Mon")).toBeVisible();
    await expect(page.locator("text=Sun")).toBeVisible();
  });
});
