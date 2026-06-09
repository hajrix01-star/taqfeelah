import { describe, expect, it, vi } from "vitest";
import { refreshOperationalEntriesBestEffort } from "./refresh-operational-entries-best-effort";

describe("refreshOperationalEntriesBestEffort", () => {
  it("returns refreshed entries when load succeeds", async () => {
    const load = vi.fn().mockResolvedValue([{ id: "entry-1" }]);
    await expect(refreshOperationalEntriesBestEffort(load)).resolves.toEqual({
      refreshed: [{ id: "entry-1" }],
      refreshFailed: false,
    });
  });

  it("does not throw when post-write refresh fails", async () => {
    const load = vi.fn().mockRejectedValue(new Error("entries fetch API returned invalid payload."));
    const result = await refreshOperationalEntriesBestEffort(load);
    expect(result.refreshFailed).toBe(true);
    expect(result.refreshed).toEqual([]);
    expect(result.refreshError).toBeInstanceOf(Error);
  });
});
