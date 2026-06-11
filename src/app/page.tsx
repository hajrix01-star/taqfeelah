import { redirect } from "next/navigation";
import { resolveServerAuthSession } from "@/features/auth/server/resolve-server-auth-session";
import MarketingPage from "@/features/marketing/MarketingPage";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await resolveServerAuthSession();
  if (session) {
    redirect("/app");
  }

  return <MarketingPage />;
}
