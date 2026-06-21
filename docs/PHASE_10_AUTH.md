# Phase 10 — Auth foundations

> **الحالة (2026-06-12):** مفعّل — مسار الدخول الوحيد على `/app` هو auth حقيقي.  
> **ما قبل الإطلاق:** `docs/PRELAUNCH_CLEANUP.md` — لا وضع تجريبي.

## Flags (production)

| Flag | Production | Purpose |
|------|------------|---------|
| `NEXT_PUBLIC_AUTH_API_ENABLED` | `true` | Real auth UI + `/api/v1/auth/session` |
| `AUTH_DB_CREDENTIALS_ENABLED` | `true` | Login reads `auth_identities` |
| `ALLOW_HEADER_AUTH_CONTEXT` | `false` | Session cookies only |

> **Removed:** `NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE` — prototype role picker and its runtime flag code were deleted before launch.

## What was added (foundations)

- `auth_identities` service: hashed owner password + employee PIN storage (`scrypt`)
- `POST /api/v1/members` and `PATCH /api/v1/members/:memberId`
- OTP stubs: `POST /api/v1/auth/otp/request`, `POST /api/v1/auth/otp/verify`
- `createAuthSession` supports DB credentials when `AUTH_DB_CREDENTIALS_ENABLED=true`
- Client session helpers: `runtime-session-and-settings-api-client.js`
- Member credentials via org-config: `org-config-api-client.js`
- Seed scripts: `pnpm db:seed:auth`, `pnpm db:migrate:auth` (local dev optional)

## Production entry path

1. Account created in SaaS Admin (not demo seed)
2. Owner completes setup / sets password
3. `/app` → owner phone/password or employee PIN portal
4. Session cookie (`taqfeelah_session`) — no header auth bypass

## Not activated / deferred

- OTP SMS/email provider (`AUTH_OTP_ENABLED` off)
- Password reset emails (needs `RESEND_API_KEY` or SMTP — code ready)
- Automated invite/setup emails (manual WhatsApp/copy link from SaaS admin)
- `/app` still uses approved prototype runtime shell (visual baseline frozen)
