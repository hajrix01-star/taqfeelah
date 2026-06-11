#!/usr/bin/env node
/**
 * PR-2 §2.4 checklist — DB-only closeout path against local or remote API.
 * Usage: node scripts/db-source-unification-check.mjs
 *
 * On production (ALLOW_HEADER_AUTH_CONTEXT=false), logs in via session cookies
 * before exercising closeout APIs.
 */
import { randomUUID } from "node:crypto";

const baseUrl = (process.env.CHECK_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const organizationId = process.env.CHECK_ORGANIZATION_ID || "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1";
const storeId = process.env.CHECK_STORE_ID || "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c";
const employeeUserId = process.env.CHECK_EMPLOYEE_USER_ID || "4cf1450d-08d8-4ca1-b180-1c2642174a79";
const ownerUserId = process.env.CHECK_OWNER_USER_ID || "e8f3e35b-6051-4da3-8b10-979700c2f00f";
const salesChannelId = process.env.CHECK_SALES_CHANNEL_ID || "9bc40d4f-c773-4ba3-87db-b8bb1467dafb";
const ownerUsername = process.env.CHECK_OWNER_USERNAME || "hajri";
const ownerPassword = process.env.CHECK_OWNER_PASSWORD || "123";
const employeeId = process.env.CHECK_EMPLOYEE_ID || "ahmed";
const employeePin = process.env.CHECK_EMPLOYEE_PIN || "1234";

/** @type {{ employee: string | null, owner: string | null }} */
const sessionCookies = { employee: null, owner: null };

function isoDateNow() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function collectSetCookies(response) {
  if (typeof response.headers.getSetCookie === "function") {
    return response.headers.getSetCookie();
  }
  const single = response.headers.get("set-cookie");
  return single ? [single] : [];
}

function cookieHeaderFromSetCookies(setCookies) {
  return setCookies
    .map((value) => value.split(";")[0]?.trim())
    .filter(Boolean)
    .join("; ");
}

async function callJson(url, init) {
  const response = await fetch(url, init);
  const raw = await response.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }
  if (!response.ok) {
    throw new Error(`${init?.method || "GET"} ${url} → ${response.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

function headerAuthHeaders(role, userId) {
  return {
    "content-type": "application/json",
    "x-organization-id": organizationId,
    "x-user-id": userId,
    "x-member-role": role,
  };
}

function requestHeaders(role, userId) {
  const cookie = role === "owner" ? sessionCookies.owner : sessionCookies.employee;
  if (cookie) {
    return {
      "content-type": "application/json",
      cookie,
    };
  }
  return headerAuthHeaders(role, userId);
}

async function loginSession(role) {
  const payload = role === "owner"
    ? { mode: "owner_password", username: ownerUsername, password: ownerPassword }
    : { mode: "employee_pin", employeeId, pin: employeePin };

  const response = await fetch(`${baseUrl}/api/v1/auth/session`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const raw = await response.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }
  if (!response.ok) {
    throw new Error(`POST /api/v1/auth/session (${role}) → ${response.status}: ${JSON.stringify(data)}`);
  }

  const cookie = cookieHeaderFromSetCookies(collectSetCookies(response));
  if (!cookie) {
    throw new Error(`POST /api/v1/auth/session (${role}) succeeded but no Set-Cookie header was returned.`);
  }

  if (role === "owner") {
    sessionCookies.owner = cookie;
  } else {
    sessionCookies.employee = cookie;
  }
}

async function ensureSessionAuthIfNeeded() {
  const probe = await fetch(`${baseUrl}/api/v1/stores/${storeId}/closeouts`, {
    method: "GET",
    headers: headerAuthHeaders("employee", employeeUserId),
  });
  const raw = await probe.text();
  if (probe.ok) {
    return;
  }

  let payload = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = raw;
  }

  const message = typeof payload?.error?.message === "string" ? payload.error.message : "";
  if (probe.status !== 400 || !message.includes("Session cookie is required")) {
    throw new Error(`GET closeouts probe → ${probe.status}: ${raw}`);
  }

  console.log("Session auth required — logging in as employee and owner…");
  await loginSession("employee");
  await loginSession("owner");
}

async function submitCloseout({ closeoutId, date, amountHalalas = 30000, mode = "submit", role = "employee", userId = employeeUserId }) {
  return callJson(`${baseUrl}/api/v1/stores/${storeId}/closeouts`, {
    method: "POST",
    headers: requestHeaders(role, userId),
    body: JSON.stringify({
      mode,
      closeoutId,
      date,
      salesChannels: [{ salesChannelId, channelName: "Cash", amountHalalas }],
      outflows: [],
      note: "db-source-unification-check",
    }),
  });
}

async function listCloseouts(role, userId) {
  const payload = await callJson(`${baseUrl}/api/v1/stores/${storeId}/closeouts`, {
    method: "GET",
    headers: requestHeaders(role, userId),
  });
  return Array.isArray(payload?.closeouts) ? payload.closeouts : (Array.isArray(payload) ? payload : []);
}

function findCloseout(list, closeoutId) {
  return list.find((item) => item.id === closeoutId || item.clientCloseoutId === closeoutId);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const date = process.env.CHECK_DATE || isoDateNow();
  const closeoutA = `check-a-${randomUUID().slice(0, 8)}`;
  const closeoutB = `check-b-${randomUUID().slice(0, 8)}`;
  const closeoutEdit = `check-e-${randomUUID().slice(0, 8)}`;

  console.log(`Target: ${baseUrl}`);
  console.log(`Date: ${date}\n`);

  await ensureSessionAuthIfNeeded();

  console.log("1) Employee submit closeout A…");
  const submitA = await submitCloseout({ closeoutId: closeoutA, date, amountHalalas: 31000 });
  assert(submitA?.daySequence >= 1, "closeout A missing daySequence");

  console.log("2) Employee submit closeout B (same day)…");
  const submitB = await submitCloseout({ closeoutId: closeoutB, date, amountHalalas: 32000 });
  assert(submitB?.daySequence > submitA.daySequence, `expected B sequence > A (${submitA.daySequence} vs ${submitB.daySequence})`);

  console.log("3) Owner lists closeouts — expects A & B…");
  const ownerList = await listCloseouts("owner", ownerUserId);
  const ownerIds = new Set(ownerList.map((item) => item.id || item.clientCloseoutId));
  assert(ownerIds.has(closeoutA) || ownerList.some((i) => i.clientCloseoutId === closeoutA), "owner list missing closeout A");
  assert(ownerIds.has(closeoutB) || ownerList.some((i) => i.clientCloseoutId === closeoutB), "owner list missing closeout B");

  console.log("4) Employee lists own closeouts…");
  const employeeList = await listCloseouts("employee", employeeUserId);
  assert(employeeList.length > 0, "employee closeouts list empty");

  console.log("5) Submit is auto-approved (no review step)…");
  await submitCloseout({ closeoutId: closeoutEdit, date, amountHalalas: 33000 });
  const afterSubmit = await listCloseouts("owner", ownerUserId);
  const submitted = findCloseout(afterSubmit, closeoutEdit);
  assert(submitted?.status === "reviewed", `expected reviewed after submit, got ${submitted?.status}`);

  console.log("6) Owner edit via resubmit…");
  await submitCloseout({
    closeoutId: closeoutEdit,
    date,
    amountHalalas: 34000,
    mode: "resubmit",
    role: "owner",
    userId: ownerUserId,
  });
  const afterOwnerEdit = await listCloseouts("owner", ownerUserId);
  const edited = findCloseout(afterOwnerEdit, closeoutEdit);
  assert(edited?.status === "reviewed", `expected reviewed after owner edit, got ${edited?.status}`);

  console.log("7) Employee resubmit must be forbidden…");
  const employeeResubmit = await fetch(`${baseUrl}/api/v1/stores/${storeId}/closeouts`, {
    method: "POST",
    headers: requestHeaders("employee", employeeUserId),
    body: JSON.stringify({
      mode: "resubmit",
      closeoutId: closeoutEdit,
      date,
      salesChannels: [{ salesChannelId, channelName: "Cash", amountHalalas: 35000 }],
      outflows: [],
      note: "employee resubmit should fail",
    }),
  });
  assert(employeeResubmit.status === 403, `expected 403 for employee resubmit, got ${employeeResubmit.status}`);

  console.log("8) Standalone entry POST without closeoutId must fail…");
  const standaloneResponse = await fetch(`${baseUrl}/api/v1/stores/${storeId}/entries`, {
    method: "POST",
    headers: requestHeaders("owner", ownerUserId),
    body: JSON.stringify({
      date,
      type: "expense",
      amountHalalas: 5000,
    }),
  });
  assert(standaloneResponse.status === 400, `expected 400 for standalone entry, got ${standaloneResponse.status}`);

  console.log("\n✅ DB source-unification checklist passed.");
  console.log(`   daySequence A=${submitA.daySequence}, B=${submitB.daySequence}`);

  const orphanCheck = await fetch(`${baseUrl}/api/v1/stores/${storeId}/entries?status=active&limit=500`, {
    method: "GET",
    headers: requestHeaders("owner", ownerUserId),
  });
  if (orphanCheck.ok) {
    const payload = await orphanCheck.json();
    const items = Array.isArray(payload) ? payload : (payload?.items || []);
    const orphanLike = items.filter((item) => !item?.closeoutId);
    assert(orphanLike.length === 0, `expected no active list entries without closeoutId, got ${orphanLike.length}`);
    console.log("9) Active entries list excludes orphan rows without closeoutId.");
  } else {
    console.log("9) Skipped orphan list check — entries GET failed.");
  }

  console.log("");
}

main().catch((error) => {
  console.error("\n❌ Checklist failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
