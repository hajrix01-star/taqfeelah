import { fail, ok } from "@/core/http/api-response";
import { resolveRequestContext } from "@/core/auth/request-context";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { revokeMemberInvitation } from "@/features/member-invitations/server/revoke-member-invitation";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ invitationId: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const { invitationId } = await context.params;
    const requestContext = resolveRequestContext(request, { requireUser: true });

    const result = await revokeMemberInvitation({
      organizationId: requestContext.organizationId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      invitationId,
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
