import { readJsonBody, withAuthedApiRouteNoParams } from "@/core/http/api-route-handler";
import { createMemberInvitation } from "@/features/member-invitations/server/create-member-invitation";
import { listMemberInvitations } from "@/features/member-invitations/server/list-member-invitations";

export const dynamic = "force-dynamic";

export const GET = withAuthedApiRouteNoParams(({ auth, request }) =>
  listMemberInvitations(
    {
      organizationId: auth.organizationId,
      actorUserId: auth.userId,
      actorRole: auth.role,
    },
    request,
  )
);

export const POST = withAuthedApiRouteNoParams(async ({ auth, request }) => {
  const body = await readJsonBody<Record<string, unknown>>(request);

  const created = await createMemberInvitation(
    {
      organizationId: auth.organizationId,
      actorUserId: auth.userId,
      actorRole: auth.role,
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

  return { data: created, init: { status: 201 } };
});
