import { describe, expect, it } from "vitest";
import {
  closeoutOwnerEditLabel,
  resolveCloseoutOwnerEditMeta,
  resolveCloseoutOwnerEditMetaFromEntries,
  resolveSelectedCloseoutOwnerEditSource,
} from "./closeout-owner-edit-display";

describe("closeout owner edit display", () => {
  it("resolves owner edit meta when timestamp exists", () => {
    expect(resolveCloseoutOwnerEditMeta({
      ownerEditedAt: "2026-06-11T10:00:00.000Z",
      ownerEditedByName: "Owner",
    })).toEqual({
      ownerEditedAt: "2026-06-11T10:00:00.000Z",
      ownerEditedByUserId: null,
      ownerEditedByName: "Owner",
    });
  });

  it("reads owner edit meta from operational entries", () => {
    const meta = resolveCloseoutOwnerEditMetaFromEntries([
      { closeoutOwnerEditedAt: "2026-06-11T10:00:00.000Z", closeoutOwnerEditedByName: "Ahmed" },
    ]);
    expect(meta?.ownerEditedByName).toBe("Ahmed");
  });

  it("picks the latest owner edit meta from operational entries", () => {
    const meta = resolveCloseoutOwnerEditMetaFromEntries([
      { closeoutOwnerEditedAt: "2026-06-11T10:00:00.000Z", closeoutOwnerEditedByName: "Ahmed" },
      { closeoutOwnerEditedAt: "2026-06-11T12:00:00.000Z", closeoutOwnerEditedByName: "Owner" },
    ]);
    expect(meta?.ownerEditedByName).toBe("Owner");
  });

  it("prefers fresher closeout metadata over a frozen entry snapshot", () => {
    const selected = {
      closeoutOwnerEditedAt: "2026-06-11T10:00:00.000Z",
      closeoutOwnerEditedByName: "Ahmed",
    };
    const closeouts = [{
      ownerEditedAt: "2026-06-11T12:00:00.000Z",
      ownerEditedByName: "Owner",
    }];
    const meta = resolveSelectedCloseoutOwnerEditSource(
      selected,
      closeouts,
      () => closeouts[0],
    );
    expect(meta?.ownerEditedByName).toBe("Owner");
  });

  it("builds Arabic owner edit label", () => {
    expect(closeoutOwnerEditLabel({
      ownerEditedAt: "2026-06-11T10:00:00.000Z",
      ownerEditedByName: "Khalid",
    }, "ar")).toBe("تم التعديل من قبل المالك (Khalid)");
  });
});
