import type { PwaInstallPlatform } from "@/features/pwa/pwa-install-detection";

export const PWA_INSTALL_DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

export const PWA_INSTALL_PATH_PREFIXES = ["/app", "/"] as const;

export type PwaInstallSignals = {
  pathname: string;
  isStandalone: boolean;
  platform: PwaInstallPlatform;
  hasDeferredInstallPrompt: boolean;
  dismissedAt: number | null;
  now?: number;
};

export function isPwaInstallPath(pathname: string): boolean {
  if (pathname === "/app" || pathname === "/") return true;
  return false;
}

export function shouldShowPwaInstallPrompt({
  pathname,
  isStandalone,
  platform,
  hasDeferredInstallPrompt,
  dismissedAt,
  now = Date.now(),
}: PwaInstallSignals): boolean {
  if (!isPwaInstallPath(pathname)) return false;
  if (isStandalone) return false;

  if (dismissedAt && now - dismissedAt < PWA_INSTALL_DISMISS_COOLDOWN_MS) {
    return false;
  }

  if (hasDeferredInstallPrompt) return true;
  return platform === "ios";
}
