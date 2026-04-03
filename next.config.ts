import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["micro-keyboards-current-warranties.trycloudflare.com"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ddragon.leagueoflegends.com",
      },
    ],
  },
};

export default nextConfig;
