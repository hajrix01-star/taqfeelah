# Production Source-of-Truth Cutover Plan

Status: in progress
Scope: production hardening after the P0 staging baseline
Baseline commit for current limited-launch path: `0e1eca7`

## Executive rule

Production must have one operational source of truth:

```text
Production = Database/API only
Frontend = input/display only
IDs = canonical links
Names = display labels only
No operational/financial fallback
```

This plan exists because the application still contains historical prototype/runtime paths. Those paths were useful during early development, but they now create risk for sales channels, employees, permissions, and future financial accuracy.

## Non-negotiable production invariants

1. Financial and operational writes must go through server APIs.
2. Financial and operational reads must come from server APIs.
3. The server is the authority for:
   - stores
   - sales channels / income sources
   - employees / organization members
   - employee store access
   - closeouts
   - entries
   - reports
   - exports/prints when they contain financial numbers
4. The frontend must not calculate or persist production financial truth.
5. Browser storage must not hold production operational truth.
6. Every durable production entity must have a canonical UUID.
7. Business logic must use IDs. Names are labels only.

## Canonical database ownership

| Domain | Canonical tables | Notes |
|---|---|---|
| Stores | `stores` | `stores.id` is the only production store key. |
| Sales channels / income sources | `sales_channels` | `sales_channels.id` is the only production channel key. |
| Employees | `users`, `organization_members` | `organization_members.id` is membership key; `users.id` is login/person key. |
| Employee store permissions | `member_store_access` | Server-side authorization must read this table. |
| Closeouts | `daily_closeouts` | `client_closeout_id` is idempotency key, not display key. |
| Entries | `entries` | No standalone financial entry in DB-source production mode. |
| Entry channel split | `entry_sales_channels` | Must reference `sales_channels.id`; no name-only financial link. |
| Attachments | `attachments` | Attachment counts/links must not duplicate money. |

## Current risk summary

The codebase currently has overlapping concepts:

- Runtime settings snapshot:
  - `storeChannelSettings`
  - `staff`
  - `authConfig`
- Canonical DB/API:
  - `sales_channels`
  - `organization_members`
  - `member_store_access`
- Historical prototype/demo helpers:
  - `taqfeelah-app-reference-data` for shared UI copy/catalog labels
  - browser storage helpers
  - runtime maps from legacy ids to UUIDs

This overlap causes these risks:

1. Same sales channel can exist in catalog/runtime/DB.
2. UI can show a channel as removable in one path and toggle-only in another.
3. A removed employee can be hidden in runtime state while still active in DB.
4. Financial writes can accept a channel name fallback if ID is missing.
5. Future developers may not know which source is authoritative.

## Target behavior

### Sales channels

- Production UI lists channels from `/api/v1/stores/:storeId/sales-channels`.
- Add channel uses API only.
- Retire/restore channel uses API only.
- The DB enforces no duplicate normalized channel name per organization/store.
- Closeout/entry writes must send `salesChannelId`.
- Production write path must reject channel rows without a valid `salesChannelId`.
- `channelName` remains a label snapshot only.

### Employees

- Production UI lists employees from `/api/v1/members`.
- Add employee uses API only.
- Edit employee uses API only.
- Disable employee uses API only:
  - `organization_members.status = inactive`
- `removed: true` must not be a production source of truth.
- Store access changes write to `member_store_access`.
- Login/permission checks must use server-side membership/access state.

### Prototype/demo

- Prototype/demo data must be isolated from `/app` production behavior.
- Prototype helpers can remain only when guarded outside production.
- Fallback code should be removed gradually after DB/API replacements are verified.

## Phased execution plan

### Phase 0 — Safety inventory and gates

Goal: prevent accidental production fallback while refactoring.

Tasks:

1. Inventory all production-reachable fallback paths:
   - localStorage/sessionStorage/IndexedDB
   - demo data
   - runtime settings source for stores/channels/staff
   - name-based channel write fallback
2. Add/extend a static check script that fails production prelaunch if production code path contains:
   - financial local fallback
   - operational local fallback
   - browser persistence for operational data
   - channel write by name fallback
3. Keep prototype-only storage allowed only when:
   - `APP_MODE !== production`
   - path is not `/app`
   - data is not financial/operational truth

Acceptance:

- `prelaunch-live-gate` fails if a production fallback path is enabled.
- Existing P0 financial smoke still passes.

### Phase 1 — Sales channels DB/API-only cutover

Goal: make `sales_channels` the only production sales-channel source.

Progress:

- Production financial writes now reject channel-name fallback when
  `salesChannelId` is missing or invalid. The temporary name fallback remains
  only outside production until the prototype/runtime cutover is complete.
