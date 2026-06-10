import { randomUUID } from "node:crypto";

function getEnv(name, fallback = "") {
  return process.env[name] || fallback;
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
  const baseUrl = getEnv("CLOSEOUTS_SMOKE_BASE_URL", "http://localhost:3000").replace(/\/$/, "");
  const organizationId = getEnv("CLOSEOUTS_SMOKE_ORGANIZATION_ID", "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1");
  const storeId = getEnv("CLOSEOUTS_SMOKE_STORE_ID", "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c");
  const employeeUserId = getEnv("CLOSEOUTS_SMOKE_EMPLOYEE_USER_ID", "4cf1450d-08d8-4ca1-b180-1c2642174a79");
  const ownerUserId = getEnv("CLOSEOUTS_SMOKE_OWNER_USER_ID", "e8f3e35b-6051-4da3-8b10-979700c2f00f");
  const salesChannelId = getEnv("CLOSEOUTS_SMOKE_SALES_CHANNEL_ID", "9bc40d4f-c773-4ba3-87db-b8bb1467dafb");
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

  const list = await callJson(`${baseUrl}/api/v1/stores/${storeId}/closeouts`, {
    method: "GET",
    headers: {
      ...commonHeaders,
      "x-user-id": ownerUserId,
      "x-member-role": "owner",
    },
  });
  const closeouts = Array.isArray(list?.closeouts) ? list.closeouts : (Array.isArray(list) ? list : []);
  const created = closeouts.find((item) => item.id === closeoutId || item.clientCloseoutId === closeoutId);
  if (!created || created.status !== "reviewed") {
    throw new Error(`Expected auto-approved closeout (status=reviewed), got ${created?.status ?? "not found"}`);
  }
  console.log("Auto-approved OK:", created.status);

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
