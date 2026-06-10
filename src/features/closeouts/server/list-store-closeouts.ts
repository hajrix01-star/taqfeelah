import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { assertStoreAccess } from "@/core/auth/assert-store-access";
import { type MemberRole } from "@/core/auth/roles";
import { ValidationError } from "@/core/errors/app-error";
import { toRiyals } from "@/core/money/halalas";
import { dailyCloseouts, entries, entrySalesChannels, stores, users } from "@/core/db/schema";
import {
  closeoutTotalsFromHalalas,
  closeoutTotalsFromRiyalRows,
} from "@/features/closeouts/server/closeout-summary-totals";

const closeoutDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD");

const listCloseoutsInputSchema = z.object({
  organizationId: z.string().uuid(),
  storeId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  dateFrom: closeoutDateSchema.optional(),
  dateTo: closeoutDateSchema.optional(),
});

type ListCloseoutsInput = z.infer<typeof listCloseoutsInputSchema>;

type CloseoutOutflowRow = {
  id: string;
  type: "purchases" | "expense" | "withdrawal";
  typeLabel: string;
  categoryId: string | null;
  category: string;
  note: string;
  amount: number;
};

function mapCloseoutStatus(status: string): "submitted" | "reviewed" | "returned" {
  if (status === "approved") return "reviewed";
  if (status === "returned") return "returned";
  return "submitted";
}

