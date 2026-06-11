import type { PlanCode } from "@/features/saas-admin/types";
import type { SaasAdminTranslations } from "@/features/saas-admin/i18n/translations";

function lookupRecord(
  record: Record<string, string>,
  value: string,
  fallback: string,
): string {
  return record[value] ?? fallback;
}

export function formatPlanCode(
  code: PlanCode,
  t: SaasAdminTranslations,
): string {
  if (!code) return "—";
  return lookupRecord(t.plans, code, code);
}

export function formatMemberRole(
  role: string,
  t: SaasAdminTranslations,
): string {
  return lookupRecord(t.roles, role, role);
}

export function formatEntityStatus(
  status: string,
  t: SaasAdminTranslations,
): string {
  return lookupRecord(t.entityStatus, status, status);
}

export function formatCloseoutStatus(
  status: string,
  t: SaasAdminTranslations,
): string {
  return lookupRecord(t.closeoutStatus, status, status);
}

export function formatOperationType(
  type: string,
  t: SaasAdminTranslations,
): string {
  return lookupRecord(t.operationType, type, type);
}
