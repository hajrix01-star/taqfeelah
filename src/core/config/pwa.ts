export const PWA_APP_NAME = "تقفيلة";
export const PWA_SHORT_NAME = "تقفيلة";
export const PWA_DESCRIPTION =
  "تقفيلة — متابعة تشغيل يومية للمحلات (الداخل − الخارج = الناتج).";
export const PWA_THEME_COLOR = "#F8F6F0";
export const PWA_BACKGROUND_COLOR = "#F8F6F0";
export const PWA_START_URL = "/app";
export const PWA_SCOPE = "/";
export const PWA_OFFLINE_URL = "/~offline";

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
