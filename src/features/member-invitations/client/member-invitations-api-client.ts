import { fetchApiJsonWithRuntimeContext } from "@/core/client/api-fetch";
import type {
  ActivateMemberInvitationViaApiInput,
  CreateMemberInvitationViaApiInput,
  MemberInvitationsAuth,
  RevokeMemberInvitationViaApiInput,
} from "@/features/member-invitations/client/member-invitations-client-types";

export async function createMemberInvitationViaApi({
  organizationId,
  actorUserId,
  actorRole,
  displayName,
  role,
  storeId,
  phoneNumber,
  pin,
}: CreateMemberInvitationViaApiInput) {
  return fetchApiJsonWithRuntimeContext("/api/v1/member-invitations", {
    organizationId,
    actorUserId,
    actorRole,
    method: "POST",
    body: {
      displayName,
      role,
      storeId,
      phoneNumber,
      pin,
    },
    errorMessage: "Failed to create member invitation.",
  });
}

export async function fetchMemberInvitationsViaApi({
  organizationId,
  actorUserId,
  actorRole,
}: MemberInvitationsAuth) {
  return fetchApiJsonWithRuntimeContext("/api/v1/member-invitations", {
    organizationId,
    actorUserId,
    actorRole,
    errorMessage: "Failed to load member invitations.",
  });
}

export async function revokeMemberInvitationViaApi({
  organizationId,
  actorUserId,
  actorRole,
  invitationId,
}: RevokeMemberInvitationViaApiInput) {
  return fetchApiJsonWithRuntimeContext(`/api/v1/member-invitations/${invitationId}`, {
    organizationId,
    actorUserId,
    actorRole,
    method: "DELETE",
    errorMessage: "Failed to revoke member invitation.",
  });
}

export async function fetchPublicInvitationViaApi(token: string) {
  const response = await fetch(`/api/v1/member-invitations/public/${encodeURIComponent(token)}`, {
    credentials: "include",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Failed to load invitation.");
  }
  return payload?.data ?? payload;
}

export async function activateMemberInvitationViaApi({
  token,
  phone,
  pin,
  trustDevice = true,
}: ActivateMemberInvitationViaApiInput) {
  const response = await fetch(`/api/v1/member-invitations/public/${encodeURIComponent(token)}/activate`, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ phone, pin, trustDevice }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Failed to activate invitation.");
  }
  return payload?.data ?? payload;
}
