#!/usr/bin/env node
/**
 * Production P0 smoke: server-authoritative DB financial path.
 * It intentionally creates a few check closeouts on the target tenant/store.
 */
import { randomUUID } from "node:crypto";

const baseUrl = (process.env.CHECK_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const organizationId = process.env.CHECK_ORGANIZATION_ID || "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1";
const storeId = process.env.CHECK_STORE_ID || "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c";
const unauthorizedStoreId = process.env.CHECK_UNAUTHORIZED_STORE_ID || randomUUID();
const archivedStoreId = process.env.CHECK_ARCHIVED_STORE_ID || "";
const createArchivedStoreForCheck = process.env.CHECK_CREATE_ARCHIVED_STORE === "true";
const employeeUserId = process.env.CHECK_EMPLOYEE_USER_ID || "4cf1450d-08d8-4ca1-b180-1c2642174a79";
const ownerUserId = process.env.CHECK_OWNER_USER_ID || "e8f3e35b-6051-4da3-8b10-979700c2f00f";
const salesChannelId = process.env.CHECK_SALES_CHANNEL_ID || "9bc40d4f-c773-4ba3-87db-b8bb1467dafb";
const ownerUsername = process.env.CHECK_OWNER_USERNAME || "hajri";
const ownerPassword = process.env.CHECK_OWNER_PASSWORD || "hajri123";
const ownerPhone = process.env.CHECK_OWNER_PHONE || "";
const employeeId = process.env.CHECK_EMPLOYEE_ID || employeeUserId;
const employeePin = process.env.CHECK_EMPLOYEE_PIN || "1234";
const employeePhone = process.env.CHECK_EMPLOYEE_PHONE || "";
const tinyPngDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";

/** @type {{ employee: string | null, owner: string | null }} */
const sessionCookies = { employee: null, owner: null };

function businessDateInRiyadh() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type) => parts.find((part) => part.type === type)?.value || "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function monthRange(month) {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText);
  const lastDay = new Date(year, monthIndex, 0).getDate();
  return {
    from: `${yearText}-${monthText}-01`,
    to: `${yearText}-${monthText}-${String(lastDay).padStart(2, "0")}`,
  };
}

function amountHalalas(field) {
  return Number(field?.amountHalalas || 0);
}

function summaryShape(payload) {
  return {
    sales: amountHalalas(payload?.totalSales),
    outflow: amountHalalas(payload?.totalOutflow),
    net: amountHalalas(payload?.netMovement),
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertSameFinancials(left, right, label) {
  assert(left.sales === right.sales, `${label}: sales mismatch ${left.sales} != ${right.sales}`);
  assert(left.outflow === right.outflow, `${label}: outflow mismatch ${left.outflow} != ${right.outflow}`);
  assert(left.net === right.net, `${label}: net mismatch ${left.net} != ${right.net}`);
}

function assertProductionNoBrowserFinancialFallback() {
  const productionTarget = process.env.APP_MODE === "production"
    || process.env.NEXT_PUBLIC_APP_MODE === "production"
    || /^https:\/\/(www\.)?taqfeelah\.com$/i.test(baseUrl);
  if (!productionTarget) return;

  assert(process.env.NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE === "true", "production must disable browser persistence");
  assert(process.env.NEXT_PUBLIC_ENTRIES_API_ENABLED === "true", "production must use entries API");
  assert(process.env.NEXT_PUBLIC_CLOSEOUTS_API_ENABLED === "true", "production must use closeouts API");
  assert(process.env.ALLOW_HEADER_AUTH_CONTEXT === "false", "production must not allow header auth fallback");
}

function collectSetCookies(response) {
  if (typeof response.headers.getSetCookie === "function") return response.headers.getSetCookie();
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
    throw new Error(`${init?.method || "GET"} ${url} -> ${response.status}: ${JSON.stringify(data)}`);
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
  if (cookie) return { "content-type": "application/json", cookie };
  return headerAuthHeaders(role, userId);
}

async function loginSession(role) {
  const payload = role === "owner"
    ? (ownerPhone
      ? { mode: "owner_phone_password", phone: ownerPhone, password: ownerPassword }
      : { mode: "owner_password", username: ownerUsername, password: ownerPassword })
    : (employeePhone
      ? { mode: "employee_phone_pin", phone: employeePhone, pin: employeePin }
      : { mode: "employee_pin", employeeId, pin: employeePin });

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
    throw new Error(`POST /api/v1/auth/session (${role}) -> ${response.status}: ${JSON.stringify(data)}`);
  }

  const cookie = cookieHeaderFromSetCookies(collectSetCookies(response));
  if (!cookie) throw new Error(`POST /api/v1/auth/session (${role}) succeeded but no Set-Cookie header was returned.`);
  sessionCookies[role] = cookie;
}

async function ensureSessionAuthIfNeeded() {
  const probe = await fetch(`${baseUrl}/api/v1/stores/${storeId}/closeouts`, {
    method: "GET",
    headers: headerAuthHeaders("employee", employeeUserId),
  });
  const raw = await probe.text();
  if (probe.ok) return;

  let payload = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = raw;
  }

  const message = typeof payload?.error?.message === "string" ? payload.error.message : "";
  if (probe.status !== 400 || !message.includes("Session cookie is required")) {
    throw new Error(`GET closeouts probe -> ${probe.status}: ${raw}`);
  }

  console.log("Session auth required - logging in as employee and owner...");
  await loginSession("employee");
  await loginSession("owner");
}

