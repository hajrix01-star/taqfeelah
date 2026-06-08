# Prototype Access Mode

Temporary **global** development mode that bypasses real authentication on all devices.

## Purpose

Speed up UI and domain work without username/password, OTP, session cookies, or auth API calls.

## Behavior

- Shows a simple entry screen: **Enter as owner** / **Enter as employee**
- Sets in-app role to `owner` or `employee` with full UI shells
- Does not call `/api/v1/auth/session` on entry
- Does not persist auth session in localStorage
- Uses local/demo runtime data instead of server-auth-bound APIs while active

## Enablement

**ON by default** on every environment (desktop, mobile, `taqfeelah.com`).

Disable before launch:

```bash
NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE=false
```

Set in VPS `.env.production` and GitHub Actions secrets, then redeploy.

## Mobile (LAN) development

| Command | Phone URL |
|---------|-----------|
| `pnpm dev` / `pnpm mobile:sync` | `http://<LAN-IP>:3000` |
| `pnpm preview:lan` | `http://<LAN-IP>:3000` |

## Database-first (temporary)

### Phase 0 — server API context

While prototype access is active, the UI may call store APIs with mapped prototype IDs. The server accepts header-based request context when:

```bash
ALLOW_HEADER_AUTH_CONTEXT=true
```

Set this alongside the seeded org/store/user ID maps (`NEXT_PUBLIC_CLOSEOUTS_*`) and run `node scripts/seed-closeouts-foundation.mjs` once. This is prototype/dev-only now; production-unified mode requires `NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE=false` and `ALLOW_HEADER_AUTH_CONTEXT=false`.

### Production browser-storage policy

Production mode does not treat browser storage as a durable source, including UI
preferences. See `docs/DATA_SOURCE_UNIFICATION.md` for the source-of-truth and
migration rules.

### Phase 1 — operational entries from DB

When `NEXT_PUBLIC_ENTRIES_API_ENABLED=true` (or inherited from closeouts API flag):

- Operational register loads from `/api/v1/stores/:storeId/entries` on login
- Owner/employee saves, review, void, and restore go through the entries API
- `localStorage` is not used as the entries source (DB wins)
- Closeout submit/review refreshes entries from the server instead of building local rows

Local demo seed data is still used when the entries API flag is off.

### Phase 2 — runtime settings from DB

When the same store API flags are on, owner runtime settings load/save through `/api/v1/runtime/settings` using prototype header context (`x-organization-id`, `x-user-id`, `x-member-role`). `taqfeelah_owner_settings` in `localStorage` is skipped as the settings source.

Seed/bootstrap still provides the first `runtime_settings_saved` row via `scripts/seed-closeouts-foundation.mjs`.

### Phase 3 — closeouts from DB

When `NEXT_PUBLIC_CLOSEOUTS_API_ENABLED=true`:

- Daily closeouts load from `/api/v1/stores/:storeId/closeouts` on mount
- Submit/resubmit/approve/return go through the closeouts API, then refresh from server
- In-progress drafts stay in memory only until submitted
- `taqfeelah_daily_closeouts_v1` in `localStorage` is skipped as the closeouts source

Local demo closeouts are still used when the closeouts API flag is off.

### Phase 4 — home day summaries from DB

When `NEXT_PUBLIC_ENTRIES_API_ENABLED=true` (or inherited from closeouts API flag):

- Owner home **daily** totals load from `GET /api/v1/stores/:storeId/summary/day?date=YYYY-MM-DD`
- Combined and per-store home cards aggregate SQL summaries instead of scanning all loaded entries
- Monthly home view still uses client aggregation until Phase 6 is enabled
- Home operation details and attachments still read from loaded entries for the selected day

### Phase 5 — owner reports from DB

When `NEXT_PUBLIC_ENTRIES_API_ENABLED=true`:

- Reports screen totals (combined + per-store) load from `GET /api/v1/stores/:storeId/summary/day|month|period`
- Per-store report tabs load from SQL:
  - Days: `GET /api/v1/reports/days`
  - Channels: `GET /api/v1/reports/channels`
  - Outflow/expenses: `GET /api/v1/reports/outflow` (category filter + optional transactions)
  - Attachments: `GET /api/v1/reports/attachments`
- Notebook share/export for reports still uses loaded entries until a server export path is added
- When the entries API flag is off, reports continue to use in-memory operational entries

### Phase 6 — home monthly summaries + register pagination foundation

When `NEXT_PUBLIC_ENTRIES_API_ENABLED=true` (or inherited from closeouts API flag):

