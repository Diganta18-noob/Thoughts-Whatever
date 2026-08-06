import { test, expect } from "@playwright/test";

test.describe("Authentication & Session Lifecycle", () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // Start unauthenticated

  test("Happy path: Login with valid credentials and logout", async ({ page }) => {
    await page.goto("/admin/login");

    const email = process.env.TEST_ADMIN_EMAIL || "admin@example.com";
    const password = process.env.TEST_ADMIN_PASSWORD || "password123";

    await page.getByTestId("email-input").fill(email);
    await page.getByTestId("password-input").fill(password);
    await page.getByTestId("login-submit").click();

    await page.waitForURL("/admin");
    await expect(page.getByTestId("logout-button")).toBeVisible();

    // Logout
    await page.getByTestId("logout-button").click();
    await page.waitForURL("/admin/login");
    await expect(page.getByTestId("email-input")).toBeVisible();
  });

  test("Failure: Invalid credentials shows error message", async ({ page }) => {
    await page.goto("/admin/login");

    await page.getByTestId("email-input").fill("wrong@example.com");
    await page.getByTestId("password-input").fill("WrongPassword123!");
    await page.getByTestId("login-submit").click();

    await expect(page.getByTestId("login-error")).toBeVisible();
  });

  test("Unauthenticated access to /admin redirects to login", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL(/\/admin\/login/);
    await expect(page.getByTestId("email-input")).toBeVisible();
  });
});
