import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

const OWNER_USERNAME = process.env.E2E_OWNER_USERNAME || "hajri";
const OWNER_PASSWORD = process.env.E2E_OWNER_PASSWORD || "hajri123";
const EMPLOYEE_ID = process.env.E2E_EMPLOYEE_ID || "ahmed";
const EMPLOYEE_PIN = process.env.E2E_EMPLOYEE_PIN || "1234";

const STORE_ID = process.env.E2E_STORE_ID || "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c";
const SALES_CHANNEL_ID = process.env.E2E_SALES_CHANNEL_ID || "9bc40d4f-c773-4ba3-87db-b8bb1467dafb";

const UUID_PATTERN = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i;

type SummaryEntry = {
  type?: string;
  closeoutId?: string | null;
  salesChannels?: Array<{ name?: string; channelName?: string }>;
};

/** Match app register period filters (local calendar date, not UTC). */
function localIsoDateNow(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function monthRangeForDate(date: string): { from: string; to: string } {
  const monthStart = `${date.slice(0, 7)}-01`;
  const [yearText, monthText] = date.slice(0, 7).split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText);
  const lastDay = new Date(year, monthIndex, 0).getDate();
  return {
    from: monthStart,
    to: `${yearText}-${monthText}-${String(lastDay).padStart(2, "0")}`,
  };
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

async function fetchOwnerSummaryEntries(
  page: import("@playwright/test").Page,
  date: string,
): Promise<SummaryEntry[]> {
  const { from, to } = monthRangeForDate(date);
  const response = await page.request.get(
    `/api/v1/stores/${STORE_ID}/entries?paginated=1&status=all&limit=50&dateFrom=${from}&dateTo=${to}`,
  );
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  const items = Array.isArray(body?.items) ? body.items as SummaryEntry[] : [];
  return items.filter((entry) => entry?.type === "summary");
}

async function waitForOwnerSummaryEntry(
  page: import("@playwright/test").Page,
  date: string,
  closeoutId: string,
): Promise<SummaryEntry> {
  let matched: SummaryEntry | null = null;
  await expect.poll(async () => {
    const summaries = await fetchOwnerSummaryEntries(page, date);
    matched = summaries.find((entry) => entry.closeoutId === closeoutId) || null;
    return matched ? 1 : 0;
  }, {
    timeout: 60_000,
    message: "owner register entries API should include the submitted closeout summary",
  }).toBeGreaterThan(0);
  return matched!;
}

test.describe("register closeouts with PostgreSQL", () => {
  test("closeout submit appears in owner register entries API with channel labels and deletes cleanly", async ({ page }) => {
    const date = process.env.E2E_CLOSEOUT_DATE || localIsoDateNow();
    const closeoutId = `e2e-reg-${randomUUID().slice(0, 8)}`;

    await submitEmployeeCloseout(page, { closeoutId, date });
    await loginOwnerSession(page);

    const summary = await waitForOwnerSummaryEntry(page, date, closeoutId);
    const channelLabels = (summary.salesChannels || [])
      .map((row) => row.name || row.channelName || "")
      .join(" ");
    expect(channelLabels).toMatch(/Cash|كاش|نقد/i);
    expect(channelLabels).not.toMatch(UUID_PATTERN);

    const deleteResponse = await page.request.delete(
      `/api/v1/stores/${STORE_ID}/closeouts/${encodeURIComponent(closeoutId)}`,
    );
    expect(deleteResponse.ok()).toBeTruthy();

    await expect.poll(async () => {
      const summaries = await fetchOwnerSummaryEntries(page, date);
      return summaries.some((entry) => entry.closeoutId === closeoutId) ? 1 : 0;
    }, {
      timeout: 60_000,
      message: "deleted closeout should disappear from owner register entries API",
    }).toBe(0);
  });
});
