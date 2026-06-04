import { randomUUID } from "node:crypto";

function getEnv(name, fallback = "") {
  return process.env[name] || fallback;
}

function required(name) {
  const value = getEnv(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function isoDateNow() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
    throw new Error(`${init?.method || "GET"} ${url} failed (${response.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  const baseUrl = getEnv("CLOSEOUTS_SMOKE_BASE_URL", "https://www.taqfeelah.com").replace(/\/$/, "");
  const organizationId = required("CLOSEOUTS_SMOKE_ORGANIZATION_ID");
  const storeId = required("CLOSEOUTS_SMOKE_STORE_ID");
  const employeeUserId = required("CLOSEOUTS_SMOKE_EMPLOYEE_USER_ID");
  const ownerUserId = required("CLOSEOUTS_SMOKE_OWNER_USER_ID");
  const salesChannelId = required("CLOSEOUTS_SMOKE_SALES_CHANNEL_ID");
  const date = getEnv("CLOSEOUTS_SMOKE_DATE", isoDateNow());

  const closeoutId = `smoke-${date}-${randomUUID().slice(0, 8)}`;
  const commonHeaders = {
    "content-type": "application/json",
    "x-organization-id": organizationId,
  };

  console.log(`Smoke test target: ${baseUrl}`);
  console.log(`closeoutId: ${closeoutId}, date: ${date}`);

  const submit = await callJson(`${baseUrl}/api/v1/stores/${storeId}/closeouts`, {
    method: "POST",
    headers: {
      ...commonHeaders,
      "x-user-id": employeeUserId,
      "x-member-role": "employee",
    },
    body: JSON.stringify({
      mode: "submit",
      closeoutId,
      date,
      salesChannels: [{ salesChannelId, channelName: "Cash", amountHalalas: 25000 }],
      outflows: [{ type: "expense", amountHalalas: 5000, note: "smoke test expense" }],
      note: "Automated smoke submit",
    }),
  });
  console.log("Submit OK:", Boolean(submit));

  const review = await callJson(`${baseUrl}/api/v1/stores/${storeId}/closeouts/${encodeURIComponent(closeoutId)}/review`, {
    method: "POST",
    headers: {
      ...commonHeaders,
      "x-user-id": ownerUserId,
      "x-member-role": "owner",
    },
    body: JSON.stringify({
      action: "approve",
      date,
      reason: "",
    }),
  });
  console.log("Review OK:", Boolean(review));

  const summary = await callJson(`${baseUrl}/api/v1/stores/${storeId}/summary/day?date=${date}`, {
    method: "GET",
    headers: commonHeaders,
  });

  const salesAmount = Number(summary?.totalSales?.amountHalalas ?? 0);
  const outflowAmount = Number(summary?.totalOutflow?.amountHalalas ?? 0);
  if (!Number.isFinite(salesAmount) || !Number.isFinite(outflowAmount)) {
    throw new Error("Summary payload is missing numeric totals.");
  }

  console.log(`Summary OK: sales=${salesAmount}, outflow=${outflowAmount}`);
  console.log("Closeouts smoke test completed successfully.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
