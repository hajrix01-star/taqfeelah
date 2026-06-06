# Phase 10 — Auth foundations (inactive by default)

> Build real user/credential infrastructure now; activate only shortly before launch.

## Flags (all OFF by default)

| Flag | Default | Purpose |
|------|---------|---------|
| `NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE` | `true` (ON) | Keeps prototype role picker |
| `NEXT_PUBLIC_AUTH_API_ENABLED` | `false` | Optional client wiring for real auth UI |
| `AUTH_DB_CREDENTIALS_ENABLED` | `false` | Login reads `auth_identities` instead of env/runtime JSON |
| `ALLOW_HEADER_AUTH_CONTEXT` | `true` in prototype VPS | Temporary API header context |

## What was added (foundations)

- `auth_identities` service: hashed owner password + employee PIN storage (`scrypt`)
- `POST /api/v1/members` and `PATCH /api/v1/members/:memberId`
- OTP stubs: `POST /api/v1/auth/otp/request`, `POST /api/v1/auth/otp/verify`
- `createAuthSession` supports DB credentials when `AUTH_DB_CREDENTIALS_ENABLED=true`
- Client helpers: `members-api-client.js`, `auth-api-client.js`

## Activation sequence (pre-launch only)

1. Seed/migrate members and credentials via members API
2. Set `AUTH_DB_CREDENTIALS_ENABLED=true`
3. Set `NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE=false`
4. Set `ALLOW_HEADER_AUTH_CONTEXT=false`
5. Verify owner password + employee PIN via `/api/v1/auth/session`

## Not activated yet

- Forced login on every environment
- OTP SMS/email provider
- Password reset/invite emails
- `/app` route split (still `/` + prototype runtime)
