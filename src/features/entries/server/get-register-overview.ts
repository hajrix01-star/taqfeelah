import { z } from "zod";
import { ValidationError } from "@/core/errors/app-error";
import { getStorePeriodSummary } from "@/features/reports/server/get-store-period-summary";
import { listStoreCloseouts } from "@/features/closeouts/server/list-store-closeouts";
import type { MemberRole } from "@/core/auth/roles";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  storeIds: z.array(z.string().uuid()).min(1).max(50),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  from: dateSchema,
  to: dateSchema,
  period: z.enum(["day", "month", "year", "custom"]).default("day"),
});

type RegisterOverviewInput = z.infer<typeof inputSchema>;

async function listAllCloseouts(input: RegisterOverviewInput, storeId: string) {
  const items: Array<Record<string, unknown>> = [];
  let cursor: string | undefined;
  do {
    const result = await listStoreCloseouts({
      organizationId: input.organizationId,
      storeId,
      actorUserId: input.actorUserId,
      actorRole: input.actorRole as MemberRole,
      dateFrom: input.from,
      dateTo: input.to,
      limit: 500,
      cursor,
      paginated: true,
    });
    items.push(...result.items);
    cursor = result.nextCursor || undefined;
  } while (cursor);
  return items;
}

function sortCloseoutsNewestFirst(left: Record<string, unknown>, right: Record<string, unknown>) {
  const leftDate = `${String(left.date || "")}T${String(left.createdAt || left.openedAt || "")}`;
  const rightDate = `${String(right.date || "")}T${String(right.createdAt || right.openedAt || "")}`;
  return rightDate.localeCompare(leftDate);
}

export async function getRegisterOverview(rawInput: RegisterOverviewInput) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid register overview input.", parsed.error.flatten());
  }

  const input = parsed.data;
  if (input.from > input.to) {
    throw new ValidationError("from must be earlier than or equal to to.");
  }

  const [summaryResults, closeoutResults] = await Promise.all([
    Promise.all(input.storeIds.map((storeId) => getStorePeriodSummary({
      organizationId: input.organizationId,
      storeId,
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
      from: input.from,
      to: input.to,
    }))),
    Promise.all(input.storeIds.map((storeId) => listAllCloseouts(input, storeId))),
  ]);

  const totalsByStoreId: Record<string, unknown> = {};
  summaryResults.forEach((summary) => {
    totalsByStoreId[summary.storeId] = summary;
  });

  return {
    from: input.from,
    to: input.to,
    period: input.period,
    storeIds: input.storeIds,
    totalsByStoreId,
    closeouts: closeoutResults.flat().sort(sortCloseoutsNewestFirst),
  };
}
