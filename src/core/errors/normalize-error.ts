import { AppError, ValidationError } from "@/core/errors/app-error";
import { ERROR_CODES } from "@/core/errors/error-codes";
import { ERROR_CATALOG, getErrorCatalogEntry } from "@/core/errors/error-catalog";

type PostgresLikeError = {
  code?: string;
  constraint?: string;
  detail?: string;
  message?: string;
};

const MESSAGE_CODE_MAP: Record<string, string> = {
  "Owner username is already taken.": ERROR_CODES.OWNER_USERNAME_TAKEN,
  "Organization was not found.": ERROR_CODES.ORGANIZATION_NOT_FOUND,
  "Owner member was not found for this organization.": ERROR_CODES.MEMBER_NOT_FOUND,
  "Active owner member was not found for this organization.": ERROR_CODES.MEMBER_NOT_FOUND,
  "Member was not found for this organization.": ERROR_CODES.MEMBER_NOT_FOUND,
  "Subscription was not found for this organization.": ERROR_CODES.SUBSCRIPTION_NOT_FOUND,
  "One or more storeIds are invalid for this organization.": ERROR_CODES.INVALID_STORE_IDS,
  "Store was not found for this organization.": ERROR_CODES.STORE_NOT_FOUND,
  "One or more selected stores are not active.": ERROR_CODES.INVALID_STORE_IDS,
  "Active owner was not found for this organization.": ERROR_CODES.MEMBER_NOT_FOUND,
  "Active store was not found for this organization.": ERROR_CODES.PROVISION_DEPENDENCY_MISSING,
};

function isPostgresLikeError(error: unknown): error is PostgresLikeError {
  return (
    typeof error === "object"
    && error !== null
    && "code" in error
    && typeof (error as PostgresLikeError).code === "string"
  );
}

function mapPostgresError(error: PostgresLikeError): AppError | null {
  switch (error.code) {
    case "23505": {
      if (error.constraint === "auth_identities_username_password_uq") {
        return catalogAppError(ERROR_CODES.OWNER_USERNAME_TAKEN);
      }
      return catalogAppError(ERROR_CODES.DATABASE_CONSTRAINT_VIOLATION, {
        cause: error.detail || error.message,
      });
    }
    case "23503":
      return catalogAppError(ERROR_CODES.PROVISION_DEPENDENCY_MISSING, {
        cause: error.detail || error.message,
      });
    case "23502":
      return new ValidationError("A required field is missing.", {
        postgresCode: error.code,
        detail: error.detail,
      });
    case "22P02":
      return new ValidationError("One or more identifiers are invalid.", {
        postgresCode: error.code,
        detail: error.detail,
      });
    default:
      return null;
  }
}

function mapMessageToCode(message: string): string | undefined {
  return MESSAGE_CODE_MAP[message];
}

export function catalogAppError(
  code: string,
  overrides?: {
    message?: string;
    cause?: string;
    details?: unknown;
  },
): AppError {
  const entry = getErrorCatalogEntry(code);
  if (!entry) {
    return new AppError(
      code,
      overrides?.message || "Request failed.",
      400,
      overrides?.details,
      overrides?.cause,
    );
  }

  return new AppError(
    entry.code,
    overrides?.message || entry.message,
    entry.status,
    overrides?.details,
    overrides?.cause || entry.cause,
  );
}

export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    const mappedCode = mapMessageToCode(error.message);
    if (mappedCode && mappedCode !== error.code) {
      const entry = getErrorCatalogEntry(mappedCode);
      return new AppError(
        mappedCode,
        error.message,
        entry?.status ?? error.status,
        error.details,
        entry?.cause,
      );
    }
    if (!getErrorCatalogEntry(error.code)) {
      return error;
    }
    const entry = getErrorCatalogEntry(error.code)!;
    return new AppError(
      error.code,
      error.message || entry.message,
      error.status || entry.status,
      error.details,
      error.causeHint || entry.cause,
    );
  }

  if (isPostgresLikeError(error)) {
    const mapped = mapPostgresError(error);
    if (mapped) return mapped;
  }

  if (error instanceof Error) {
    const mappedCode = mapMessageToCode(error.message);
    if (mappedCode) {
      return catalogAppError(mappedCode, { message: error.message });
    }
  }

  return catalogAppError(ERROR_CODES.INTERNAL_ERROR);
}

export function getPublicErrorPayload(error: AppError) {
  const entry = getErrorCatalogEntry(error.code) || ERROR_CATALOG[ERROR_CODES.INTERNAL_ERROR];
  return {
    type: entry.type,
    code: error.code,
    title: entry.title,
    message: error.message || entry.message,
    cause: error.causeHint || entry.cause,
    details: error.details,
  };
}
