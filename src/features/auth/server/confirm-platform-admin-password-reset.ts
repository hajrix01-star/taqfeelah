import { confirmPasswordReset } from "@/features/auth/server/confirm-password-reset";

export async function confirmPlatformAdminPasswordReset(rawInput: {
  token: string;
  newPassword: string;
  confirmPassword: string;
}) {
  return confirmPasswordReset({
    ...rawInput,
    audience: "platform_admin",
  });
}
