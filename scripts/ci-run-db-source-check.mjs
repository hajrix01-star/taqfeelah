#!/usr/bin/env node
/**
 * Start Next.js with production DB flags and run db-source-unification-check.
 */
import { spawn } from "node:child_process";
import process from "node:process";

const PORT = process.env.CHECK_PORT || "3101";
const baseUrl = `http://127.0.0.1:${PORT}`;

const SEED_ORG = process.env.E2E_ORGANIZATION_ID || "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1";
const SEED_OWNER = process.env.E2E_OWNER_USER_ID || "e8f3e35b-6051-4da3-8b10-979700c2f00f";

const serverEnv = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL,
  APP_MODE: "production",
  NEXT_PUBLIC_APP_MODE: "production",
  NEXT_PUBLIC_CLOSEOUTS_API_ENABLED: "true",
  NEXT_PUBLIC_ENTRIES_API_ENABLED: "true",
  NEXT_PUBLIC_ORG_CONFIG_API_ENABLED: "true",
  NEXT_PUBLIC_PHASE9_API_ENABLED: "true",
  NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED: "true",
  NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE: "true",
  NEXT_PUBLIC_AUTH_API_ENABLED: "true",
  AUTH_DB_CREDENTIALS_ENABLED: "true",
  ALLOW_HEADER_AUTH_CONTEXT: "false",
  AUTH_SESSION_SECRET: process.env.AUTH_SESSION_SECRET || "ci-db-source-check-session-secret-32",
  AUTH_SESSION_COOKIE_SECURE: "false",
  AUTH_ORGANIZATION_ID: SEED_ORG,
  AUTH_OWNER_USER_ID: SEED_OWNER,
  NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID: SEED_ORG,
  NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID: SEED_OWNER,
};

async function waitForReady(maxAttempts = 60) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/v1/meta`);
      if (response.ok) return;
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(`Server did not become ready at ${baseUrl}`);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  const server = spawn(
    "pnpm",
    ["exec", "next", "dev", "--hostname", "127.0.0.1", "--port", PORT],
    { stdio: "inherit", env: serverEnv },
  );

  const shutdown = () => {
    server.kill("SIGTERM");
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  try {
    await waitForReady();
    process.env.CHECK_BASE_URL = baseUrl;
    const check = spawn("node", ["scripts/db-source-unification-check.mjs"], {
      stdio: "inherit",
      env: process.env,
    });
    await new Promise((resolve, reject) => {
      check.on("exit", (code) => {
        if (code === 0) resolve(undefined);
        else reject(new Error(`db-source-unification-check exited with ${code}`));
      });
    });
  } finally {
    shutdown();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
