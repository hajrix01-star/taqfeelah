import { resolveAppPublicOrigin } from "@/core/auth/app-origin";
import type { PasswordResetAudience } from "@/features/auth/server/password-reset-audience";

export function buildPasswordResetUrl(
  token: string,
  audience: PasswordResetAudience,
  request?: Request,
): string {
  const origin = resolveAppPublicOrigin(request);
  const path = audience === "platform_admin" ? "/saas-admin/reset-password" : "/auth/reset-password";
  return `${origin}${path}?token=${encodeURIComponent(token)}`;
}

export function buildPasswordResetEmailContent(resetUrl: string, audience: PasswordResetAudience) {
  const productLabel = audience === "platform_admin"
    ? "لوحة إدارة منصة تقفيلة"
    : "تطبيق تقفيلة";

  const html = [
    "<div dir=\"rtl\" style=\"font-family:sans-serif;line-height:1.7\">",
    "<p>مرحبًا،</p>",
    `<p>تلقّينا طلبًا لإعادة تعيين كلمة مرور حسابك في ${productLabel}.</p>`,
    "<p>اضغط الزر أدناه لإنشاء كلمة مرور جديدة. الرابط صالح لمدة ساعة واحدة.</p>",
    `<p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#112A46;color:#fff;text-decoration:none;border-radius:8px">إعادة تعيين كلمة المرور</a></p>`,
    `<p style="word-break:break-all">${resetUrl}</p>`,
    "<p>إذا لم تطلب ذلك، تجاهل هذه الرسالة.</p>",
    `<p>${productLabel}</p>`,
    "</div>",
  ].join("");

  const text = [
    "مرحبًا،",
    "",
    `تلقّينا طلبًا لإعادة تعيين كلمة مرور حسابك في ${productLabel}.`,
    "",
    `افتح الرابط التالي خلال ساعة واحدة:\n${resetUrl}`,
    "",
    "إذا لم تطلب ذلك، تجاهل هذه الرسالة.",
    "",
    productLabel,
  ].join("\n");

  const subject = audience === "platform_admin"
    ? "إعادة تعيين كلمة مرور لوحة إدارة تقفيلة"
    : "إعادة تعيين كلمة مرور تقفيلة";

  return { html, text, subject };
}
