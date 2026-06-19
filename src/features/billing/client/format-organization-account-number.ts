/**
 * Formats the public numeric organization account number for display and support.
 */
export function formatOrganizationAccountNumber(
  accountNumber: number | null | undefined,
): string {
  if (typeof accountNumber !== "number" || !Number.isInteger(accountNumber) || accountNumber <= 0) {
    return "";
  }
  return String(accountNumber);
}
