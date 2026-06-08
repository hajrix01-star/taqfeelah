/**
 * Prototype Access Mode (temporary product-development bypass).
 *
 * When enabled, the UI skips real auth (username/password/OTP/session/API) and
 * opens owner or employee shells via a simple role picker.
 *
 * ON by default only in prototype/development app mode. Production app mode
 * defaults to OFF so an omitted flag cannot reopen local/demo access.
 *
 * This is NOT a production auth solution. Replace with real auth + authorization
 * before launch.
 */
export function isPrototypeAccessMode(): boolean {
  if (process.env.NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE === "true") return true;
  if (process.env.NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE === "false") return false;
  if (process.env.NEXT_PUBLIC_APP_MODE === "prototype") return true;
  if (process.env.NEXT_PUBLIC_APP_MODE === "production") return false;
  if (process.env.NODE_ENV === "production") return false;
  return true;
}
