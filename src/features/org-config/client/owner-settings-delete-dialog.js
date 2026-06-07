/**
 * @typedef {Object} OwnerSettingsDeleteTarget
 * @property {"archive" | "store" | "channel" | "staff"} type
 * @property {{ id: string }} item
 * @property {boolean} [hasRecords]
 * @property {Array<{ nameAr?: string, nameEn?: string }>} [affectedStaff]
 */

/**
 * @param {OwnerSettingsDeleteTarget | null | undefined} deleteTarget
 * @param {(key: string) => string} translate
 */
export function buildOwnerSettingsDeleteDialog(deleteTarget, translate) {
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
