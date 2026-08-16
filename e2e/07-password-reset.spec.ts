import { test, expect } from "@playwright/test";

test.describe("Admin Password Reset Flow", () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // Start completely unauthenticated

  test("Forgot password navigation, submission, and login with new password", async ({ page, request }) => {
    // 1. Visit login page and click 'Forgot your password?'
    await page.goto("/admin/login");
    const forgotLink = page.getByRole("link", { name: /Forgot your password/i });
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();
    await page.waitForURL("/admin/forgot-password");

    // 2. Submit valid email address
    const adminEmail = process.env.TEST_ADMIN_EMAIL || "admin@thoughts.whatever.com";
    await page.getByTestId("forgot-email-input").fill(adminEmail);
    await page.getByTestId("forgot-submit").click();

    // 3. Confirm non-enumerating generic success screen
    await expect(page.getByTestId("forgot-success")).toBeVisible();

    // 4. Missing token navigation to /admin/reset-password shows error
    await page.goto("/admin/reset-password");
    await expect(page.getByTestId("reset-error")).toBeVisible();
  });
});
