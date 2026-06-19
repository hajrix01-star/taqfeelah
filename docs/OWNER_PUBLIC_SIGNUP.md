# Owner Public Signup

> **Status (2026-06-19):** production-ready behind feature flags.

## Flow

1. Owner opens `/signup` and submits organization + name + phone + email.
2. API stores a pending `signup_requests` row and sends a verification email.
3. Owner clicks `/auth/verify-email?token=...`.
4. Server provisions organization + store + trial subscription (same core as SaaS Admin).
5. Owner receives setup email and is redirected to `/auth/setup` to choose a password.
6. Owner signs in at `/app` with **phone + password**. Email is stored for password reset.

Admin provisioning via `/saas-admin/accounts/new` remains unchanged.

## Flags

| Flag | Layer | Purpose |
|------|-------|---------|
| `AUTH_PUBLIC_SIGNUP_ENABLED=true` | Server | Enables signup APIs |
| `NEXT_PUBLIC_PUBLIC_SIGNUP_ENABLED=true` | Client | Shows `/signup` CTAs on marketing + signup page |
| `AUTH_EMAIL_FROM` + `RESEND_API_KEY` | Server | Required for verification email |
| `AUTH_SIGNUP_SYSTEM_ACTOR_USER_ID` | Server | Optional audit actor UUID (defaults to platform admin env UUID) |

## API

| Method | Route | Auth |
|--------|-------|------|
| `GET` | `/api/v1/auth/signup/status` | Public |
| `POST` | `/api/v1/auth/signup/request` | Public, rate-limited |
| `POST` | `/api/v1/auth/signup/verify` | Public (token) |

## Security

- Generic success message (no email/phone enumeration).
- SHA-256 hashed tokens, 24h TTL.
- Rate limiting on signup request (same limiter as password reset).
- Deploy seed script preserves existing owner credentials (see PR #328).

## Database

- `signup_requests` — pending signup payload until email verified.
- `account_setup_tokens.owner_email` — stores verified owner email for setup + password reset.

## Activation (production)

1. Set flags in GitHub Secrets / VPS `.env.production`:
   - `AUTH_PUBLIC_SIGNUP_ENABLED=true`
   - `NEXT_PUBLIC_PUBLIC_SIGNUP_ENABLED=true`
2. Ensure Resend + `AUTH_EMAIL_FROM` are configured (same as password reset).
3. Deploy to apply migration `0019_public_signup_requests.sql`.
4. Smoke: open `/signup`, submit, verify email, complete `/auth/setup`, login at `/app`.

## القاعدة بالعربية

- **التسجيل الذاتي** مسار جديد — **لا يلغي** إنشاء الحساب من SaaS Admin.
- **الإيميل** للتأكيد واسترجاع كلمة المرور؛ **الجوال** للدخول اليومي.
- **الباقة الافتراضية:** `trial` مجاني.
