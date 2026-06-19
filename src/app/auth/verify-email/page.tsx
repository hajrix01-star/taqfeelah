import VerifyEmailPage from "@/features/signup/client/VerifyEmailPage";

type VerifyEmailRouteProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifyEmailRoute({ searchParams }: VerifyEmailRouteProps) {
  const params = await searchParams;
  return <VerifyEmailPage token={params.token ?? ""} />;
}
