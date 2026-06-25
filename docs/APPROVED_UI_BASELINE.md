# APPROVED UI BASELINE

> **Tag:** `APPROVED UI BASELINE`
> **Checkpoint commit:** `checkpoint/approved-ui-baseline-before-backend` (see git log)
> **Owner sign-off:** 2026-06 — visual acceptance on mobile and tablet

## What is frozen

After the checkpoint commit, **do not change** without explicit owner approval:

- Visual design, layout, spacing, typography colors (except logo swap only if owner requests).
- `src/components/TaqfeelahAppRuntimeShell.tsx` and `src/components/taqfeelah-app/*` screen flows.
- Prototype-visible CSS (`AppFontStyles`, Tailwind classes on prototype screens).
- Mobile/tablet breakpoints and centered column layout (~530–560px on tablet).

## What the approved baseline includes

- The approved operational composition now serves `/app`; `/prototype-runtime` remains a comparison route.
- No fake phone frame; full viewport shell.
- Owner: home (notebook), reports (notebook), register, settings, add flows.
- Employee flows accepted visually.
- Notebook ruled lines scroll with content; no vertical red margin line (removed 2026-06 per owner).
- The visual checkpoint originally used demo auth; production `/app` now uses signed sessions and real credentials.

## Allowed without re-approval

- Backend, database, API, domain code under `src/features`, `src/domain`, `src/core`.
- New documentation.
- Production routes (`/app`) that **match** this baseline visually.

## Reference files

| File | Role |
|------|------|
| `src/components/TaqfeelahAppRuntimeShell.tsx` | Approved UX/behavior composition |
| `src/components/taqfeelah-app/*` | Extracted approved screens and UI pieces |
| `src/prototype-build-stamp.mjs` | Load verification on devices |
| `docs/CONVENTIONS.md` | Product and engineering rules |
