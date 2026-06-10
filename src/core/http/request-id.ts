import { randomUUID } from "node:crypto";

export function resolveRequestId(request?: Request): string {
  const fromHeader = request?.headers.get("x-request-id")?.trim();
  if (fromHeader) return fromHeader;
  return randomUUID();
}
