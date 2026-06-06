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

## Important

This is **not** a launch auth solution. Backend auth files and APIs remain intact.
Restore real auth by setting `NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE=false` before public launch.
