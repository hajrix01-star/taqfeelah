export type AccountSetupPurpose = "onboarding" | "password_reset";

export type AccountSetupTokenPreview = {
  purpose: AccountSetupPurpose;
  phoneNumber: string;
  ownerName: string | null;
  ownerEmail: string | null;
  organizationName: string;
  expiresAt: string;
};
