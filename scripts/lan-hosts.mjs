import os from "os";

/** @returns {string[]} IPv4 addresses reachable on the LAN (no loopback / link-local). */
export function localLanIpv4Addresses() {
  /** @type {string[]} */
  const hosts = [];
  for (const interfaces of Object.values(os.networkInterfaces())) {
    for (const net of interfaces ?? []) {
      if (net.family !== "IPv4" || net.internal) continue;
      if (net.address.startsWith("169.254.")) continue;
      // Hyper-V / virtual switches — not reachable from a phone on Wi‑Fi
      if (net.address.startsWith("172.31.")) continue;
      hosts.push(net.address);
    }
  }
  return hosts;
}

/**
 * Origins allowed to load `/_next/*` in dev when opened from phone/tablet on Wi‑Fi.
 * @param {number} [port]
 */
export function buildAllowedDevOrigins(port = Number(process.env.PORT) || 3000) {
  const origins = new Set([
    "192.168.*",
    "10.*",
    "172.16.*",
    "172.17.*",
    "172.18.*",
    "172.19.*",
    "172.20.*",
    "172.21.*",
    "172.22.*",
    "172.23.*",
    "172.24.*",
    "172.25.*",
    "172.26.*",
    "172.27.*",
    "172.28.*",
    "172.29.*",
    "172.30.*",
    "172.31.*",
    "0.0.0.0",
  ]);

  for (const address of localLanIpv4Addresses()) {
    origins.add(address);
    origins.add(`${address}:${port}`);
  }

  return [...origins];
}

/** @param {number} [port] */
export function buildLanPageUrls(port = Number(process.env.PORT) || 3000, path = "/app", cacheBust = "") {
  const query = cacheBust ? `?b=${encodeURIComponent(cacheBust)}` : "";
  const pagePath = `${path}${query}`;
  return localLanIpv4Addresses().map((address) => `http://${address}:${port}${pagePath}`);
}
