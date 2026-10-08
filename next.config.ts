import type { NextConfig } from "next";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:8080";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${BACKEND_URL}/api/auth/:path*`,
      },
      {
        source: "/api/analytics/:path*",
        destination: `${BACKEND_URL}/api/analytics/:path*`,
      },
      {
        source: "/api/files/:path*",
        destination: `${BACKEND_URL}/api/files/:path*`,
      },
    ];
  },
};

export default nextConfig;
