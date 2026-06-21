import type { ReactNode } from "react";
import type { BrowserPersistenceScope } from "@/core/config/browser-persistence-policy";
import type { AuthStaffMember } from "@/features/auth/client/auth-client-types";

export type LocalStoragePolicyOptions = {
  scope?: BrowserPersistenceScope;
  env?: Record<string, string | undefined>;
};

export type LocalStorageWriteResult = {
  ok: boolean;
  error?: string;
};

export type AuthSessionOwner = {
  role: "owner";
};

export type AuthSessionEmployee = {
  role: "employee";
  employeeId: string;
};

export type AuthSession = AuthSessionOwner | AuthSessionEmployee;

export type AuthBootState = {
  loggedIn: boolean;
  employee: boolean;
  loggedInEmployeeId: string | null;
  employeeBusinessId: string;
};

export type PrototypeAuthBootOptions = {
  bindsToServerAuth?: boolean;
  readSavedSettings?: () => Record<string, unknown> | null;
  defaultStaff?: AuthStaffMember[];
  resolveAuthState?: (staffList: AuthStaffMember[]) => AuthBootState;
};

export type PrototypeClientGateProps = {
  children: ReactNode;
};

export type DemoActor = {
  role: string;
  userId: string;
  nameAr: string;
  nameEn: string;
};

export type DemoStore = {
  id: string;
  nameAr: string;
  nameEn: string;
  employeeId: string;
};

export type DemoChannel = {
  id: string;
  nameAr: string;
  nameEn: string;
};

export type DemoAttachment = {
  id: string;
  kind: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
};

export type DemoMaterializeEntryInput = {
  id: string;
  payload: Record<string, unknown>;
  actor: DemoActor;
  hour?: number;
  reviewed?: boolean;
  attachment?: DemoAttachment | null;
  status?: string;
  extra?: Record<string, unknown>;
};

export type PrototypeMonthDemoDataset = {
  closeouts: Record<string, unknown>[];
  closeoutEvents: Record<string, unknown>[];
  operationalEntries: Record<string, unknown>[];
  lastCloseoutDates: Record<string, string>;
};

export type MigratePrototypeDemoResult = {
  error?: string;
};
