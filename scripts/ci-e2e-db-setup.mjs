#!/usr/bin/env node
/**
 * CI helper: migrate + seed PostgreSQL for E2E db-integration job.
 */
import { spawnSync } from "node:child_process";
import process from "node:process";

function run(command, args, env = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

console.log("=== E2E DB setup: migrate ===");
run("pnpm", ["db:migrate"]);

console.log("=== E2E DB setup: seed closeouts foundation ===");
run("node", ["scripts/seed-closeouts-foundation.mjs"]);

console.log("=== E2E DB setup: seed auth credentials ===");
run("node", ["scripts/seed-auth-credentials.mjs"], {
  AUTH_OWNER_USERNAME: process.env.E2E_OWNER_USERNAME || "hajri",
  AUTH_OWNER_PASSWORD: process.env.E2E_OWNER_PASSWORD || "hajri123",
});

console.log("✅ E2E DB setup complete");
