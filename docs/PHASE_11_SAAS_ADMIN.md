# Phase 11 — SaaS admin foundations (inactive by default)

> Platform-level console and analytics plumbing without billing provider activation.

## Flags (all OFF by default)

| Flag | Default | Purpose |
|------|---------|---------|
| `NEXT_PUBLIC_SAAS_ADMIN_ENABLED` | `false` | Shows `/saas-admin` shell |
| `SAAS_ADMIN_API_ENABLED` | `false` | Enables `/api/v1/saas-admin/*` |
| `USAGE_TRACKING_ENABLED` | `false` | Persists `usage_events` writes |
| `SAAS_PLATFORM_ADMIN_USER_IDS` | empty | Comma-separated UUID allowlist |

## What was added (foundations)

- `GET /api/v1/saas-admin/kpis/overview`
- `GET /api/v1/saas-admin/organizations`
- `recordUsageEvent()` no-op unless usage tracking flag is on
- `/saas-admin` page shell (disabled message by default)
- Platform admin gate separate from org `owner` role

## Schema already present

- `subscriptions`, `invoices`, `payment_events`
- `usage_events`, `daily_org_metrics`, `daily_saas_metrics`

## Activation sequence (pre-launch / post-launch)

1. Configure `SAAS_PLATFORM_ADMIN_USER_IDS`
2. Set `SAAS_ADMIN_API_ENABLED=true`
3. Set `NEXT_PUBLIC_SAAS_ADMIN_ENABLED=true`
4. Optionally `USAGE_TRACKING_ENABLED=true`
5. Connect billing provider webhooks (later)

## Not activated yet

- Payment provider integration
- Subscription write APIs
- Investor CSV export route
- Desktop KPI charts UI
