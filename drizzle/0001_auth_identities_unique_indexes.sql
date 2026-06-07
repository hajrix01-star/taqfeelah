CREATE UNIQUE INDEX IF NOT EXISTS "auth_identities_user_provider_uq"
  ON "auth_identities" ("user_id", "provider");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "auth_identities_username_password_uq"
  ON "auth_identities" ("provider", "username")
  WHERE "provider" = 'username_password' AND "username" IS NOT NULL;
