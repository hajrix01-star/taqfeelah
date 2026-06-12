import { fail, ok } from "@/core/http/api-response";
import { resolveRequestContext } from "@/core/auth/request-context";
import { ServiceUnavailableError, ValidationError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { changeOwnerPassword } from "@/features/auth/server/change-owner-password";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const requestContext = resolveRequestContext(request, { requireUser: true });
    if (requestContext.role !== "owner") {
      throw new ValidationError("Only owners can change owner passwords.");
    }

    const body = await request.json();
    const result = await changeOwnerPassword({
      userId: requestContext.userId!,
      currentPassword: typeof body?.currentPassword === "string" ? body.currentPassword : "",
      newPassword: typeof body?.newPassword === "string" ? body.newPassword : "",
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
