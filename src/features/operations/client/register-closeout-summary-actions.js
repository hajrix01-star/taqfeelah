import { resolveCloseoutForOperationalEntry } from "./register-operations-selection";

/**
 * @param {{ closeoutId?: string | null }} summary
 * @param {Array<{ id?: string }>} closeouts
 */
export function resolveCloseoutFromRegisterSummary(summary, closeouts = []) {
  if (!summary?.closeoutId) return null;
  return resolveCloseoutForOperationalEntry({ closeoutId: summary.closeoutId }, closeouts);
}

/**
 * @param {{ closeoutId?: string | null, businessId?: string }} summary
 * @param {string[]} archivedBusinessIds
 */
export function canManageRegisterCloseoutSummary(summary, archivedBusinessIds = []) {
  return Boolean(summary?.closeoutId)
    && !archivedBusinessIds.includes(String(summary?.businessId || ""));
}
