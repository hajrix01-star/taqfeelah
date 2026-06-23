import { describe, expect, it, vi } from "vitest";
import {
  REGISTER_ENTRIES_EXPORT_MAX_PAGE_REQUESTS,
  cursorsMapFromRecord,
  fetchAllRegisterEntriesPages,
} from "./fetch-register-entries-page-bundle";

describe("fetch-register-entries-page-bundle helpers", () => {
  it("builds a cursor map from a plain record", () => {
    const map = cursorsMapFromRecord({ storeA: "cursor-1", storeB: "cursor-2" });
    expect(map.get("storeA")).toBe("cursor-1");
    expect(map.get("storeB")).toBe("cursor-2");
  });

  it("loads all paginated register pages and preserves store/date filters", async () => {
    const fetchPageBundle = vi
      .fn()
      .mockResolvedValueOnce({
        entries: [{ id: "entry-1" }],
        cursors: { storeA: "cursor-1" },
        hasMore: true,
      })
      .mockResolvedValueOnce({
        entries: [{ id: "entry-1" }, { id: "entry-2" }],
        cursors: {},
        hasMore: false,
      });

    const result = await fetchAllRegisterEntriesPages({
      organizationId: "org-1",
      actorUserId: "user-1",
      actorRole: "owner",
      storeIdList: ["storeA"],
      dateFrom: "2026-01-01",
      dateTo: "2026-12-31",
      pageSize: 50,
      fetchPageBundle,
    });

    expect(result.entries).toHaveLength(2);
    expect(fetchPageBundle).toHaveBeenNthCalledWith(1, expect.objectContaining({
      storeIdList: ["storeA"],
      dateFrom: "2026-01-01",
      dateTo: "2026-12-31",
      pageSize: 50,
      replace: true,
    }));
    expect(fetchPageBundle).toHaveBeenNthCalledWith(2, expect.objectContaining({
      storeIdList: ["storeA"],
      dateFrom: "2026-01-01",
      dateTo: "2026-12-31",
      pageSize: 50,
      replace: false,
    }));
  });

  it("throws a clear error when a later page fails", async () => {
    const fetchPageBundle = vi
      .fn()
      .mockResolvedValueOnce({
        entries: [{ id: "entry-1" }],
        cursors: { storeA: "cursor-1" },
        hasMore: true,
      })
      .mockRejectedValueOnce(new Error("page 2 failed"));

    await expect(fetchAllRegisterEntriesPages({
      organizationId: "org-1",
      actorUserId: "user-1",
      actorRole: "owner",
      storeIdList: ["storeA"],
      dateFrom: "2026-06-01",
      dateTo: "2026-06-30",
      pageSize: 50,
      fetchPageBundle,
    })).rejects.toThrow("register entries export load failed: page 2 failed");
  });

  it("throws when pagination exceeds the safety bound", async () => {
    const fetchPageBundle = vi.fn().mockResolvedValue({
      entries: [{ id: "entry-loop" }],
      cursors: { storeA: "cursor-loop" },
      hasMore: true,
    });

    await expect(fetchAllRegisterEntriesPages({
      organizationId: "org-1",
      actorUserId: "user-1",
      actorRole: "owner",
      storeIdList: ["storeA"],
      dateFrom: "2026-06-01",
      dateTo: "2026-06-30",
      pageSize: 50,
      fetchPageBundle,
      maxPageRequests: 2,
    })).rejects.toThrow("register entries export load failed: register entries pagination exceeded safety limit");

    expect(fetchPageBundle).toHaveBeenCalledTimes(2);
    expect(REGISTER_ENTRIES_EXPORT_MAX_PAGE_REQUESTS).toBeGreaterThan(2);
  });
});
