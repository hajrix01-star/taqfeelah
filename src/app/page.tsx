import { redirect } from "next/navigation";
import {
  SEO_DESCRIPTION,
  SEO_SITE_NAME,
  absoluteSiteUrl,
} from "@/core/config/seo";
import { resolveServerAuthSession } from "@/features/auth/server/resolve-server-auth-session";
import MarketingPage from "@/features/marketing/MarketingPage";

export const dynamic = "force-dynamic";

const marketingJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SEO_SITE_NAME,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: absoluteSiteUrl("/"),
  description: SEO_DESCRIPTION,
  inLanguage: "ar-SA",
  publisher: {
    "@type": "Organization",
    name: SEO_SITE_NAME,
    url: absoluteSiteUrl("/"),
  },
};

export default async function HomePage() {
  const session = await resolveServerAuthSession();
  if (session) {
    redirect("/app");
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(marketingJsonLd) }}
      />
      <MarketingPage />
    </>
  );
}
