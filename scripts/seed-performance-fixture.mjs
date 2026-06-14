#!/usr/bin/env node
/**
 * Performance fixture seed — local/staging only (see docs/PERFORMANCE_RULES.md §7).
 *
 * Default scale (full): 1 org, 5 stores, 730 days, 10 entries/day/store ≈ 36.5k rows.
 * Quick scale: 1 store, 30 days, 10 entries/day ≈ 300 rows.
 *
 * Usage:
 *   node scripts/seed-performance-fixture.mjs              # dry-run plan
 *   node scripts/seed-performance-fixture.mjs --apply      # insert data
 *   node scripts/seed-performance-fixture.mjs --purge        # delete perf org (dry-run)
 *   node scripts/seed-performance-fixture.mjs --purge --apply
 *
 * Env:
 *   DATABASE_URL
 *   PERF_SEED_SCALE=full|quick   (default: full)
 */
import { randomUUID } from "node:crypto";
import pg from "pg";

const PERF_ORG_ID = "a0000000-0000-4000-8000-000000000001";
const PERF_OWNER_ID = "a0000000-0000-4000-8000-000000000010";

const STORE_IDS = [
  "a0000000-0000-4000-8000-000000000101",
  "a0000000-0000-4000-8000-000000000102",
  "a0000000-0000-4000-8000-000000000103",
  "a0000000-0000-4000-8000-000000000104",
  "a0000000-0000-4000-8000-000000000105",
];

const CHANNEL_IDS = [
  "a0000000-0000-4000-8000-000000001101",
  "a0000000-0000-4000-8000-000000001102",
  "a0000000-0000-4000-8000-000000001103",
  "a0000000-0000-4000-8000-000000001104",
  "a0000000-0000-4000-8000-000000001105",
];

const SCALE_PRESETS = {
  full: { storeCount: 5, dayCount: 730, entriesPerDay: 10 },
  quick: { storeCount: 1, dayCount: 30, entriesPerDay: 10 },
};

const apply = process.argv.includes("--apply");
const purge = process.argv.includes("--purge");
const scaleName = (process.env.PERF_SEED_SCALE || "full").trim().toLowerCase();
const scale = SCALE_PRESETS[scaleName] || SCALE_PRESETS.full;

const connectionString = process.env.DATABASE_URL
  || "postgresql://postgres:123456@localhost:5432/taqfeelah_local";

