# Prototype Access Mode

Temporary development mode that bypasses real authentication in non-production builds.

## Purpose

Speed up UI and domain work without username/password, OTP, session cookies, or auth API calls.

## Behavior

- Shows a simple entry screen: **Enter as owner** / **Enter as employee**
- Sets in-app role to `owner` or `employee` and opens the matching shell
- Does not call `/api/v1/auth/session`
- Does not persist auth session in localStorage

## Enablement

Enabled when:

- `NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE=true` (explicit opt-in), or
- `NEXT_PUBLIC_APP_MODE` is not `production` (default in `pnpm dev` via `.env.development`)
- and `NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE` is not `false`

Disabled on `taqfeelah.com` unless explicitly opted in.

## Mobile (LAN) development

| Command | Phone URL | Prototype Access |
|---------|-----------|------------------|
| `pnpm dev` or `pnpm mobile:sync` | `http://<LAN-IP>:3000` | Yes |
| `pnpm preview:lan` | `http://<LAN-IP>:3000` | Yes (prototype env baked into build) |

After `pnpm dev`, copy the LAN URL printed in the terminal (not `taqfeelah.com`).

## Important

This is **not** a launch auth solution. Backend auth files and APIs remain intact for later production use. Replace this mode with real auth + authorization before public launch.
