import { and, eq } from "drizzle-orm";
import { isEntriesApiDbSourceMode } from "@/core/config/entries-api-mode";
import type { getDb } from "@/core/db/client";
import { dailyCloseouts } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";

type CloseoutLookupDb = ReturnType<typeof getDb>;

export const CLOSEOUT_REQUIRED_FOR_ENTRY_MESSAGE =
  "Financial entries require a linked closeout.";

export const DUPLICATE_SUMMARY_BLOCKED_IN_DB_SOURCE_MESSAGE =
  "Duplicate summary approval is unavailable in database mode. Submit another closeout for the same day instead.";

type AssertCloseoutLinkedEntryInput = {
  organizationId: string;
  storeId: string;
  closeoutId?: string | null;
};

export async function assertCloseoutLinkedEntry(
  db: CloseoutLookupDb,
  input: AssertCloseoutLinkedEntryInput,
): Promise<string | null> {
  if (!isEntriesApiDbSourceMode()) {
    return input.closeoutId || null;
  }

  if (!input.closeoutId) {
    throw new ValidationError(CLOSEOUT_REQUIRED_FOR_ENTRY_MESSAGE);
  }

  const [row] = await db
    .select({ id: dailyCloseouts.id })
    .from(dailyCloseouts)
    .where(
      and(
        eq(dailyCloseouts.id, input.closeoutId),
        eq(dailyCloseouts.organizationId, input.organizationId),
        eq(dailyCloseouts.storeId, input.storeId),
      ),
    )
    .limit(1);

  if (!row) {
    throw new ValidationError("Closeout not found for this store.");
  }

  return row.id;
}
