import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for testing on a physical phone via local network.
  // Without this, Next.js can block dev resources for 172.20.10.2 and
  // client JS/hydration becomes unreliable (page appears but taps do nothing).
  allowedDevOrigins: ['172.20.10.2'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
