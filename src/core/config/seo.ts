const DEFAULT_SITE_URL = "https://taqfeelah.com";

function normalizeSiteUrl(value: string | undefined): string {
  const rawValue = value?.trim();
  if (!rawValue) return DEFAULT_SITE_URL;

  try {
    const url = new URL(rawValue);
    return url.origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const SEO_SITE_URL = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL,
);

export const SEO_SITE_NAME = "تقفيلة";
export const SEO_TITLE = "تقفيلة | متابعة تشغيل يومية للمحلات";
export const SEO_DESCRIPTION =
  "تقفيلة تساعد أصحاب المحلات على متابعة الداخل والخارج والتقفيلات اليومية والتقارير من الجوال ببساطة، بدون تعقيد محاسبي.";
export const SEO_OG_IMAGE = "/opengraph-image.png";

export const SEO_PUBLIC_ROUTES = ["/"] as const;

export const SEO_PRIVATE_ROUTE_PREFIXES = [
  "/app",
  "/api",
  "/auth",
  "/invite",
  "/saas-admin",
  "/signup",
] as const;

export const NO_INDEX_ROBOTS = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
  },
} as const;

export function absoluteSiteUrl(path = "/"): string {
  return new URL(path, SEO_SITE_URL).toString();
}
