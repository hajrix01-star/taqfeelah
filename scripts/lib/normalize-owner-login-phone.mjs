/** Normalize an optional staging/bootstrap owner phone without guessing a default. */
export function normalizeOptionalOwnerLoginPhone(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return null;
  if (!/^\+9665\d{8}$/.test(normalized)) {
    throw new Error("AUTH_OWNER_LOGIN_PHONE must use Saudi E.164 format (+9665xxxxxxxx).");
  }
  return normalized;
}
