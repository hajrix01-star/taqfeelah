#!/usr/bin/env node
/**
 * Pre-launch environment and readiness checklist.
 *
 * Usage:
 *   node scripts/prelaunch-check.mjs
 *   node scripts/prelaunch-check.mjs --env-file .env.production
 *   node scripts/prelaunch-check.mjs --strict   # fail on launch-critical gaps (not Upstash)
 */
import { readFileSync } from "node:fs";
import process from "node:process";

const args = process.argv.slice(2);
const strict = args.includes("--strict");
const envFileIndex = args.indexOf("--env-file");
const envFile = envFileIndex >= 0 ? args[envFileIndex + 1] : null;

function loadEnvFile(path) {
  if (!path) return;
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(envFile);

const errors = [];
const warnings = [];

function requireEnv(key, message = key) {
  const value = process.env[key];
  if (!value || !String(value).trim()) errors.push(`Missing ${message}`);
}

function warnIfMissing(key, message) {
  const value = process.env[key];
  if (!value || !String(value).trim()) warnings.push(message || `Missing ${key}`);
}

function requireTrue(key) {
  if (process.env[key] !== "true") errors.push(`${key} must be true`);
}

function requireProductionMode() {
  if ((process.env.APP_MODE || "local") !== "production") {
    errors.push("APP_MODE=production");
  }
  if ((process.env.NEXT_PUBLIC_APP_MODE || "local") !== "production") {
    errors.push("NEXT_PUBLIC_APP_MODE=production");
  }
}

function requireFalse(key) {
  if (process.env[key] === "true") errors.push(`${key} must be false in production`);
}

// --- Production contract (docs/DATA_SOURCE_UNIFICATION.md) ---
requireEnv("DATABASE_URL");
requireProductionMode();
requireTrue("NEXT_PUBLIC_CLOSEOUTS_API_ENABLED");
requireTrue("NEXT_PUBLIC_ENTRIES_API_ENABLED");
requireTrue("NEXT_PUBLIC_ORG_CONFIG_API_ENABLED");
requireTrue("NEXT_PUBLIC_PHASE9_API_ENABLED");
requireTrue("NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED");
requireTrue("NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE");
requireTrue("NEXT_PUBLIC_AUTH_API_ENABLED");
requireTrue("AUTH_DB_CREDENTIALS_ENABLED");
requireFalse("ALLOW_HEADER_AUTH_CONTEXT");

const sessionSecret = process.env.AUTH_SESSION_SECRET || "";
if (sessionSecret.length < 16) {
  errors.push("AUTH_SESSION_SECRET must be at least 16 characters");
}

warnIfMissing("SAAS_PLATFORM_ADMIN_USER_IDS", "SAAS_PLATFORM_ADMIN_USER_IDS not set — SaaS admin access undefined");

if (strict) {
  if (!process.env.SAAS_PLATFORM_ADMIN_USER_IDS?.trim()) {
    errors.push("SAAS_PLATFORM_ADMIN_USER_IDS is required in strict mode");
  }
}

if (process.env.AUTH_PASSWORD_RESET_ENABLED === "true") {
  if (!process.env.RESEND_API_KEY && !process.env.SMTP_HOST) {
    warnings.push("AUTH_PASSWORD_RESET_ENABLED=true but no RESEND_API_KEY or SMTP_HOST");
  }
  requireEnv("AUTH_EMAIL_FROM");
}

console.log("=== Taqfeelah Pre-Launch Check ===");
console.log(`Mode: ${strict ? "strict" : "standard"}`);
if (envFile) console.log(`Env file: ${envFile}`);
console.log("");

if (warnings.length > 0) {
  console.log("Warnings:");
  for (const item of warnings) console.log(`  ⚠ ${item}`);
  console.log("");
}

if (errors.length > 0) {
  console.log("Errors:");
  for (const item of errors) console.log(`  ✗ ${item}`);
  console.log("");
  console.log("❌ Pre-launch check FAILED");
  process.exit(1);
}

if (strict && warnings.length > 0) {
  console.log("❌ Pre-launch check FAILED (strict mode — warnings treated as errors)");
  process.exit(1);
}

console.log("✅ Pre-launch check PASSED");
if (warnings.length > 0) {
  console.log(`   (${warnings.length} warning(s) — run with --strict to fail on warnings)`);
}

const hasUpstash = Boolean(
  process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
);
if (!hasUpstash) {
  console.log("");
  console.log("ℹ Upstash Redis: optional (owner decision — not required for launch).");
  console.log("  Login rate limiting uses in-memory store (resets on app restart).");
  console.log("  Add UPSTASH_* + AUTH_RATE_LIMIT_REDIS_REQUIRED=true later when scaling.");
}
