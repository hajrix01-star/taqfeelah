# Platform Admin Email Authentication

> **Status (2026-06-19):** enforced in production code paths for SaaS Admin.

## Policy

Platform admins (`/saas-admin`) must use a **real email address** as their login identifier.

| Rule | Detail |
|------|--------|
| Login | `/saas-admin/login` → `POST /api/v1/auth/session` with `mode: "platform_admin_password"` |
| Identifier | `auth_identities.username` must be a valid email (`user@domain.com`) |
| Password reset | Same email in `resolvePlatformAdminUserIdByEmail` |
| Legacy usernames | Values like `hajri` or `q` are **rejected** for platform admin login |

Store owners (`/app`) are unchanged — they may still use phone/password flows.

## API contract

### Sign in

```http
POST /api/v1/auth/session
Content-Type: application/json

{
  "mode": "platform_admin_password",
  "email": "admin@taqfeelah.com",
  "password": "********"
}
```

Server checks:

1. `email` passes Zod `.email()`
2. Password verifies against `auth_identities` (`username_password`)
3. Stored `username` contains `@` and matches normalized email
4. User has platform admin grant (`platform_admin_grants` or `SAAS_PLATFORM_ADMIN_USER_IDS`)

### Create platform admin

`POST /api/v1/saas-admin/platform-admins`

- `username` field = email (required, Zod `.email()`)

### Update platform admin credentials

`PATCH /api/v1/saas-admin/platform-admins/:userId`

- Requires both `name` and `username` (email)
- Optional `password`
- Rejects non-email `username` values (e.g. `HAJRI`)

### Password reset

`POST /api/v1/auth/platform-admin/password-reset/request`

- Requires configured email delivery (`AUTH_EMAIL_FROM` + Resend/SMTP)
- Looks up user by email + platform admin grant

## Code map

| Area | File |
|------|------|
| Email identifier helper | `src/core/auth/email-login-identifier.ts` |
| Platform admin session | `src/features/auth/server/create-platform-admin-auth-session.ts` |
| Session router | `src/features/auth/server/create-auth-session.ts` (`platform_admin_password`) |
| Admin CRUD validation | `src/features/saas-admin/server/platform-admin-grants-repository.ts` |
| Login UI | `src/features/saas-admin/client/SaasAdminLoginPage.tsx` |
| Admin management UI | `src/features/saas-admin/client/PlatformAdminsPage.tsx` |

## Migrating legacy admins

If an admin still has `username = hajri`:

1. Another platform admin opens **Platform admins** → **Edit login**
2. Sets a real email + optional new password
3. Admin signs in at `/saas-admin/login` with that email

Until migration, legacy accounts receive:

`This platform admin account must be updated to use an email login before sign-in.`

## Deploy must not reset admin email

Every production deploy (wave 6+) runs `scripts/seed-auth-credentials.mjs` to **bootstrap missing** `auth_identities` rows.

| Scenario | Behavior |
|----------|----------|
| Owner identity missing | Created with `AUTH_OWNER_USERNAME` / `AUTH_OWNER_PASSWORD` env, or bootstrap defaults |
| Owner identity exists | **Preserved** — username and password are **not** overwritten |
| Explicit recovery | Set `AUTH_SEED_FORCE_OWNER_CREDENTIALS=true` **and** explicit `AUTH_OWNER_USERNAME` + `AUTH_OWNER_PASSWORD` |

This prevents the env-sourced Owner (`SAAS_PLATFORM_ADMIN_USER_IDS`, UI tag **بيئة (env)**) from reverting to `hajri` after each deploy when you update the email from **Platform admins**.

For deploy auth smoke checks, configure GitHub secrets `AUTH_VERIFY_OWNER_USERNAME` / `AUTH_VERIFY_OWNER_PASSWORD` to match the live owner email and password (not legacy `hajri`).

## Environment (password reset email)

See `scripts/check-password-reset-email.mjs` and `.env.example`:

- `AUTH_PASSWORD_RESET_ENABLED=true`
- `AUTH_EMAIL_FROM=noreply@taqfeelah.com` (must match verified Resend domain)
- `RESEND_API_KEY=re_...`

## القاعدة بالعربية

- **مسؤول المنصة = إيميل إلزامي** للدخول واستعادة كلمة المرور.
- **لا يُقبل** `hajri` أو أي اسم بدون `@` في إعدادات مسؤولي المنصة أو في `/saas-admin/login`.
- **مالك المحل** (`/app`) له مسار مستقل ولم يتغير في هذه الدفعة.
