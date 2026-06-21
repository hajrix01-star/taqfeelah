import type { OperationalEntryAttachment } from "@/features/entries/client/entries-client-types";

export type PreparedAttachment = OperationalEntryAttachment & {
  id?: string;
  dataUrl?: string;
};

export type StoredAttachmentPayload = PreparedAttachment;
