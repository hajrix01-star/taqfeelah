import type { Metadata } from "next";
import { NO_INDEX_ROBOTS } from "@/core/config/seo";
import InviteActivationPage from "@/features/member-invitations/client/InviteActivationPage";

export const metadata: Metadata = {
  title: "دعوة موظف",
  robots: NO_INDEX_ROBOTS,
};

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  return <InviteActivationPage token={token} />;
}
