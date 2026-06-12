# Phase 10 — Auth foundations

> **الحالة (2026-06-12):** مفعّل على الإنتاج عبر `DEPLOYMENT_WAVE=7` في `deploy-production.yml`.  
> راجع `docs/PRODUCTION_STATUS.md` للتفاصيل والاستثناءات المؤجّلة.

## Flags (all OFF by default)

| Flag | Default | Purpose |
|------|---------|---------|
| `NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE` | `true` until auth launch | Keeps prototype role picker |
| `NEXT_PUBLIC_AUTH_API_ENABLED` | `false` | Optional client wiring for real auth UI |
| `AUTH_DB_CREDENTIALS_ENABLED` | `false` | Login reads `auth_identities` instead of env/runtime JSON |
| `ALLOW_HEADER_AUTH_CONTEXT` | `true` only in prototype/dev | Temporary API header context |

## What was added (foundations)

- `auth_identities` service: hashed owner password + employee PIN storage (`scrypt`)
- `POST /api/v1/members` and `PATCH /api/v1/members/:memberId`
- OTP stubs: `POST /api/v1/auth/otp/request`, `POST /api/v1/auth/otp/verify`
- `createAuthSession` supports DB credentials when `AUTH_DB_CREDENTIALS_ENABLED=true`
- Client session helpers: `runtime-session-and-settings-api-client.js`
- Member credentials via org-config: `org-config-api-client.js`
- Seed scripts: `pnpm db:seed:auth`, `pnpm db:migrate:auth`
- Deploy scaffold: `DEPLOYMENT_WAVE=6` in `scripts/vps_deploy.py` (inactive until product flips wave)

## Activation sequence (after source unification only)

1. Run `pnpm db:seed:auth` (or `pnpm db:migrate:auth` on existing VPS runtime settings)
2. Set `AUTH_DB_CREDENTIALS_ENABLED=true`
3. Set `NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE=false`
4. Set `ALLOW_HEADER_AUTH_CONTEXT=false`
5. Set `NEXT_PUBLIC_AUTH_API_ENABLED=true`
6. Set `NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE=true`
7. Keep all DB data-source flags enabled (`entries`, `closeouts`, `org-config`, `phase9`, pagination)
8. Deploy — wave 6 verify runs POST owner login, bad-password 401, employee PIN 200

## Not activated / deferred

- OTP SMS/email provider (`AUTH_OTP_ENABLED` off)
- Password reset emails (needs `RESEND_API_KEY` or SMTP — code ready)
- Automated invite/setup emails (manual WhatsApp/copy link from SaaS admin)
- `/app` still uses approved prototype runtime shell (visual baseline frozen)
