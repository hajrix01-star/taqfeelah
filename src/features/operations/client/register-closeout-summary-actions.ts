import { resolveCloseoutForOperationalEntry } from "./register-operations-selection";
import type { CloseoutRecord, RegisterCloseoutSummaryRef } from "./operations-client-types";

export function resolveCloseoutFromRegisterSummary(
  summary: RegisterCloseoutSummaryRef,
  closeouts: CloseoutRecord[] = [],
): CloseoutRecord | null {
  if (!summary?.closeoutId) return null;
  return resolveCloseoutForOperationalEntry({ closeoutId: summary.closeoutId }, closeouts);
}

export function canManageRegisterCloseoutSummary(
  summary: RegisterCloseoutSummaryRef,
  archivedBusinessIds: string[] = [],
): boolean {
  return Boolean(summary?.closeoutId)
    && !archivedBusinessIds.includes(String(summary?.businessId || ""));
}
