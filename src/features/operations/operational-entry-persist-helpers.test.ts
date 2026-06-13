import { describe, expect, it, vi } from "vitest";
import {
  buildEmployeeEntryActor,
  buildPendingDuplicateSummaryState,
  canPersistOperationalEntry,
  findCreatedEntryInRefreshedList,
  persistOperationalEntryLocally,
  persistOperationalEntryThroughApi,
  resolveSummaryLastCloseoutUpdate,
  shouldGateSummarySaveOnDuplicates,
} from "./operational-entry-persist-helpers";

describe("operational entry persist helpers", () => {
  it("validates persist eligibility and duplicate gating", () => {
    expect(canPersistOperationalEntry({
      saving: false,
      payload: { businessId: "shami" },
      allowedBusinessIds: ["shami"],
    })).toBe(true);
    expect(canPersistOperationalEntry({
      saving: true,
      payload: { businessId: "shami" },
      allowedBusinessIds: ["shami"],
    })).toBe(false);

    expect(shouldGateSummarySaveOnDuplicates({ type: "summary" })).toBe(false);
    expect(shouldGateSummarySaveOnDuplicates({ type: "expense" })).toBe(false);
  });

  it("builds employee actor and pending duplicate state", () => {
    expect(buildEmployeeEntryActor({
      id: "ahmed",
      nameAr: "أحمد",
      nameEn: "Ahmed",
    })).toEqual({
      role: "employee",
      userId: "ahmed",
      nameAr: "أحمد",
      nameEn: "Ahmed",
    });

    expect(buildPendingDuplicateSummaryState(
      { businessId: "shami", date: "2026-06-01" },
      [{ id: "1" }],
      "owner",
    )).toEqual({
      payload: { businessId: "shami", date: "2026-06-01" },
      previousEntries: [{ id: "1" }],
      actor: "owner",
    });
  });

  it("resolves summary side effects from refreshed entries", () => {
    const refreshed = [
      { id: "a", businessId: "shami", type: "summary", date: "2026-06-01", status: "active" },
      { id: "b", businessId: "shami", type: "summary", date: "2026-06-03", status: "active" },
    ];
    const isActive = (entry: { status?: string }) => entry.status !== "voided";

    expect(resolveSummaryLastCloseoutUpdate(
      { businessId: "shami", date: "2026-06-02", type: "summary" },
      refreshed,
      "b",
      isActive,
    )).toEqual({
      businessId: "shami",
      date: "2026-06-03",
      createdEntry: refreshed[1],
    });

    expect(findCreatedEntryInRefreshedList(refreshed, "missing")).toBeNull();
  });

  it("persists through api and locally", async () => {
    const createOperationalEntryInApi = vi.fn().mockResolvedValue({ id: "new-1" });
    const loadOperationalEntriesFromApi = vi.fn().mockResolvedValue([{ id: "new-1" }]);

    const apiResult = await persistOperationalEntryThroughApi({
      createOperationalEntryInApi,
      loadOperationalEntriesFromApi,
      payload: { businessId: "shami", type: "expense" },
      actorUserId: "owner",
      actorRole: "owner",
      lang: "en",
    });
    expect(apiResult.ok).toBe(true);

    loadOperationalEntriesFromApi.mockRejectedValueOnce(new Error("entries fetch API returned invalid payload."));
    const refreshFailed = await persistOperationalEntryThroughApi({
      createOperationalEntryInApi,
      loadOperationalEntriesFromApi,
      payload: { businessId: "shami", type: "expense" },
      actorUserId: "owner",
      actorRole: "owner",
      lang: "en",
    });
    expect(refreshFailed.ok).toBe(true);
    expect(refreshFailed.refreshFailed).toBe(true);

    createOperationalEntryInApi.mockResolvedValueOnce(null);
    const failed = await persistOperationalEntryThroughApi({
      createOperationalEntryInApi,
      loadOperationalEntriesFromApi,
      payload: { businessId: "shami" },
      actorUserId: "owner",
      actorRole: "owner",
      lang: "en",
    });
    expect(failed).toEqual({ ok: false, failureMessage: "Failed to save entry on server." });

    const blocked = await persistOperationalEntryThroughApi({
      createOperationalEntryInApi,
      loadOperationalEntriesFromApi,
      payload: { businessId: "shami", type: "expense" },
      actorUserId: "owner",
      actorRole: "owner",
      lang: "ar",
      entriesApiDbSource: true,
    });
    expect(blocked).toEqual({
      ok: false,
      failureMessage: "لا يمكن حفظ داخل أو خارج بدون تقفيلة. افتح «تقفيلاتي» أو اختر تقفيلة أولًا.",
    });
    expect(createOperationalEntryInApi).toHaveBeenCalledTimes(3);

    const buildEntry = vi.fn().mockReturnValue({ id: "local-1", attachment: null });
    const local = await persistOperationalEntryLocally({
      payload: { businessId: "shami" },
      actor: { role: "owner" },
      buildEntry,
      storeAttachmentPayload: vi.fn(),
    });
    expect(local).toEqual({ ok: true, entry: { id: "local-1", attachment: null } });

    buildEntry.mockReturnValueOnce({ id: "local-2", attachment: { id: "att-1" } });
    const storeAttachmentPayload = vi.fn().mockRejectedValue(new Error("fail"));
    const attachmentFailed = await persistOperationalEntryLocally({
      payload: { businessId: "shami" },
      actor: { role: "owner" },
      buildEntry,
      storeAttachmentPayload,
    });
    expect(attachmentFailed).toEqual({ ok: false, attachmentFailed: true });
  });
});
