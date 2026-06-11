export function isReleaseUpdateAvailable(
  clientBuild: string,
  serverBuild: string | null | undefined,
): boolean {
  if (!serverBuild || !clientBuild) return false;
  if (serverBuild === "dev" || clientBuild === "dev") return false;
  return serverBuild !== clientBuild;
}
