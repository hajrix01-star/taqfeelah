import { fail, ok } from "@/core/http/api-response";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import { assertStoreAccess } from "@/core/auth/assert-store-access";
import { registerAttachment } from "@/core/attachments/register-attachment";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ storeId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const params = await context.params;
    const requestContext = resolveRequestContext(request, { requireUser: true });
    const body = await request.json();

    await assertStoreAccess({
      organizationId: requestContext.organizationId,
      storeId: params.storeId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      minimumRole: "employee",
    scope: "read",
    });

    const registered = await registerAttachment({
      ...(body?.attachment || body),
      organizationId: requestContext.organizationId,
      storeId: params.storeId,
    });
    return ok(registered, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
