import { resolveAppPublicOrigin } from "@/core/auth/app-origin";

export function buildSignupVerificationEmailContent(verifyUrl: string) {
  const html = [
    "<div dir=\"rtl\" style=\"font-family:sans-serif;line-height:1.7\">",
    "<p>مرحبًا،</p>",
    "<p>شكرًا لتسجيلك في <strong>تقفيلة</strong>.</p>",
    "<p>اضغط الزر أدناه لتأكيد بريدك الإلكتروني وإكمال إعداد حسابك. الرابط صالح لمدة 24 ساعة.</p>",
    `<p><a href="${verifyUrl}" style="display:inline-block;padding:12px 18px;background:#112A46;color:#fff;text-decoration:none;border-radius:8px">تأكيد البريد وإكمال التسجيل</a></p>`,
    `<p style="word-break:break-all">${verifyUrl}</p>`,
    "<p>إذا لم تطلب إنشاء حساب، تجاهل هذه الرسالة.</p>",
    "<p>تقفيلة</p>",
    "</div>",
  ].join("");

  const text = [
    "مرحبًا،",
    "",
    "شكرًا لتسجيلك في تقفيلة.",
    "",
    "افتح الرابط التالي خلال 24 ساعة لتأكيد بريدك وإكمال إعداد حسابك:",
    verifyUrl,
    "",
    "إذا لم تطلب إنشاء حساب، تجاهل هذه الرسالة.",
    "",
    "تقفيلة",
  ].join("\n");

  return {
    subject: "تأكيد تسجيلك في تقفيلة",
    html,
    text,
  };
}

export function buildSignupWelcomeSetupEmailContent(setupUrl: string, organizationName: string) {
  const html = [
    "<div dir=\"rtl\" style=\"font-family:sans-serif;line-height:1.7\">",
    "<p>مرحبًا،</p>",
    `<p>تم تأكيد بريدك وإنشاء حساب <strong>${organizationName}</strong> في تقفيلة.</p>`,
    "<p>الخطوة الأخيرة: اختر كلمة مرور للدخول إلى التطبيق.</p>",
    `<p><a href="${setupUrl}" style="display:inline-block;padding:12px 18px;background:#39A160;color:#fff;text-decoration:none;border-radius:8px">اختيار كلمة المرور</a></p>`,
    `<p style="word-break:break-all">${setupUrl}</p>`,
    "<p>بعد ذلك يمكنك الدخول من taqfeelah.com/app باستخدام جوالك وكلمة المرور.</p>",
    "<p>تقفيلة</p>",
    "</div>",
  ].join("");

  const text = [
    "مرحبًا،",
    "",
    `تم تأكيد بريدك وإنشاء حساب ${organizationName} في تقفيلة.`,
    "",
    "اختر كلمة المرور من الرابط التالي:",
    setupUrl,
    "",
    "بعد ذلك يمكنك الدخول من taqfeelah.com/app باستخدام جوالك وكلمة المرور.",
    "",
    "تقفيلة",
  ].join("\n");

  return {
    subject: "أكمل إعداد حسابك في تقفيلة",
    html,
    text,
  };
}

export function resolveSignupPublicOrigin(request?: Request): string {
  return resolveAppPublicOrigin(request);
}
