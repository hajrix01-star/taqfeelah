import {
  safeGetLocalStorageItem,
  safeRemoveLocalStorageItem,
  safeSetLocalStorageItem,
} from "@/core/client/safe-local-storage";

const DISMISSED_AT_KEY = "taqfeelah:pwa-install-dismissed-at";

export function readPwaInstallDismissedAt(): number | null {
  const raw = safeGetLocalStorageItem(DISMISSED_AT_KEY, { scope: "ui-preferences" });
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function rememberPwaInstallDismissed(at = Date.now()): void {
  safeSetLocalStorageItem(DISMISSED_AT_KEY, String(at), { scope: "ui-preferences" });
}

export function clearPwaInstallDismissed(): void {
  safeRemoveLocalStorageItem(DISMISSED_AT_KEY, { scope: "ui-preferences" });
}
