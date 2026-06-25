# Feature Flags Matrix

> مرجع تفعيل المراحل على VPS والتطوير المحلي. أي PR يغيّر سلوك علم يحدّث هذا الملف.
> **ما قبل الإطلاق:** راجع `docs/PRELAUNCH_CLEANUP.md`.

## Core runtime

| Variable | Default (unset) | Production required | Purpose |
|----------|-----------------|---------------------|---------|
| `APP_MODE` | `prototype` | `production` | Server runtime mode |
| `NEXT_PUBLIC_APP_MODE` | `prototype` | `production` | Client-visible app mode |
| `NODE_ENV` | `development` | `production` | Node runtime |
| `DATABASE_URL` | — | required | PostgreSQL connection |
| `AUTH_SESSION_SECRET` | — | min 16 chars | Signed session cookies |

## Auth (required for production / prelaunch)

| Variable | Default (unset) | Production (CI deploy) | Purpose |
|----------|-----------------|------------------------|---------|
| `ALLOW_HEADER_AUTH_CONTEXT` | `false` | `false` | Session cookies only — no header bypass |
| `NEXT_PUBLIC_AUTH_API_ENABLED` | `false` | `true` | Auth API wired |
| `AUTH_DB_CREDENTIALS_ENABLED` | `false` | `true` | `auth_identities` table |

> **Removed:** `NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE` — prototype role picker and its runtime flag code were deleted before launch.

`assertProductionRuntimeEnv()` rules:

- All DB data-source flags must be explicitly `true`.
- `NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE=true` is required.
- When auth is enabled: `NEXT_PUBLIC_AUTH_API_ENABLED=true`, `AUTH_DB_CREDENTIALS_ENABLED=true`, `ALLOW_HEADER_AUTH_CONTEXT=false`, and `AUTH_SESSION_SECRET` are required together.

## Data source flags (cascade)

| Variable | Default when unset | Inherits from | Enables |
|----------|-------------------|---------------|---------|
| `NEXT_PUBLIC_CLOSEOUTS_API_ENABLED` | `false` | — | Closeouts read/write from PostgreSQL |
| `NEXT_PUBLIC_ENTRIES_API_ENABLED` | closeouts flag | `CLOSEOUTS_API` | Operational entries from PostgreSQL |
| `NEXT_PUBLIC_ORG_CONFIG_API_ENABLED` | entries flag | `ENTRIES_API` | Stores/channels/team from org-config APIs |
| `NEXT_PUBLIC_PHASE9_API_ENABLED` | entries flag | `ENTRIES_API` | Notebook export, inline attachments, duplicate-summary |
| `NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED` | entries flag | `ENTRIES_API` | Cursor pagination in register |

## Auth and SaaS

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_AUTH_API_ENABLED` | `false` | Wire real auth UI flows |
| `AUTH_DB_CREDENTIALS_ENABLED` | `false` | Validate credentials in `auth_identities` |
| `NEXT_PUBLIC_SAAS_ADMIN_ENABLED` | `false` | Shows `/saas-admin` shell |
| `SAAS_ADMIN_API_ENABLED` | `false` | Platform admin APIs |
| `USAGE_TRACKING_ENABLED` | `false` | Usage event recording |
| `SAAS_PLATFORM_ADMIN_USER_IDS` | empty | Comma-separated platform admin UUIDs |

## Legacy ID maps (optional)

Required by `assertProductionRuntimeEnv()` **only when** `ALLOW_HEADER_AUTH_CONTEXT=true` (integration tests / legacy).
Production launch uses session + org-config API — **no maps required**.

| Variable | Purpose |
|----------|---------|
| `AUTH_ORGANIZATION_ID` / `NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID` | Org UUID (optional bootstrap) |
| `AUTH_OWNER_USER_ID` / `NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID` | Owner UUID (optional bootstrap) |
| `NEXT_PUBLIC_CLOSEOUTS_*_ID_MAP` | Local dev only — see `scripts/seed-closeouts-foundation.mjs` |

## Recommended launch path (post-cleanup)

1. `DATABASE_URL` + `pnpm db:migrate` (no demo seed on production)
2. Set all wave-7 flags (`deploy-production.yml` is source of truth)
3. Create first customer via **SaaS Admin**
4. Owner completes setup link → logs in at `/app`

Historical rollout waves: `docs/DEPLOYMENT_WAVES.md`.

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
| `core/config/prototype-access-mode.ts` | Always `false` (removed feature) |
