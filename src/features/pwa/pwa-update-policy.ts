import { isReleaseUpdateAvailable } from "@/release/check-update-available";

export type PwaUpdateSignals = {
  clientBuild: string;
  serverBuild: string | null | undefined;
  hasWaitingServiceWorker: boolean;
  dismissedServerBuild: string | null;
};

/**
 * Show the update banner only when there is a real, activatable SW update
 * and the server build is ahead of the running client bundle.
 */
export function shouldShowPwaUpdatePrompt({
  clientBuild,
  serverBuild,
  hasWaitingServiceWorker,
  dismissedServerBuild,
}: PwaUpdateSignals): boolean {
  if (!hasWaitingServiceWorker) return false;
  if (!isReleaseUpdateAvailable(clientBuild, serverBuild)) return false;
  if (dismissedServerBuild && dismissedServerBuild === serverBuild) return false;
  return true;
}
