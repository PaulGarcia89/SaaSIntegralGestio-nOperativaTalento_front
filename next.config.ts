import type { NextConfig } from "next";

const staticHosting = process.env.FLUENTOPS_STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  ...(staticHosting ? { output: "export" as const } : {}),
  allowedDevOrigins: (process.env.ALLOWED_DEV_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  images: {
    unoptimized: staticHosting,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
