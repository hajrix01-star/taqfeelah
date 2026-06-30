# Prelaunch Production Gate

> Last updated: 2026-06-30

This document is the release gate for moving Taqfeelah to production. It is a checklist for implementation, testing, acceptance, and go/no-go approval. Production is blocked if any P0 item is incomplete.

## Release Rule

- [ ] No new product features during this phase.
- [ ] Only P0 fixes, launch blockers, test coverage, documentation alignment, and deployment safety work are allowed.
- [ ] Staging runs the exact commit intended for production.
- [ ] Production starts only after every gate section below is complete and evidenced.

## P0 Implementation Checklist

### API Contract Unification

- [ ] `GET /api/v1/stores/:storeId/entries` always returns:

```json
{
  "items": [],
  "nextCursor": null
}
```

- [ ] Remove the default bulk array response for entries.
- [ ] Default `limit` is `50`.
- [ ] Max `limit` is `100`.
- [ ] Decide and document behavior for `limit > 100`: return `400` or clamp to `100`.
- [ ] All entries callers use the unified response shape.
- [ ] Integration tests cover default limit, max limit, cursor pagination, invalid limit, and empty results.

### Backend Source Of Truth

- [ ] Production mode does not calculate final financial numbers from browser-local data.
- [ ] Home summaries use backend/API data only.
- [ ] Register summaries use backend/API data only.
- [ ] Reports use backend/API data only.
- [ ] API failure in production shows an explicit error instead of silent local fallback.
- [ ] `NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE=true` is enforced in production.
- [ ] `ALLOW_HEADER_AUTH_CONTEXT=false` is enforced in production.

### Server Aggregation And Performance

- [ ] Day summary is bounded and backend-authoritative.
- [ ] Month summary is bounded and backend-authoritative.
- [ ] Period summary does not require loading large raw row sets for normal use.
- [ ] Days report is bounded by date range.
- [ ] Channels report aggregates on the server.
- [ ] Outflow report aggregates on the server.
- [ ] Required indexes exist for production queries:
  - `(organization_id, store_id, date, status)`
  - `(organization_id, store_id, date DESC, created_at DESC)`
  - `(organization_id, store_id, type, date, status)`

### Register Export

- [ ] Register export does not depend on `visibleEntries` for production server mode.
- [ ] Operations export loads all matching pages or uses a dedicated server export endpoint.
- [ ] Attachments export loads all matching pages or uses a dedicated server export endpoint.
- [ ] Combined-store report export does not depend on partial screen data.
- [ ] Export has a safety bound for page count or total rows.
- [ ] Export fails explicitly if a page fails to load.
- [ ] Excel export is manually verified for day, month, year, and custom range.
- [ ] PDF/share export is manually verified for day, month, year, and custom range.

### Live Gate

- [ ] `scripts/db-source-unification-check.mjs` does not request `limit=500`.
- [ ] Live gate uses cursor pagination.
- [ ] Live gate validates entries, closeouts, summaries, reports, auth, archived-store guards, and no browser persistence.
- [ ] Live gate fails if production mode falls back to local/browser financial data.
- [ ] Live gate runs against staging before production.
- [ ] Live gate runs against production after deploy.

### Staging And Deployment

- [ ] Staging workflow runs on the same commit intended for production.
- [ ] Staging production-like flags match production except domain and database.
- [ ] Staging deploy completes successfully.
- [ ] Staging live gate completes successfully.
- [ ] Production deploy is blocked until staging success is recorded for the same SHA.

## P1 Implementation Checklist

- [ ] Centralize common API route boilerplate for high-risk routes first:
  - `withApiRoute`
  - `requireDb`
  - `requireAuth`
  - `requireStoreAccess`
  - `parsePagination`
  - standard `ok/fail`
- [ ] Reduce duplication in entries, closeouts, and report routes.
- [ ] Add targeted tests around shared route helpers before expanding usage.
- [ ] Keep large UI file refactors out of the release unless required for a P0 fix.
- [ ] Clean local/dev persistence of sensitive auth config after production launch blockers are closed.

