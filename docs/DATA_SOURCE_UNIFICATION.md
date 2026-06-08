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
- authentication/session state through signed server sessions

Browser storage is not a production source of truth.

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
- Prototype/demo mode can still use local browser storage until each legacy
  fallback has a DB-backed replacement and migration script.

## Target invariant

```text
UI state: memory/cache only
Durable data: UI -> API -> PostgreSQL/object storage
Prototype fallback: allowed only outside production app mode
```
