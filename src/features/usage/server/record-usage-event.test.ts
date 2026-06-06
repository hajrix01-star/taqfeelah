import { afterEach, describe, expect, it, vi } from "vitest";

const insertValues = vi.fn(async () => undefined);

vi.mock("@/core/db/client", () => ({
  getDb: () => ({
    insert: () => ({
      values: insertValues,
    }),
  }),
}));

describe("recordUsageEvent", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    insertValues.mockClear();
  });

  it("no-ops when usage tracking is disabled", async () => {
    vi.stubEnv("USAGE_TRACKING_ENABLED", "");
    const { recordUsageEvent } = await import("./record-usage-event");
    const result = await recordUsageEvent({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      eventName: "entry_created",
      eventDate: "2026-06-06",
    });
    expect(result).toEqual({ recorded: false, reason: "usage_tracking_disabled" });
    expect(insertValues).not.toHaveBeenCalled();
  });

  it("writes usage event when tracking is enabled", async () => {
    vi.stubEnv("USAGE_TRACKING_ENABLED", "true");
    const { recordUsageEvent } = await import("./record-usage-event");
    const result = await recordUsageEvent({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      eventName: "entry_created",
      eventDate: "2026-06-06",
    });
    expect(result).toEqual({ recorded: true });
    expect(insertValues).toHaveBeenCalledTimes(1);
  });
});
