/**
 * @typedef {Object} StoreRecord
 * @property {number} sales
 * @property {number} expense
 * @property {string} ratio
 * @property {number} net
 * @property {number} proofs
 * @property {number} pending
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
