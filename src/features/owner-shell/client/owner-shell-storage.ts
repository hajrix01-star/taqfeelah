import { readLocalStorageJson } from "@/core/client/safe-local-storage";
import { isBrowserPersistentStorageAllowed } from "@/core/config/browser-persistence-policy";
import type { CloseoutAlertItem } from "@/features/owner-shell/client/owner-shell-client-types";

export const CLOSEOUT_ALERTS_STORAGE_KEY = "taqfeelah_closeout_alerts_v1";
export const ACKNOWLEDGED_DUPLICATE_SALES_STORAGE_KEY = "taqfeelah_acknowledged_duplicate_sales_v1";

export function readAcknowledgedDuplicateSales(bindsToServerAuth: boolean): Record<string, string> {
  if (bindsToServerAuth) return {};
  if (!isBrowserPersistentStorageAllowed({ scope: "ui-preferences" })) return {};
  if (typeof window === "undefined") return {};
  const stored = readLocalStorageJson<Record<string, string> | null>(ACKNOWLEDGED_DUPLICATE_SALES_STORAGE_KEY, null);
  return stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
}

export function readCloseoutAlerts(bindsToServerAuth: boolean): CloseoutAlertItem[] {
  if (bindsToServerAuth) return [];
  if (!isBrowserPersistentStorageAllowed({ scope: "ui-preferences" })) return [];
  if (typeof window === "undefined") return [];
  const stored = readLocalStorageJson<CloseoutAlertItem[] | null>(CLOSEOUT_ALERTS_STORAGE_KEY, []);
  return Array.isArray(stored) ? stored : [];
}

export function writeCloseoutAlerts(alerts: CloseoutAlertItem[], bindsToServerAuth: boolean): void {
  if (bindsToServerAuth) return;
  if (!isBrowserPersistentStorageAllowed({ scope: "ui-preferences" })) return;
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLOSEOUT_ALERTS_STORAGE_KEY, JSON.stringify(alerts));
}

export function writeAcknowledgedDuplicateSales(
  value: Record<string, string>,
  bindsToServerAuth: boolean,
): void {
  if (bindsToServerAuth) return;
  if (!isBrowserPersistentStorageAllowed({ scope: "ui-preferences" })) return;
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACKNOWLEDGED_DUPLICATE_SALES_STORAGE_KEY, JSON.stringify(value));
}
