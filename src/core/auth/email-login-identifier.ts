import { z } from "zod";

const emailSchema = z.string().trim().email("A valid email address is required.");

export function normalizeEmailLoginIdentifier(value: string): string {
  return value.trim().toLowerCase();
}

export function isEmailLoginIdentifier(value: string): boolean {
  return emailSchema.safeParse(value).success;
}

export function assertEmailLoginIdentifier(value: string): string {
  const parsed = emailSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error("A valid email address is required.");
  }
  return normalizeEmailLoginIdentifier(parsed.data);
}
