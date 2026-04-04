import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["sites-figure-citizenship-duo.trycloudflare.com"],
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
