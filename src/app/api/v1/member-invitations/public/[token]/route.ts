import { withApiRoute } from "@/core/http/api-route-handler";
import { getPublicMemberInvitation } from "@/features/member-invitations/server/get-public-invitation";

export const dynamic = "force-dynamic";

export const GET = withApiRoute<{ token: string }>(({ params }) =>
  getPublicMemberInvitation({ token: params.token })
);
