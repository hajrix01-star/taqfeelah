import { Noto_Sans, Noto_Sans_Arabic } from "next/font/google";

export const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-noto-sans",
  display: "swap",
});

export const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-noto-sans-arabic",
  display: "swap",
});

export const appFontClassNames = `${notoSansArabic.variable} ${notoSans.variable}`;
