/**
 * Short, human-friendly account reference derived from organization UUID.
 * Used in owner UI and support WhatsApp messages (not a separate DB column).
 */
export function formatOrganizationAccountRef(organizationId: string | null | undefined): string {
  if (!organizationId || typeof organizationId !== "string") return "";
  const normalized = organizationId.trim().toLowerCase();
  if (!normalized) return "";
  return normalized.replace(/-/g, "").slice(0, 8).toUpperCase();
}
