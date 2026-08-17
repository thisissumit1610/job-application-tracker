import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @libsql/client resolves a platform-specific .node binary at runtime.
  // Bundling it would break that lookup, so Next.js must require it from
  // node_modules instead.
  serverExternalPackages: ["@libsql/client"],
};

export default nextConfig;
