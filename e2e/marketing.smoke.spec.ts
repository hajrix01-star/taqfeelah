import { expect, test } from "@playwright/test";

test.describe("marketing landing smoke", () => {
  test("home page shows brand hero and app entry cta", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("حسبة بدو. لا تعقدها.").first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("heading", { name: "داخل − خارج = الباقي" })).toBeVisible();
    await expect(page.getByRole("link", { name: "الدخول للتطبيق" }).first()).toBeVisible();
    await expect(page.getByText("من الدفتر للجوال — نفس روح التطبيق")).toBeVisible();
    await expect(page.getByRole("heading", { name: "باقات مرنة للبداية والنمو" })).toBeVisible();
  });
});
