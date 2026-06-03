import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "egmvtcnpawdajvqkzzpr.supabase.co",
      },
    ],
  },
};

export default nextConfig;
