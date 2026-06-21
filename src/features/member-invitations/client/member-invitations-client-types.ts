import type { DisplayLang } from "@/core/i18n/display-locale";
import type { RuntimeSettingsAuth } from "@/features/runtime-settings/client/runtime-settings-client-types";

export type MemberInvitationsAuth = RuntimeSettingsAuth;

export type TeamInvitation = {
  invitationId?: string;
  status?: string;
  displayName?: string;
  acceptedUserId?: string;
  createdAt?: string;
  organizationName?: string;
  storeName?: string;
  inviteUrl?: string;
  pin?: string;
  phoneNumber?: string;
  invitationDisplayName?: string;
  expiresAt?: string;
};

export type StaffInviteActivationLabels = {
  activatedViaInvite: string;
  inviteAlias: string;
};

export type UseOwnerTeamInvitesProps = {
  organizationId: string;
  actorUserId: string;
  actorRole: string;
  activeStoredBusinesses: Array<{ id?: string }>;
};

export type OwnerTeamInvitesLabels = Record<string, string>;

export type CreateMemberInvitationViaApiInput = MemberInvitationsAuth & {
  displayName: string;
  role: string;
  storeId: string;
  phoneNumber: string;
  pin: string;
};

export type RevokeMemberInvitationViaApiInput = MemberInvitationsAuth & {
  invitationId: string;
};

export type ActivateMemberInvitationViaApiInput = {
  token: string;
  phone: string;
  pin: string;
  trustDevice?: boolean;
};

export type FormatInviteStatusLang = DisplayLang;