export async function listStoreCloseouts(rawInput: ListCloseoutsInput) {
  const parsed = listCloseoutsInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid closeout list input.", parsed.error.flatten());
  }

  const input = parsed.data;
  if (input.dateFrom && input.dateTo && input.dateFrom > input.dateTo) {
    throw new ValidationError("dateFrom must be earlier than or equal to dateTo.");
  }

  await assertStoreAccess({
    organizationId: input.organizationId,
    storeId: input.storeId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole as MemberRole,
    minimumRole: "employee",
  });

  const db = getDb();
  const [storeRow] = await db
    .select({ name: stores.name })
    .from(stores)
    .where(
      and(
        eq(stores.id, input.storeId),
        eq(stores.organizationId, input.organizationId),
      ),
    )
    .limit(1);

  const closeoutRows = await db
    .select({
      id: dailyCloseouts.id,
      clientCloseoutId: dailyCloseouts.clientCloseoutId,
      date: dailyCloseouts.date,
      daySequence: dailyCloseouts.daySequence,
      status: dailyCloseouts.status,
      submittedByUserId: dailyCloseouts.submittedByUserId,
      reviewedByUserId: dailyCloseouts.reviewedByUserId,
      reviewedAt: dailyCloseouts.reviewedAt,
      returnReason: dailyCloseouts.returnReason,
      note: dailyCloseouts.note,
      createdAt: dailyCloseouts.createdAt,
    })
    .from(dailyCloseouts)
    .where(
      and(
        eq(dailyCloseouts.organizationId, input.organizationId),
        eq(dailyCloseouts.storeId, input.storeId),
        input.dateFrom ? sql`${dailyCloseouts.date} >= ${input.dateFrom}` : undefined,
        input.dateTo ? sql`${dailyCloseouts.date} <= ${input.dateTo}` : undefined,
      ),
    )
    .orderBy(desc(dailyCloseouts.date), desc(dailyCloseouts.createdAt));

  if (closeoutRows.length === 0) return [];

  const closeoutIds = closeoutRows.map((row) => row.id);
  const entryRows = await db
    .select({
      id: entries.id,
      closeoutId: entries.closeoutId,
      type: entries.type,
      status: entries.status,
      categoryId: entries.categoryId,
      note: entries.note,
      amountHalalas: entries.amountHalalas,
    })
    .from(entries)
    .where(
      and(
        eq(entries.organizationId, input.organizationId),
        eq(entries.storeId, input.storeId),
        eq(entries.status, "active"),
        inArray(entries.closeoutId, closeoutIds),
      ),
    );

  const summaryEntryIds = entryRows
    .filter((row) => row.type === "summary")
    .map((row) => row.id);

  const salesByEntryId = new Map<string, Array<{ channelId: string; name: string; amount: number }>>();
  if (summaryEntryIds.length > 0) {
    const salesRows = await db
      .select({
        entryId: entrySalesChannels.entryId,
        salesChannelId: entrySalesChannels.salesChannelId,
        channelNameSnapshot: entrySalesChannels.channelNameSnapshot,
        amountHalalas: entrySalesChannels.amountHalalas,
      })
      .from(entrySalesChannels)
      .where(
        and(
          eq(entrySalesChannels.organizationId, input.organizationId),
          eq(entrySalesChannels.storeId, input.storeId),
          inArray(entrySalesChannels.entryId, summaryEntryIds),
        ),
      );

    salesRows.forEach((row) => {
      const current = salesByEntryId.get(row.entryId) || [];
      current.push({
        channelId: row.salesChannelId,
        name: row.channelNameSnapshot,
        amount: toRiyals(row.amountHalalas),
      });
      salesByEntryId.set(row.entryId, current);
    });
  }

  const entriesByCloseoutId = new Map<string, typeof entryRows>();
  entryRows.forEach((row) => {
    if (!row.closeoutId) return;
    const current = entriesByCloseoutId.get(row.closeoutId) || [];
    current.push(row);
    entriesByCloseoutId.set(row.closeoutId, current);
  });

  const actorIds = [...new Set(
    closeoutRows.flatMap((row) => [
      row.submittedByUserId,
      row.reviewedByUserId,
    ].filter(Boolean)),
  )] as string[];

  const actorNameById = new Map<string, string>();
  if (actorIds.length > 0) {
    const actorRows = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(inArray(users.id, actorIds));
    actorRows.forEach((actorRow) => actorNameById.set(actorRow.id, actorRow.name));
  }

  return closeoutRows.map((row) => {
    const linkedEntries = (entriesByCloseoutId.get(row.id) || []).filter(
      (entry) => entry.status === "active",
    );
    const summaryEntry = linkedEntries.find((entry) => entry.type === "summary");
    const salesRows = summaryEntry ? salesByEntryId.get(summaryEntry.id) || [] : [];

    const outflowRows: CloseoutOutflowRow[] = linkedEntries
      .filter((entry) => entry.type !== "summary")
      .map((entry, index) => {
        const entryType: CloseoutOutflowRow["type"] =
          entry.type === "purchases" || entry.type === "expense" || entry.type === "withdrawal"
            ? entry.type
            : "expense";
        return {
          id: `${row.clientCloseoutId}-out-${index + 1}`,
          type: entryType,
          typeLabel: "",
          categoryId: entry.categoryId || null,
          category: "",
          note: entry.note || "",
          amount: toRiyals(entry.amountHalalas),
        };
      });

    const totalSalesHalalas = linkedEntries
      .filter((entry) => entry.type === "summary")
      .reduce((sum, entry) => sum + entry.amountHalalas, 0);
    const totalOutflowHalalas = linkedEntries
      .filter((entry) => entry.type !== "summary")
      .reduce((sum, entry) => sum + entry.amountHalalas, 0);

    const totals = totalSalesHalalas > 0 || totalOutflowHalalas > 0
      ? closeoutTotalsFromHalalas(totalSalesHalalas, totalOutflowHalalas)
      : closeoutTotalsFromRiyalRows(salesRows, outflowRows);

    const status = mapCloseoutStatus(row.status);
    const submittedByName = actorNameById.get(row.submittedByUserId) || "";
    const reviewedByName = row.reviewedByUserId ? actorNameById.get(row.reviewedByUserId) || "" : null;

    return {
      id: row.clientCloseoutId,
      storeId: input.storeId,
      storeName: storeRow?.name || "",
      date: row.date,
      daySequence: row.daySequence,
      status,
      notebookTheme: null,
      openedByUserId: row.submittedByUserId,
      openedByName: submittedByName,
      submittedByUserId: row.submittedByUserId,
      submittedByName,
      submittedAt: row.createdAt.toISOString(),
      reviewedAt: status === "reviewed" && row.reviewedAt ? row.reviewedAt.toISOString() : null,
      reviewedByName: status === "reviewed" ? reviewedByName : null,
      returnedAt: status === "returned" && row.reviewedAt ? row.reviewedAt.toISOString() : null,
      returnedByName: status === "returned" ? reviewedByName : null,
      returnReason: status === "returned" ? row.returnReason || null : null,
      note: row.note || "",
      sales: salesRows,
      outflows: outflowRows,
      attachments: [],
      syncedToEntries: status === "reviewed",
      totals,
    };
  });
}
