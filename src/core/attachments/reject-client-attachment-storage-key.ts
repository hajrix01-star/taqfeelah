import { ValidationError } from "@/core/errors/app-error";

/**
 * Server-generated storage keys only — never accept client-supplied keys
 * (prevents cross-tenant file reads via crafted local:v1: paths).
 */
export function rejectClientAttachmentStorageKey(
  storageKey: string | null | undefined,
): void {
  if (typeof storageKey === "string" && storageKey.trim()) {
    throw new ValidationError(
      "Client-provided attachment storage keys are not allowed. Upload attachment data instead.",
    );
  }
}
