import { isReleaseUpdateAvailable } from "@/release/check-update-available";

export type PwaUpdateSignals = {
  clientBuild: string;
  serverBuild: string | null | undefined;
  hasWaitingServiceWorker: boolean;
  dismissedServerBuild: string | null;
};

export type PwaStaleClientRecoverySignals = {
  clientBuild: string;
  serverBuild: string | null | undefined;
  hasWaitingServiceWorker: boolean;
  attemptedRecoveryBuild: string | null;
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

/**
 * A stale client can miss the normal waiting-worker prompt when an older
 * service worker keeps controlling the page. Recover once per server build by
 * unregistering the stale worker and reloading from the network.
 */
export function shouldRecoverStalePwaClient({
  clientBuild,
  serverBuild,
  hasWaitingServiceWorker,
  attemptedRecoveryBuild,
}: PwaStaleClientRecoverySignals): boolean {
  if (hasWaitingServiceWorker) return false;
  if (!isReleaseUpdateAvailable(clientBuild, serverBuild)) return false;
  if (attemptedRecoveryBuild && attemptedRecoveryBuild === serverBuild) return false;
  return true;
}
