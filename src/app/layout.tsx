import type { Metadata, Viewport } from "next";
import {
  PWA_APP_NAME,
  PWA_DESCRIPTION,
  PWA_THEME_COLOR,
} from "@/core/config/pwa";
import { appFontClassNames, notoSansArabic } from "@/core/fonts/app-fonts";
import PwaLifecycle from "@/features/pwa/PwaLifecycle";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: PWA_APP_NAME,
  title: {
    default: PWA_APP_NAME,
    template: `%s — ${PWA_APP_NAME}`,
  },
  description: PWA_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: PWA_APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-180.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: PWA_THEME_COLOR,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" className={appFontClassNames} suppressHydrationWarning>
      <body className={notoSansArabic.className}>
        {children}
        <PwaLifecycle />
      </body>
    </html>
  );
}
