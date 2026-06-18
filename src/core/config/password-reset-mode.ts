import { isEmailDeliveryConfigured } from "@/core/config/email-delivery";

type PasswordResetEnv = {
  AUTH_PASSWORD_RESET_ENABLED?: string;
  AUTH_EMAIL_FROM?: string;
  RESEND_API_KEY?: string;
  SMTP_HOST?: string;
};

export function isPasswordResetEnabled(
  env: PasswordResetEnv = process.env as PasswordResetEnv,
): boolean {
  return env.AUTH_PASSWORD_RESET_ENABLED === "true";
}

/** True when reset is enabled and an email provider is configured for production delivery. */
export function isPasswordResetAvailable(
  env: PasswordResetEnv = process.env as PasswordResetEnv,
): boolean {
  return isPasswordResetEnabled(env) && isEmailDeliveryConfigured(env);
}
