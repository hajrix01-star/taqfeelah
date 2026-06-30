#!/usr/bin/env node
/**
 * Pre-launch gate: strict env check + optional API smoke + manual checklist pointer.
 *
 * Usage:
 *   node scripts/prelaunch-live-gate.mjs --env-file .env.production
 *   CHECK_BASE_URL=https://taqfeelah.app node scripts/prelaunch-live-gate.mjs --env-file .env.production
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import process from "node:process";

const args = process.argv.slice(2);
const envFileIndex = args.indexOf("--env-file");
const envFile = envFileIndex >= 0 ? args[envFileIndex + 1] : null;

function runNodeScript(script, extraArgs = []) {
  const result = spawnSync("node", [script, ...extraArgs], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function expectHttpOk(url) {
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`${url} returned HTTP ${response.status}: ${body.slice(0, 240)}`);
  }
}

console.log("=== Taqfeelah Pre-Launch Live Gate ===");
console.log("");

const skipEnvGate = process.env.CHECK_ENV_GATE_MODE === "skip";
if (skipEnvGate) {
  console.log("Step 1/3: strict environment check skipped (external production gate)");
} else {
  console.log("Step 1/3: strict environment check");
  runNodeScript("scripts/prelaunch-check.mjs", [
    "--strict",
    ...(envFile ? ["--env-file", envFile] : []),
  ]);
}

const baseUrl = process.env.CHECK_BASE_URL?.replace(/\/$/, "");
const productionGate = process.env.APP_MODE === "production" || process.env.NEXT_PUBLIC_APP_MODE === "production";
if (!baseUrl && productionGate) {
  console.error("CHECK_BASE_URL is required for the production live gate.");
  process.exit(1);
}
const skipDbSourceSmoke = process.env.CHECK_DB_SOURCE_SMOKE === "skip";
if (baseUrl && skipDbSourceSmoke) {
  console.log("");
  console.log(`Step 2/3: external HTTPS smoke (${baseUrl})`);
  try {
    await expectHttpOk(`${baseUrl}/api/v1/meta`);
    await expectHttpOk(`${baseUrl}/api/v1/auth/session`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
} else if (baseUrl) {
  console.log("");
  console.log(`Step 2/3: DB source API smoke (${baseUrl})`);
  runNodeScript("scripts/db-source-unification-check.mjs");
} else {
  console.log("");
  console.log("Step 2/3: skipped (set CHECK_BASE_URL to run db-source-unification-check)");
}

console.log("");
console.log("Step 3/3: manual UI checklist");
console.log("  → docs/PRELAUNCH_MANUAL_SMOKE.md");
try {
  const manual = readFileSync("docs/PRELAUNCH_MANUAL_SMOKE.md", "utf8");
  const sections = manual.match(/^## .+$/gm) || [];
  for (const heading of sections.slice(0, 6)) {
    console.log(`  • ${heading.replace(/^## /, "")}`);
  }
} catch {
  console.log("  (manual doc not found)");
}

console.log("");
console.log("✅ Automated live gate passed.");
console.log("Complete manual steps in docs/PRELAUNCH_MANUAL_SMOKE.md before announcing live.");
