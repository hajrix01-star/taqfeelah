import { expect, test } from "@playwright/test";

const SAAS_ADMIN_BASE = "/saas-admin";

test.describe("SaaS admin mobile shell", () => {
  test.use({
    viewport: { width: 390, height: 844 },
  });

  test("login page has no horizontal overflow", async ({ page }) => {
    const response = await page.goto(`${SAAS_ADMIN_BASE}/login`, { waitUntil: "domcontentloaded" });
    expect(response?.status(), "login page should respond").toBeLessThan(500);

    await expect(page.getByRole("heading", { name: "دخول لوحة إدارة المنصة" })).toBeVisible({
      timeout: 30_000,
    });

    const metrics = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      return {
        scrollWidth: Math.max(doc.scrollWidth, body?.scrollWidth ?? 0),
        clientWidth: doc.clientWidth,
      };
    });

    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  });

  test("mobile menu opens and closes with Escape", async ({ page }) => {
    test.skip(
      process.env.E2E_SAAS_ADMIN_SESSION !== "1",
      "Set E2E_SAAS_ADMIN_SESSION=1 with a seeded admin session to run authenticated mobile checks.",
    );

    await page.goto(`${SAAS_ADMIN_BASE}/overview`);
    await expect(page.getByTestId("admin-mobile-menu-btn")).toBeVisible();
    await page.getByTestId("admin-mobile-menu-btn").click();
    await expect(page.getByTestId("admin-sidebar")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("admin-sidebar")).toHaveAttribute("aria-hidden", "true");
  });
});
