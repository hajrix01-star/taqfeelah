import { readLocalStorageJson } from "@/features/demo/prototype-storage";

export const CLOSEOUT_ALERTS_STORAGE_KEY = "taqfeelah_closeout_alerts_v1";
export const ACKNOWLEDGED_DUPLICATE_SALES_STORAGE_KEY = "taqfeelah_acknowledged_duplicate_sales_v1";

export function readAcknowledgedDuplicateSales(bindsToServerAuth) {
  if (bindsToServerAuth) return {};
  if (typeof window === "undefined") return {};
  const stored = readLocalStorageJson(ACKNOWLEDGED_DUPLICATE_SALES_STORAGE_KEY, null);
  return stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
}

export function readCloseoutAlerts(bindsToServerAuth) {
  if (bindsToServerAuth) return [];
  if (typeof window === "undefined") return [];
  const stored = readLocalStorageJson(CLOSEOUT_ALERTS_STORAGE_KEY, []);
  return Array.isArray(stored) ? stored : [];
}

export function writeCloseoutAlerts(alerts, bindsToServerAuth) {
  if (bindsToServerAuth) return;
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLOSEOUT_ALERTS_STORAGE_KEY, JSON.stringify(alerts));
}

export function writeAcknowledgedDuplicateSales(value, bindsToServerAuth) {
  if (bindsToServerAuth) return;
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACKNOWLEDGED_DUPLICATE_SALES_STORAGE_KEY, JSON.stringify(value));
}
