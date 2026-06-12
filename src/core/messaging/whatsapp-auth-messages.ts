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

type OwnerSetupMessageInput = {
  ownerName: string;
  setupUrl: string;
  organizationName: string;
  storeName: string;
  ownerPhone: string;
};

export function buildOwnerSetupWhatsAppMessage(input: OwnerSetupMessageInput): string {
  return [
    `مرحبًا ${input.ownerName}،`,
    "",
    "تم إنشاء حسابك في تطبيق تقفيلة لإدارة التقفيلات اليومية.",
    "",
    "لتفعيل حسابك وإنشاء كلمة المرور، افتح الرابط التالي:",
    input.setupUrl,
    "",
    `جوال الدخول:\n${input.ownerPhone}`,
    "",
    `اسم النشاط:\n${input.organizationName}`,
    `اسم أول محل:\n${input.storeName}`,
    "",
    "مهم:",
    "الرابط لمرة واحدة وله صلاحية محدودة. لا تشاركه مع أحد.",
    "",
    "تطبيق تقفيلة",
  ].join("\n");
}

type EmployeeInviteMessageInput = {
  employeeName: string;
  organizationName: string;
  storeName: string;
  inviteUrl: string;
  pin: string;
};

export function buildEmployeeInviteWhatsAppMessage(input: EmployeeInviteMessageInput): string {
  return [
    `مرحبًا ${input.employeeName}،`,
    "",
    "تمت دعوتك لاستخدام تطبيق تقفيلة لإدخال التقفيلة اليومية.",
    "",
    `النشاط:\n${input.organizationName}`,
    `المحل:\n${input.storeName}`,
    "",
    `رابط الدعوة:\n${input.inviteUrl}`,
    `رمز PIN (مرة واحدة لتسجيل الجهاز):\n${input.pin}`,
    "",
    "بعد فتح الرابط:",
    "1) أدخل جوالك",
    "2) أدخل رمز PIN أعلاه",
    "3) سيتم حفظ جهازك — بعدها الدخول بالجوال فقط",
    "",
    "ملاحظة:",
    "لا تشارك هذا الرابط أو PIN مع أي شخص.",
    "",
    "تطبيق تقفيلة",
  ].join("\n");
}

export function buildEmployeeInviteUrl(token: string, request?: Request): string {
  return buildInviteUrl(token, request);
}
