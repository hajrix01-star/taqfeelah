import AccountSetupPage from "@/features/account-setup/client/AccountSetupPage";

type SetupPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function SetupPage({ searchParams }: SetupPageProps) {
  const { token = "" } = await searchParams;
  return <AccountSetupPage token={token} />;
}
