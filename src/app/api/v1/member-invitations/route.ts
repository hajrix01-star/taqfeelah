import { fail, ok } from "@/core/http/api-response";
import { resolveRequestContext } from "@/core/auth/request-context";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { createMemberInvitation } from "@/features/member-invitations/server/create-member-invitation";
import { listMemberInvitations } from "@/features/member-invitations/server/list-member-invitations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const requestContext = resolveRequestContext(request, { requireUser: true });
    const result = await listMemberInvitations(
      {
        organizationId: requestContext.organizationId,
        actorUserId: requestContext.userId!,
        actorRole: requestContext.role!,
      },
      request,
    );

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const requestContext = resolveRequestContext(request, { requireUser: true });
    const body = await request.json();

    const created = await createMemberInvitation(
      {
        organizationId: requestContext.organizationId,
        actorUserId: requestContext.userId!,
        actorRole: requestContext.role!,
        displayName: typeof body?.displayName === "string" ? body.displayName : "",
        role: body?.role === "manager" ? "manager" : "employee",
        storeId: typeof body?.storeId === "string" ? body.storeId : "",
        phoneNumber: typeof body?.phoneNumber === "string" ? body.phoneNumber : "",
        pin: typeof body?.pin === "string" ? body.pin : "",
        invitationType: body?.invitationType === "device_pin_reset" ? "device_pin_reset" : "employee_onboarding",
        targetUserId: typeof body?.targetUserId === "string" ? body.targetUserId : undefined,
      },
      request,
    );

    return ok(created, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
