export type OwnerAccountSummary = {
  ownerUserId: string;
  ownerName: string;
  organizationId: string;
  accountNumber: number;
  organizationName: string;
  email: string | null;
  loginPhone: string | null;
  loginPhoneDisplay: string;
  loginMethod: "phone_password";
};
