import { withAuthedApiRoute } from "@/core/http/api-route-handler";
import { getStoreAttachment } from "@/features/closeouts/server/get-store-attachment";

export const dynamic = "force-dynamic";

export const GET = withAuthedApiRoute<{ storeId: string; attachmentId: string }>(({ auth, params }) =>
  getStoreAttachment({
    organizationId: auth.organizationId,
    storeId: params.storeId,
    attachmentId: params.attachmentId,
    actorUserId: auth.userId,
    actorRole: auth.role,
  })
);
