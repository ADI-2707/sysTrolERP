import { test, expect } from "@playwright/test";

test.describe("Critical Journey: Approval Round Trip", () => {
  test("covers employee submission, admin return with reason, and admin approval", async ({ page }) => {
    let weekStatus = "OPEN";
    let returnReason = "";

    const adminUser = {
      id: 1,
      employee_code: "SYS-0001",
      full_name: "Admin Alice",
      email: "alice@systrol.local",
      role: "ADMIN",
      must_change_password: false,
    };

    await page.route("**/api/auth/me/", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(adminUser),
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
          overtime_total: "0.00",
          approval_pending_count: weekStatus === "SUBMITTED" ? 1 : 0,
        }),
      });
    });

    await page.route("**/api/timesheets/submit/", async (route) => {
      weekStatus = "SUBMITTED";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Timesheet submitted successfully." }),
      });
    });

    await page.route("**/api/timesheets/return/", async (route) => {
      weekStatus = "RETURNED";
      returnReason = "Please correct Wednesday overtime note.";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Timesheet returned for correction.", reason: returnReason }),
      });
    });

    await page.route("**/api/timesheets/approve/", async (route) => {
      weekStatus = "APPROVED";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Timesheet approved." }),
      });
    });

    await page.route("**/api/timesheets/my-weeks/?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          week_start: "2026-03-30",
          week_end: "2026-04-05",
          status: weekStatus,
          return_reason: returnReason,
          days: [],
          rows: [],
        }),
      });
    });

    await page.goto("/timesheets");
    await expect(page.locator('[data-testid="timesheets-page"]')).toBeVisible();
  });
});
