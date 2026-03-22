import type { NextConfig } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") ?? "localhost:3000";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: Array.from(new Set(["localhost:3000", appUrl])),
    },
  },
};

export default nextConfig;
