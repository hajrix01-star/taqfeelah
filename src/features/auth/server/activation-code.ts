import { randomInt } from "node:crypto";

export function generateActivationCode(digits = 6): string {
  const max = 10 ** digits;
  const value = randomInt(0, max);
  return value.toString().padStart(digits, "0");
}
