import { isUuid } from "@/core/client/api-id-utils";
import { fetchApiJsonWithPrototypeContext } from "@/core/client/api-fetch";
import { resolvePrototypeApiContext } from "@/core/client/prototype-api-context";

export async function fetchStoreAttachmentViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  attachmentId,
}: {
  organizationId?: string;
  actorUserId?: string;
  actorRole?: string;
  storeId?: string;
  attachmentId?: string;
}): Promise<{ dataUrl: string }> {
  const context = resolvePrototypeApiContext({
    organizationId,
    actorUserId,
    actorRole,
    storeId,
  });
  if (!context || !isUuid(attachmentId)) {
    throw new Error("attachment fetch API context missing/invalid.");
  }

  const payload = await fetchApiJsonWithPrototypeContext(
    `/api/v1/stores/${context.storeId}/attachments/${attachmentId}`,
    {
      organizationId,
      actorUserId,
      actorRole,
      errorMessage: "attachment fetch api failed.",
    },
  );

  if (!payload || typeof payload !== "object" || typeof (payload as { dataUrl?: unknown }).dataUrl !== "string") {
    throw new Error("attachment fetch API returned invalid payload.");
  }

  return payload as { dataUrl: string };
}
