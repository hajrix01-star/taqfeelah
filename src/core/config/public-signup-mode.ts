import { isEmailDeliveryConfigured } from "@/core/config/email-delivery";

type PublicSignupEnv = {
  AUTH_PUBLIC_SIGNUP_ENABLED?: string;
  NEXT_PUBLIC_PUBLIC_SIGNUP_ENABLED?: string;
  AUTH_EMAIL_FROM?: string;
  RESEND_API_KEY?: string;
  SMTP_HOST?: string;
};

export function isPublicSignupEnabled(
  env: PublicSignupEnv = process.env as PublicSignupEnv,
): boolean {
  return env.AUTH_PUBLIC_SIGNUP_ENABLED === "true";
}

export function isPublicSignupAvailable(
  env: PublicSignupEnv = process.env as PublicSignupEnv,
): boolean {
  return isPublicSignupEnabled(env) && isEmailDeliveryConfigured(env);
}

export function isPublicSignupClientEnabled(
  env: PublicSignupEnv = process.env as PublicSignupEnv,
): boolean {
  return env.NEXT_PUBLIC_PUBLIC_SIGNUP_ENABLED === "true";
}
