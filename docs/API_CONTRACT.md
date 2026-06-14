# تقفيلة — API Contract (planned + partial implementation)

> **Status:** Partial implementation exists: `GET /stores/:storeId/summary/day|month|period`, `GET /reports/days|channels|outflow|attachments` (wired to owner reports when entries API is enabled), snapshot `POST /stores/:storeId/summary/day`, `POST /stores/:storeId/closeouts`, `GET /stores/:storeId/closeouts`, `GET /stores/:storeId/entries`, Phase 8 org config routes, and Phase 9 duplicate-summary / notebook export / inline attachments are implemented; remaining endpoints are planned. Closeout owner-review (`POST .../closeouts/:closeoutId/review`) was removed under zero-review policy.  
> **Auth:** Session rollout in progress. Preferred source is signed session cookie (`AUTH_SESSION_COOKIE_NAME`), with optional temporary header fallback controlled by `ALLOW_HEADER_AUTH_CONTEXT`.  
> **Source-unification period:** Until auth launch, Prototype Access Mode remains ON and server APIs may accept `x-organization-id` / `x-user-id` / `x-member-role` when `ALLOW_HEADER_AUTH_CONTEXT=true`. Signed session cookies become required only in the explicit auth launch phase.  
> **UI:** Must not require design changes — responses feed existing approved screens.

Base path (proposal): `/api/v1`

All list endpoints: **pagination required**. Prefer **cursor / keyset** on `(date DESC, created_at DESC, id DESC)`.

---

## Common

### Headers (future)

- `Authorization: Bearer <session>`
- `X-Request-Id` optional

### Errors

Structured errors follow RFC 9457-style problem details (stable `type` + `code`, human `message`, operator `cause`):

```json
{
  "error": {
    "type": "https://taqfeelah.com/errors/owner-username-taken",
    "code": "OWNER_USERNAME_TAKEN",
    "title": "Owner username taken",
    "message": "Owner username is already taken.",
    "cause": "auth_identities already contains this username for provider username_password."
  }
}
```

