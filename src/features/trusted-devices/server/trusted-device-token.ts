import { createHash, randomBytes } from "node:crypto";

export function generateTrustedDeviceSecret(): string {
  return randomBytes(32).toString("base64url");
}

export function hashTrustedDeviceSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}
