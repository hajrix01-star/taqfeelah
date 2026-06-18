import { ok } from "@/core/http/api-response";
import { isPasswordResetAvailable } from "@/core/config/password-reset-mode";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok({
    enabled: isPasswordResetAvailable(),
  });
}
