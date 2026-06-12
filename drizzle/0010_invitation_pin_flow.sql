ALTER TABLE "member_invitations" ADD COLUMN "invitation_type" text DEFAULT 'employee_onboarding' NOT NULL;
--> statement-breakpoint
ALTER TABLE "member_invitations" ADD COLUMN "pin_hash" text;
