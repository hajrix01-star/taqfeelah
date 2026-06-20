import { registerInlineAttachmentViaApi } from "./exports-attachments-api-client.js";

function toInlineAttachmentInput(attachment) {
  if (!attachment || typeof attachment !== "object" || !attachment.dataUrl) return null;
  return {
    kind: "image",
    name: attachment.name || "attachment.jpg",
    mimeType: attachment.mimeType || "image/jpeg",
    sizeBytes: Number(attachment.sizeBytes || 0),
    dataUrl: attachment.dataUrl,
  };
}

export async function resolveInlineAttachmentPayloadForApi({
  enabled = false,
  organizationId = "",
  actorUserId = "",
  actorRole = "owner",
  storeId = "",
  payload,
}) {
  if (!enabled || !payload || typeof payload !== "object") return payload;
  const inlineInput = toInlineAttachmentInput(payload.attachment);
  if (!inlineInput || !storeId) return payload;

  try {
    const registered = await registerInlineAttachmentViaApi({
      organizationId,
      actorUserId,
      actorRole,
      storeId,
      attachment: inlineInput,
    });
    if (!registered?.storageKey) return payload;

    return {
      ...payload,
      attachment: {
        kind: "image",
        name: registered.name || inlineInput.name,
        mimeType: registered.mimeType || inlineInput.mimeType,
        sizeBytes: registered.sizeBytes || inlineInput.sizeBytes,
        storageKey: registered.storageKey,
      },
    };
  } catch (error) {
    console.warn("inline attachment registration failed; falling back to direct dataUrl", error);
    return payload;
  }
}

/** @deprecated Use resolveInlineAttachmentPayloadForApi */
export const resolvePayloadAttachmentForPhase9Api = resolveInlineAttachmentPayloadForApi;
