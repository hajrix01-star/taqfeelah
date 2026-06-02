import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "تقفيلة",
  description: "تقفيلة — متابعة تشغيل يومية (داخل − خارج = الناتج). بروتوتايب مرئي.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