- The built-in income-source catalog now has one root data file:
  `src/core/client/income-source-catalog-data.json`. App mapping plus local
  seed/reset/repair scripts read from that file instead of redefining the same
  channel list in multiple places.

Files to inspect/change:

- `src/features/org-config/server/list-store-sales-channels.ts`
- `src/features/org-config/server/create-store-sales-channel.ts`
- `src/features/org-config/server/update-store-sales-channel.ts`
- `src/features/org-config/server/resolve-store-sales-channels-for-write.ts`
- `src/features/runtime-settings/server/provision-sales-channels.ts`
- `src/features/org-config/client/owner-settings-channel-actions.ts`
- `src/components/taqfeelah-app/owner-settings-income-sources-editor.tsx`
- `src/components/taqfeelah-app/owner-settings-screen-action-handlers.ts`
- `src/features/org-config/client/org-config-runtime-sync.ts`
- `src/features/org-config/client/org-config-runtime-mapper.ts`

Tasks:

1. Ensure every channel returned to the UI has:
   - `id` = canonical DB UUID
   - `legacyId` only when useful for catalog display
   - `name`
   - `kind`
   - `status`
2. Change UI operations so production add/retire/restore uses API endpoints directly.
3. Remove production reliance on `storeChannelSettings` as source of truth.
4. Keep catalog as suggestions/seed only, not as authoritative state.
5. Add DB uniqueness migration for normalized channel name per organization/store.
6. Register the migration in Drizzle journal before deploy.
7. Reject production financial writes when `salesChannelId` is not a valid configured active channel ID.
8. Remove or production-disable name fallback in `resolve-store-sales-channels-for-write.ts`.

Acceptance:

- Creating duplicate channel names in same store fails clearly.
- Retired channels do not disappear from historical reports.
- Existing closeouts still display old channel names correctly.
- New closeout writes fail if channel ID is missing/invalid.
- Home/day/month/register remain equal.

### Phase 2 — Employees DB/API-only cutover

Goal: make `organization_members` and `member_store_access` the only production employee source.

Progress:

- Runtime staff provisioning now marks inactive/removed staff as
  `organization_members.status = inactive` instead of only hiding them in the
  runtime settings snapshot.
- Inactive/removed staff also deactivate the `employee_pin` auth identity, so
  deletion/archiving does not leave a usable login credential behind.
- Production staff updates now require canonical IDs: existing staff must carry
  a UUID `id` and UUID `memberId`. Legacy runtime IDs such as `ahmed` are
  rejected in production instead of being used for update/delete.
- Runtime settings saves in production DB/API mode reject active staff rows
  that do not have canonical `id` and `memberId`.
- The manual staff repair script follows the same rule: removed/inactive staff
  deactivate the DB membership instead of being silently skipped.
- Demo staff seed data now has one root file:
  `src/core/client/demo-staff-catalog-data.json`. Local seed/reset scripts read
  from it instead of redefining Ahmed/Sara in multiple places.

Files to inspect/change:

- `src/features/org-config/server/list-organization-members.ts`
- `src/features/org-config/server/create-organization-member.ts`
- `src/features/org-config/server/update-organization-member.ts`
- `src/features/runtime-settings/server/provision-staff-members.ts`
- `src/features/runtime-settings/server/runtime-settings-service.ts`
- `src/components/taqfeelah-app/owner-settings-screen-action-handlers.ts`
- `src/features/org-config/client/owner-settings-team-actions.ts`
- `src/features/auth/server/create-auth-session.ts`
- `src/features/auth/server/resolve-employee-user-id.ts`
- `src/app/api/v1/members/route.ts`
- `src/app/api/v1/members/[memberId]/route.ts`

Tasks:

1. Production team screen reads `/api/v1/members`.
2. Add employee writes `/api/v1/members`.
3. Edit employee writes `/api/v1/members/:memberId`.
4. Disable employee writes:
   - `status: inactive`
5. Remove production use of `removed: true` as persistence.
6. Update session/login logic to avoid runtime `staff` fallback in production.
7. Ensure employee store access is updated only in `member_store_access`.
8. After every employee save, reload from API.

Acceptance:

- Disabled employee cannot log in or save closeouts.
- Disabled employee disappears from active list but can be viewed with `status=inactive` if needed.
- Employee without store access cannot read/write that store server-side.
- No runtime staff snapshot can re-activate an inactive DB employee.

### Phase 3 — Runtime settings shrink

Goal: keep runtime settings only for true UI preferences, not operational truth.

Allowed production runtime settings after cutover:

