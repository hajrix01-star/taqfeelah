#!/usr/bin/env node
/**
 * Lightweight API latency benchmark for performance fixture data.
 * Targets docs/PERFORMANCE_RULES.md p95 < 500ms for summary + paginated register.
 *
 * Usage:
 *   BENCH_BASE_URL=http://localhost:3000 node scripts/benchmark-api-endpoints.mjs
 *
 * Requires performance fixture (scripts/seed-performance-fixture.mjs --apply) or real tenant data.
 */
const baseUrl = (process.env.BENCH_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const organizationId = process.env.BENCH_ORGANIZATION_ID || "a0000000-0000-4000-8000-000000000001";
const storeId = process.env.BENCH_STORE_ID || "a0000000-0000-4000-8000-000000000101";
const ownerUserId = process.env.BENCH_OWNER_USER_ID || "a0000000-0000-4000-8000-000000000010";
const ownerUsername = process.env.BENCH_OWNER_USERNAME || process.env.CHECK_OWNER_USERNAME || "hajri";
const ownerPassword = process.env.BENCH_OWNER_PASSWORD || process.env.CHECK_OWNER_PASSWORD || "123";
const iterations = Number(process.env.BENCH_ITERATIONS || 20);
const p95BudgetMs = Number(process.env.BENCH_P95_BUDGET_MS || 500);

/** @type {string | null} */
let sessionCookie = null;

function isoDateNow() {
  const date = new Date();
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
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

function requestHeaders() {
  if (sessionCookie) {
    return { cookie: sessionCookie };
  }
  return {
    "x-organization-id": organizationId,
    "x-user-id": ownerUserId,
    "x-member-role": "owner",
  };
}

async function loginIfNeeded() {
  const probe = await fetch(`${baseUrl}/api/v1/auth/session`, { headers: requestHeaders() });
  if (probe.ok) {
    const body = await probe.json().catch(() => null);
    if (body?.authenticated) return;
  }

  const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: ownerUsername,
      password: ownerPassword,
    }),
  });

  if (!response.ok) {
    console.warn("Session login skipped — using header auth context fallback.");
    return;
  }

  sessionCookie = cookieHeaderFromSetCookies(collectSetCookies(response));
}

async function timedFetch(label, url) {
  const started = performance.now();
  const response = await fetch(url, { headers: requestHeaders() });
  const elapsedMs = performance.now() - started;
  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`${label} ${url} → HTTP ${response.status}: ${raw.slice(0, 200)}`);
  }
  return elapsedMs;
}

function percentile(sortedValues, ratio) {
  if (!sortedValues.length) return 0;
  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.ceil(sortedValues.length * ratio) - 1),
  );
  return sortedValues[index];
}

function summarize(label, samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const p50 = percentile(sorted, 0.5);
  const p95 = percentile(sorted, 0.95);
  const p99 = percentile(sorted, 0.99);
  const max = sorted[sorted.length - 1] || 0;
  console.log(
    `${label}: n=${sorted.length} p50=${p50.toFixed(1)}ms `
    + `p95=${p95.toFixed(1)}ms p99=${p99.toFixed(1)}ms max=${max.toFixed(1)}ms`,
  );
  return { p95 };
}

const date = process.env.BENCH_DATE || isoDateNow();
const targets = [
  {
    label: "summary/day",
    url: `${baseUrl}/api/v1/stores/${storeId}/summary/day?date=${date}`,
  },
  {
    label: "entries/paginated",
    url: `${baseUrl}/api/v1/stores/${storeId}/entries?paginated=1&limit=50`,
  },
];

console.log(`Benchmark base=${baseUrl} org=${organizationId} store=${storeId} date=${date}`);
await loginIfNeeded();

const failures = [];

for (const target of targets) {
  const samples = [];
  for (let index = 0; index < iterations; index += 1) {
    samples.push(await timedFetch(target.label, target.url));
  }
  const { p95 } = summarize(target.label, samples);
  if (p95 > p95BudgetMs) {
    failures.push(`${target.label} p95=${p95.toFixed(1)}ms > budget ${p95BudgetMs}ms`);
  }
}

if (failures.length) {
  console.error("\nBenchmark budget exceeded:");
  failures.forEach((line) => console.error(`  - ${line}`));
  process.exit(1);
}

console.log(`\nAll endpoints within p95 budget (${p95BudgetMs}ms).`);
