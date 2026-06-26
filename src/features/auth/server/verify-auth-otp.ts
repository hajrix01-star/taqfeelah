import { z } from "zod";
import { UnauthorizedError, ValidationError } from "@/core/errors/app-error";

const inputSchema = z.object({
  channel: z.enum(["whatsapp", "email"]),
  destination: z.string().trim().min(4).max(120),
  code: z.string().trim().min(4).max(12),
  purpose: z.enum(["owner_login"]).default("owner_login"),
});

export async function verifyAuthOtp(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid OTP verify input.", parsed.error.flatten());
  }

  throw new UnauthorizedError("OTP verification is not configured yet. Use password login.");
}
