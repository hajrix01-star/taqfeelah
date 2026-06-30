import { withPublicApiRouteNoParams } from "@/core/http/api-route-handler";
import { validateAccountSetupToken } from "@/features/account-setup/server/validate-account-setup-token";

export const dynamic = "force-dynamic";

export const GET = withPublicApiRouteNoParams(async ({ searchParams }) => {
  const token = searchParams.get("token") || "";
  const preview = await validateAccountSetupToken({ token });
  return {
    purpose: preview.purpose,
    phoneNumber: preview.phoneNumber,
    ownerName: preview.ownerName,
    organizationName: preview.organizationName,
    expiresAt: preview.expiresAt,
  };
});
