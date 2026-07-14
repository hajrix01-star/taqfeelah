import type { MetadataRoute } from "next";
import { SEO_PUBLIC_ROUTES, absoluteSiteUrl } from "@/core/config/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return SEO_PUBLIC_ROUTES.map((route) => ({
    url: absoluteSiteUrl(route),
    lastModified: now,
    changeFrequency: "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
