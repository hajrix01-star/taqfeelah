import { apiClient } from "@/core/client/api-client";
import { fetchApiJsonWithRuntimeContext } from "@/core/client/api-fetch";
import type {
  ActivateMemberInvitationViaApiInput,
  CreateMemberInvitationViaApiInput,
  MemberInvitationsAuth,
  RevokeMemberInvitationViaApiInput,
} from "@/features/member-invitations/client/member-invitations-client-types";

type ApiDataPayload<T = unknown> = T | { data?: T };

function unwrapApiData<T>(payload: ApiDataPayload<T>): T {
  return (
    payload
    && typeof payload === "object"
    && "data" in payload
    ? payload.data
    : payload
  ) as T;
}

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
  const payload = await apiClient.get<ApiDataPayload>(
    `/api/v1/member-invitations/public/${encodeURIComponent(token)}`,
    { errorMessage: "Failed to load invitation." },
  );
  return unwrapApiData(payload);
}

export async function activateMemberInvitationViaApi({
  token,
  phone,
  pin,
  trustDevice = true,
}: ActivateMemberInvitationViaApiInput) {
  const payload = await apiClient.post<ApiDataPayload>(
    `/api/v1/member-invitations/public/${encodeURIComponent(token)}/activate`,
    { phone, pin, trustDevice },
    { errorMessage: "Failed to activate invitation." },
  );
  return unwrapApiData(payload);
}
