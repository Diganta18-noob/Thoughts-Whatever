import { test, expect } from "@playwright/test";

test.describe("Newsletter Subscription & Unsubscribe Lifecycle", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("Happy path: Subscribe with valid email", async ({ page }) => {
    await page.goto("/letter");

    const testEmail = `reader_${Date.now()}@example.com`;
    await page.getByTestId("subscribe-email-input").fill(testEmail);
    await page.getByTestId("subscribe-submit").click();

    await expect(page.getByTestId("subscribe-success-msg")).toBeVisible();
  });

  test("Failure state: Rate limiting trigger after multiple rapid signups", async ({ page }) => {
    await page.goto("/letter");

    // Make rapid requests to hit the 10 req/min rate limit on /api/subscribe
    for (let i = 0; i < 11; i++) {
      const email = `spam_${i}_${Date.now()}@example.com`;
      await page.getByTestId("subscribe-email-input").fill(email);
      await page.getByTestId("subscribe-submit").click();
      await page.waitForTimeout(100);
    }

    // Should display rate limit error message
    await expect(page.getByTestId("subscribe-error-msg")).toBeVisible();
  });

  test("Unsubscribe page handling with invalid token", async ({ page }) => {
    await page.goto("/letter/unsubscribe?token=invalid_token_123");
    await expect(page).toHaveURL(/\/letter\/unsubscribe/);
  });
});
