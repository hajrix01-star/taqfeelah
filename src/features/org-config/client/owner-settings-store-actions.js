/**
 * @typedef {Object} StoreRecord
 * @property {number} sales
 * @property {number} expense
 * @property {string} ratio
 * @property {number} net
 * @property {number} proofs
 */

/**
 * @param {Object} input
 * @param {string} input.name
 * @param {string} input.location
 * @param {StoreRecord} input.emptyStoreRecord
 * @param {string} [input.id]
 */
export function buildNewConfiguredBusiness({
  name,
  location,
  emptyStoreRecord,
  id,
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

/**
 * @param {Array<Record<string, unknown>>} businesses
 * @param {string} storeId
 * @param {Object} profile
 * @param {string} profile.name
 * @param {string} profile.location
 */
export function applyStoreProfileUpdate(businesses, storeId, { name, location }) {
  const trimmedName = name.trim();
  if (!storeId || !trimmedName) return businesses;

  return businesses.map((business) => (
    business.id === storeId
      ? { ...business, displayName: trimmedName, customLocation: location.trim() }
      : business
  ));
}

/**
 * @param {Record<string, unknown> | null | undefined} store
 * @param {Object} labels
 * @param {string} labels.displayName
 * @param {string} labels.location
 */
export function buildStoreProfileDraft(store, { displayName, location }) {
  return {
    name: store?.displayName || displayName || "",
    location: location || "",
  };
}

/**
 * @param {Record<string, unknown>} settings
 * @param {string} storeId
 * @param {Record<string, unknown> | null | undefined} draft
 */
export function applyPersistedStoreChannelSettings(settings, storeId, draft) {
  if (!storeId || !draft) return settings;
  return { ...settings, [storeId]: draft };
}

/**
 * @param {Record<string, unknown>} settings
 * @param {string} storeId
 * @param {Record<string, unknown> | null | undefined} draft
 */
export function applyPersistedStoreOperationalSettings(settings, storeId, draft) {
  if (!storeId || !draft) return settings;
  return { ...settings, [storeId]: draft };
}

/**
 * @param {Array<{ id: string }>} configuredBusinesses
 * @param {string[]} archivedBusinessIds
 */
export function partitionConfiguredBusinesses(configuredBusinesses, archivedBusinessIds = []) {
  const archivedSet = new Set(archivedBusinessIds);
  return {
    active: configuredBusinesses.filter((business) => !archivedSet.has(business.id)),
    archived: configuredBusinesses.filter((business) => archivedSet.has(business.id)),
  };
}

/**
 * @param {string[]} archivedBusinessIds
 * @param {string} businessId
 */
export function toggleArchivedBusinessId(archivedBusinessIds, businessId) {
  return archivedBusinessIds.includes(businessId)
    ? archivedBusinessIds.filter((id) => id !== businessId)
    : [...archivedBusinessIds, businessId];
}

/**
 * @param {Record<string, unknown>} business
 * @param {Array<Record<string, unknown>>} [affectedStaff]
 */
export function buildArchiveStoreDeleteTarget(business, affectedStaff = []) {
  return { type: "archive", item: business, affectedStaff };
}

/**
 * @param {Record<string, unknown>} business
 * @param {Object} options
 * @param {boolean} options.hasRecords
 * @param {Array<Record<string, unknown>>} [options.affectedStaff]
 */
export function buildRemoveStoreDeleteTarget(business, { hasRecords, affectedStaff = [] }) {
  return { type: "store", item: business, hasRecords, affectedStaff };
}
