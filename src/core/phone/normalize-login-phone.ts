import { z } from "zod";

const phoneSchema = z.string().trim().min(8).max(20);

/** Normalize Saudi / international mobile numbers to E.164 (+9665xxxxxxxx). */
export function normalizeLoginPhone(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("966")) {
    return `+${digits}`;
  }
  if (digits.startsWith("0")) {
    return `+966${digits.slice(1)}`;
  }
  if (digits.length === 9 && digits.startsWith("5")) {
    return `+966${digits}`;
  }
  if (trimmed.startsWith("+")) {
    return `+${digits}`;
  }

  return `+${digits}`;
}

export function assertValidLoginPhone(raw: string): string {
  const normalized = normalizeLoginPhone(raw);
  if (!phoneSchema.safeParse(normalized.replace(/^\+/, "")).success) {
    throw new Error("Invalid phone number.");
  }
  if (!normalized.startsWith("+9665") || normalized.length < 12) {
    throw new Error("Phone must be a valid Saudi mobile number.");
  }
  return normalized;
}
