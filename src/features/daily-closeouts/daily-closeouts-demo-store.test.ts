import { describe, expect, it } from "vitest";
import { CLOSEOUT_STATUS } from "./closeout-status";
import { withCloseoutTotals } from "./daily-closeouts-demo-store";

describe("withCloseoutTotals status normalization", () => {
  it("promotes inconsistent draft records with submitted metadata to submitted", () => {
    const closeout = withCloseoutTotals({
      id: "c-1",
      status: CLOSEOUT_STATUS.DRAFT,
      sales: {},
      outflows: [],
      submittedAt: "2026-06-05T00:00:00.000Z",
      submittedByUserId: "user-1",
      submittedByName: "Ahmed",
    });

    expect(closeout.status).toBe(CLOSEOUT_STATUS.SUBMITTED);
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

  it("keeps returned status when returned metadata exists", () => {
    const closeout = withCloseoutTotals({
      id: "c-3",
      status: CLOSEOUT_STATUS.SUBMITTED,
      sales: {},
      outflows: [],
      submittedAt: "2026-06-05T00:00:00.000Z",
      returnedAt: "2026-06-05T00:10:00.000Z",
      returnReason: "Need edit",
    });

    expect(closeout.status).toBe(CLOSEOUT_STATUS.RETURNED);
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
