import { test, expect } from "@playwright/test";

test.describe("Critical Journey: Login and Forced Password Change", () => {
  test("forces user with must_change_password flag to set new password before accessing dashboard", async ({ page }) => {
    let currentUser = {
      id: 10,
      employee_code: "SYS-0010",
      full_name: "New Hire",
      email: "newhire@systrol.local",
      role: "EMPLOYEE",
      must_change_password: true,
    };

    await page.route("**/api/auth/me/", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(currentUser),
      });
    });

    await page.route("**/api/auth/csrf/", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ csrfToken: "test-token" }),
      });
    });

    await page.route("**/api/auth/password/change", async (route) => {
      currentUser = {
        ...currentUser,
        must_change_password: false,
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Password updated successfully." }),
      });
    });

    await page.goto("/change-password");

    await expect(page.locator("text=Set New Password")).toBeVisible();
    await expect(page.locator("text=Security requirement")).toBeVisible();

    await page.fill('input[name="current-password"]', "TemporaryPassword123!");
    await page.fill('input[name="new-password"]', "BrandNewSecurePassword123!");
    await page.fill('input[name="confirm-password"]', "BrandNewSecurePassword123!");

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/timesheets|\/$/);
  });
});