- theme/preference values
- non-financial UI preferences
- safe feature preferences

Not allowed:

- canonical stores
- canonical sales channels
- canonical staff
- auth credentials
- financial totals
- operational entries

Progress:

- Runtime settings saves in production DB/API mode now strip operational keys
  before persistence:
  - `configuredBusinesses`
  - `archivedBusinessIds`
  - `storeChannelSettings`
  - `storeOperationalSettings`
  - `staff`
  - `authConfig`
- Production DB/API saves no longer run sales-channel provisioning from the
  runtime settings snapshot. Channels must come from the org-config API/DB
  path.
- The client runtime-settings snapshot also sends only UI preferences in
  production DB/API mode. This prevents operational/auth fields from being sent
  to the runtime settings API in the first place.
- UI-only preferences such as `notebookTheme`, `ownerShellPreferences`, and
  `employeePreferences` remain allowed.
- Sales-channel names are display labels, not identity. Creating two channels
  with the same label is allowed; operational linking and financial writes must
  use the channel UUID.
- Production org-config write APIs no longer accept legacy store IDs such as
  `shami`. Store updates, channel writes, operational-settings writes, and
  member store-access writes must send canonical UUIDs.

Tasks:

1. Split runtime settings type into:
   - `uiPreferences`
   - `legacyPrototypeSettings`
2. Stop persisting stores/channels/staff to production runtime settings.
3. Add migration/repair script if historical runtime settings need cleanup.
4. Update docs/API contract.

Acceptance:

- Production can rebuild stores/channels/staff UI from DB only.
- Runtime settings deletion does not remove employees or channels.

### Phase 4 — Final fallback deletion, gradual

Goal: delete fallback code in safe layers after replacements are verified.

Deletion order:

1. Production financial fallback
   - Already mostly blocked by P0.
   - Remove remaining name-based financial fallback after channel ID cutover.
2. Production operational fallback
   - Remove production use of `storeChannelSettings` for channels.
   - Remove production use of `staff` for employees.
3. Browser persistence fallback
   - Keep only non-operational UI preferences.
   - Delete operational localStorage writes.
4. Prototype/demo fallback
   - Move demo-only helpers under explicit demo-only modules.
   - Block demo helpers from `/app` production imports with a static check.
5. Legacy ID maps
   - Keep only migration/compatibility scripts.
   - Remove runtime reliance after all DB rows have canonical IDs.

Deletion rules:

- Do not delete fallback before equivalent API path is tested.
- Do not delete compatibility mapping until historical DB data is repaired.
- Every deletion must have a passing smoke test proving production still works.

Acceptance:

- A repo search for production paths shows no operational fallback.
- Production build/prelaunch fails if fallback is reintroduced.
- `/app` never imports demo data as operational source.

### Phase 5 — Documentation and runbook updates

Update:

- `docs/DATA_SOURCE_UNIFICATION.md`
- `docs/API_CONTRACT.md`
- `docs/DATABASE_SCHEMA.md`
- `docs/PRELAUNCH_MANUAL_SMOKE.md`
- `docs/VPS_LAUNCH_RUNBOOK.md`

Add operator notes:

- How to add a sales channel.
- How to retire/restore a sales channel.
- How to disable/reactivate an employee.
- How to inspect permissions.
- What to do if live gate detects fallback.

## Required smoke tests before production after cutover

1. Create channel with unique name.
2. Attempt duplicate channel name in same store.
3. Retire channel.
4. Restore channel.
5. Create closeout using channel ID.
6. Reject closeout channel without valid ID.
7. Create employee.
8. Disable employee.
9. Disabled employee login/write is rejected.
10. Change employee store access.
11. Unauthorized store write is rejected.
12. Home/day/month/register parity remains true.
13. Multiple attachments do not duplicate money.
14. Production localStorage/fallback guard passes.

## Rollback policy

Before every production migration/deploy:

1. Take DB backup.
2. Take attachment backup/snapshot if attachment schema/path is touched.
3. Record commit SHA.
4. Record applied migrations.
5. Run live gate.

If live gate fails:

1. Stop launch.
2. Do not open P1/P2 scope.
3. Fix only the failing cutover item.
4. Re-run staging gate.
5. Re-run production gate only after staging passes.

## Definition of done

This cutover is complete only when:

- sales channels are DB/API-only in production
- employees are DB/API-only in production
- operational production writes use IDs only
- name fallback is removed from production financial writes
- production browser storage contains no operational truth
- prototype/demo fallback is isolated outside production
- live gate proves home/day/month/register parity
- documentation and runbooks match the implemented behavior
