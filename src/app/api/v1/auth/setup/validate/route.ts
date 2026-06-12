import { fail, ok } from "@/core/http/api-response";
import { validateAccountSetupToken } from "@/features/account-setup/server/validate-account-setup-token";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token") || "";
    const preview = await validateAccountSetupToken({ token });
    return ok({
      purpose: preview.purpose,
      phoneNumber: preview.phoneNumber,
      ownerName: preview.ownerName,
      organizationName: preview.organizationName,
      expiresAt: preview.expiresAt,
    });
  } catch (error) {
    return fail(error);
  }
}
