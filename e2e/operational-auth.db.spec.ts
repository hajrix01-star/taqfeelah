import { expect, test } from "@playwright/test";

const OWNER_PASSWORD = process.env.E2E_OWNER_PASSWORD || "hajri123";

test.describe("operational auth with PostgreSQL", () => {
  test("owner session login reaches the operational shell", async ({ page }) => {
    const runtimeFailures: string[] = [];
    page.on("pageerror", (error) => runtimeFailures.push(error.message));

    await page.goto("/app");

    await expect(page.getByRole("heading", { name: "مرحبًا في تقفيلة" })).toBeVisible({
      timeout: 60_000,
    });
    await page.getByRole("button", { name: "تسجيل دخول المالك" }).click();
    await expect(page.getByRole("heading", { name: "ادخل إلى تقفيلة" })).toBeVisible({
      timeout: 15_000,
    });

    // Production login form defaults seeded username (hajri); password field only is enough.
    await page.locator('input[name="password"]').fill(OWNER_PASSWORD);
    await page.getByRole("button", { name: "تحقق وادخل" }).click();

    await expect(page.getByRole("button", { name: "الرئيسية" })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByRole("button", { name: "السجل" })).toBeVisible();

    const sessionResponse = await page.request.get("/api/v1/auth/session");
    expect(sessionResponse.ok()).toBeTruthy();
    const sessionBody = await sessionResponse.json();
    expect(sessionBody?.authenticated).toBe(true);
    expect(sessionBody?.role).toBe("owner");

    expect(runtimeFailures.filter((msg) => /ReferenceError|is not defined/i.test(msg))).toEqual([]);
  });
});
