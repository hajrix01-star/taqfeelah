export const operationalQueryRoot = ["operational"] as const;

export type OperationalQueryKeyContext = Record<string, string | number | boolean>;

function serializeContext(context: OperationalQueryKeyContext) {
  return Object.entries(context)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${String(value)}`)
    .join("|");
}

export const operationalQueryKeys = {
  all: operationalQueryRoot,
  entriesDuplicateWatch: (context: OperationalQueryKeyContext) => [
    ...operationalQueryRoot,
    "entries-duplicate-watch",
    serializeContext(context),
  ] as const,
  registerEntries: (context: OperationalQueryKeyContext) => [
    ...operationalQueryRoot,
    "register-entries",
    serializeContext(context),
  ] as const,
  registerEntriesPrefix: () => [...operationalQueryRoot, "register-entries"] as const,
  summaryPeriod: (context: OperationalQueryKeyContext) => [
    ...operationalQueryRoot,
    "summary",
    serializeContext(context),
  ] as const,
  summaryPrefix: () => [...operationalQueryRoot, "summary"] as const,
  reports: (context: OperationalQueryKeyContext) => [
    ...operationalQueryRoot,
    "reports",
    serializeContext(context),
  ] as const,
  reportsPrefix: () => [...operationalQueryRoot, "reports"] as const,
  homeAttachments: (context: OperationalQueryKeyContext) => [
    ...operationalQueryRoot,
    "home-attachments",
    serializeContext(context),
  ] as const,
  homeAttachmentsPrefix: () => [...operationalQueryRoot, "home-attachments"] as const,
};