- Owner home **monthly** totals load from `GET /api/v1/stores/:storeId/summary/month?month=YYYY-MM`
- Combined and per-store monthly cards aggregate SQL summaries instead of scanning all loaded entries
- Daily home behavior from Phase 4 is unchanged
- Home operation details and attachments still read from loaded entries for the selected day
- Register still loads entries in the legacy bulk window until Phase 7 wires cursor pagination in the UI

Server-only (backward compatible):

- `GET /api/v1/stores/:storeId/entries?paginated=1&limit=50&cursor=...` returns `{ items, nextCursor }`
- Without `paginated` / `cursor`, the route keeps returning a plain array for existing clients

### Phase 7 — register cursor pagination in UI

When `NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED=true` (or inherited from entries API flag):

- Owner register loads entries for the selected period via paginated store entries API
- Operations tab loads additional pages automatically near scroll end (no visual change)
- Closeouts tab loads remaining pages in the background for complete grouping
- Global operational entries preload shrinks to a 30-day working window for home/employee flows
- When the pagination flag is off, register keeps using the in-memory `operationalEntries` filter path

### Phase 8 — org config APIs (stores / members / channels)

When `NEXT_PUBLIC_ORG_CONFIG_API_ENABLED=true` (or inherited from entries API flag):

- Stores list/create/update are available at `/api/v1/stores` and `/api/v1/stores/:storeId`
- Sales channels list/update are available at `/api/v1/stores/:storeId/sales-channels`
- Outflow categories list is available at `/api/v1/stores/:storeId/outflow-categories`
- Members list (manager+) is available at `/api/v1/members`
- Owner runtime loads stores/channels/staff from org-config APIs on login (no visual change)
- Owner settings changes for stores/channels/team persist through org-config APIs with debounced sync
- Runtime settings keep `storeOperationalSettings`, notebook theme, owner profile, and auth config only
- Client helpers live in `org-config-api-client.js` and `use-org-config-from-api.js`

### Phase 10-prep — auth foundations (inactive)

When flags remain at default values:

- `auth_identities` stores hashed owner passwords and employee PINs (optional via members API)
- `POST/PATCH /api/v1/members` manage members + store access + optional credentials
- OTP request/verify endpoints exist as stubs (no SMS/email provider)
- `AUTH_DB_CREDENTIALS_ENABLED=false` keeps login on env/runtime settings path
- `NEXT_PUBLIC_AUTH_API_ENABLED=false` keeps prototype role picker as entry path
- See `docs/PHASE_10_AUTH.md`

### Phase 11-prep — SaaS admin foundations (inactive)

When flags remain at default values:

- `/saas-admin` route exists but shows disabled shell unless `NEXT_PUBLIC_SAAS_ADMIN_ENABLED=true`
- `GET /api/v1/saas-admin/kpis/overview` and `/organizations` return 503 unless `SAAS_ADMIN_API_ENABLED=true`
- `recordUsageEvent()` is a no-op unless `USAGE_TRACKING_ENABLED=true`
- Platform admin access uses `SAAS_PLATFORM_ADMIN_USER_IDS` allowlist
- See `docs/PHASE_11_SAAS_ADMIN.md`

### Phase 9 — duplicate summary, notebook export, inline attachments

When `NEXT_PUBLIC_PHASE9_API_ENABLED=true` (or inherited from entries API flag):

- Duplicate summary approval goes through `POST /api/v1/stores/:storeId/entries/duplicate-summary/approve` (creates entry + `duplicate_approved` audit)
- Owner duplicate alerts acknowledgement goes through `POST /api/v1/stores/:storeId/entries/duplicate-summary/acknowledge`
- Notebook JSON export is available at `GET /api/v1/exports/notebook` (SQL-backed totals/channels/operations)
- Inline image registration is available at `POST /api/v1/stores/:storeId/attachments/inline`
- Runtime wires duplicate approve/acknowledge behind the Phase 9 flag when entries API is on; no visual/layout changes
- Owner/employee entry creation registers inline attachments through the Phase 9 inline route before `POST /entries`, then stores the returned `storageKey` in DB
- Notebook share/export modal loads single-store totals/channels/operations from `GET /api/v1/exports/notebook` when Phase 9 flag is on (combined/all-stores share keeps in-memory aggregation)
- Client helpers live in `phase9-api-client.js`, `notebook-export-share-data.js`, and `use-notebook-export-share-data.js`

**Review default:** employee closeout review is **off** per store; submits are **auto-approved** on the server when `autoReview=true` (no owner pending queue). See `.cursor/rules/closeout-review-defaults.mdc`.

## Important

This is **not** a launch auth solution. Backend auth files and APIs remain intact.
Restore real auth by setting `NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE=false` and `ALLOW_HEADER_AUTH_CONTEXT=false` before public launch.
