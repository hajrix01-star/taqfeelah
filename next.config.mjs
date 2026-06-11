import { spawnSync } from "node:child_process";
import withSerwistInit from "@serwist/next";
import { buildAllowedDevOrigins } from "./scripts/lan-hosts.mjs";

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ||
  `build-${Date.now()}`;

const withSerwist = withSerwistInit({
  additionalPrecacheEntries: [
    { url: "/~offline", revision },
    { url: "/app", revision },
  ],
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

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

export default withSerwist(nextConfig);
