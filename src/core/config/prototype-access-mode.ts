/**
 * Prototype Access Mode (temporary product-development bypass).
 *
 * When enabled, the UI skips real auth (username/password/OTP/session/API) and
 * opens owner or employee shells via a simple role picker.
 *
 * OFF by default after auth launch. Set
 * NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE=true only for isolated prototype previews.
 *
 * This is NOT a production auth solution. Replace with real auth + authorization
 * before launch.
 */
export function isPrototypeAccessMode(): boolean {
  if (process.env.NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE === "true") return true;
  if (process.env.NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE === "false") return false;
  return false;
}
