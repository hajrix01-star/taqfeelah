import type { OperationalEntry } from "./entries-client-types";

export function mergeRegisterEntryPages(
  existing: OperationalEntry[] = [],
  incoming: OperationalEntry[] = [],
): OperationalEntry[] {
  const seen = new Set<string>();
  const merged: OperationalEntry[] = [];

  [...existing, ...incoming].forEach((entry) => {
    const entryId = typeof entry?.id === "string" ? entry.id : "";
    if (!entryId || seen.has(entryId)) return;
    seen.add(entryId);
    merged.push(entry);
  });

  return merged.sort((left, right) => {
    const dateCompare = String(right?.date || "").localeCompare(String(left?.date || ""));
    if (dateCompare !== 0) return dateCompare;
    return String(right?.createdAt || "").localeCompare(String(left?.createdAt || ""));
  });
}
