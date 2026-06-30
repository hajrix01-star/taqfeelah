import { isAuthOtpEnabled } from "@/core/config/auth-otp-mode";
import { readJsonBody, withPublicApiRouteNoParams } from "@/core/http/api-route-handler";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import { verifyAuthOtp } from "@/features/auth/server/verify-auth-otp";

export const dynamic = "force-dynamic";

type Body = Record<string, unknown>;

export const POST = withPublicApiRouteNoParams(async ({ request }) => {
  if (!isAuthOtpEnabled()) {
    throw new ServiceUnavailableError("OTP login is disabled.");
  }

  const body = await readJsonBody<Body>(request);
  return verifyAuthOtp({
    channel: body?.channel === "email" ? "email" : "whatsapp",
    destination: typeof body?.destination === "string" ? body.destination : "",
    code: typeof body?.code === "string" ? body.code : "",
    purpose: "owner_login",
  });
});
