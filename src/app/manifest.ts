import type { MetadataRoute } from "next";
import {
  PWA_APP_NAME,
  PWA_BACKGROUND_COLOR,
  PWA_DESCRIPTION,
  PWA_ICONS,
  PWA_SCOPE,
  PWA_SHORTCUTS,
  PWA_SHORT_NAME,
  PWA_START_URL,
  PWA_THEME_COLOR,
} from "@/core/config/pwa";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: PWA_APP_NAME,
    short_name: PWA_SHORT_NAME,
    description: PWA_DESCRIPTION,
    start_url: PWA_START_URL,
    scope: PWA_SCOPE,
    display: "standalone",
    orientation: "portrait",
    dir: "rtl",
    lang: "ar",
    background_color: PWA_BACKGROUND_COLOR,
    theme_color: PWA_THEME_COLOR,
    categories: ["business", "finance"],
    icons: [...PWA_ICONS],
    shortcuts: PWA_SHORTCUTS.map((shortcut) => ({
      ...shortcut,
      icons: shortcut.icons.map((icon) => ({ ...icon })),
    })),
  };
}
