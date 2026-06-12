import { z } from "zod";
import { ValidationError } from "@/core/errors/app-error";
import { syncRuntimeOwnerProfileForOrganization } from "@/features/runtime-settings/server/sync-runtime-owner-profile";

const inputSchema = z.object({
  actorUserId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

export async function repairSaasAccountFoundation(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid SaaS account repair input.", parsed.error.flatten());
  }
  const input = parsed.data;
  const result = await syncRuntimeOwnerProfileForOrganization({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    reason: "saas_account_owner_profile_repair",
  });

  if (result.action === "owner_not_found") {
    throw new ValidationError("Active owner was not found for this organization.");
  }
  if (result.action === "foundation_missing_dependencies") {
    throw new ValidationError("Active store was not found for this organization.");
  }

  return {
    organizationId: input.organizationId,
    repaired: result.synced,
    action: result.action,
    ownerName: result.ownerName,
    storeId: null,
  };
}
