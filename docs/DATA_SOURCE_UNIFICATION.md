# Data Source Unification Policy

## Production source of truth

PostgreSQL accessed through validated API routes is the only durable source of
truth for production data.

This includes:

- operational entries, sales summaries, expenses, withdrawals, and reviews
- daily closeouts and closeout workflow events
- organization configuration, stores, channels, staff, and permissions
- owner/runtime settings, notebook theme, and user-facing preferences
- attachment metadata and server-managed object/inline storage references
- authentication/session state through signed server sessions (future auth launch)

Browser storage is not a production source of truth.

## Production readiness contract

Production source-unification mode must be DB-backed while keeping the current
no-password/prototype entry flow until the auth launch phase. Do not merge/deploy
this mode until the environment is configured with:

```bash
APP_MODE=production
NEXT_PUBLIC_APP_MODE=production
DATABASE_URL=...
NEXT_PUBLIC_CLOSEOUTS_API_ENABLED=true
NEXT_PUBLIC_ENTRIES_API_ENABLED=true
NEXT_PUBLIC_ORG_CONFIG_API_ENABLED=true
NEXT_PUBLIC_PHASE9_API_ENABLED=true
NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED=true
NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE=true
NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE=false
ALLOW_HEADER_AUTH_CONTEXT=false
NEXT_PUBLIC_AUTH_API_ENABLED=true
AUTH_DB_CREDENTIALS_ENABLED=true
AUTH_SESSION_SECRET=...
AUTH_ORGANIZATION_ID=...
AUTH_OWNER_USER_ID=...
# Legacy ID maps optional after auth launch — see docs/PRODUCTION_STATUS.md
```

**CI production deploy** (`deploy-production.yml`) enables auth launch + wave 7 SaaS.  
Legacy env ID maps are required only while `PROTOTYPE_ACCESS_MODE=true` or `ALLOW_HEADER_AUTH_CONTEXT=true`.

For manual VPS rollout, auth-launch values:

```bash
NEXT_PUBLIC_AUTH_API_ENABLED=true
AUTH_DB_CREDENTIALS_ENABLED=true
NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE=false
ALLOW_HEADER_AUTH_CONTEXT=false
AUTH_SESSION_SECRET=...
```

If any required value is missing, server APIs fail fast with a configuration
error instead of silently falling back to prototype/demo/local sources. This is
intentional: it prevents the previous class of issues where production appeared
to boot but did not fetch stores, users, or operational data correctly.

## Browser storage policy

`localStorage`, `sessionStorage`, and IndexedDB are allowed only for
prototype/demo fallback behavior. Production mode must not read or write durable
business data, preferences, credentials, or attachments from browser storage.

The central client-side guard is:

```ts
isBrowserPersistentStorageAllowed()
```

Production app mode and `NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE=true` both
block browser persistence. This keeps the cutover safe while existing prototype
paths are migrated in small, reversible steps.

## Safe migration rule

Do not delete legacy browser data as part of UI boot. Migration must be explicit,
auditable, and repeatable:

1. inventory the legacy keys and IndexedDB stores
2. export a backup/snapshot
3. validate records before writing to DB
4. use idempotent migration scripts with dry-run support
5. compare record counts and financial totals before/after
6. disable the fallback only after the DB copy is verified

## Current transitional state

- Entries, summaries, reports, closeouts, org config, auth, and runtime settings
  already have DB/API paths behind feature flags.
- Browser persistence is now centrally blocked for production app mode.
- Employee notebook-theme preferences are part of the runtime settings snapshot
  and persist through the runtime settings API/DB path when enabled.
- Owner shell notification preferences, including closeout alert state and
  duplicate-sales acknowledgements, are part of the runtime settings snapshot
  when the DB settings API is enabled.
- DB entry attachments now use a server-normalized inline storage key for new
  writes, while legacy raw `data:` rows remain readable. IndexedDB remains only
  a prototype/local fallback.
- Prototype/demo mode can still use local browser storage until each legacy
  fallback has a DB-backed replacement and migration script.

## Target invariant

```text
UI state: memory/cache only
Durable data: UI -> API -> PostgreSQL/object storage
Prototype fallback: allowed only outside production app mode
```

## Canonical identity invariant

DB-backed runtime objects use database UUIDs as their canonical `id`.

- Stores: `business.id` is the `stores.id` UUID; old values such as `shami`
  are kept only as `legacyId`.
- Staff: `person.id` is the `users.id` UUID; old values such as `ahmed` are
  kept only as `legacyId`.
- Sales channels loaded from DB use the sales-channel UUID as `id`; legacy
  labels such as `cash` stay in `legacyId` for icons, labels, and temporary
  compatibility maps.

This prevents UI/API comparisons between two identities for the same entity.

## Modern foundation reset

When all existing data is confirmed as non-production/demo data, reset through
the guarded script:

```bash
RESET_FOUNDATION_CONFIRM=reset-modern-foundation pnpm db:reset:foundation
```

Production deploy can run the same reset exactly once when the pushed commit
message includes `[reset-foundation]`. The script:

- truncates the old demo data
- seeds one canonical organization and store
- seeds one owner and two employees
- grants employee store access
- seeds sales channels and outflow categories
- writes canonical runtime settings using UUID `id` values and `legacyId` only
  for temporary compatibility
- verifies the resulting counts before committing the transaction
