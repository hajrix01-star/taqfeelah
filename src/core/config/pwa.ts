export const PWA_APP_NAME = "تقفيلة";
export const PWA_SHORT_NAME = "تقفيلة";
export const PWA_DESCRIPTION = "حسبة بدو، لا تعقدها";
export const PWA_SCREENSHOT_TAGLINE = PWA_DESCRIPTION;
export const PWA_MANIFEST_ID = "/";
export const PWA_THEME_COLOR = "#F8F6F0";
export const PWA_BACKGROUND_COLOR = "#F8F6F0";
export const PWA_START_URL = "/app";
export const PWA_SCOPE = "/";
export const PWA_OFFLINE_URL = "/~offline";
export const PWA_LOGIN_URL = "/app";
export const PWA_FORGOT_PASSWORD_URL = "/auth/forgot-password";

export const PWA_SHORTCUTS = [
  {
    name: "الدخول للتطبيق",
    short_name: "التطبيق",
    description: "افتح تقفيلة مباشرة",
    url: PWA_START_URL,
    icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" as const }],
  },
  {
    name: "استعادة كلمة المرور",
    short_name: "كلمة المرور",
    description: "استعد دخولك إلى تقفيلة",
    url: PWA_FORGOT_PASSWORD_URL,
    icons: [{ src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png" as const }],
  },
] as const;

export const PWA_SCREENSHOTS = [
  {
    src: "/screenshots/app-narrow.png",
    sizes: "540x720",
    type: "image/png" as const,
    form_factor: "narrow" as const,
    label: PWA_SCREENSHOT_TAGLINE,
  },
  {
    src: "/screenshots/app-wide.png",
    sizes: "1280x720",
    type: "image/png" as const,
    form_factor: "wide" as const,
    label: PWA_SCREENSHOT_TAGLINE,
  },
] as const;

export const PWA_ICONS = [
  {
    src: "/icons/icon-192.png",
    sizes: "192x192",
    type: "image/png" as const,
  },
  {
    src: "/icons/icon-maskable-192.png",
    sizes: "192x192",
    type: "image/png" as const,
    purpose: "maskable" as const,
  },
  {
    src: "/icons/icon-384.png",
    sizes: "384x384",
    type: "image/png" as const,
  },
  {
    src: "/icons/icon-512.png",
    sizes: "512x512",
    type: "image/png" as const,
  },
  {
    src: "/icons/icon-maskable-512.png",
    sizes: "512x512",
    type: "image/png" as const,
    purpose: "maskable" as const,
  },
] as const;
