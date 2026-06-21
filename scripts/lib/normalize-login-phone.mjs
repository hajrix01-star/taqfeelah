/** Normalize an optional staging/bootstrap login phone without guessing a default. */
export function normalizeOptionalLoginPhone(value, variableName = "AUTH_OWNER_LOGIN_PHONE") {
  const normalized = String(value || "").trim();
  if (!normalized) return null;
  if (!/^\+9665\d{8}$/.test(normalized)) {
    throw new Error(`${variableName} must use Saudi E.164 format (+9665xxxxxxxx).`);
  }
  return normalized;
}
