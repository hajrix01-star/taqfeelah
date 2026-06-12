import { fail, ok } from "@/core/http/api-response";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { getPublicMemberInvitation } from "@/features/member-invitations/server/get-public-invitation";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const { token } = await context.params;
    const result = await getPublicMemberInvitation({ token });
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
