import { describe, expect, it } from "vitest";
import {
  applyDuplicateApprovedAudit,
  applyRestoreToEntry,
  applyReviewToEntry,
  applyVoidToEntry,
  canRestoreOperationalEntry,
  canVoidOperationalEntry,
  duplicateSalesGroupKey,
  duplicateSalesSignature,
  mapOperationalEntryMutation,
  mergeLastCloseoutDateAfterSummaryRestore,
  mergeLastCloseoutDateAfterSummaryVoid,
} from "./operational-entry-mutation-helpers";

const actor = { role: "owner", userId: "owner", nameAr: "محمد", nameEn: "Mohammad" };
const isVoided = (entry: { status?: string }) => entry.status === "voided";
const isActive = (entry: { status?: string }) => entry.status !== "voided";

describe("operational entry mutation helpers", () => {
  it("validates void and restore eligibility", () => {
    const active = { id: "1", businessId: "shami", status: "active" };
    const voided = { id: "2", businessId: "shami", status: "voided" };

    expect(canVoidOperationalEntry(active, [], isVoided)).toBe(true);
    expect(canVoidOperationalEntry(voided, [], isVoided)).toBe(false);
    expect(canVoidOperationalEntry(active, ["shami"], isVoided)).toBe(false);
    expect(canRestoreOperationalEntry(voided, [], isVoided)).toBe(true);
    expect(canRestoreOperationalEntry(active, [], isVoided)).toBe(false);
  });

  it("applies void, restore, and review mutations with audit trail", () => {
    const entry = { id: "1", status: "active", auditTrail: [] };

    const voided = applyVoidToEntry(entry, actor, "mistake", "2026-06-01T10:00:00.000Z");
    expect(voided.status).toBe("voided");
    expect(voided.auditTrail).toHaveLength(1);

    const restored = applyRestoreToEntry(voided, actor, "fix", "2026-06-01T11:00:00.000Z");
    expect(restored.status).toBe("active");
    expect(restored.auditTrail).toHaveLength(2);

    const reviewed = applyReviewToEntry(restored, actor, "2026-06-01T12:00:00.000Z");
    expect(reviewed.reviewed).toBe(true);
    expect(reviewed.auditTrail).toHaveLength(3);
  });

  it("maps entry mutations and duplicate approval audits", () => {
    const entries = [
      { id: "1", auditTrail: [] },
      { id: "2", auditTrail: [] },
    ];

    const next = mapOperationalEntryMutation(entries, "1", (entry) => applyVoidToEntry(entry, actor));
    expect(next[0].status).toBe("voided");
    expect(next[1].status).toBeUndefined();

    const approved = applyDuplicateApprovedAudit(entries, new Set(["2"]), actor, "2026-06-01T10:00:00.000Z");
    const approvedTrail = approved[1].auditTrail as Array<{ action: string }>;
    expect(approvedTrail[0]).toMatchObject({ action: "duplicate_approved" });
    expect(approved[0].auditTrail).toEqual([]);
  });

  it("merges last closeout dates after summary void/restore", () => {
    const entries = [
      { businessId: "shami", type: "summary", date: "2026-06-01", status: "active" },
      { businessId: "shami", type: "summary", date: "2026-06-03", status: "voided" },
    ];

    expect(mergeLastCloseoutDateAfterSummaryVoid(
      { shami: "2026-06-03" },
      "shami",
      entries,
      isActive,
    )).toEqual({ shami: "2026-06-01" });

    expect(mergeLastCloseoutDateAfterSummaryVoid(
      { shami: "2026-06-03", arz: "2026-06-02" },
      "shami",
      [{ businessId: "shami", type: "summary", date: "2026-06-03", status: "voided" }],
      isActive,
    )).toEqual({ arz: "2026-06-02" });

    expect(mergeLastCloseoutDateAfterSummaryRestore(
      {},
      "shami",
      [{ businessId: "shami", type: "summary", date: "2026-06-05", status: "active" }],
      "2026-06-04",
      isActive,
    )).toEqual({ shami: "2026-06-05" });
  });

  it("builds duplicate sales keys and signatures", () => {
    expect(duplicateSalesGroupKey({ businessId: "shami", date: "2026-06-01" })).toBe("shami|2026-06-01");
    expect(duplicateSalesSignature([{ id: "b" }, { id: "a" }])).toBe("a|b");
  });
});
