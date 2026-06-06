import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { assertStoreAccess } from "@/core/auth/assert-store-access";
import { type MemberRole } from "@/core/auth/roles";
import { ValidationError } from "@/core/errors/app-error";
import { auditEvents, entries, stores, users } from "@/core/db/schema";

const closeoutDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD");

const listCloseoutsInputSchema = z.object({
  organizationId: z.string().uuid(),
  storeId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  dateFrom: closeoutDateSchema.optional(),
  dateTo: closeoutDateSchema.optional(),
});

const submitMetadataSchema = z.object({
  closeoutId: z.string().trim().min(1).max(120),
  date: closeoutDateSchema,
  totalSalesHalalas: z.coerce.number().int().nonnegative().optional(),
  totalOutflowHalalas: z.coerce.number().int().nonnegative().optional(),
  salesChannels: z
    .array(
      z.object({
        salesChannelId: z.string().uuid(),
        channelName: z.string().trim().min(1).max(120),
        amountHalalas: z.coerce.number().int().nonnegative(),
      }),
    )
    .optional(),
  outflows: z
    .array(
      z.object({
        type: z.enum(["purchases", "expense", "withdrawal"]),
        amountHalalas: z.coerce.number().int().positive(),
        categoryId: z.string().nullable().optional(),
        categoryName: z.string().optional(),
        typeLabel: z.string().optional(),
        note: z.string().optional().nullable(),
      }),
    )
    .optional(),
  outflowEntryIds: z.array(z.string().uuid()).optional(),
  summaryEntryId: z.string().uuid().optional(),
  note: z.string().optional(),
  daySequence: z.coerce.number().int().positive().optional(),
});

const reviewMetadataSchema = z.object({
  closeoutId: z.string().trim().min(1).max(120),
  date: closeoutDateSchema,
});

type ListCloseoutsInput = z.infer<typeof listCloseoutsInputSchema>;
type SubmitMetadata = z.infer<typeof submitMetadataSchema>;

type CloseoutOutflowRow = {
  id: string;
  type: "purchases" | "expense" | "withdrawal";
  typeLabel: string;
  categoryId: string | null;
  category: string;
  note: string;
  amount: number;
};

type EventAggregate = {
  closeoutId: string;
  date: string;
  submit: {
    createdAt: Date;
    actorUserId: string;
    metadata: SubmitMetadata;
  } | null;
  approved: {
    createdAt: Date;
    actorUserId: string;
  } | null;
  returned: {
    createdAt: Date;
    actorUserId: string;
    reason: string | null;
  } | null;
};

function toRiyals(halalas: number): number {
  return Number((halalas / 100).toFixed(2));
}

