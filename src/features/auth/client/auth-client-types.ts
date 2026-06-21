import type { Dispatch, SetStateAction } from "react";
import type { DisplayLang } from "@/core/i18n/display-locale";

export type AuthLang = DisplayLang;

export type AuthStaffMember = {
  id?: string;
  apiUserId?: string;
  legacyId?: string;
  nameAr?: string;
  nameEn?: string;
  active?: boolean;
  removed?: boolean;
  storeIds?: string[];
  pin?: string;
};

export type AuthActiveBusiness = {
  id?: string;
  dbStoreId?: string;
  legacyId?: string;
  nameAr?: string;
  nameEn?: string;
  displayName?: string;
};

export type AuthServerSession = {
  authenticated?: boolean;
  role?: string;
  userId?: string;
  organizationId?: string;
  displayName?: string;
  mustChangePassword?: boolean;
};

export type AuthRuntimeApply = {
  setSessionUserId?: (value: string) => void;
  setSessionOrganizationId?: (value: string) => void;
  setLoggedIn?: (value: boolean) => void;
  setEmployee?: (value: boolean) => void;
  setLoggedInEmployeeId?: (value: string | null) => void;
  setAuthScreen?: (value: string) => void;
  setOwnerPage?: (value: string) => void;
  setEmployeePage?: (value: string) => void;
  setEmployeeBusinessId?: (value: string) => void;
  setEmployeeThemeOverride?: (value: unknown) => void;
  setOperationalEntries?: (value: unknown[]) => void;
  setStaff?: Dispatch<SetStateAction<AuthStaffMember[]>>;
  setConfiguredBusinesses?: (value: unknown[]) => void;
  setArchivedBusinessIds?: (value: string[]) => void;
  setAuthOwnerUsername?: (value: string) => void;
  setAuthOwnerPassword?: (value: string) => void;
  setAuthEmployeePins?: (value: Record<string, string>) => void;
  setOwnerProfile?: (value: { name: string }) => void;
  setMustChangePassword?: (value: boolean) => void;
  setSessionDisplayName?: (value: string) => void;
  setOwnerManageCloseout?: (value: unknown) => void;
  setSelected?: (value: unknown) => void;
  setVoidTarget?: (value: unknown) => void;
  setRestoreTarget?: (value: unknown) => void;
  setSavedOutflowShareTarget?: (value: unknown) => void;
  setPendingDuplicateSummary?: (value: unknown) => void;
  setDuplicateSummaryFocus?: (value: unknown) => void;
  setAttachmentReviewRequest?: (value: unknown) => void;
  setShareSnapshot?: (value: unknown) => void;
  setQuickAddOpen?: (value: boolean) => void;
  setArchivedReadOnlyBusinessId?: (value: string | null) => void;
  setSelectedBusiness?: (value: string) => void;
};

export type AuthLangProps = {
  lang: AuthLang;
  setLang: (value: AuthLang) => void;
};

export type OwnerLoginCallback = (
  apiUserId?: string,
  organizationId?: string,
  displayName?: string,
  mustChangePassword?: boolean,
) => void;

export type EmployeeLoginCallback = (
  personId: string,
  apiUserId?: string,
  rosterPerson?: AuthStaffMember | null,
  organizationId?: string,
) => void;

export type OwnerSessionBridgeInput = {
  username?: string;
  password?: string;
  phone?: string;
  useServerAuth?: boolean;
};

export type EmployeeSessionBridgeInput = {
  employeeId?: string;
  phone?: string;
  pin?: string;
  trustDevice?: boolean;
  useServerAuth?: boolean;
};

export type ChangeOwnerPasswordBridgeInput = {
  currentPassword: string;
  newPassword: string;
  useServerAuth?: boolean;
};

export type LogoutSessionBridgeInput = {
  useServerAuth?: boolean;
};
