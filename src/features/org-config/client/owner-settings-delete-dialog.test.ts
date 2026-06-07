import { describe, expect, it } from "vitest";
import { buildOwnerSettingsDeleteDialog } from "./owner-settings-delete-dialog";

describe("owner settings delete dialog", () => {
  const translate = (key: string) => key;

  it("returns null when delete target is missing", () => {
    expect(buildOwnerSettingsDeleteDialog(null, translate)).toBeNull();
  });

  it("builds archive dialog copy", () => {
    expect(buildOwnerSettingsDeleteDialog({ type: "archive", item: { id: "shami" } }, translate)).toEqual({
      title: "archiveStoreTitle",
      desc: "archiveStoreDesc",
      action: "confirmArchive",
    });
  });

  it("builds store dialog copy based on records flag", () => {
    expect(buildOwnerSettingsDeleteDialog({
      type: "store",
      item: { id: "shami" },
      hasRecords: true,
    }, translate)?.action).toBe("archiveAndKeepData");

    expect(buildOwnerSettingsDeleteDialog({
      type: "store",
      item: { id: "shami" },
      hasRecords: false,
    }, translate)?.action).toBe("deleteEmptyStore");
  });
});
