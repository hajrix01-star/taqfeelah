import { readLocalStorageJson, safeSetLocalStorageItem } from "@/core/client/safe-local-storage";
import type { CloseoutAlertItem } from "@/features/owner-shell/client/owner-shell-client-types";

export const CLOSEOUT_ALERTS_STORAGE_KEY = "taqfeelah_closeout_alerts_v1";
export const ACKNOWLEDGED_DUPLICATE_SALES_STORAGE_KEY = "taqfeelah_acknowledged_duplicate_sales_v1";

export function readAcknowledgedDuplicateSales(bindsToServerAuth: boolean): Record<string, string> {
  if (bindsToServerAuth) return {};
  const stored = readLocalStorageJson<Record<string, string> | null>(ACKNOWLEDGED_DUPLICATE_SALES_STORAGE_KEY, null, {
    scope: "ui-preferences",
  });
  return stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
}

export function readCloseoutAlerts(bindsToServerAuth: boolean): CloseoutAlertItem[] {
  if (bindsToServerAuth) return [];
  const stored = readLocalStorageJson<CloseoutAlertItem[] | null>(CLOSEOUT_ALERTS_STORAGE_KEY, [], {
    scope: "ui-preferences",
  });
  return Array.isArray(stored) ? stored : [];
}

export function writeCloseoutAlerts(alerts: CloseoutAlertItem[], bindsToServerAuth: boolean): void {
  if (bindsToServerAuth) return;
  safeSetLocalStorageItem(CLOSEOUT_ALERTS_STORAGE_KEY, JSON.stringify(alerts), { scope: "ui-preferences" });
}

export function writeAcknowledgedDuplicateSales(
  value: Record<string, string>,
  bindsToServerAuth: boolean,
): void {
  if (bindsToServerAuth) return;
  safeSetLocalStorageItem(ACKNOWLEDGED_DUPLICATE_SALES_STORAGE_KEY, JSON.stringify(value), {
    scope: "ui-preferences",
  });
}
