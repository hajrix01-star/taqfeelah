# Phase 11 — SaaS admin console (inactive by default)

> Read-only platform console at `/saas-admin` with unified `platform-metrics` source. No billing provider activation yet.

## Flags (all OFF by default)

| Flag | Default | Purpose |
|------|---------|---------|
| `NEXT_PUBLIC_SAAS_ADMIN_ENABLED` | `false` | Shows `/saas-admin` UI (disabled shell when off) |
| `SAAS_ADMIN_API_ENABLED` | `false` | Enables `/api/v1/saas-admin/*` |
| `USAGE_TRACKING_ENABLED` | `false` | Persists `usage_events` writes |
| `SAAS_PLATFORM_ADMIN_USER_IDS` | empty | Comma-separated UUID allowlist |

## UI routes (desktop-first, read-only)

- `/saas-admin` → redirects to `/saas-admin/overview`
- `/saas-admin/overview`
- `/saas-admin/accounts`
- `/saas-admin/accounts/[id]`
- `/saas-admin/usage`
- `/saas-admin/investor-metrics`
- `/saas-admin/system-health`

Layout guards: disabled → unauthenticated → unauthorized → `AdminShell`.  
`middleware.ts` enforces API auth early; page UX guards stay in `layout.tsx`.

## API routes (read-only unless noted)

- `GET /api/v1/saas-admin/overview`
- `GET /api/v1/saas-admin/accounts`
- `GET /api/v1/saas-admin/accounts/:id`
- `GET /api/v1/saas-admin/usage`
- `GET /api/v1/saas-admin/investor-metrics`
- `GET /api/v1/saas-admin/system-health`
- `POST /api/v1/saas-admin/analytics/aggregate` (snapshot rebuild)

See `docs/API_CONTRACT.md` for query params and response shapes.

## Schema already present

- `subscriptions`, `invoices`, `payment_events`
- `usage_events`, `daily_org_metrics`, `daily_saas_metrics`

## Activation sequence (production)

1. On VPS: `cd /opt/taqfeelah && set -a && . ./.env.production && set +a`
2. Optional seed: `pnpm db:seed:saas`
3. Set `SAAS_PLATFORM_ADMIN_USER_IDS=<owner-uuid>` (comma-separated if multiple)
4. Set `SAAS_ADMIN_API_ENABLED=true`
5. Set `NEXT_PUBLIC_SAAS_ADMIN_ENABLED=true`
6. Redeploy or restart PM2 so Next.js picks up env changes
7. Sign in as the allowlisted user, then open `https://taqfeelah.com/saas-admin`
8. Optional: `USAGE_TRACKING_ENABLED=true` and run `pnpm saas:aggregate` (cron daily)

While flags stay `false`, deploy verify expects `GET /api/v1/saas-admin/overview` → `503` and `GET /saas-admin` → `200` (disabled shell).

## Not activated yet

- Payment provider integration
- Subscription write APIs
- Investor CSV export route
- Account disable/delete actions from admin UI
