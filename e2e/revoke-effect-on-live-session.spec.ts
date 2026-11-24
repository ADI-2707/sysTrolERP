import { test, expect } from "@playwright/test";

test.describe("Critical Journey: Revoke Effect on Live Session", () => {
  test("immediately rejects requests and redirects revoked user to login", async ({ page }) => {
    let isUserRevoked = false;

    await page.route("**/api/auth/me/", async (route) => {
      if (isUserRevoked) {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({
            code: "authentication_failed",
            message: "Account is deactivated or revoked.",
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: 25,
            employee_code: "SYS-0025",
            full_name: "Contractor Dave",
            email: "dave@systrol.local",
            role: "EMPLOYEE",
            must_change_password: false,
          }),
        });
      }
    });

    await page.route("**/api/auth/csrf/", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ csrfToken: "test-token" }),
      });
    });

    await page.route("**/api/timesheets/summary/", async (route) => {
      if (isUserRevoked) {
        await route.fulfill({ status: 401, body: JSON.stringify({ code: "authentication_failed" }) });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ current_week_total: "0.00", overtime_total: "0.00", approval_pending_count: 0 }),
        });
      }
    });

    await page.route("**/api/timesheets/my-weeks/?**", async (route) => {
      if (isUserRevoked) {
        await route.fulfill({ status: 401, body: JSON.stringify({ code: "authentication_failed" }) });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ week_start: "2026-03-30", week_end: "2026-04-05", status: "OPEN", days: [], rows: [] }),
        });
      }
    });

    await page.goto("/timesheets");
    await expect(page.locator("text=Contractor Dave")).toBeVisible();

    isUserRevoked = true;
    await page.reload();

    await expect(page).toHaveURL(/\/login/);
  });
});
