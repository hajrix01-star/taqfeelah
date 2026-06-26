import { z } from "zod";
import { ServiceUnavailableError, ValidationError } from "@/core/errors/app-error";

const inputSchema = z.object({
  channel: z.enum(["whatsapp", "email"]),
  destination: z.string().trim().min(4).max(120),
  purpose: z.enum(["owner_login"]).default("owner_login"),
});

export async function requestAuthOtp(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid OTP request input.", parsed.error.flatten());
  }
  void parsed.data;

  throw new ServiceUnavailableError("OTP delivery provider is not configured. Use password login.");
}
