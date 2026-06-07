import { recordUsageEvent } from "@/features/usage/server/record-usage-event";

type UsageEventInput = Parameters<typeof recordUsageEvent>[0];

export async function fireUsageEventSafe(input: UsageEventInput): Promise<void> {
  try {
    await recordUsageEvent(input);
  } catch {
    // Usage tracking must never break primary operational flows.
  }
}
