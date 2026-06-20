import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PLAYWRIGHT_DB_PORT || 3101);
const baseURL = `http://127.0.0.1:${PORT}`;

const SEED_ORG = process.env.E2E_ORGANIZATION_ID || "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1";
const SEED_OWNER = process.env.E2E_OWNER_USER_ID || "e8f3e35b-6051-4da3-8b10-979700c2f00f";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.db.spec.ts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"]],
  timeout: 180_000,
  use: {
    baseURL,
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: `next dev --hostname 127.0.0.1 --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/taqfeelah",
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
      AUTH_SESSION_SECRET: "playwright-db-test-session-secret-32chars",
      AUTH_ORGANIZATION_ID: SEED_ORG,
      AUTH_OWNER_USER_ID: SEED_OWNER,
      NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID: SEED_ORG,
      NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID: SEED_OWNER,
    },
  },
});
