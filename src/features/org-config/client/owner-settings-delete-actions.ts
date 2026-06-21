import type { StaffMember } from "./org-config-client-types";

export function storeHasOperationalRecords(
  operationalEntries: Array<Record<string, unknown>>,
  businessId: string,
) {
  return operationalEntries.some((entry) => entry.businessId === businessId);
}

export function listStaffWithoutActiveStoreAfterArchive({
  staff,
  businessId,
  activeBusinessIds,
}: {
  staff: StaffMember[];
  businessId: string;
  activeBusinessIds: string[];
}) {
  return staff.filter((person) => (
    person.active
    && !person.removed
    && (person.storeIds || []).includes(businessId)
    && !(person.storeIds || []).some((id) => id !== businessId && activeBusinessIds.includes(id))
  ));
}

export function removeEmployeePinForPerson(
  pins: Record<string, string> | null | undefined,
  personId: string,
) {
  const next = { ...(pins || {}) };
  delete next[personId];
  return next;
}

export type OwnerSettingsDeleteApply = {
  appendArchivedBusinessId?: (businessId: string) => void;
  removeConfiguredBusiness?: (businessId: string) => void;
  removeArchivedBusinessId?: (businessId: string) => void;
  removeStaffStoreId?: (businessId: string) => void;
  removeLastCloseoutDate?: (businessId: string) => void;
  setSelectedBusiness?: (businessId: string) => void;
  clearArchivedReadOnlyBusinessId?: () => void;
  removeStoreChannelSettings?: (businessId: string) => void;
  removeStoreOperationalSettings?: (businessId: string) => void;
  closeStore?: () => void;
  retireChannel?: (channel: Record<string, unknown>) => void;
  removeStaffMember?: (personId: string) => void;
  removeEmployeePin?: (personId: string) => void;
};

export function applyOwnerSettingsDeleteTarget({
  deleteTarget,
  selectedBusiness,
  apply,
}: {
  deleteTarget: {
    type: string;
    item: { id: string };
    hasRecords?: boolean;
  } | null;
  selectedBusiness: string;
  apply: OwnerSettingsDeleteApply;
}) {
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
