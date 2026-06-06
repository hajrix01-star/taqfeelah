import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { assertPlatformAdminAccess } from "@/core/auth/assert-platform-admin-access";
import { getDb } from "@/core/db/client";
import {
  invoices,
  organizations,
  paymentEvents,
  subscriptions,
} from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";

const inputSchema = z.object({
  actorUserId: z.string().uuid(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

function toRiyals(halalas: number): number {
  return Number((halalas / 100).toFixed(2));
}

export async function getSaasOverviewKpis(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid SaaS overview KPI input.", parsed.error.flatten());
  }
  const input = parsed.data;
  assertPlatformAdminAccess({ actorUserId: input.actorUserId });

  const db = getDb();
  const fromDate = new Date(`${input.from}T00:00:00.000Z`);
  const toDate = new Date(`${input.to}T23:59:59.999Z`);

  const [orgCounts] = await db
    .select({
      total: count(),
      active: sql<number>`count(*) filter (where ${organizations.status} = 'active')`,
      suspended: sql<number>`count(*) filter (where ${organizations.status} = 'suspended')`,
    })
    .from(organizations);

  const [subscriptionCounts] = await db
    .select({
      active: sql<number>`count(*) filter (where ${subscriptions.status} = 'active')`,
      trialing: sql<number>`count(*) filter (where ${subscriptions.status} = 'trialing')`,
      pastDue: sql<number>`count(*) filter (where ${subscriptions.status} = 'past_due')`,
      canceled: sql<number>`count(*) filter (where ${subscriptions.status} = 'canceled')`,
    })
    .from(subscriptions);

  const paidInvoices = await db
    .select({
      amountHalalas: invoices.amountHalalas,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.status, "paid"),
        gte(invoices.paidAt, fromDate),
        lte(invoices.paidAt, toDate),
      ),
    );

  const failedPayments = await db
    .select({ total: count() })
    .from(paymentEvents)
    .where(
      and(
        eq(paymentEvents.eventType, "payment_failed"),
        gte(paymentEvents.occurredAt, fromDate),
        lte(paymentEvents.occurredAt, toDate),
      ),
    );

  const collectionsHalalas = paidInvoices.reduce((sum, row) => sum + row.amountHalalas, 0);

  return {
    from: input.from,
    to: input.to,
    organizations: {
      total: Number(orgCounts?.total || 0),
      active: Number(orgCounts?.active || 0),
      suspended: Number(orgCounts?.suspended || 0),
    },
    subscriptions: {
      active: Number(subscriptionCounts?.active || 0),
      trialing: Number(subscriptionCounts?.trialing || 0),
      pastDue: Number(subscriptionCounts?.pastDue || 0),
      canceled: Number(subscriptionCounts?.canceled || 0),
    },
    revenue: {
      collections: toRiyals(collectionsHalalas),
      failedPayments: Number(failedPayments[0]?.total || 0),
      currency: "SAR",
    },
  };
}
