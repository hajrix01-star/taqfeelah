export type PwaInstallPlatform = "ios" | "android" | "desktop" | "unknown";

export function isPwaStandalone(): boolean {
  if (typeof window === "undefined") return false;

  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches
    || window.matchMedia("(display-mode: minimal-ui)").matches
    || navigatorWithStandalone.standalone === true
  );
}

export function detectPwaInstallPlatform(userAgent = ""): PwaInstallPlatform {
  const ua = userAgent || (typeof navigator !== "undefined" ? navigator.userAgent : "");
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isAndroid = /android/i.test(ua);

  if (isIos) return "ios";
  if (isAndroid) return "android";
  if (ua) return "desktop";
  return "unknown";
}

export function isIosInstallableBrowser(userAgent = ""): boolean {
  const ua = userAgent || (typeof navigator !== "undefined" ? navigator.userAgent : "");
  const isIos = /iphone|ipad|ipod/i.test(ua);
  if (!isIos) return false;
  // Chrome/Firefox on iOS still use WebKit; Share sheet install works there too.
  return /safari|crios|fxios|edgios/i.test(ua) || !/android/i.test(ua);
}

export function supportsPwaInstallPrompt(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator;
}
