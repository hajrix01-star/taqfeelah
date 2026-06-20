export type CloseoutAttachmentListItem =
  | string
  | {
      id: string;
      mimeType?: string;
      sizeBytes?: number;
      name?: string;
      dataUrl?: string;
    };

export function isCloseoutAttachmentRef(value: unknown): value is CloseoutAttachmentListItem & { id: string } {
  return Boolean(
    value
    && typeof value === "object"
    && typeof (value as { id?: unknown }).id === "string"
    && (value as { id: string }).id.length > 0,
  );
}

export function countCloseoutAttachments(attachments: unknown): number {
  if (!Array.isArray(attachments)) return 0;
  return attachments.filter((item) => {
    if (typeof item === "string") return Boolean(item);
    return isCloseoutAttachmentRef(item);
  }).length;
}

export function countOutflowAttachments(outflows: unknown): number {
  if (!Array.isArray(outflows)) return 0;
  return outflows.reduce<number>((sum, row) => (
    sum + countCloseoutAttachments((row as { attachments?: unknown })?.attachments)
  ), 0);
}

export function countAllCloseoutProofAttachments(closeout: { attachments?: unknown; outflows?: unknown } | null | undefined): number {
  return countCloseoutAttachments(closeout?.attachments) + countOutflowAttachments(closeout?.outflows);
}

export function normalizeCloseoutAttachmentList(attachments: unknown): CloseoutAttachmentListItem[] {
  if (!Array.isArray(attachments)) return [];
  return attachments.filter((item): item is CloseoutAttachmentListItem => {
    if (typeof item === "string") return Boolean(item);
    return isCloseoutAttachmentRef(item);
  });
}
