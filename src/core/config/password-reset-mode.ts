type PasswordResetEnv = {
  AUTH_PASSWORD_RESET_ENABLED?: string;
};

export function isPasswordResetEnabled(
  env: PasswordResetEnv = process.env as PasswordResetEnv,
): boolean {
  return env.AUTH_PASSWORD_RESET_ENABLED === "true";
}
