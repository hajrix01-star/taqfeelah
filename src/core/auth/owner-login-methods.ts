export type OwnerLoginMethod = "username_password" | "whatsapp_otp" | "email_otp";

type OwnerLoginConfig = Record<OwnerLoginMethod, boolean>;

const ownerLoginConfig: OwnerLoginConfig = {
  username_password: true,
  whatsapp_otp:
    process.env.NEXT_PUBLIC_APP_MODE !== "production"
    && process.env.NEXT_PUBLIC_AUTH_OWNER_WHATSAPP_OTP === "true",
  email_otp:
    process.env.NEXT_PUBLIC_APP_MODE !== "production"
    && process.env.NEXT_PUBLIC_AUTH_OWNER_EMAIL_OTP === "true",
};

export function isOwnerLoginMethodEnabled(method: OwnerLoginMethod): boolean {
  return ownerLoginConfig[method];
}

export function getEnabledOwnerLoginMethods(): OwnerLoginMethod[] {
  return (Object.keys(ownerLoginConfig) as OwnerLoginMethod[]).filter((method) => ownerLoginConfig[method]);
}
