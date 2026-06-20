import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PLAYWRIGHT_PORT || 3100);
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  testIgnore: "**/*.db.spec.ts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"]],
  timeout: 120_000,
  use: {
    baseURL,
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: `next dev --hostname 127.0.0.1 --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      APP_MODE: "production",
      NEXT_PUBLIC_APP_MODE: "production",
      NEXT_PUBLIC_CLOSEOUTS_API_ENABLED: "false",
      NEXT_PUBLIC_ENTRIES_API_ENABLED: "false",
      NEXT_PUBLIC_ORG_CONFIG_API_ENABLED: "false",
      NEXT_PUBLIC_PHASE9_API_ENABLED: "false",
      NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED: "false",
      NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE: "true",
      NEXT_PUBLIC_AUTH_API_ENABLED: "true",
      AUTH_DB_CREDENTIALS_ENABLED: "true",
      ALLOW_HEADER_AUTH_CONTEXT: "false",
      NEXT_PUBLIC_SAAS_ADMIN_ENABLED: "true",
      AUTH_SESSION_SECRET: "playwright-test-session-secret-32chars",
    },
  },
});
