import { buildAllowedDevOrigins } from "./scripts/lan-hosts.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: buildAllowedDevOrigins(),
  async headers() {
    return [
      {
        source: "/app",
        headers: [{ key: "Cache-Control", value: "no-store, no-cache, must-revalidate" }],
      },
      {
        source: "/prototype-runtime",
        headers: [{ key: "Cache-Control", value: "no-store, no-cache, must-revalidate" }],
      },
      {
        source: "/",
        headers: [{ key: "Cache-Control", value: "no-store, no-cache, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
