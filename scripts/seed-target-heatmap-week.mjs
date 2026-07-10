#!/usr/bin/env node
/**
 * Local/dev seed for the experimental target heatmap.
 *
 * Requires DATABASE_URL. This writes official closeout + summary entry rows,
 * so the heatmap reads the same server data path used in production.
 */
import { randomUUID } from "node:crypto";
import pg from "pg";

const SEED_NOTE = "local-dev-target-heatmap-week-seed";
const DEFAULT_AMOUNTS = [3200, 4700, 5100, 6800, 4300, 5600, 7300];

function envValue(name, fallback = "") {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function parseAmountList() {
  const raw = envValue("SEED_WEEK_SALES");
  if (!raw) return DEFAULT_AMOUNTS;
  const amounts = raw
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);
  if (amounts.length !== 7) {
    throw new Error("SEED_WEEK_SALES must contain exactly 7 positive numbers, for example: 3200,4700,5100,6800,4300,5600,7300");
  }
  return amounts;
}

function addDays(date, days) {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function parseIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("SEED_WEEK_END must be YYYY-MM-DD.");
  }
  return new Date(`${value}T00:00:00.000Z`);
}

function weekDates() {
  const endRaw = envValue("SEED_WEEK_END", isoDate(new Date()));
  const end = parseIsoDate(endRaw);
  return Array.from({ length: 7 }, (_, index) => isoDate(addDays(end, index - 6)));
}

async function optionalSingle(client, query, params, label) {
  const result = await client.query(query, params);
  if (result.rowCount === 1) return result.rows[0];
  if (result.rowCount === 0) throw new Error(`Could not resolve ${label}. Set the matching SEED_* env value.`);
  throw new Error(`More than one ${label} matched. Set the matching SEED_* env value.`);
}

async function resolveSeedContext(client) {
  const organizationId = envValue("SEED_ORGANIZATION_ID", envValue("NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID"));
  const ownerUserId = envValue("SEED_OWNER_USER_ID", envValue("NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID"));
  const storeId = envValue("SEED_STORE_ID");

  const organization = organizationId
    ? (await client.query("select id, name from organizations where id = $1", [organizationId])).rows[0]
    : await optionalSingle(client, "select id, name from organizations where status = 'active'", [], "active organization");
  if (!organization) throw new Error("Organization was not found.");

  const owner = ownerUserId
    ? (await client.query("select id, name from users where id = $1", [ownerUserId])).rows[0]
    : await optionalSingle(
      client,
      `
      select u.id, u.name
      from organization_members om
      join users u on u.id = om.user_id
      where om.organization_id = $1 and om.role = 'owner' and om.status = 'active'
      `,
      [organization.id],
      "active owner",
    );
  if (!owner) throw new Error("Owner user was not found.");

  const store = storeId
    ? (await client.query("select id, name from stores where organization_id = $1 and id = $2", [organization.id, storeId])).rows[0]
    : await optionalSingle(
      client,
      "select id, name from stores where organization_id = $1 and status = 'active'",
      [organization.id],
      "active store",
    );
  if (!store) throw new Error("Store was not found.");

  const channel = await resolveSalesChannel(client, organization.id, store.id);
  return { organization, owner, store, channel };
}

async function resolveSalesChannel(client, organizationId, storeId) {
  const explicitChannelId = envValue("SEED_SALES_CHANNEL_ID");
  if (explicitChannelId) {
    const result = await client.query(
      "select id, name from sales_channels where organization_id = $1 and store_id = $2 and id = $3",
      [organizationId, storeId, explicitChannelId],
    );
    if (!result.rows[0]) throw new Error("SEED_SALES_CHANNEL_ID was not found for this store.");
    return result.rows[0];
  }

  const existing = await client.query(
    `
    select id, name
    from sales_channels
    where organization_id = $1 and store_id = $2 and status = 'active'
    order by created_at asc
    limit 1
    `,
    [organizationId, storeId],
  );
  if (existing.rows[0]) return existing.rows[0];

  const channelId = randomUUID();
  await client.query(
    `
    insert into sales_channels (id, organization_id, store_id, name, kind, status)
    values ($1, $2, $3, $4, 'payment_method', 'active')
    `,
    [channelId, organizationId, storeId, "نقد"],
  );
  return { id: channelId, name: "نقد" };
}

async function ensureCloseout(client, { organizationId, storeId, ownerUserId, date }) {
  const clientCloseoutId = `target-heatmap-week-${date}`;
  const existing = await client.query(
    `
    select id, day_sequence
    from daily_closeouts
    where organization_id = $1 and store_id = $2 and client_closeout_id = $3
    limit 1
    `,
    [organizationId, storeId, clientCloseoutId],
  );
  if (existing.rows[0]) return existing.rows[0];

  const sequenceResult = await client.query(
    `
    select coalesce(max(day_sequence), 0)::int + 1 as next_sequence
    from daily_closeouts
    where organization_id = $1 and store_id = $2 and date = $3
    `,
    [organizationId, storeId, date],
  );
  const closeoutId = randomUUID();
  const daySequence = Number(sequenceResult.rows[0]?.next_sequence || 1);
  await client.query(
    `
    insert into daily_closeouts (
      id, organization_id, store_id, date, day_sequence, client_closeout_id, status, submitted_by_user_id
    )
    values ($1, $2, $3, $4, $5, $6, 'approved', $7)
    `,
    [closeoutId, organizationId, storeId, date, daySequence, clientCloseoutId, ownerUserId],
  );
  return { id: closeoutId, day_sequence: daySequence };
}

async function seedDay(client, context, date, amount) {
  const closeout = await ensureCloseout(client, {
    organizationId: context.organization.id,
    storeId: context.store.id,
    ownerUserId: context.owner.id,
    date,
  });

  await client.query(
    `
    delete from entries
    where organization_id = $1 and store_id = $2 and closeout_id = $3 and note = $4
    `,
    [context.organization.id, context.store.id, closeout.id, SEED_NOTE],
  );

  const entryId = randomUUID();
  const amountHalalas = Math.round(amount * 100);
  await client.query(
    `
    insert into entries (
      id, organization_id, store_id, closeout_id, date, type, amount_halalas, currency, note, status, entered_by_user_id
    )
    values ($1, $2, $3, $4, $5, 'summary', $6, 'SAR', $7, 'active', $8)
    `,
    [entryId, context.organization.id, context.store.id, closeout.id, date, amountHalalas, SEED_NOTE, context.owner.id],
  );
  await client.query(
    `
    insert into entry_sales_channels (
      organization_id, store_id, entry_id, sales_channel_id, channel_name_snapshot, amount_halalas
    )
    values ($1, $2, $3, $4, $5, $6)
    `,
    [context.organization.id, context.store.id, entryId, context.channel.id, context.channel.name, amountHalalas],
  );
  return { date, amount, closeoutId: closeout.id, entryId };
}

async function main() {
  const databaseUrl = envValue("DATABASE_URL");
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required. Start your terminal with the same DATABASE_URL used by the local app.");
  }

  const dates = weekDates();
  const amounts = parseAmountList();
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const context = await resolveSeedContext(client);
    await client.query("begin");
    const rows = [];
    for (let index = 0; index < dates.length; index += 1) {
      rows.push(await seedDay(client, context, dates[index], amounts[index]));
    }
    await client.query("commit");
    console.log(JSON.stringify({
      ok: true,
      organization: context.organization,
      store: context.store,
      channel: context.channel,
      seeded: rows.map((row) => ({ date: row.date, sales: row.amount })),
    }, null, 2));
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
