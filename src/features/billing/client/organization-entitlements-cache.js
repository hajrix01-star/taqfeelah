/** @type {Map<string, { entitlements: unknown, error: string }>} */
const organizationEntitlementsCache = new Map();

export function readOrganizationEntitlementsCache(authKey) {
  if (!authKey) return null;
  return organizationEntitlementsCache.get(authKey) ?? null;
}

export function writeOrganizationEntitlementsCache(authKey, payload) {
  if (!authKey) return;
  organizationEntitlementsCache.set(authKey, {
    entitlements: payload?.entitlements ?? null,
    error: typeof payload?.error === "string" ? payload.error : "",
  });
}

export function clearOrganizationEntitlementsCache(authKey = "") {
  if (!authKey) {
    organizationEntitlementsCache.clear();
    return;
  }
  organizationEntitlementsCache.delete(authKey);
}
