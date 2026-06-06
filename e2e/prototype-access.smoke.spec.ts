import { expect, test } from "@playwright/test";

function isRuntimeFailure(message: string): boolean {
  return /ReferenceError|is not defined|Cannot read properties of (undefined|null)/i.test(message);
}

test.describe("prototype access smoke", () => {
  test("prototype picker, owner shell, logout, and employee shell load", async ({ page }) => {
    const runtimeFailures: string[] = [];

    page.on("pageerror", (error) => {
      if (isRuntimeFailure(error.message)) runtimeFailures.push(error.message);
    });
    page.on("console", (message) => {
      if (message.type() === "error" && isRuntimeFailure(message.text())) {
        runtimeFailures.push(message.text());
      }
    });

    await page.goto("/");

    await expect(page.getByRole("heading", { name: "وضع الدخول التجريبي" })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByRole("button", { name: "دخول كمالك" })).toBeVisible();
    await expect(page.getByRole("button", { name: "دخول كموظف" })).toBeVisible();

    await page.getByRole("button", { name: "دخول كمالك" }).click();

    await expect(page.locator(".taq-shell")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("الرئيسية", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "الحساب" }).click();
    await page.getByRole("menuitem", { name: "تسجيل الخروج" }).click();

    await expect(page.getByRole("button", { name: "دخول كمالك" })).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("button", { name: "دخول كموظف" }).click();

    await expect(page.locator(".taq-shell")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "تقفيلاتي اليومية" })).toBeVisible();

    expect(runtimeFailures).toEqual([]);
  });
});
