# Feature Flags Matrix

> مرجع تفعيل المراحل على VPS والتطوير المحلي. أي PR يغيّر سلوك علم يحدّث هذا الملف.

## Core runtime

| Variable | Default (unset) | Production required | Purpose |
|----------|-----------------|---------------------|---------|
| `APP_MODE` | `prototype` | `production` | Server runtime mode |
| `NEXT_PUBLIC_APP_MODE` | `prototype` | `production` | Client-visible app mode |
| `NODE_ENV` | `development` | `production` | Node runtime |
| `DATABASE_URL` | — | required | PostgreSQL connection |
| `AUTH_SESSION_SECRET` | — | min 16 chars | Signed session cookies |

## Development bypass (must be OFF before launch)

| Variable | Default (unset) | Production required | Purpose |
|----------|-----------------|---------------------|---------|
| `NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE` | `true` (ON until auth launch) | `true` for source-unification, `false` only for auth launch | Skip real auth; role picker |
| `ALLOW_HEADER_AUTH_CONTEXT` | `true` until auth launch | `true` for source-unification, `false` only for auth launch | Header-based API auth for prototype/source-unification |

`assertProductionRuntimeEnv()` source-unification rules:

- All DB data-source flags must be explicitly `true`.
- `NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE=true` is required.
- Auth remains deferred: keep `NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE=true` and `ALLOW_HEADER_AUTH_CONTEXT=true` until the explicit auth launch.
- When auth launch is requested, `NEXT_PUBLIC_AUTH_API_ENABLED=true`, `AUTH_DB_CREDENTIALS_ENABLED=true`, `NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE=false`, `ALLOW_HEADER_AUTH_CONTEXT=false`, and `AUTH_SESSION_SECRET` are required together.

## Data source flags (cascade)

| Variable | Default when unset | Inherits from | Enables |
|----------|-------------------|---------------|---------|
| `NEXT_PUBLIC_CLOSEOUTS_API_ENABLED` | `false` | — | Closeouts read/write from PostgreSQL |
| `NEXT_PUBLIC_ENTRIES_API_ENABLED` | closeouts flag | `CLOSEOUTS_API` | Operational entries from PostgreSQL |
| `NEXT_PUBLIC_ORG_CONFIG_API_ENABLED` | entries flag | `ENTRIES_API` | Stores/channels/team from org-config APIs |
| `NEXT_PUBLIC_PHASE9_API_ENABLED` | entries flag | `ENTRIES_API` | Notebook export, inline attachments, duplicate-summary |
| `NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED` | entries flag | `ENTRIES_API` | Cursor pagination in register |

## Auth and SaaS (built, not launch-default)

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_AUTH_API_ENABLED` | `false` | Wire real auth UI flows |
| `AUTH_DB_CREDENTIALS_ENABLED` | `false` | Validate credentials in `auth_identities` |
| `NEXT_PUBLIC_SAAS_ADMIN_ENABLED` | `false` | Shows `/saas-admin` shell |
| `SAAS_ADMIN_API_ENABLED` | `false` | Platform admin APIs |
| `USAGE_TRACKING_ENABLED` | `false` | Usage event recording |
| `SAAS_PLATFORM_ADMIN_USER_IDS` | empty | Comma-separated platform admin UUIDs |

## Temporary ID maps (prototype period only)

Required by `assertProductionRuntimeEnv()` today; target is removal after session/org-config supplies UUIDs.

| Variable | Purpose |
|----------|---------|
| `AUTH_ORGANIZATION_ID` / `NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID` | Org UUID |
| `AUTH_OWNER_USER_ID` / `NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID` | Owner UUID |
| `NEXT_PUBLIC_CLOSEOUTS_STORE_ID_MAP` | Prototype store id → UUID |
| `NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP` | Prototype user id → UUID |
| `NEXT_PUBLIC_CLOSEOUTS_SALES_CHANNEL_ID_MAP` | Prototype channel id → UUID |

## Recommended VPS rollout order

> **Product-facing waves (Arabic):** see `docs/DEPLOYMENT_WAVES.md` — موجات 1–7 تجمع المراحل التقنية 1–11.

1. `DATABASE_URL` + seed
2. **Wave 1 (core):** `NEXT_PUBLIC_CLOSEOUTS_API_ENABLED=true` + `NEXT_PUBLIC_ENTRIES_API_ENABLED=true`
3. **Wave 2 (analytics):** home/reports SQL paths (phases 4–6; inherits entries API)
4. **Wave 4 (org config):** `NEXT_PUBLIC_ORG_CONFIG_API_ENABLED=true`
5. **Wave 5 (enhancements):** `NEXT_PUBLIC_PHASE9_API_ENABLED=true`
6. **Wave 3 (scale):** `NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED=true` (under load)
7. **Wave 6 (auth launch, after source unification):** run `pnpm db:seed:auth` then set `NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE=false`, `AUTH_DB_CREDENTIALS_ENABLED=true`, `NEXT_PUBLIC_AUTH_API_ENABLED=true`, `ALLOW_HEADER_AUTH_CONTEXT=false`, and keep all DB data-source flags `true`.
8. **Wave 7 (SaaS):** run `pnpm db:seed:saas`, set `SAAS_PLATFORM_ADMIN_USER_IDS`, then `SAAS_ADMIN_API_ENABLED=true`, `NEXT_PUBLIC_SAAS_ADMIN_ENABLED=true`, optional `USAGE_TRACKING_ENABLED=true`, `DEPLOYMENT_WAVE=7`

## Code modules

| Module | Reader |
|--------|--------|
| `core/config/closeouts-api-mode.ts` | `isCloseoutsApiEnabled` |
| `core/config/entries-api-mode.ts` | `isEntriesApiEnabled` |
| `core/config/org-config-api-mode.ts` | `isOrgConfigApiEnabled` |
| `core/config/phase9-api-mode.ts` | `isPhase9ApiEnabled` |
| `core/config/register-entries-pagination-mode.ts` | `isRegisterEntriesPaginationEnabled` |
| `core/config/auth-api-mode.ts` | `isAuthApiEnabled` |
| `core/config/saas-admin-api-mode.ts` | `isSaasAdminApiEnabled` |
| `core/config/prototype-access-mode.ts` | `isPrototypeAccessMode` |