function toTimestamp(date: Date): number {
  const value = date.getTime();
  return Number.isFinite(value) ? value : 0;
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

  const rows = await db
    .select({
      action: auditEvents.action,
      actorUserId: auditEvents.actorUserId,
      createdAt: auditEvents.createdAt,
      reason: auditEvents.reason,
      metadata: auditEvents.metadata,
    })
    .from(auditEvents)
    .where(
      and(
        eq(auditEvents.organizationId, input.organizationId),
        eq(auditEvents.storeId, input.storeId),
        inArray(auditEvents.action, [
          "closeout_submitted",
          "closeout_resubmitted",
          "closeout_approved",
          "closeout_returned",
        ]),
        input.dateFrom ? sql`${auditEvents.metadata} ->> 'date' >= ${input.dateFrom}` : undefined,
        input.dateTo ? sql`${auditEvents.metadata} ->> 'date' <= ${input.dateTo}` : undefined,
      ),
    )
    .orderBy(desc(auditEvents.createdAt));

  const aggregates = new Map<string, EventAggregate>();
  for (const row of rows) {
    const metadata =
      row.action === "closeout_submitted" || row.action === "closeout_resubmitted"
        ? submitMetadataSchema.safeParse(row.metadata)
        : reviewMetadataSchema.safeParse(row.metadata);

    if (!metadata.success) continue;
    const closeoutId = metadata.data.closeoutId;
    const date = metadata.data.date;
    const key = `${closeoutId}:${date}`;
    const current = aggregates.get(key) || {
      closeoutId,
      date,
      submit: null,
      approved: null,
      returned: null,
    };

    if (row.action === "closeout_submitted" || row.action === "closeout_resubmitted") {
      const eventAt = toTimestamp(row.createdAt);
      const currentSubmitAt = current.submit ? toTimestamp(current.submit.createdAt) : -1;
      if (!current.submit || eventAt >= currentSubmitAt) {
        current.submit = {
          createdAt: row.createdAt,
          actorUserId: row.actorUserId,
          metadata: metadata.data,
        };
      }
    }
    if (row.action === "closeout_approved" && !current.approved) {
      current.approved = {
        createdAt: row.createdAt,
        actorUserId: row.actorUserId,
      };
    }
    if (row.action === "closeout_returned" && !current.returned) {
      current.returned = {
        createdAt: row.createdAt,
        actorUserId: row.actorUserId,
        reason: row.reason,
      };
    }

    aggregates.set(key, current);
  }

  const actorIds = [...new Set(
    [...aggregates.values()].flatMap((item) => ([
      item.submit?.actorUserId,
      item.approved?.actorUserId,
      item.returned?.actorUserId,
    ].filter(Boolean))),
  )] as string[];

  const actorNameById = new Map<string, string>();
  if (actorIds.length > 0) {
    const actorRows = await db
      .select({
        id: users.id,
        name: users.name,
      })
      .from(users)
      .where(inArray(users.id, actorIds));
    actorRows.forEach((actorRow) => actorNameById.set(actorRow.id, actorRow.name));
  }

  const outflowEntryIds = [...new Set(
    [...aggregates.values()].flatMap((item) => item.submit?.metadata.outflowEntryIds || []),
  )];
  const outflowEntryById = new Map<string, {
    id: string;
    type: string;
    categoryId: string | null;
    note: string | null;
    amountHalalas: number;
  }>();
  if (outflowEntryIds.length > 0) {
    const outflowRows = await db
      .select({
        id: entries.id,
        type: entries.type,
        categoryId: entries.categoryId,
        note: entries.note,
        amountHalalas: entries.amountHalalas,
      })
      .from(entries)
      .where(
        and(
          eq(entries.organizationId, input.organizationId),
          eq(entries.storeId, input.storeId),
          inArray(entries.id, outflowEntryIds),
        ),
      );
    outflowRows.forEach((row) => outflowEntryById.set(row.id, row));
  }

  const closeouts = [...aggregates.values()]
    .filter((item) => Boolean(item.submit))
    .map((item) => {
      const submit = item.submit!;
      const submitAt = toTimestamp(submit.createdAt);
      const approvedAt = item.approved ? toTimestamp(item.approved.createdAt) : -1;
      const returnedAt = item.returned ? toTimestamp(item.returned.createdAt) : -1;
      const approvedAfterSubmit = approvedAt >= submitAt;
      const returnedAfterSubmit = returnedAt >= submitAt;

      let status: "submitted" | "reviewed" | "returned" = "submitted";
      if (approvedAfterSubmit || returnedAfterSubmit) {
        if (returnedAfterSubmit && returnedAt >= approvedAt) status = "returned";
        else status = "reviewed";
      }

      const salesRows = (submit.metadata.salesChannels || []).map((row) => ({
        channelId: row.salesChannelId,
        name: row.channelName,
        amount: toRiyals(row.amountHalalas),
      }));
      let outflowRows: CloseoutOutflowRow[] = (submit.metadata.outflows || []).map((row, index) => ({
        id: `${item.closeoutId}-out-${index + 1}`,
        type: row.type,
        typeLabel: row.typeLabel || "",
        categoryId: row.categoryId || null,
        category: row.categoryName || "",
        note: row.note || "",
        amount: toRiyals(row.amountHalalas),
      }));
      if (!outflowRows.length) {
        const linkedEntryIds = submit.metadata.outflowEntryIds || [];
        outflowRows = linkedEntryIds
          .map((entryId, index) => {
            const row = outflowEntryById.get(entryId);
            if (!row) return null;
            const entryType: CloseoutOutflowRow["type"] =
              row.type === "purchases" || row.type === "expense" || row.type === "withdrawal"
                ? row.type
                : "expense";
            return {
              id: `${item.closeoutId}-out-${index + 1}`,
              type: entryType,
              typeLabel: "",
              categoryId: row.categoryId || null,
              category: "",
              note: row.note || "",
              amount: toRiyals(row.amountHalalas),
            };
          })
          .filter((row): row is NonNullable<typeof row> => Boolean(row));
      }

      const totalSalesHalalas =
        submit.metadata.totalSalesHalalas
        ?? salesRows.reduce((sum, row) => sum + Math.round(row.amount * 100), 0);
      const totalOutflowHalalas =
        submit.metadata.totalOutflowHalalas
        ?? outflowRows.reduce((sum, row) => sum + Math.round(row.amount * 100), 0);

      const submittedByName = actorNameById.get(submit.actorUserId) || "";
      const reviewedByName = item.approved ? actorNameById.get(item.approved.actorUserId) || "" : null;
      const returnedByName = item.returned ? actorNameById.get(item.returned.actorUserId) || "" : null;

      return {
        id: item.closeoutId,
        storeId: input.storeId,
        storeName: storeRow?.name || "",
        date: item.date,
        daySequence: submit.metadata.daySequence ?? null,
        status,
        notebookTheme: "yellow",
        openedByUserId: submit.actorUserId,
        openedByName: submittedByName,
        submittedByUserId: submit.actorUserId,
        submittedByName,
        submittedAt: submit.createdAt.toISOString(),
        reviewedAt: status === "reviewed" && item.approved ? item.approved.createdAt.toISOString() : null,
        reviewedByName: status === "reviewed" ? reviewedByName : null,
        returnedAt: status === "returned" && item.returned ? item.returned.createdAt.toISOString() : null,
        returnedByName: status === "returned" ? returnedByName : null,
        returnReason: status === "returned" ? item.returned?.reason || null : null,
        note: submit.metadata.note || "",
        sales: salesRows,
        outflows: outflowRows,
        attachments: [],
        syncedToEntries: status === "reviewed",
        totals: {
          totalSales: toRiyals(totalSalesHalalas),
          totalOutflow: toRiyals(totalOutflowHalalas),
          netMovement: toRiyals(totalSalesHalalas - totalOutflowHalalas),
        },
      };
    })
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      const aTime = a.submittedAt || "";
      const bTime = b.submittedAt || "";
      if (aTime !== bTime) return aTime < bTime ? 1 : -1;
      return a.id < b.id ? -1 : 1;
    });

  return closeouts;
}
