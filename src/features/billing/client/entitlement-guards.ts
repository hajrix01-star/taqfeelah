import type { DisplayLang } from "@/core/i18n/display-locale";
import type {
  OrganizationEntitlementUsage,
  ResolvedOrganizationEntitlements,
} from "@/features/billing/types";

export function countEmployeeSeats(usage: OrganizationEntitlementUsage | undefined): number {
  return (usage?.activeEmployees || 0) + (usage?.pendingInvitations || 0);
}

export function canAddStore(entitlements: ResolvedOrganizationEntitlements | null | undefined): boolean {
  if (!entitlements) return true;
  return entitlements.usage.activeStores < entitlements.maxStores;
}

export function canAddEmployeeSeat(entitlements: ResolvedOrganizationEntitlements | null | undefined): boolean {
  if (!entitlements) return true;
  return countEmployeeSeats(entitlements.usage) < entitlements.maxEmployees;
}

export function resolveStoreLimitMessage(
  entitlements: ResolvedOrganizationEntitlements | null | undefined,
  lang: DisplayLang,
): string {
  if (!entitlements) return "";
  return lang === "ar"
    ? `وصلت لحد المحلات في خطتك (${entitlements.maxStores}). رقِّ الخطة لإضافة محلات جديدة.`
    : `Store limit reached (${entitlements.maxStores}). Upgrade your plan to add more stores.`;
}

export function resolveEmployeeLimitMessage(
  entitlements: ResolvedOrganizationEntitlements | null | undefined,
  lang: DisplayLang,
): string {
  if (!entitlements) return "";
  return lang === "ar"
    ? `وصلت لحد الموظفين والدعوات في خطتك (${entitlements.maxEmployees}). رقِّ الخطة أو ألغِ الدعوات المعلّقة.`
    : `Employee limit reached (${entitlements.maxEmployees}). Upgrade your plan or revoke pending invitations.`;
}
