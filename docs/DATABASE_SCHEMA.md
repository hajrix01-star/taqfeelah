# تقفيلة — Database Schema (Phase 1 — documentation)

> **ORM:** Drizzle ORM · **DB:** PostgreSQL  
> **Not implemented yet** — this file is the contract for the first migration.  
> **UI baseline:** frozen — see `docs/APPROVED_UI_BASELINE.md`.

---

## Conventions

- Primary keys: UUID (`uuid` / `gen_random_uuid()`).
- Timestamps: `timestamptz`, UTC storage.
- Money: `amount_halalas` `bigint` or `integer` (halalas, non-negative per column rules).
- `currency`: always `'SAR'` for phase 1.
- Every business table includes `organization_id` where applicable.
- Soft void: `entries.status` = `active` | `voided` — no DELETE for financial rows.

---

## organizations

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `name` | text | |
| `status` | text | e.g. `active`, `suspended` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

## users

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `name` | text | |
| `status` | text | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

## auth_identities

> **Phase 1:** table documented; **no real auth implementation**, no live credentials.

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | |
| `provider` | enum/text | `phone_otp` \| `username_password` |
| `phone_number` | text nullable | |
| `username` | text nullable | |
| `password_hash` | text nullable | never store plaintext |
| `verified_at` | timestamptz nullable | |
| `status` | text | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

## organization_members

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `organization_id` | uuid FK | |
| `user_id` | uuid FK | |
| `role` | text | `owner` \| `manager` \| `employee` |
| `status` | text | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**Index:** `(organization_id, user_id, status)`

---

## member_store_access

| Column | Type | Notes |
|--------|------|--------|
| `organization_member_id` | uuid FK | |
| `store_id` | uuid FK | |

**Unique:** `(organization_member_id, store_id)`

---

## stores

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `organization_id` | uuid FK | |
| `name` | text | |
| `location` | text nullable | |
| `status` | text | `active` \| `archived` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

## sales_channels

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `organization_id` | uuid FK | |
| `store_id` | uuid FK | |
| `name` | text | |
| `status` | text | `active` \| `retired` |
| `created_at` | timestamptz | |
| `retired_at` | timestamptz nullable | |

---

## outflow_categories

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `organization_id` | uuid FK | |
| `store_id` | uuid FK | |
| `name` | text | |
| `status` | text | `active` \| `retired` |
| `created_at` | timestamptz | |
| `retired_at` | timestamptz nullable | |

---

## entries

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `organization_id` | uuid FK | |
| `store_id` | uuid FK | |
| `date` | date | business date (ISO) |
| `type` | text | `summary` \| `purchases` \| `expense` \| `withdrawal` |
| `amount_halalas` | integer | see summary rule below |
| `currency` | text | `SAR` |
| `category_id` | uuid nullable | outflow category when applicable |
| `note` | text nullable | |
| `entered_by_user_id` | uuid FK → users | |
| `status` | text | `active` \| `voided` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |
| `reviewed_at` | timestamptz nullable | |
| `voided_at` | timestamptz nullable | |
| `restored_at` | timestamptz nullable | |
| `corrected_from_entry_id` | uuid nullable FK → entries | |

**Indexes (phase 1):**

- `(organization_id, store_id, date, status)`
- `(organization_id, store_id, date DESC, created_at DESC)` — list / keyset pagination
- `(organization_id, store_id, type, date, status)` — filtered reports

**No unique constraint** on `(organization_id, store_id, date, type=summary)` — multiple summaries per day allowed after owner approval flow.

### Summary amount invariant

When `type = summary`, inside the same DB transaction:

```text
entries.amount_halalas = SUM(entry_sales_channels.amount_halalas)
```

Reject commit if mismatch.

---

## entry_sales_channels

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `organization_id` | uuid FK | |
| `store_id` | uuid FK | |
| `entry_id` | uuid FK → entries | |
| `sales_channel_id` | uuid FK → sales_channels | |
| `channel_name_snapshot` | text | denormalized label at write time |
| `amount_halalas` | integer | |

**Indexes:**

- `(organization_id, store_id, entry_id)`
- `(organization_id, store_id, sales_channel_id)`

Channel reports for a period query this table with date filter via join to `entries`.

---

## attachments

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `organization_id` | uuid FK | |
| `store_id` | uuid FK | |
| `entry_id` | uuid FK → entries | |
| `storage_key` | text | object storage path |
| `original_file_name` | text nullable | |
| `mime_type` | text | |
| `size_bytes` | integer | |
| `created_at` | timestamptz | |

Binary files **not** stored in row JSON.

---

## audit_events

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `organization_id` | uuid FK | |
| `store_id` | uuid FK nullable | |
| `entry_id` | uuid nullable FK | |
| `actor_user_id` | uuid FK → users | |
| `action` | text | see enum below |
| `reason` | text nullable | |
| `metadata` | jsonb nullable | |
| `created_at` | timestamptz | |

**Initial actions:** `created`, `reviewed`, `voided`, `restored`, `duplicate_approved`, `corrected`, `store_archived`, `store_renamed`

**Index:** `(organization_id, store_id, entry_id, created_at DESC)`

---

## Future table (not phase 1): daily_store_summaries

Documented only — implement when metrics prove need.

| Purpose | Pre-aggregated day totals per store |
| Rules | Update in same transaction as entry + audit; `entries` remains source of truth; provide rebuild/reconcile job |

See `docs/PERFORMANCE_RULES.md`.

---

## Entity diagram (logical)

```text
Organization ─┬─ Store ─┬─ sales_channels
              │         ├─ outflow_categories
              │         └─ entries ─┬─ entry_sales_channels
              │                   ├─ attachments
              │                   └─ audit_events
              ├─ organization_members ── member_store_access → Store
              └─ users ← auth_identities
```