## Documentation Checklist

- [ ] `API_CONTRACT.md` matches the actual entries response shape and limit rules.
- [ ] `PERFORMANCE_RULES.md` matches the implemented default and max pagination limits.
- [ ] `DATA_SOURCE_UNIFICATION.md` matches production fallback behavior.
- [ ] `PRODUCTION_STATUS.md` lists remaining launch blockers accurately.
- [ ] `STAGING_DEPLOY_RUNBOOK.md` documents same-SHA staging validation.
- [ ] `VPS_LAUNCH_RUNBOOK.md` documents the final production gate.
- [ ] Any contradiction between docs and code is treated as a release blocker.

## Test Gate

The release candidate must pass:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm smoke:browser
pnpm build
pnpm check:db-source
```

Database/E2E gate:

- [ ] PostgreSQL integration tests pass.
- [ ] Register closeout flow E2E passes.
- [ ] Browser smoke passes with production flags.
- [ ] Staging live gate passes.
- [ ] Production live gate passes after deploy.

Manual smoke:

- [ ] Owner login.
- [ ] Employee login.
- [ ] Submit closeout.
- [ ] Owner review/edit closeout.
- [ ] Register operations page.
- [ ] Register closeouts page.
- [ ] Register report page.
- [ ] Attachments page.
- [ ] Excel export.
- [ ] PDF/share export.
- [ ] Archived store write guard.
- [ ] Unauthorized store access guard.

## Large Data Gate

Seed and test realistic data volumes before launch:

- [ ] 1 year of entries.
- [ ] 3 years of entries.
- [ ] 5 years of entries.
- [ ] Multiple stores.
- [ ] Multiple sales channels.
- [ ] Multiple closeouts per day.
- [ ] Attachments on outflow rows.
- [ ] Voided, restored, and owner-edited entries.

Measure:

- [ ] Dashboard summary response time.
- [ ] Register first page response time.
- [ ] Register load-more response time.
- [ ] Day report response time.
- [ ] Month report response time.
- [ ] Custom period report response time.
- [ ] Export completion time.

Acceptance target:

- [ ] Core API p95 target is documented and met.
- [ ] Any endpoint exceeding the target has a documented mitigation before production.

## Security Gate

- [ ] No secrets are exposed in client bundles.
- [ ] Session cookies are secure for production.
- [ ] Header auth fallback is disabled in production.
- [ ] Store access is scoped by organization, user, role, and store.
- [ ] Attachments are not embedded in list API responses.
- [ ] Persistent browser financial storage is disabled in production.
- [ ] Production environment variables are reviewed before deploy.

## Go/No-Go Decision

### Go

Production is allowed only when:

- [ ] All P0 implementation items are complete.
- [ ] All required tests pass.
- [ ] Documentation matches code.
- [ ] Staging succeeded on the production candidate SHA.
- [ ] Staging live gate succeeded.
- [ ] Large data gate has acceptable measured results.
- [ ] Manual export smoke passed.
- [ ] Release owner signs off.

### No-Go

Production is blocked if any of these are true:

- [ ] Entries API contract is inconsistent.
- [ ] Financial numbers can silently fall back to browser/local data in production.
- [ ] Register export can produce partial data without explicit failure.
- [ ] Live gate still uses deprecated bulk limits.
- [ ] Staging did not test the same SHA.
- [ ] Docs contradict the implemented API contract.
- [ ] Large-data behavior is unmeasured.

## Evidence Log

Before production, record:

| Item | Evidence |
| --- | --- |
| Release SHA |  |
| CI run URL |  |
| Staging run URL |  |
| Staging live gate result |  |
| Large data test result |  |
| Excel export smoke |  |
| PDF/share export smoke |  |
| Production deploy run URL |  |
| Production live gate result |  |
| Final decision |  |
