import { cookies } from "next/headers";
import { resolveAuthSessionFromRequest, type AuthSessionClaims } from "@/core/auth/session-cookie";
import { readEnv } from "@/core/config/env";

export async function resolveServerAuthSession(): Promise<AuthSessionClaims | null> {
  const env = readEnv();
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((entry) => `${entry.name}=${entry.value}`)
    .join("; ");

  const request = new Request("https://taqfeelah.local/", {
    headers: { cookie: cookieHeader },
  });

  return resolveAuthSessionFromRequest(
    request,
    env.AUTH_SESSION_COOKIE_NAME,
    env.AUTH_SESSION_SECRET,
  );
}
