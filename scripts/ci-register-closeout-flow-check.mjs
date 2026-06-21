#!/usr/bin/env node
/**
 * CI API smoke: employee submit closeout → owner sees summary entry in register entries API.
 */
import { randomUUID } from "node:crypto";
import process from "node:process";

const BASE_URL = process.env.CHECK_BASE_URL || "http://127.0.0.1:3101";
const OWNER_USERNAME = process.env.E2E_OWNER_USERNAME || "hajri";
const OWNER_PASSWORD = process.env.E2E_OWNER_PASSWORD || "hajri123";
const EMPLOYEE_ID = process.env.E2E_EMPLOYEE_ID || "ahmed";
const EMPLOYEE_PIN = process.env.E2E_EMPLOYEE_PIN || "1234";
const STORE_ID = process.env.E2E_STORE_ID || "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c";
const SALES_CHANNEL_ID = process.env.E2E_SALES_CHANNEL_ID || "9bc40d4f-c773-4ba3-87db-b8bb1467dafb";

function localIsoDateNow() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

async function login(mode, body) {
  const response = await fetch(`${BASE_URL}/api/v1/auth/session`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mode, ...body }),
  });
  if (!response.ok) {
    throw new Error(`auth ${mode} failed: ${response.status} ${await response.text()}`);
  }
  const cookie = response.headers.get("set-cookie");
  if (!cookie) throw new Error(`auth ${mode} missing session cookie`);
  return cookie.split(";")[0];
}

async function main() {
  const date = process.env.E2E_CLOSEOUT_DATE || localIsoDateNow();
  const closeoutId = `ci-reg-${randomUUID().slice(0, 8)}`;
  const monthStart = `${date.slice(0, 7)}-01`;

  const employeeCookie = await login("employee_pin", { employeeId: EMPLOYEE_ID, pin: EMPLOYEE_PIN });
  const submitResponse = await fetch(`${BASE_URL}/api/v1/stores/${STORE_ID}/closeouts`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: employeeCookie,
    },
    body: JSON.stringify({
      mode: "submit",
      closeoutId,
      date,
      salesChannels: [{
        salesChannelId: SALES_CHANNEL_ID,
        channelName: "Cash",
        amountHalalas: 30_000,
      }],
      outflows: [],
      note: "ci-register-closeout-flow-check",
    }),
  });
  if (!submitResponse.ok) {
    throw new Error(`closeout submit failed: ${submitResponse.status} ${await submitResponse.text()}`);
  }

  const ownerCookie = await login("owner_password", {
    username: OWNER_USERNAME,
    password: OWNER_PASSWORD,
  });

  let summaryCount = 0;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const entriesResponse = await fetch(
      `${BASE_URL}/api/v1/stores/${STORE_ID}/entries?paginated=1&status=all&limit=50&dateFrom=${monthStart}&dateTo=${date}`,
      { headers: { cookie: ownerCookie } },
    );
    if (entriesResponse.ok) {
      const body = await entriesResponse.json();
      const items = Array.isArray(body?.items) ? body.items : [];
      summaryCount = items.filter((entry) => entry?.type === "summary").length;
      if (summaryCount > 0) break;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (summaryCount <= 0) {
    throw new Error("owner register entries API did not return a summary entry after closeout submit");
  }

  console.log(`✅ register closeout API flow OK (${summaryCount} summary entr${summaryCount === 1 ? "y" : "ies"})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
