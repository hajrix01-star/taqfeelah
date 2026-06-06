import { z } from "zod";
import { ValidationError } from "@/core/errors/app-error";

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
  const input = parsed.data;

  return {
    accepted: true,
    channel: input.channel,
    destination: input.destination,
    purpose: input.purpose,
    deliveryStatus: "stub_not_configured" as const,
    expiresInSeconds: 300,
    message: "OTP provider is not configured yet. This endpoint is a pre-launch foundation stub.",
  };
}
