ALTER TABLE "owner_notebook_notes"
  ADD COLUMN "checklist" jsonb DEFAULT '[]'::jsonb NOT NULL;
