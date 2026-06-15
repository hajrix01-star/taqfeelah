# Income Sources — طرق الدفع

> آخر تحديث: 2026-06-14

## Product model

Taqfeelah records daily **incoming** amounts using a unified runtime model (`sales_channels`).

**Customer-facing label (UI + Excel):** **طرق الدفع / Payment methods** — one flat list (نقد، بطاقة، مدى، جاهز، …).

**Internal domain kind** (DB + code only — not shown to customers):

| Kind | Examples |
|------|----------|
| `payment_method` | نقد، بطاقة، مدى، بنك، Apple Pay، أونلاين |
| `sales_channel` | جاهز، هنقرستيشن، كيتا |

The split exists for future reports and integrations. Presentation layers merge both kinds under **طرق الدفع**.

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

## Owner settings UI

Owner settings show **one unified list** labelled **طرق الدفع**. Each catalog preset appears with an on/off toggle; **cash** and **card** are active by default for new stores. Custom names can be added at the bottom of the same section.

## Employee closeout UI

One grid under **طرق الدفع** — no separate «قنوات بيع» section for customers.

## Register filters + export

- Filter section title: **طرق الدفع**
- Filter options dedupe by canonical key (`cash`, `jahez`, …) so legacy UUID rows do not duplicate labels
- Excel sheet name: **طرق الدفع** — flat rows matching UI labels

## Owner rules

1. At least **one** active payment method must remain.
2. Default presets such as **cash** may be disabled when another source stays active.
3. Retired channels disappear from new entries; historical snapshots are preserved.

## API / DB (unchanged paths)

- Table: `sales_channels` (column `kind`: `payment_method` | `sales_channel`)
- Routes: `/api/v1/stores/:storeId/sales-channels`
- Closeout payload: `salesChannels[]`

## Terminology map

| Before | Customer UI (Arabic) | Customer UI (English) |
|--------|----------------------|-------------------------|
| قنوات الداخل / Incoming channels | **طرق الدفع** | **Payment methods** |
| قناة البيع (register filter) | **طرق الدفع** | **Payment methods** |
| Split employee form sections | **قسم واحد: طرق الدفع** | **Single section** |

Internal `kind` values are unchanged.
