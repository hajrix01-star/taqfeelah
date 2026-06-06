export function mergeRegisterEntryPages(existing = [], incoming = []) {
  const seen = new Set();
  const merged = [];

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
