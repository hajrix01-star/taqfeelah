# تقفيلة — Architecture (Backend Foundation)

> **Status:** Foundation documentation only — no Drizzle install, migrations, or API in this phase.  
> **UI:** `APPROVED UI BASELINE` — frozen per `docs/APPROVED_UI_BASELINE.md`.

---

## 1. Product scope

Taqfeelah is **daily operational cash movement**, not accounting:

```text
الداخل − الخارج = الناتج
```

Forbidden as core product scope: accounting, ledger, P&L, debit/credit, VAT/ZATCA, inventory, OCR, POS, invoicing, ERP expansion.

Approved domains:

```text
domain/cash-movement
features/closeout
features/entries
features/reports
```

Full rules: `docs/CONVENTIONS.md`.

---

## 2. SaaS model

Multi-tenant from **first database migration** via `Organization`.

| ID | Scope |
|----|--------|
| `organizationId` | Tenant / commercial customer |
| `storeId` | Branch or shop |
| `userId` | Person |

- Subscription (later) attaches to `Organization`.
- **Never** use `tenantId` as a parallel name.
- Server **never trusts** `organizationId` from the client body alone — derive from session + membership (when auth exists).

### Prototype vs production

| Layer | Store identifier |
|-------|------------------|
| `TaqfeelahPrototypeRuntime.jsx` | `businessId` (frozen) |
| Production DB/API | `storeId` + `organizationId` |

---

## 3. Technology stack (approved)

| Layer | Choice |
|-------|--------|
| App framework | Next.js (existing `taqfeelah-V2`) |
| Database | **PostgreSQL** |
| ORM / query | **Drizzle ORM** |
| Migrations | **drizzle-kit** |

**Rules:**

- Do **not** add Prisma in parallel.
- Do not change DB/ORM without owner approval.
- Hostinger VPS deployment is **deferred** until local app + server environment check.

Auth, billing, object storage, and marketing site are **documented but not implemented** in foundation phase.

---

## 4. Repository layout (target)

```text
src/
  app/                    # Routes only
  features/
    closeout/
    entries/
    reports/
    stores/
    memberships/
    settings/
    sharing/
    auth/
  domain/
    cash-movement/        # All operational math
    organizations/
    stores/
    entries/
  core/
    auth/
    organization/
    config/
    errors/
  shared/
    ui/
    utils/
    i18n/
```

Prototype stays at `src/components/TaqfeelahPrototypeRuntime.jsx` until `/app` parity + owner sign-off.

---

## 5. Routes (planned)

| Route | Phase | Purpose |
|-------|-------|---------|
| `/prototype-runtime` | Now | Frozen UI baseline reference |
| `/app` | Backend phase | Production operational app (visual parity) |
| `/` | Later | Marketing + plans + “Enter app” CTA |
| `/saas-admin` | Final phase | SaaS management console (desktop-first) |

Current checkpoint: **no landing page** — direct prototype runtime.

### SaaS admin route (final phase)

- `/saas-admin` is **separate** from the operational app UI.
- Target audience: owner/super-admin operators and investors (authorized roles only).
- UX policy: **desktop-first** (>= 1280px primary), tablet/mobile as limited responsive fallback.
- Purpose: subscription operations, investor KPIs, tenant health, and growth analytics.

---

## 6. Money

```ts
type Money = {
  amountHalalas: number; // integer halalas, e.g. 125.75 SAR → 12575
  currency: "SAR";
};
```

All persistence and domain math use halalas. UI formats to riyal for display.

Calculations live only in `domain/cash-movement` (see `docs/CONVENTIONS.md` §4).

---

## 7. Entries lifecycle

- No hard delete of financially relevant rows.
- `void` / `restore` + `audit_events`.
- Future corrections: void old row, create new row with `corrected_from_entry_id`, audit `corrected`.

`summary` = daily sales by channel only; multiple summaries per store/day allowed after owner `duplicate_approved` (no unique constraint blocking multiples).

---

## 8. Attachments

- Metadata in `attachments` table; `storage_key` for object storage.
- **No** file bytes in `entries` JSON.
- Object storage provider TBD; implementation deferred.

---

## 9. Performance strategy (phase 1)

- Indexed `entries` + **scoped SQL aggregation** for day/month summaries.
- **Mandatory pagination** for register/list APIs.
- **No** loading multi-year history into the browser.
- `daily_store_summaries` table: **not in phase 1** — documented future optimization only (`docs/PERFORMANCE_RULES.md`).

---

## 10. Related documents

| Document | Content |
|----------|---------|
| `docs/CONVENTIONS.md` | Mandatory product + code rules |
| `docs/DATABASE_SCHEMA.md` | Tables, columns, indexes |
| `docs/API_CONTRACT.md` | Planned endpoints (contracts only) |
| `docs/PERFORMANCE_RULES.md` | Query and pagination rules |
| `docs/APPROVED_UI_BASELINE.md` | Frozen UI checkpoint |

---

## 11. SaaS analytics and investor reporting (final phase)

### KPI scope

- Tenant lifecycle: `newOrganizations`, `activeOrganizations`, `suspendedOrganizations`, `churnedOrganizations`.
- Revenue: `MRR`, `ARR`, `collections`, `failedPayments`, `refunds` (provider-dependent).
- Product usage: `DAU`, `WAU`, `MAU` (organization + user levels).
- Engagement/retention: cohorts, activation funnel, dormant organizations.
- Operational value: aggregate daily `inside/outside/net` at organization/store portfolio level.

### UI scope — desktop-first console

- SaaS overview dashboard (time range + KPI cards + trend charts).
- Subscription and plan management workspace.
- Organization health table (usage, status, risk flags, last activity).
- Investor-ready exports (CSV first, PDF optional later).
- Strict role gating and audit logging for admin actions.

---

## 12. Implementation order (after owner approval)

1. Drizzle + PostgreSQL + first migration (schema in `DATABASE_SCHEMA.md`).
2. `domain/cash-movement` + unit tests.
3. Session/auth skeleton (no production credentials in repo).
4. Entry APIs + audit.
5. `/app` screens one-by-one matching prototype.
6. Final phase: `/saas-admin` (desktop-first) + SaaS analytics + investor reporting.

Stop after documentation + checkpoint until owner approves schema work.
