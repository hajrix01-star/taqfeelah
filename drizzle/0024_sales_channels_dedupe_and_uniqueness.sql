-- Normalize and dedupe sales channels by canonical per-store name,
-- then enforce a unique normalized-name invariant.

-- 1) Normalize kind for known catalog channels that were historically inserted as payment_method.
UPDATE "sales_channels"
SET "kind" = 'sales_channel'
WHERE lower(btrim("name")) IN ('jahez', 'جاهز', 'hungerstation', 'هنقرستيشن', 'keeta', 'كيتا')
  AND "kind" <> 'sales_channel';

UPDATE "sales_channels"
SET "kind" = 'payment_method'
WHERE lower(btrim("name")) IN ('cash', 'نقد', 'card', 'بطاقة', 'mada', 'مدى', 'apple pay', 'online', 'أونلاين', 'bank', 'بنك')
  AND "kind" <> 'payment_method';

-- 2) Build duplicate -> keeper map by normalized name per org/store.
CREATE TEMP TABLE "sales_channels_dedupe_map" AS
WITH ranked AS (
  SELECT
    sc."id",
    sc."organization_id",
    sc."store_id",
    lower(btrim(sc."name")) AS "name_key",
    sc."status",
    sc."created_at",
    row_number() OVER (
      PARTITION BY sc."organization_id", sc."store_id", lower(btrim(sc."name"))
      ORDER BY
        CASE WHEN sc."status" = 'active' THEN 0 ELSE 1 END,
        sc."created_at" ASC,
        sc."id" ASC
    ) AS "rn"
  FROM "sales_channels" sc
),
keepers AS (
  SELECT
    "organization_id",
    "store_id",
    "name_key",
    "id" AS "keep_id"
  FROM ranked
  WHERE "rn" = 1
),
dupes AS (
  SELECT
    r."organization_id",
    r."store_id",
    r."id" AS "dup_id",
    k."keep_id"
  FROM ranked r
  JOIN keepers k
    ON k."organization_id" = r."organization_id"
   AND k."store_id" = r."store_id"
   AND k."name_key" = r."name_key"
  WHERE r."rn" > 1
)
SELECT * FROM dupes;

-- 3) Re-point entry_sales_channels FKs to keepers before delete.
UPDATE "entry_sales_channels" esc
SET "sales_channel_id" = m."keep_id"
FROM "sales_channels_dedupe_map" m
WHERE esc."organization_id" = m."organization_id"
  AND esc."store_id" = m."store_id"
  AND esc."sales_channel_id" = m."dup_id";

-- 4) Delete duplicate rows.
DELETE FROM "sales_channels" sc
USING "sales_channels_dedupe_map" m
WHERE sc."id" = m."dup_id"
  AND sc."organization_id" = m."organization_id"
  AND sc."store_id" = m."store_id";

DROP TABLE "sales_channels_dedupe_map";

-- 5) Enforce permanent uniqueness by normalized name within each org/store.
CREATE UNIQUE INDEX IF NOT EXISTS "sales_channels_org_store_name_norm_uq"
ON "sales_channels" ("organization_id", "store_id", lower(btrim("name")));
