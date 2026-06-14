import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { assertStoreAccess } from "@/core/auth/assert-store-access";
import { type MemberRole } from "@/core/auth/roles";
import { attachments } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { resolveAttachmentDataUrl } from "@/core/attachments/resolve-attachment-data-url";

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  storeId: z.string().uuid(),
  attachmentId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
});

type GetStoreAttachmentInput = z.infer<typeof inputSchema>;

export async function getStoreAttachment(rawInput: GetStoreAttachmentInput) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid attachment read input.", parsed.error.flatten());
  }

  const input = parsed.data;
  await assertStoreAccess({
    organizationId: input.organizationId,
    storeId: input.storeId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole as MemberRole,
    minimumRole: "employee",
  });

  const db = getDb();
  const [row] = await db
    .select({
      id: attachments.id,
      storageKey: attachments.storageKey,
      originalFileName: attachments.originalFileName,
      mimeType: attachments.mimeType,
      sizeBytes: attachments.sizeBytes,
    })
    .from(attachments)
    .where(
      and(
        eq(attachments.id, input.attachmentId),
        eq(attachments.organizationId, input.organizationId),
        eq(attachments.storeId, input.storeId),
      ),
    )
    .limit(1);

  if (!row) {
    throw new ValidationError("Attachment not found.");
  }

  const dataUrl = await resolveAttachmentDataUrl(row.storageKey);
  if (!dataUrl) {
    throw new ValidationError("Attachment content is unavailable.");
  }

  return {
    id: row.id,
    name: row.originalFileName || "attachment.jpg",
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    dataUrl,
  };
}
