import InviteActivationPage from "@/features/member-invitations/client/InviteActivationPage";

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  return <InviteActivationPage token={token} />;
}
