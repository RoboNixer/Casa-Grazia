import type { NextConfig } from "next";

/** Dev phone / LAN — hostname only (no port), Next `allowedDevOrigins`. Override: `NEXT_ALLOWED_DEV_HOSTS=ip1,ip2`. */
const LAN_HOSTS =
  process.env.NEXT_ALLOWED_DEV_HOSTS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) ?? ["192.168.178.71", "172.20.10.2"];

/** `Origin` from the browser uses `hostname:port` for non‑default ports — must whitelist both. */
const port = process.env.PORT ?? "3000";

/** When `Origin` ≠ `Host` (e.g. `x-forwarded-host`), CSRF rejects unless Origin matches here. */
const serverActionAllowedOrigins = [
  "localhost",
  `localhost:${port}`,
  "127.0.0.1",
  `127.0.0.1:${port}`,
  "*.local",
  ...LAN_HOSTS.flatMap((h) => [h, `${h}:${port}`]),
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost", "127.0.0.1", ...LAN_HOSTS],
  experimental: {
    serverActions: {
      allowedOrigins: serverActionAllowedOrigins,
    },
  },
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
