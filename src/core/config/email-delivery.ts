type EmailDeliveryEnv = {
  AUTH_EMAIL_FROM?: string;
  RESEND_API_KEY?: string;
  SMTP_HOST?: string;
};

export function isEmailDeliveryConfigured(
  env: EmailDeliveryEnv = process.env as EmailDeliveryEnv,
): boolean {
  const from = env.AUTH_EMAIL_FROM?.trim();
  if (!from) return false;

  if (env.RESEND_API_KEY?.trim()) return true;
  if (env.SMTP_HOST?.trim()) return true;

  return false;
}
