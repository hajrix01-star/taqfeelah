# Income Sources — طرق الدفع وقنوات البيع

> آخر تحديث: 2026-06-14

## Product model

Taqfeelah records daily **incoming** amounts using a unified runtime model (`sales_channels`) with two logical kinds:

| Kind | Arabic UI | English UI | Examples |
|------|-----------|------------|----------|
| `payment_method` | طرق الدفع | Payment methods | نقد، بطاقة، مدى، بنك، Apple Pay، أونلاين |
| `sales_channel` | قنوات البيع | Sales channels | جاهز، هنقرستيشن، كيتا |

Employee closeout screens use the neutral label **قنوات الداخل / Incoming channels**.

## Defaults for new stores

| legacyId | Active by default |
|----------|-------------------|
| `cash` | yes |
| `card` | yes |

All other catalog entries are optional and added by the owner from settings.

## Catalog source of truth

`src/core/client/income-source-catalog.ts`

- Stable UUIDs for every preset (`DEFAULT_SALES_CHANNEL_UUIDS`)
- `buildCatalogUuidMap()` used during store provisioning
- `keeta` UUID: `c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f`

## Owner rules

1. At least **one** active income source must remain (payment method or sales channel).
2. Default presets such as **cash** may be disabled when another source stays active.
3. Retired channels disappear from new entries; historical snapshots are preserved.

## API / DB (unchanged paths)

- Table: `sales_channels`
- Routes: `/api/v1/stores/:storeId/sales-channels`
- Closeout payload: `salesChannels[]`

Kind is inferred client-side from `legacyId` until a future DB column is introduced.

## Terminology map

| Before | After (Arabic) | After (English) |
|--------|----------------|-----------------|
| قنوات البيع (settings title) | قنوات الداخل | Incoming channels |
| Default cash + bank | نقد + بطاقة | Cash + Card |
| Free-text add only | Catalog picker + custom name | Catalog picker + custom name |
