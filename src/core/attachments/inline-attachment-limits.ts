/** Max decoded image size for inline proof photos (typical mobile camera JPEG). */
export const INLINE_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

/** Base64 data URLs are ~4/3 of binary size plus a short `data:*;base64,` prefix. */
export const INLINE_ATTACHMENT_MAX_DATA_URL_LENGTH = 14 * 1024 * 1024;
