import { buildInviteUrl, buildOwnerLoginUrl } from "@/core/auth/app-origin";

type OwnerCredentialsMessageInput = {
  ownerName: string;
  ownerLogin: string;
  tempPassword: string;
  organizationName: string;
  storeName: string;
  request?: Request;
};

export function buildOwnerCredentialsWhatsAppMessage(input: OwnerCredentialsMessageInput): string {
  const loginUrl = buildOwnerLoginUrl(input.request);
  return [
    `مرحبًا ${input.ownerName}،`,
    "",
    "تم إنشاء حسابك في تطبيق تقفيلة لإدارة التقفيلات اليومية.",
    "",
    "بيانات الدخول المؤقتة:",
    `رابط الدخول:\n${loginUrl}`,
    `اسم المستخدم / الإيميل:\n${input.ownerLogin}`,
    `كلمة المرور المؤقتة:\n${input.tempPassword}`,
    "",
    "مهم:",
    "عند أول دخول سيطلب منك النظام تغيير كلمة المرور المؤقتة.",
    "",
    `اسم النشاط:\n${input.organizationName}`,
    `اسم أول محل:\n${input.storeName}`,
    "",
    "تطبيق تقفيلة",
  ].join("\n");
}

type EmployeeInviteMessageInput = {
  employeeName: string;
  organizationName: string;
  storeName: string;
  inviteUrl: string;
  activationCode?: string;
};

export function buildEmployeeInviteWhatsAppMessage(
  input: EmployeeInviteMessageInput,
  includeActivationCode = false,
): string {
  if (includeActivationCode && input.activationCode) {
    return [
      `مرحبًا ${input.employeeName}،`,
      "",
      "تمت دعوتك لاستخدام تطبيق تقفيلة لإدخال التقفيلة اليومية.",
      "",
      `النشاط:\n${input.organizationName}`,
      `المحل:\n${input.storeName}`,
      "",
      `رابط الدعوة:\n${input.inviteUrl}`,
      `رمز التفعيل:\n${input.activationCode}`,
      "",
      "بعد فتح الرابط، أدخل رمز التفعيل ثم أنشئ PIN خاص بك للدخول لاحقًا.",
      "",
      "ملاحظة:",
      "لا تشارك هذا الرابط أو الرمز مع أي شخص.",
      "",
      "تطبيق تقفيلة",
    ].join("\n");
  }

  return [
    `مرحبًا ${input.employeeName}،`,
    "",
    "تمت دعوتك لاستخدام تطبيق تقفيلة لإدخال التقفيلة اليومية.",
    "",
    `النشاط:\n${input.organizationName}`,
    `المحل:\n${input.storeName}`,
    "",
    `افتح رابط الدعوة:\n${input.inviteUrl}`,
    "",
    "بعد فتح الرابط، سيطلب منك النظام رمز التفعيل.",
    "اطلب رمز التفعيل من المالك أو المسؤول.",
    "",
    "بعد التفعيل ستقوم بإنشاء PIN خاص بك للدخول لاحقًا.",
    "",
    "تطبيق تقفيلة",
  ].join("\n");
}

export function buildEmployeeInviteUrl(token: string, request?: Request): string {
  return buildInviteUrl(token, request);
}
