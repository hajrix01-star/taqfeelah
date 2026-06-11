import { expect, test } from "@playwright/test";

test.describe("marketing landing smoke", () => {
  test("home page shows marketing hero and app entry cta", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "الداخل − الخارج = الناتج" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("link", { name: "الدخول للتطبيق" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "باقات مرنة للبداية والنمو" })).toBeVisible();
  });
});
