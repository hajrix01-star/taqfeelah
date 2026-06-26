import { describe, expect, it } from "vitest";
import { CLOSEOUT_STATUS } from "./closeout-status";
import { isLocalDraftCloseout } from "./daily-closeouts-local-store";
import { closeoutDeleteRequestToRecord } from "@/features/closeouts/client/register-closeout-summary-service";

describe("register closeout delete workflow", () => {
  it("does not skip API delete for submitted employee closeouts with dc-* ids", () => {
    expect(isLocalDraftCloseout({
      id: "dc-1781996576905",
      storeId: "shami",
      status: CLOSEOUT_STATUS.REVIEWED,
      submittedAt: "2026-06-21T10:00:00.000Z",
    })).toBe(false);
  });

  it("does not skip API delete for register delete stub records without draft status", () => {
    const stub = closeoutDeleteRequestToRecord({
      closeoutId: "dc-1781996576905",
      storeId: "shami",
      date: "2026-06-21",
    });
    expect(isLocalDraftCloseout(stub as never)).toBe(false);
  });
});
