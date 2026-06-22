-- A summary entry and its sales-channel breakdown represent one accounting fact.
-- Repair historical drift from the channel breakdown, then enforce parity at commit.
UPDATE "entries" AS e
SET "amount_halalas" = totals."amount_halalas",
    "updated_at" = now()
FROM (
  SELECT
    e2."id" AS "entry_id",
    coalesce(sum(esc."amount_halalas"), 0)::integer AS "amount_halalas"
  FROM "entries" AS e2
  LEFT JOIN "entry_sales_channels" AS esc ON esc."entry_id" = e2."id"
  WHERE e2."type" = 'summary'
  GROUP BY e2."id"
) AS totals
WHERE e."id" = totals."entry_id"
  AND e."amount_halalas" <> totals."amount_halalas";
--> statement-breakpoint

CREATE OR REPLACE FUNCTION "assert_summary_channel_total_parity"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  target_entry_id uuid;
  target_type text;
  stored_total integer;
  channel_total bigint;
BEGIN
  target_entry_id := CASE
    WHEN TG_TABLE_NAME = 'entries' THEN coalesce(NEW."id", OLD."id")
    ELSE coalesce(NEW."entry_id", OLD."entry_id")
  END;

  SELECT "type", "amount_halalas"
  INTO target_type, stored_total
  FROM "entries"
  WHERE "id" = target_entry_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT coalesce(sum("amount_halalas"), 0)
  INTO channel_total
  FROM "entry_sales_channels"
  WHERE "entry_id" = target_entry_id;

  IF target_type = 'summary' AND stored_total::bigint <> channel_total THEN
    RAISE EXCEPTION
      'summary entry % total (%) does not match sales-channel total (%)',
      target_entry_id, stored_total, channel_total
      USING ERRCODE = '23514';
  END IF;

  IF target_type <> 'summary' AND channel_total <> 0 THEN
    RAISE EXCEPTION
      'non-summary entry % cannot have sales-channel rows',
      target_entry_id
      USING ERRCODE = '23514';
  END IF;

  RETURN NULL;
END;
$$;
--> statement-breakpoint

CREATE CONSTRAINT TRIGGER "entries_summary_channel_total_parity"
AFTER INSERT OR UPDATE ON "entries"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION "assert_summary_channel_total_parity"();
--> statement-breakpoint

CREATE CONSTRAINT TRIGGER "entry_sales_channels_summary_total_parity"
AFTER INSERT OR UPDATE OR DELETE ON "entry_sales_channels"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION "assert_summary_channel_total_parity"();
