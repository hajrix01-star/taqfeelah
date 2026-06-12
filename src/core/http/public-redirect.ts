import { headers } from "next/headers";
import { buildPublicUrl } from "@/core/http/resolve-request-public-origin";

export async function resolvePublicRedirectUrl(pathname: string): Promise<string> {
  const requestHeaders = await headers();
  return buildPublicUrl(pathname, requestHeaders);
}
