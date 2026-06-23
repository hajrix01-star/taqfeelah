-- PostgreSQL validates trigger row references against the trigger table rowtype.
-- Keep the summary/channel invariant, but avoid referencing entry_id when the
-- trigger fires for entries where the row does not have that column.
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
  IF TG_TABLE_NAME = 'entries' THEN
    target_entry_id := coalesce(NEW."id", OLD."id");
  ELSE
    target_entry_id := coalesce(NEW."entry_id", OLD."entry_id");
  END IF;

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
