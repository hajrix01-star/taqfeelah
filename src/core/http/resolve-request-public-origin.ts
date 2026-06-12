const INTERNAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function normalizeProtocol(value: string | null | undefined): string {
  const protocol = (value || "https").split(",")[0]?.trim().toLowerCase();
  if (protocol === "http" || protocol === "https") return protocol;
  return "https";
}

function normalizeHost(value: string | null | undefined): string {
  return (value || "").split(",")[0]?.trim() || "";
}

export function isInternalHostname(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();
  if (!normalized) return true;
  if (INTERNAL_HOSTNAMES.has(normalized)) return true;
  if (normalized.endsWith(".local")) return true;
  return false;
}

export function isInternalHost(host: string): boolean {
  const hostname = host.split(":")[0]?.trim() || "";
  return isInternalHostname(hostname);
}

function readConfiguredPublicOrigin(): string {
  const raw = process.env.APP_PUBLIC_ORIGIN?.trim() || process.env.NEXT_PUBLIC_APP_ORIGIN?.trim();
  if (!raw) return "";
  try {
    return new URL(raw).origin;
  } catch {
    return "";
  }
}

export function resolvePublicOriginFromHeaders(
  requestHeaders: Headers,
  fallbackOrigin = "",
): string {
  const configured = readConfiguredPublicOrigin();
  const forwardedHost = normalizeHost(requestHeaders.get("x-forwarded-host"));
  const hostHeader = normalizeHost(requestHeaders.get("host"));
  const host = forwardedHost || hostHeader;
  const protocol = normalizeProtocol(requestHeaders.get("x-forwarded-proto"));

  if (host && !isInternalHost(host)) {
    return `${protocol}://${host}`;
  }

  if (configured) return configured;
  if (fallbackOrigin && !isInternalHost(new URL(fallbackOrigin).host)) {
    return fallbackOrigin;
  }

  return configured || fallbackOrigin;
}

export function resolvePublicOriginFromRequest(
  request: { headers: Headers; nextUrl: URL },
): string {
  return resolvePublicOriginFromHeaders(request.headers, request.nextUrl.origin);
}

export function buildPublicUrl(
  pathname: string,
  requestHeaders: Headers,
  fallbackOrigin = "",
): string {
  const origin = resolvePublicOriginFromHeaders(requestHeaders, fallbackOrigin);
  return new URL(pathname, origin).toString();
}
