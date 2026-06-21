import { registerInlineAttachmentViaApi } from "./exports-attachments-api-client";
import type { ResolveInlineAttachmentPayloadForApiInput } from "@/features/exports-attachments/client/exports-attachments-client-types";
import type { OperationalEntryAttachment, OperationalEntryPayload } from "@/features/entries/client/entries-client-types";

function toInlineAttachmentInput(attachment: OperationalEntryAttachment | null | undefined) {
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
}: ResolveInlineAttachmentPayloadForApiInput): Promise<OperationalEntryPayload | null | undefined> {
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
    }) as Record<string, unknown> | null;
    if (!registered?.storageKey) return payload;

    return {
      ...payload,
      attachment: {
        kind: "image",
        name: String(registered.name || inlineInput.name),
        mimeType: String(registered.mimeType || inlineInput.mimeType),
        sizeBytes: Number(registered.sizeBytes || inlineInput.sizeBytes),
        storageKey: String(registered.storageKey),
      },
    };
  } catch (error) {
    console.warn("inline attachment registration failed; falling back to direct dataUrl", error);
    return payload;
  }
}

/** @deprecated Use resolveInlineAttachmentPayloadForApi */
export const resolvePayloadAttachmentForPhase9Api = resolveInlineAttachmentPayloadForApi;