Legacy clients may continue to read `error.code` and `error.message`. Validation errors may include `error.details.fieldErrors`.

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
  "attachmentCount": 0
}
```

`outflowRatioStatus`: `calculable` | `notCalculable` (sales zero, outflow > 0 → ratio `—` in UI).

**Implementation note:** aggregate active `entries` for that store+date in SQL — no full history dump.

### `POST /stores/:storeId/summary/day` (implemented)

Query: `date=YYYY-MM-DD`

Headers:

- `x-organization-id: <uuid>`
- `x-user-id: <uuid>`
- `x-member-role: owner|manager|employee`

Body:

```json
{
  "totalSalesHalalas": 125000,
  "totalOutflowHalalas": 42000,
  "note": "optional"
}
```

Behavior:

- Records an immutable day snapshot in `audit_events` (`action = summary_snapshot_recorded`) after organization/store/membership validation.
- Returns computed current summary from `entries` plus snapshot metadata.

### `GET /stores/:storeId/summary/month` (implemented)

Query: `month=YYYY-MM`

Same shape with month-level totals (aggregates active `entries` across the month).

### `GET /stores/:storeId/summary/period` (implemented)

Query: `from=YYYY-MM-DD`, `to=YYYY-MM-DD`

Same shape with range-level totals. Server rejects ranges wider than 366 days.

### `GET /organizations/:organizationId/summary/combined` (optional)

Query: `period=day|month`, `date` or `month`, optional store filter.

For “all stores” home view — aggregates per store + combined totals.

---

## Closeouts (implemented core)

### `POST /stores/:storeId/closeouts` (implemented)

Headers:

- `x-organization-id: <uuid>`
- `x-user-id: <uuid>`
- `x-member-role: owner|manager|employee`

Body:

```json
{
  "mode": "submit",
  "closeoutId": "client-closeout-id",
  "date": "2026-06-05",
  "daySequence": 1,
  "salesChannels": [
    {
      "salesChannelId": "uuid",
      "channelName": "Cash",
      "amountHalalas": 120000
    }
  ],
  "outflows": [
    {
      "type": "expense",
      "amountHalalas": 5000,
      "categoryId": null,
      "note": "optional"
    }
  ],
  "note": "optional"
}
```

Behavior:

- Validates organization/store/user authorization.
- Creates operational `entries` + channel rows in one transaction.
- Writes closeout audit trail (`closeout_submitted` / `closeout_resubmitted`).
- `mode`: `"submit"` (default) or `"ownerEdit"` to replace entries for an existing closeout. Legacy alias `"resubmit"` is normalized to `"ownerEdit"`.
- Assigns `daySequence` server-side per `storeId + date` (1, 2, 3…). UI maps this to English letters (`A`, `B`, `C`) beside the date when multiple closeouts exist on the same day. Owner edits keep the same `daySequence`.
- **Zero-review policy:** every submit (employee, owner, or manager) auto-approves in the same transaction (`status=approved`, `entries.status=active`). Legacy body flags `autoReview` / `requireReview` are **ignored** if sent.
- `ownerEdit` is forbidden for `employee` role; only owner/manager may edit a sent closeout. Audit action remains `closeout_resubmitted` for owner edits.
- See `.cursor/rules/closeout-review-defaults.mdc`.

### `GET /stores/:storeId/closeouts` (implemented)

Headers:

- `x-organization-id: <uuid>`
- `x-user-id: <uuid>`
- `x-member-role: owner|manager|employee`

Query (optional):

- `dateFrom=YYYY-MM-DD`
- `dateTo=YYYY-MM-DD`

Behavior:

- Reads closeout timeline from `audit_events`.
- Returns normalized closeouts list (status, totals, sales/outflows, `daySequence`) for runtime hydration.

### `POST /stores/:storeId/closeouts/:closeoutId/review` (removed)

Legacy owner approve/return endpoint. **Not implemented** — every submit auto-approves in `POST /stores/:storeId/closeouts` (zero-review policy). Historical audit actions `closeout_approved` / `closeout_returned` may still appear in old demo data only.

---

## Entries

### `GET /stores/:storeId/entries` (implemented)

Headers:

- `x-organization-id: <uuid>`
- `x-user-id: <uuid>`
- `x-member-role: owner|manager|employee`

Query (optional):

- `dateFrom=YYYY-MM-DD`
- `dateTo=YYYY-MM-DD`
- `status=active|voided|all` (default: `all`)
- `limit` (default 500, max 1000)

Behavior:

- Returns scoped operational entries for one store ordered by date/time desc.
- Hydrates summary channels from `entry_sales_channels`.
- Includes closeout linkage when entries were created from closeout submission audit metadata.

### `POST /stores/:storeId/entries` (implemented)

Headers:

- `x-organization-id: <uuid>`
- `x-user-id: <uuid>`
- `x-member-role: owner|manager|employee`

Body (summary example):

```json
{
  "date": "2026-06-02",
  "type": "summary",
  "salesChannels": [
    { "salesChannelId": "uuid", "channelName": "Cash", "amountHalalas": 50000 }
  ],
  "note": "optional"
}
```

Body (outflow example):

```json
{
  "date": "2026-06-02",
  "type": "expense",
  "amountHalalas": 12000,
  "categoryId": null,
  "note": "optional"
}
```

Behavior:

- Validates actor/store membership and role.
- Creates entry rows (and summary channels when applicable) transactionally.
- Writes audit event `entry_created`.

### `POST /stores/:storeId/entries/:entryId/review` (implemented)

Marks active entry as reviewed and appends audit event `entry_reviewed`.

### `POST /stores/:storeId/entries/:entryId/void` (implemented)

Body: `{ "reason": "optional" }`

Sets `status=voided`, `voided_at` and appends audit event `entry_voided`.

### `POST /stores/:storeId/entries/:entryId/restore` (implemented)

Body: `{ "reason": "optional" }`

Sets `status=active`, `restored_at` and appends audit event `entry_restored`.

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

### `POST /stores/:storeId/entries/duplicate-summary/approve` (implemented)

When adding second active summary same store+day:

Body:

```json
{
  "date": "2026-06-05",
  "payload": {
    "type": "summary",
    "note": "optional",
    "salesChannels": [
      { "salesChannelId": "uuid", "channelName": "Cash", "amountHalalas": 100000 }
    ],
    "attachment": { "kind": "image", "mimeType": "image/jpeg", "sizeBytes": 12000, "dataUrl": "..." }
  }
}
```

Creates entry + audit `duplicate_approved`. Requires an existing active summary for the same store+date.

### `POST /stores/:storeId/entries/duplicate-summary/acknowledge` (implemented)

Owner acknowledges duplicate summary alerts without creating a new entry.

Body:

```json
{
  "date": "2026-06-05",
  "entryIds": ["uuid", "uuid"]
}
```

Writes audit `duplicate_approved` with `metadata.mode = acknowledge_existing` for each entry.

---

## Register (log)

### `GET /stores/:storeId/entries` (implemented)

Query:

| Param | Type |
|-------|------|
| `dateFrom` | date |
| `dateTo` | date |
| `status` | `active` \| `voided` \| `all` |
| `limit` | default 500 (bulk) or 50 when paginated |
| `cursor` | opaque (Phase 6) |
| `paginated` | `1` to return `{ items, nextCursor }` |

Response (bulk — default):

```json
[ { "id", "type", "date", "amount", "status", "note", ... } ]
```

Response (paginated — `paginated=1` or `cursor` present):

```json
{
  "items": [ { "id", "type", "date", "amount", "status", "note", ... } ],
  "nextCursor": "..."
}
```

**Never** return unbounded arrays in paginated mode.

### `GET /entries` (planned — org-wide register)

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

---

## Reports

All report endpoints require `from` + `to` (or `month`) — server rejects wide unbounded queries.

### `GET /reports/channels` (implemented)

Query: `storeId`, `from`, `to`  
Reads `entry_sales_channels` joined to active `entries` in range.

Response:

```json
{
  "storeId": "uuid",
  "from": "2026-06-01",
  "to": "2026-06-30",
  "channels": [
    { "salesChannelId": "uuid", "channelName": "Walk-in", "amount": { "amountHalalas": 0, "currency": "SAR" } }
  ]
}
```

### `GET /reports/outflow` (implemented)

Query: `storeId`, `from`, `to`, optional `categoryKey`, optional `includeTransactions=true`  
Aggregates outflow types (`purchases`, `expense`, `withdrawal`) with optional category filter and transaction list.

Response includes `totalOutflow`, `transactionCount`, `categories[]`, and `transactions[]` when requested.

### `GET /reports/days` (implemented)

Query: `storeId`, `from`, `to`  
Per-day sales / outflow / net (SQL `GROUP BY date`).

### `GET /reports/attachments` (implemented)

Query: `storeId`, `from`, `to`  
Counts, pending review stats, and item list for entries with attachments in range.

---

## Stores & config (settings parity)

### `GET /api/v1/stores` (implemented)

Query: optional `status=active|archived|all`  
Owner/manager: all org stores. Employee: assigned stores only.

### `POST /api/v1/stores` (implemented)

Body: `{ name, location? }` — owner only. Audit: `store_created`.

### `PATCH /api/v1/stores/:storeId` (implemented)

Body: `{ name?, location?, status?: active|archived, reason? }` — owner only.  
Archive via `status=archived` + audit `store_archived`.

### `GET /api/v1/stores/:storeId/sales-channels` (implemented)

Query: optional `status=active|retired|all`

### `PATCH /api/v1/stores/:storeId/sales-channels` (implemented)

Body: `{ salesChannelId, status: active|retired, reason? }` — owner only.

### `GET /api/v1/stores/:storeId/outflow-categories` (implemented)

Query: optional `status=active|retired|all`

### `GET /api/v1/members` (implemented)

Query: optional `status=active|inactive|all` — manager+ only.  
Includes `storeAccess[]` per member.

### `POST /api/v1/members` (implemented — foundation)

Body:

```json
{
  "name": "Employee Name",
  "role": "employee",
  "storeIds": ["uuid"],
  "credentials": { "type": "employee_pin", "pin": "1234" }
}
```

Owner-only. Writes `member_created` audit. Credentials are stored in `auth_identities` when provided.

### `PATCH /api/v1/members/:memberId` (implemented — foundation)

Body supports `name`, `role`, `status`, `storeIds`, optional `credentials`, optional `reason`.

### Planned

- Member invite/reset flows and email delivery

Employee: only assigned stores for store-scoped reads.

---

## Exports

### `GET /exports/notebook` (implemented)

Query: `storeId`, `period=day|month|year|custom`, plus `from`+`to` or `date` or `month=YYYY-MM`

Response:

```json
{
  "storeId": "uuid",
  "period": "day",
  "from": "2026-06-05",
  "to": "2026-06-05",
  "totals": { "sales": 1500, "expense": 250, "net": 1250, "ratio": "16.7%", "proofs": 1, "pending": 0 },
  "channels": [{ "channelId": "uuid", "name": "Cash", "amount": 1500 }],
  "operations": [{ "id": "uuid", "date": "2026-06-05", "type": "summary", "amount": 1500, "note": "", "hasAttachment": true, "createdAt": "..." }]
}
```

Amounts are returned in riyals (display units). Notebook share UI may still use loaded entries until wired behind `NEXT_PUBLIC_PHASE9_API_ENABLED`.

---

## Attachments

### `POST /stores/:storeId/attachments/inline` (implemented)

Registers a prototype inline image attachment and returns a stable `storageKey` (`inline:v1:{checksum}:...`) for entry creation.

Body:

```json
{
  "attachment": {
    "kind": "image",
    "name": "receipt.jpg",
    "mimeType": "image/jpeg",
    "sizeBytes": 12000,
    "dataUrl": "data:image/jpeg;base64,..."
  }
}
```

### Planned

- `POST /attachments/upload-url` — presigned URL + `attachmentId` draft
- `POST /attachments/:id/complete` — link to `entry_id` after entry created

---

## Explicitly out of scope (phase 1 contract)

- Billing / subscriptions API
- Marketing site CMS
- Export PDF/Excel generation
- Real OTP SMS webhooks (stub only until provider chosen)

---

## Auth OTP (disabled by default)

> Set `AUTH_OTP_ENABLED=true` only after a provider is configured and product approves launch.

### `POST /api/v1/auth/otp/request` (implemented — gated)

Returns `503 SERVICE_UNAVAILABLE` when `AUTH_OTP_ENABLED` is not `true`.

### `POST /api/v1/auth/otp/verify` (implemented — gated)

Returns `503 SERVICE_UNAVAILABLE` when `AUTH_OTP_ENABLED` is not `true`.

---

## SaaS Admin API (disabled by default)

> Requires `SAAS_ADMIN_API_ENABLED=true`, signed auth session cookie, and `SAAS_PLATFORM_ADMIN_USER_IDS` allowlist.  
> `middleware.ts` returns `503` / `401` / `403` before route handlers when the API is disabled or the caller is not a platform admin.

### `GET /api/v1/saas-admin/overview` (implemented — gated)

Returns platform KPIs, activity trend, top/inactive accounts, system health summary, and engagement snapshot metadata.

### `GET /api/v1/saas-admin/accounts` (implemented — gated)

Query: `page` (default 1), `pageSize` (default 25), `status=all|trial|active|inactive|suspended`, optional `search`, `plan`

### `GET /api/v1/saas-admin/accounts/:id` (implemented — gated)

Returns account profile, stores, users, usage trend, and operational totals.

### `POST /api/v1/saas-admin/accounts` (implemented — gated)

Creates a new organization with owner credentials, default store, and trial subscription.

Body:

```json
{
  "organizationName": "string",
  "ownerName": "string",
  "ownerUsername": "string",
  "ownerPassword": "string",
  "storeName": "string (optional)",
  "storeLocation": "string (optional)",
  "planCode": "starter|growth|enterprise (optional, default starter)"
}
```

Returns `201` with `organizationId`, `ownerUsername`, `storeId`, `subscriptionId`, and `status: trial`.

### `POST /api/v1/saas-admin/accounts/:id/members` (implemented — gated)

Provisions a manager or employee with PIN login for the target organization.

Body:

```json
{
  "name": "string",
  "role": "manager|employee",
  "pin": "string",
  "storeIds": ["uuid"] 
}
```

Returns `201` with member profile metadata.

### `GET /api/v1/saas-admin/accounts/:id/stores/:storeId/sales-channels` (implemented — gated)

Permission: `accounts:channels:write` (platform `owner` and `support`).

Query: optional `status=active|retired|all`

Returns `{ storeId, channels: [{ id, name, status, retiredAt, createdAt }] }`.

### `POST /api/v1/saas-admin/accounts/:id/stores/:storeId/sales-channels` (implemented — gated)

Permission: `accounts:channels:write`.

Body:

```json
{
  "name": "string",
  "status": "active|retired (optional, default active)",
  "reason": "string (optional)"
}
```

Returns `201` with `{ channel: { id, name, status, retiredAt, createdAt } }`.  
Audit: `sales_channel_created` with `metadata.source = platform_admin`.

### `PATCH /api/v1/saas-admin/accounts/:id/stores/:storeId/sales-channels` (implemented — gated)

Permission: `accounts:channels:write`.

Body:

```json
{
  "salesChannelId": "uuid",
  "status": "active|retired",
  "reason": "string (optional)"
}
```

Audit: `sales_channel_retired` or `sales_channel_activated` with `metadata.source = platform_admin`.

### `GET /api/v1/saas-admin/usage` (implemented — gated)

Query: `months` (default 6) — engagement lists and snapshot availability.

### `GET /api/v1/saas-admin/investor-metrics` (implemented — gated)

Returns investor-oriented KPIs (MRR/ARR labeled estimated where applicable).

### `GET /api/v1/saas-admin/system-health` (implemented — gated)

Returns database/API health probes for the admin console.

### `POST /api/v1/saas-admin/analytics/aggregate` (implemented — gated)

Body (optional): `{ "snapshotDate": "YYYY-MM-DD" }` — rebuilds engagement snapshots (`pnpm saas:aggregate` uses the same server function).

### Removed (superseded by dashboard routes above)

- `GET /api/v1/saas-admin/kpis/overview`
- `GET /api/v1/saas-admin/organizations`
- `GET /api/v1/saas-admin/analytics/investor-dashboard`
- `GET /api/v1/saas-admin/analytics/organizations`

### Planned (not implemented)

- `GET /api/v1/saas-admin/exports/investor.csv` — CSV export
- Billing provider webhooks

### `PATCH /api/v1/saas-admin/accounts/:id/subscription` (implemented — gated)

Updates subscription lifecycle for an organization: plan change, status, billing cycle, period extension, and paid activation.

Body (at least one field required):

```json
{
  "planCode": "growth",
  "status": "active",
  "billingCycle": "monthly",
  "extendPeriodDays": 14,
  "activatePaid": true,
  "acknowledgeUsageExceedsLimits": false
}
```

- `activatePaid: true` moves trial accounts to paid `active` status and resets the billing period.
- Downgrades that exceed current store/seat usage require `acknowledgeUsageExceedsLimits: true`.
- Writes audit event `saas_subscription_updated`.

Returns updated subscription snapshot plus resolved entitlements.

---

### Previously planned (now implemented above)

- ~~`PATCH /api/v1/saas-admin/accounts/:id/subscription` — subscription lifecycle writes~~

---

## Prototype mapping

| Prototype concept | API |
|-------------------|-----|
| `businessId` | `storeId` |
| `operationalEntries` array in memory | paginated `GET /entries` + summary endpoints |
| localStorage settings | stores/channels/members endpoints |
