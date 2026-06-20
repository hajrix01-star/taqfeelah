import { normalizeLoginPhone } from "@/core/phone/normalize-login-phone";

/** Digits-only international number for wa.me links (e.g. 966501234567). */
export function normalizeWhatsAppPhone(raw: string | null | undefined): string {
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (!trimmed) return "";

  const digitsOnly = trimmed.replace(/\D/g, "");
  const input = digitsOnly.startsWith("00") ? digitsOnly.slice(2) : trimmed;
  const normalized = normalizeLoginPhone(input);
  if (!normalized) return "";

  return normalized.replace(/^\+/, "");
}
