import { withAuthedApiRoute } from "@/core/http/api-route-handler";
import { revokeMemberInvitation } from "@/features/member-invitations/server/revoke-member-invitation";

export const dynamic = "force-dynamic";

export const DELETE = withAuthedApiRoute<{ invitationId: string }>(({ auth, params }) =>
  revokeMemberInvitation({
    organizationId: auth.organizationId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    invitationId: params.invitationId,
  })
);
