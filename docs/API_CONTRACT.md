# تقفيلة — API Contract (planned — not implemented)

> **Status:** Contract documentation only. No routes implemented in foundation phase.  
> **Auth:** Session-based later; `organizationId` from server context, not trusted from client alone.  
> **UI:** Must not require design changes — responses feed existing approved screens.

Base path (proposal): `/api/v1`

All list endpoints: **pagination required**. Prefer **cursor / keyset** on `(date DESC, created_at DESC, id DESC)`.

---

## Common

### Headers (future)

- `Authorization: Bearer <session>`
- `X-Request-Id` optional

### Errors

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

### Money in JSON

```json
{ "amountHalalas": 12575, "currency": "SAR" }
```

Display formatting is client-side.

---

## Home / summaries

### `GET /stores/:storeId/summary/day`

Query: `date=YYYY-MM-DD`

Response:

```json
{
  "storeId": "uuid",
  "date": "2026-06-02",
  "totalSales": { "amountHalalas": 0, "currency": "SAR" },
  "totalOutflow": { "amountHalalas": 0, "currency": "SAR" },
  "netMovement": { "amountHalalas": 0, "currency": "SAR" },
  "outflowRatio": "0.0%",
  "outflowRatioStatus": "calculable",
  "attachmentCount": 0,
  "pendingReviewCount": 0
}
```

`outflowRatioStatus`: `calculable` | `notCalculable` (sales zero, outflow > 0 → ratio `—` in UI).

**Implementation note:** aggregate active `entries` for that store+date in SQL — no full history dump.

### `GET /stores/:storeId/summary/month`

Query: `month=YYYY-MM`

Same shape with month-level totals.

### `GET /organizations/:organizationId/summary/combined` (optional)

Query: `period=day|month`, `date` or `month`, optional store filter.

For “all stores” home view — aggregates per store + combined totals.

---

## Entries

### `POST /entries`

Create purchase / expense / withdrawal / summary.

Body (summary example):

```json
{
  "storeId": "uuid",
  "date": "2026-06-02",
  "type": "summary",
  "channels": [
    { "salesChannelId": "uuid", "amountHalalas": 50000 }
  ],
  "note": "optional"
}
```

**Transaction rules:**

- Summary: enforce channel sum = `amount_halalas`.
- Write `audit_events.created`.
- Attachments: separate upload flow → link `entry_id`.

### `POST /entries/:entryId/void`

Body: `{ "reason": "string" }`  
Sets `status=voided`, `voided_at`, audit `voided`.

### `POST /entries/:entryId/restore`

Body: `{ "reason": "string" }`  
Sets `status=active`, `restored_at`, audit `restored`.

### `POST /entries/:entryId/review` (owner)

Marks attachment reviewed; audit `reviewed`.

### `POST /entries/duplicate-summary/approve`

When adding second active summary same store+day:

Body: `{ "storeId", "date", "payload": { ...summary body } }`  
Creates entry + audit `duplicate_approved`.

---

## Register (log)

### `GET /entries`

Query:

| Param | Type |
|-------|------|
| `storeId` | uuid or `all` (owner) |
| `from` | date |
| `to` | date |
| `type` | optional filter |
| `status` | `active` \| `voided` \| `all` |
| `cursor` | opaque |
| `limit` | default 50, max 100 |

Response:

```json
{
  "items": [ { "id", "type", "date", "amountHalalas", "status", "note", "hasAttachment", ... } ],
  "nextCursor": "..."
}
```

**Never** return unbounded arrays.

---

## Reports

All report endpoints require `from` + `to` (or `month`) — server rejects wide unbounded queries.

### `GET /reports/channels`

Query: `storeId`, `from`, `to`  
Reads `entry_sales_channels` joined to active `entries` in range.

### `GET /reports/outflow`

Query: `storeId`, `from`, `to`, `categoryId?`  
Aggregates outflow types.

### `GET /reports/days`

Query: `storeId`, `from`, `to`  
Per-day sales / outflow / net (SQL `GROUP BY date`).

### `GET /reports/attachments`

Query: `storeId`, `from`, `to`  
Counts and pending review stats.

---

## Stores & config (settings parity)

### `GET /stores` · `POST /stores` · `PATCH /stores/:id`

Archive via `status=archived` + audit `store_archived`.

### `GET /stores/:storeId/sales-channels` · PATCH retire/activate

### `GET /stores/:storeId/outflow-categories`

### `GET /members` · `POST /members` · PATCH access / `member_store_access`

Employee: only assigned stores.

---

## Attachments (later)

### `POST /attachments/upload-url`

Returns presigned URL + `attachmentId` draft.

### `POST /attachments/:id/complete`

Links to `entry_id` after entry created.

---

## Explicitly out of scope (phase 1 contract)

- Billing / subscriptions API
- Marketing site CMS
- Export PDF/Excel generation
- Real OTP SMS webhooks (stub only until provider chosen)

---

## Prototype mapping

| Prototype concept | API |
|-------------------|-----|
| `businessId` | `storeId` |
| `operationalEntries` array in memory | paginated `GET /entries` + summary endpoints |
| localStorage settings | stores/channels/members endpoints |
