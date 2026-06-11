import { isAuthOtpEnabled } from "@/core/config/auth-otp-mode";
import { fail, ok } from "@/core/http/api-response";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import { requestAuthOtp } from "@/features/auth/server/request-auth-otp";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!isAuthOtpEnabled()) {
      throw new ServiceUnavailableError("OTP login is disabled.");
    }

    const body = await request.json();
    const result = await requestAuthOtp({
      channel: body?.channel === "email" ? "email" : "whatsapp",
      destination: typeof body?.destination === "string" ? body.destination : "",
      purpose: "owner_login",
    });
    return ok(result, { status: 202 });
  } catch (error) {
    return fail(error);
  }
}
