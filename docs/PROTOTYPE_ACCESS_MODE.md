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

Set this alongside the seeded org/store/user ID maps (`NEXT_PUBLIC_CLOSEOUTS_*`) and run `node scripts/seed-closeouts-foundation.mjs` once. VPS deploy bootstrap includes `ALLOW_HEADER_AUTH_CONTEXT=true` during the prototype period.

### Phase 1 — operational entries from DB

When `NEXT_PUBLIC_ENTRIES_API_ENABLED=true` (or inherited from closeouts API flag):

- Operational register loads from `/api/v1/stores/:storeId/entries` on login
- Owner/employee saves, review, void, and restore go through the entries API
- `localStorage` is not used as the entries source (DB wins)
- Closeout submit/review refreshes entries from the server instead of building local rows

Local demo seed data is still used when the entries API flag is off.

## Important

This is **not** a launch auth solution. Backend auth files and APIs remain intact.
Restore real auth by setting `NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE=false` and `ALLOW_HEADER_AUTH_CONTEXT=false` before public launch.
