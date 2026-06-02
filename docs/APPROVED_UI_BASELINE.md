# APPROVED UI BASELINE

> **Tag:** `APPROVED UI BASELINE`  
> **Checkpoint commit:** `checkpoint/approved-ui-baseline-before-backend` (see git log)  
> **Owner sign-off:** 2026-06 — visual acceptance on mobile and tablet

## What is frozen

After the checkpoint commit, **do not change** without explicit owner approval:

- Visual design, layout, spacing, typography colors (except logo swap only if owner requests).
- `src/components/TaqfeelahPrototypeRuntime.jsx` structure and screen flows.
- Prototype-visible CSS (`AppFontStyles`, Tailwind classes on prototype screens).
- Mobile/tablet breakpoints and centered column layout (~530–560px on tablet).

## What the approved baseline includes

- App entry at `/prototype-runtime` (no marketing landing in this checkpoint).
- No fake phone frame; full viewport shell.
- Owner: home (notebook), reports (notebook), register, settings, add flows.
- Employee flows accepted visually.
- Notebook lines scroll with content; red margin full scroll height.
- Prototype demo auth only — not production security.

## Allowed without re-approval

- Backend, database, API, domain code under `src/features`, `src/domain`, `src/core`.
- New documentation.
- Production routes (`/app`) that **match** this baseline visually.

## Reference files

| File | Role |
|------|------|
| `src/components/TaqfeelahPrototypeRuntime.jsx` | Approved UX/behavior reference |
| `src/prototype-build-stamp.mjs` | Load verification on devices |
| `docs/CONVENTIONS.md` | Product and engineering rules |
