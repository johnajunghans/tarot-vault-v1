import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
  // allowedDevOrigins: ['192.168.1.106'],
  // reactStrictMode: false
};

export default nextConfig;
