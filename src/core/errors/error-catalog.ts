import { ERROR_CODES, type ErrorCode } from "@/core/errors/error-codes";

export type ErrorCatalogEntry = {
  code: ErrorCode;
  title: string;
  message: string;
  cause: string;
  status: number;
  type: string;
};

const ERROR_TYPE_BASE = "https://taqfeelah.com/errors";

export const ERROR_CATALOG: Record<ErrorCode, ErrorCatalogEntry> = {
  [ERROR_CODES.VALIDATION_ERROR]: {
    code: ERROR_CODES.VALIDATION_ERROR,
    title: "Validation failed",
    message: "One or more fields are invalid.",
    cause: "Request input failed server-side validation.",
    status: 400,
    type: `${ERROR_TYPE_BASE}/validation-error`,
  },
  [ERROR_CODES.UNAUTHORIZED]: {
    code: ERROR_CODES.UNAUTHORIZED,
    title: "Unauthorized",
    message: "Authentication is required.",
    cause: "No valid session was found for this request.",
    status: 401,
    type: `${ERROR_TYPE_BASE}/unauthorized`,
  },
  [ERROR_CODES.FORBIDDEN]: {
    code: ERROR_CODES.FORBIDDEN,
    title: "Forbidden",
    message: "You do not have permission to perform this action.",
    cause: "The authenticated user lacks the required role or scope.",
    status: 403,
    type: `${ERROR_TYPE_BASE}/forbidden`,
  },
  [ERROR_CODES.NOT_FOUND]: {
    code: ERROR_CODES.NOT_FOUND,
    title: "Not found",
    message: "The requested resource was not found.",
    cause: "The target record does not exist or is not visible to this actor.",
    status: 404,
    type: `${ERROR_TYPE_BASE}/not-found`,
  },
  [ERROR_CODES.CONFLICT]: {
    code: ERROR_CODES.CONFLICT,
    title: "Conflict",
    message: "The request conflicts with existing data.",
    cause: "A unique or state constraint prevented the write.",
    status: 409,
    type: `${ERROR_TYPE_BASE}/conflict`,
  },
  [ERROR_CODES.SERVICE_UNAVAILABLE]: {
    code: ERROR_CODES.SERVICE_UNAVAILABLE,
    title: "Service unavailable",
    message: "This feature is temporarily unavailable.",
    cause: "A required feature flag or dependency is disabled.",
    status: 503,
    type: `${ERROR_TYPE_BASE}/service-unavailable`,
  },
  [ERROR_CODES.INTERNAL_ERROR]: {
    code: ERROR_CODES.INTERNAL_ERROR,
    title: "Internal server error",
    message: "An unexpected server error occurred.",
    cause: "An unhandled exception occurred while processing the request.",
    status: 500,
    type: `${ERROR_TYPE_BASE}/internal-error`,
  },
  [ERROR_CODES.OWNER_USERNAME_TAKEN]: {
    code: ERROR_CODES.OWNER_USERNAME_TAKEN,
    title: "Owner username taken",
    message: "Owner username is already taken.",
    cause: "auth_identities already contains this username for provider username_password.",
    status: 409,
    type: `${ERROR_TYPE_BASE}/owner-username-taken`,
  },
  [ERROR_CODES.OWNER_PHONE_TAKEN]: {
    code: ERROR_CODES.OWNER_PHONE_TAKEN,
    title: "Owner phone taken",
    message: "Owner login phone is already assigned to another account.",
    cause: "auth_identities already contains this login phone for provider username_password.",
    status: 409,
    type: `${ERROR_TYPE_BASE}/owner-phone-taken`,
  },
  [ERROR_CODES.ORGANIZATION_NOT_FOUND]: {
    code: ERROR_CODES.ORGANIZATION_NOT_FOUND,
    title: "Organization not found",
    message: "Organization was not found.",
    cause: "No organization row exists for the supplied organizationId.",
    status: 404,
    type: `${ERROR_TYPE_BASE}/organization-not-found`,
  },
  [ERROR_CODES.MEMBER_NOT_FOUND]: {
    code: ERROR_CODES.MEMBER_NOT_FOUND,
    title: "Member not found",
    message: "Member was not found for this organization.",
    cause: "No organization_members row matches the supplied member in this organization.",
    status: 404,
    type: `${ERROR_TYPE_BASE}/member-not-found`,
  },
  [ERROR_CODES.SUBSCRIPTION_NOT_FOUND]: {
    code: ERROR_CODES.SUBSCRIPTION_NOT_FOUND,
    title: "Subscription not found",
    message: "Subscription was not found for this organization.",
    cause: "No subscriptions row exists for the supplied organizationId.",
    status: 404,
    type: `${ERROR_TYPE_BASE}/subscription-not-found`,
  },
  [ERROR_CODES.INVALID_STORE_IDS]: {
    code: ERROR_CODES.INVALID_STORE_IDS,
    title: "Invalid store selection",
    message: "One or more storeIds are invalid for this organization.",
    cause: "At least one storeId does not belong to the target organization.",
    status: 400,
    type: `${ERROR_TYPE_BASE}/invalid-store-ids`,
  },
  [ERROR_CODES.STORE_NOT_FOUND]: {
    code: ERROR_CODES.STORE_NOT_FOUND,
    title: "Store not found",
    message: "Store was not found for this organization.",
    cause: "No stores row matches the supplied storeId in this organization.",
    status: 404,
    type: `${ERROR_TYPE_BASE}/store-not-found`,
  },
  [ERROR_CODES.PROVISION_DEPENDENCY_MISSING]: {
    code: ERROR_CODES.PROVISION_DEPENDENCY_MISSING,
    title: "Provisioning dependency missing",
    message: "Account provisioning failed because required records were not available yet.",
    cause: "A provisioning step referenced organization/store rows outside the active transaction.",
    status: 409,
    type: `${ERROR_TYPE_BASE}/provision-dependency-missing`,
  },
  [ERROR_CODES.DATABASE_CONSTRAINT_VIOLATION]: {
    code: ERROR_CODES.DATABASE_CONSTRAINT_VIOLATION,
    title: "Database constraint violation",
    message: "The request could not be completed because of conflicting data.",
    cause: "PostgreSQL rejected the write due to a constraint violation.",
    status: 409,
    type: `${ERROR_TYPE_BASE}/database-constraint-violation`,
  },
};

export function getErrorCatalogEntry(code: string): ErrorCatalogEntry | undefined {
  return ERROR_CATALOG[code as ErrorCode];
}
