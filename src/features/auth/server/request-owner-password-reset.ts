import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { resolveAppPublicOrigin } from "@/core/auth/app-origin";
import { isPasswordResetEnabled } from "@/core/config/password-reset-mode";
import { sendTransactionalEmail } from "@/core/email/send-transactional-email";
import { getDb } from "@/core/db/client";
import { auditEvents, organizationMembers, passwordResetTokens } from "@/core/db/schema";
import { ServiceUnavailableError, ValidationError } from "@/core/errors/app-error";
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
} from "@/features/auth/server/password-reset-token";
import { resolveOwnerUserIdByEmail } from "@/features/auth/server/resolve-owner-by-email";

const RESET_TOKEN_TTL_SECONDS = 60 * 60;

const inputSchema = z.object({
  email: z.string().trim().email("A valid email address is required."),
});

function buildResetUrl(token: string, request?: Request): string {
  const origin = resolveAppPublicOrigin(request);
  return `${origin}/auth/reset-password?token=${encodeURIComponent(token)}`;
}

function buildResetEmailHtml(resetUrl: string): string {
  return [
    "<div dir=\"rtl\" style=\"font-family:sans-serif;line-height:1.7\">",
    "<p>مرحبًا،</p>",
    "<p>تلقّينا طلبًا لإعادة تعيين كلمة مرور حسابك في تطبيق تقفيلة.</p>",
    "<p>اضغط الزر أدناه لإنشاء كلمة مرور جديدة. الرابط صالح لمدة ساعة واحدة.</p>",
    `<p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#112A46;color:#fff;text-decoration:none;border-radius:8px">إعادة تعيين كلمة المرور</a></p>`,
    `<p style="word-break:break-all">${resetUrl}</p>`,
    "<p>إذا لم تطلب ذلك، تجاهل هذه الرسالة.</p>",
    "<p>تطبيق تقفيلة</p>",
    "</div>",
  ].join("");
}

export async function requestOwnerPasswordReset(
  rawInput: z.infer<typeof inputSchema>,
  request?: Request,
) {
  if (!isPasswordResetEnabled()) {
    throw new ServiceUnavailableError("Password reset is not enabled.");
  }

  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid password reset request.", parsed.error.flatten());
  }

  const email = parsed.data.email.trim().toLowerCase();
  const userId = await resolveOwnerUserIdByEmail(email);
  const genericResponse = {
    success: true,
    message: "If an account exists for this email, a reset link has been sent.",
  };

  if (!userId) {
    return genericResponse;
  }

  const rawToken = generatePasswordResetToken();
  const tokenHash = hashPasswordResetToken(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + RESET_TOKEN_TTL_SECONDS * 1000);
  const resetUrl = buildResetUrl(rawToken, request);

  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));

    await tx.insert(passwordResetTokens).values({
      id: randomUUID(),
      userId,
      tokenHash,
      expiresAt,
      createdAt: now,
    });

    await tx.insert(auditEvents).values({
      organizationId: await resolveOwnerOrganizationId(userId, tx),
      actorUserId: userId,
      action: "owner_password_reset_requested",
      metadata: {
        email,
        expiresAt: expiresAt.toISOString(),
      },
    });
  });

  await sendTransactionalEmail({
    to: email,
    subject: "إعادة تعيين كلمة مرور تقفيلة",
    html: buildResetEmailHtml(resetUrl),
    text: [
      "مرحبًا،",
      "",
      "تلقّينا طلبًا لإعادة تعيين كلمة مرور حسابك في تطبيق تقفيلة.",
      "",
      `افتح الرابط التالي خلال ساعة واحدة:\n${resetUrl}`,
      "",
      "إذا لم تطلب ذلك، تجاهل هذه الرسالة.",
      "",
      "تطبيق تقفيلة",
    ].join("\n"),
  });

  return genericResponse;
}

async function resolveOwnerOrganizationId(
  userId: string,
  executor: Pick<ReturnType<typeof getDb>, "select">,
): Promise<string> {
  const [member] = await executor
    .select({ organizationId: organizationMembers.organizationId })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.role, "owner"),
        eq(organizationMembers.status, "active"),
      ),
    )
    .limit(1);

  if (!member?.organizationId) {
    throw new ValidationError("Owner organization could not be resolved.");
  }

  return member.organizationId;
}
