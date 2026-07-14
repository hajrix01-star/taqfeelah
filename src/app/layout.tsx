import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import {
  PWA_APP_NAME,
  PWA_THEME_COLOR,
} from "@/core/config/pwa";
import {
  SEO_DESCRIPTION,
  SEO_OG_IMAGE,
  SEO_SITE_NAME,
  SEO_SITE_URL,
  SEO_TITLE,
  absoluteSiteUrl,
} from "@/core/config/seo";
import { appFontClassNames } from "@/core/fonts/app-fonts";
import PwaLifecycle from "@/features/pwa/PwaLifecycle";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SEO_SITE_URL),
  applicationName: PWA_APP_NAME,
  title: {
    default: SEO_TITLE,
    template: `%s — ${SEO_SITE_NAME}`,
  },
  description: SEO_DESCRIPTION,
  keywords: [
    "تقفيلة",
    "تقفيل يومية محل",
    "متابعة مبيعات يومية",
    "مصاريف محل",
    "تقرير مبيعات يومي",
    "دفتر مبيعات",
  ],
  alternates: {
    canonical: absoluteSiteUrl("/"),
  },
  openGraph: {
    type: "website",
    locale: "ar_SA",
    url: absoluteSiteUrl("/"),
    siteName: SEO_SITE_NAME,
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    images: [
      {
        url: SEO_OG_IMAGE,
        width: 1280,
        height: 720,
        alt: "واجهة تقفيلة لمتابعة تشغيل المحلات اليومية",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    images: [SEO_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Required for CSP nonce injection on dynamically rendered HTML (Next.js 15).
  await connection();

  return (
    <html lang="ar" className={appFontClassNames} suppressHydrationWarning>
      <body>
        {children}
        <PwaLifecycle />
      </body>
    </html>
  );
}
