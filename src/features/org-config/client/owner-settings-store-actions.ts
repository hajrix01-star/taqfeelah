import type { StoreRecord } from "./org-config-client-types";

export function buildNewConfiguredBusiness({
  name,
  location,
  emptyStoreRecord,
  id,
}: {
  name: string;
  location: string;
  emptyStoreRecord: StoreRecord;
  id?: string;
}) {
  const trimmedName = name.trim();
  if (!trimmedName) return null;

  return {
    id: id || `custom-${Date.now()}`,
    nameAr: trimmedName,
    nameEn: trimmedName,
    customLocation: location.trim(),
    day: { ...emptyStoreRecord },
    month: { ...emptyStoreRecord },
  };
}

export function applyStoreProfileUpdate(
  businesses: Array<Record<string, unknown>>,
  storeId: string,
  { name, location }: { name: string; location: string },
) {
  const trimmedName = name.trim();
  if (!storeId || !trimmedName) return businesses;

  return businesses.map((business) => (
    business.id === storeId
      ? { ...business, displayName: trimmedName, customLocation: location.trim() }
      : business
  ));
}

export function buildStoreProfileDraft(
  store: Record<string, unknown> | null | undefined,
  { displayName, location }: { displayName: string; location: string },
) {
  return {
    name: store?.displayName || displayName || "",
    location: location || "",
  };
}

export function applyPersistedStoreChannelSettings(
  settings: Record<string, unknown>,
  storeId: string,
  draft: Record<string, unknown> | null | undefined,
) {
  if (!storeId || !draft) return settings;
  return { ...settings, [storeId]: draft };
}

export function applyPersistedStoreOperationalSettings(
  settings: Record<string, unknown>,
  storeId: string,
  draft: Record<string, unknown> | null | undefined,
) {
  if (!storeId || !draft) return settings;
  return { ...settings, [storeId]: draft };
}

export function partitionConfiguredBusinesses(
  configuredBusinesses: Array<{ id: string } & Record<string, unknown>>,
  archivedBusinessIds: string[] = [],
) {
  const archivedSet = new Set(archivedBusinessIds);
  return {
    active: configuredBusinesses.filter((business) => !archivedSet.has(business.id)),
    archived: configuredBusinesses.filter((business) => archivedSet.has(business.id)),
  };
}

export function toggleArchivedBusinessId(archivedBusinessIds: string[], businessId: string) {
  return archivedBusinessIds.includes(businessId)
    ? archivedBusinessIds.filter((id) => id !== businessId)
    : [...archivedBusinessIds, businessId];
}

export function buildArchiveStoreDeleteTarget(
  business: Record<string, unknown>,
  affectedStaff: Array<Record<string, unknown>> = [],
) {
  return { type: "archive", item: business, affectedStaff };
}

export function buildRemoveStoreDeleteTarget(
  business: Record<string, unknown>,
  { hasRecords, affectedStaff = [] }: { hasRecords: boolean; affectedStaff?: Array<Record<string, unknown>> },
) {
  return { type: "store", item: business, hasRecords, affectedStaff };
}
