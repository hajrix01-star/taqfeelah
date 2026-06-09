import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PLAYWRIGHT_PORT || 3100);
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
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
      // Prototype smoke runs without PostgreSQL — override .env.development DB-unification flags.
      APP_MODE: "prototype",
      NEXT_PUBLIC_APP_MODE: "prototype",
      NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE: "true",
      NEXT_PUBLIC_CLOSEOUTS_API_ENABLED: "false",
      NEXT_PUBLIC_ENTRIES_API_ENABLED: "false",
      NEXT_PUBLIC_ORG_CONFIG_API_ENABLED: "false",
      NEXT_PUBLIC_PHASE9_API_ENABLED: "false",
      NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED: "false",
      NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE: "false",
    },
  },
});
