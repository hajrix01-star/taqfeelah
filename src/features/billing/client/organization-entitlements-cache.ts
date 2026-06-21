import type { OrganizationEntitlementsCacheEntry } from "@/features/billing/client/billing-client-types";

const organizationEntitlementsCache = new Map<string, OrganizationEntitlementsCacheEntry>();

export function readOrganizationEntitlementsCache(authKey: string): OrganizationEntitlementsCacheEntry | null {
  if (!authKey) return null;
  return organizationEntitlementsCache.get(authKey) ?? null;
}

export function writeOrganizationEntitlementsCache(
  authKey: string,
  payload: Partial<OrganizationEntitlementsCacheEntry>,
): void {
  if (!authKey) return;
  organizationEntitlementsCache.set(authKey, {
    entitlements: payload?.entitlements ?? null,
    error: typeof payload?.error === "string" ? payload.error : "",
  });
}

export function clearOrganizationEntitlementsCache(authKey = ""): void {
  if (!authKey) {
    organizationEntitlementsCache.clear();
    return;
  }
  organizationEntitlementsCache.delete(authKey);
}
