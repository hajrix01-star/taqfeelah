const DISMISSED_AT_KEY = "taqfeelah:pwa-install-dismissed-at";

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readPwaInstallDismissedAt(): number | null {
  if (!canUseLocalStorage()) return null;
  const raw = window.localStorage.getItem(DISMISSED_AT_KEY);
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function rememberPwaInstallDismissed(at = Date.now()): void {
  if (!canUseLocalStorage()) return;
  window.localStorage.setItem(DISMISSED_AT_KEY, String(at));
}

export function clearPwaInstallDismissed(): void {
  if (!canUseLocalStorage()) return;
  window.localStorage.removeItem(DISMISSED_AT_KEY);
}
