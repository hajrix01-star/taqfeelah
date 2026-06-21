import type { JsonStringMap } from "@/core/client/client-types";

export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value);
}

export function parseJsonMap(rawValue: unknown): JsonStringMap {
  if (!rawValue || typeof rawValue !== "string") return {};
  try {
    const parsed = JSON.parse(rawValue) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as JsonStringMap
      : {};
  } catch {
    return {};
  }
}

export function mapToUuid(value: unknown, map: JsonStringMap): string {
  if (isUuid(value)) return value;
  if (typeof value !== "string" || !value.trim()) return "";
  const mapped = map[value] || map[value.trim()];
  return isUuid(mapped) ? mapped : "";
}

export function reverseLookupKeyByUuid(uuidValue: string, map: JsonStringMap): string {
  if (!isUuid(uuidValue) || !map || typeof map !== "object") return "";
  for (const [key, value] of Object.entries(map)) {
    if (isUuid(value) && value.toLowerCase() === uuidValue.toLowerCase()) return key;
  }
  return "";
}

export function toMoneyHalalas(value: unknown): number {
  return Math.round(Number(value || 0) * 100);
}
