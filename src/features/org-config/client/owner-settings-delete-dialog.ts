import type { OwnerSettingsDeleteTarget } from "./org-config-client-types";

export function buildOwnerSettingsDeleteDialog(
  deleteTarget: OwnerSettingsDeleteTarget | null | undefined,
  translate: (key: string) => string,
) {
  if (!deleteTarget) return null;

  if (deleteTarget.type === "archive") {
    return {
      title: translate("archiveStoreTitle"),
      desc: translate("archiveStoreDesc"),
      action: translate("confirmArchive"),
    };
  }

  if (deleteTarget.type === "store") {
    return {
      title: translate(deleteTarget.hasRecords ? "storeDeleteWithDataTitle" : "storeDeleteEmptyTitle"),
      desc: translate(deleteTarget.hasRecords ? "storeDeleteWithDataDesc" : "storeDeleteEmptyDesc"),
      action: translate(deleteTarget.hasRecords ? "archiveAndKeepData" : "deleteEmptyStore"),
    };
  }

  if (deleteTarget.type === "channel") {
    return {
      title: translate("channelDeleteTitle"),
      desc: translate("channelDeleteDesc"),
      action: translate("retireChannel"),
    };
  }

  return {
    title: translate("userDeleteTitle"),
    desc: translate("userDeleteDesc"),
    action: translate("revokeAccess"),
  };
}
