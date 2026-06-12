import { createHash, randomBytes } from "node:crypto";

export function generateAccountSetupToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashAccountSetupToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function buildAccountSetupUrl(token: string, origin: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/auth/setup?token=${encodeURIComponent(token)}`;
}
