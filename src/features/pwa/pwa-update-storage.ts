import {
  safeGetSessionStorageItem,
  safeRemoveSessionStorageItem,
  safeSetSessionStorageItem,
} from "@/core/client/safe-local-storage";

const DISMISSED_BUILD_KEY = "taqfeelah:pwa-update-dismissed-build";

export function readDismissedUpdateBuild(): string | null {
  const value = safeGetSessionStorageItem(DISMISSED_BUILD_KEY);
  return value?.trim() || null;
}

export function rememberDismissedUpdateBuild(serverBuild: string): void {
  const normalized = serverBuild.trim();
  if (!normalized) return;
  safeSetSessionStorageItem(DISMISSED_BUILD_KEY, normalized);
}

export function clearDismissedUpdateBuild(): void {
  safeRemoveSessionStorageItem(DISMISSED_BUILD_KEY);
}
