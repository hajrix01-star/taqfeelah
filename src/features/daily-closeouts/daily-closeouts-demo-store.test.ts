import { describe, expect, it } from "vitest";
import { CLOSEOUT_STATUS } from "./closeout-status";
import {
  findCloseoutForStoreDate,
  findCloseoutsForStoreDate,
  isCloseoutWorkflowFailure,
  withCloseoutTotals,
} from "./daily-closeouts-demo-store";

describe("withCloseoutTotals status normalization", () => {
  it("promotes inconsistent draft records with submitted metadata to reviewed", () => {
    const closeout = withCloseoutTotals({
      id: "c-1",
      status: CLOSEOUT_STATUS.DRAFT,
      sales: {},
      outflows: [],
      submittedAt: "2026-06-05T00:00:00.000Z",
      submittedByUserId: "user-1",
      submittedByName: "Ahmed",
    });

    expect(closeout.status).toBe(CLOSEOUT_STATUS.REVIEWED);
  });

  it("keeps reviewed status when reviewed metadata exists", () => {
    const closeout = withCloseoutTotals({
      id: "c-2",
      status: CLOSEOUT_STATUS.DRAFT,
      sales: {},
      outflows: [],
      submittedAt: "2026-06-05T00:00:00.000Z",
      reviewedAt: "2026-06-05T00:05:00.000Z",
      reviewedByName: "Owner",
    });

    expect(closeout.status).toBe(CLOSEOUT_STATUS.REVIEWED);
  });

  it("maps legacy returned metadata to reviewed", () => {
    const closeout = withCloseoutTotals({
      id: "c-3",
      status: CLOSEOUT_STATUS.SUBMITTED,
      sales: {},
      outflows: [],
      submittedAt: "2026-06-05T00:00:00.000Z",
      returnedAt: "2026-06-05T00:10:00.000Z",
      returnReason: "Need edit",
    });

    expect(closeout.status).toBe(CLOSEOUT_STATUS.REVIEWED);
  });

  it("treats synced closeouts as reviewed when legacy status is stale", () => {
    const closeout = withCloseoutTotals({
      id: "c-4",
      status: CLOSEOUT_STATUS.DRAFT,
      sales: {},
      outflows: [],
      syncedToEntries: true,
    });

    expect(closeout.status).toBe(CLOSEOUT_STATUS.REVIEWED);
  });
});

describe("findCloseoutsForStoreDate", () => {
  it("returns all closeouts for the same store and date", () => {
    const closeouts = [
      { id: "c1", storeId: "shami", date: "2026-06-06", status: CLOSEOUT_STATUS.REVIEWED, submittedAt: "2026-06-06T08:00:00Z" },
      { id: "c2", storeId: "shami", date: "2026-06-06", status: CLOSEOUT_STATUS.REVIEWED, submittedAt: "2026-06-06T10:00:00Z" },
      { id: "c3", storeId: "arz", date: "2026-06-06", status: CLOSEOUT_STATUS.REVIEWED, submittedAt: "2026-06-06T09:00:00Z" },
    ];

    expect(findCloseoutsForStoreDate(closeouts, "shami", "2026-06-06")).toHaveLength(2);
    expect(findCloseoutForStoreDate(closeouts, "shami", "2026-06-06")?.id).toBe("c2");
  });

  it("prefers an in-progress draft over submitted closeouts", () => {
    const closeouts = [
      { id: "c1", storeId: "shami", date: "2026-06-06", status: CLOSEOUT_STATUS.REVIEWED, submittedAt: "2026-06-06T10:00:00Z" },
      { id: "c2", storeId: "shami", date: "2026-06-06", status: CLOSEOUT_STATUS.DRAFT, submittedAt: null },
    ];

    expect(findCloseoutForStoreDate(closeouts, "shami", "2026-06-06")?.id).toBe("c2");
  });
});

describe("isCloseoutWorkflowFailure", () => {
  it("detects save and send workflow failures", () => {
    expect(isCloseoutWorkflowFailure({ ok: false, phase: "save" })).toBe(true);
    expect(isCloseoutWorkflowFailure({ ok: false, phase: "send" })).toBe(true);
    expect(isCloseoutWorkflowFailure({ id: "c-1", status: CLOSEOUT_STATUS.DRAFT })).toBe(false);
    expect(isCloseoutWorkflowFailure(null)).toBe(false);
  });
});
