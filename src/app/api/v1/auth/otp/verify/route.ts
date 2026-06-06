import { fail, ok } from "@/core/http/api-response";
import { verifyAuthOtp } from "@/features/auth/server/verify-auth-otp";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await verifyAuthOtp({
      channel: body?.channel === "email" ? "email" : "whatsapp",
      destination: typeof body?.destination === "string" ? body.destination : "",
      code: typeof body?.code === "string" ? body.code : "",
      purpose: "owner_login",
    });
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
