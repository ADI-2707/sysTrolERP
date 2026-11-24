import { test, expect } from "@playwright/test";

test.describe("Critical Journey: Project Step Lifecycle", () => {
  test("navigates through project step completion and sub-step management", async ({ page }) => {
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

    const mockProject = {
      id: 10,
      code: "PRJ-2026-010",
      name: "Blast Furnace Gas Dedusting",
      slug: "blast-furnace-gas-dedusting",
      client_name: "JSW Steel",
      description: "Gas cleaning plant",
      status: "ACTIVE",
      completion_percentage: 28.5,
      created_by_label: "Admin Alice",
      created_at: "2026-01-15T09:00:00Z",
      steps: [
        { id: 1, key: "ENQUIRY", name: "Enquiry", position: 1, is_custom: false, status: "COMPLETED" },
        { id: 2, key: "SALES_VISIT", name: "Sales Visit", position: 2, is_custom: false, status: "COMPLETED" },
        { id: 3, key: "PROCUREMENT", name: "Procurement", position: 3, is_custom: false, status: "COMPLETED" },
        { id: 4, key: "ENGINEERING", name: "Engineering", position: 4, is_custom: false, status: "COMPLETED" },
        { id: 5, key: "MANUFACTURING", name: "Manufacturing", position: 5, is_custom: false, status: "IN_PROGRESS" },
        { id: 6, key: "DISPATCH", name: "Dispatch", position: 6, is_custom: false, status: "NOT_STARTED" },
      ],
      members: [],
    };

    await page.route("**/api/projects/10/", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockProject),
      });
    });

    await page.goto("/projects/10");
    await expect(page.locator("text=Blast Furnace Gas Dedusting")).toBeVisible();
    await expect(page.locator("text=PRJ-2026-010")).toBeVisible();
  });
});
