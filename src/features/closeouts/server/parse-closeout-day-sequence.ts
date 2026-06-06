export function parseCloseoutDaySequence(metadata: unknown): number | null {
  if (!metadata || typeof metadata !== "object") return null;
  const value = Number((metadata as { daySequence?: unknown }).daySequence);
  return Number.isInteger(value) && value >= 1 ? value : null;
}
