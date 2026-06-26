import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import withSerwistInit from "@serwist/next";
import { buildAllowedDevOrigins } from "./scripts/lan-hosts.mjs";

const configDir = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(readFileSync(join(configDir, "package.json"), "utf8"));
const releaseVersion = String(packageJson.version || "0.0.0");
const releaseMajor = releaseVersion.split(".")[0]?.trim() || "0";
const releaseLabel =
  process.env.RELEASE_LABEL?.trim() ||
  process.env.NEXT_PUBLIC_RELEASE_LABEL?.trim() ||
  `V${releaseMajor}`;

const revision =
  process.env.RELEASE_BUILD?.trim() ||
  process.env.NEXT_PUBLIC_RELEASE_BUILD?.trim() ||
  process.env.GITHUB_SHA?.trim() ||
  process.env.DEPLOY_COMMIT?.trim() ||
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ||
  `build-${Date.now()}`;

const releaseEnv = {
  RELEASE_VERSION: releaseVersion,
  RELEASE_LABEL: releaseLabel,
  RELEASE_BUILD: revision,
  NEXT_PUBLIC_RELEASE_VERSION: releaseVersion,
  NEXT_PUBLIC_RELEASE_LABEL: releaseLabel,
  NEXT_PUBLIC_RELEASE_BUILD: revision,
};

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
  env: releaseEnv,
  allowedDevOrigins: buildAllowedDevOrigins(),
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
  async headers() {
    const securityHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(self), microphone=(), geolocation=(), payment=()",
      },
    ];

    if (process.env.NODE_ENV === "production") {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    // CSP with per-request nonce is applied in src/middleware.ts (batch 4).

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/app",
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
