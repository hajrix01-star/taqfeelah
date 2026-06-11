import { isAuthOtpEnabled } from "@/core/config/auth-otp-mode";

export type OwnerLoginMethod = "username_password" | "whatsapp_otp" | "email_otp";

type OwnerLoginConfig = Record<OwnerLoginMethod, boolean>;

const isProductionBuild = process.env.NEXT_PUBLIC_APP_MODE === "production" || process.env.NODE_ENV === "production";

function isWhatsappOtpLoginEnabled(): boolean {
  return (
    isAuthOtpEnabled()
    && !isProductionBuild
    && process.env.NEXT_PUBLIC_AUTH_OWNER_WHATSAPP_OTP === "true"
  );
}

function isEmailOtpLoginEnabled(): boolean {
  return (
    isAuthOtpEnabled()
    && !isProductionBuild
    && process.env.NEXT_PUBLIC_AUTH_OWNER_EMAIL_OTP === "true"
  );
}

const ownerLoginConfig: OwnerLoginConfig = {
  username_password: true,
  whatsapp_otp: isWhatsappOtpLoginEnabled(),
  email_otp: isEmailOtpLoginEnabled(),
};

export function isOwnerLoginMethodEnabled(method: OwnerLoginMethod): boolean {
  return ownerLoginConfig[method];
}

export function getEnabledOwnerLoginMethods(): OwnerLoginMethod[] {
  return (Object.keys(ownerLoginConfig) as OwnerLoginMethod[]).filter((method) => ownerLoginConfig[method]);
}
