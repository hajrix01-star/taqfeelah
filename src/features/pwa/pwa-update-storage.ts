const DISMISSED_BUILD_KEY = "taqfeelah:pwa-update-dismissed-build";

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function readDismissedUpdateBuild(): string | null {
  if (!canUseSessionStorage()) return null;
  const value = window.sessionStorage.getItem(DISMISSED_BUILD_KEY);
  return value?.trim() || null;
}

export function rememberDismissedUpdateBuild(serverBuild: string): void {
  if (!canUseSessionStorage()) return;
  const normalized = serverBuild.trim();
  if (!normalized) return;
  window.sessionStorage.setItem(DISMISSED_BUILD_KEY, normalized);
}

export function clearDismissedUpdateBuild(): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(DISMISSED_BUILD_KEY);
}
