import AccountDetailsPage from "@/features/saas-admin/client/AccountDetailsPage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SaasAdminAccountDetailsRoute({ params }: PageProps) {
  const { id } = await params;
  return <AccountDetailsPage accountId={id} />;
}
