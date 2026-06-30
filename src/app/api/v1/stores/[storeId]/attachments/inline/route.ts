import { assertStoreAccess } from "@/core/auth/assert-store-access";
import { registerAttachment } from "@/core/attachments/register-attachment";
import { readJsonBody, withAuthedApiRoute } from "@/core/http/api-route-handler";

export const dynamic = "force-dynamic";

type RegisterAttachmentInput = Parameters<typeof registerAttachment>[0];

export const POST = withAuthedApiRoute<{ storeId: string }>(async ({ auth, params, request }) => {
  const body = await readJsonBody<Record<string, unknown>>(request);

  await assertStoreAccess({
    organizationId: auth.organizationId,
    storeId: params.storeId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    minimumRole: "employee",
    scope: "read",
  });

  const attachmentPayload = (
    body?.attachment && typeof body.attachment === "object" ? body.attachment : body
  ) as Omit<RegisterAttachmentInput, "organizationId" | "storeId">;
  const registered = await registerAttachment({
    ...attachmentPayload,
    organizationId: auth.organizationId,
    storeId: params.storeId,
  });
  return { data: registered, init: { status: 201 } };
});
