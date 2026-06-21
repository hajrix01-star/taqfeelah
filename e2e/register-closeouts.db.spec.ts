import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

const OWNER_USERNAME = process.env.E2E_OWNER_USERNAME || "hajri";
const OWNER_PASSWORD = process.env.E2E_OWNER_PASSWORD || "hajri123";
const EMPLOYEE_ID = process.env.E2E_EMPLOYEE_ID || "ahmed";
const EMPLOYEE_PIN = process.env.E2E_EMPLOYEE_PIN || "1234";

const STORE_ID = process.env.E2E_STORE_ID || "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c";
const SALES_CHANNEL_ID = process.env.E2E_SALES_CHANNEL_ID || "9bc40d4f-c773-4ba3-87db-b8bb1467dafb";

const UUID_PATTERN = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i;

/** Match app register period filters (local calendar date, not UTC). */
function localIsoDateNow(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function registerCloseoutDomId(clientCloseoutId: string): string {
  return `register-closeout-${`closeout|${clientCloseoutId}`.replace(/\|/g, "--")}`;
}

function isRuntimeFailure(message: string): boolean {
  return /ReferenceError|is not defined|Cannot read properties of (undefined|null)/i.test(message);
}

async function loginOwnerSession(page: import("@playwright/test").Page): Promise<void> {
  const response = await page.request.post("/api/v1/auth/session", {
    data: {
      mode: "owner_password",
      username: OWNER_USERNAME,
      password: OWNER_PASSWORD,
    },
  });
  expect(response.ok()).toBeTruthy();
}

async function submitEmployeeCloseout(
  page: import("@playwright/test").Page,
  {
    closeoutId,
    date,
    amountHalalas = 30_000,
  }: {
    closeoutId: string;
    date: string;
    amountHalalas?: number;
  },
): Promise<void> {
  const loginResponse = await page.request.post("/api/v1/auth/session", {
    data: {
      mode: "employee_pin",
      employeeId: EMPLOYEE_ID,
      pin: EMPLOYEE_PIN,
    },
  });
  expect(loginResponse.ok()).toBeTruthy();

  const submitResponse = await page.request.post(`/api/v1/stores/${STORE_ID}/closeouts`, {
    data: {
      mode: "submit",
      closeoutId,
      date,
      salesChannels: [{
        salesChannelId: SALES_CHANNEL_ID,
        channelName: "Cash",
        amountHalalas,
      }],
      outflows: [],
      note: "register-closeouts-e2e",
    },
  });
  expect(submitResponse.ok()).toBeTruthy();
}

async function waitForOwnerSummaryEntry(
  page: import("@playwright/test").Page,
  date: string,
): Promise<void> {
  const monthStart = `${date.slice(0, 7)}-01`;
  await expect.poll(async () => {
    const response = await page.request.get(
      `/api/v1/stores/${STORE_ID}/entries?paginated=1&status=all&limit=50&dateFrom=${monthStart}&dateTo=${date}`,
    );
    if (!response.ok()) return 0;
    const body = await response.json();
    const items = Array.isArray(body?.items) ? body.items : [];
    return items.filter((entry: { type?: string }) => entry?.type === "summary").length;
  }, {
    timeout: 60_000,
    message: "owner register entries API should include the submitted closeout summary",
  }).toBeGreaterThan(0);
}

test.describe("register closeouts with PostgreSQL", () => {
  test("owner register shows channel labels, edit form, and delete flow", async ({ page }) => {
    const runtimeFailures: string[] = [];
    page.on("pageerror", (error) => {
      if (isRuntimeFailure(error.message)) runtimeFailures.push(error.message);
    });

    const date = process.env.E2E_CLOSEOUT_DATE || localIsoDateNow();
    const closeoutId = `e2e-reg-${randomUUID().slice(0, 8)}`;
    const closeoutCardId = registerCloseoutDomId(closeoutId);

    await submitEmployeeCloseout(page, { closeoutId, date });
    await loginOwnerSession(page);
    await waitForOwnerSummaryEntry(page, date);

    await page.goto("/app");

    await expect(page.getByRole("button", { name: "السجل" })).toBeVisible({ timeout: 120_000 });
    await page.getByRole("button", { name: "السجل" }).click();

    const closeoutsTab = page.getByRole("tab", { name: /التقفيلات/ });
    await expect(closeoutsTab).toBeVisible({ timeout: 60_000 });
    await closeoutsTab.click();

    const closeoutCard = page.locator(`#${closeoutCardId}`);
    await expect(closeoutCard).toBeVisible({ timeout: 90_000 });
    await closeoutCard.locator("button").first().click();

    const expandedCardText = await closeoutCard.innerText();
    expect(expandedCardText).toMatch(/Cash|كاش|نقد/i);
    expect(expandedCardText).not.toMatch(UUID_PATTERN);

    await closeoutCard.getByRole("button", { name: "تعديل التقفيلة" }).click();
    await expect(page.getByText("تعديل التقفيلة", { exact: true })).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("input[inputmode='decimal']").first()).not.toHaveValue("");
    await page.locator("header").getByRole("button").first().click();

    await closeoutCard.getByRole("button", { name: "حذف التقفيلة" }).click();
    await expect(page.getByText("حذف التقفيلة نهائيًا؟")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "حذف", exact: true }).click();

    await expect(closeoutCard).toBeHidden({ timeout: 60_000 });

    expect(runtimeFailures).toEqual([]);
  });
});
