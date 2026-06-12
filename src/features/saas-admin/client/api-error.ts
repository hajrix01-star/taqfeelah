import type { SaasAdminTranslations } from "@/features/saas-admin/i18n/translations";

export type ApiErrorPayload = {
  error?: {
    type?: string;
    code?: string;
    title?: string;
    message?: string;
    cause?: string;
    details?: {
      fieldErrors?: Record<string, string[]>;
      formErrors?: string[];
    };
  };
};

export class SaasAdminApiError extends Error {
  readonly code: string;
  readonly causeText?: string;
  readonly title?: string;
  readonly type?: string;
  readonly details?: NonNullable<ApiErrorPayload["error"]>["details"];

  constructor(payload: NonNullable<ApiErrorPayload["error"]>, status: number) {
    super(payload.message?.trim() || `SaaS admin API failed (${status})`);
    this.name = "SaasAdminApiError";
    this.code = payload.code || "INTERNAL_ERROR";
    this.causeText = payload.cause;
    this.title = payload.title;
    this.type = payload.type;
    this.details = payload.details;
  }
}

const ERROR_CODE_MAP: Partial<Record<string, keyof SaasAdminTranslations["apiErrors"]>> = {
  OWNER_USERNAME_TAKEN: "ownerUsernameTaken",
  OWNER_PHONE_TAKEN: "ownerPhoneTaken",
  EMPLOYEE_PHONE_TAKEN: "employeePhoneTaken",
  ORGANIZATION_NOT_FOUND: "organizationNotFound",
  MEMBER_NOT_FOUND: "memberNotFound",
  SUBSCRIPTION_NOT_FOUND: "subscriptionNotFound",
  INVALID_STORE_IDS: "invalidStoreIds",
  PROVISION_DEPENDENCY_MISSING: "provisionDependencyMissing",
  DATABASE_CONSTRAINT_VIOLATION: "databaseConstraintViolation",
  INTERNAL_ERROR: "internalError",
  VALIDATION_ERROR: "validationError",
};

const MESSAGE_CODE_MAP: Record<string, keyof SaasAdminTranslations["apiErrors"]> = {
  "Owner member was not found for this organization.": "ownerNotFound",
  "Active owner member was not found for this organization.": "ownerNotFound",
  "Owner username is already taken.": "ownerUsernameTaken",
  "Owner password is required when creating login credentials.": "ownerPasswordRequired",
  "Owner username is required when setting credentials.": "ownerUsernameRequired",
  "Member was not found for this organization.": "memberNotFound",
  "Subscription was not found for this organization.": "subscriptionNotFound",
  "At least one field must be provided to update.": "noChanges",
  "At least one owner field must be provided to update.": "noChanges",
  "Invalid owner phone number.": "invalidOwnerPhone",
  "Organization was not found.": "organizationNotFound",
  "One or more storeIds are invalid for this organization.": "invalidStoreIds",
  "Account provisioning failed because required records were not available yet.": "provisionDependencyMissing",
  "An unexpected server error occurred.": "internalError",
};

function readFieldError(payload: ApiErrorPayload): string | undefined {
  const fieldErrors = payload?.error?.details?.fieldErrors;
  if (fieldErrors && typeof fieldErrors === "object") {
    const messages = Object.values(fieldErrors).flatMap((items) => items ?? []);
    if (messages.length) return messages[0];
  }
  const formErrors = payload?.error?.details?.formErrors;
  if (Array.isArray(formErrors) && formErrors.length) {
    return formErrors[0];
  }
  return undefined;
}

export function createSaasAdminApiError(payload: ApiErrorPayload, status: number): SaasAdminApiError {
  const fieldError = readFieldError(payload);
  const base = payload.error || {};
  return new SaasAdminApiError(
    {
      ...base,
      message: fieldError || base.message,
    },
    status,
  );
}

export function mapSaasAdminApiError(error: SaasAdminApiError | Error, t: SaasAdminTranslations): string {
  if (error instanceof SaasAdminApiError) {
    const codeKey = ERROR_CODE_MAP[error.code];
    if (codeKey) return t.apiErrors[codeKey];
    const messageKey = MESSAGE_CODE_MAP[error.message];
    if (messageKey) return t.apiErrors[messageKey];
    if (error.causeText && error.code === "INTERNAL_ERROR") {
      return `${t.apiErrors.internalError} (${error.causeText})`;
    }
    return error.message;
  }

  const messageKey = MESSAGE_CODE_MAP[error.message];
  return messageKey ? t.apiErrors[messageKey] : error.message;
}

export function mapSaasAdminApiErrorDetails(error: SaasAdminApiError, t: SaasAdminTranslations): {
  message: string;
  cause?: string;
  code: string;
} {
  const details = error.details as {
    conflictingOrganizationName?: string | null;
    conflictingOrganizationStatus?: string | null;
  } | undefined;

  let cause = error.causeText ? mapSaasAdminApiErrorCause(error.causeText, t) : undefined;
  if (error.code === "OWNER_PHONE_TAKEN" && details?.conflictingOrganizationName) {
    cause = `${t.apiErrors.ownerPhoneTakenCause} (${details.conflictingOrganizationName})`;
    if (details.conflictingOrganizationStatus === "archived") {
      cause = `${cause}. ${t.apiErrors.ownerPhoneTakenArchivedHint}`;
    }
  }

  return {
    code: error.code,
    message: mapSaasAdminApiError(error, t),
    cause,
  };
}

export type SaasAdminFormError = {
  message: string;
  cause?: string;
  code: string;
};

export function resolveSaasAdminFormError(
  error: unknown,
  t: SaasAdminTranslations,
  fallback: string,
): SaasAdminFormError {
  if (error instanceof SaasAdminApiError) {
    return {
      ...mapSaasAdminApiErrorDetails(error, t),
    };
  }
  if (error instanceof Error) {
    return {
      code: "UNKNOWN",
      message: mapSaasAdminApiError(error, t),
    };
  }
  return {
    code: "UNKNOWN",
    message: fallback,
  };
}

function mapSaasAdminApiErrorCause(cause: string, t: SaasAdminTranslations): string {
  if (cause.includes("auth_identities already contains this username")) {
    return t.apiErrors.ownerUsernameTakenCause;
  }
  if (cause.includes("auth_identities already contains this login phone")) {
    return t.apiErrors.ownerPhoneTakenCause;
  }
  if (cause.includes("auth_identities already contains this login phone")) {
    return t.apiErrors.employeePhoneTakenCause;
  }
  if (cause.includes("outside the active transaction")) {
    return t.apiErrors.provisionDependencyMissingCause;
  }
  if (cause.includes("PostgreSQL rejected the write")) {
    return t.apiErrors.databaseConstraintViolationCause;
  }
  return cause;
}
