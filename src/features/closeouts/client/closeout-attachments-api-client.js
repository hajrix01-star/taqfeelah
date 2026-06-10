import { isUuid, mapToUuid } from "@/core/client/api-id-utils";
import { fetchApiJsonWithPrototypeContext } from "@/core/client/api-fetch";
import { getRuntimeApiMaps } from "@/core/client/runtime-api-maps-state";

export async function fetchStoreAttachmentViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  attachmentId,
}) {
  const { storeIdMap } = getRuntimeApiMaps();
  const mappedStoreId = mapToUuid(storeId, storeIdMap);
  if (!mappedStoreId || !isUuid(organizationId) || !isUuid(attachmentId)) {
    throw new Error("attachment fetch API context missing/invalid.");
  }

  const payload = await fetchApiJsonWithPrototypeContext(
    `/api/v1/stores/${mappedStoreId}/attachments/${attachmentId}`,
    {
      organizationId,
      actorUserId,
      actorRole,
      errorMessage: "attachment fetch api failed.",
    },
  );

  if (!payload || typeof payload !== "object" || typeof payload.dataUrl !== "string") {
    throw new Error("attachment fetch API returned invalid payload.");
  }

  return payload;
}
