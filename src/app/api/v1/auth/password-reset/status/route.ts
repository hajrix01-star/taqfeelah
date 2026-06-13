import { ok } from "@/core/http/api-response";
import { isPasswordResetEnabled } from "@/core/config/password-reset-mode";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok({
    enabled: isPasswordResetEnabled(),
  });
}
