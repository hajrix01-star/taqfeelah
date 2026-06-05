import { scrypt, timingSafeEqual, randomBytes } from "node:crypto";
import { promisify } from "node:util";
import bcrypt from "bcryptjs";

const scryptAsync = promisify(scrypt);
const SCRYPT_KEYLEN = 64;

function isBcryptHash(value: string): boolean {
  return /^\$2[ab]\$\d{2}\$/.test(value);
}

function isScryptHash(value: string): boolean {
  return value.startsWith("scrypt:");
}

export async function hashCredential(plaintext: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(plaintext, salt, SCRYPT_KEYLEN)) as Buffer;
  return `scrypt:${salt}:${buf.toString("hex")}`;
}

async function verifyScrypt(plaintext: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 3) return false;
  const [, salt, hashHex] = parts;
  const storedBuf = Buffer.from(hashHex, "hex");
  if (storedBuf.length !== SCRYPT_KEYLEN) return false;
  try {
    const derivedBuf = (await scryptAsync(plaintext, salt, SCRYPT_KEYLEN)) as Buffer;
    return timingSafeEqual(derivedBuf, storedBuf);
  } catch {
    return false;
  }
}

export async function verifyCredential(
  plaintext: string,
  stored: string,
): Promise<boolean> {
  if (!plaintext || !stored) return false;
  if (isBcryptHash(stored)) {
    return bcrypt.compare(plaintext, stored);
  }
  if (isScryptHash(stored)) {
    return verifyScrypt(plaintext, stored);
  }
  // Legacy plaintext — accept (caller should re-hash on next save)
  return plaintext === stored;
}

export function isHashedCredential(value: string): boolean {
  return isBcryptHash(value) || isScryptHash(value);
}

/** Hash if not already hashed; return unchanged if already hashed. */
export async function ensureHashed(value: string): Promise<string> {
  if (!value) return value;
  if (isHashedCredential(value)) return value;
  return hashCredential(value);
}
