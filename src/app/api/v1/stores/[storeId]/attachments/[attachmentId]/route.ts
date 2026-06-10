import { fail, ok } from "@/core/http/api-response";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import { getStoreAttachment } from "@/features/closeouts/server/get-store-attachment";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ storeId: string; attachmentId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const params = await context.params;
    const requestContext = resolveRequestContext(request, { requireUser: true });
    const attachment = await getStoreAttachment({
      organizationId: requestContext.organizationId,
      storeId: params.storeId,
      attachmentId: params.attachmentId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
    });

    return ok(attachment);
  } catch (error) {
    return fail(error);
  }
}
