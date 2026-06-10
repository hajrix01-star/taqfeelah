export function isCloseoutAttachmentRef(value) {
  return Boolean(
    value
    && typeof value === "object"
    && typeof value.id === "string"
    && value.id.length > 0,
  );
}

export function countCloseoutAttachments(attachments) {
  if (!Array.isArray(attachments)) return 0;
  return attachments.filter((item) => {
    if (typeof item === "string") return Boolean(item);
    return isCloseoutAttachmentRef(item);
  }).length;
}

export function normalizeCloseoutAttachmentList(attachments) {
  if (!Array.isArray(attachments)) return [];
  return attachments.filter((item) => {
    if (typeof item === "string") return Boolean(item);
    return isCloseoutAttachmentRef(item);
  });
}
