import { resolveInlineAttachmentDataUrl } from "@/features/entries/server/inline-attachment";
import {
  isLocalVpsStorageKey,
  resolveLocalVpsAttachmentDataUrl,
} from "@/core/attachments/local-vps-attachment-storage";

export async function resolveAttachmentDataUrl(
  storageKey: string | null | undefined,
): Promise<string> {
  if (!storageKey) return "";

  if (storageKey.startsWith("data:")) {
    return storageKey;
  }

  if (isLocalVpsStorageKey(storageKey)) {
    return resolveLocalVpsAttachmentDataUrl(storageKey);
  }

  return resolveInlineAttachmentDataUrl(storageKey);
}
