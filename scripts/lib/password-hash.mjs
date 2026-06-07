import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const SCRYPT_PREFIX = "scrypt:v1";

/**
 * Mirrors src/features/auth/server/password-hash.ts so seed scripts
 * produce hashes compatible with createAuthSession verification.
 */
export async function hashPassword(plainText) {
  const normalized = String(plainText || "").trim();
  if (!normalized) {
    throw new Error("Password cannot be empty.");
  }
  const salt = randomBytes(16);
  const derived = await scryptAsync(normalized, salt, 64);
  return `${SCRYPT_PREFIX}:${salt.toString("base64")}:${derived.toString("base64")}`;
}

export async function verifyPassword(plainText, storedHash) {
  const normalized = String(plainText || "").trim();
  if (!normalized || !storedHash.startsWith(`${SCRYPT_PREFIX}:`)) return false;
  const parts = storedHash.split(":");
  if (parts.length !== 4 || parts[0] !== "scrypt" || parts[1] !== "v1") return false;
  const saltBase64 = parts[2];
  const hashBase64 = parts[3];
  if (!saltBase64 || !hashBase64) return false;
  const salt = Buffer.from(saltBase64, "base64");
  const expected = Buffer.from(hashBase64, "base64");
  const derived = await scryptAsync(normalized, salt, expected.length);
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