function isoDaysAgo(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

async function countFixtureRows(client) {
  const { rows } = await client.query(
    `
    select
      (select count(*)::int from stores where organization_id = $1) as stores,
      (select count(*)::int from daily_closeouts where organization_id = $1) as closeouts,
      (select count(*)::int from entries where organization_id = $1) as entries
    `,
    [PERF_ORG_ID],
  );
  return rows[0] || { stores: 0, closeouts: 0, entries: 0 };
}

async function purgeFixture(client) {
  const before = await countFixtureRows(client);
  console.log(`Performance fixture purge plan for org ${PERF_ORG_ID}`);
  console.log(`  stores=${before.stores} closeouts=${before.closeouts} entries=${before.entries}`);

  if (!apply) {
    console.log("\nDry run only. Re-run with --purge --apply to delete the performance org.");
    return;
  }

  await client.query("delete from organizations where id = $1", [PERF_ORG_ID]);
  console.log("\nDeleted performance fixture organization (cascade).");
}

async function seedFoundation(client, storeIds) {
  await client.query("begin");
  try {
    await client.query(
      `
      insert into organizations (id, name, status)
      values ($1, $2, 'active')
      on conflict (id) do update set
        name = excluded.name,
        status = 'active',
        updated_at = now()
      `,
      [PERF_ORG_ID, "Performance Fixture Org (not a customer)"],
    );

    await client.query(
      `
      insert into users (id, name, status)
      values ($1, $2, 'active')
      on conflict (id) do update set
        name = excluded.name,
        status = 'active',
        updated_at = now()
      `,
      [PERF_OWNER_ID, "Perf Owner"],
    );

    const existingMember = await client.query(
      `
      select id
      from organization_members
      where organization_id = $1 and user_id = $2 and status = 'active'
      limit 1
      `,
      [PERF_ORG_ID, PERF_OWNER_ID],
    );

    if (existingMember.rowCount > 0) {
      await client.query(
        `
        update organization_members
        set role = 'owner', updated_at = now()
        where id = $1
        `,
        [existingMember.rows[0].id],
      );
    } else {
      await client.query(
        `
        insert into organization_members (id, organization_id, user_id, role, status)
        values ($1, $2, $3, 'owner', 'active')
        `,
        [randomUUID(), PERF_ORG_ID, PERF_OWNER_ID],
      );
    }

    for (let index = 0; index < storeIds.length; index += 1) {
      const storeId = storeIds[index];
      const channelId = CHANNEL_IDS[index];
      await client.query(
        `
        insert into stores (id, organization_id, name, status)
        values ($1, $2, $3, 'active')
        on conflict (id) do update set
          organization_id = excluded.organization_id,
          name = excluded.name,
          status = 'active',
          updated_at = now()
        `,
        [storeId, PERF_ORG_ID, `Perf Store ${index + 1}`],
      );

      await client.query(
        `
        insert into sales_channels (id, organization_id, store_id, name, status)
        values ($1, $2, $3, $4, 'active')
        on conflict (id) do update set
          organization_id = excluded.organization_id,
          store_id = excluded.store_id,
          name = excluded.name,
          status = 'active'
        `,
        [channelId, PERF_ORG_ID, storeId, "Cash"],
      );
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

async function insertCloseoutBatch(client, rows) {
  if (!rows.length) return;
  const values = [];
  const params = [];
  rows.forEach((row, index) => {
    const base = index * 8;
    values.push(
      `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`,
    );
    params.push(
      row.id,
      PERF_ORG_ID,
      row.storeId,
      row.date,
      row.daySequence,
      row.clientCloseoutId,
      "approved",
      PERF_OWNER_ID,
    );
  });

  await client.query(
    `
    insert into daily_closeouts (
      id, organization_id, store_id, date, day_sequence, client_closeout_id, status, submitted_by_user_id
    )
    values ${values.join(", ")}
    on conflict (store_id, client_closeout_id) do nothing
    `,
    params,
  );
}

async function insertEntryBatch(client, rows) {
  if (!rows.length) return;
  const values = [];
  const params = [];
  rows.forEach((row, index) => {
    const base = index * 9;
    values.push(
      `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9})`,
    );
    params.push(
      row.id,
      PERF_ORG_ID,
      row.storeId,
      row.closeoutId,
      row.date,
      row.type,
      row.amountHalalas,
      "active",
      PERF_OWNER_ID,
    );
  });

  await client.query(
    `
    insert into entries (
      id, organization_id, store_id, closeout_id, date, type, amount_halalas, status, entered_by_user_id
    )
    values ${values.join(", ")}
    on conflict (id) do nothing
    `,
    params,
  );
}

async function seedVolume(client, storeIds) {
  const plannedCloseouts = storeIds.length * scale.dayCount;
  const plannedEntries = plannedCloseouts * scale.entriesPerDay;

  console.log("Performance fixture seed plan");
  console.log(`  scale=${scaleName}`);
  console.log(`  organization=${PERF_ORG_ID}`);
  console.log(`  stores=${storeIds.length}`);
  console.log(`  days=${scale.dayCount}`);
  console.log(`  entries/day/store=${scale.entriesPerDay}`);
  console.log(`  planned closeouts≈${plannedCloseouts}`);
  console.log(`  planned entries≈${plannedEntries}`);

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to insert fixture data.");
    return;
  }

  await seedFoundation(client, storeIds);

  const closeoutBatch = [];
  const entryBatch = [];
  const BATCH_SIZE = 400;

  for (let dayOffset = scale.dayCount; dayOffset >= 1; dayOffset -= 1) {
    const date = isoDaysAgo(dayOffset);
    for (let storeIndex = 0; storeIndex < storeIds.length; storeIndex += 1) {
      const storeId = storeIds[storeIndex];
      const closeoutId = randomUUID();
      const clientCloseoutId = `perf-${storeIndex + 1}-${date}`;
      closeoutBatch.push({
        id: closeoutId,
        storeId,
        date,
        daySequence: 1,
        clientCloseoutId,
      });

      for (let entryIndex = 0; entryIndex < scale.entriesPerDay; entryIndex += 1) {
        entryBatch.push({
          id: randomUUID(),
          storeId,
          closeoutId,
          date,
          type: entryIndex % 2 === 0 ? "inflow" : "expense",
          amountHalalas: entryIndex % 2 === 0 ? 50000 : 10000,
        });
      }

      if (closeoutBatch.length >= BATCH_SIZE) {
        await insertCloseoutBatch(client, closeoutBatch.splice(0, closeoutBatch.length));
      }
      if (entryBatch.length >= BATCH_SIZE) {
        await insertEntryBatch(client, entryBatch.splice(0, entryBatch.length));
      }
    }
  }

  if (closeoutBatch.length) await insertCloseoutBatch(client, closeoutBatch);
  if (entryBatch.length) await insertEntryBatch(client, entryBatch);

  const after = await countFixtureRows(client);
  console.log("\nSeed complete.");
  console.log(`  stores=${after.stores} closeouts=${after.closeouts} entries=${after.entries}`);
  console.log("\nBenchmark env hints:");
  console.log(`  BENCH_ORGANIZATION_ID=${PERF_ORG_ID}`);
  console.log(`  BENCH_STORE_ID=${storeIds[0]}`);
  console.log(`  BENCH_OWNER_USER_ID=${PERF_OWNER_ID}`);
}

const client = new pg.Client({ connectionString });
await client.connect();

try {
  if (purge) {
    await purgeFixture(client);
  } else {
    const storeIds = STORE_IDS.slice(0, scale.storeCount);
    await seedVolume(client, storeIds);
  }
} finally {
  await client.end();
}
