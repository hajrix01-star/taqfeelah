import { expect, test } from "@playwright/test";

const OWNER_USERNAME = process.env.E2E_OWNER_USERNAME || "hajri";
const OWNER_PASSWORD = process.env.E2E_OWNER_PASSWORD || "hajri123";

test.describe("operational auth with PostgreSQL", () => {
  test("owner session login reaches the operational shell", async ({ page }) => {
    const runtimeFailures: string[] = [];
    page.on("pageerror", (error) => runtimeFailures.push(error.message));

    // page.request shares the browser cookie jar; the isolated `request` fixture does not.
    const loginResponse = await page.request.post("/api/v1/auth/session", {
      data: {
        mode: "owner_password",
        username: OWNER_USERNAME,
        password: OWNER_PASSWORD,
      },
    });
    expect(loginResponse.ok()).toBeTruthy();

    await page.goto("/app");

    await expect(page.getByRole("button", { name: "الرئيسية" })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByRole("button", { name: "السجل" })).toBeVisible();

    const sessionResponse = await page.request.get("/api/v1/auth/session");
    expect(sessionResponse.ok()).toBeTruthy();
    const sessionBody = await sessionResponse.json();
    expect(sessionBody?.data?.authenticated).toBe(true);
    expect(sessionBody?.data?.role).toBe("owner");

    expect(runtimeFailures.filter((msg) => /ReferenceError|is not defined/i.test(msg))).toEqual([]);
  });
});
