import { test, expect } from "@playwright/test";

test("public routes render and unknown content returns 404", async ({ page }) => {
  for (const route of ["/", "/writing", "/blog", "/documentary", "/series", "/authors", "/reference"]) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");
  }
  const missing = await page.goto("/writing/ci-does-not-exist");
  expect(missing?.status()).toBe(404);
});

test("admin routes require login and seeded credentials authenticate", async ({ page, request }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByTestId("email-input")).toBeVisible();
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;
  expect(email, "Set TEST_ADMIN_EMAIL for the seeded test database").toBeTruthy();
  expect(password, "Set TEST_ADMIN_PASSWORD for the seeded test database").toBeTruthy();
  const rejected = await request.post("/api/admin/login", { data: { email, password: "incorrect-ci-password" } });
  expect(rejected.status()).toBe(401);
  const login = await request.post("/api/admin/login", { data: { email, password } });
  expect(login.status()).toBe(200);
  expect(await login.json()).toMatchObject({ ok: true });
  expect(login.headers()["set-cookie"]).toBeTruthy();
});
