import { z } from "zod";
import { ValidationError } from "@/core/errors/app-error";
import { MEMBER_ROLES, type MemberRole } from "@/core/auth/roles";
import {
  allowHeaderAuthContext,
  assertProductionRuntimeEnv,
  isServerProductionMode,
  readEnv,
} from "@/core/config/env";
import { resolveAuthSessionFromRequest } from "@/core/auth/session-cookie";

const roleSchema = z.enum(MEMBER_ROLES);

type ResolveRequestContextOptions = {
  requireUser?: boolean;
};

export type RequestContext = {
  organizationId: string;
  userId: string | null;
  role: MemberRole | null;
};

function parseUuid(value: string | null, fieldName: string): string | null {
  if (!value) return null;
  const parsed = z.string().uuid().safeParse(value);
  if (!parsed.success) {
    throw new ValidationError(`Header '${fieldName}' must be a valid UUID.`);
  }
  return parsed.data;
}

function parseRole(value: string | null): MemberRole | null {
  if (!value) return null;
  const parsed = roleSchema.safeParse(value);
  if (!parsed.success) {
    throw new ValidationError("Header 'x-member-role' must be one of: owner, manager, employee.");
  }
  return parsed.data;
}

export function resolveRequestContext(
  request: Request,
  options: ResolveRequestContextOptions = {},
): RequestContext {
  const requireUser = options.requireUser === true;
  const env = readEnv();
  if (isServerProductionMode(env)) {
    assertProductionRuntimeEnv(env);
  }
  const session = resolveAuthSessionFromRequest(
    request,
    env.AUTH_SESSION_COOKIE_NAME,
    env.AUTH_SESSION_SECRET,
  );

  if (session) {
    return {
      organizationId: session.organizationId,
      userId: session.userId,
      role: session.role,
    };
  }

  if (!allowHeaderAuthContext(env)) {
    throw new ValidationError("Session cookie is required for this environment.");
  }

  const organizationId = parseUuid(request.headers.get("x-organization-id"), "x-organization-id");
  if (!organizationId) {
    throw new ValidationError("Header 'x-organization-id' is required.");
  }

  const userId = parseUuid(request.headers.get("x-user-id"), "x-user-id");
  const role = parseRole(request.headers.get("x-member-role"));

  if (requireUser && !userId) {
    throw new ValidationError("Header 'x-user-id' is required.");
  }

  if (requireUser && !role) {
    throw new ValidationError("Header 'x-member-role' is required.");
  }

  return {
    organizationId,
    userId,
    role,
  };
}
