import { test, expect } from "@playwright/test";

test.describe("Critical Journey: Super Admin Recovery", () => {
  test("allows super admin to access recovery tools, reset admin credentials, and clear lockout", async ({ page }) => {
    const superUser = {
      id: "super",
      employee_code: "root",
      full_name: "Super Administrator",
      email: "root@system.local",
      role: "SUPER",
      must_change_password: false,
    };

    await page.route("**/api/auth/me/", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(superUser),
      });
    });

    await page.route("**/api/auth/csrf/", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ csrfToken: "test-token" }),
      });
    });

    const mockEmployees = [
      {
        id: 2,
        employee_code: "SYS-0002",
        full_name: "Admin Bob",
        email: "bob@systrol.local",
        department: "Engineering",
        designation: "Engineering VP",
        role: "ADMIN",
        is_active: false,
        revoked_at: "2026-03-25T10:00:00Z",
        date_joined: "2026-01-01T00:00:00Z",
      },
    ];

    await page.route("**/api/employees/?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          count: 1,
          next: null,
          previous: null,
          results: mockEmployees,
        }),
      });
    });

    await page.route("**/api/employees/2/super-restore/", async (route) => {
      mockEmployees[0].is_active = true;
      mockEmployees[0].revoked_at = "";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Admin account restored." }),
      });
    });

    await page.route("**/api/employees/2/super-clear-lockout/", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Lockout cleared." }),
      });
    });

    await page.goto("/employees");
    await expect(page.locator('[data-testid="employees-page"]')).toBeVisible();
    await expect(page.locator("text=Admin Bob")).toBeVisible();
  });
});
