import OwnerResetPasswordPage from "@/features/auth/client/OwnerResetPasswordPage";

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  return <OwnerResetPasswordPage token={params.token || ""} />;
}
