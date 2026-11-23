import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Bundle firebase-admin (normally loaded with plain Node `require`). Its auth code pulls in
  // jwks-rsa → jose v6, which is ES-module only and can't be `require`d on some hosting runtimes
  // (ERR_REQUIRE_ESM on Vercel). Bundling resolves those modules at build time instead.
  transpilePackages: ["firebase-admin"],
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
