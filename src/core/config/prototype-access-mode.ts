/**
 * Prototype Access Mode (temporary product-development bypass).
 *
 * When enabled, the UI skips real auth (username/password/OTP/session/API) and
 * opens owner or employee shells via a simple role picker.
 *
 * ON by default until the auth launch phase. Set
 * NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE=false only when real auth is ready.
 *
 * This is NOT a production auth solution. Replace with real auth + authorization
 * before launch.
 */
export function isPrototypeAccessMode(): boolean {
  if (process.env.NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE === "true") return true;
  if (process.env.NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE === "false") return false;
  return true;
}
