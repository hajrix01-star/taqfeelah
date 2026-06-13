export type ServiceWorkerRegistrationSnapshot = {
  hasWaitingServiceWorker: boolean;
};

export async function readServiceWorkerRegistrationSnapshot(): Promise<ServiceWorkerRegistrationSnapshot> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return { hasWaitingServiceWorker: false };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return { hasWaitingServiceWorker: Boolean(registration?.waiting) };
  } catch {
    return { hasWaitingServiceWorker: false };
  }
}

export async function requestServiceWorkerUpdateCheck(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    await registration?.update();
  } catch {
    // Best-effort only; update prompts still rely on install/waiting events.
  }
}

export async function activateWaitingServiceWorker(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  const registration = await navigator.serviceWorker.getRegistration();
  registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
}

export function subscribeToServiceWorkerUpdates(onWaitingWorker: () => void): () => void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return () => {};
  }

  let disposed = false;
  const registrations = new Set<ServiceWorkerRegistration>();

  const handleInstallingState = (worker: ServiceWorker | null) => {
    if (!worker) return;
    worker.addEventListener("statechange", () => {
      if (worker.state === "installed" && navigator.serviceWorker.controller) {
        onWaitingWorker();
      }
    });
  };

  const trackRegistration = (registration: ServiceWorkerRegistration) => {
    if (registrations.has(registration)) return;
    registrations.add(registration);

    if (registration.waiting) {
      onWaitingWorker();
    }

    registration.addEventListener("updatefound", () => {
      handleInstallingState(registration.installing);
    });

    handleInstallingState(registration.installing);
  };

  void navigator.serviceWorker.getRegistration().then((registration) => {
    if (disposed || !registration) return;
    trackRegistration(registration);
  });

  const onControllerChange = () => {
    void navigator.serviceWorker.getRegistration().then((registration) => {
      if (disposed || !registration) return;
      trackRegistration(registration);
      if (registration.waiting) onWaitingWorker();
    });
  };

  navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

  return () => {
    disposed = true;
    navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  };
}
