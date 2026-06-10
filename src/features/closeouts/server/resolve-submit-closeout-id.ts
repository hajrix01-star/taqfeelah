/**
 * Server-owned closeout identity for submit/ownerEdit.
 * Never derive from storeId+date — multiple closeouts can share the same day.
 */
export function resolveSubmitCloseoutId(
  providedCloseoutId: unknown,
  generateId: () => string = () => crypto.randomUUID(),
): string {
  if (typeof providedCloseoutId === "string" && providedCloseoutId.trim()) {
    return providedCloseoutId.trim();
  }
  return generateId();
}
