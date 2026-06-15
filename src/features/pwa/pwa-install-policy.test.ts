import { describe, expect, it } from "vitest";
import {
  isPwaInstallPath,
  PWA_INSTALL_DISMISS_COOLDOWN_MS,
  shouldShowPwaInstallPrompt,
} from "@/features/pwa/pwa-install-policy";

describe("pwa install policy", () => {
  const base = {
    pathname: "/app",
    isStandalone: false,
    platform: "android" as const,
    hasDeferredInstallPrompt: true,
    dismissedAt: null,
    now: 1_700_000_000_000,
  };

  it("allows install paths only", () => {
    expect(isPwaInstallPath("/app")).toBe(true);
    expect(isPwaInstallPath("/")).toBe(true);
    expect(isPwaInstallPath("/saas-admin/login")).toBe(false);
  });

  it("hides when already installed", () => {
    expect(shouldShowPwaInstallPrompt({ ...base, isStandalone: true })).toBe(false);
  });

  it("shows on android when deferred prompt exists", () => {
    expect(shouldShowPwaInstallPrompt(base)).toBe(true);
  });

  it("shows on ios even without deferred prompt", () => {
    expect(
      shouldShowPwaInstallPrompt({
        ...base,
        platform: "ios",
        hasDeferredInstallPrompt: false,
      }),
    ).toBe(true);
  });

  it("hides on desktop without deferred prompt", () => {
    expect(
      shouldShowPwaInstallPrompt({
        ...base,
        platform: "desktop",
        hasDeferredInstallPrompt: false,
      }),
    ).toBe(false);
  });

  it("respects dismiss cooldown", () => {
    expect(
      shouldShowPwaInstallPrompt({
        ...base,
        dismissedAt: base.now - PWA_INSTALL_DISMISS_COOLDOWN_MS + 1_000,
      }),
    ).toBe(false);
  });
});
