import { ok } from "@/core/http/api-response";
import { isPublicSignupAvailable } from "@/core/config/public-signup-mode";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok({
    enabled: isPublicSignupAvailable(),
  });
}
