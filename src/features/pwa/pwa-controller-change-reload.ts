/**
 * Reload only when an existing controller is replaced (SW update),
 * not on the first controller assignment during initial SW install.
 */
export function shouldReloadAfterServiceWorkerControllerChange(
  hadControllerAtSubscription: boolean,
): boolean {
  return hadControllerAtSubscription;
}
