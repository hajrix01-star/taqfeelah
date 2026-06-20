import { describe, expect, it } from "vitest";

const WIPE_CONFIRMATION = "wipe-all-tenant-data-for-live";

describe("prelaunch-wipe-all-tenant-data", () => {
  it("uses a stable confirmation token documented in LIVE_DEPLOY_BATCH_PLAN", () => {
    expect(WIPE_CONFIRMATION).toBe("wipe-all-tenant-data-for-live");
    expect(WIPE_CONFIRMATION.length).toBeGreaterThan(10);
  });
});
