import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/mship",
  async redirects() {
    return [];
  },
};

export default nextConfig;
