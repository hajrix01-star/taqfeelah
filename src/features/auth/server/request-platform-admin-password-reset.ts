import { requestPasswordReset } from "@/features/auth/server/request-password-reset";

export async function requestPlatformAdminPasswordReset(
  rawInput: { email: string },
  request?: Request,
) {
  return requestPasswordReset(
    {
      email: rawInput.email,
      audience: "platform_admin",
    },
    request,
  );
}