async function submitCloseout({
  closeoutId,
  date,
  amountHalalas = 30000,
  outflows = [],
  mode = "submit",
  role = "employee",
  userId = employeeUserId,
  targetStoreId = storeId,
}) {
  return callJson(`${baseUrl}/api/v1/stores/${targetStoreId}/closeouts`, {
    method: "POST",
    headers: requestHeaders(role, userId),
    body: JSON.stringify({
      mode,
      closeoutId,
      date,
      salesChannels: amountHalalas > 0 ? [{ salesChannelId, channelName: "Cash", amountHalalas }] : [],
      outflows,
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

async function getDaySummary(date) {
  return callJson(`${baseUrl}/api/v1/stores/${storeId}/summary/day?date=${date}`, {
    method: "GET",
    headers: requestHeaders("owner", ownerUserId),
  });
}

async function getMonthSummary(month) {
  return callJson(`${baseUrl}/api/v1/stores/${storeId}/summary/month?month=${month}`, {
    method: "GET",
    headers: requestHeaders("owner", ownerUserId),
  });
}

async function getDaysReport(from, to) {
  const query = new URLSearchParams({ storeId, from, to });
  return callJson(`${baseUrl}/api/v1/reports/days?${query}`, {
    method: "GET",
    headers: requestHeaders("owner", ownerUserId),
  });
}

async function getOutflowReport(from, to) {
  const query = new URLSearchParams({
    storeId,
    from,
    to,
    includeTransactions: "true",
  });
  return callJson(`${baseUrl}/api/v1/reports/outflow?${query}`, {
    method: "GET",
    headers: requestHeaders("owner", ownerUserId),
  });
}

async function getRegisterEntries(date) {
  return listEntries({
    status: "active",
    dateFrom: date,
    dateTo: date,
    role: "owner",
    userId: ownerUserId,
  });
}

async function listEntries({
  targetStoreId = storeId,
  status = "active",
  dateFrom = "",
  dateTo = "",
  role = "owner",
  userId = ownerUserId,
  limit = 100,
} = {}) {
  const items = [];
  let cursor = "";
  let pageCount = 0;
  do {
    pageCount += 1;
    assert(pageCount <= 500, "entries pagination exceeded safety bound");
    const query = new URLSearchParams({
      status,
      limit: String(limit),
    });
    if (dateFrom) query.set("dateFrom", dateFrom);
    if (dateTo) query.set("dateTo", dateTo);
    if (cursor) query.set("cursor", cursor);
    const page = await callJson(`${baseUrl}/api/v1/stores/${targetStoreId}/entries?${query}`, {
      method: "GET",
      headers: requestHeaders(role, userId),
    });
    assert(page && typeof page === "object" && Array.isArray(page.items), "entries list must return { items, nextCursor }");
    items.push(...page.items);
    cursor = typeof page.nextCursor === "string" ? page.nextCursor : "";
  } while (cursor);
  return items;
}

function summarizeRegisterEntries(entries) {
  return (Array.isArray(entries) ? entries : []).reduce((totals, entry) => {
    const amount = Number(entry?.amountHalalas ?? Math.round(Number(entry?.amount || 0) * 100));
    if (entry?.type === "summary") totals.sales += amount;
    if (["purchases", "expense", "withdrawal"].includes(String(entry?.type))) totals.outflow += amount;
    totals.net = totals.sales - totals.outflow;
    return totals;
  }, { sales: 0, outflow: 0, net: 0 });
}

async function expectBlockedEmployeeStoreAccess() {
  const response = await fetch(`${baseUrl}/api/v1/stores/${unauthorizedStoreId}/entries?status=active&limit=1`, {
    method: "GET",
    headers: requestHeaders("employee", employeeUserId),
  });
  assert(response.status === 403, `expected 403 for employee unauthorized store, got ${response.status}`);
}

async function resolveArchivedStoreForCheck() {
  if (archivedStoreId) return archivedStoreId;
  if (!createArchivedStoreForCheck) return "";

  const created = await callJson(`${baseUrl}/api/v1/stores`, {
    method: "POST",
    headers: requestHeaders("owner", ownerUserId),
    body: JSON.stringify({
      name: `P0 archived check ${randomUUID().slice(0, 8)}`,
      location: "P0 smoke",
    }),
  });
  const nextStoreId = created?.store?.id || created?.id;
  assert(nextStoreId, "archived-store smoke could not create a temporary store");

  await callJson(`${baseUrl}/api/v1/stores/${nextStoreId}`, {
    method: "PATCH",
    headers: requestHeaders("owner", ownerUserId),
    body: JSON.stringify({ status: "archived", reason: "p0_smoke_archived_write_guard" }),
  });
  return nextStoreId;
}

async function expectArchivedStoreRejectsCloseout(date) {
  const targetStoreId = await resolveArchivedStoreForCheck();
  if (!targetStoreId) {
    console.log("12) Archived-store write guard skipped (set CHECK_ARCHIVED_STORE_ID or CHECK_CREATE_ARCHIVED_STORE=true).");
    return;
  }
  const response = await fetch(`${baseUrl}/api/v1/stores/${targetStoreId}/closeouts`, {
    method: "POST",
    headers: requestHeaders("owner", ownerUserId),
    body: JSON.stringify({
      mode: "submit",
      closeoutId: `check-arch-${randomUUID().slice(0, 8)}`,
      date,
      salesChannels: [{ salesChannelId, channelName: "Cash", amountHalalas: 1000 }],
      outflows: [],
      note: "archived store should reject closeout",
    }),
  });
  assert(response.status === 403, `expected 403 for archived store closeout save, got ${response.status}`);
}

async function main() {
  assertProductionNoBrowserFinancialFallback();
  const date = process.env.CHECK_DATE || businessDateInRiyadh();
  const month = date.slice(0, 7);
  const monthWindow = monthRange(month);
  const closeoutA = `check-a-${randomUUID().slice(0, 8)}`;
  const closeoutB = `check-b-${randomUUID().slice(0, 8)}`;
  const closeoutEdit = `check-e-${randomUUID().slice(0, 8)}`;
  const closeoutWithAttachments = `check-att-${randomUUID().slice(0, 8)}`;

  console.log(`Target: ${baseUrl}`);
  console.log(`Business date (Asia/Riyadh): ${date}\n`);

  await ensureSessionAuthIfNeeded();

  console.log("1) Employee submit closeout A...");
  const submitA = await submitCloseout({ closeoutId: closeoutA, date, amountHalalas: 31000 });
  assert(submitA?.daySequence >= 1, "closeout A missing daySequence");

  console.log("2) Duplicate same closeoutId returns the existing result...");
  const duplicateA = await submitCloseout({ closeoutId: closeoutA, date, amountHalalas: 31000 });
  assert(duplicateA?.dailyCloseoutId === submitA?.dailyCloseoutId, "duplicate closeout did not return the original dailyCloseoutId");

  console.log("3) Same closeoutId with different content is rejected clearly...");
  const changedDuplicate = await fetch(`${baseUrl}/api/v1/stores/${storeId}/closeouts`, {
    method: "POST",
    headers: requestHeaders("employee", employeeUserId),
    body: JSON.stringify({
      mode: "submit",
      closeoutId: closeoutA,
      date,
      salesChannels: [{ salesChannelId, channelName: "Cash", amountHalalas: 31999 }],
      outflows: [],
      note: "duplicate should fail",
    }),
  });
  assert(changedDuplicate.status === 400, `expected 400 for changed duplicate closeoutId, got ${changedDuplicate.status}`);

  console.log("4) Employee submit closeout B (same day)...");
  const submitB = await submitCloseout({ closeoutId: closeoutB, date, amountHalalas: 32000 });
  assert(submitB?.daySequence > submitA.daySequence, `expected B sequence > A (${submitA.daySequence} vs ${submitB.daySequence})`);

  console.log("5) Owner lists closeouts and sees A & B...");
  const ownerList = await listCloseouts("owner", ownerUserId);
  assert(findCloseout(ownerList, closeoutA), "owner list missing closeout A");
  assert(findCloseout(ownerList, closeoutB), "owner list missing closeout B");

  console.log("6) Owner edit via resubmit...");
  await submitCloseout({ closeoutId: closeoutEdit, date, amountHalalas: 33000 });
  await submitCloseout({
    closeoutId: closeoutEdit,
    date,
    amountHalalas: 34000,
    mode: "resubmit",
    role: "owner",
    userId: ownerUserId,
  });
  const edited = findCloseout(await listCloseouts("owner", ownerUserId), closeoutEdit);
  assert(edited?.status === "reviewed", `expected reviewed after owner edit, got ${edited?.status}`);

  console.log("7) Employee resubmit must be forbidden...");
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

  console.log("8) Multiple outflow attachments must not duplicate outflow amount...");
  const beforeAttachmentSummary = summaryShape(await getDaySummary(date));
  await submitCloseout({
    closeoutId: closeoutWithAttachments,
    date,
    amountHalalas: 36000,
    outflows: [{
      type: "expense",
      amountHalalas: 1234,
      note: "attachment double-count guard",
      attachments: [
        { kind: "image", name: "one.png", mimeType: "image/png", sizeBytes: 68, dataUrl: tinyPngDataUrl },
        { kind: "image", name: "two.png", mimeType: "image/png", sizeBytes: 68, dataUrl: tinyPngDataUrl },
      ],
    }],
  });
  const afterAttachmentSummary = summaryShape(await getDaySummary(date));
  assert(afterAttachmentSummary.sales - beforeAttachmentSummary.sales === 36000, "attachment smoke sales delta mismatch");
  assert(afterAttachmentSummary.outflow - beforeAttachmentSummary.outflow === 1234, "multiple attachments duplicated or lost outflow amount");
  const outflowReport = await getOutflowReport(date, date);
  assert(amountHalalas(outflowReport?.totalOutflow) === afterAttachmentSummary.outflow, "outflow report total does not match day summary");

  console.log("9) Home/day report/register all match the server source...");
  const daySummary = summaryShape(await getDaySummary(date));
  const dayReport = await getDaysReport(date, date);
  const dayRow = Array.isArray(dayReport?.days) ? dayReport.days.find((row) => row.date === date) : null;
  assert(dayRow, "day report missing business date row");
  assertSameFinancials(daySummary, summaryShape(dayRow), "home day summary vs day report");
  const registerEntries = await getRegisterEntries(date);
  assertSameFinancials(daySummary, summarizeRegisterEntries(registerEntries), "register entries vs day summary");

  console.log("10) Month report equals sum of report days...");
  const monthSummary = summaryShape(await getMonthSummary(month));
  const monthDays = await getDaysReport(monthWindow.from, monthWindow.to);
  const monthFromDays = (Array.isArray(monthDays?.days) ? monthDays.days : []).reduce((totals, row) => {
    const shape = summaryShape(row);
    totals.sales += shape.sales;
    totals.outflow += shape.outflow;
    totals.net += shape.net;
    return totals;
  }, { sales: 0, outflow: 0, net: 0 });
  assertSameFinancials(monthSummary, monthFromDays, "month summary vs sum of days");

  console.log("11) Employee cannot access an unauthorized store...");
  await expectBlockedEmployeeStoreAccess();

  console.log("12) Archived store must reject closeout save...");
  await expectArchivedStoreRejectsCloseout(date);

  console.log("13) Standalone entry POST without closeoutId must fail...");
  const standaloneResponse = await fetch(`${baseUrl}/api/v1/stores/${storeId}/entries`, {
    method: "POST",
    headers: requestHeaders("owner", ownerUserId),
    body: JSON.stringify({ date, type: "expense", amountHalalas: 5000 }),
  });
  assert(standaloneResponse.status === 400, `expected 400 for standalone entry, got ${standaloneResponse.status}`);

  console.log("14) Active entries list excludes orphan rows without closeoutId...");
  const activeEntries = await listEntries({ status: "active", role: "owner", userId: ownerUserId });
  const orphanLike = activeEntries.filter((item) => !item?.closeoutId);
  assert(orphanLike.length === 0, `expected no active list entries without closeoutId, got ${orphanLike.length}`);

  console.log("\n✅ DB source-unification P0 smoke passed.");
}

main().catch((error) => {
  console.error("\n❌ Checklist failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
