import { expect, test } from "@playwright/test";

function isRuntimeFailure(message: string): boolean {
  return /ReferenceError|is not defined|Cannot read properties of (undefined|null)/i.test(message);
}

test.describe("app auth shell smoke", () => {
  test("shows real owner login and employee portal entry", async ({ page }) => {
    const runtimeFailures: string[] = [];

    page.on("pageerror", (error) => {
      if (isRuntimeFailure(error.message)) runtimeFailures.push(error.message);
    });
    page.on("console", (message) => {
      if (message.type() === "error" && isRuntimeFailure(message.text())) {
        runtimeFailures.push(message.text());
      }
    });

    await page.goto("/app");

    await expect(page.getByRole("heading", { name: "ادخل إلى تقفيلة" })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByRole("button", { name: "دخول الموظف" })).toBeVisible();

    await page.getByRole("button", { name: "دخول الموظف" }).click();

    await expect(page.getByRole("heading", { name: "دخول الموظف" })).toBeVisible({
      timeout: 15_000,
    });

    expect(runtimeFailures).toEqual([]);
  });
});
