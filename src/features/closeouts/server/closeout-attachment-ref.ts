export type CloseoutAttachmentRef = {
  id: string;
  mimeType: string;
  sizeBytes: number;
  name: string;
};

export function isCloseoutAttachmentRef(value: unknown): value is CloseoutAttachmentRef {
  return Boolean(
    value
    && typeof value === "object"
    && typeof (value as CloseoutAttachmentRef).id === "string"
    && (value as CloseoutAttachmentRef).id.length > 0,
  );
}

export function countCloseoutAttachments(attachments: unknown): number {
  if (!Array.isArray(attachments)) return 0;
  return attachments.filter((item) => {
    if (typeof item === "string") return Boolean(item);
    return isCloseoutAttachmentRef(item);
  }).length;
}
