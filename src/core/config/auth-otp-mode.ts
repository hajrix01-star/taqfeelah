type AuthOtpEnv = {
  AUTH_OTP_ENABLED?: string;
};

/**
 * OTP / SMS / WhatsApp login channels are OFF by default.
 * Enable only after a provider is configured and product approves launch.
 */
export function isAuthOtpEnabled(env: AuthOtpEnv = process.env as AuthOtpEnv): boolean {
  return env.AUTH_OTP_ENABLED === "true";
}
