# Prototype Access Mode — **REMOVED (prelaunch)**

> **Status:** Removed before public launch (2026).
> **Replacement:** Real auth on `/app` — see `docs/PRELAUNCH_CLEANUP.md` and `docs/PHASE_10_AUTH.md`.

---

## Historical note

Prototype Access Mode was a temporary development bypass:

- Role picker: «Enter as owner» / «Enter as employee»
- No session cookies or `/api/v1/auth/session`
- Often paired with `ALLOW_HEADER_AUTH_CONTEXT=true` and env ID maps

This path and its runtime flag implementation are **no longer present in the codebase**.

---

## Current entry path

| Surface | Behavior |
|---------|----------|
| `/app` | Owner login (phone/password) or employee PIN portal |
| `/saas-admin` | Platform admin login |
| Accounts | Created via SaaS Admin — not demo seed |

---

## Local dev (optional)

If you need a single org for manual testing:

```bash
pnpm db:seed:closeouts   # optional local bootstrap
pnpm db:seed:auth
```

Production launch should use **empty DB + SaaS Admin provisioning** instead.

---

## DB-first phases (archived)

Phases 0–11 documented the gradual migration from `localStorage` to PostgreSQL.
All data-source flags are `true` in production deploy (wave 7).
See `docs/DEPLOYMENT_WAVES.md` for the rollout history.
