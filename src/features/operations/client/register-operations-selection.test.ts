import { describe, expect, it } from "vitest";
import {
  resolveOwnerOperationOpenAction,
  resolveRestoreOperationTarget,
  resolveVoidOperationTarget,
} from "./register-operations-selection";

describe("register operations selection", () => {
  it("resolves void target only for active non-archived entries", () => {
    const entries = [{ id: "e1", businessId: "shami", status: "active" }] as Array<{ id: string; businessId: string; status: string }>;
    const entryIsVoided = (entry: object) => (entry as { status: string }).status === "voided";
    expect(resolveVoidOperationTarget(entries, "e1", [], entryIsVoided)).toEqual(entries[0]);
    expect(resolveVoidOperationTarget(entries, "e1", ["shami"], entryIsVoided)).toBeNull();
  });

  it("opens closeout review for local demo summary entries", () => {
    const action = resolveOwnerOperationOpenAction(
      { type: "summary", closeoutId: "c1" },
      {
        bindsToServerAuth: false,
        closeoutsApiDbSource: false,
        readDailyCloseouts: () => [{ id: "c1", storeId: "shami" }],
      },
    );
    expect(action.kind).toBe("closeout");
    expect(action.closeout?.id).toBe("c1");
  });

  it("resolves restore target for voided entries", () => {
    const entries = [{ id: "e1", businessId: "shami", status: "voided" }] as Array<{ id: string; businessId: string; status: string }>;
    const entryIsVoided = (entry: object) => (entry as { status: string }).status === "voided";
    expect(resolveRestoreOperationTarget(entries, "e1", [], entryIsVoided)).toEqual(entries[0]);
  });
});
