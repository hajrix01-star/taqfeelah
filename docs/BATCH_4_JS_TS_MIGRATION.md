# Batch 4 — CSP nonce + JS→TS migration (wave 1)

> **Branch:** `cursor/batch-4-csp-ts-migration-3ebd`  
> **Status:** PR for CI — **not** merged to `main` unless owner says «جاهز للايف».

---

## Scope

| Item | Status |
|------|--------|
| CSP nonce (`strict-dynamic`, dev-only `unsafe-eval`) | ✅ |
| Security headers via middleware | ✅ |
| JS→TS wave 1: `src/features/closeouts/**` | ✅ (15 files) |
| Remaining legacy JS (~258 files) | ⏸ future waves |

---

## CSP changes

- **Before:** static CSP in `next.config.mjs` with `'unsafe-inline'` and `'unsafe-eval'`.
- **After:** per-request nonce in `src/middleware.ts` via `src/core/security/apply-security-headers.ts`.
- **Production:** `script-src 'self' 'nonce-…' 'strict-dynamic'` — no `unsafe-inline` / `unsafe-eval`.
- **Development:** `unsafe-eval` retained for Next.js HMR.
- **Styles:** `'unsafe-inline'` kept (Tailwind / inline styles baseline).

---

## JS→TS wave 1 — closeouts

All legacy `.js`/`.jsx` under `src/features/closeouts/` migrated to `.ts`/`.tsx`:

| File | Notes |
|------|-------|
| `closeout-submit-date.ts` | shared date policy |
| `client/closeouts-api-client.ts` | API client + submit diagnosis |
| `client/resolve-closeout-sales-channels.ts` | channel mapping |
| `client/closeout-attachments-api-client.ts` | attachment fetch |
| `client/closeout-attachment-utils.ts` | attachment helpers |
| `client/closeout-day-label.ts` | day label formatting |
| `client/closeout-owner-edit-display.ts` | owner edit metadata |
| `client/closeout-sync-errors.ts` | sync error copy |
| `client/owner-closeouts-fetch-window.ts` | 90-day fetch window |
| `client/use-closeout-attachment-srcs.ts` | attachment hook |
| `client/use-prototype-runtime-closeouts-api.ts` | runtime API hook |
| `client/CloseoutOwnerEditBadge.tsx` | badge component |
| `client/CloseoutAttachmentThumbs.tsx` | thumbs component |
| `client/*.test.ts` | test imports updated |

**Server-side closeouts** were already TypeScript — no changes in this wave.

---

## Future waves (not in this PR)

Suggested order for remaining ~258 `.js`/`.jsx` files:

1. `src/features/org-config/client/**`
2. `src/features/auth/client/**`
3. `src/features/operations/client/**`
4. `src/components/prototype-runtime/**`
5. Remaining feature folders

Track progress: `find src -name '*.js' -o -name '*.jsx' | wc -l`

---

## Verification

```bash
corepack pnpm check:refactor
```

Includes: lint, typecheck, test, smoke:browser.

---

## References

- `docs/LIVE_DEPLOY_BATCH_PLAN.md` — batch 4 status
- `src/core/security/content-security-policy.ts`
- `.cursor/rules/merge-deploy-batch-policy.mdc`
