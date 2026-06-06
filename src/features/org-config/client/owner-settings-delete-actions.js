export function storeHasOperationalRecords(operationalEntries, businessId) {
  return operationalEntries.some((entry) => entry.businessId === businessId);
}

/**
 * @typedef {Object} StaffMember
 * @property {string} id
 * @property {boolean} [active]
 * @property {boolean} [removed]
 * @property {string[]} [storeIds]
 */

/**
 * @param {Object} input
 * @param {StaffMember[]} input.staff
 * @param {string} input.businessId
 * @param {string[]} input.activeBusinessIds
 */
export function listStaffWithoutActiveStoreAfterArchive({ staff, businessId, activeBusinessIds }) {
  return staff.filter((person) => (
    person.active
    && !person.removed
    && (person.storeIds || []).includes(businessId)
    && !(person.storeIds || []).some((id) => id !== businessId && activeBusinessIds.includes(id))
  ));
}

export function removeEmployeePinForPerson(pins, personId) {
  const next = { ...(pins || {}) };
  delete next[personId];
  return next;
}

/**
 * @typedef {Object} OwnerSettingsDeleteApply
 * @property {(businessId: string) => void} [appendArchivedBusinessId]
 * @property {(businessId: string) => void} [removeConfiguredBusiness]
 * @property {(businessId: string) => void} [removeArchivedBusinessId]
 * @property {(businessId: string) => void} [removeStaffStoreId]
 * @property {(businessId: string) => void} [removeLastCloseoutDate]
 * @property {(businessId: string) => void} [setSelectedBusiness]
 * @property {() => void} [clearArchivedReadOnlyBusinessId]
 * @property {(businessId: string) => void} [removeStoreChannelSettings]
 * @property {(businessId: string) => void} [removeStoreOperationalSettings]
 * @property {() => void} [closeStore]
 * @property {(channel: Record<string, unknown>) => void} [retireChannel]
 * @property {(personId: string) => void} [removeStaffMember]
 * @property {(personId: string) => void} [removeEmployeePin]
 */

/**
 * @param {Object} input
 * @param {{ type: string, item: { id: string }, hasRecords?: boolean } | null} input.deleteTarget
 * @param {string} input.selectedBusiness
 * @param {OwnerSettingsDeleteApply} input.apply
 */
export function applyOwnerSettingsDeleteTarget({ deleteTarget, selectedBusiness, apply }) {
  if (!deleteTarget) return;

  if (deleteTarget.type === "archive") {
    apply.appendArchivedBusinessId?.(deleteTarget.item.id);
    apply.closeStore?.();
    return;
  }

  if (deleteTarget.type === "store") {
    if (deleteTarget.hasRecords) {
      apply.appendArchivedBusinessId?.(deleteTarget.item.id);
    } else {
      apply.removeConfiguredBusiness?.(deleteTarget.item.id);
      apply.removeArchivedBusinessId?.(deleteTarget.item.id);
      apply.removeStaffStoreId?.(deleteTarget.item.id);
      apply.removeLastCloseoutDate?.(deleteTarget.item.id);
      if (selectedBusiness === deleteTarget.item.id) {
        apply.setSelectedBusiness?.("all");
      }
      apply.clearArchivedReadOnlyBusinessId?.();
      apply.removeStoreChannelSettings?.(deleteTarget.item.id);
      apply.removeStoreOperationalSettings?.(deleteTarget.item.id);
    }
    apply.closeStore?.();
    return;
  }

  if (deleteTarget.type === "channel") {
    apply.retireChannel?.(deleteTarget.item);
    return;
  }

  if (deleteTarget.type === "staff") {
    apply.removeStaffMember?.(deleteTarget.item.id);
    apply.removeEmployeePin?.(deleteTarget.item.id);
  }
}
