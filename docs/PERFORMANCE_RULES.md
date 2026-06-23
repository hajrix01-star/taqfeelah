# تقفيلة — Performance Rules

> Applies to production backend and `/app` client integration.  
> **Phase 1:** indexed `entries` + SQL aggregation — **no** `daily_store_summaries` table.

---

## 1. Principles

| Rule | Rationale |
|------|-----------|
| Never load years of `entries` into the browser | Prototype pattern does not scale |
| Every list API is paginated | Register, audit trails if exposed |
| Summaries are computed for **one period** per request | Day or month or bounded range |
| Money math in `domain/cash-movement` | Consistent + testable |
| Store halalas as integers | Fast sums, no float drift |

---

## 2. Phase 1: direct aggregation

### Day / month home totals

- Single SQL query (or small fixed set) over `entries`:
  - `WHERE organization_id = ? AND store_id = ? AND date = ? AND status = 'active'`
  - `SUM` filtered by `type` for sales vs outflow
- Target: **< 500 ms** p95 on server for 50k+ rows per org with proper indexes (measure after seed tests).

### Register list

- Keyset pagination on `(date DESC, created_at DESC, id DESC)`.
- Default `limit=50`, max `100`.
- `GET /stores/:storeId/entries` always returns `{ items, nextCursor }` (no bulk array mode).
- Return slim DTOs — no embedded attachment bytes.

### Channel reports

- Query `entry_sales_channels` joined to `entries` with `date BETWEEN from AND to`.
- Do **not** pre-build extra rollup tables in phase 1.

---

## 3. Required indexes (first migration)

See `docs/DATABASE_SCHEMA.md` — minimum on `entries`:

- `(organization_id, store_id, date, status)`
- `(organization_id, store_id, date DESC, created_at DESC)`
- `(organization_id, store_id, type, date, status)`

Every query must include `organization_id` (from session) for tenant isolation and index use.

---

## 4. Client rules (`/app`)

- Home screen: fetch **one day or month** summary endpoint — not full entry history.
- Register: infinite scroll or pages via `cursor`.
- Opening entry detail: fetch attachment URL on demand.
- No global React state holding all organization entries.

---

## 5. `daily_store_summaries` (future only)

**Not implemented in phase 1.**

When/if added:

| Requirement | Detail |
|-------------|--------|
| Trigger | Proven slow queries on real data |
| Update | Same transaction as entry write + `audit_events` |
| Source of truth | `entries` remains canonical |
| Operations | Rebuild/reconcile job from `entries` |
| Reads | Home/report may read rollup first, verify against `entries` periodically |

Document any adoption in `docs/ARCHITECTURE.md` + owner approval.

---

## 6. Anti-patterns (reject in code review)

- `SELECT * FROM entries WHERE organization_id = ?` without date bound for UI lists
- Aggregating in React from a prop with 10k+ rows
- Storing images in `entries.note` or JSON blobs
- N+1 queries for channel lines on summary create (batch insert `entry_sales_channels`)
- Trusting client-sent totals for summary without server-side channel sum check

---

## 7. Load testing (before production deploy)

Seed script targets (suggested):

- 1 org, 5 stores, 2 years, ~10 entries/day/store → ~36k rows
- Verify day summary API and paginated register within agreed p95

Results filed in repo or deployment checklist when available.

---

## 8. Prototype disclaimer

`/prototype-runtime` uses `localStorage` and in-memory filters — **not** a performance reference for production.
