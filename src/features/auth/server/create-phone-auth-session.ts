import { z } from "zod";
import { normalizeLoginPhone } from "@/core/phone/normalize-login-phone";
import { UnauthorizedError, ValidationError } from "@/core/errors/app-error";
import { assertOrganizationEntitlement } from "@/features/billing/server/assert-organization-entitlement";
import {
  resolveEmployeeUserIdByLoginPhone,
  verifyEmployeePinIdentity,
  verifyOwnerLoginPhoneIdentity,
} from "@/features/auth/server/auth-identities";
import { parseTrustedDeviceCookieValue } from "@/features/trusted-devices/server/trusted-device-cookie";
import { isTrustedDeviceActive } from "@/features/trusted-devices/server/trusted-device-repository";
type PhoneLoginInput = {
  mode: "owner_phone_password" | "employee_phone_pin";
  phone?: string;
  password?: string;
  pin?: string;
  trustDevice?: boolean;
  trustedDeviceCookie?: string | null;
};

export type PhoneAuthSessionResult = {
  organizationId: string;
  userId: string;
  role: "owner" | "manager" | "employee";
  displayName: string;
  mustChangePassword: boolean;
  trustedDevice?: { deviceId: string; secret: string } | null;
};

function normalize(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function createPhoneAuthSession(
  input: PhoneLoginInput,
  resolveMembership: (userId: string, role: "owner" | "employee") => Promise<{
    organizationId: string;
    userId: string;
    role: "owner" | "manager" | "employee";
    displayName: string;
    mustChangePassword: boolean;
  }>,
): Promise<PhoneAuthSessionResult> {
  const phone = normalizeLoginPhone(normalize(input.phone));
  if (!phone) {
    throw new ValidationError("phone is required.");
  }

  if (input.mode === "owner_phone_password") {
    const password = normalize(input.password);
    if (!password) {
      throw new ValidationError("password is required.");
    }

    const verified = await verifyOwnerLoginPhoneIdentity(phone, password);
    if (!verified) {
      throw new UnauthorizedError("Invalid credentials.");
    }

    const session = await resolveMembership(verified.userId, "owner");
    await assertOrganizationEntitlement(session.organizationId, "use_app");

    return {
      ...session,
      mustChangePassword: verified.mustChangePassword,
      trustedDevice: null,
    };
  }

  const userId = await resolveEmployeeUserIdByLoginPhone(phone);
  if (!userId) {
    throw new UnauthorizedError("Invalid employee credentials.");
  }

  const session = await resolveMembership(userId, "employee");
  await assertOrganizationEntitlement(session.organizationId, "use_app");

  const trustedClaims = parseTrustedDeviceCookieValue(input.trustedDeviceCookie);
  if (
    trustedClaims
    && trustedClaims.userId === userId
    && await isTrustedDeviceActive({
      userId,
      deviceId: trustedClaims.deviceId,
      secret: trustedClaims.secret,
    })
  ) {
    return { ...session, trustedDevice: null };
  }

  const pin = normalize(input.pin);
  if (!pin) {
    throw new ValidationError("pin is required on untrusted devices.");
  }

  const verified = await verifyEmployeePinIdentity(userId, pin);
  if (!verified) {
    throw new UnauthorizedError("Invalid employee pin.");
  }

  if (input.trustDevice) {
    const { registerTrustedDevice } = await import("@/features/trusted-devices/server/trusted-device-repository");
    const registered = await registerTrustedDevice({ userId });
    return {
      ...session,
      trustedDevice: { deviceId: registered.deviceId, secret: registered.secret },
    };
  }

  return { ...session, trustedDevice: null };
}

export const phoneLoginInputSchema = z.object({
  mode: z.enum(["owner_phone_password", "employee_phone_pin"]),
  phone: z.string().optional(),
  password: z.string().optional(),
  pin: z.string().optional(),
  trustDevice: z.boolean().optional(),
});
