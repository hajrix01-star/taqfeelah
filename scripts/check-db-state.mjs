import pg from "pg";

const connectionString = process.env.DATABASE_URL
  || "postgresql://postgres:123456@localhost:5432/taqfeelah_local";

const client = new pg.Client({ connectionString });

await client.connect();

const counts = await client.query(`
  select
    (select count(*)::int from entries) as entries,
    (select count(*)::int from daily_closeouts) as closeouts,
    (select count(*)::int from audit_events) as audit_events,
    (select name from organizations limit 1) as org,
    (select name from stores limit 1) as store
`);

console.log("counts:", counts.rows[0]);

const runtimeSettings = await client.query(`
  select metadata->'settings'->'configuredBusinesses' as biz
  from audit_events
  where action = 'runtime_settings_saved'
  order by created_at desc
  limit 1
`);

console.log("runtime_settings businesses:", JSON.stringify(runtimeSettings.rows[0]?.biz ?? null, null, 2));

const audits = await client.query(`
  select action, created_at, left(metadata::text, 200) as meta
  from audit_events
  order by created_at desc
`);

console.log("audit_events:", audits.rows);

await client.end();
