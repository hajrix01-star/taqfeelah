type RegisterDashboardTabsEnv = {
  NEXT_PUBLIC_REGISTER_INDEX_TABS?: string;
};

/**
 * Notebook index tabs on the register dashboard card (report / closeouts / operations).
 *
 * Rollback: set NEXT_PUBLIC_REGISTER_INDEX_TABS=false and rebuild/redeploy.
 * Legacy segmented control remains in code behind this flag.
 */
export function isRegisterIndexTabsEnabled(
  env: RegisterDashboardTabsEnv = process.env as RegisterDashboardTabsEnv,
): boolean {
  const raw = env.NEXT_PUBLIC_REGISTER_INDEX_TABS;
  if (raw === "false") return false;
  return true;
}
