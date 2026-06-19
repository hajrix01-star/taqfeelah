import { createHash, randomBytes } from "node:crypto";
import { resolveAppPublicOrigin } from "@/core/auth/app-origin";

export function generateSignupVerificationToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSignupVerificationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function buildSignupVerificationUrl(token: string, request?: Request): string {
  const origin = resolveAppPublicOrigin(request);
  return `${origin}/auth/verify-email?token=${encodeURIComponent(token)}`;
}

export function normalizeSignupEmail(email: string): string {
  return email.trim().toLowerCase();
}
