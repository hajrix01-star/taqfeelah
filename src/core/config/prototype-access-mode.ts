/**
 * Prototype Access Mode (temporary product-development bypass).
 *
 * When enabled, the UI skips real auth (username/password/OTP/session/API) and
 * opens owner or employee shells via a simple role picker.
 *
 * ON by default on all devices/environments. Set
 * NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE=false before launch to restore real auth.
 *
 * This is NOT a production auth solution. Replace with real auth + authorization
 * before launch.
 */
export function isPrototypeAccessMode(): boolean {
  if (process.env.NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE === "false") return false;
  return true;
}
