import type { MetadataRoute } from "next";
import {
  SEO_PRIVATE_ROUTE_PREFIXES,
  SEO_SITE_URL,
  absoluteSiteUrl,
} from "@/core/config/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...SEO_PRIVATE_ROUTE_PREFIXES],
    },
    sitemap: absoluteSiteUrl("/sitemap.xml"),
    host: SEO_SITE_URL,
  };
}
